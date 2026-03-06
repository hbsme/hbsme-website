import { pgTable, serial, varchar, integer, timestamp, date, boolean, text } from 'drizzle-orm/pg-core'

export const licencee = pgTable('licencee', {
  id: serial('id').primaryKey(),
  licenceeId: varchar('licenceeId', { length: 64 }).notNull().unique(),
  licenceeNumber: varchar('licenceeNumber', { length: 64 }).notNull().unique(),
  seazon: varchar('seazon', { length: 16 }).notNull(),
  birthname: varchar('birthname', { length: 255 }).notNull(),
  lastname: varchar('lastname', { length: 255 }).notNull(),
  firstname: varchar('firstname', { length: 255 }).notNull(),
  birthdate: date('birthdate').notNull(),
  status: varchar('status', { length: 32 }).notNull(),
  type: varchar('type', { length: 8 }).notNull(),
})

export const ffhbMatch = pgTable('ffhb_match', {
  id: serial('id').primaryKey(),
  matchId: integer('matchId').notNull().unique(),
  competitionId: integer('competitionId'),
  teamId: integer('teamId'),
  date: timestamp('date'),
  competition: varchar('competition', { length: 255 }).notNull(),
  team1: varchar('team1', { length: 255 }).notNull(),
  team2: varchar('team2', { length: 255 }).notNull(),
  score1: varchar('score1', { length: 16 }),
  score2: varchar('score2', { length: 16 }),
  logo1: varchar('logo1', { length: 255 }),
  logo2: varchar('logo2', { length: 255 }),
})

export const partenaire = pgTable('partenaire', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  url: text('url'),
  logo: text('logo').notNull(),
  sortOrder: integer('sort_order').default(0),
  active: boolean('active').default(true),
})

export const ffhbTeam = pgTable('ffhb_team', {
  id: serial('id').primaryKey(),
  teamId: integer('teamId').unique(),
  seazon: varchar('seazon', { length: 16 }).notNull(),
  url: varchar('url', { length: 255 }).notNull(),
  team: varchar('team', { length: 255 }).notNull(),
  competition: varchar('competition', { length: 255 }).notNull(),
  competitionId: integer('competitionId'),
  phase: varchar('phase', { length: 255 }).notNull(),
  poule: varchar('poule', { length: 255 }).notNull(),
  firstday: date('firstday'),
  score_place: integer('score_place'),
  score_point: integer('score_point'),
  score_joue: integer('score_joue'),
  score_gagne: integer('score_gagne'),
  score_nul: integer('score_nul'),
  score_perdu: integer('score_perdu'),
})

export const membreCa = pgTable('membre_ca', {
  id: serial('id').primaryKey(),
  nom: text('nom').notNull(),
  poste: text('poste').notNull(),
  photo: text('photo'),
  isTop: boolean('is_top').default(false),
  sortOrder: integer('sort_order').default(0),
  active: boolean('active').default(true),
})

export const inscription = pgTable('inscription', {
  id: serial('id').primaryKey(),
  saison: varchar('saison', { length: 9 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  pdfFilename: varchar('pdf_filename', { length: 255 }),
  // Licencié
  nom: varchar('nom', { length: 100 }),
  prenom: varchar('prenom', { length: 100 }),
  sexe: varchar('sexe', { length: 1 }),
  mineur: boolean('mineur'),
  dateNaissance: varchar('date_naissance', { length: 10 }),
  lieuNaissance: varchar('lieu_naissance', { length: 200 }),
  adresse: text('adresse'),
  telDomicile: varchar('tel_domicile', { length: 20 }),
  telPortable: varchar('tel_portable', { length: 20 }),
  email: varchar('email', { length: 200 }),
  numSecu: varchar('num_secu', { length: 30 }),
  // Parent 1
  parent1Nom: varchar('parent1_nom', { length: 100 }),
  parent1Prenom: varchar('parent1_prenom', { length: 100 }),
  parent1Profession: varchar('parent1_profession', { length: 100 }),
  parent1Adresse: text('parent1_adresse'),
  parent1TelFixe: varchar('parent1_tel_fixe', { length: 20 }),
  parent1TelPortable: varchar('parent1_tel_portable', { length: 20 }),
  parent1TelTravail: varchar('parent1_tel_travail', { length: 20 }),
  parent1Email: varchar('parent1_email', { length: 200 }),
  // Parent 2
  parent2Nom: varchar('parent2_nom', { length: 100 }),
  parent2Prenom: varchar('parent2_prenom', { length: 100 }),
  parent2Profession: varchar('parent2_profession', { length: 100 }),
  parent2Adresse: text('parent2_adresse'),
  parent2TelFixe: varchar('parent2_tel_fixe', { length: 20 }),
  parent2TelPortable: varchar('parent2_tel_portable', { length: 20 }),
  parent2TelTravail: varchar('parent2_tel_travail', { length: 20 }),
  parent2Email: varchar('parent2_email', { length: 200 }),
  // Autorisation
  authName: varchar('auth_name', { length: 200 }),
  authChild: varchar('auth_child', { length: 200 }),
  authCat: varchar('auth_cat', { length: 100 }),
  allergies: text('allergies'),
  droitImage: boolean('droit_image'),
  faitA: varchar('fait_a', { length: 200 }),
  faitLe: varchar('fait_le', { length: 10 }),
})
