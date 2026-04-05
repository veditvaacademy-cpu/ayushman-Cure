import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { seed } from "./seed.js";

// Routes
import authRoutes from "./routes/auth.js";
import hospitalRoutes from "./routes/hospitals.js";
import patientRoutes from "./routes/patients.js";
import doctorRoutes from "./routes/doctors.js";
import opdRoutes from "./routes/opd.js";
import ipdRoutes from "./routes/ipd.js";
import pharmacyRoutes from "./routes/pharmacy.js";
import otRoutes from "./routes/ot.js";
import nursingRoutes from "./routes/nursing.js";
import labRoutes from "./routes/lab.js";
import radiologyRoutes from "./routes/radiology.js";
import appointmentRoutes from "./routes/appointments.js";
import whatsappRoutes from "./routes/whatsapp.js";
import safetyRoutes from "./routes/safety.js";
import reportRoutes from "./routes/reports.js";
import emergencyRoutes from "./routes/emergency.js";
import icuRoutes from "./routes/icu.js";
import dischargeRoutes from "./routes/discharges.js";
import ambulanceRoutes from "./routes/ambulances.js";
import ayushmanRoutes from "./routes/ayushman.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize and seed database
  console.log("Initializing database...");
  seed();
  console.log("Database initialized and seeded.");

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/hospitals", hospitalRoutes);
  app.use("/api/patients", patientRoutes);
  app.use("/api/doctors", doctorRoutes);
  app.use("/api/opd", opdRoutes);
  app.use("/api/ipd", ipdRoutes);
  app.use("/api/pharmacy", pharmacyRoutes);
  app.use("/api/ot", otRoutes);
  app.use("/api/nursing", nursingRoutes);
  app.use("/api/lab", labRoutes);
  app.use("/api/radiology", radiologyRoutes);
  app.use("/api/appointments", appointmentRoutes);
  app.use("/api/whatsapp", whatsappRoutes);
  app.use("/api/safety", safetyRoutes);
  app.use("/api/reports", reportRoutes);
  app.use("/api/emergency", emergencyRoutes);
  app.use("/api/icu", icuRoutes);
  app.use("/api/discharges", dischargeRoutes);
  app.use("/api/ambulances", ambulanceRoutes);
  app.use("/api/ayushman", ayushmanRoutes);

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
