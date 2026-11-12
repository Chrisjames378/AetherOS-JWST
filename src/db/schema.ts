import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// 1. Users Table (Linked to Firebase Auth UID)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth String UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. Astronomy Observations Log Table
export const observations = pgTable('observations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  targetName: text('target_name').notNull(),
  targetId: text('target_id').notNull(),
  category: text('category').notNull(),
  notes: text('notes').notNull(),
  wavelengthBand: text('wavelength_band').default('Near-Infrared (NIRCam)'),
  snrRatio: text('snr_ratio').default('38.4 dB'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 3. User Custom Targets Table
export const customTargets = pgTable('custom_targets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  name: text('name').notNull(),
  raDeg: text('ra_deg').notNull(),
  decDeg: text('dec_deg').notNull(),
  distanceLy: text('distance_ly').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Table Relations
export const usersRelations = relations(users, ({ many }) => ({
  observations: many(observations),
  customTargets: many(customTargets),
}));

export const observationsRelations = relations(observations, ({ one }) => ({
  author: one(users, {
    fields: [observations.userId],
    references: [users.id],
  }),
}));

export const customTargetsRelations = relations(customTargets, ({ one }) => ({
  author: one(users, {
    fields: [customTargets.userId],
    references: [users.id],
  }),
}));
