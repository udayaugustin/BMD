import { IStorage } from "./types";
import type { User, InsertUser, Clinic, Doctor, Appointment } from "@shared/schema";
import { users, clinics, doctors, appointments } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

// Helper function to calculate distance between two points using Haversine formula
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

  async searchDoctors(params: {
    latitude?: number;
    longitude?: number;
    maxDistance?: number;
    specialty?: string;
  }): Promise<(Doctor & { distance: number; clinicName: string })[]> {
    const doctorsWithClinics = await db
      .select({
        doctor: doctors,
        clinic: clinics,
      })
      .from(doctors)
      .innerJoin(clinics, eq(doctors.clinicId, clinics.id));

    return doctorsWithClinics
      .map(({ doctor, clinic }) => {
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
        };
      })
      .filter((item) => {
        if (params.maxDistance && item.distance > params.maxDistance) return false;
        if (params.specialty && item.specialty !== params.specialty) return false;
        return true;
      })
      .sort((a, b) => a.distance - b.distance);
  }

  async getDoctors(clinicId?: number): Promise<Doctor[]> {
    if (clinicId) {
      return await db.select().from(doctors).where(eq(doctors.clinicId, clinicId));
    }
    return await db.select().from(doctors);
  }

  async updateDoctorStatus(id: number, isAvailable: boolean, hasArrived: boolean): Promise<Doctor> {
    const [doctor] = await db
      .update(doctors)
      .set({ isAvailable, hasArrived })
      .where(eq(doctors.id, id))
      .returning();

    if (!doctor) throw new Error("Doctor not found");
    return doctor;
  }

  async getAppointments(userId: number): Promise<Appointment[]> {
    return await db
      .select()
      .from(appointments)
      .where(eq(appointments.patientId, userId));
  }

  async createAppointment(appointment: Omit<Appointment, "id">): Promise<Appointment> {
    const [newAppointment] = await db
      .insert(appointments)
      .values(appointment)
      .returning();
    return newAppointment;
  }

  async updateAppointmentStatus(id: number, status: Appointment["status"]): Promise<Appointment> {
    const [appointment] = await db
      .update(appointments)
      .set({ status })
      .where(eq(appointments.id, id))
      .returning();

    if (!appointment) throw new Error("Appointment not found");
    return appointment;
  }
}

export const storage = new DatabaseStorage();