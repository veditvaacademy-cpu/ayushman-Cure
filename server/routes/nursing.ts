import { Router } from "express";
import db from "../db.js";

const router = Router();

router.get("/shifts", (req, res) => {
  const hospitalId = req.query.hospitalId;
  const shifts = db.prepare("SELECT * FROM nursing_shifts WHERE hospital_id = ?").all(hospitalId);
  res.json(shifts);
});

router.get("/tasks", (req, res) => {
  const { admission_id } = req.query;
  const tasks = db.prepare("SELECT * FROM nursing_tasks WHERE admission_id = ?").all(admission_id);
  res.json(tasks);
});

router.post("/tasks", (req, res) => {
  const { admission_id, task_type, scheduled_at, notes } = req.body;
  const info = db.prepare("INSERT INTO nursing_tasks (admission_id, task_type, scheduled_at, notes) VALUES (?, ?, ?, ?)").run(
    admission_id, task_type, scheduled_at, notes
  );
  res.json({ id: info.lastInsertRowid });
});

router.post("/tasks/:id/complete", (req, res) => {
  const { id } = req.params;
  const { nurse_name, notes } = req.body;
  db.prepare("UPDATE nursing_tasks SET status = 'Completed', completed_at = CURRENT_TIMESTAMP, nurse_name = ?, notes = ? WHERE id = ?").run(
    nurse_name, notes, id
  );
  res.json({ success: true });
});

router.get("/handover", (req, res) => {
  const hospitalId = req.query.hospitalId;
  const handovers = db.prepare(`
    SELECT h.*, p.name as patient_name, p.patient_id_str 
    FROM nursing_handovers h 
    JOIN ipd_admissions a ON h.admission_id = a.id 
    JOIN patients p ON a.patient_id = p.id 
    WHERE a.hospital_id = ?
    ORDER BY h.recorded_at DESC
  `).all(hospitalId);
  res.json(handovers);
});

router.post("/handover", (req, res) => {
  const { admission_id, from_nurse, to_nurse, clinical_summary, pending_tasks } = req.body;
  const info = db.prepare(`
    INSERT INTO nursing_handovers (admission_id, from_nurse, to_nurse, clinical_summary, pending_tasks) 
    VALUES (?, ?, ?, ?, ?)
  `).run(
    admission_id, from_nurse, to_nurse, clinical_summary, pending_tasks
  );
  res.json({ id: info.lastInsertRowid });
});

router.get("/dashboard", (req, res) => {
  const hospitalId = req.query.hospitalId;
  
  const admissions = db.prepare(`
    SELECT a.*, p.name as patient_name, p.patient_id_str, d.name as doctor_name, b.ward_name, b.bed_number 
    FROM ipd_admissions a 
    JOIN patients p ON a.patient_id = p.id 
    JOIN doctors d ON a.doctor_id = d.id 
    JOIN beds b ON a.bed_id = b.id 
    WHERE a.hospital_id = ? AND a.status = 'Admitted'
  `).all(hospitalId);

  const vitals = db.prepare(`
    SELECT v.* FROM ipd_vitals v
    JOIN ipd_admissions a ON v.admission_id = a.id
    WHERE a.hospital_id = ? AND a.status = 'Admitted'
    ORDER BY v.recorded_at DESC
  `).all(hospitalId);

  const medications = db.prepare(`
    SELECT m.* FROM ipd_medications m
    JOIN ipd_admissions a ON m.admission_id = a.id
    WHERE a.hospital_id = ? AND a.status = 'Admitted' AND m.status = 'Active'
  `).all(hospitalId);

  const tasks = db.prepare(`
    SELECT t.* FROM nursing_tasks t
    JOIN ipd_admissions a ON t.admission_id = a.id
    WHERE a.hospital_id = ? AND a.status = 'Admitted'
  `).all(hospitalId);

  const shifts = db.prepare("SELECT * FROM nursing_shifts WHERE hospital_id = ?").all(hospitalId);

  res.json({
    admissions,
    vitals,
    medications,
    tasks,
    shifts
  });
});

router.get("/icu/vitals-trend/:admissionId", (req, res) => {
  const { admissionId } = req.params;
  const trend = db.prepare("SELECT * FROM ipd_vitals WHERE admission_id = ? ORDER BY recorded_at ASC LIMIT 100").all(admissionId);
  res.json(trend);
});

export default router;
