import { Router } from "express";
import db from "../db.js";

const router = Router();

router.get("/items", (req, res) => {
  const hospitalId = req.query.hospitalId;
  const items = db.prepare("SELECT * FROM pharmacy_items WHERE hospital_id = ?").all(hospitalId);
  res.json(items);
});

router.post("/items", (req, res) => {
  const { hospital_id, name, generic_name, category, uom, min_stock_level, is_narcotic } = req.body;
  const info = db.prepare("INSERT INTO pharmacy_items (hospital_id, name, generic_name, category, uom, min_stock_level, is_narcotic) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
    hospital_id, name, generic_name, category, uom, min_stock_level, is_narcotic
  );
  res.json({ id: info.lastInsertRowid });
});

router.put("/items/:id", (req, res) => {
  const { id } = req.params;
  const { name, generic_name, category, uom, min_stock_level, is_narcotic } = req.body;
  db.prepare("UPDATE pharmacy_items SET name = ?, generic_name = ?, category = ?, uom = ?, min_stock_level = ?, is_narcotic = ? WHERE id = ?").run(
    name, generic_name, category, uom, min_stock_level, is_narcotic, id
  );
  res.json({ success: true });
});

router.delete("/items/:id", (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM pharmacy_items WHERE id = ?").run(id);
  res.json({ success: true });
});

router.get("/batches", (req, res) => {
  const hospitalId = req.query.hospitalId;
  const batches = db.prepare(`
    SELECT b.*, i.name as item_name, i.category, i.uom 
    FROM pharmacy_batches b 
    JOIN pharmacy_items i ON b.item_id = i.id 
    WHERE i.hospital_id = ?
  `).all(hospitalId);
  res.json(batches);
});

router.get("/suppliers", (req, res) => {
  const hospitalId = req.query.hospitalId;
  const suppliers = db.prepare("SELECT * FROM pharmacy_suppliers WHERE hospital_id = ?").all(hospitalId);
  res.json(suppliers);
});

router.get("/sales", (req, res) => {
  const hospitalId = req.query.hospitalId;
  const sales = db.prepare(`
    SELECT s.*, p.name as patient_name 
    FROM pharmacy_sales s 
    LEFT JOIN patients p ON s.patient_id = p.id 
    WHERE s.hospital_id = ?
    ORDER BY s.sale_date DESC
  `).all(hospitalId);
  res.json(sales);
});

router.post("/sales", (req, res) => {
  const { hospital_id, patient_id, items, total_amount, payment_mode } = req.body;
  const info = db.prepare("INSERT INTO pharmacy_sales (hospital_id, patient_id, total_amount, payment_mode) VALUES (?, ?, ?, ?)").run(
    hospital_id, patient_id, total_amount, payment_mode
  );
  const saleId = info.lastInsertRowid;
  
  items.forEach((item: any) => {
    db.prepare("INSERT INTO pharmacy_sale_items (sale_id, batch_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)").run(
      saleId, item.batch_id, item.quantity, item.unit_price, item.total_price
    );
    db.prepare("UPDATE pharmacy_batches SET current_stock = current_stock - ? WHERE id = ?").run(item.quantity, item.batch_id);
  });
  
  res.json({ id: saleId });
});

router.get("/stock-alerts", (req, res) => {
  const hospitalId = req.query.hospitalId;
  const alerts = db.prepare(`
    SELECT i.name, b.batch_number, b.current_stock, b.expiry_date 
    FROM pharmacy_batches b 
    JOIN pharmacy_items i ON b.item_id = i.id 
    WHERE i.hospital_id = ? AND (b.current_stock < 10 OR b.expiry_date < date('now', '+3 months'))
  `).all(hospitalId);
  res.json(alerts);
});

export default router;
