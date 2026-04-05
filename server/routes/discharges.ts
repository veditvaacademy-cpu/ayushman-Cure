import { Router } from "express";
import db from "../db.js";

const router = Router();

router.get("/", (req, res) => {
  const hospitalId = req.query.hospitalId;
  const discharges = db.prepare(`
    SELECT d.*, p.name as patient_name, p.patient_id_str, doc.name as doctor_name
    FROM discharges d
    JOIN patients p ON d.patient_id = p.id
    JOIN doctors doc ON d.doctor_id = doc.id
    WHERE d.hospital_id = ?
    ORDER BY d.discharge_date DESC
  `).all(hospitalId);
  res.json(discharges);
});

router.post("/", (req, res) => {
  const { hospital_id, admission_id, patient_id, doctor_id, discharge_summary, medications_json, follow_up_date, follow_up_notes } = req.body;
  const info = db.prepare(`
    INSERT INTO discharges (hospital_id, admission_id, patient_id, doctor_id, discharge_summary, medications_json, follow_up_date, follow_up_notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    hospital_id, admission_id, patient_id, doctor_id, discharge_summary, medications_json, follow_up_date, follow_up_notes
  );
  db.prepare("UPDATE ipd_admissions SET status = 'Discharged', discharge_date = CURRENT_TIMESTAMP WHERE id = ?").run(admission_id);
  res.json({ id: info.lastInsertRowid });
});

export default router;
