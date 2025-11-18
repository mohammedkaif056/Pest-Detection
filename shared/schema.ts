import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Pest Detection Record
export const detections = pgTable("detections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  imageUrl: text("image_url").notNull(),
  pestName: text("pest_name").notNull(),
  confidence: real("confidence").notNull(),
  riskLevel: text("risk_level").notNull(), // low, medium, high, critical
  detectedAt: timestamp("detected_at").defaultNow().notNull(),
  similarSpecies: jsonb("similar_species").$type<Array<{ name: string; confidence: number }>>(),
  treatments: jsonb("treatments").$type<Array<{ name: string; type: string; effectiveness: string }>>(),
  // Extended disease information
  plant: text("plant"),
  pathogenType: text("pathogen_type"),
  pathogenName: text("pathogen_name"),
  symptoms: jsonb("symptoms").$type<string[]>(),
  treatmentDetails: jsonb("treatment_details").$type<{
    immediate_actions?: string[];
    chemical_control?: string[];
    organic_control?: string[];
    cultural_practices?: string[];
    maintenance?: string[];
  }>(),
  prevention: jsonb("prevention").$type<string[]>(),
  prognosis: text("prognosis"),
  spreadRisk: text("spread_risk"),
});

export const insertDetectionSchema = createInsertSchema(detections).omit({
  id: true,
  detectedAt: true,
});

export type InsertDetection = z.infer<typeof insertDetectionSchema>;
export type Detection = typeof detections.$inferSelect;

// Pest Species Database
export const species = pgTable("species", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  scientificName: text("scientific_name").notNull(),
  category: text("category").notNull(), // insect, mite, larvae, etc.
  description: text("description").notNull(),
  riskLevel: text("risk_level").notNull(),
  commonCrops: jsonb("common_crops").$type<string[]>().notNull(),
  imageUrl: text("image_url"),
  taxonomy: jsonb("taxonomy").$type<{
    kingdom: string;
    phylum: string;
    class: string;
    order: string;
    family: string;
  }>(),
});

export const insertSpeciesSchema = createInsertSchema(species).omit({
  id: true,
});

export type InsertSpecies = z.infer<typeof insertSpeciesSchema>;
export type Species = typeof species.$inferSelect;

// Visual Prompt Prototypes (Few-Shot Learning)
export const prototypes = pgTable("prototypes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pestName: text("pest_name").notNull(),
  embedding: jsonb("embedding").$type<number[]>().notNull(), // simulated embedding vector
  supportImages: jsonb("support_images").$type<string[]>().notNull(), // URLs of 5-10 sample images
  learnedAt: timestamp("learned_at").defaultNow().notNull(),
  accuracy: real("accuracy"), // estimated accuracy from validation
  sampleCount: integer("sample_count").notNull(),
});

export const insertPrototypeSchema = createInsertSchema(prototypes).omit({
  id: true,
  learnedAt: true,
});

export type InsertPrototype = z.infer<typeof insertPrototypeSchema>;
export type Prototype = typeof prototypes.$inferSelect;

// Treatment Recommendations
export const treatments = pgTable("treatments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pestId: varchar("pest_id").references(() => species.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // chemical, biological, cultural, mechanical
  activeIngredient: text("active_ingredient"),
  applicationMethod: text("application_method").notNull(),
  effectiveness: text("effectiveness").notNull(), // high, medium, low
  ecoFriendly: integer("eco_friendly").notNull().default(0), // boolean as integer
  cost: text("cost"), // low, medium, high
  description: text("description").notNull(),
});

export const insertTreatmentSchema = createInsertSchema(treatments).omit({
  id: true,
});

export type InsertTreatment = z.infer<typeof insertTreatmentSchema>;
export type Treatment = typeof treatments.$inferSelect;

// User preferences (optional for future)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
