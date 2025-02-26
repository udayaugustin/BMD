import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertAppointmentSchema } from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express) {
  app.get("/api/doctors", async (_req, res) => {
    try {
      const doctors = await storage.getDoctors();
      res.json(doctors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch doctors" });
    }
  });

  app.get("/api/doctors/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (typeof q !== "string") {
        return res.status(400).json({ message: "Search query is required" });
      }
      const doctors = await storage.searchDoctors(q);
      res.json(doctors);
    } catch (error) {
      res.status(500).json({ message: "Failed to search doctors" });
    }
  });

  app.get("/api/doctors/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const doctor = await storage.getDoctorById(id);
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }
      res.json(doctor);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch doctor" });
    }
  });

  app.post("/api/appointments", async (req, res) => {
    try {
      const appointment = insertAppointmentSchema.parse(req.body);
      const doctor = await storage.getDoctorById(appointment.doctorId);
      
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      if (!doctor.available) {
        return res.status(400).json({ message: "Doctor is not available" });
      }

      const newAppointment = await storage.createAppointment(appointment);
      res.status(201).json(newAppointment);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
