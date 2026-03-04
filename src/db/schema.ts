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
