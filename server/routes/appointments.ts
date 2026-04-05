import { Router } from "express";
import db from "../db.js";

const router = Router();

router.get("/", (req, res) => {
  const hospitalId = req.query.hospitalId;
  const appointments = db.prepare(`
    SELECT a.*, p.name as patient_name, p.patient_id_str, d.name as doctor_name 
    FROM appointments a 
    JOIN patients p ON a.patient_id = p.id 
    JOIN doctors d ON a.doctor_id = d.id 
    WHERE a.hospital_id = ?
    ORDER BY a.appointment_date DESC
  `).all(hospitalId);
  res.json(appointments);
});

router.post("/", (req, res) => {
  const { hospital_id, patient_id, doctor_id, appointment_date, type, notes } = req.body;
  const info = db.prepare(`
    INSERT INTO appointments (hospital_id, patient_id, doctor_id, appointment_date, type, notes) 
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    hospital_id, patient_id, doctor_id, appointment_date, type, notes
  );
  res.json({ id: info.lastInsertRowid });
});

router.post("/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  db.prepare("UPDATE appointments SET status = ? WHERE id = ?").run(status, id);
  res.json({ success: true });
});

export default router;
