import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["patient", "clinic_staff", "attendant"] }).notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
});

export const clinics = pgTable("clinics", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  phone: text("phone").notNull(),
  specialties: text("specialties").array().notNull(),
});

export const doctors = pgTable("doctors", {
  id: serial("id").primaryKey(),
  clinicId: integer("clinic_id").notNull(),
  name: text("name").notNull(),
  specialty: text("specialty").notNull(),
  isAvailable: boolean("is_available").notNull().default(false),
  hasArrived: boolean("has_arrived").notNull().default(false),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  doctorId: integer("doctor_id").notNull(),
  clinicId: integer("clinic_id").notNull(),
  tokenNumber: integer("token_number").notNull(),
  appointmentTime: timestamp("appointment_time").notNull(),
  status: text("status", { 
    enum: ["scheduled", "in_progress", "completed", "cancelled"] 
  }).notNull().default("scheduled"),
});

export const insertUserSchema = createInsertSchema(users);
export const insertClinicSchema = createInsertSchema(clinics);
export const insertDoctorSchema = createInsertSchema(doctors);
export const insertAppointmentSchema = createInsertSchema(appointments);

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Clinic = typeof clinics.$inferSelect;
export type Doctor = typeof doctors.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
