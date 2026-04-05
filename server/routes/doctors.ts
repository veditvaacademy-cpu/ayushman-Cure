import { Router } from "express";
import db from "../db.js";

const router = Router();

router.get("/", (req, res) => {
  const hospitalId = req.query.hospitalId;
  const doctors = db.prepare("SELECT * FROM doctors WHERE hospital_id = ?").all(hospitalId);
  res.json(doctors);
});

router.post("/", (req, res) => {
  const { hospital_id, name, department, schedule } = req.body;
  const info = db.prepare("INSERT INTO doctors (hospital_id, name, department, schedule) VALUES (?, ?, ?, ?)").run(
    hospital_id, name, department, schedule
  );
  res.json({ id: info.lastInsertRowid });
});

router.patch("/:id", (req, res) => {
  const { id } = req.params;
  const { name, department, schedule, consultation_fee } = req.body;
  db.prepare("UPDATE doctors SET name = ?, department = ?, schedule = ?, consultation_fee = ? WHERE id = ?").run(
    name, department, schedule, consultation_fee, id
  );
  res.json({ success: true });
});

router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { name, department, schedule, consultation_fee } = req.body;
  db.prepare("UPDATE doctors SET name = ?, department = ?, schedule = ?, consultation_fee = ? WHERE id = ?").run(
    name, department, schedule, consultation_fee, id
  );
  res.json({ success: true });
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM doctors WHERE id = ?").run(id);
  res.json({ success: true });
});

export default router;
