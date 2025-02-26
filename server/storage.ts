import { IStorage } from "./types";
import type { User, InsertUser, Clinic, Doctor, Appointment } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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
