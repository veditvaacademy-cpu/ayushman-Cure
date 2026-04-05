import { Router } from "express";
import db from "../db.js";

const router = Router();

router.get("/visits", (req, res) => {
  const hospitalId = req.query.hospitalId;
  const visits = db.prepare(`
    SELECT v.*, p.name as patient_name, p.patient_id_str, d.name as doctor_name 
    FROM opd_visits v 
    JOIN patients p ON v.patient_id = p.id 
    JOIN doctors d ON v.doctor_id = d.id 
    WHERE v.hospital_id = ?
    ORDER BY v.visit_date DESC
  `).all(hospitalId);
  res.json(visits);
});

router.post("/visits", (req, res) => {
  const { hospital_id, patient_id, doctor_id, symptoms, diagnosis, vitals, vitals_temp, vitals_bp, vitals_pulse, vitals_spo2, vitals_weight, vitals_height, vitals_bmi, vitals_rr, fee_amount, payment_status } = req.body;
  
  // Handle both nested and flat vitals
  const v_temp = vitals?.temp || vitals_temp;
  const v_bp = vitals?.bp || vitals_bp;
  const v_pulse = vitals?.pulse || vitals_pulse;
  const v_spo2 = vitals?.spo2 || vitals_spo2;
  const v_weight = vitals?.weight || vitals_weight;
  const v_height = vitals?.height || vitals_height;
  const v_bmi = vitals?.bmi || vitals_bmi;
  const v_rr = vitals?.rr || vitals_rr;

  const info = db.prepare(`
    INSERT INTO opd_visits (hospital_id, patient_id, doctor_id, symptoms, diagnosis, 
      vitals_temp, vitals_bp, vitals_pulse, vitals_spo2, vitals_weight, vitals_height, vitals_bmi, vitals_rr, fee_amount, payment_status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    hospital_id, patient_id, doctor_id, symptoms, diagnosis,
    v_temp, v_bp, v_pulse, v_spo2, v_weight, v_height, v_bmi, v_rr, fee_amount || 0, payment_status || 'Unpaid'
  );
  res.json({ id: info.lastInsertRowid });
});

router.patch("/visits/:id", (req, res) => {
  const { id } = req.params;
  const { doctor_id, symptoms, diagnosis, vitals, vitals_temp, vitals_bp, vitals_pulse, vitals_spo2, vitals_weight, vitals_height, vitals_bmi, vitals_rr, fee_amount, payment_status } = req.body;
  
  const v_temp = vitals?.temp || vitals_temp;
  const v_bp = vitals?.bp || vitals_bp;
  const v_pulse = vitals?.pulse || vitals_pulse;
  const v_spo2 = vitals?.spo2 || vitals_spo2;
  const v_weight = vitals?.weight || vitals_weight;
  const v_height = vitals?.height || vitals_height;
  const v_bmi = vitals?.bmi || vitals_bmi;
  const v_rr = vitals?.rr || vitals_rr;

  db.prepare(`
    UPDATE opd_visits SET doctor_id = COALESCE(?, doctor_id), symptoms = COALESCE(?, symptoms), diagnosis = COALESCE(?, diagnosis), 
      vitals_temp = COALESCE(?, vitals_temp), vitals_bp = COALESCE(?, vitals_bp), vitals_pulse = COALESCE(?, vitals_pulse), 
      vitals_spo2 = COALESCE(?, vitals_spo2), vitals_weight = COALESCE(?, vitals_weight), vitals_height = COALESCE(?, vitals_height), 
      vitals_bmi = COALESCE(?, vitals_bmi), vitals_rr = COALESCE(?, vitals_rr), fee_amount = COALESCE(?, fee_amount), payment_status = COALESCE(?, payment_status)
    WHERE id = ?
  `).run(
    doctor_id, symptoms, diagnosis,
    v_temp, v_bp, v_pulse, v_spo2, v_weight, v_height, v_bmi, v_rr, fee_amount, payment_status,
    id
  );
  res.json({ success: true });
});

router.put("/visits/:id", (req, res) => {
  const { id } = req.params;
  const { symptoms, diagnosis, vitals } = req.body;
  db.prepare(`
    UPDATE opd_visits SET symptoms = ?, diagnosis = ?, 
      vitals_temp = ?, vitals_bp = ?, vitals_pulse = ?, vitals_spo2 = ?, vitals_weight = ?, vitals_height = ?, vitals_bmi = ?, vitals_rr = ?
    WHERE id = ?
  `).run(
    symptoms, diagnosis,
    vitals.temp, vitals.bp, vitals.pulse, vitals.spo2, vitals.weight, vitals.height, vitals.bmi, vitals.rr,
    id
  );
  res.json({ success: true });
});

router.delete("/visits/:id", (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM opd_visits WHERE id = ?").run(id);
  res.json({ success: true });
});

router.get("/prescriptions", (req, res) => {
  const hospitalId = req.query.hospitalId;
  const prescriptions = db.prepare(`
    SELECT pr.*, p.name as patient_name, p.patient_id_str, d.name as doctor_name 
    FROM prescriptions pr 
    JOIN patients p ON pr.patient_id = p.id 
    JOIN doctors d ON pr.doctor_id = d.id 
    WHERE pr.hospital_id = ?
    ORDER BY pr.created_at DESC
  `).all(hospitalId);
  res.json(prescriptions);
});

router.post("/prescriptions", (req, res) => {
  const { hospital_id, patient_id, doctor_id, diagnosis, medicines, tests } = req.body;
  const info = db.prepare("INSERT INTO prescriptions (hospital_id, patient_id, doctor_id, diagnosis, medicines, tests) VALUES (?, ?, ?, ?, ?, ?)").run(
    hospital_id, patient_id, doctor_id, diagnosis, JSON.stringify(medicines), JSON.stringify(tests)
  );
  res.json({ id: info.lastInsertRowid });
});

router.put("/prescriptions/:id", (req, res) => {
  const { id } = req.params;
  const { diagnosis, medicines, tests } = req.body;
  db.prepare("UPDATE prescriptions SET diagnosis = ?, medicines = ?, tests = ? WHERE id = ?").run(
    diagnosis, JSON.stringify(medicines), JSON.stringify(tests), id
  );
  res.json({ success: true });
});

router.delete("/prescriptions/:id", (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM prescriptions WHERE id = ?").run(id);
  res.json({ success: true });
});

router.get("/templates", (req, res) => {
  const hospitalId = req.query.hospitalId;
  const templates = db.prepare("SELECT * FROM prescription_templates WHERE hospital_id = ?").all(hospitalId);
  res.json(templates);
});

router.get("/templates/:id/items", (req, res) => {
  const { id } = req.params;
  const items = db.prepare("SELECT * FROM prescription_template_items WHERE template_id = ?").all(id);
  res.json(items);
});

export default router;
