import { createFileRoute, Link } from '@tanstack/react-router'
import { useRef, useEffect, useState } from 'react'
import { submitInscription } from '../server/inscription'

export const Route = createFileRoute('/inscription')({
  head: () => ({
    meta: [
      { title: 'Inscription — HBSME' },
      { name: 'description', content: `Inscrivez-vous au club de handball de Saint-Médard d'Eyrans pour la saison 2025/2026. Formulaire en ligne pour tous les âges.` },
      { property: 'og:title', content: 'Inscription — HBSME' },
      { property: 'og:description', content: `Inscription au club de handball HBSME pour la saison 2025/2026.` },
      { property: 'og:url', content: 'https://handball-saint-medard-deyrans.fr/inscription' },
      { property: 'og:image', content: 'https://handball-saint-medard-deyrans.fr/logo-hbsme.png' },
      { property: 'og:type', content: 'website' },
      { property: 'og:locale', content: 'fr_FR' },
      { name: 'twitter:card', content: 'summary' },
    ],
    links: [{ rel: 'canonical', href: 'https://handball-saint-medard-deyrans.fr/inscription' }],
  }),
  component: InscriptionPage,
})

const CLUB_LOGO = '/logo-hbsme.png'

// ─── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden shadow-sm border border-gray-100">
      <div className="bg-pink-100 px-5 py-3 flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <h2 className="font-black text-pink-900 text-base">{title}</h2>
      </div>
      <div className="bg-white px-5 py-5">
        {children}
      </div>
    </div>
  )
}

// ─── Field helpers ─────────────────────────────────────────────────────────────

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold text-gray-600">
        {label}{required && <span className="text-pink-600 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600 mt-0.5 font-medium">⚠ {error}</p>}
    </div>
  )
}

const inputClass = "rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400 transition"
const textareaClass = `${inputClass} resize-y min-h-[80px]`

// ─── Parent form group ─────────────────────────────────────────────────────────

function ParentFields({ prefix, label, values, onChange }: {
  prefix: string
  label: string
  values: Record<string, string>
  onChange: (key: string, val: string) => void
}) {
  return (
    <div>
      <h3 className="font-bold text-gray-700 text-sm mb-3 mt-4 border-b pb-1 border-gray-100">{label}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nom">
          <input className={inputClass} value={values.nom || ''} onChange={e => onChange('nom', e.target.value)} />
        </Field>
        <Field label="Prénom">
          <input className={inputClass} value={values.prenom || ''} onChange={e => onChange('prenom', e.target.value)} />
        </Field>
        <Field label="Profession">
          <input className={inputClass} value={values.profession || ''} onChange={e => onChange('profession', e.target.value)} />
        </Field>
        <Field label="Email">
          <input type="email" className={inputClass} value={values.email || ''} onChange={e => onChange('email', e.target.value)} />
        </Field>
        <Field label="Adresse" >
          <textarea className={textareaClass} value={values.adresse || ''} onChange={e => onChange('adresse', e.target.value)} />
        </Field>
        <div className="flex flex-col gap-4">
          <Field label="Tél fixe">
            <input className={inputClass} value={values.telFixe || ''} onChange={e => onChange('telFixe', e.target.value)} />
          </Field>
          <Field label="Tél portable">
            <input className={inputClass} value={values.telPortable || ''} onChange={e => onChange('telPortable', e.target.value)} />
          </Field>
          <Field label="Tél travail">
            <input className={inputClass} value={values.telTravail || ''} onChange={e => onChange('telTravail', e.target.value)} />
          </Field>
        </div>
      </div>
    </div>
  )
}

// ─── Charte content (condensed) ───────────────────────────────────────────────

