import { boolean, integer, jsonb, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import type { AvatarPreset, Stroke, TimeSignature } from '../../../contract/api';

// Mirrors db/migration/*.sql, which is the source of truth for constraints and indexes.

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

export const pdfFile = pgTable('pdf_file', {
  sha256: text('sha256').primaryKey(),
  byteSize: integer('byte_size').notNull(),
  pageCount: integer('page_count').notNull(),
  hasThumbnail: boolean('has_thumbnail').notNull().default(false),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
});

export const score = pgTable('score', {
  id: uuid('id').primaryKey().defaultRandom(),
  spaceKey: text('space_key').notNull(),
  title: text('title').notNull(),
  composer: text('composer').notNull().default(''),
  bpm: integer('bpm').notNull().default(120),
  timeSignature: text('time_signature').$type<TimeSignature>().notNull().default('4/4'),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
  updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  lastOpenedAt: timestamptz('last_opened_at'),
});

export const part = pgTable('part', {
  id: uuid('id').primaryKey().defaultRandom(),
  scoreId: uuid('score_id').notNull().references(() => score.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  pdfSha256: text('pdf_sha256').notNull().references(() => pdfFile.sha256),
  position: integer('position').notNull(),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
});

export const partName = pgTable('part_name', {
  name: text('name').primaryKey(),
  position: integer('position').notNull(),
});

export const annotationPage = pgTable('annotation_page', {
  partId: uuid('part_id').notNull().references(() => part.id, { onDelete: 'cascade' }),
  pageNumber: integer('page_number').notNull(),
  strokes: jsonb('strokes').$type<Stroke[]>().notNull(),
  updatedAt: timestamptz('updated_at').notNull().defaultNow(),
}, table => [primaryKey({ columns: [table.partId, table.pageNumber] })]);

export const setlist = pgTable('setlist', {
  id: uuid('id').primaryKey().defaultRandom(),
  spaceKey: text('space_key').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
  updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  lastOpenedAt: timestamptz('last_opened_at'),
});

export const appUser = pgTable('app_user', {
  id: uuid('id').primaryKey().defaultRandom(),
  account: text('account').notNull(),
  passwordHash: text('password_hash').notNull(),
  sessionEpoch: integer('session_epoch').notNull().default(0),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
});

export const userAvatar = pgTable('user_avatar', {
  userId: text('user_id').primaryKey(),
  preset: text('preset').$type<AvatarPreset>(),
  imageSha256: text('image_sha256'),
});

export const setlistItem = pgTable('setlist_item', {
  setlistId: uuid('setlist_id').notNull().references(() => setlist.id, { onDelete: 'cascade' }),
  scoreId: uuid('score_id').notNull().references(() => score.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(),
}, table => [primaryKey({ columns: [table.setlistId, table.scoreId] })]);
