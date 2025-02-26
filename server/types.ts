import { User, InsertUser, Clinic, Doctor, Appointment } from "@shared/schema";
import { Store } from "express-session";

export interface IStorage {
  sessionStore: Store;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getDoctors(clinicId?: number): Promise<Doctor[]>;
  updateDoctorStatus(id: number, isAvailable: boolean, hasArrived: boolean): Promise<Doctor>;
  getAppointments(userId: number): Promise<Appointment[]>;
  createAppointment(appointment: Omit<Appointment, "id">): Promise<Appointment>;
  updateAppointmentStatus(id: number, status: Appointment["status"]): Promise<Appointment>;
  searchDoctors(params: {
    latitude?: number;
    longitude?: number;
    maxDistance?: number;
    specialty?: string;
  }): Promise<(Doctor & { distance: number; clinicName: string })[]>;
}
