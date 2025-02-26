import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const doctors = pgTable("doctors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  specialty: text("specialty").notNull(),
  imageUrl: text("image_url").notNull(),
  experience: integer("experience").notNull(),
  available: boolean("available").default(true).notNull(),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientName: text("patient_name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  doctorId: integer("doctor_id").notNull(),
  tokenNumber: integer("token_number").notNull(),
  appointmentDate: timestamp("appointment_date").notNull(),
});

export const insertDoctorSchema = createInsertSchema(doctors).pick({
  name: true,
  specialty: true,
  imageUrl: true,
  experience: true,
  available: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).pick({
  patientName: true,
  phoneNumber: true,
  doctorId: true,
}).extend({
  patientName: z.string().min(2, "Name must be at least 2 characters"),
  phoneNumber: z.string().regex(/^\d{10}$/, "Please enter a valid 10-digit phone number"),
});

export type Doctor = typeof doctors.$inferSelect;
export type InsertDoctor = z.infer<typeof insertDoctorSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export const mockDoctors: InsertDoctor[] = [
  {
    name: "Dr. Sarah Johnson",
    specialty: "General Medicine",
    imageUrl: "https://images.unsplash.com/photo-1605684954998-685c79d6a018",
    experience: 10,
    available: true,
  },
  {
    name: "Dr. Michael Chen",
    specialty: "Cardiology",
    imageUrl: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7",
    experience: 15,
    available: true,
  },
  {
    name: "Dr. Emily Rodriguez",
    specialty: "Pediatrics",
    imageUrl: "https://images.unsplash.com/photo-1609188076864-c35269136b09",
    experience: 8,
    available: true,
  },
  {
    name: "Dr. James Wilson",
    specialty: "Orthopedics",
    imageUrl: "https://images.unsplash.com/photo-1499557354967-2b2d8910bcca",
    experience: 12,
    available: true,
  },
  {
    name: "Dr. Lisa Thompson",
    specialty: "Dermatology",
    imageUrl: "https://images.unsplash.com/photo-1597764690523-15bea4c581c9",
    experience: 9,
    available: true,
  },
  {
    name: "Dr. Robert Lee",
    specialty: "Neurology",
    imageUrl: "https://images.unsplash.com/photo-1612537786199-1c202c6dcfd2",
    experience: 20,
    available: true,
  }
];
