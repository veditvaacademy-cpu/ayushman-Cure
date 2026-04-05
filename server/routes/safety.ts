import { Router } from "express";
import db from "../db.js";

const router = Router();

router.get("/incidents", (req, res) => {
  const hospitalId = req.query.hospitalId;
  const incidents = db.prepare("SELECT * FROM safety_incidents WHERE hospital_id = ? ORDER BY reported_at DESC").all(hospitalId);
  res.json(incidents);
});

router.post("/incidents", (req, res) => {
  const { hospital_id, type, description, severity, reported_by, location } = req.body;
  const info = db.prepare(`
    INSERT INTO safety_incidents (hospital_id, type, description, severity, reported_by, location) 
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    hospital_id, type, description, severity, reported_by, location
  );
  res.json({ id: info.lastInsertRowid });
});

router.get("/facility-checks", (req, res) => {
  const hospitalId = req.query.hospitalId;
  const checks = db.prepare("SELECT * FROM facility_checks WHERE hospital_id = ? ORDER BY checked_at DESC").all(hospitalId);
  res.json(checks);
});

router.post("/facility-checks", (req, res) => {
  const { hospital_id, area, check_type, status, notes, checked_by } = req.body;
  const info = db.prepare(`
    INSERT INTO facility_checks (hospital_id, area, check_type, status, notes, checked_by) 
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    hospital_id, area, check_type, status, notes, checked_by
  );
  res.json({ id: info.lastInsertRowid });
});

export default router;
