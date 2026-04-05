import { Router } from "express";
import db from "../db.js";

const router = Router();

router.get("/dashboard-stats", (req, res) => {
  const hospitalId = req.query.hospitalId;
  
  const stats = {
    opd_today: db.prepare("SELECT COUNT(*) as count FROM opd_visits WHERE hospital_id = ? AND date(visit_date) = date('now')").get(hospitalId),
    ipd_current: db.prepare("SELECT COUNT(*) as count FROM ipd_admissions WHERE hospital_id = ? AND status = 'Admitted'").get(hospitalId),
    pharmacy_sales_today: db.prepare("SELECT SUM(total_amount) as total FROM pharmacy_sales WHERE hospital_id = ? AND date(sale_date) = date('now')").get(hospitalId),
    appointments_today: db.prepare("SELECT COUNT(*) as count FROM appointments WHERE hospital_id = ? AND date(appointment_date) = date('now')").get(hospitalId),
    beds_available: db.prepare("SELECT COUNT(*) as count FROM beds WHERE hospital_id = ? AND status = 'Available'").get(hospitalId),
    ot_today: db.prepare("SELECT COUNT(*) as count FROM ot_schedules WHERE hospital_id = ? AND date(scheduled_at) = date('now')").get(hospitalId),
    lab_pending: db.prepare("SELECT COUNT(*) as count FROM lab_requests WHERE hospital_id = ? AND status = 'Pending'").get(hospitalId),
    rad_pending: db.prepare("SELECT COUNT(*) as count FROM radiology_requests WHERE hospital_id = ? AND status = 'Pending'").get(hospitalId)
  };
  
  res.json(stats);
});

router.get("/revenue", (req, res) => {
  const hospitalId = req.query.hospitalId;
  const revenue = db.prepare(`
    SELECT date(sale_date) as date, SUM(total_amount) as amount 
    FROM pharmacy_sales 
    WHERE hospital_id = ? 
    GROUP BY date(sale_date) 
    ORDER BY date DESC 
    LIMIT 30
  `).all(hospitalId);
  res.json(revenue);
});

export default router;
