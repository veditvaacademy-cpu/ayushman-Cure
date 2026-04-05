import { Router } from "express";
import db from "../db.js";

const router = Router();

router.get("/equipment", (req, res) => {
  const hospitalId = req.query.hospitalId;
  const equipment = db.prepare("SELECT * FROM icu_equipment WHERE hospital_id = ?").all(hospitalId);
  res.json(equipment);
});

router.post("/equipment", (req, res) => {
  const { hospital_id, name, type } = req.body;
  const info = db.prepare("INSERT INTO icu_equipment (hospital_id, name, type) VALUES (?, ?, ?)").run(
    hospital_id, name, type
  );
  res.json({ id: info.lastInsertRowid });
});

router.get("/crash-cart", (req, res) => {
  const hospitalId = req.query.hospitalId;
  const inventory = db.prepare("SELECT * FROM crash_cart_inventory WHERE hospital_id = ?").all(hospitalId);
  res.json(inventory);
});

router.get("/vitals/:patientId", (req, res) => {
  const { patientId } = req.params;
  const vitals = db.prepare("SELECT * FROM icu_vitals WHERE patient_id = ? ORDER BY recorded_at DESC LIMIT 50").all(patientId);
  res.json(vitals);
});

router.post("/vitals", (req, res) => {
  const { patient_id, hr, bp_sys, bp_dia, spo2, temp } = req.body;
  const info = db.prepare("INSERT INTO icu_vitals (patient_id, hr, bp_sys, bp_dia, spo2, temp) VALUES (?, ?, ?, ?, ?, ?)").run(
    patient_id, hr, bp_sys, bp_dia, spo2, temp
  );
  res.json({ id: info.lastInsertRowid });
});

export default router;
