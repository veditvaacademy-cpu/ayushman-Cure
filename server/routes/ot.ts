import { Router } from "express";
import db from "../db.js";

const router = Router();

router.get("/rooms", (req, res) => {
  const hospitalId = req.query.hospitalId;
  const rooms = db.prepare("SELECT * FROM ot_rooms WHERE hospital_id = ?").all(hospitalId);
  res.json(rooms);
});

router.get("/schedules", (req, res) => {
  const hospitalId = req.query.hospitalId;
  const schedules = db.prepare(`
    SELECT s.*, p.name as patient_name, d.name as doctor_name, r.name as room_name 
    FROM ot_schedules s 
    JOIN patients p ON s.patient_id = p.id 
    JOIN doctors d ON s.surgeon_id = d.id 
    JOIN ot_rooms r ON s.room_id = r.id 
    WHERE s.hospital_id = ?
    ORDER BY s.scheduled_at DESC
  `).all(hospitalId);
  res.json(schedules);
});

router.post("/schedules", (req, res) => {
  const { hospital_id, patient_id, surgeon_id, room_id, procedure_name, scheduled_at, duration_mins, priority } = req.body;
  const info = db.prepare(`
    INSERT INTO ot_schedules (hospital_id, patient_id, surgeon_id, room_id, procedure_name, scheduled_at, duration_mins, priority) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    hospital_id, patient_id, surgeon_id, room_id, procedure_name, scheduled_at, duration_mins, priority
  );
  res.json({ id: info.lastInsertRowid });
});

router.get("/inventory", (req, res) => {
  const hospitalId = req.query.hospitalId;
  const inventory = db.prepare("SELECT * FROM ot_inventory WHERE hospital_id = ?").all(hospitalId);
  res.json(inventory);
});

router.get("/checklist", (req, res) => {
  const { schedule_id } = req.query;
  const checklist = db.prepare("SELECT * FROM ot_checklists WHERE schedule_id = ?").all(schedule_id);
  res.json(checklist);
});

export default router;
