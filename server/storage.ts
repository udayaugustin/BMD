import { IStorage } from "./types";
import type { User, InsertUser, Clinic, Doctor, DoctorClinic, ConsultingHours, Appointment } from "@shared/schema";
import { users, clinics, doctors, doctorClinics, consultingHours, appointments } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { sql } from 'drizzle-orm';

const PostgresSessionStore = connectPg(session);

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  // Doctor methods
  async getDoctorsByClinic(clinicId: number) {
    const result = await db
      .select({
        doctor: doctors,
        doctorClinic: doctorClinics,
      })
      .from(doctors)
      .innerJoin(
        doctorClinics,
        and(
          eq(doctors.id, doctorClinics.doctorId),
          eq(doctorClinics.clinicId, clinicId)
        )
      );

    return result.map(({ doctor, doctorClinic }) => ({
      ...doctor,
      isAvailable: doctorClinic.isAvailable,
      hasArrived: doctorClinic.hasArrived,
    }));
  }

  async getDoctorClinics(doctorId: number) {
    const result = await db
      .select({
        doctorClinic: doctorClinics,
        clinic: clinics,
      })
      .from(doctorClinics)
      .innerJoin(clinics, eq(doctorClinics.clinicId, clinics.id))
      .where(eq(doctorClinics.doctorId, doctorId));

    return result.map(({ doctorClinic, clinic }) => ({
      ...doctorClinic,
      clinicName: clinic.name,
    }));
  }

  async getConsultingHours(doctorClinicId: number) {
    return await db
      .select()
      .from(consultingHours)
      .where(eq(consultingHours.doctorClinicId, doctorClinicId));
  }

  async getCurrentToken(doctorClinicId: number): Promise<number> {
    const [result] = await db
      .select({ currentToken: doctorClinics.currentToken })
      .from(doctorClinics)
      .where(eq(doctorClinics.id, doctorClinicId));
    return result?.currentToken || 0;
  }

  async updateDoctorStatus(doctorClinicId: number, isAvailable: boolean, hasArrived: boolean) {
    const [updated] = await db
      .update(doctorClinics)
      .set({ isAvailable, hasArrived })
      .where(eq(doctorClinics.id, doctorClinicId))
      .returning();
    if (!updated) throw new Error("Doctor clinic association not found");
    return updated;
  }

  async updateCurrentToken(doctorClinicId: number, tokenNumber: number) {
    const [updated] = await db
      .update(doctorClinics)
      .set({ currentToken: tokenNumber })
      .where(eq(doctorClinics.id, doctorClinicId))
      .returning();
    if (!updated) throw new Error("Doctor clinic association not found");
    return updated;
  }

  // Appointment methods
  async getAppointments(userId: number) {
    const result = await db
      .select({
        appointment: appointments,
        doctor: doctors,
        clinic: clinics,
        doctorClinic: doctorClinics,
      })
      .from(appointments)
      .innerJoin(
        doctorClinics,
        eq(appointments.doctorClinicId, doctorClinics.id)
      )
      .innerJoin(doctors, eq(doctorClinics.doctorId, doctors.id))
      .innerJoin(clinics, eq(doctorClinics.clinicId, clinics.id))
      .where(eq(appointments.patientId, userId));

    return result.map(({ appointment, doctor, clinic, doctorClinic }) => ({
      ...appointment,
      doctorName: doctor.name,
      clinicName: clinic.name,
      currentToken: doctorClinic.currentToken ?? 0, // Default to 0 if null
    }));
  }

  async createAppointment(appointment: Omit<Appointment, "id">) {
    // First check if the doctor_clinic exists and is available
    const [doctorClinic] = await db
      .select()
      .from(doctorClinics)
      .where(eq(doctorClinics.id, appointment.doctorClinicId));

    if (!doctorClinic) {
      throw new Error("Doctor not found at this clinic");
    }

    if (!doctorClinic.isAvailable) {
      throw new Error("Doctor is not available for appointments");
    }

    // Check if the time slot is within consulting hours
    const appointmentDate = typeof appointment.appointmentTime === 'string'
      ? new Date(appointment.appointmentTime)
      : appointment.appointmentTime;

    const dayOfWeek = appointmentDate.getDay();

    // Get consulting hours for the doctor on this day
    const [consultingHour] = await db
      .select()
      .from(consultingHours)
      .where(eq(consultingHours.doctorClinicId, appointment.doctorClinicId));

    if (!consultingHour) {
      throw new Error("No consulting hours found for this doctor");
    }

    // Format appointment time to HH:mm for comparison
    const timeStr = appointmentDate.toTimeString().slice(0, 5);

    if (timeStr < consultingHour.startTime || timeStr > consultingHour.endTime) {
      throw new Error(`Appointment time must be between ${consultingHour.startTime} and ${consultingHour.endTime}`);
    }

    // Check if we haven't exceeded max patients for the day
    const existingAppointments = await db
      .select()
      .from(appointments)
      .where(eq(appointments.doctorClinicId, appointment.doctorClinicId));

    if (existingAppointments.length >= consultingHour.maxPatients) {
      throw new Error("No more appointments available for this doctor today");
    }

    // Generate token number (current max token + 1)
    const [maxToken] = await db
      .select({ max: sql<number>`MAX(token_number)` })
      .from(appointments)
      .where(eq(appointments.doctorClinicId, appointment.doctorClinicId));

    const tokenNumber = (maxToken?.max || 0) + 1;

    // Create the appointment with the generated token
    const [newAppointment] = await db
      .insert(appointments)
      .values({
        ...appointment,
        tokenNumber,
        status: "scheduled"
      })
      .returning();

    return newAppointment;
  }

  async updateAppointmentStatus(id: number, status: Appointment["status"]) {
    const [updated] = await db
      .update(appointments)
      .set({ status })
      .where(eq(appointments.id, id))
      .returning();
    if (!updated) throw new Error("Appointment not found");
    return updated;
  }

  // Search functionality
  async searchDoctors(params: {
    latitude?: number;
    longitude?: number;
    maxDistance?: number;
    specialty?: string;
  }) {
    const result = await db
      .select({
        doctor: doctors,
        clinic: clinics,
        doctorClinic: doctorClinics,
      })
      .from(doctors)
      .innerJoin(doctorClinics, eq(doctors.id, doctorClinics.doctorId))
      .innerJoin(clinics, eq(doctorClinics.clinicId, clinics.id))
      .where(params.specialty ? eq(doctors.specialty, params.specialty) : undefined);

    return result
      .map(({ doctor, clinic, doctorClinic }) => {
        const distance = params.latitude && params.longitude
          ? calculateDistance(
            params.latitude,
            params.longitude,
            Number(clinic.latitude),
            Number(clinic.longitude)
          )
          : 0;

        return {
          ...doctor,
          distance,
          clinicName: clinic.name,
          isAvailable: doctorClinic.isAvailable,
          hasArrived: doctorClinic.hasArrived,
          currentToken: doctorClinic.currentToken ?? 0, // Default to 0 if null
        };
      })
      .filter(item => !params.maxDistance || item.distance <= params.maxDistance)
      .sort((a, b) => a.distance - b.distance);
  }
}

export const storage = new DatabaseStorage();