import { IStorage } from "./types";
import type { User, InsertUser, Clinic, Doctor, Appointment } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private clinics: Map<number, Clinic>;
  private doctors: Map<number, Doctor>;
  private appointments: Map<number, Appointment>;
  sessionStore: session.Store;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.clinics = new Map();
    this.doctors = new Map();
    this.appointments = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentId++;
    const newUser = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  async searchDoctors(params: {
    latitude?: number;
    longitude?: number;
    maxDistance?: number;
    specialty?: string;
  }): Promise<(Doctor & { distance: number; clinicName: string })[]> {
    const doctors = Array.from(this.doctors.values());
    const clinics = Array.from(this.clinics.values());

    return doctors
      .map(doctor => {
        const clinic = clinics.find(c => c.id === doctor.clinicId);
        if (!clinic) return null;

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
      .filter((item): item is NonNullable<typeof item> => {
        if (!item) return false;
        if (params.maxDistance && item.distance > params.maxDistance) return false;
        if (params.specialty && item.specialty !== params.specialty) return false;
        return true;
      })
      .sort((a, b) => a.distance - b.distance);
  }

  async getDoctors(clinicId?: number): Promise<Doctor[]> {
    const doctors = Array.from(this.doctors.values());
    return clinicId 
      ? doctors.filter(d => d.clinicId === clinicId)
      : doctors;
  }

  async updateDoctorStatus(id: number, isAvailable: boolean, hasArrived: boolean): Promise<Doctor> {
    const doctor = this.doctors.get(id);
    if (!doctor) throw new Error("Doctor not found");

    const updated = { ...doctor, isAvailable, hasArrived };
    this.doctors.set(id, updated);
    return updated;
  }

  async getAppointments(userId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values())
      .filter(a => a.patientId === userId);
  }

  async createAppointment(appointment: Omit<Appointment, "id">): Promise<Appointment> {
    const id = this.currentId++;
    const newAppointment = { ...appointment, id };
    this.appointments.set(id, newAppointment);
    return newAppointment;
  }

  async updateAppointmentStatus(id: number, status: Appointment["status"]): Promise<Appointment> {
    const appointment = this.appointments.get(id);
    if (!appointment) throw new Error("Appointment not found");

    const updated = { ...appointment, status };
    this.appointments.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();