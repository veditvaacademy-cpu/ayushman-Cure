import { Router } from "express";
import db from "../db.js";

const router = Router();

router.get("/", (req, res) => {
  const hospitalId = req.query.hospitalId;
  const ambulances = db.prepare("SELECT * FROM ambulances WHERE hospital_id = ?").all(hospitalId);
  res.json(ambulances);
});

router.get("/bookings", (req, res) => {
  const hospitalId = req.query.hospitalId;
  const bookings = db.prepare(`
    SELECT b.*, p.name as patient_name, a.vehicle_number 
    FROM ambulance_bookings b 
    LEFT JOIN patients p ON b.patient_id = p.id 
    LEFT JOIN ambulances a ON b.ambulance_id = a.id 
    WHERE b.hospital_id = ?
    ORDER BY b.booking_time DESC
  `).all(hospitalId);
  res.json(bookings);
});

router.post("/bookings", (req, res) => {
  const { hospital_id, patient_id, pickup_location, destination, fare } = req.body;
  const info = db.prepare(`
    INSERT INTO ambulance_bookings (hospital_id, patient_id, pickup_location, destination, fare) 
    VALUES (?, ?, ?, ?, ?)
  `).run(
    hospital_id, patient_id, pickup_location, destination, fare
  );
  res.json({ id: info.lastInsertRowid });
});

export default router;
