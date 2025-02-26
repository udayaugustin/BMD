import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Doctors routes
  app.get("/api/doctors", async (req, res) => {
    const clinicId = req.query.clinicId ? Number(req.query.clinicId) : undefined;
    const doctors = await storage.getDoctors(clinicId);
    res.json(doctors);
  });

  app.patch("/api/doctors/:id/status", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "clinic_staff") {
      return res.sendStatus(403);
    }

    const { isAvailable, hasArrived } = req.body;
    const doctor = await storage.updateDoctorStatus(
      Number(req.params.id),
      isAvailable,
      hasArrived
    );
    res.json(doctor);
  });

  // Appointments routes
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
