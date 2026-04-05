import { Router } from "express";
import db from "../db.js";

const router = Router();

router.get("/admissions", (req, res) => {
  const hospitalId = req.query.hospitalId;
  const admissions = db.prepare(`
    SELECT a.*, p.name as patient_name, p.patient_id_str, d.name as doctor_name, b.ward_name, b.bed_number 
    FROM ipd_admissions a 
    JOIN patients p ON a.patient_id = p.id 
    JOIN doctors d ON a.doctor_id = d.id 
    JOIN beds b ON a.bed_id = b.id 
    WHERE a.hospital_id = ?
    ORDER BY a.admission_date DESC
  `).all(hospitalId);
  res.json(admissions);
});

router.post("/admissions", (req, res) => {
  const { hospital_id, patient_id, doctor_id, bed_id, admission_note, risk_code } = req.body;
  const info = db.prepare("INSERT INTO ipd_admissions (hospital_id, patient_id, doctor_id, bed_id, admission_note, risk_code) VALUES (?, ?, ?, ?, ?, ?)").run(
    hospital_id, patient_id, doctor_id, bed_id, admission_note, risk_code
  );
  db.prepare("UPDATE beds SET status = 'Occupied' WHERE id = ?").run(bed_id);
  res.json({ id: info.lastInsertRowid });
});

router.get("/beds", (req, res) => {
  const hospitalId = req.query.hospitalId;
  const beds = db.prepare("SELECT * FROM beds WHERE hospital_id = ?").all(hospitalId);
  res.json(beds);
});

router.get("/admissions/:id/vitals", (req, res) => {
  const { id } = req.params;
  const vitals = db.prepare("SELECT * FROM ipd_vitals WHERE admission_id = ? ORDER BY recorded_at DESC").all(id);
  res.json(vitals);
});

router.post("/admissions/:id/vitals", (req, res) => {
  const { id } = req.params;
  const { temp, bp, pulse, spO2, respiration } = req.body;
  const info = db.prepare("INSERT INTO ipd_vitals (admission_id, temp, bp, pulse, spO2, respiration) VALUES (?, ?, ?, ?, ?, ?)").run(
    id, temp, bp, pulse, spO2, respiration
  );
  res.json({ id: info.lastInsertRowid });
});

router.get("/admissions/:id/medications", (req, res) => {
  const { id } = req.params;
  const medications = db.prepare("SELECT * FROM ipd_medications WHERE admission_id = ? ORDER BY start_date DESC").all(id);
  res.json(medications);
});

router.post("/admissions/:id/medications", (req, res) => {
  const { id } = req.params;
  const { medicine_name, dosage, frequency, start_date, instructions } = req.body;
  const info = db.prepare("INSERT INTO ipd_medications (admission_id, medicine_name, dosage, frequency, start_date, instructions) VALUES (?, ?, ?, ?, ?, ?)").run(
    id, medicine_name, dosage, frequency, start_date, instructions
  );
  res.json({ id: info.lastInsertRowid });
});

router.get("/admissions/:id/intake-output", (req, res) => {
  const { id } = req.params;
  const data = db.prepare("SELECT * FROM ipd_intake_output WHERE admission_id = ? ORDER BY recorded_at DESC").all(id);
  res.json(data);
});

router.post("/admissions/:id/intake-output", (req, res) => {
  const { id } = req.params;
  const { intake_type, intake_amount, output_type, output_amount } = req.body;
  const info = db.prepare("INSERT INTO ipd_intake_output (admission_id, intake_type, intake_amount, output_type, output_amount) VALUES (?, ?, ?, ?, ?)").run(
    id, intake_type, intake_amount, output_type, output_amount
  );
  res.json({ id: info.lastInsertRowid });
});

router.get("/admissions/:id/doctor-notes", (req, res) => {
  const { id } = req.params;
  const notes = db.prepare("SELECT * FROM ipd_doctor_notes WHERE admission_id = ? ORDER BY recorded_at DESC").all(id);
  res.json(notes);
});

router.post("/admissions/:id/doctor-notes", (req, res) => {
  const { id } = req.params;
  const { doctor_id, note } = req.body;
  const info = db.prepare("INSERT INTO ipd_doctor_notes (admission_id, doctor_id, note) VALUES (?, ?, ?)").run(
    id, doctor_id, note
  );
  res.json({ id: info.lastInsertRowid });
});

router.get("/icu/equipment", (req, res) => {
  const hospitalId = req.query.hospitalId;
  const equipment = db.prepare("SELECT * FROM icu_equipment WHERE hospital_id = ?").all(hospitalId);
  res.json(equipment);
});

router.get("/crash-cart", (req, res) => {
  const hospitalId = req.query.hospitalId;
  const inventory = db.prepare("SELECT * FROM crash_cart_inventory WHERE hospital_id = ?").all(hospitalId);
  res.json(inventory);
});

export default router;