const CHARTE_TEXT = `Vous avez choisi de participer, par votre inscription ou celle de votre enfant, aux activités du club Handball Saint-Médard d'Eyrans.

Le club est en premier lieu une association, c'est-à-dire la réunion de personnes poursuivant un même objectif et s'unissant pour l'atteindre. L'adhésion est un acte volontaire qui implique un engagement à participer et à apporter son concours au fonctionnement et au développement de l'association.

Ne soyez pas que des consommateurs ! Soyez indulgents !

1. LE JOUEUR
• Esprit sportif : respecter les règles du jeu, accepter les décisions de l'arbitre, démontrer un esprit d'équipe.
• Respect : ponctualité, tenue adaptée, prévenir en cas d'absence, respecter le matériel du club.
• Dignité : garder son sang-froid, accepter victoire et défaite avec fair-play.
• Plaisir : jouer pour s'amuser, privilégier le dépassement personnel.
• Honneur : être loyal(e), représenter les valeurs du handball.

2. LES PARENTS
Inscrire un enfant ne signifie pas se dégager de toute responsabilité. Assurez-vous de la présence de l'entraîneur à l'arrivée. Prévenez l'entraîneur en cas d'absence. Participez aux déplacements et au lavage des maillots à tour de rôle.

3. L'ENTRAÎNEUR
Il permet aux joueurs de pratiquer le handball dans un esprit sportif, donne le calendrier des matchs, réunit les parents en début de saison et encourage les initiatives de chacun dans la vie du club.`

// ─── Main component ────────────────────────────────────────────────────────────

