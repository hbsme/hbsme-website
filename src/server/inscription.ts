import { createServerFn } from '@tanstack/react-start'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fs from 'node:fs'
import path from 'node:path'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LicencieData {
  nom: string
  prenom: string
  sexe: 'M' | 'F'
  mineur: boolean
  dateNaissance: string
  lieuNaissance: string
  adresse: string
  telDomicile: string
  telPortable: string
  email: string
  numSecu: string
}

export interface ParentData {
  nom: string
  prenom: string
  profession: string
  adresse: string
  telFixe: string
  telPortable: string
  telTravail: string
  email: string
}

export interface AutorisationData {
  authName: string
  authChild: string
  authCat: string
  allergies: string
  droitImage: boolean
  faitA: string
  faitLe: string
}

export interface InscriptionPayload {
  licencie: LicencieData
  parent1: ParentData
  parent2: ParentData
  autorisation: AutorisationData
  signatureDataUrl: string
}

// ─── PDF helpers ──────────────────────────────────────────────────────────────

const MARGIN = 50
const LINE_HEIGHT = 18
const PINK = rgb(0.85, 0.2, 0.4)
const DARK = rgb(0.15, 0.15, 0.15)
const GRAY = rgb(0.5, 0.5, 0.5)

async function drawTablePage(
  pdfDoc: PDFDocument,
  title: string,
  rows: [string, string][],
  font: ReturnType<typeof Object>,
  boldFont: ReturnType<typeof Object>,
) {
  const page = pdfDoc.addPage([595, 842])
  const { width, height } = page.getSize()
  let y = height - MARGIN

  // Title
  page.drawText(title, {
    x: MARGIN,
    y,
    size: 16,
    font: boldFont as Parameters<typeof page.drawText>[1]['font'],
    color: PINK,
  })
  y -= LINE_HEIGHT * 1.5

  // Horizontal line
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: width - MARGIN, y },
    thickness: 1,
    color: PINK,
  })
  y -= LINE_HEIGHT

  for (const [label, value] of rows) {
    if (y < MARGIN + LINE_HEIGHT * 2) break

    // Label (gray)
    page.drawText(label + ' :', {
      x: MARGIN,
      y,
      size: 10,
      font: boldFont as Parameters<typeof page.drawText>[1]['font'],
      color: GRAY,
    })

    // Value (dark) — wrap long strings
    const maxLen = 80
    const displayVal = (value || '—').substring(0, maxLen)
    page.drawText(displayVal, {
      x: MARGIN + 180,
      y,
      size: 10,
      font: font as Parameters<typeof page.drawText>[1]['font'],
      color: DARK,
    })

    y -= LINE_HEIGHT
  }

  return page
}

// ─── Main server function ─────────────────────────────────────────────────────

