import { pgTable, text, serial, integer, boolean, timestamp, numeric, time } from "drizzle-orm/pg-core";
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
  latitude: numeric("latitude").notNull(),
  longitude: numeric("longitude").notNull(),
});

export const doctors = pgTable("doctors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  specialty: text("specialty").notNull(),
});

// Many-to-many relationship between doctors and clinics
export const doctorClinics = pgTable("doctor_clinics", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctor_id").notNull().references(() => doctors.id),
  clinicId: integer("clinic_id").notNull().references(() => clinics.id),
  isAvailable: boolean("is_available").notNull().default(false),
  hasArrived: boolean("has_arrived").notNull().default(false),
  currentToken: integer("current_token").default(0),
});

// Doctor's consulting hours at each clinic
export const consultingHours = pgTable("consulting_hours", {
  id: serial("id").primaryKey(),
  doctorClinicId: integer("doctor_clinic_id").notNull().references(() => doctorClinics.id),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 (Sunday-Saturday)
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  maxPatients: integer("max_patients").notNull(),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => users.id),
  doctorClinicId: integer("doctor_clinic_id").notNull().references(() => doctorClinics.id),
  tokenNumber: integer("token_number").notNull(),
  appointmentTime: timestamp("appointment_time").notNull(),
  status: text("status", { 
    enum: ["scheduled", "in_progress", "completed", "cancelled"] 
  }).notNull().default("scheduled"),
});

export const insertUserSchema = createInsertSchema(users);
export const insertClinicSchema = createInsertSchema(clinics);
export const insertDoctorSchema = createInsertSchema(doctors);
export const insertDoctorClinicSchema = createInsertSchema(doctorClinics);
export const insertConsultingHoursSchema = createInsertSchema(consultingHours);
export const insertAppointmentSchema = createInsertSchema(appointments);

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Clinic = typeof clinics.$inferSelect;
export type Doctor = typeof doctors.$inferSelect;
export type DoctorClinic = typeof doctorClinics.$inferSelect;
export type ConsultingHours = typeof consultingHours.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;