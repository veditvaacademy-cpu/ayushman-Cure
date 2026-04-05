import { Router } from "express";
import db from "../db.js";

const router = Router();

router.get("/tests", (req, res) => {
  const hospitalId = req.query.hospitalId;
  const catalog = db.prepare("SELECT * FROM lab_test_catalog WHERE hospital_id = ?").all(hospitalId);
  res.json(catalog);
});

router.post("/tests", (req, res) => {
  const { hospital_id, name, category, reference_range, unit, price } = req.body;
  const info = db.prepare("INSERT INTO lab_test_catalog (hospital_id, name, category, reference_range, unit, price) VALUES (?, ?, ?, ?, ?, ?)").run(
    hospital_id, name, category, reference_range, unit, price
  );
  res.json({ id: info.lastInsertRowid });
});

router.patch("/tests/:id", (req, res) => {
  const { id } = req.params;
  const { name, category, reference_range, unit, price } = req.body;
  db.prepare("UPDATE lab_test_catalog SET name = COALESCE(?, name), category = COALESCE(?, category), reference_range = COALESCE(?, reference_range), unit = COALESCE(?, unit), price = COALESCE(?, price) WHERE id = ?").run(
    name, category, reference_range, unit, price, id
  );
  res.json({ success: true });
});

router.delete("/tests/:id", (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM lab_test_catalog WHERE id = ?").run(id);
  res.json({ success: true });
});

router.get("/orders", (req, res) => {
  const hospitalId = req.query.hospitalId;
  const requests = db.prepare(`
    SELECT r.*, p.name as patient_name, p.patient_id_str, d.name as doctor_name 
    FROM lab_requests r 
    JOIN patients p ON r.patient_id = p.id 
    JOIN doctors d ON r.doctor_id = d.id 
    WHERE r.hospital_id = ?
    ORDER BY r.requested_at DESC
  `).all(hospitalId);
  res.json(requests);
});

router.post("/orders", (req, res) => {
  const { hospital_id, patient_id, doctor_id, test_ids, priority, notes } = req.body;
  const info = db.prepare("INSERT INTO lab_requests (hospital_id, patient_id, doctor_id, priority, notes) VALUES (?, ?, ?, ?, ?)").run(
    hospital_id, patient_id, doctor_id, priority, notes
  );
  const orderId = info.lastInsertRowid;
  
  if (test_ids && Array.isArray(test_ids)) {
    const insertItem = db.prepare("INSERT INTO lab_request_items (request_id, test_id) VALUES (?, ?)");
    test_ids.forEach(tid => insertItem.run(orderId, tid));
  }
  
  res.json({ id: orderId });
});

router.delete("/orders/:id", (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM lab_requests WHERE id = ?").run(id);
  res.json({ success: true });
});

router.get("/results/:orderId", (req, res) => {
  const { orderId } = req.params;
  const results = db.prepare(`
    SELECT r.*, t.name as test_name, t.unit, t.reference_range
    FROM lab_results r
    JOIN lab_test_catalog t ON r.test_id = t.id
    WHERE r.request_id = ?
  `).all(orderId);
  res.json(results);
});

router.post("/results", (req, res) => {
  const { request_id, test_id, value, is_abnormal, notes } = req.body;
  const info = db.prepare("INSERT INTO lab_results (request_id, test_id, value, is_abnormal, notes) VALUES (?, ?, ?, ?, ?)").run(
    request_id, test_id, value, is_abnormal, notes
  );
  db.prepare("UPDATE lab_requests SET status = 'Completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?").run(request_id);
  res.json({ id: info.lastInsertRowid });
});

export default router;
