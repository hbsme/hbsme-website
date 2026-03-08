import { createServerFn } from '@tanstack/react-start'

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

// ─── Main server function ─────────────────────────────────────────────────────

export const submitInscription = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => data as InscriptionPayload)
  .handler(async (ctx) => {
    const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib')
    const PINK = rgb(0.85, 0.2, 0.4)
    const DARK = rgb(0.15, 0.15, 0.15)
    const GRAY = rgb(0.5, 0.5, 0.5)
    // biome-ignore lint/suspicious/noExplicitAny: pdf-lib types
    async function drawTablePage(pdfDoc: any, title: string, rows: [string, string][], font: any, boldFont: any) {
      const page = pdfDoc.addPage([595, 842])
      const { width, height } = page.getSize()
      let y = height - MARGIN
      page.drawText(title, { x: MARGIN, y, size: 16, font: boldFont, color: PINK })
      y -= LINE_HEIGHT * 1.5
      page.drawLine({ start: { x: MARGIN, y }, end: { x: width - MARGIN, y }, thickness: 1, color: PINK })
      y -= LINE_HEIGHT
      const VALUE_X = MARGIN + 180
      const VALUE_MAX_W = 595 - MARGIN - VALUE_X // ~315px
      for (const [label, value] of rows) {
        if (y < MARGIN + LINE_HEIGHT * 2) break
        // Wrap value (handles newlines + long strings)
        const valLines: string[] = []
        for (const part of (value || '-').split('\n')) {
          const words = part.split(' ')
          let cur = ''
          for (const w of words) {
            const test = cur ? `${cur} ${w}` : w
            if (font.widthOfTextAtSize(test, 10) > VALUE_MAX_W && cur) {
              valLines.push(cur); cur = w
            } else { cur = test }
          }
          valLines.push(cur || '')
        }
        page.drawText(label + ' :', { x: MARGIN, y, size: 10, font: boldFont, color: GRAY })
        for (let i = 0; i < valLines.length; i++) {
          if (i === 0) {
            page.drawText(valLines[0] || '-', { x: VALUE_X, y, size: 10, font, color: DARK })
          } else {
            y -= LINE_HEIGHT
            if (y < MARGIN + LINE_HEIGHT) break
            page.drawText(valLines[i], { x: VALUE_X, y, size: 10, font, color: DARK })
          }
        }
        y -= LINE_HEIGHT
      }
      return page
    }
    const fs = await import('node:fs')
    const path = await import('node:path')
    const { licencie, parent1, parent2, autorisation, signatureDataUrl } = ctx.data

    // Build filename
    const annee = licencie.dateNaissance.split('/')[2] || new Date().getFullYear().toString()
    const ts = Date.now()
    const filename = `${annee}_${licencie.nom}_${licencie.prenom}_${ts}`
      .replace(/[^a-zA-Z0-9_-]/g, '_')

    const PDF_DIR = '/home/hbsme/inscription/data/pdf'

    // Ensure dirs exist
    fs.default.mkdirSync(PDF_DIR, { recursive: true })

    // ── Generate PDF ──────────────────────────────────────────────────────────
    const pdfDoc = await PDFDocument.create()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // Helper : wrap text to fit maxWidth (returns array of lines)
    function wrapWords(text: string, f: typeof font, size: number, maxW: number): string[] {
      if (!text || !text.trim()) return ['']
      const result: string[] = []
      for (const para of text.split('\n')) {
        if (!para.trim()) { result.push(''); continue }
        const words = para.split(' ')
        let cur = ''
        for (const w of words) {
          const test = cur ? `${cur} ${w}` : w
          if (f.widthOfTextAtSize(test, size) > maxW && cur) {
            result.push(cur); cur = w
          } else { cur = test }
        }
        if (cur) result.push(cur)
      }
      return result
    }

    // Page 1 : Licencié
    await drawTablePage(pdfDoc, 'HBSME inscription : info licencié', [
      ['nom du licencié', licencie.nom],
      ['prénom du licencié', licencie.prenom],
      ['sexe du licencié', licencie.sexe === 'M' ? 'm' : 'f'],
      ['date de naissance', licencie.dateNaissance],
      ['lieu de naissance', licencie.lieuNaissance],
      ['adresse', licencie.adresse],
      ['téléphone mobile', licencie.telPortable],
      ['téléphone fixe', licencie.telDomicile],
      ['email', licencie.email],
      ['numéro de sécurité sociale', licencie.numSecu],
    ], font, boldFont)

    // Page 2 : Parent 1 (toujours présente, même si majeur)
    await drawTablePage(pdfDoc, 'HBSME inscription : parent 1', [
      ['nom du parent 1', parent1.nom],
      ['prénom du parent 1', parent1.prenom],
      ['travail du parent 1', parent1.profession],
      ['adresse du parent 1', parent1.adresse],
      ['téléphone fixe du parent 1', parent1.telFixe],
      ['téléphone portable du parent 1', parent1.telPortable],
      ['téléphone au travail du parent 1', parent1.telTravail],
      ['email du parent 1', parent1.email],
    ], font, boldFont)

    // Page 3 : Parent 2 (toujours présente)
    await drawTablePage(pdfDoc, 'HBSME inscription : parent 2', [
      ['nom du parent 2', parent2.nom],
      ['prénom du parent 2', parent2.prenom],
      ['travail du parent 2', parent2.profession],
      ['adresse du parent 2', parent2.adresse],
      ['téléphone fixe du parent 2', parent2.telFixe],
      ['téléphone portable du parent 2', parent2.telPortable],
      ['téléphone au travail du parent 2', parent2.telTravail],
      ['email du parent 2', parent2.email],
    ], font, boldFont)

    // Pages Charte : texte complet, multi-page si nécessaire
    const CHARTE_LINES = [
      "Vous avez choisi de participer par votre inscription ou par celle de votre enfant aux activités du club HANDBALL SAINT MEDARD D'EYRANS.",
      "",
      "Le club HANDBALL SAINT MEDARD D'EYRANS est en premier lieu une association, c'est-à-dire la réunion de personnes poursuivant un même objectif et s'unissant pour l'atteindre. L'adhésion est un acte volontaire qui implique un engagement à participer et à apporter son concours au fonctionnement et au développement de l'association. L'association de handball est gérée par une équipe de bénévoles qui ne demande qu'à être renforcée.",
      "",
      "Ne soyez pas que des consommateurs ! Soyez indulgents !",
      "",
      "1. JOUEUR",
      "",
      "1.1 L'ESPRIT SPORTIF",
      "- Je respecte les règles du jeu.",
      "- J'accepte toutes les décisions de l'arbitre sans jamais mettre en doute son intégrité.",
      "- Je démontre un esprit d'équipe par une collaboration franche avec les coéquipiers et les entraîneurs.",
      "- J'aide les coéquipiers qui présentent plus de difficultés.",
      "- Je refuse de gagner par des moyens illégaux et par tricherie.",
      "- J'accepte les erreurs de mes coéquipiers.",
      "",
      "1.2. LE RESPECT",
      "- Je considère un adversaire sportif comme indispensable pour jouer et non comme un ennemi.",
      "- J'agis en tout temps avec courtoisie envers les entraîneurs, les officiels, les coéquipiers, les adversaires et les spectateurs.",
      "- J'utilise un langage précis sans injure.",
      "- Je suis ponctuel(le) aux entrainements et matches.",
      "- Je m'entraine dans une tenue adaptée.",
      "- Je préviens le responsable en cas d'absence ou de maladie.",
      "- Je suis motivé(e) et participe activement et avec assiduité aux entrainements.",
      "- Je poursuis mon engagement envers mes coéquipiers, mon entraîneur et mon équipe jusqu'au bout.",
      "- Je respecte le matériel du club, les gardiens des gymnases et les équipements municipaux mis à disposition par notre ville et lors des déplacements.",
      "",
      "1.3. LA DIGNITÉ",
      "- Je conserve en tout temps mon sang-froid et la maîtrise de mes gestes face aux autres participants.",
      "- J'accepte la victoire avec modestie sans ridiculiser l'adversaire.",
      "- J'accepte la défaite en étant satisfait(e) de l'effort accompli dans les limites de mes capacités.",
      "- J'accepte la défaite en reconnaissant également le bon travail accompli par l'adversaire.",
      "",
      "1.4. LE PLAISIR",
      "- Je joue pour m'amuser.",
      "- Je considère la victoire et la défaite comme une conséquence du plaisir de jouer.",
      "- Je considère le dépassement personnel plus important que l'obtention d'une médaille ou d'un trophée.",
      "",
      "1.5. L'HONNEUR",
      "- Je me représente d'abord en tant qu'être humain.",
      "- Je suis loyal dans le sport et dans la vie.",
      "- Je représente aussi mon équipe, mon association sportive et ma ville.",
      "- Je véhicule les valeurs de mon sport par chacun de mes comportements.",
      "- Je suis l'ambassadeur des valeurs du handball.",
      "",
      "2. LES PARENTS",
      "",
      "- Inscrire un enfant à une activité ne signifie pas se dégager de toute responsabilité. Les enfants ne dépendent des entraîneurs que pour la durée de leur séance. Assurez-vous de la présence de l'entraîneur à l'arrivée de l'enfant.",
      "- Nous vous demandons de répondre favorablement aux convocations données par l'entraîneur de votre enfant. Prévenez l'entraîneur en cas d'absence à un match.",
      "- Afin d'organiser au mieux les déplacements lors des matchs à l'extérieur, nous comptons sur votre participation pour accompagner les joueurs.",
      "- Le lavage du jeu de maillots sera également assuré à tour de rôle par les familles.",
      "- En cas de problème, n'hésitez pas à contacter l'entraîneur ou un membre du bureau.",
      "",
      "3. L'ENTRAINEUR",
      "",
      "- Il permet aux joueurs de pratiquer le handball dans un esprit sportif, en respectant les équipiers, les adversaires, les arbitres et les responsables du club.",
      "- Il donne à chaque joueur le calendrier des matchs, le listing des joueurs avec les numéros de téléphone.",
      "- Il rencontre les parents, les met en relation, les réunit au minimum une fois en début de saison (présentation de chacun, remise des calendriers de matchs, organisation des déplacements, des lavages de maillots...).",
      "- A tout moment, il doit encourager les joueurs à prendre des initiatives en arbitrage et en encadrement. Il doit les sensibiliser à l'importance du rôle de chacun dans la vie du club.",
      "",
      "[X] Accepte la charte du club Handball Saint-Médard d'Eyrans",
    ]

    const TEXT_SIZE = 10
    const TEXT_MAX_W = 495 // 595 - 2*MARGIN
    const MIN_Y = MARGIN + LINE_HEIGHT * 2

    // Expand charte lines with word-wrap
    const expandedCharte: string[] = []
    for (const line of CHARTE_LINES) {
      const wrapped = wrapWords(line, font, TEXT_SIZE, TEXT_MAX_W)
      for (const wl of wrapped) expandedCharte.push(wl)
    }

    // Draw charte over one or more pages
    let chartePage = pdfDoc.addPage([595, 842])
    let charteY = chartePage.getSize().height - MARGIN
    chartePage.drawText('HBSME charte du club', { x: MARGIN, y: charteY, size: 16, font: boldFont, color: PINK })
    charteY -= LINE_HEIGHT * 1.5
    chartePage.drawLine({ start: { x: MARGIN, y: charteY }, end: { x: 595 - MARGIN, y: charteY }, thickness: 1, color: PINK })
    charteY -= LINE_HEIGHT

    for (const line of expandedCharte) {
      if (charteY < MIN_Y) {
        chartePage = pdfDoc.addPage([595, 842])
        charteY = chartePage.getSize().height - MARGIN
        chartePage.drawText('HBSME charte du club (suite)', { x: MARGIN, y: charteY, size: 16, font: boldFont, color: PINK })
        charteY -= LINE_HEIGHT * 1.5
        chartePage.drawLine({ start: { x: MARGIN, y: charteY }, end: { x: 595 - MARGIN, y: charteY }, thickness: 1, color: PINK })
        charteY -= LINE_HEIGHT
      }
      if (!line.trim()) { charteY -= LINE_HEIGHT * 0.5; continue }
      chartePage.drawText(line.substring(0, 100), { x: MARGIN, y: charteY, size: TEXT_SIZE, font, color: DARK })
      charteY -= LINE_HEIGHT
    }

    // Dernière page : Autorisations + signature
    const page3 = pdfDoc.addPage([595, 842])
    const { width: w3, height: h3 } = page3.getSize()
    let y3 = h3 - MARGIN

    page3.drawText('HBSME inscription : autorisation', {
      x: MARGIN,
      y: y3,
      size: 16,
      font: boldFont,
      color: PINK,
    })
    y3 -= LINE_HEIGHT * 1.5
    page3.drawLine({ start: { x: MARGIN, y: y3 }, end: { x: w3 - MARGIN, y: y3 }, thickness: 1, color: PINK })
    y3 -= LINE_HEIGHT

    const AUTH_VALUE_X = MARGIN + 180
    const AUTH_VALUE_MAX_W = 595 - MARGIN - AUTH_VALUE_X
    for (const [label, value] of [
      ['Je soussigné(e), M., Mme.', autorisation.authName],
      ['représentant légal de', autorisation.authChild],
      ['catégorie', autorisation.authCat],
      ['allergies / contre-indications', autorisation.allergies],
    ] as [string, string][]) {
      const valLines = wrapWords(value || '-', font, 10, AUTH_VALUE_MAX_W)
      page3.drawText(label + ' :', { x: MARGIN, y: y3, size: 10, font: boldFont, color: GRAY })
      for (let i = 0; i < valLines.length; i++) {
        if (i === 0) {
          page3.drawText(valLines[0], { x: AUTH_VALUE_X, y: y3, size: 10, font, color: DARK })
        } else {
          y3 -= LINE_HEIGHT
          page3.drawText(valLines[i], { x: AUTH_VALUE_X, y: y3, size: 10, font, color: DARK })
        }
      }
      y3 -= LINE_HEIGHT
    }

    y3 -= LINE_HEIGHT / 2
    const AUTH_PARAGRAPHS = [
      "Autorise les entraineurs du HANDBALL SAINT MEDARD D'EYRANS ou les parents bénévoles à transporter mon enfant lors des compétitions sportives. Je déclare décharger le HANDBALL SAINT MEDARD D'EYRANS de toute responsabilité concernant le transport de mon enfant.",
      "Autorise le Club à prendre toutes les dispositions médicales, thérapeutiques ou chirurgicales nécessaires, y compris l'anesthésie, en cas d'accident au cours de l'activité pratiquée au HANDBALL SAINT MEDARD D'EYRANS.",
      "En fin d'hospitalisation, j'autorise mon fils / ma fille à partir avec le représentant du HANDBALL SAINT MEDARD D'EYRANS.",
    ]
    for (const para of AUTH_PARAGRAPHS) {
      const wrappedAuth = wrapWords(para, font, 9, TEXT_MAX_W)
      for (const wl of wrappedAuth) {
        page3.drawText(wl, { x: MARGIN, y: y3, size: 9, font, color: DARK })
        y3 -= LINE_HEIGHT * 0.95
      }
      y3 -= LINE_HEIGHT * 0.5
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

    // Signature
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
    const pdfPath = path.default.join(PDF_DIR, `${filename}.pdf`)
    fs.default.writeFileSync(pdfPath, pdfBytes)

    // Save to DB
    const { db } = await import('../db')
    const { inscription: inscriptionTable } = await import('../db/schema')
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()
    const saison = month >= 7
      ? `${year}/${String(year + 1)}`
      : `${String(year - 1)}/${year}`
    await db.insert(inscriptionTable).values({
      saison,
      pdfFilename: filename,
      nom: licencie.nom,
      prenom: licencie.prenom,
      sexe: licencie.sexe,
      mineur: licencie.mineur,
      dateNaissance: licencie.dateNaissance,
      lieuNaissance: licencie.lieuNaissance,
      adresse: licencie.adresse,
      telDomicile: licencie.telDomicile,
      telPortable: licencie.telPortable,
      email: licencie.email,
      numSecu: licencie.numSecu,
      parent1Nom: parent1.nom,
      parent1Prenom: parent1.prenom,
      parent1Profession: parent1.profession,
      parent1Adresse: parent1.adresse,
      parent1TelFixe: parent1.telFixe,
      parent1TelPortable: parent1.telPortable,
      parent1TelTravail: parent1.telTravail,
      parent1Email: parent1.email,
      parent2Nom: parent2.nom,
      parent2Prenom: parent2.prenom,
      parent2Profession: parent2.profession,
      parent2Adresse: parent2.adresse,
      parent2TelFixe: parent2.telFixe,
      parent2TelPortable: parent2.telPortable,
      parent2TelTravail: parent2.telTravail,
      parent2Email: parent2.email,
      authName: autorisation.authName,
      authChild: autorisation.authChild,
      authCat: autorisation.authCat,
      allergies: autorisation.allergies,
      droitImage: autorisation.droitImage,
      faitA: autorisation.faitA,
      faitLe: autorisation.faitLe,
    })

    // ── Telegram notification ──────────────────────────────────────────────────
    const BOT_TOKEN = '991040556:AAHWfiY-uSdYSeRSkij3dBaBRnpdu5rtyFo'
    const CHAT_ID = '-543770100'
    const tgMsg = [
      '🤾 Nouvelle inscription HBSME',
      '',
      `Nom : ${licencie.nom}`,
      `Prénom : ${licencie.prenom}`,
      `Date de naissance : ${licencie.dateNaissance}`,
      `Catégorie : ${autorisation.authCat || '-'}`,
      `Mineur : ${licencie.mineur ? 'Oui' : 'Non'}`,
    ].join('\n')

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
      const pdfUrl = `https://handball-saint-medard-deyrans.fr/inscription/data/pdf/${filename}.pdf`
      await fetch('https://mx.birdie-mail.com/api/v1/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer bm_e2fb047f06a84803b32e97ddeb16aeb7b926521ffd04493ab843743d855b3ef6',
        },
        body: JSON.stringify({
          from: 'no-reply@hbsme.fr',
          to: ['christophe.maillot@gmail.com'],
          subject: `Nouvelle inscription : ${licencie.prenom} ${licencie.nom}`,
          text: `Nouvelle inscription reçue.\n\nNom : ${licencie.nom}\nPrénom : ${licencie.prenom}\nDate de naissance : ${licencie.dateNaissance}\nCatégorie : ${autorisation.authCat || '-'}\n\nPDF : ${pdfUrl}`,
          html: `<p>Nouvelle inscription reçue.</p><ul><li><strong>Nom :</strong> ${licencie.nom}</li><li><strong>Prénom :</strong> ${licencie.prenom}</li><li><strong>Date de naissance :</strong> ${licencie.dateNaissance}</li><li><strong>Catégorie :</strong> ${autorisation.authCat || '-'}</li></ul><p><a href="${pdfUrl}" style="background:#e0325a;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">Télécharger le PDF</a></p>`,
        }),
      })
    } catch (err) {
      console.error('[HBSME] Email send error:', err)
    }

    return { success: true, filename }
  })
