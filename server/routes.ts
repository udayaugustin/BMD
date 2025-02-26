import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Doctor routes
  app.get("/api/doctors/clinic/:clinicId", async (req, res) => {
    const doctors = await storage.getDoctorsByClinic(Number(req.params.clinicId));
    res.json(doctors);
  });

  app.get("/api/doctors/:doctorId/clinics", async (req, res) => {
    const clinics = await storage.getDoctorClinics(Number(req.params.doctorId));
    res.json(clinics);
  });

  app.get("/api/doctors/search", async (req, res) => {
    const { latitude, longitude, maxDistance, specialty } = req.query;
    const doctors = await storage.searchDoctors({
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined,
      maxDistance: maxDistance ? Number(maxDistance) : undefined,
      specialty: specialty?.toString(),
    });
    res.json(doctors);
  });

  // Consulting hours routes
  app.get("/api/consulting-hours/:doctorClinicId", async (req, res) => {
    const hours = await storage.getConsultingHours(Number(req.params.doctorClinicId));
    res.json(hours);
  });

  // Token management routes
  app.get("/api/current-token/:doctorClinicId", async (req, res) => {
    const token = await storage.getCurrentToken(Number(req.params.doctorClinicId));
    res.json({ currentToken: token });
  });

  app.patch("/api/doctor-clinics/:id/status", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "clinic_staff") {
      return res.sendStatus(403);
    }

    const { isAvailable, hasArrived } = req.body;
    const doctorClinic = await storage.updateDoctorStatus(
      Number(req.params.id),
      isAvailable,
      hasArrived
    );
    res.json(doctorClinic);
  });

  app.patch("/api/doctor-clinics/:id/token", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "clinic_staff") {
      return res.sendStatus(403);
    }

    const { tokenNumber } = req.body;
    const doctorClinic = await storage.updateCurrentToken(
      Number(req.params.id),
      tokenNumber
    );
    res.json(doctorClinic);
  });

  // Appointment routes
  app.get("/api/appointments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const appointments = await storage.getAppointments(req.user.id);
    res.json(appointments);
  });

  app.post("/api/appointments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const appointment = await storage.createAppointment({
      ...req.body,
      patientId: req.user.id,
    });
    res.status(201).json(appointment);
  });

  app.patch("/api/appointments/:id/status", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "clinic_staff") {
      return res.sendStatus(403);
    }

    const appointment = await storage.updateAppointmentStatus(
      Number(req.params.id),
      req.body.status
    );
    res.json(appointment);
  });

  const httpServer = createServer(app);
  return httpServer;
}