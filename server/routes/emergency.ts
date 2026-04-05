import { Router } from "express";
import db from "../db.js";

const router = Router();

router.get("/patients", (req, res) => {
  const hospitalId = req.query.hospitalId;
  const patients = db.prepare("SELECT * FROM emergency_patients WHERE hospital_id = ? ORDER BY arrival_time DESC").all(hospitalId);
  res.json(patients);
});

router.post("/register", (req, res) => {
  const { hospital_id, patient_name, age, gender, mobile, chief_complaint, triage_level, vitals_hr, vitals_bp, vitals_spo2, vitals_temp } = req.body;
  const info = db.prepare(`
    INSERT INTO emergency_patients (hospital_id, patient_name, age, gender, mobile, chief_complaint, triage_level, vitals_hr, vitals_bp, vitals_spo2, vitals_temp) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    hospital_id, patient_name, age, gender, mobile, chief_complaint, triage_level, vitals_hr, vitals_bp, vitals_spo2, vitals_temp
  );
  res.json({ id: info.lastInsertRowid });
});

router.patch("/patients/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  db.prepare("UPDATE emergency_patients SET status = ? WHERE id = ?").run(status, id);
  res.json({ success: true });
});

export default router;
