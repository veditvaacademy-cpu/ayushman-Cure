import { Router } from "express";
import db from "../db.js";

const router = Router();

// Beneficiary Search (Mock BIS)
router.get("/beneficiaries/search", (req, res) => {
  const { type, value } = req.query;
  // In a real app, this would call PM-JAY BIS API
  // For now, we return mock data
  const mockBeneficiaries = [
    {
      pmjay_id: "PMJAY-123456",
      name: "Rajesh Kumar",
      age: 45,
      gender: "Male",
      family_id: "FAM-998877",
      ekyc_status: "Verified",
      card_status: "Active"
    },
    {
      pmjay_id: "PMJAY-789012",
      name: "Sunita Devi",
      age: 38,
      gender: "Female",
      family_id: "FAM-998877",
      ekyc_status: "Verified",
      card_status: "Active"
    }
  ];
  
  res.json(mockBeneficiaries.filter(b => 
    (type === 'pmjay_id' && b.pmjay_id === value) ||
    (type === 'family_id' && b.family_id === value) ||
    (type === 'aadhaar' && value === '123412341234') // Mock Aadhaar match
  ));
});

// Registration
router.post("/register", (req, res) => {
  const { hospital_id, patient_id, pmjay_id, family_id } = req.body;
  try {
    const info = db.prepare(`
      INSERT INTO ayushman_registrations (hospital_id, patient_id, pmjay_id, family_id)
      VALUES (?, ?, ?, ?)
    `).run(hospital_id, patient_id, pmjay_id, family_id);
    
    db.prepare("INSERT INTO ayushman_audit_logs (hospital_id, action_type, details) VALUES (?, ?, ?)").run(
      hospital_id, 'Registration', `Patient ${patient_id} registered with PMJAY ID ${pmjay_id}`
    );
    
    res.json({ id: info.lastInsertRowid });
  } catch (error) {
    res.status(400).json({ error: "Patient already registered or invalid data" });
  }
});

router.get("/registrations", (req, res) => {
  const hospitalId = req.query.hospitalId;
  const data = db.prepare(`
    SELECT r.*, p.name as patient_name, p.patient_id_str
    FROM ayushman_registrations r
    JOIN patients p ON r.patient_id = p.id
    WHERE r.hospital_id = ?
  `).all(hospitalId);
  res.json(data);
});

// Packages
router.get("/packages", (req, res) => {
  const packages = db.prepare("SELECT * FROM ayushman_packages").all();
  res.json(packages);
});

// Pre-Auth
router.get("/pre-auths", (req, res) => {
  const hospitalId = req.query.hospitalId;
  const data = db.prepare(`
    SELECT pa.*, p.name as patient_name, pkg.package_name, pkg.package_code
    FROM ayushman_pre_auths pa
    JOIN ayushman_registrations r ON pa.registration_id = r.id
    JOIN patients p ON r.patient_id = p.id
    JOIN ayushman_packages pkg ON pa.package_id = pkg.id
    WHERE pa.hospital_id = ?
    ORDER BY pa.request_date DESC
  `).all(hospitalId);
  res.json(data);
});

router.post("/pre-auths", (req, res) => {
  const { hospital_id, registration_id, package_id, requested_amount, clinical_notes, documents_json } = req.body;
  const info = db.prepare(`
    INSERT INTO ayushman_pre_auths (hospital_id, registration_id, package_id, requested_amount, clinical_notes, documents_json)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(hospital_id, registration_id, package_id, requested_amount, clinical_notes, documents_json);
  
  res.json({ id: info.lastInsertRowid });
});

// Claims
router.get("/claims", (req, res) => {
  const hospitalId = req.query.hospitalId;
  const data = db.prepare(`
    SELECT c.*, p.name as patient_name, pa.approval_number, pkg.package_name
    FROM ayushman_claims c
    JOIN ayushman_pre_auths pa ON c.pre_auth_id = pa.id
    JOIN ayushman_registrations r ON pa.registration_id = r.id
    JOIN patients p ON r.patient_id = p.id
    JOIN ayushman_packages pkg ON pa.package_id = pkg.id
    WHERE c.hospital_id = ?
    ORDER BY c.submission_date DESC
  `).all(hospitalId);
  res.json(data);
});

router.post("/claims", (req, res) => {
  const { hospital_id, pre_auth_id, claim_number, claim_amount } = req.body;
  const info = db.prepare(`
    INSERT INTO ayushman_claims (hospital_id, pre_auth_id, claim_number, claim_amount)
    VALUES (?, ?, ?, ?)
  `).run(hospital_id, pre_auth_id, claim_number, claim_amount);
  
  res.json({ id: info.lastInsertRowid });
});

export default router;