export const submitInscription = createServerFn({ method: 'POST' })
  .validator((data: unknown) => data as InscriptionPayload)
  .handler(async ({ data }) => {
    const { licencie, parent1, parent2, autorisation, signatureDataUrl } = data

    // Build filename
    const annee = licencie.dateNaissance.split('/')[2] || new Date().getFullYear().toString()
    const ts = Date.now()
    const filename = `${annee}_${licencie.nom}_${licencie.prenom}_${ts}`
      .replace(/[^a-zA-Z0-9_-]/g, '_')

    const PDF_DIR = '/home/hbsme/inscription/data/pdf'
    const JSON_DIR = '/home/hbsme/inscription/data/json'

    // Ensure dirs exist
    fs.mkdirSync(PDF_DIR, { recursive: true })
    fs.mkdirSync(JSON_DIR, { recursive: true })

    // ── Generate PDF ──────────────────────────────────────────────────────────
    const pdfDoc = await PDFDocument.create()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // Page 1 : Licencié
    await drawTablePage(pdfDoc, 'HBSME Inscription : Info Licencié', [
      ['Nom', licencie.nom],
      ['Prénom', licencie.prenom],
      ['Sexe', licencie.sexe === 'M' ? 'Masculin' : 'Féminin'],
      ['Mineur', licencie.mineur ? 'Oui' : 'Non'],
      ['Date de naissance', licencie.dateNaissance],
      ['Lieu de naissance', licencie.lieuNaissance],
      ['Adresse', licencie.adresse],
      ['Tél domicile', licencie.telDomicile],
      ['Tél portable', licencie.telPortable],
      ['Email', licencie.email],
      ['N° Sécurité Sociale', licencie.numSecu],
    ], font, boldFont)

    // Page 2 : Parents (si mineur)
    if (licencie.mineur) {
      const page2 = pdfDoc.addPage([595, 842])
      const { width, height } = page2.getSize()
      let y = height - MARGIN

      page2.drawText('HBSME Inscription : Parent 1 & 2', {
        x: MARGIN,
        y,
        size: 16,
        font: boldFont,
        color: PINK,
      })
      y -= LINE_HEIGHT * 1.5
      page2.drawLine({ start: { x: MARGIN, y }, end: { x: width - MARGIN, y }, thickness: 1, color: PINK })
      y -= LINE_HEIGHT

      page2.drawText('Parent 1', { x: MARGIN, y, size: 13, font: boldFont, color: DARK })
      y -= LINE_HEIGHT

      for (const [label, value] of [
        ['Nom', parent1.nom],
        ['Prénom', parent1.prenom],
        ['Profession', parent1.profession],
        ['Adresse', parent1.adresse],
        ['Tél fixe', parent1.telFixe],
        ['Tél portable', parent1.telPortable],
        ['Tél travail', parent1.telTravail],
        ['Email', parent1.email],
      ] as [string, string][]) {
        page2.drawText(label + ' :', { x: MARGIN, y, size: 10, font: boldFont, color: GRAY })
        page2.drawText((value || '—').substring(0, 80), { x: MARGIN + 180, y, size: 10, font, color: DARK })
        y -= LINE_HEIGHT
      }

      y -= LINE_HEIGHT
      page2.drawText('Parent 2', { x: MARGIN, y, size: 13, font: boldFont, color: DARK })
      y -= LINE_HEIGHT

      for (const [label, value] of [
        ['Nom', parent2.nom],
        ['Prénom', parent2.prenom],
        ['Profession', parent2.profession],
        ['Adresse', parent2.adresse],
        ['Tél fixe', parent2.telFixe],
        ['Tél portable', parent2.telPortable],
        ['Tél travail', parent2.telTravail],
        ['Email', parent2.email],
      ] as [string, string][]) {
        page2.drawText(label + ' :', { x: MARGIN, y, size: 10, font: boldFont, color: GRAY })
        page2.drawText((value || '—').substring(0, 80), { x: MARGIN + 180, y, size: 10, font, color: DARK })
        y -= LINE_HEIGHT
      }
    }

    // Page 3 : Autorisations + signature
    const page3 = pdfDoc.addPage([595, 842])
    const { width: w3, height: h3 } = page3.getSize()
    let y3 = h3 - MARGIN

    page3.drawText('HBSME Inscription : Autorisations', {
      x: MARGIN,
      y: y3,
      size: 16,
      font: boldFont,
      color: PINK,
    })
    y3 -= LINE_HEIGHT * 1.5
    page3.drawLine({ start: { x: MARGIN, y: y3 }, end: { x: w3 - MARGIN, y: y3 }, thickness: 1, color: PINK })
    y3 -= LINE_HEIGHT

    for (const [label, value] of [
      ['Je soussigné(e)', autorisation.authName],
      ['Représentant légal de', autorisation.authChild],
      ['Catégorie', autorisation.authCat],
    ] as [string, string][]) {
      page3.drawText(label + ' :', { x: MARGIN, y: y3, size: 10, font: boldFont, color: GRAY })
      page3.drawText((value || '—').substring(0, 80), { x: MARGIN + 180, y: y3, size: 10, font, color: DARK })
      y3 -= LINE_HEIGHT
    }

    y3 -= LINE_HEIGHT / 2
    page3.drawText('Autorisations accordées :', { x: MARGIN, y: y3, size: 11, font: boldFont, color: DARK })
    y3 -= LINE_HEIGHT

    for (const txt of [
      '✓ Transport : autorisation d\'utiliser les transports en commun ou véhicules de bénévoles',
      '✓ Médical : autorisation d\'intervention médicale en cas d\'urgence',
      '✓ Hospitalisation : autorisation de fin d\'hospitalisation',
    ]) {
      page3.drawText(txt.substring(0, 85), { x: MARGIN, y: y3, size: 9, font, color: DARK })
      y3 -= LINE_HEIGHT
    }

    if (autorisation.allergies) {
      y3 -= LINE_HEIGHT / 2
      page3.drawText('Allergies / Contre-indications :', { x: MARGIN, y: y3, size: 10, font: boldFont, color: GRAY })
      y3 -= LINE_HEIGHT
      page3.drawText(autorisation.allergies.substring(0, 100), { x: MARGIN, y: y3, size: 9, font, color: DARK })
      y3 -= LINE_HEIGHT
    }

    y3 -= LINE_HEIGHT / 2
    page3.drawText(`Droit à l'image : ${autorisation.droitImage ? 'Accordé' : 'Refusé'}`, {
      x: MARGIN, y: y3, size: 10, font: boldFont, color: DARK,
    })
    y3 -= LINE_HEIGHT * 1.5

    page3.drawText(`Fait à ${autorisation.faitA}, le ${autorisation.faitLe}`, {
      x: MARGIN, y: y3, size: 10, font, color: DARK,
    })
    y3 -= LINE_HEIGHT * 2

    // Embed signature image
    if (signatureDataUrl && signatureDataUrl.startsWith('data:image/png;base64,')) {
      try {
        const base64 = signatureDataUrl.replace('data:image/png;base64,', '')
        const sigBytes = Buffer.from(base64, 'base64')
        const sigImage = await pdfDoc.embedPng(sigBytes)
        const { width: sigW, height: sigH } = sigImage.scale(0.5)
        const maxW = 200
        const scale = Math.min(1, maxW / sigW)
        page3.drawText('Signature :', { x: MARGIN, y: y3, size: 10, font: boldFont, color: GRAY })
        y3 -= LINE_HEIGHT
        page3.drawImage(sigImage, {
          x: MARGIN,
          y: y3 - sigH * scale,
          width: sigW * scale,
          height: sigH * scale,
        })
      } catch (_err) {
        page3.drawText('[Signature non disponible]', { x: MARGIN, y: y3, size: 9, font, color: GRAY })
      }
    }

    // Save PDF
    const pdfBytes = await pdfDoc.save()
    const pdfPath = path.join(PDF_DIR, `${filename}.pdf`)
    fs.writeFileSync(pdfPath, pdfBytes)

    // Save JSON
    const jsonPath = path.join(JSON_DIR, `${filename}.json`)
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2))

    // ── Telegram notification ──────────────────────────────────────────────────
    const BOT_TOKEN = '991040556:AAHWfiY-uSdYSeRSkij3dBaBRnpdu5rtyFo'
    const CHAT_ID = '-543770100'
    const pdfUrl = `https://hbsme.fr/inscription/data/pdf/${filename}.pdf`
    const tgMsg = `Nouveau fichier d'inscription : ${filename}.pdf\n${pdfUrl}`

    try {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text: tgMsg }),
      })
    } catch (_err) {
      // Non-fatal
    }

    // ── Email via Birdie Mail ──────────────────────────────────────────────────
    try {
      await fetch('https://mx.birdie-mail.com/api/v1/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer bm_e2fb047f06a84803b32e97ddeb16aeb7b926521ffd04493ab843743d855b3ef6',
        },
        body: JSON.stringify({
          from: 'no-reply@hbsme.fr',
          to: ['contacthbsme@gmail.com'],
          subject: `Nouvelle inscription : ${filename}.pdf`,
          text: `Une nouvelle inscription a été reçue.\n\nFichier : ${filename}.pdf\nLien : ${pdfUrl}`,
          html: `<p>Une nouvelle inscription a été reçue.</p><p>Fichier : <strong>${filename}.pdf</strong></p><p><a href="${pdfUrl}">Télécharger le PDF</a></p>`,
        }),
      })
    } catch (_err) {
      // Non-fatal
    }

    return { success: true, filename }
  })
