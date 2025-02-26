import { User, InsertUser, Doctor, InsertDoctor, Appointment, InsertAppointment, mockDoctors } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getDoctors(): Promise<Doctor[]>;
  getDoctorById(id: number): Promise<Doctor | undefined>;
  searchDoctors(query: string): Promise<Doctor[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getLatestTokenNumber(doctorId: number, date: Date): Promise<number>;

  // Auth related methods
  createUser(user: InsertUser): Promise<User>;
  getUserByMobileNumber(mobileNumber: string): Promise<User | undefined>;
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private doctors: Map<number, Doctor>;
  private appointments: Map<number, Appointment>;
  private users: Map<number, User>;
  private currentDoctorId: number;
  private currentAppointmentId: number;
  private currentUserId: number;
  sessionStore: session.Store;

  constructor() {
    this.doctors = new Map();
    this.appointments = new Map();
    this.users = new Map();
    this.currentDoctorId = 1;
    this.currentAppointmentId = 1;
    this.currentUserId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });

    // Initialize with mock doctors
    mockDoctors.forEach(doctor => {
      const id = this.currentDoctorId++;
      this.doctors.set(id, { ...doctor, id });
    });
  }

  async getDoctors(): Promise<Doctor[]> {
    return Array.from(this.doctors.values());
  }

  async getDoctorById(id: number): Promise<Doctor | undefined> {
    return this.doctors.get(id);
  }

  async searchDoctors(query: string): Promise<Doctor[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.doctors.values()).filter(
      doctor => 
        doctor.name.toLowerCase().includes(lowercaseQuery) ||
        doctor.specialty.toLowerCase().includes(lowercaseQuery)
    );
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const tokenNumber = await this.getLatestTokenNumber(
      appointment.doctorId,
      new Date()
    ) + 1;

    const newAppointment: Appointment = {
      id: this.currentAppointmentId++,
      tokenNumber,
      appointmentDate: new Date(),
      ...appointment,
    };

    this.appointments.set(newAppointment.id, newAppointment);
    return newAppointment;
  }

  async getLatestTokenNumber(doctorId: number, date: Date): Promise<number> {
    const todayStart = new Date(date);
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(date);
    todayEnd.setHours(23, 59, 59, 999);

    const doctorAppointments = Array.from(this.appointments.values()).filter(
      app => 
        app.doctorId === doctorId &&
        app.appointmentDate >= todayStart &&
        app.appointmentDate <= todayEnd
    );

    if (doctorAppointments.length === 0) return 0;

    return Math.max(...doctorAppointments.map(app => app.tokenNumber));
  }

  async createUser(userData: InsertUser): Promise<User> {
    const user: User = {
      id: this.currentUserId++,
      createdAt: new Date(),
      ...userData,
    };
    this.users.set(user.id, user);
    return user;
  }

  async getUserByMobileNumber(mobileNumber: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      user => user.mobileNumber === mobileNumber
    );
  }
}

export const storage = new MemStorage();