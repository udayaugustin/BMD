import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { log } from "./vite";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: "your-secret-key", // In production, use an environment variable
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: "mobileNumber",
        passwordField: "password",
      },
      async (mobileNumber, password, done) => {
        try {
          const user = await storage.getUserByMobileNumber(mobileNumber);
          if (!user || user.password !== password) { // In production, use proper password hashing
            return done(null, false, { message: "Invalid mobile number or password" });
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Serialize just the mobile number to the session
  passport.serializeUser((user, done) => {
    log(`Serializing user: ${user.mobileNumber}`);
    done(null, user.mobileNumber);
  });

  // Deserialize by finding user with the stored mobile number
  passport.deserializeUser(async (mobileNumber: string, done) => {
    try {
      log(`Deserializing user: ${mobileNumber}`);
      const user = await storage.getUserByMobileNumber(mobileNumber);
      if (!user) {
        log(`User not found for mobile number: ${mobileNumber}`);
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      log(`Error deserializing user: ${error}`);
      done(error);
    }
  });

  app.post("/api/register", async (req, res) => {
    try {
      const existingUser = await storage.getUserByMobileNumber(req.body.mobileNumber);
      if (existingUser) {
        return res.status(400).json({ message: "Mobile number already registered" });
      }

      const user = await storage.createUser(req.body);
      log(`User registered: ${user.mobileNumber}`);

      req.login(user, (err) => {
        if (err) {
          log(`Login error after registration: ${err}`);
          return res.status(500).json({ message: "Failed to login after registration" });
        }
        res.status(201).json(user);
      });
    } catch (error) {
      log(`Registration error: ${error}`);
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        log(`Login error: ${err}`);
        return next(err);
      }
      if (!user) {
        log(`Login failed: ${info?.message || 'Authentication failed'}`);
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      req.login(user, (err) => {
        if (err) {
          log(`Login session error: ${err}`);
          return next(err);
        }
        log(`User logged in: ${user.mobileNumber}`);
        return res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    const mobileNumber = req.user?.mobileNumber;
    req.logout(() => {
      log(`User logged out: ${mobileNumber}`);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });
}