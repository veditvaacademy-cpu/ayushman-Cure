import { Router } from "express";
import db from "../db.js";

const router = Router();

router.get("/tests", (req, res) => {
  const hospitalId = req.query.hospitalId;
  const catalog = db.prepare("SELECT * FROM radiology_test_catalog WHERE hospital_id = ?").all(hospitalId);
  res.json(catalog);
});

router.get("/orders", (req, res) => {
  const hospitalId = req.query.hospitalId;
  const requests = db.prepare(`
    SELECT r.*, p.name as patient_name, p.patient_id_str, d.name as doctor_name, t.name as test_name
    FROM radiology_requests r 
    JOIN patients p ON r.patient_id = p.id 
    JOIN doctors d ON r.doctor_id = d.id 
    JOIN radiology_test_catalog t ON r.test_id = t.id
    WHERE r.hospital_id = ?
    ORDER BY r.requested_at DESC
  `).all(hospitalId);
  res.json(requests);
});

router.post("/orders", (req, res) => {
  const { hospital_id, patient_id, doctor_id, test_id, priority, clinical_history } = req.body;
  const info = db.prepare("INSERT INTO radiology_requests (hospital_id, patient_id, doctor_id, test_id, priority, clinical_history) VALUES (?, ?, ?, ?, ?, ?)").run(
    hospital_id, patient_id, doctor_id, test_id, priority, clinical_history
  );
  res.json({ id: info.lastInsertRowid });
});

router.delete("/orders/:id", (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM radiology_requests WHERE id = ?").run(id);
  res.json({ success: true });
});

router.get("/results/:orderId", (req, res) => {
  const { orderId } = req.params;
  const result = db.prepare("SELECT * FROM radiology_results WHERE request_id = ?").get(orderId);
  res.json(result);
});

router.post("/results", (req, res) => {
  const { request_id, test_id, findings, impression, image_url, notes } = req.body;
  const info = db.prepare("INSERT INTO radiology_results (request_id, test_id, findings, impression, image_url, notes) VALUES (?, ?, ?, ?, ?, ?)").run(
    request_id, test_id, findings, impression, image_url, notes
  );
  db.prepare("UPDATE radiology_requests SET status = 'Completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?").run(request_id);
  res.json({ id: info.lastInsertRowid });
});

export default router;
