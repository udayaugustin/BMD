import { User, InsertUser, Clinic, Doctor, DoctorClinic, ConsultingHours, Appointment } from "@shared/schema";
import { Store } from "express-session";

export interface IStorage {
  sessionStore: Store;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Doctor related methods
  getDoctorsByClinic(clinicId: number): Promise<(Doctor & { isAvailable: boolean; hasArrived: boolean })[]>;
  getDoctorClinics(doctorId: number): Promise<(DoctorClinic & { clinicName: string })[]>;
  getConsultingHours(doctorClinicId: number): Promise<ConsultingHours[]>;
  getCurrentToken(doctorClinicId: number): Promise<number>;
  updateDoctorStatus(doctorClinicId: number, isAvailable: boolean, hasArrived: boolean): Promise<DoctorClinic>;
  updateCurrentToken(doctorClinicId: number, tokenNumber: number): Promise<DoctorClinic>;

  // Appointment related methods
  getAppointments(userId: number): Promise<(Appointment & { 
    doctorName: string;
    clinicName: string;
    currentToken: number;
  })[]>;
  createAppointment(appointment: Omit<Appointment, "id">): Promise<Appointment>;
  updateAppointmentStatus(id: number, status: Appointment["status"]): Promise<Appointment>;

  // Search functionality
  searchDoctors(params: {
    latitude?: number;
    longitude?: number;
    maxDistance?: number;
    specialty?: string;
  }): Promise<(Doctor & { 
    distance: number;
    clinicName: string;
    isAvailable: boolean;
    hasArrived: boolean;
    currentToken: number;
  })[]>;
}