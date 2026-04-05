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

export default router;