function InscriptionPage() {
  const [mineur, setMineur] = useState(false)
  const [charteAccepted, setCharteAccepted] = useState(false)
  const [droitImage, setDroitImage] = useState(false)

  const [licencie, setLicencie] = useState({
    nom: '', prenom: '', sexe: 'M' as 'M' | 'F', mineur: false,
    dateNaissance: '', lieuNaissance: '', adresse: '',
    telDomicile: '', telPortable: '', email: '', numSecu: '',
  })

  const [parent1, setParent1] = useState<Record<string, string>>({
    nom: '', prenom: '', profession: '', adresse: '',
    telFixe: '', telPortable: '', telTravail: '', email: '',
  })
  const [parent2, setParent2] = useState<Record<string, string>>({
    nom: '', prenom: '', profession: '', adresse: '',
    telFixe: '', telPortable: '', telTravail: '', email: '',
  })

  const [autorisation, setAutorisation] = useState({
    authName: '', authChild: '', authCat: '',
    allergies: '', faitA: "Saint-Médard d'Eyrans", faitLe: new Date().toISOString().split('T')[0],
  })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sigPadRef = useRef<unknown>(null)

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [resultFilename, setResultFilename] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // ── Init signature_pad + resize ──
  useEffect(() => {
    let pad: unknown = null
    let cancelled = false

    function resizeCanvas() {
      const canvas = canvasRef.current
      if (!canvas || !sigPadRef.current) return
      const ratio = Math.max(window.devicePixelRatio || 1, 1)
      const data = (sigPadRef.current as any).toData()
      canvas.width = canvas.offsetWidth * ratio
      canvas.height = canvas.offsetHeight * ratio
      canvas.getContext('2d')?.scale(ratio, ratio)
      ;(sigPadRef.current as any).fromData(data)
    }

    async function initPad() {
      if (!canvasRef.current) return
      const { default: SignaturePad } = await import('signature_pad')
      if (cancelled) return
      const canvas = canvasRef.current
      const ratio = Math.max(window.devicePixelRatio || 1, 1)
      canvas.width = canvas.offsetWidth * ratio
      canvas.height = canvas.offsetHeight * ratio
      canvas.getContext('2d')?.scale(ratio, ratio)
      pad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255,255,255)',
        penColor: 'rgb(30,30,30)',
      })
      sigPadRef.current = pad
    }

    initPad()
    window.addEventListener('resize', resizeCanvas)
    return () => {
      cancelled = true
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  // ── Clear canvas ──
  function clearSignature() {
    if (sigPadRef.current) {
      // biome-ignore lint/suspicious/noExplicitAny: dynamic import
      (sigPadRef.current as any).clear()
    }
  }

  // ── Validation ──
  function validate(): boolean {
    const errors: Record<string, string> = {}

    if (!licencie.nom.trim()) errors.nom = 'Le nom est obligatoire.'
    if (!licencie.prenom.trim()) errors.prenom = 'Le prénom est obligatoire.'
    if (!licencie.sexe) errors.sexe = 'Veuillez indiquer le sexe.'
    if (!licencie.dateNaissance) errors.dateNaissance = 'La date de naissance est obligatoire.'

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!licencie.email.trim()) {
      errors.email = "L'email est obligatoire."
    } else if (!emailRe.test(licencie.email)) {
      errors.email = "Format d'email invalide."
    }

    // Au moins un téléphone valide (10 chiffres, espaces tolérés)
    const cleanTel = (t: string) => t.replace(/[\s.\-]/g, '')
    const telRe = /^0[1-9]\d{8}$/
    const tel1 = cleanTel(licencie.telDomicile)
    const tel2 = cleanTel(licencie.telPortable)
    if (!tel1 && !tel2) {
      errors.telephone = 'Au moins un numéro de téléphone est obligatoire.'
    } else if (tel1 && !telRe.test(tel1)) {
      errors.telDomicile = 'Format invalide (10 chiffres attendus, ex: 0556123456).'
    } else if (tel2 && !telRe.test(tel2)) {
      errors.telPortable = 'Format invalide (10 chiffres attendus, ex: 0612345678).'
    }

    // Adresse : doit contenir un code postal (5 chiffres consécutifs ou avec espace)
    const cpRe = /\d{2}[ ]?\d{3}/
    if (!licencie.adresse.trim()) {
      errors.adresse = "L'adresse est obligatoire."
    } else if (!cpRe.test(licencie.adresse)) {
      errors.adresse = "L'adresse doit contenir un code postal (ex: 33650 ou 33 650)."
    }

    setFormErrors(errors)
    if (Object.keys(errors).length > 0) {
      // Scroll vers la première erreur
      setTimeout(() => {
        const el = document.querySelector('[data-error]')
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 50)
      return false
    }
    return true
  }

  // ── Submit ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    console.log('[inscription] handleSubmit called, charteAccepted:', charteAccepted)
    if (!validate()) return
    if (!charteAccepted) {
      alert('Vous devez accepter la charte du club.')
      return
    }

    // biome-ignore lint/suspicious/noExplicitAny: dynamic import
    const signatureDataUrl = sigPadRef.current ? (sigPadRef.current as any).toDataURL('image/png') : ''

    setStatus('submitting')
    try {
      console.log('[inscription] calling submitInscription...')
      const result = await submitInscription({
        data: {
          licencie: { ...licencie, mineur, sexe: licencie.sexe },
          parent1,
          parent2,
          autorisation: { ...autorisation, droitImage },
          signatureDataUrl,
        },
      })
      setResultFilename(result.filename)
      setStatus('success')
    } catch (err) {
      console.error('[inscription] error:', err)
      setErrorMsg(err instanceof Error ? err.message : String(err))
      setStatus('error')
    }
  }

  // ── Success screen ──
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-10 max-w-lg text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Inscription envoyée !</h1>
          <p className="text-gray-500 mb-4 text-sm leading-relaxed">
            Votre dossier d'inscription a bien été reçu. Vous recevrez une confirmation par email.
          </p>
          <p className="text-xs text-gray-400 mb-6 font-mono">{resultFilename}.pdf</p>
          <Link to="/" className="inline-block bg-pink-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-pink-800 transition">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    )
  }

  // ── Error screen ──
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-md border border-red-100 p-10 max-w-lg text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Une erreur est survenue</h1>
          <p className="text-sm text-red-500 mb-6">{errorMsg}</p>
          <button
            type="button"
            onClick={() => setStatus('idle')}
            className="inline-block bg-pink-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-pink-800 transition"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="max-w-3xl mx-auto px-4 pt-10 pb-20">

        {/* Titre */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-gray-900 mb-2">Inscription</h1>
          <p className="text-gray-500 text-sm">Handball Saint-Médard d'Eyrans — Saison {new Date().getFullYear()}/{new Date().getFullYear() + 1}</p>
          <div className="mt-3 w-16 h-1 bg-pink-600 rounded mx-auto" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Section 1 : Licencié ── */}
          <Section title="Informations licencié" icon="🏐">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nom" required error={formErrors.nom}>
                <input className={inputClass} value={licencie.nom} data-error={formErrors.nom ? 'true' : undefined}
                  onChange={e => { setLicencie(l => ({ ...l, nom: e.target.value })); setFormErrors(fe => ({ ...fe, nom: '' })) }} />
              </Field>
              <Field label="Prénom" required error={formErrors.prenom}>
                <input className={inputClass} value={licencie.prenom} data-error={formErrors.prenom ? 'true' : undefined}
                  onChange={e => { setLicencie(l => ({ ...l, prenom: e.target.value })); setFormErrors(fe => ({ ...fe, prenom: '' })) }} />
              </Field>

              <Field label="Sexe" required error={formErrors.sexe}>
                <div className="flex gap-6 items-center mt-1">
                  {(['M', 'F'] as const).map(s => (
                    <label key={s} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                      <input
                        type="radio" name="sexe" value={s}
                        checked={licencie.sexe === s}
                        onChange={() => { setLicencie(l => ({ ...l, sexe: s })); setFormErrors(fe => ({ ...fe, sexe: '' })) }}
                        className="accent-pink-600"
                      />
                      {s === 'M' ? 'Masculin' : 'Féminin'}
                    </label>
                  ))}
                </div>
              </Field>

              <Field label="Mineur ?">
                <label className="flex items-center gap-2 cursor-pointer mt-1 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={mineur}
                    onChange={e => {
                      setMineur(e.target.checked)
                      setLicencie(l => ({ ...l, mineur: e.target.checked }))
                    }}
                    className="accent-pink-600 w-4 h-4"
                  />
                  L'adhérent est mineur
                </label>
              </Field>

              <Field label="Date de naissance" required error={formErrors.dateNaissance}>
                <input
                  type="date" className={inputClass}
                  value={licencie.dateNaissance}
                  onChange={e => { setLicencie(l => ({ ...l, dateNaissance: e.target.value })); setFormErrors(fe => ({ ...fe, dateNaissance: '' })) }}
                />
              </Field>

              <Field label="Lieu de naissance">
                <input className={inputClass} value={licencie.lieuNaissance}
                  onChange={e => setLicencie(l => ({ ...l, lieuNaissance: e.target.value }))} />
              </Field>

              <Field label="Tél domicile" error={formErrors.telDomicile || formErrors.telephone}>
                <input type="tel" className={inputClass} value={licencie.telDomicile} placeholder="0556123456"
                  onChange={e => { setLicencie(l => ({ ...l, telDomicile: e.target.value })); setFormErrors(fe => ({ ...fe, telDomicile: '', telephone: '' })) }} />
              </Field>

              <Field label="Tél portable" error={formErrors.telPortable || (!formErrors.telDomicile ? formErrors.telephone : '')}>
                <input type="tel" className={inputClass} value={licencie.telPortable} placeholder="0612345678"
                  onChange={e => { setLicencie(l => ({ ...l, telPortable: e.target.value })); setFormErrors(fe => ({ ...fe, telPortable: '', telephone: '' })) }} />
              </Field>

              <Field label="Email" required error={formErrors.email}>
                <input type="email" className={inputClass} value={licencie.email}
                  onChange={e => { setLicencie(l => ({ ...l, email: e.target.value })); setFormErrors(fe => ({ ...fe, email: '' })) }} />
              </Field>

              <Field label="N° Sécurité Sociale">
                <input className={inputClass} value={licencie.numSecu}
                  onChange={e => setLicencie(l => ({ ...l, numSecu: e.target.value }))} />
              </Field>
            </div>

            <div className="mt-4">
              <Field label="Adresse (avec code postal)" required error={formErrors.adresse}>
                <textarea className={textareaClass} value={licencie.adresse} placeholder={"29 chemin du Cabernet\n33650 Saint-Médard d'Eyrans"}
                  onChange={e => { setLicencie(l => ({ ...l, adresse: e.target.value })); setFormErrors(fe => ({ ...fe, adresse: '' })) }} />
              </Field>
            </div>
          </Section>

          {/* ── Section 2 : Parents (si mineur) ── */}
          <div className={mineur ? 'block' : 'hidden'}>
            <Section title="Informations parents / représentants légaux" icon="👨‍👩‍👦">
              <ParentFields
                prefix="parent1"
                label="Parent / Tuteur 1"
                values={parent1}
                onChange={(k, v) => setParent1(p => ({ ...p, [k]: v }))}
              />
              <ParentFields
                prefix="parent2"
                label="Parent / Tuteur 2 (optionnel)"
                values={parent2}
                onChange={(k, v) => setParent2(p => ({ ...p, [k]: v }))}
              />
            </Section>
          </div>

          {/* ── Section 3 : Charte ── */}
          <Section title="Charte du club" icon="📋">
            <div className="max-h-64 overflow-y-auto bg-gray-50 rounded-lg border border-gray-100 p-4 text-xs text-gray-600 leading-relaxed whitespace-pre-wrap mb-4 font-mono">
              {CHARTE_TEXT}
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={charteAccepted}
                onChange={e => setCharteAccepted(e.target.checked)}
                className="accent-pink-600 w-4 h-4 mt-0.5 shrink-0"
              />
              <span className="text-sm text-gray-700">
                J'ai lu et j'accepte la charte du club Handball Saint-Médard d'Eyrans.{' '}
                <Link to="/charte" className="text-pink-600 hover:underline" target="_blank">Lire la charte complète ↗</Link>
              </span>
            </label>
          </Section>

          {/* ── Section 4 : Autorisations ── */}
          <Section title="Autorisations parentales" icon="✍️">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Je soussigné(e), M/Mme" required>
                <input className={inputClass} value={autorisation.authName}
                  onChange={e => setAutorisation(a => ({ ...a, authName: e.target.value }))} />
              </Field>
              <Field label="Représentant légal de">
                <input className={inputClass} value={autorisation.authChild}
                  onChange={e => setAutorisation(a => ({ ...a, authChild: e.target.value }))} />
              </Field>
              <Field label="Catégorie">
                <input className={inputClass} placeholder="ex: U13, U15, Seniors…" value={autorisation.authCat}
                  onChange={e => setAutorisation(a => ({ ...a, authCat: e.target.value }))} />
              </Field>
            </div>

            <div className="mt-5 space-y-3">
              <p className="text-sm font-bold text-gray-700">Autorisations accordées :</p>
              {[
                { id: 'transport', text: 'Autorise mon enfant à utiliser les transports en commun ou les véhicules personnels de bénévoles du club pour se rendre aux matchs et entraînements.' },
                { id: 'medical', text: 'Autorise les responsables du club à prendre toutes décisions médicales urgentes si je suis injoignable.' },
                { id: 'hospit', text: 'Autorise le médecin à procéder à une hospitalisation en cas de nécessité.' },
              ].map(({ id, text }) => (
                <div key={id} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <span className="text-pink-500 mt-0.5 shrink-0">✓</span>
                  <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <Field label="Allergies / Contre-indications médicales">
                <textarea
                  className={textareaClass}
                  placeholder="Aucune" value={autorisation.allergies}
                  onChange={e => setAutorisation(a => ({ ...a, allergies: e.target.value }))}
                />
              </Field>
            </div>

            <div className="mt-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={droitImage}
                  onChange={e => setDroitImage(e.target.checked)}
                  className="accent-pink-600 w-4 h-4 mt-0.5 shrink-0"
                />
                <span className="text-sm text-gray-700">
                  J'autorise le club à utiliser les photos et vidéos de mon enfant / de moi-même à des fins de communication (site web, réseaux sociaux, presse locale).
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Field label="Fait à">
                <input className={inputClass} placeholder="Saint-Médard d'Eyrans" value={autorisation.faitA}
                  onChange={e => setAutorisation(a => ({ ...a, faitA: e.target.value }))} />
              </Field>
              <Field label="Le">
                <input type="date" className={inputClass} value={autorisation.faitLe}
                  onChange={e => setAutorisation(a => ({ ...a, faitLe: e.target.value }))} />
              </Field>
            </div>
          </Section>

          {/* ── Section 5 : Signature ── */}
          <Section title="Signature" icon="🖊️">
            <p className="text-sm text-gray-500 mb-3">Signez dans le cadre ci-dessous :</p>
            <div className="border-2 border-dashed border-gray-200 rounded-xl overflow-hidden bg-white">
              <canvas
                ref={canvasRef}
                className="w-full touch-none block"
                style={{ height: '160px' }}
              />
            </div>
            <button
              type="button"
              onClick={clearSignature}
              className="mt-2 text-xs text-gray-400 hover:text-pink-600 transition-colors"
            >
              Effacer la signature
            </button>
          </Section>

          {/* ── Submit ── */}
          <div className="flex justify-center pt-2">
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="bg-pink-700 text-white font-black text-base px-10 py-3.5 rounded-xl hover:bg-pink-800 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {status === 'submitting' ? '⏳ Envoi en cours…' : 'Envoyer mon inscription →'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
