import { Router } from "express";
import db from "../db.js";

const router = Router();

router.get("/", (req, res) => {
  const hospitalId = req.query.hospitalId;
  const patients = db.prepare("SELECT * FROM patients WHERE hospital_id = ?").all(hospitalId);
  res.json(patients);
});

router.post("/", (req, res) => {
  const { hospital_id, name, age, gender, address, mobile } = req.body;
  const patient_id_str = "PAT-" + Date.now();
  const info = db.prepare("INSERT INTO patients (hospital_id, patient_id_str, name, age, gender, address, mobile) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
    hospital_id, patient_id_str, name, age, gender, address, mobile
  );
  res.json({ id: info.lastInsertRowid, patient_id_str });
});

router.get("/:id", (req, res) => {
  const { id } = req.params;
  const patient = db.prepare("SELECT * FROM patients WHERE id = ?").get(id);
  if (!patient) return res.status(404).json({ error: "Patient not found" });
  res.json(patient);
});

router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { name, age, gender, address, mobile } = req.body;
  db.prepare("UPDATE patients SET name = ?, age = ?, gender = ?, address = ?, mobile = ? WHERE id = ?").run(
    name, age, gender, address, mobile, id
  );
  res.json({ success: true });
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM patients WHERE id = ?").run(id);
  res.json({ success: true });
});

router.get("/:id/overview", (req, res) => {
  const { id } = req.params;
  const patient = db.prepare("SELECT * FROM patients WHERE id = ?").get(id);
  if (!patient) return res.status(404).json({ error: "Patient not found" });

  const admission = db.prepare(`
    SELECT a.*, b.ward_name, b.bed_number 
    FROM ipd_admissions a 
    JOIN beds b ON a.bed_id = b.id 
    WHERE a.patient_id = ? AND a.status = 'Admitted'
    LIMIT 1
  `).get(id);

  const vitals = admission ? db.prepare("SELECT * FROM ipd_vitals WHERE admission_id = ? ORDER BY recorded_at DESC LIMIT 5").all((admission as any).id) : [];
  const medications = admission ? db.prepare("SELECT * FROM ipd_medications WHERE admission_id = ? AND status = 'Active' ORDER BY start_date DESC LIMIT 5").all((admission as any).id) : [];
  const prescriptions = db.prepare("SELECT * FROM prescriptions WHERE patient_id = ? ORDER BY created_at DESC LIMIT 5").all(id);
  
  const opdVitals = db.prepare(`
    SELECT vitals_temp, vitals_bp, vitals_pulse, vitals_spo2, vitals_weight, vitals_height, vitals_bmi, vitals_rr, visit_date
    FROM opd_visits 
    WHERE patient_id = ? AND vitals_temp IS NOT NULL
    ORDER BY visit_date DESC 
    LIMIT 1
  `).get(id);

  // Mock financial data
  const financial = {
    credit_limit: 20000,
    used_credit: 5026.43,
    balance: 14973.57,
    billing: {
      pathology: { paid: 1601, total: 2892.88 },
      radiology: { paid: 2563, total: 4159.80 },
      blood_bank: { paid: 2491.75, total: 2707.65 },
      ambulance: { paid: 1707.75, total: 1707.75 }
    }
  };

  res.json({
    patient,
    admission,
    vitals,
    opdVitals,
    medications,
    prescriptions,
    financial
  });
});

export default router;
