import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("hms.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS hospitals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT,
    config TEXT -- JSON string for enabled features
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    name TEXT NOT NULL,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
  );

  CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL,
    patient_id_str TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    age INTEGER,
    gender TEXT,
    address TEXT,
    mobile TEXT,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
  );

  CREATE TABLE IF NOT EXISTS doctors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    schedule TEXT, -- JSON string
    consultation_fee REAL DEFAULT 0,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
  );

  // Ensure consultation_fee exists in doctors table
  try {
    db.prepare("ALTER TABLE doctors ADD COLUMN consultation_fee REAL DEFAULT 0").run();
  } catch (e) {
    // Column already exists
  }

  CREATE TABLE IF NOT EXISTS opd_visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL,
    patient_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    visit_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    token_number INTEGER,
    symptoms TEXT,
    diagnosis TEXT,
    prescription TEXT,
    notes TEXT,
    status TEXT DEFAULT 'Waiting', -- Waiting, In-Progress, Completed
    fee_amount REAL DEFAULT 0,
    payment_status TEXT DEFAULT 'Unpaid', -- Paid, Unpaid, Pending
    vitals_temp TEXT,
    vitals_bp TEXT,
    vitals_pulse TEXT,
    vitals_spo2 TEXT,
    vitals_weight TEXT,
    vitals_height TEXT,
    vitals_bmi TEXT,
    vitals_rr TEXT,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
  );

  CREATE TABLE IF NOT EXISTS beds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL,
    ward_name TEXT NOT NULL,
    bed_number TEXT NOT NULL,
    type TEXT NOT NULL, -- General, Private, ICU
    status TEXT DEFAULT 'Available', -- Available, Occupied
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
  );

  CREATE TABLE IF NOT EXISTS ipd_admissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL,
    patient_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    bed_id INTEGER NOT NULL,
    admission_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    admission_note TEXT,
    treatment_plan TEXT,
    surgery_notes TEXT,
    status TEXT DEFAULT 'Admitted', -- Admitted, Discharged
    discharge_date DATETIME,
    discharge_summary TEXT,
    risk_code TEXT DEFAULT 'GREEN',
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    FOREIGN KEY (bed_id) REFERENCES beds(id)
  );

  CREATE TABLE IF NOT EXISTS ipd_vitals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admission_id INTEGER NOT NULL,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    temp TEXT,
    bp TEXT,
    pulse TEXT,
    spO2 TEXT,
    respiration TEXT,
    FOREIGN KEY (admission_id) REFERENCES ipd_admissions(id)
  );

  CREATE TABLE IF NOT EXISTS ipd_nursing_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admission_id INTEGER NOT NULL,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    note TEXT,
    FOREIGN KEY (admission_id) REFERENCES ipd_admissions(id)
  );

  CREATE TABLE IF NOT EXISTS ipd_consultant_rounds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admission_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    round_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (admission_id) REFERENCES ipd_admissions(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
  );

  CREATE TABLE IF NOT EXISTS ipd_medications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admission_id INTEGER NOT NULL,
    medicine_name TEXT NOT NULL,
    dosage TEXT,
    frequency TEXT,
    start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_date DATETIME,
    status TEXT DEFAULT 'Active',
    FOREIGN KEY (admission_id) REFERENCES ipd_admissions(id)
  );

  CREATE TABLE IF NOT EXISTS pharmacy_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    generic_name TEXT,
    category TEXT, -- Tablet, Syrup, Injection, etc.
    uom TEXT, -- Unit of Measure (Strip, Bottle, etc.)
    is_narcotic INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 10,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
  );

  CREATE TABLE IF NOT EXISTS pharmacy_suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    contact_person TEXT,
    mobile TEXT,
    email TEXT,
    address TEXT,
    gstin TEXT,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
  );

  CREATE TABLE IF NOT EXISTS pharmacy_batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    batch_number TEXT NOT NULL,
    expiry_date DATE NOT NULL,
    mrp REAL NOT NULL,
    purchase_price REAL,
    gst_percent REAL DEFAULT 12,
    current_stock INTEGER DEFAULT 0,
    FOREIGN KEY (item_id) REFERENCES pharmacy_items(id)
  );

  CREATE TABLE IF NOT EXISTS pharmacy_purchase_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL,
    supplier_id INTEGER NOT NULL,
    po_number TEXT UNIQUE NOT NULL,
    po_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'Pending', -- Pending, Received, Cancelled
    total_amount REAL,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (supplier_id) REFERENCES pharmacy_suppliers(id)
  );

  CREATE TABLE IF NOT EXISTS pharmacy_purchase_order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    po_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL,
    FOREIGN KEY (po_id) REFERENCES pharmacy_purchase_orders(id),
    FOREIGN KEY (item_id) REFERENCES pharmacy_items(id)
  );

  CREATE TABLE IF NOT EXISTS pharmacy_grn (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL,
    po_id INTEGER,
    supplier_id INTEGER NOT NULL,
    grn_number TEXT UNIQUE NOT NULL,
    grn_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    invoice_number TEXT,
    invoice_date DATE,
    total_amount REAL,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (po_id) REFERENCES pharmacy_purchase_orders(id),
    FOREIGN KEY (supplier_id) REFERENCES pharmacy_suppliers(id)
  );

  CREATE TABLE IF NOT EXISTS pharmacy_dispensing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL,
    patient_id INTEGER, -- Optional, can be walk-in
    visit_id INTEGER, -- Linked to OPD
    admission_id INTEGER, -- Linked to IPD
    bill_number TEXT UNIQUE NOT NULL,
    bill_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_amount REAL,
    discount REAL DEFAULT 0,
    net_amount REAL,
    payment_status TEXT DEFAULT 'Paid',
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (visit_id) REFERENCES opd_visits(id),
    FOREIGN KEY (admission_id) REFERENCES ipd_admissions(id)
  );

  CREATE TABLE IF NOT EXISTS pharmacy_dispensing_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dispensing_id INTEGER NOT NULL,
    batch_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    total_price REAL NOT NULL,
    FOREIGN KEY (dispensing_id) REFERENCES pharmacy_dispensing(id),
    FOREIGN KEY (batch_id) REFERENCES pharmacy_batches(id)
  );

  CREATE TABLE IF NOT EXISTS pharmacy_narcotics_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    batch_id INTEGER NOT NULL,
    action_type TEXT NOT NULL, -- Dispensed, Received, Returned
    quantity INTEGER NOT NULL,
    reference_id INTEGER, -- ID of dispensing or GRN
    performed_by INTEGER,
    log_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (item_id) REFERENCES pharmacy_items(id),
    FOREIGN KEY (batch_id) REFERENCES pharmacy_batches(id)
  );

  CREATE TABLE IF NOT EXISTS pharmacy_returns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL,
    dispensing_id INTEGER NOT NULL,
    return_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    total_refund REAL,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (dispensing_id) REFERENCES pharmacy_dispensing(id)
  );

  CREATE TABLE IF NOT EXISTS ot_rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT, -- Major, Minor, Cardiac, etc.
    status TEXT DEFAULT 'Available', -- Available, Occupied, Maintenance
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
  );

  CREATE TABLE IF NOT EXISTS ot_bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL,
    patient_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    room_id INTEGER NOT NULL,
    surgery_name TEXT NOT NULL,
    scheduled_at DATETIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    status TEXT DEFAULT 'Scheduled', -- Scheduled, In-Progress, Completed, Cancelled
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    FOREIGN KEY (room_id) REFERENCES ot_rooms(id)
  );

  CREATE TABLE IF NOT EXISTS ot_assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    fitness_status TEXT,
    vitals_json TEXT,
    investigations_json TEXT,
    notes TEXT,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES ot_bookings(id)
  );

  CREATE TABLE IF NOT EXISTS ot_anesthesia_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    anesthesiologist_id INTEGER,
    type TEXT,
    medications_json TEXT,
    vitals_monitoring_json TEXT,
    notes TEXT,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES ot_bookings(id),
    FOREIGN KEY (anesthesiologist_id) REFERENCES doctors(id)
  );

  CREATE TABLE IF NOT EXISTS ot_intra_op_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    surgeon_id INTEGER,
    procedure_details TEXT,
    findings TEXT,
    complications TEXT,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES ot_bookings(id),
    FOREIGN KEY (surgeon_id) REFERENCES doctors(id)
  );

  CREATE TABLE IF NOT EXISTS ot_post_op_care (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    recovery_status TEXT,
    vitals_json TEXT,
    instructions TEXT,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES ot_bookings(id)
  );

  CREATE TABLE IF NOT EXISTS ot_inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- Surgical Kit, Disposable, Anesthesia Drug, Suture, Implant
    uom TEXT,
    current_stock INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 5,
    unit_price REAL DEFAULT 0,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
  );

  CREATE TABLE IF NOT EXISTS ot_consumable_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    total_price REAL NOT NULL,
    FOREIGN KEY (booking_id) REFERENCES ot_bookings(id),
    FOREIGN KEY (item_id) REFERENCES ot_inventory(id)
  );

  CREATE TABLE IF NOT EXISTS ot_infection_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    action_type TEXT NOT NULL, -- Sterilization, Fumigation, Cleaning
    performed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    performed_by TEXT,
    notes TEXT,
    FOREIGN KEY (room_id) REFERENCES ot_rooms(id)
  );

  CREATE TABLE IF NOT EXISTS nursing_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admission_id INTEGER NOT NULL,
    task_type TEXT NOT NULL, -- Dressing, Nebulization, Injection, IV management, Monitoring
    scheduled_at DATETIME NOT NULL,
    completed_at DATETIME,
    performed_by TEXT,
    status TEXT DEFAULT 'Pending', -- Pending, Completed, Overdue
    notes TEXT,
    FOREIGN KEY (admission_id) REFERENCES ipd_admissions(id)
  );

  CREATE TABLE IF NOT EXISTS nursing_medication_administration (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    medication_id INTEGER NOT NULL,
    scheduled_at DATETIME NOT NULL,
    administered_at DATETIME,
    administered_by TEXT,
    status TEXT DEFAULT 'Pending', -- Pending, Administered, Overdue, Skipped
    notes TEXT,
    FOREIGN KEY (medication_id) REFERENCES ipd_medications(id)
  );

  CREATE TABLE IF NOT EXISTS nursing_shifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL,
    ward_name TEXT NOT NULL,
    shift_name TEXT NOT NULL, -- Morning, Evening, Night
    nurse_name TEXT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
  );

  CREATE TABLE IF NOT EXISTS lab_test_catalog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- Hematology, Biochemistry, etc.
    reference_range TEXT,
    unit TEXT,
    price REAL DEFAULT 0,
    is_group INTEGER DEFAULT 0,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
  );

  CREATE TABLE IF NOT EXISTS lab_group_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    test_id INTEGER NOT NULL,
    FOREIGN KEY (group_id) REFERENCES lab_test_catalog(id),
    FOREIGN KEY (test_id) REFERENCES lab_test_catalog(id)
  );

  CREATE TABLE IF NOT EXISTS lab_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL,
    patient_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    visit_id INTEGER, -- OPD
    admission_id INTEGER, -- IPD
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'Pending', -- Pending, Collected, Processing, Completed, Cancelled
    priority TEXT DEFAULT 'Routine', -- Routine, Urgent, STAT
    notes TEXT,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    FOREIGN KEY (visit_id) REFERENCES opd_visits(id),
    FOREIGN KEY (admission_id) REFERENCES ipd_admissions(id)
  );

  CREATE TABLE IF NOT EXISTS lab_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    test_id INTEGER NOT NULL,
    result_value TEXT,
    is_abnormal INTEGER DEFAULT 0,
    performed_at DATETIME,
    performed_by TEXT,
    device_id TEXT, -- For device integration tracking
    FOREIGN KEY (order_id) REFERENCES lab_orders(id),
    FOREIGN KEY (test_id) REFERENCES lab_test_catalog(id)
  );

  CREATE TABLE IF NOT EXISTS radiology_test_catalog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    instructions TEXT,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
  );

  CREATE TABLE IF NOT EXISTS radiology_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL,
    patient_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    test_id INTEGER NOT NULL,
    status TEXT DEFAULT 'Pending',
    priority TEXT DEFAULT 'Routine',
    clinical_history TEXT,
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    FOREIGN KEY (test_id) REFERENCES radiology_test_catalog(id)
  );

  CREATE TABLE IF NOT EXISTS radiology_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    findings TEXT,
    impression TEXT,
    image_url TEXT,
    dicom_metadata TEXT,
    reported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reported_by TEXT,
    FOREIGN KEY (order_id) REFERENCES radiology_orders(id)
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL,
    patient_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    appointment_date TEXT NOT NULL,
    appointment_time TEXT NOT NULL,
    status TEXT DEFAULT 'Requested',
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
  );

  CREATE TABLE IF NOT EXISTS whatsapp_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL,
    patient_id INTEGER NOT NULL,
    phone_number TEXT NOT NULL,
    message_type TEXT NOT NULL,
    message_content TEXT NOT NULL,
    status TEXT DEFAULT 'Sent',
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (patient_id) REFERENCES patients(id)
  );

  CREATE TABLE IF NOT EXISTS emergency_patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL,
    patient_name TEXT NOT NULL,
    age INTEGER,
    gender TEXT,
    mobile TEXT,
    chief_complaint TEXT,
    triage_level TEXT NOT NULL, -- Red, Yellow, Green, Black
    arrival_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'Waiting', -- Waiting, Under Treatment, Admitted, Discharged, Expired
    vitals_hr INTEGER,
    vitals_bp TEXT,
    vitals_spo2 INTEGER,
    vitals_temp REAL,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
  );

  // Ensure mobile exists in emergency_patients table
  try {
    db.prepare("ALTER TABLE emergency_patients ADD COLUMN mobile TEXT").run();
  } catch (e) {
    // Column already exists
  }

  CREATE TABLE IF NOT EXISTS icu_vitals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    hr INTEGER,
    bp_sys INTEGER,
    bp_dia INTEGER,
    spo2 INTEGER,
    temp REAL,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES emergency_patients(id)
  );

  CREATE TABLE IF NOT EXISTS icu_equipment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- Ventilator, Monitor, Defibrillator, etc.
    status TEXT DEFAULT 'Available', -- In Use, Available, Maintenance
    assigned_to_patient_id INTEGER,
    last_service_date DATETIME,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
  );

  CREATE TABLE IF NOT EXISTS crash_cart_inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL,
    item_name TEXT NOT NULL,
    category TEXT NOT NULL, -- Medication, Airway, IV Access, etc.
    quantity INTEGER DEFAULT 0,
    min_quantity INTEGER DEFAULT 5,
    expiry_date DATE,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
  );

  CREATE TABLE IF NOT EXISTS prescription_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL,
    diagnosis TEXT NOT NULL,
    template_name TEXT NOT NULL,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
  );

  CREATE TABLE IF NOT EXISTS prescription_template_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL,
    medicine_name TEXT NOT NULL,
    dosage TEXT,
    frequency TEXT,
    duration TEXT,
    instructions TEXT,
    FOREIGN KEY (template_id) REFERENCES prescription_templates(id)
  );

  CREATE TABLE IF NOT EXISTS prescriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL,
    patient_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    visit_id INTEGER,
    admission_id INTEGER,
    diagnosis TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    doctor_signature TEXT, -- Base64
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
  );

  CREATE TABLE IF NOT EXISTS prescription_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prescription_id INTEGER NOT NULL,
    medicine_name TEXT NOT NULL,
    dosage TEXT,
    frequency TEXT,
    duration TEXT,
    instructions TEXT,
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id)
  );

  CREATE TABLE IF NOT EXISTS consultant_appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    patient_id INTEGER NOT NULL,
    appointment_date DATETIME NOT NULL,
    status TEXT DEFAULT 'Pending', -- Pending, Authorized, Completed, Cancelled
    referral_source TEXT,
    consultation_fee REAL,
    payment_status TEXT DEFAULT 'Unpaid',
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    FOREIGN KEY (patient_id) REFERENCES patients(id)
  );

  CREATE TABLE IF NOT EXISTS referrals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL,
    patient_id INTEGER NOT NULL,
    from_doctor_id INTEGER NOT NULL,
    to_specialty TEXT NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'Pending',
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (from_doctor_id) REFERENCES doctors(id)
  );

  CREATE TABLE IF NOT EXISTS ambulances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL,
    vehicle_number TEXT UNIQUE NOT NULL,
    driver_name TEXT NOT NULL,
    driver_mobile TEXT NOT NULL,
    status TEXT DEFAULT 'Available', -- Available, Busy, Maintenance
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
  );

  CREATE TABLE IF NOT EXISTS ambulance_bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL,
    patient_id INTEGER,
    pickup_location TEXT NOT NULL,
    destination TEXT NOT NULL,
    status TEXT DEFAULT 'Requested', -- Requested, Assigned, Enroute, Completed, Cancelled
    ambulance_id INTEGER,
    booking_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    completion_time DATETIME,
    fare REAL,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (ambulance_id) REFERENCES ambulances(id)
  );

  CREATE TABLE IF NOT EXISTS billing_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL,
    patient_id INTEGER NOT NULL,
    bill_number TEXT UNIQUE NOT NULL,
    bill_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_amount REAL NOT NULL,
    discount_amount REAL DEFAULT 0,
    tax_amount REAL DEFAULT 0,
    net_amount REAL NOT NULL,
    payment_status TEXT DEFAULT 'Unpaid', -- Unpaid, Partially Paid, Paid
    payment_mode TEXT, -- Cash, UPI, Debit/Credit, Insurance, Ayushman
    category TEXT NOT NULL, -- OPD, IPD, Pharmacy, Lab, Radiology, OT, ICU, Ambulance, Package
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (patient_id) REFERENCES patients(id)
  );

  CREATE TABLE IF NOT EXISTS billing_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    total_price REAL NOT NULL,
    category TEXT,
    FOREIGN KEY (bill_id) REFERENCES billing_records(id)
  );

  CREATE TABLE IF NOT EXISTS statutory_registers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL,
    type TEXT NOT NULL, -- Biomedical Waste, Infection Control, NABH, Fire Safety, Drug License, Controlled Substance
    entry_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    recorded_by TEXT,
    details_json TEXT,
    status TEXT DEFAULT 'Compliant',
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
  );

  CREATE TABLE IF NOT EXISTS birth_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL,
    patient_id INTEGER, -- Mother's ID
    baby_name TEXT,
    gender TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    time_of_birth TIME NOT NULL,
    weight_kg REAL,
    mother_name TEXT NOT NULL,
    father_name TEXT,
    address TEXT,
    doctor_id INTEGER NOT NULL,
    approval_status TEXT DEFAULT 'Pending',
    certificate_generated INTEGER DEFAULT 0,
    legal_registration_number TEXT,
    archived INTEGER DEFAULT 0,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
  );

  CREATE TABLE IF NOT EXISTS death_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL,
    patient_id INTEGER NOT NULL,
    date_of_death DATE NOT NULL,
    time_of_death TIME NOT NULL,
    cause_of_death TEXT,
    doctor_id INTEGER NOT NULL,
    approval_status TEXT DEFAULT 'Pending',
    certificate_generated INTEGER DEFAULT 0,
    legal_registration_number TEXT,
    archived INTEGER DEFAULT 0,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
  );

  CREATE TABLE IF NOT EXISTS discharge_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL,
    admission_id INTEGER NOT NULL,
    patient_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    discharge_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    discharge_summary TEXT,
    medications_json TEXT,
    billing_status TEXT DEFAULT 'Pending',
    follow_up_date DATE,
    follow_up_notes TEXT,
    status TEXT DEFAULT 'Draft',
    whatsapp_sent INTEGER DEFAULT 0,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (admission_id) REFERENCES ipd_admissions(id),
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
  );

  CREATE TABLE IF NOT EXISTS fire_extinguishers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL,
    location TEXT NOT NULL,
    type TEXT NOT NULL,
    capacity TEXT,
    last_service_date DATE,
    expiry_date DATE,
    amc_provider TEXT,
    amc_expiry DATE,
    status TEXT DEFAULT 'Functional',
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
  );

  CREATE TABLE IF NOT EXISTS facility_maintenance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL,
    asset_type TEXT NOT NULL, -- Lift, Electrical, Generator, Plumbing, HVAC
    asset_name TEXT NOT NULL,
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    maintenance_type TEXT,
    performed_by TEXT,
    notes TEXT,
    status TEXT DEFAULT 'Operational',
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
  );

  CREATE TABLE IF NOT EXISTS safety_incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL,
    incident_type TEXT NOT NULL,
    description TEXT,
    location TEXT,
    incident_date DATE,
    incident_time TIME,
    reported_by TEXT,
    severity TEXT,
    action_taken TEXT,
    status TEXT DEFAULT 'Open',
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
  );

  CREATE TABLE IF NOT EXISTS cctv_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL,
    camera_location TEXT NOT NULL,
    log_date DATE DEFAULT CURRENT_DATE,
    checked_by TEXT,
    status TEXT DEFAULT 'Normal',
    notes TEXT,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
  );

  CREATE TABLE IF NOT EXISTS discharges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL,
    admission_id INTEGER NOT NULL,
    patient_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    discharge_date DATE DEFAULT CURRENT_DATE,
    discharge_summary TEXT,
    medications_json TEXT, -- JSON array of medications
    billing_status TEXT DEFAULT 'Pending',
    follow_up_date DATE,
    follow_up_notes TEXT,
    status TEXT DEFAULT 'Finalized',
    whatsapp_sent INTEGER DEFAULT 0,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (admission_id) REFERENCES ipd_admissions(id),
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
  );
`);

// Ensure risk_code exists (migration for existing DB)
try {
  db.exec("ALTER TABLE ipd_admissions ADD COLUMN risk_code TEXT DEFAULT 'GREEN'");
} catch (e) {
  // Column might already exist
}

// Seed Super Admin if not exists
const sadmin = db.prepare("SELECT * FROM users WHERE username = ?").get("sadmin");
if (!sadmin) {
  db.prepare("INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)").run(
    "sadmin",
    "12345",
    "SUPER_ADMIN",
    "Amitabh Singh"
  );
}

// Seed a default hospital and admin
let hospitalId: number | bigint;
const existingHospital = db.prepare("SELECT * FROM hospitals WHERE name = ?").get("City Care Multispeciality Hospital");
if (!existingHospital) {
  const info = db.prepare("INSERT INTO hospitals (name, address, config) VALUES (?, ?, ?)").run(
    "City Care Multispeciality Hospital",
    "Sector 15, Gurgaon, Haryana",
    JSON.stringify({ opd: true, accountant: true, lab: true, pathology: true, radiology: true, medicine: true, nurse: true, doctor: true, director: true, administration: true })
  );
  hospitalId = info.lastInsertRowid;
} else {
  hospitalId = (existingHospital as any).id;
}

// Seed Ambulances
const ambulances = db.prepare("SELECT COUNT(*) as count FROM ambulances WHERE hospital_id = ?").get(hospitalId) as any;
if (ambulances.count === 0) {
  const insertAmbulance = db.prepare("INSERT INTO ambulances (hospital_id, vehicle_number, driver_name, driver_mobile) VALUES (?, ?, ?, ?)");
  insertAmbulance.run(hospitalId, "HR-26-AB-1234", "Rajesh Kumar", "9876543210");
  insertAmbulance.run(hospitalId, "HR-26-CD-5678", "Suresh Singh", "9876543211");
  insertAmbulance.run(hospitalId, "HR-26-EF-9012", "Amit Sharma", "9876543212");
}

// Ensure admin user exists and is linked to the hospital
const adminUser = db.prepare("SELECT * FROM users WHERE username = ?").get("admin");
if (!adminUser) {
  db.prepare("INSERT INTO users (hospital_id, username, password, role, name) VALUES (?, ?, ?, ?, ?)").run(
    hospitalId,
    "admin",
    "12345",
    "ADMIN",
    "Rajesh Kumar"
  );
} else {
  db.prepare("UPDATE users SET hospital_id = ?, name = ? WHERE username = ?").run(hospitalId, "Rajesh Kumar", "admin");
}

// Seed additional role-based users for testing
const testUsers = [
  { username: 'doctor', role: 'DOCTOR', name: 'Dr. Anjali Sharma' },
  { username: 'nurse', role: 'NURSE', name: 'Nurse Meenakshi' },
  { username: 'nurse1', role: 'NURSE', name: 'Nurse Sarita' },
  { username: 'nurse2', role: 'NURSE', name: 'Nurse Mukesh' },
  { username: 'nurse3', role: 'NURSE', name: 'Nurse Ekta' },
  { username: 'nurse4', role: 'NURSE', name: 'Nurse Deepak' },
  { username: 'lab', role: 'LAB_TECH', name: 'Lalit Lab' },
  { username: 'radio', role: 'RADIO_TECH', name: 'Ravi Radio' },
  { username: 'pharmacy', role: 'PHARMACY', name: 'Priya Pharmacy' },
  { username: 'billing', role: 'BILLING', name: 'Bina Billing' },
  { username: 'reception', role: 'RECEPTION', name: 'Rohan Reception' },
  { username: 'ot', role: 'OT_COORDINATOR', name: 'Om OT' },
  { username: 'hr', role: 'HR_ADMIN', name: 'Hari HR' },
  { username: 'ambulance', role: 'AMBULANCE_OPERATOR', name: 'Arun Ambulance' },
];

testUsers.forEach(u => {
  const exists = db.prepare("SELECT * FROM users WHERE username = ?").get(u.username);
  if (!exists) {
    db.prepare("INSERT INTO users (hospital_id, username, password, role, name) VALUES (?, ?, ?, ?, ?)").run(
      hospitalId,
      u.username,
      "12345",
      u.role,
      u.name
    );
  } else {
    db.prepare("UPDATE users SET name = ? WHERE username = ?").run(u.name, u.username);
  }
});

// Seed some doctors if none exist for this hospital
const doctorCount = db.prepare("SELECT COUNT(*) as count FROM doctors WHERE hospital_id = ?").get(hospitalId);
if ((doctorCount as any).count === 0) {
  db.prepare("INSERT INTO doctors (hospital_id, name, department, schedule) VALUES (?, ?, ?, ?)").run(hospitalId, "Dr. Anjali Sharma", "General Medicine", "Mon-Sat, 10am-2pm");
  db.prepare("INSERT INTO doctors (hospital_id, name, department, schedule) VALUES (?, ?, ?, ?)").run(hospitalId, "Dr. Vikram Mehta", "Pediatrics", "Mon-Fri, 4pm-8pm");
  db.prepare("INSERT INTO doctors (hospital_id, name, department, schedule) VALUES (?, ?, ?, ?)").run(hospitalId, "Dr. Sneha Kapoor", "Pathology", "Mon-Sat, 9am-6pm");
  db.prepare("INSERT INTO doctors (hospital_id, name, department, schedule) VALUES (?, ?, ?, ?)").run(hospitalId, "Dr. Rajesh Kumar", "Orthopedics", "Mon-Sat, 11am-3pm");
  db.prepare("INSERT INTO doctors (hospital_id, name, department, schedule) VALUES (?, ?, ?, ?)").run(hospitalId, "Dr. Kavita Iyer", "Gynaecology", "Mon-Sat, 2pm-6pm");

  // Seed some beds
  const bedCount = db.prepare("SELECT COUNT(*) as count FROM beds WHERE hospital_id = ?").get(hospitalId);
  if ((bedCount as any).count === 0) {
    const wards = [
      { name: 'General Ward A', type: 'General', count: 5 },
      { name: 'Private Ward B', type: 'Private', count: 3 },
      { name: 'ICU', type: 'ICU', count: 2 }
    ];
    wards.forEach(ward => {
      for (let i = 1; i <= ward.count; i++) {
        db.prepare("INSERT INTO beds (hospital_id, ward_name, bed_number, type) VALUES (?, ?, ?, ?)").run(
          hospitalId, ward.name, `${ward.name[0]}${i}`, ward.type
        );
      }
    });
  }

  // Seed Pharmacy Items
  const pharmacyItemCount = db.prepare("SELECT COUNT(*) as count FROM pharmacy_items WHERE hospital_id = ?").get(hospitalId);
  if ((pharmacyItemCount as any).count === 0) {
    const items = [
      { name: 'Paracetamol 500mg', generic: 'Paracetamol', category: 'Tablet', uom: 'Strip', narcotic: 0 },
      { name: 'Amoxicillin 250mg', generic: 'Amoxicillin', category: 'Capsule', uom: 'Strip', narcotic: 0 },
      { name: 'Morphine 10mg', generic: 'Morphine', category: 'Injection', uom: 'Ampoule', narcotic: 1 },
      { name: 'Cough Syrup', generic: 'Dextromethorphan', category: 'Syrup', uom: 'Bottle', narcotic: 0 }
    ];
    items.forEach(item => {
      const info = db.prepare("INSERT INTO pharmacy_items (hospital_id, name, generic_name, category, uom, is_narcotic) VALUES (?, ?, ?, ?, ?, ?)").run(
        hospitalId, item.name, item.generic, item.category, item.uom, item.narcotic
      );
      // Add a batch for each
      db.prepare("INSERT INTO pharmacy_batches (item_id, batch_number, expiry_date, mrp, purchase_price, current_stock) VALUES (?, ?, ?, ?, ?, ?)").run(
        info.lastInsertRowid, 'B123', '2027-12-31', 50, 30, 100
      );
    });

    db.prepare("INSERT INTO pharmacy_suppliers (hospital_id, name, contact_person, mobile) VALUES (?, ?, ?, ?)").run(
      hospitalId, 'Bharat Pharma Distributors', 'Suresh Gupta', '9988776655'
    );
  }

  // Seed ICU Equipment
  const equipmentCount = db.prepare("SELECT COUNT(*) as count FROM icu_equipment WHERE hospital_id = ?").get(hospitalId);
  if ((equipmentCount as any).count === 0) {
    const equipment = [
      { name: 'Ventilator V1', type: 'Ventilator' },
      { name: 'Patient Monitor M1', type: 'Monitor' },
      { name: 'Defibrillator D1', type: 'Defibrillator' },
      { name: 'Infusion Pump P1', type: 'Infusion Pump' }
    ];
    equipment.forEach(e => {
      db.prepare("INSERT INTO icu_equipment (hospital_id, name, type, status, last_service_date) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)").run(
        hospitalId, e.name, e.type, 'Available'
      );
    });
  }

  // Seed Crash Cart
  const crashCartCount = db.prepare("SELECT COUNT(*) as count FROM crash_cart_inventory WHERE hospital_id = ?").get(hospitalId);
  if ((crashCartCount as any).count === 0) {
    const items = [
      { name: 'Adrenaline', category: 'Medication', qty: 10, min: 5 },
      { name: 'Atropine', category: 'Medication', qty: 8, min: 4 },
      { name: 'Laryngoscope', category: 'Airway', qty: 2, min: 1 },
      { name: 'Endotracheal Tube 7.5', category: 'Airway', qty: 5, min: 2 },
      { name: 'IV Cannula 18G', category: 'IV Access', qty: 20, min: 10 }
    ];
    items.forEach(item => {
      db.prepare("INSERT INTO crash_cart_inventory (hospital_id, item_name, category, quantity, min_quantity, expiry_date) VALUES (?, ?, ?, ?, ?, '2026-12-31')").run(
        hospitalId, item.name, item.category, item.qty, item.min
      );
    });
  }

  // Seed some patients
  const patientCount = db.prepare("SELECT COUNT(*) as count FROM patients WHERE hospital_id = ?").get(hospitalId);
  if ((patientCount as any).count === 0) {
    const patients = [
      { name: "Rahul Deshmukh", age: 34, gender: "Male", mobile: "9876543210", address: "Mumbai, Maharashtra" },
      { name: "Priya Iyer", age: 28, gender: "Female", mobile: "9876543211", address: "Chennai, Tamil Nadu" },
      { name: "Sandeep Bansal", age: 45, gender: "Male", mobile: "9876543212", address: "Delhi, NCR" },
      { name: "Meera Nair", age: 52, gender: "Female", mobile: "9876543213", address: "Kochi, Kerala" },
      { name: "Arjun Singh", age: 25, gender: "Male", mobile: "9876543214", address: "Jaipur, Rajasthan" },
      { name: "Sunita Verma", age: 39, gender: "Female", mobile: "9876543215", address: "Lucknow, UP" },
      { name: "Vikram Rathore", age: 61, gender: "Male", mobile: "9876543216", address: "Ahmedabad, Gujarat" },
      { name: "Amit Patel", age: 32, gender: "Male", mobile: "9876543217", address: "Surat, Gujarat" },
      { name: "Deepa Reddy", age: 29, gender: "Female", mobile: "9876543218", address: "Hyderabad, Telangana" },
      { name: "Manoj Tiwari", age: 41, gender: "Male", mobile: "9876543219", address: "Patna, Bihar" },
      { name: "Kavita Rao", age: 35, gender: "Female", mobile: "9876543220", address: "Bangalore, Karnataka" },
      { name: "Suresh Raina", age: 38, gender: "Male", mobile: "9876543221", address: "Ghaziabad, UP" },
      { name: "Ananya Gupta", age: 24, gender: "Female", mobile: "9876543222", address: "Kolkata, West Bengal" }
    ];
    patients.forEach(p => {
      const pid = "PAT-" + Math.random().toString(36).substr(2, 6).toUpperCase();
      db.prepare("INSERT INTO patients (hospital_id, patient_id_str, name, age, gender, address, mobile) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
        hospitalId, pid, p.name, p.age, p.gender, p.address, p.mobile
      );
    });
  }

  // Seed Prescription Templates
  const templateCount = db.prepare("SELECT COUNT(*) as count FROM prescription_templates WHERE hospital_id = ?").get(hospitalId);
  if ((templateCount as any).count === 0) {
    const t1 = db.prepare("INSERT INTO prescription_templates (hospital_id, diagnosis, template_name) VALUES (?, 'Common Cold', 'Standard Cold Protocol')").run(hospitalId).lastInsertRowid;
    db.prepare("INSERT INTO prescription_template_items (template_id, medicine_name, dosage, frequency, duration, instructions) VALUES (?, 'Paracetamol 500mg', '1 Tab', 'TDS', '3 Days', 'After Food')").run(t1);
    db.prepare("INSERT INTO prescription_template_items (template_id, medicine_name, dosage, frequency, duration, instructions) VALUES (?, 'Cetirizine 10mg', '1 Tab', 'HS', '5 Days', 'At Bedtime')").run(t1);

    const t2 = db.prepare("INSERT INTO prescription_templates (hospital_id, diagnosis, template_name) VALUES (?, 'Hypertension', 'Initial HTN Management')").run(hospitalId).lastInsertRowid;
    db.prepare("INSERT INTO prescription_template_items (template_id, medicine_name, dosage, frequency, duration, instructions) VALUES (?, 'Amlodipine 5mg', '1 Tab', 'OD', '30 Days', 'Morning Empty Stomach')").run(t2);
    db.prepare("INSERT INTO prescription_template_items (template_id, medicine_name, dosage, frequency, duration, instructions) VALUES (?, 'Telmisartan 40mg', '1 Tab', 'OD', '30 Days', 'After Breakfast')").run(t2);
  }

  // Seed OT Rooms
  const otRoomCount = db.prepare("SELECT COUNT(*) as count FROM ot_rooms WHERE hospital_id = ?").get(hospitalId);
  if ((otRoomCount as any).count === 0) {
    db.prepare("INSERT INTO ot_rooms (hospital_id, name, type) VALUES (?, ?, ?)").run(hospitalId, "OT-01 (Major)", "Major");
    db.prepare("INSERT INTO ot_rooms (hospital_id, name, type) VALUES (?, ?, ?)").run(hospitalId, "OT-02 (Minor)", "Minor");
    db.prepare("INSERT INTO ot_rooms (hospital_id, name, type) VALUES (?, ?, ?)").run(hospitalId, "OT-03 (Cardiac)", "Cardiac");
  }

  // Ensure specific test patients exist
  const testPatients = [
    { name: "Amit Patel", age: 32, gender: "Male", mobile: "9876543217", address: "Surat, Gujarat" },
    { name: "Deepa Reddy", age: 29, gender: "Female", mobile: "9876543218", address: "Hyderabad, Telangana" },
    { name: "Manoj Tiwari", age: 41, gender: "Male", mobile: "9876543219", address: "Patna, Bihar" },
    { name: "Kavita Rao", age: 35, gender: "Female", mobile: "9876543220", address: "Bangalore, Karnataka" },
    { name: "Suresh Raina", age: 38, gender: "Male", mobile: "9876543221", address: "Ghaziabad, UP" },
    { name: "Ananya Gupta", age: 24, gender: "Female", mobile: "9876543222", address: "Kolkata, West Bengal" }
  ];

  testPatients.forEach(p => {
    const exists = db.prepare("SELECT * FROM patients WHERE name = ? AND mobile = ?").get(p.name, p.mobile);
    if (!exists) {
      const pid = "PAT-" + Math.random().toString(36).substr(2, 6).toUpperCase();
      db.prepare("INSERT INTO patients (hospital_id, patient_id_str, name, age, gender, address, mobile) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
        hospitalId, pid, p.name, p.age, p.gender, p.address, p.mobile
      );
    }
  });

  // Ensure specific test doctor exists
  const testDoctors = [
    { name: "Dr. Rajesh Kumar", dept: "Orthopedics", schedule: "Mon-Sat, 11am-3pm" },
    { name: "Dr. Kavita Iyer", dept: "Gynaecology", schedule: "Mon-Sat, 2pm-6pm" }
  ];

  testDoctors.forEach(d => {
    const exists = db.prepare("SELECT * FROM doctors WHERE name = ?").get(d.name);
    if (!exists) {
      db.prepare("INSERT INTO doctors (hospital_id, name, department, schedule) VALUES (?, ?, ?, ?)").run(hospitalId, d.name, d.dept, d.schedule);
    }
  });

  // Seed OT Inventory
  const otInvCount = db.prepare("SELECT COUNT(*) as count FROM ot_inventory WHERE hospital_id = ?").get(hospitalId);
  if ((otInvCount as any).count === 0) {
    const otItems = [
      { name: 'Surgical Kit - General', category: 'Surgical Kit', uom: 'Set', price: 1500 },
      { name: 'Disposable Gloves', category: 'Disposable', uom: 'Box', price: 200 },
      { name: 'Propofol 20ml', category: 'Anesthesia Drug', uom: 'Vial', price: 450 },
      { name: 'Vicryl 2-0 Suture', category: 'Suture', uom: 'Box', price: 800 },
      { name: 'Titanium Plate 4-hole', category: 'Implant', uom: 'Piece', price: 5000 }
    ];
    otItems.forEach(item => {
      db.prepare("INSERT INTO ot_inventory (hospital_id, name, category, uom, current_stock, unit_price) VALUES (?, ?, ?, ?, ?, ?)").run(
        hospitalId, item.name, item.category, item.uom, 50, item.price
      );
    });
  }

  // Seed Nursing Data
  const nursingShiftCount = db.prepare("SELECT COUNT(*) as count FROM nursing_shifts WHERE hospital_id = ?").get(hospitalId);
  if ((nursingShiftCount as any).count === 0) {
    db.prepare("INSERT INTO nursing_shifts (hospital_id, ward_name, shift_name, nurse_name, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)").run(
      hospitalId, "General Ward A", "Morning", "Nurse Meena", "2026-03-05T08:00:00", "2026-03-05T16:00:00"
    );
    db.prepare("INSERT INTO nursing_shifts (hospital_id, ward_name, shift_name, nurse_name, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)").run(
      hospitalId, "ICU", "Morning", "Nurse John", "2026-03-05T08:00:00", "2026-03-05T16:00:00"
    );

    // Create admissions for testing
    const availableBeds = db.prepare("SELECT id FROM beds WHERE status = 'Available' AND hospital_id = ? LIMIT 5").all(hospitalId);
    const patients = db.prepare("SELECT id FROM patients WHERE hospital_id = ? LIMIT 5").all(hospitalId);
    const doctor = db.prepare("SELECT id FROM doctors WHERE hospital_id = ?").get(hospitalId);

    if (patients.length > 0 && availableBeds.length > 0 && doctor) {
      patients.forEach((p: any, idx) => {
        if (availableBeds[idx]) {
          const bedId = (availableBeds[idx] as any).id;
          const admissionInfo = db.prepare(`
            INSERT INTO ipd_admissions (hospital_id, patient_id, doctor_id, bed_id, admission_note, risk_code)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(hospitalId, p.id, (doctor as any).id, bedId, "Test Admission " + (idx + 1), idx % 2 === 0 ? "GREEN" : "YELLOW");
          
          db.prepare("UPDATE beds SET status = 'Occupied' WHERE id = ?").run(bedId);
          
          // Add some tasks for the first one
          if (idx === 0) {
            const admissionId = admissionInfo.lastInsertRowid;
            db.prepare("INSERT INTO nursing_tasks (admission_id, task_type, scheduled_at, notes) VALUES (?, ?, ?, ?)").run(
              admissionId, "Monitoring", "2026-03-05T09:00:00", "Check vitals every hour"
            );
            db.prepare("INSERT INTO nursing_tasks (admission_id, task_type, scheduled_at, notes) VALUES (?, ?, ?, ?)").run(
              admissionId, "Injection", "2026-03-05T10:00:00", "Antibiotic dose"
            );
          }

          // Add some vitals for trend
          const now = new Date();
          for (let i = 0; i < 10; i++) {
            const time = new Date(now.getTime() - (10 - i) * 15 * 60000).toISOString();
            db.prepare(`
              INSERT INTO ipd_vitals (admission_id, recorded_at, temp, bp, pulse, spO2, respiration)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(admissionInfo.lastInsertRowid, time, "98.6", "120/80", (70 + Math.floor(Math.random() * 20)).toString(), (95 + Math.floor(Math.random() * 5)).toString(), "18");
          }
        }
      });
    }

    // Seed Lab Tests
    const labTestCount = db.prepare("SELECT COUNT(*) as count FROM lab_test_catalog WHERE hospital_id = ?").get(hospitalId);
    if ((labTestCount as any).count === 0) {
      const labTests = [
        { name: 'Hemoglobin (Hb)', category: 'Hematology', range: '13.5-17.5', unit: 'g/dL', price: 150 },
        { name: 'Total Leucocyte Count (TLC)', category: 'Hematology', range: '4000-11000', unit: '/cumm', price: 150 },
        { name: 'Blood Sugar - Random', category: 'Biochemistry', range: '70-140', unit: 'mg/dL', price: 100 },
        { name: 'Serum Creatinine', category: 'Biochemistry', range: '0.7-1.3', unit: 'mg/dL', price: 250 },
        { name: 'Serum Bilirubin - Total', category: 'Biochemistry', range: '0.1-1.2', unit: 'mg/dL', price: 200 },
        { name: 'C-Reactive Protein (CRP)', category: 'Immunology', range: '< 6', unit: 'mg/L', price: 600 },
        { name: 'Urine Culture & Sensitivity', category: 'Microbiology', range: 'No Growth', unit: '', price: 800 }
      ];
      labTests.forEach(test => {
        db.prepare("INSERT INTO lab_test_catalog (hospital_id, name, category, reference_range, unit, price) VALUES (?, ?, ?, ?, ?, ?)").run(
          hospitalId, test.name, test.category, test.range, test.unit, test.price
        );
      });
    }

    // Seed Sample Lab Orders
    const orderCount = db.prepare("SELECT COUNT(*) as count FROM lab_orders WHERE hospital_id = ?").get(hospitalId);
    if ((orderCount as any).count === 0) {
      const patient = db.prepare("SELECT id FROM patients WHERE hospital_id = ?").get(hospitalId);
      const doctor = db.prepare("SELECT id FROM doctors WHERE hospital_id = ?").get(hospitalId);
      const hbTest = db.prepare("SELECT id FROM lab_test_catalog WHERE name LIKE 'Hemoglobin%' AND hospital_id = ?").get(hospitalId);
      const sugarTest = db.prepare("SELECT id FROM lab_test_catalog WHERE name LIKE 'Blood Sugar%' AND hospital_id = ?").get(hospitalId);

      if (patient && doctor && hbTest && sugarTest) {
        const orderInfo = db.prepare(`
          INSERT INTO lab_orders (hospital_id, patient_id, doctor_id, priority, notes)
          VALUES (?, ?, ?, 'Routine', 'Routine checkup')
        `).run(hospitalId, (patient as any).id, (doctor as any).id);
        
        const orderId = orderInfo.lastInsertRowid;
        db.prepare("INSERT INTO lab_results (order_id, test_id, result_value, performed_at, performed_by) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)").run(
          orderId, (hbTest as any).id, "14.2", "Lab Tech"
        );
        db.prepare("INSERT INTO lab_results (order_id, test_id, result_value, performed_at, performed_by) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)").run(
          orderId, (sugarTest as any).id, "110", "Lab Tech"
        );
        db.prepare("UPDATE lab_orders SET status = 'Completed' WHERE id = ?").run(orderId);

        // Add some historical data for trends
        for (let i = 1; i <= 5; i++) {
          const date = new Date();
          date.setDate(date.getDate() - (i * 30));
          const histOrder = db.prepare(`
            INSERT INTO lab_orders (hospital_id, patient_id, doctor_id, order_date, status)
            VALUES (?, ?, ?, ?, 'Completed')
          `).run(hospitalId, (patient as any).id, (doctor as any).id, date.toISOString());
          
          db.prepare("INSERT INTO lab_results (order_id, test_id, result_value, performed_at, performed_by) VALUES (?, ?, ?, ?, ?)").run(
            histOrder.lastInsertRowid, (hbTest as any).id, (13 + Math.random() * 2).toFixed(1), date.toISOString(), "Lab Tech"
          );
        }
      }
    }

    // Seed Radiology Tests
    const radTestCount = db.prepare("SELECT COUNT(*) as count FROM radiology_test_catalog WHERE hospital_id = ?").get(hospitalId);
    if ((radTestCount as any).count === 0) {
      const radTests = [
        { name: 'Chest X-Ray PA View', category: 'X-Ray', price: 500, instructions: 'Remove metallic objects from chest area.' },
        { name: 'Ultrasound Whole Abdomen', category: 'Ultrasound', price: 1200, instructions: 'Full bladder required. 6 hours fasting.' },
        { name: 'ECG - 12 Lead', category: 'ECG', price: 300, instructions: 'Relax during the procedure.' },
        { name: 'CT Brain Plain', category: 'CT Scan', price: 3500, instructions: 'No specific preparation.' },
        { name: 'MRI Lumbar Spine', category: 'MRI', price: 7500, instructions: 'No metallic implants allowed.' }
      ];
      radTests.forEach(test => {
        db.prepare("INSERT INTO radiology_test_catalog (hospital_id, name, category, price, instructions) VALUES (?, ?, ?, ?, ?)").run(
          hospitalId, test.name, test.category, test.price, test.instructions
        );
      });
    }

    // Seed Sample Radiology Orders
    const radOrderCount = db.prepare("SELECT COUNT(*) as count FROM radiology_orders WHERE hospital_id = ?").get(hospitalId);
    if ((radOrderCount as any).count === 0) {
      const patient = db.prepare("SELECT id FROM patients WHERE hospital_id = ?").get(hospitalId);
      const doctor = db.prepare("SELECT id FROM doctors WHERE hospital_id = ?").get(hospitalId);
      const xrayTest = db.prepare("SELECT id FROM radiology_test_catalog WHERE name LIKE 'Chest X-Ray%' AND hospital_id = ?").get(hospitalId);

      if (patient && doctor && xrayTest) {
        const orderInfo = db.prepare(`
          INSERT INTO radiology_orders (hospital_id, patient_id, doctor_id, test_id, priority, clinical_history)
          VALUES (?, ?, ?, ?, 'Routine', 'Cough and fever for 3 days')
        `).run(hospitalId, (patient as any).id, (doctor as any).id, (xrayTest as any).id);
        
        const orderId = orderInfo.lastInsertRowid;
        db.prepare(`
          INSERT INTO radiology_results (order_id, findings, impression, image_url, dicom_metadata, reported_by)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          orderId,
          "Bilateral lung fields are clear. No evidence of focal consolidation or pleural effusion. Heart size is within normal limits.",
          "Normal Chest X-Ray.",
          "https://picsum.photos/seed/xray/800/800?grayscale",
          JSON.stringify({ Modality: "CR", PatientID: "P-101", StudyDate: "2024-03-06" }),
          "Dr. Radiologist"
        );
        db.prepare("UPDATE radiology_orders SET status = 'Completed' WHERE id = ?").run(orderId);
      }
    }
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT u.*, h.name as hospital_name FROM users u LEFT JOIN hospitals h ON u.hospital_id = h.id WHERE u.username = ? AND u.password = ?").get(username, password);
    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  });

  // Hospitals (Super Admin)
  app.get("/api/hospitals", (req, res) => {
    const hospitals = db.prepare("SELECT * FROM hospitals").all();
    res.json(hospitals);
  });

  app.post("/api/hospitals", (req, res) => {
    const { name, address, config } = req.body;
    const info = db.prepare("INSERT INTO hospitals (name, address, config) VALUES (?, ?, ?)").run(name, address, JSON.stringify(config));
    res.json({ id: info.lastInsertRowid });
  });

  // OPD Patients
  app.get("/api/patients", (req, res) => {
    const hospitalId = req.query.hospitalId;
    const patients = db.prepare("SELECT * FROM patients WHERE hospital_id = ?").all(hospitalId);
    res.json(patients);
  });

  app.post("/api/patients", (req, res) => {
    const { hospital_id, name, age, gender, address, mobile } = req.body;
    const patient_id_str = "PAT-" + Date.now();
    const info = db.prepare("INSERT INTO patients (hospital_id, patient_id_str, name, age, gender, address, mobile) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
      hospital_id, patient_id_str, name, age, gender, address, mobile
    );
    res.json({ id: info.lastInsertRowid, patient_id_str });
  });

  app.get("/api/patients/:id/overview", (req, res) => {
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

    // Mock financial data as per reference image
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

  // Doctors
  app.get("/api/doctors", (req, res) => {
    const hospitalId = req.query.hospitalId;
    const doctors = db.prepare("SELECT * FROM doctors WHERE hospital_id = ?").all(hospitalId);
    res.json(doctors);
  });

  app.post("/api/doctors", (req, res) => {
    const { hospital_id, name, department, schedule } = req.body;
    const info = db.prepare("INSERT INTO doctors (hospital_id, name, department, schedule) VALUES (?, ?, ?, ?)").run(
      hospital_id, name, department, schedule
    );
    res.json({ id: info.lastInsertRowid });
  });

  // OPD Visits
  app.get("/api/opd/visits", (req, res) => {
    const hospitalId = req.query.hospitalId;
    const visits = db.prepare(`
      SELECT v.*, p.name as patient_name, p.patient_id_str, d.name as doctor_name, d.consultation_fee
      FROM opd_visits v 
      JOIN patients p ON v.patient_id = p.id 
      JOIN doctors d ON v.doctor_id = d.id 
      WHERE v.hospital_id = ?
      ORDER BY v.visit_date DESC
    `).all(hospitalId);
    res.json(visits);
  });

  app.get("/api/opd/visits/:id", (req, res) => {
    const { id } = req.params;
    const visit = db.prepare(`
      SELECT v.*, p.name as patient_name, p.patient_id_str, p.age, p.gender, p.mobile, d.name as doctor_name, d.department, h.name as hospital_name, h.address as hospital_address
      FROM opd_visits v 
      JOIN patients p ON v.patient_id = p.id 
      JOIN doctors d ON v.doctor_id = d.id 
      JOIN hospitals h ON v.hospital_id = h.id
      WHERE v.id = ?
    `).get(id);
    res.json(visit);
  });

  app.post("/api/opd/visits", (req, res) => {
    const { 
      hospital_id, patient_id, doctor_id, symptoms, diagnosis, prescription, notes, fee_amount, payment_status,
      vitals_temp, vitals_bp, vitals_pulse, vitals_spo2, vitals_weight, vitals_height, vitals_bmi, vitals_rr
    } = req.body;
    
    // Simple token generation for the day
    const today = new Date().toISOString().split('T')[0];
    const count = db.prepare("SELECT COUNT(*) as count FROM opd_visits WHERE hospital_id = ? AND date(visit_date) = date(?)").get(hospital_id, today);
    const token_number = (count as any).count + 1;

    const info = db.prepare(`
      INSERT INTO opd_visits (
        hospital_id, patient_id, doctor_id, token_number, symptoms, diagnosis, prescription, notes, fee_amount, payment_status,
        vitals_temp, vitals_bp, vitals_pulse, vitals_spo2, vitals_weight, vitals_height, vitals_bmi, vitals_rr
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      hospital_id, patient_id, doctor_id, token_number, symptoms, diagnosis, prescription, notes, fee_amount || 0, payment_status || 'Unpaid',
      vitals_temp, vitals_bp, vitals_pulse, vitals_spo2, vitals_weight, vitals_height, vitals_bmi, vitals_rr
    );
    
    res.json({ id: info.lastInsertRowid, token_number });
  });

  app.patch("/api/opd/visits/:id", (req, res) => {
    const { id } = req.params;
    const { 
      symptoms, diagnosis, prescription, notes, status,
      vitals_temp, vitals_bp, vitals_pulse, vitals_spo2, vitals_weight, vitals_height, vitals_bmi, vitals_rr
    } = req.body;
    db.prepare(`
      UPDATE opd_visits 
      SET symptoms = COALESCE(?, symptoms), 
          diagnosis = COALESCE(?, diagnosis), 
          prescription = COALESCE(?, prescription), 
          notes = COALESCE(?, notes),
          status = COALESCE(?, status),
          vitals_temp = COALESCE(?, vitals_temp),
          vitals_bp = COALESCE(?, vitals_bp),
          vitals_pulse = COALESCE(?, vitals_pulse),
          vitals_spo2 = COALESCE(?, vitals_spo2),
          vitals_weight = COALESCE(?, vitals_weight),
          vitals_height = COALESCE(?, vitals_height),
          vitals_bmi = COALESCE(?, vitals_bmi),
          vitals_rr = COALESCE(?, vitals_rr)
      WHERE id = ?
    `).run(
      symptoms, diagnosis, prescription, notes, status, 
      vitals_temp, vitals_bp, vitals_pulse, vitals_spo2, vitals_weight, vitals_height, vitals_bmi, vitals_rr,
      id
    );
    res.json({ success: true });
  });

  // IPD Beds
  app.get("/api/beds", (req, res) => {
    const hospitalId = req.query.hospitalId;
    const beds = db.prepare("SELECT * FROM beds WHERE hospital_id = ?").all(hospitalId);
    res.json(beds);
  });

  // IPD Admissions
  app.get("/api/ipd/admissions", (req, res) => {
    const hospitalId = req.query.hospitalId;
    const admissions = db.prepare(`
      SELECT a.*, p.name as patient_name, p.patient_id_str, d.name as doctor_name, b.ward_name, b.bed_number, b.type as bed_type
      FROM ipd_admissions a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN beds b ON a.bed_id = b.id
      WHERE a.hospital_id = ?
      ORDER BY a.admission_date DESC
    `).all(hospitalId);
    res.json(admissions);
  });

  app.post("/api/ipd/admissions", (req, res) => {
    const { hospital_id, patient_id, doctor_id, bed_id, admission_note, treatment_plan } = req.body;
    
    const transaction = db.transaction(() => {
      const info = db.prepare(`
        INSERT INTO ipd_admissions (hospital_id, patient_id, doctor_id, bed_id, admission_note, treatment_plan)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(hospital_id, patient_id, doctor_id, bed_id, admission_note, treatment_plan);
      
      db.prepare("UPDATE beds SET status = 'Occupied' WHERE id = ?").run(bed_id);
      
      return info.lastInsertRowid;
    });

    const admissionId = transaction();
    
    // Trigger WhatsApp: Admission notification
    sendWhatsAppMessage(
      hospital_id, 
      patient_id, 
      "Admission Notification", 
      `Patient admission confirmed. Admission ID: ${admissionId}. We are committed to providing the best care.`
    );

    res.json({ id: admissionId });
  });

  app.get("/api/ipd/admissions/:id", (req, res) => {
    const { id } = req.params;
    const admission = db.prepare(`
      SELECT a.*, p.name as patient_name, p.patient_id_str, p.age, p.gender, d.name as doctor_name, b.ward_name, b.bed_number, b.type as bed_type
      FROM ipd_admissions a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN beds b ON a.bed_id = b.id
      WHERE a.id = ?
    `).get(id);

    if (!admission) return res.status(404).json({ message: "Admission not found" });

    const vitals = db.prepare("SELECT * FROM ipd_vitals WHERE admission_id = ? ORDER BY recorded_at DESC").all(id);
    const nursingNotes = db.prepare("SELECT * FROM ipd_nursing_notes WHERE admission_id = ? ORDER BY recorded_at DESC").all(id);
    const rounds = db.prepare(`
      SELECT r.*, d.name as doctor_name 
      FROM ipd_consultant_rounds r 
      JOIN doctors d ON r.doctor_id = d.id 
      WHERE r.admission_id = ? 
      ORDER BY r.round_date DESC
    `).all(id);
    const medications = db.prepare("SELECT * FROM ipd_medications WHERE admission_id = ? ORDER BY start_date DESC").all(id);

    res.json({ ...admission, vitals, nursingNotes, rounds, medications });
  });

  app.post("/api/ipd/vitals", (req, res) => {
    const { admission_id, temp, bp, pulse, spO2, respiration } = req.body;
    db.prepare(`
      INSERT INTO ipd_vitals (admission_id, temp, bp, pulse, spO2, respiration)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(admission_id, temp, bp, pulse, spO2, respiration);
    res.json({ success: true });
  });

  app.post("/api/ipd/nursing-notes", (req, res) => {
    const { admission_id, note } = req.body;
    db.prepare("INSERT INTO ipd_nursing_notes (admission_id, note) VALUES (?, ?)").run(admission_id, note);
    res.json({ success: true });
  });

  app.post("/api/ipd/consultant-rounds", (req, res) => {
    const { admission_id, doctor_id, notes } = req.body;
    db.prepare("INSERT INTO ipd_consultant_rounds (admission_id, doctor_id, notes) VALUES (?, ?, ?)").run(admission_id, doctor_id, notes);
    res.json({ success: true });
  });

  app.post("/api/ipd/medications", (req, res) => {
    const { admission_id, medicine_name, dosage, frequency } = req.body;
    db.prepare("INSERT INTO ipd_medications (admission_id, medicine_name, dosage, frequency) VALUES (?, ?, ?, ?)").run(admission_id, medicine_name, dosage, frequency);
    res.json({ success: true });
  });

  app.patch("/api/ipd/admissions/:id", (req, res) => {
    const { id } = req.params;
    const { status, discharge_summary, treatment_plan, surgery_notes } = req.body;
    
    const transaction = db.transaction(() => {
      if (status === 'Discharged') {
        const admission = db.prepare("SELECT bed_id FROM ipd_admissions WHERE id = ?").get(id);
        if (admission) {
          db.prepare("UPDATE beds SET status = 'Available' WHERE id = ?").run((admission as any).bed_id);
        }
        db.prepare(`
          UPDATE ipd_admissions 
          SET status = ?, discharge_summary = ?, discharge_date = CURRENT_TIMESTAMP 
          WHERE id = ?
        `).run(status, discharge_summary, id);
        
        const admissionInfo = db.prepare("SELECT hospital_id, patient_id FROM ipd_admissions WHERE id = ?").get(id);
        if (admissionInfo) {
          sendWhatsAppMessage(
            (admissionInfo as any).hospital_id, 
            (admissionInfo as any).patient_id, 
            "Discharge Summary", 
            "Your discharge summary is ready. Please collect it from the reception or view it in the app. Wishing you a speedy recovery!"
          );
        }
      } else {
        db.prepare(`
          UPDATE ipd_admissions 
          SET treatment_plan = COALESCE(?, treatment_plan), 
              surgery_notes = COALESCE(?, surgery_notes)
          WHERE id = ?
        `).run(treatment_plan, surgery_notes, id);
      }
    });

    transaction();
    res.json({ success: true });
  });

  app.get("/api/discharges", (req, res) => {
    const { hospital_id } = req.query;
    const discharges = db.prepare(`
      SELECT d.*, p.name as patient_name, p.patient_id as patient_id_str, dr.name as doctor_name
      FROM discharges d
      JOIN patients p ON d.patient_id = p.id
      JOIN doctors dr ON d.doctor_id = dr.id
      WHERE d.hospital_id = ?
      ORDER BY d.discharge_date DESC
    `).all(hospital_id);
    
    res.json(discharges.map((d: any) => ({
      ...d,
      medications: d.medications_json ? JSON.parse(d.medications_json) : []
    })));
  });

  app.post("/api/discharges", (req, res) => {
    const { 
      hospital_id, admission_id, patient_id, doctor_id, 
      discharge_summary, medications, billing_status, 
      follow_up_date, follow_up_notes 
    } = req.body;

    const transaction = db.transaction(() => {
      // 1. Insert into discharges table
      db.prepare(`
        INSERT INTO discharges (
          hospital_id, admission_id, patient_id, doctor_id, 
          discharge_summary, medications_json, billing_status, 
          follow_up_date, follow_up_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        hospital_id, admission_id, patient_id, doctor_id, 
        discharge_summary, JSON.stringify(medications), billing_status, 
        follow_up_date, follow_up_notes
      );

      // 2. Update ipd_admissions status
      db.prepare("UPDATE ipd_admissions SET status = 'Discharged', discharge_date = CURRENT_TIMESTAMP WHERE id = ?")
        .run(admission_id);

      // 3. Free the bed
      const admission = db.prepare("SELECT bed_id FROM ipd_admissions WHERE id = ?").get(admission_id);
      if (admission) {
        db.prepare("UPDATE beds SET status = 'Available' WHERE id = ?").run((admission as any).bed_id);
      }

      // 4. Send WhatsApp notification
      sendWhatsAppMessage(
        hospital_id, 
        patient_id, 
        "Discharge Summary", 
        `Your discharge summary is ready. Follow-up date: ${follow_up_date || 'N/A'}. Wishing you a speedy recovery!`
      );
    });

    transaction();
    res.json({ success: true });
  });

  app.get("/api/reports/summary", (req, res) => {
    const { hospital_id } = req.query;
    
    // 1. OPD/IPD Census Trend (Last 7 days)
    const censusTrend = db.prepare(`
      WITH RECURSIVE dates(date) AS (
        SELECT date('now', '-6 days')
        UNION ALL
        SELECT date(date, '+1 day') FROM dates WHERE date < date('now')
      )
      SELECT 
        strftime('%d %b', d.date) as name,
        (SELECT COUNT(*) FROM opd_visits v WHERE date(v.visit_date) = d.date AND v.hospital_id = ?) as opd,
        (SELECT COUNT(*) FROM ipd_admissions a WHERE date(a.admission_date) = d.date AND a.hospital_id = ?) as ipd
      FROM dates d
    `).all(hospital_id, hospital_id);

    // 2. Disease-wise Statistics (Top 5)
    const diseaseStats = db.prepare(`
      SELECT diagnosis as name, COUNT(*) as value
      FROM opd_visits
      WHERE hospital_id = ? AND diagnosis IS NOT NULL AND diagnosis != ''
      GROUP BY diagnosis
      ORDER BY value DESC
      LIMIT 5
    `).all(hospital_id);

    // 3. Revenue Distribution (Last 7 days)
    const revenueStats = db.prepare(`
      WITH RECURSIVE dates(date) AS (
        SELECT date('now', '-6 days')
        UNION ALL
        SELECT date(date, '+1 day') FROM dates WHERE date < date('now')
      )
      SELECT 
        strftime('%d %b', d.date) as name,
        (SELECT COALESCE(SUM(net_amount), 0) FROM billing_records b WHERE date(b.bill_date) = d.date AND b.hospital_id = ? AND b.category = 'OPD') as opd,
        (SELECT COALESCE(SUM(net_amount), 0) FROM billing_records b WHERE date(b.bill_date) = d.date AND b.hospital_id = ? AND b.category = 'IPD') as ipd
      FROM dates d
    `).all(hospital_id, hospital_id);

    // 4. Emergency Cases (Recent 5)
    const emergencyCases = db.prepare(`
      SELECT incident_date as date, incident_type as type, severity, status as outcome
      FROM safety_incidents
      WHERE hospital_id = ?
      ORDER BY incident_date DESC, incident_time DESC
      LIMIT 5
    `).all(hospital_id);

    res.json({
      censusTrend,
      diseaseStats,
      revenueStats,
      emergencyCases
    });
  });

  // Pharmacy Items
  app.get("/api/pharmacy/items", (req, res) => {
    const hospitalId = req.query.hospitalId;
    const items = db.prepare(`
      SELECT i.*, SUM(b.current_stock) as total_stock 
      FROM pharmacy_items i 
      LEFT JOIN pharmacy_batches b ON i.id = b.item_id 
      WHERE i.hospital_id = ?
      GROUP BY i.id
    `).all(hospitalId);
    res.json(items);
  });

  app.post("/api/pharmacy/items", (req, res) => {
    const { hospital_id, name, generic_name, category, uom, is_narcotic, min_stock_level } = req.body;
    const info = db.prepare(`
      INSERT INTO pharmacy_items (hospital_id, name, generic_name, category, uom, is_narcotic, min_stock_level) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(hospital_id, name, generic_name, category, uom, is_narcotic ? 1 : 0, min_stock_level);
    res.json({ id: info.lastInsertRowid });
  });

  // Pharmacy Batches
  app.get("/api/pharmacy/batches", (req, res) => {
    const hospitalId = req.query.hospitalId;
    const batches = db.prepare(`
      SELECT b.*, i.name as item_name, i.is_narcotic 
      FROM pharmacy_batches b 
      JOIN pharmacy_items i ON b.item_id = i.id 
      WHERE i.hospital_id = ? AND b.current_stock > 0
      ORDER BY b.expiry_date ASC
    `).all(hospitalId);
    res.json(batches);
  });

  // Pharmacy Suppliers
  app.get("/api/pharmacy/suppliers", (req, res) => {
    const hospitalId = req.query.hospitalId;
    const suppliers = db.prepare("SELECT * FROM pharmacy_suppliers WHERE hospital_id = ?").all(hospitalId);
    res.json(suppliers);
  });

  app.post("/api/pharmacy/suppliers", (req, res) => {
    const { hospital_id, name, contact_person, mobile, email, address, gstin } = req.body;
    const info = db.prepare(`
      INSERT INTO pharmacy_suppliers (hospital_id, name, contact_person, mobile, email, address, gstin) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(hospital_id, name, contact_person, mobile, email, address, gstin);
    res.json({ id: info.lastInsertRowid });
  });

  // Pharmacy Dispensing
  app.post("/api/pharmacy/dispense", (req, res) => {
    const { hospital_id, patient_id, visit_id, admission_id, items, discount, total_amount, net_amount } = req.body;
    
    const transaction = db.transaction(() => {
      const bill_number = "BILL-" + Date.now();
      const info = db.prepare(`
        INSERT INTO pharmacy_dispensing (hospital_id, patient_id, visit_id, admission_id, bill_number, total_amount, discount, net_amount) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(hospital_id, patient_id, visit_id, admission_id, bill_number, total_amount, discount, net_amount);
      
      const dispensingId = info.lastInsertRowid;

      for (const item of items) {
        db.prepare(`
          INSERT INTO pharmacy_dispensing_items (dispensing_id, batch_id, quantity, unit_price, total_price) 
          VALUES (?, ?, ?, ?, ?)
        `).run(dispensingId, item.batch_id, item.quantity, item.unit_price, item.total_price);
        
        // Auto-deduction of stock
        db.prepare("UPDATE pharmacy_batches SET current_stock = current_stock - ? WHERE id = ?").run(item.quantity, item.batch_id);
        
        // Narcotics log if applicable
        const batch = db.prepare("SELECT i.is_narcotic, i.id as item_id FROM pharmacy_batches b JOIN pharmacy_items i ON b.item_id = i.id WHERE b.id = ?").get(item.batch_id);
        if ((batch as any).is_narcotic) {
          db.prepare(`
            INSERT INTO pharmacy_narcotics_log (hospital_id, item_id, batch_id, action_type, quantity, reference_id) 
            VALUES (?, ?, ?, 'Dispensed', ?, ?)
          `).run(hospital_id, (batch as any).item_id, item.batch_id, item.quantity, dispensingId);
        }
      }
      
      return bill_number;
    });

    const billNumber = transaction();
    res.json({ success: true, bill_number: billNumber });
  });

  // Pharmacy GRN (Receive Stock)
  app.post("/api/pharmacy/grn", (req, res) => {
    const { hospital_id, supplier_id, invoice_number, invoice_date, items, total_amount } = req.body;
    
    const transaction = db.transaction(() => {
      const grn_number = "GRN-" + Date.now();
      const info = db.prepare(`
        INSERT INTO pharmacy_grn (hospital_id, supplier_id, grn_number, invoice_number, invoice_date, total_amount) 
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(hospital_id, supplier_id, grn_number, invoice_number, invoice_date, total_amount);
      
      const grnId = info.lastInsertRowid;

      for (const item of items) {
        // Check if batch exists, or create new
        let batch = db.prepare("SELECT id FROM pharmacy_batches WHERE item_id = ? AND batch_number = ?").get(item.item_id, item.batch_number);
        let batchId;
        if (batch) {
          batchId = (batch as any).id;
          db.prepare("UPDATE pharmacy_batches SET current_stock = current_stock + ? WHERE id = ?").run(item.quantity, batchId);
        } else {
          const bInfo = db.prepare(`
            INSERT INTO pharmacy_batches (item_id, batch_number, expiry_date, mrp, purchase_price, current_stock) 
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(item.item_id, item.batch_number, item.expiry_date, item.mrp, item.purchase_price, item.quantity);
          batchId = bInfo.lastInsertRowid;
        }

        // Narcotics log if applicable
        const pItem = db.prepare("SELECT is_narcotic FROM pharmacy_items WHERE id = ?").get(item.item_id);
        if ((pItem as any).is_narcotic) {
          db.prepare(`
            INSERT INTO pharmacy_narcotics_log (hospital_id, item_id, batch_id, action_type, quantity, reference_id) 
            VALUES (?, ?, ?, 'Received', ?, ?)
          `).run(hospital_id, item.item_id, batchId, item.quantity, grnId);
        }
      }
      
      return grn_number;
    });

    const grnNumber = transaction();
    res.json({ success: true, grn_number: grnNumber });
  });

  // Narcotics Log
  app.get("/api/pharmacy/narcotics-log", (req, res) => {
    const hospitalId = req.query.hospitalId;
    const logs = db.prepare(`
      SELECT l.*, i.name as item_name, b.batch_number 
      FROM pharmacy_narcotics_log l 
      JOIN pharmacy_items i ON l.item_id = i.id 
      JOIN pharmacy_batches b ON l.batch_id = b.id 
      WHERE l.hospital_id = ?
      ORDER BY l.log_date DESC
    `).all(hospitalId);
    res.json(logs);
  });

  // Purchase Orders
  app.get("/api/pharmacy/po", (req, res) => {
    const hospitalId = req.query.hospitalId;
    const pos = db.prepare(`
      SELECT po.*, s.name as supplier_name 
      FROM pharmacy_purchase_orders po 
      JOIN pharmacy_suppliers s ON po.supplier_id = s.id 
      WHERE po.hospital_id = ?
      ORDER BY po.po_date DESC
    `).all(hospitalId);
    res.json(pos);
  });

  app.post("/api/pharmacy/po", (req, res) => {
    const { hospital_id, supplier_id, items, total_amount } = req.body;
    const po_number = "PO-" + Date.now();
    
    const transaction = db.transaction(() => {
      const info = db.prepare(`
        INSERT INTO pharmacy_purchase_orders (hospital_id, supplier_id, po_number, total_amount) 
        VALUES (?, ?, ?, ?)
      `).run(hospital_id, supplier_id, po_number, total_amount);
      
      const poId = info.lastInsertRowid;
      for (const item of items) {
        db.prepare(`
          INSERT INTO pharmacy_purchase_order_items (po_id, item_id, quantity, unit_price) 
          VALUES (?, ?, ?, ?)
        `).run(poId, item.item_id, item.quantity, item.unit_price);
      }
      return po_number;
    });

    const poNumber = transaction();
    res.json({ success: true, po_number: poNumber });
  });

  // Returns
  app.post("/api/pharmacy/returns", (req, res) => {
    const { hospital_id, dispensing_id, reason, items } = req.body;
    
    const transaction = db.transaction(() => {
      let total_refund = 0;
      for (const item of items) {
        total_refund += item.refund_amount;
        // Add back to stock
        db.prepare("UPDATE pharmacy_batches SET current_stock = current_stock + ? WHERE id = ?").run(item.quantity, item.batch_id);
        
        // Narcotics log if applicable
        const batch = db.prepare("SELECT i.is_narcotic, i.id as item_id FROM pharmacy_batches b JOIN pharmacy_items i ON b.item_id = i.id WHERE b.id = ?").get(item.batch_id);
        if ((batch as any).is_narcotic) {
          db.prepare(`
            INSERT INTO pharmacy_narcotics_log (hospital_id, item_id, batch_id, action_type, quantity, reference_id) 
            VALUES (?, ?, ?, 'Returned', ?, ?)
          `).run(hospital_id, (batch as any).item_id, item.batch_id, item.quantity, dispensing_id);
        }
      }

      db.prepare(`
        INSERT INTO pharmacy_returns (hospital_id, dispensing_id, reason, total_refund) 
        VALUES (?, ?, ?, ?)
      `).run(hospital_id, dispensing_id, reason, total_refund);
    });

    transaction();
    res.json({ success: true });
  });

  app.get("/api/pharmacy/dispensing", (req, res) => {
    const hospitalId = req.query.hospitalId;
    const dispensing = db.prepare(`
      SELECT d.*, p.name as patient_name 
      FROM pharmacy_dispensing d 
      LEFT JOIN patients p ON d.patient_id = p.id 
      WHERE d.hospital_id = ?
      ORDER BY d.bill_date DESC
    `).all(hospitalId);
    res.json(dispensing);
  });

  // OT Management
  app.get("/api/ot/rooms", (req, res) => {
    const hospitalId = req.query.hospitalId;
    const rooms = db.prepare("SELECT * FROM ot_rooms WHERE hospital_id = ?").all(hospitalId);
    res.json(rooms);
  });

  app.get("/api/ot/bookings", (req, res) => {
    const hospitalId = req.query.hospitalId;
    const bookings = db.prepare(`
      SELECT b.*, p.name as patient_name, d.name as doctor_name, r.name as room_name
      FROM ot_bookings b
      JOIN patients p ON b.patient_id = p.id
      JOIN doctors d ON b.doctor_id = d.id
      JOIN ot_rooms r ON b.room_id = r.id
      WHERE b.hospital_id = ?
      ORDER BY b.scheduled_at DESC
    `).all(hospitalId);
    res.json(bookings);
  });

  app.post("/api/ot/bookings", (req, res) => {
    const { hospital_id, patient_id, doctor_id, room_id, surgery_name, scheduled_at, duration_minutes } = req.body;
    const info = db.prepare(`
      INSERT INTO ot_bookings (hospital_id, patient_id, doctor_id, room_id, surgery_name, scheduled_at, duration_minutes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(hospital_id, patient_id, doctor_id, room_id, surgery_name, scheduled_at, duration_minutes);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/ot/inventory", (req, res) => {
    const hospitalId = req.query.hospitalId;
    const inventory = db.prepare("SELECT * FROM ot_inventory WHERE hospital_id = ?").all(hospitalId);
    res.json(inventory);
  });

  app.get("/api/ot/infection-logs", (req, res) => {
    const hospitalId = req.query.hospitalId;
    const logs = db.prepare(`
      SELECT l.*, r.name as room_name
      FROM ot_infection_logs l
      JOIN ot_rooms r ON l.room_id = r.id
      WHERE r.hospital_id = ?
      ORDER BY l.performed_at DESC
    `).all(hospitalId);
    res.json(logs);
  });

  app.post("/api/ot/infection-logs", (req, res) => {
    const { room_id, action_type, performed_by, notes } = req.body;
    const info = db.prepare(`
      INSERT INTO ot_infection_logs (room_id, action_type, performed_by, notes)
      VALUES (?, ?, ?, ?)
    `).run(room_id, action_type, performed_by, notes);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/ot/bookings/:id/details", (req, res) => {
    const { id } = req.params;
    const assessment = db.prepare("SELECT * FROM ot_assessments WHERE booking_id = ?").get(id);
    const anesthesia = db.prepare("SELECT * FROM ot_anesthesia_records WHERE booking_id = ?").get(id);
    const intraOp = db.prepare("SELECT * FROM ot_intra_op_notes WHERE booking_id = ?").get(id);
    const postOp = db.prepare("SELECT * FROM ot_post_op_care WHERE booking_id = ?").get(id);
    const consumables = db.prepare(`
      SELECT c.*, i.name as item_name
      FROM ot_consumable_usage c
      JOIN ot_inventory i ON c.item_id = i.id
      WHERE c.booking_id = ?
    `).all(id);

    res.json({ assessment, anesthesia, intraOp, postOp, consumables });
  });

  app.post("/api/ot/bookings/:id/assessment", (req, res) => {
    const { id } = req.params;
    const { fitness_status, vitals_json, investigations_json, notes } = req.body;
    db.prepare(`
      INSERT INTO ot_assessments (booking_id, fitness_status, vitals_json, investigations_json, notes)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, fitness_status, JSON.stringify(vitals_json), JSON.stringify(investigations_json), notes);
    res.json({ success: true });
  });

  app.post("/api/ot/bookings/:id/anesthesia", (req, res) => {
    const { id } = req.params;
    const { anesthesiologist_id, type, medications_json, vitals_monitoring_json, notes } = req.body;
    db.prepare(`
      INSERT INTO ot_anesthesia_records (booking_id, anesthesiologist_id, type, medications_json, vitals_monitoring_json, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, anesthesiologist_id, type, JSON.stringify(medications_json), JSON.stringify(vitals_monitoring_json), notes);
    res.json({ success: true });
  });

  app.post("/api/ot/bookings/:id/intra-op", (req, res) => {
    const { id } = req.params;
    const { surgeon_id, procedure_details, findings, complications } = req.body;
    db.prepare(`
      INSERT INTO ot_intra_op_notes (booking_id, surgeon_id, procedure_details, findings, complications)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, surgeon_id, procedure_details, findings, complications);
    res.json({ success: true });
  });

  app.post("/api/ot/bookings/:id/post-op", (req, res) => {
    const { id } = req.params;
    const { recovery_status, vitals_json, instructions } = req.body;
    db.prepare(`
      INSERT INTO ot_post_op_care (booking_id, recovery_status, vitals_json, instructions)
      VALUES (?, ?, ?, ?)
    `).run(id, recovery_status, JSON.stringify(vitals_json), instructions);
    res.json({ success: true });
  });

  app.post("/api/ot/bookings/:id/consumables", (req, res) => {
    const { id } = req.params;
    const { item_id, quantity } = req.body;
    
    const transaction = db.transaction(() => {
      const item = db.prepare("SELECT unit_price FROM ot_inventory WHERE id = ?").get(item_id);
      const total_price = (item as any).unit_price * quantity;
      
      db.prepare(`
        INSERT INTO ot_consumable_usage (booking_id, item_id, quantity, unit_price, total_price)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, item_id, quantity, (item as any).unit_price, total_price);
      
      db.prepare("UPDATE ot_inventory SET current_stock = current_stock - ? WHERE id = ?").run(quantity, item_id);
    });
    
    transaction();
    res.json({ success: true });
  });

  // Nursing Station Endpoints
  app.get("/api/nursing/dashboard", (req, res) => {
    const { hospitalId } = req.query;
    
    const admissions = db.prepare(`
      SELECT 
        a.*, 
        p.name as patient_name, p.age, p.gender, p.patient_id_str,
        b.bed_number, b.ward_name, b.type as bed_type,
        d.name as doctor_name
      FROM ipd_admissions a
      JOIN patients p ON a.patient_id = p.id
      JOIN beds b ON a.bed_id = b.id
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.hospital_id = ? AND a.status = 'Admitted'
    `).all(hospitalId);

    const vitals = db.prepare(`
      SELECT v.*, a.patient_id
      FROM ipd_vitals v
      JOIN ipd_admissions a ON v.admission_id = a.id
      WHERE a.hospital_id = ? AND a.status = 'Admitted'
      ORDER BY v.recorded_at DESC
    `).all(hospitalId);

    const medications = db.prepare(`
      SELECT m.*, a.patient_id
      FROM ipd_medications m
      JOIN ipd_admissions a ON m.admission_id = a.id
      WHERE a.hospital_id = ? AND a.status = 'Admitted' AND m.status = 'Active'
    `).all(hospitalId);

    const tasks = db.prepare(`
      SELECT t.*, p.name as patient_name, b.bed_number
      FROM nursing_tasks t
      JOIN ipd_admissions a ON t.admission_id = a.id
      JOIN patients p ON a.patient_id = p.id
      JOIN beds b ON a.bed_id = b.id
      WHERE a.hospital_id = ? AND a.status = 'Admitted'
    `).all(hospitalId);

    const shifts = db.prepare(`
      SELECT * FROM nursing_shifts WHERE hospital_id = ?
    `).all(hospitalId);

    res.json({ admissions, vitals, medications, tasks, shifts });
  });

  app.post("/api/nursing/tasks", (req, res) => {
    const { admission_id, task_type, scheduled_at, notes } = req.body;
    const info = db.prepare(`
      INSERT INTO nursing_tasks (admission_id, task_type, scheduled_at, notes)
      VALUES (?, ?, ?, ?)
    `).run(admission_id, task_type, scheduled_at, notes);
    res.json({ id: info.lastInsertRowid });
  });

  app.post("/api/nursing/tasks/:id/complete", (req, res) => {
    const { id } = req.params;
    const { performed_by, notes } = req.body;
    db.prepare(`
      UPDATE nursing_tasks 
      SET status = 'Completed', completed_at = CURRENT_TIMESTAMP, performed_by = ?, notes = ?
      WHERE id = ?
    `).run(performed_by, notes, id);
    res.json({ success: true });
  });

  app.post("/api/nursing/admissions/:id/risk", (req, res) => {
    const { id } = req.params;
    const { risk_code } = req.body;
    db.prepare("UPDATE ipd_admissions SET risk_code = ? WHERE id = ?").run(risk_code, id);
    res.json({ success: true });
  });

  app.get("/api/nursing/icu/vitals-trend/:admissionId", (req, res) => {
    const { admissionId } = req.params;
    const history = db.prepare(`
      SELECT recorded_at, temp, bp, pulse, spO2
      FROM ipd_vitals
      WHERE admission_id = ?
      ORDER BY recorded_at ASC
      LIMIT 20
    `).all(admissionId);
    res.json(history);
  });

  app.post("/api/nursing/shifts", (req, res) => {
    const { hospital_id, ward_name, shift_name, nurse_name, start_time, end_time } = req.body;
    const info = db.prepare(`
      INSERT INTO nursing_shifts (hospital_id, ward_name, shift_name, nurse_name, start_time, end_time)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(hospital_id, ward_name, shift_name, nurse_name, start_time, end_time);
    res.json({ id: info.lastInsertRowid });
  });

  // Laboratory
  app.get("/api/lab/tests", (req, res) => {
    const hospitalId = req.query.hospitalId;
    const tests = db.prepare(`
      SELECT t.*, 
             (SELECT json_group_array(gi.test_id) 
              FROM lab_group_items gi 
              WHERE gi.group_id = t.id) as item_ids
      FROM lab_test_catalog t 
      WHERE t.hospital_id = ?
    `).all(hospitalId);
    
    // Parse item_ids from JSON string
    const formattedTests = (tests as any[]).map(t => ({
      ...t,
      item_ids: JSON.parse(t.item_ids || "[]")
    }));
    
    res.json(formattedTests);
  });

  app.post("/api/lab/tests", (req, res) => {
    const { hospital_id, name, category, reference_range, unit, price, is_group, item_ids } = req.body;
    
    const transaction = db.transaction(() => {
      const info = db.prepare(`
        INSERT INTO lab_test_catalog (hospital_id, name, category, reference_range, unit, price, is_group)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(hospital_id, name, category, reference_range, unit, price, is_group ? 1 : 0);
      
      const testId = info.lastInsertRowid;
      
      if (is_group && Array.isArray(item_ids)) {
        const insertItem = db.prepare("INSERT INTO lab_group_items (group_id, test_id) VALUES (?, ?)");
        for (const subId of item_ids) {
          insertItem.run(testId, subId);
        }
      }
      
      return testId;
    });
    
    const id = transaction();
    res.json({ success: true, id });
  });

  // --- WhatsApp Helper ---
  const sendWhatsAppMessage = (hospitalId: number, patientId: number, messageType: string, content: string) => {
    const patient = db.prepare("SELECT mobile FROM patients WHERE id = ?").get(patientId);
    const phoneNumber = (patient as any)?.mobile || "Unknown";
    
    db.prepare(`
      INSERT INTO whatsapp_logs (hospital_id, patient_id, phone_number, message_type, message_content, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(hospitalId, patientId, phoneNumber, messageType, content, "Sent");
    
    console.log(`[WhatsApp] Sent to ${phoneNumber}: ${content}`);
  };

  // --- Appointment Endpoints ---
  app.get("/api/appointments", (req, res) => {
    const hospitalId = req.query.hospitalId;
    const appointments = db.prepare(`
      SELECT a.*, p.name as patient_name, p.mobile as patient_phone, d.name as doctor_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.hospital_id = ?
      ORDER BY a.appointment_date ASC, a.appointment_time ASC
    `).all(hospitalId);
    res.json(appointments);
  });

  app.post("/api/appointments", (req, res) => {
    const { hospital_id, patient_id, doctor_id, appointment_date, appointment_time, reason } = req.body;
    const info = db.prepare(`
      INSERT INTO appointments (hospital_id, patient_id, doctor_id, appointment_date, appointment_time, reason, status)
      VALUES (?, ?, ?, ?, ?, ?, 'Requested')
    `).run(hospital_id, patient_id, doctor_id, appointment_date, appointment_time, reason);
    
    const appointmentId = info.lastInsertRowid;
    
    // Trigger WhatsApp: Appointment request received
    sendWhatsAppMessage(
      hospital_id, 
      patient_id, 
      "Appointment Request", 
      `Hello! Your appointment request for ${appointment_date} at ${appointment_time} has been received. We will confirm shortly.`
    );
    
    res.json({ success: true, id: appointmentId });
  });

  app.patch("/api/appointments/:id", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    const appointment = db.prepare("SELECT * FROM appointments WHERE id = ?").get(id);
    if (!appointment) return res.status(404).json({ error: "Appointment not found" });
    
    db.prepare("UPDATE appointments SET status = ? WHERE id = ?").run(status, id);
    
    // Trigger WhatsApp: Appointment confirmed
    if (status === 'Confirmed') {
      sendWhatsAppMessage(
        (appointment as any).hospital_id, 
        (appointment as any).patient_id, 
        "Appointment Confirmed", 
        `Great news! Your appointment on ${(appointment as any).appointment_date} at ${(appointment as any).appointment_time} is now CONFIRMED.`
      );
    }
    
    res.json({ success: true });
  });

  app.get("/api/whatsapp/logs", (req, res) => {
    const hospitalId = req.query.hospitalId;
    const logs = db.prepare(`
      SELECT w.*, p.name as patient_name
      FROM whatsapp_logs w
      JOIN patients p ON w.patient_id = p.id
      WHERE w.hospital_id = ?
      ORDER BY w.sent_at DESC
    `).all(hospitalId);
    res.json(logs);
  });

  app.post("/api/whatsapp/trigger", (req, res) => {
    const { hospital_id, patient_id, message_type } = req.body;
    
    const messages: Record<string, string> = {
      'Payment Reminder': "Friendly reminder: Your outstanding hospital bill is due. Please settle it at your earliest convenience. Thank you!",
      'Birthday Wish': "Happy Birthday! Wishing you a day filled with joy and a year of great health. From all of us at the hospital.",
      'Emergency Alert': "EMERGENCY ALERT: Please follow the safety protocols immediately. Contact the emergency desk for assistance.",
      'Follow-up Reminder': "Don't forget your follow-up checkup scheduled for next week. Regular monitoring is key to your recovery."
    };

    const content = messages[message_type] || "You have a new notification from the hospital.";
    sendWhatsAppMessage(hospital_id, patient_id, message_type, content);
    
    res.json({ success: true });
  });

  // --- Safety & Facility Management Endpoints ---
  app.get("/api/safety/fire-extinguishers", (req, res) => {
    const hospitalId = req.query.hospitalId;
    const items = db.prepare("SELECT * FROM fire_extinguishers WHERE hospital_id = ?").all(hospitalId);
    res.json(items);
  });

  app.post("/api/safety/fire-extinguishers", (req, res) => {
    const { hospital_id, location, type, capacity, last_service_date, expiry_date, amc_provider, amc_expiry, status } = req.body;
    const info = db.prepare(`
      INSERT INTO fire_extinguishers (hospital_id, location, type, capacity, last_service_date, expiry_date, amc_provider, amc_expiry, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(hospital_id, location, type, capacity, last_service_date, expiry_date, amc_provider, amc_expiry, status);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/safety/maintenance", (req, res) => {
    const hospitalId = req.query.hospitalId;
    const items = db.prepare("SELECT * FROM facility_maintenance WHERE hospital_id = ?").all(hospitalId);
    res.json(items);
  });

  app.post("/api/safety/maintenance", (req, res) => {
    const { hospital_id, asset_type, asset_name, last_maintenance_date, next_maintenance_date, maintenance_type, performed_by, notes, status } = req.body;
    const info = db.prepare(`
      INSERT INTO facility_maintenance (hospital_id, asset_type, asset_name, last_maintenance_date, next_maintenance_date, maintenance_type, performed_by, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(hospital_id, asset_type, asset_name, last_maintenance_date, next_maintenance_date, maintenance_type, performed_by, notes, status);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/safety/incidents", (req, res) => {
    const hospitalId = req.query.hospitalId;
    const items = db.prepare("SELECT * FROM safety_incidents WHERE hospital_id = ?").all(hospitalId);
    res.json(items);
  });

  app.post("/api/safety/incidents", (req, res) => {
    const { hospital_id, incident_type, description, location, incident_date, incident_time, reported_by, severity, action_taken, status } = req.body;
    const info = db.prepare(`
      INSERT INTO safety_incidents (hospital_id, incident_type, description, location, incident_date, incident_time, reported_by, severity, action_taken, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(hospital_id, incident_type, description, location, incident_date, incident_time, reported_by, severity, action_taken, status);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/safety/cctv-logs", (req, res) => {
    const hospitalId = req.query.hospitalId;
    const items = db.prepare("SELECT * FROM cctv_logs WHERE hospital_id = ?").all(hospitalId);
    res.json(items);
  });

  app.post("/api/safety/cctv-logs", (req, res) => {
    const { hospital_id, camera_location, log_date, checked_by, status, notes } = req.body;
    const info = db.prepare(`
      INSERT INTO cctv_logs (hospital_id, camera_location, log_date, checked_by, status, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(hospital_id, camera_location, log_date, checked_by, status, notes);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/lab/orders", (req, res) => {
    const hospitalId = req.query.hospitalId;
    const orders = db.prepare(`
      SELECT o.*, p.name as patient_name, p.patient_id_str, d.name as doctor_name 
      FROM lab_orders o
      JOIN patients p ON o.patient_id = p.id
      JOIN doctors d ON o.doctor_id = d.id
      WHERE o.hospital_id = ?
      ORDER BY o.order_date DESC
    `).all(hospitalId);
    res.json(orders);
  });

  app.post("/api/lab/orders", (req, res) => {
    const { hospital_id, patient_id, doctor_id, visit_id, admission_id, priority, notes, test_ids } = req.body;
    
    const transaction = db.transaction(() => {
      const info = db.prepare(`
        INSERT INTO lab_orders (hospital_id, patient_id, doctor_id, visit_id, admission_id, priority, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(hospital_id, patient_id, doctor_id, visit_id, admission_id, priority, notes);
      
      const orderId = info.lastInsertRowid;
      const insertResult = db.prepare("INSERT INTO lab_results (order_id, test_id) VALUES (?, ?)");
      
      const allTestIds = new Set<number>();
      
      for (const testId of test_ids) {
        const test = db.prepare("SELECT is_group FROM lab_test_catalog WHERE id = ?").get(testId);
        if (test && (test as any).is_group) {
          const subTests = db.prepare("SELECT test_id FROM lab_group_items WHERE group_id = ?").all(testId);
          subTests.forEach((st: any) => allTestIds.add(st.test_id));
        } else {
          allTestIds.add(testId);
        }
      }
      
      allTestIds.forEach((tid) => {
        insertResult.run(orderId, tid);
      });
      
      return orderId;
    });
    
    const orderId = transaction();
    res.json({ success: true, orderId });
  });

  app.get("/api/lab/results/:orderId", (req, res) => {
    const results = db.prepare(`
      SELECT r.*, t.name as test_name, t.reference_range, t.unit
      FROM lab_results r
      JOIN lab_test_catalog t ON r.test_id = t.id
      WHERE r.order_id = ?
    `).all(req.params.orderId);
    res.json(results);
  });

  app.post("/api/lab/results", (req, res) => {
    const { results } = req.body; // Array of { id, result_value, is_abnormal, performed_by, device_id }
    const update = db.prepare(`
      UPDATE lab_results 
      SET result_value = ?, is_abnormal = ?, performed_at = CURRENT_TIMESTAMP, performed_by = ?, device_id = ?
      WHERE id = ?
    `);
    
    results.forEach((r: any) => {
      update.run(r.result_value, r.is_abnormal ? 1 : 0, r.performed_by, r.device_id, r.id);
    });

    // Update order status if all results are in
    const orderId = results[0].order_id;
    if (orderId) {
      const pending = db.prepare("SELECT COUNT(*) as count FROM lab_results WHERE order_id = ? AND result_value IS NULL").get(orderId);
      if ((pending as any).count === 0) {
        db.prepare("UPDATE lab_orders SET status = 'Completed' WHERE id = ?").run(orderId);
        
        const order = db.prepare("SELECT hospital_id, patient_id FROM lab_orders WHERE id = ?").get(orderId);
        if (order) {
          sendWhatsAppMessage(
            (order as any).hospital_id, 
            (order as any).patient_id, 
            "Lab Results Available", 
            "Your lab test results are now available. You can view them in the patient portal or collect them from the lab."
          );
        }
      } else {
        db.prepare("UPDATE lab_orders SET status = 'Processing' WHERE id = ?").run(orderId);
      }
    }

    res.json({ success: true });
  });

  app.get("/api/lab/trends", (req, res) => {
    const { patientId, testName } = req.query;
    const trends = db.prepare(`
      SELECT r.result_value, r.performed_at, t.unit
      FROM lab_results r
      JOIN lab_orders o ON r.order_id = o.id
      JOIN lab_test_catalog t ON r.test_id = t.id
      WHERE o.patient_id = ? AND t.name = ? AND r.result_value IS NOT NULL
      ORDER BY r.performed_at ASC
    `).all(patientId, testName);
    res.json(trends);
  });

  // --- Radiology Endpoints ---
  app.get("/api/radiology/tests", (req, res) => {
    const hospitalId = req.query.hospitalId;
    const tests = db.prepare("SELECT * FROM radiology_test_catalog WHERE hospital_id = ?").all(hospitalId);
    res.json(tests);
  });

  app.get("/api/radiology/orders", (req, res) => {
    const hospitalId = req.query.hospitalId;
    const orders = db.prepare(`
      SELECT o.*, p.name as patient_name, p.patient_id_str, d.name as doctor_name, t.name as test_name
      FROM radiology_orders o
      JOIN patients p ON o.patient_id = p.id
      JOIN doctors d ON o.doctor_id = d.id
      JOIN radiology_test_catalog t ON o.test_id = t.id
      WHERE o.hospital_id = ?
      ORDER BY o.order_date DESC
    `).all(hospitalId);
    res.json(orders);
  });

  app.post("/api/radiology/orders", (req, res) => {
    const { hospital_id, patient_id, doctor_id, test_id, priority, clinical_history } = req.body;
    const info = db.prepare(`
      INSERT INTO radiology_orders (hospital_id, patient_id, doctor_id, test_id, priority, clinical_history)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(hospital_id, patient_id, doctor_id, test_id, priority, clinical_history);
    res.json({ success: true, id: info.lastInsertRowid });
  });

  app.get("/api/radiology/results/:orderId", (req, res) => {
    const { orderId } = req.params;
    const result = db.prepare("SELECT * FROM radiology_results WHERE order_id = ?").get(orderId);
    res.json(result || null);
  });

  app.post("/api/radiology/results", (req, res) => {
    const { order_id, findings, impression, image_url, dicom_metadata, reported_by } = req.body;
    
    const existing = db.prepare("SELECT id FROM radiology_results WHERE order_id = ?").get(order_id);
    if (existing) {
      db.prepare(`
        UPDATE radiology_results 
        SET findings = ?, impression = ?, image_url = ?, dicom_metadata = ?, reported_by = ?, reported_at = CURRENT_TIMESTAMP
        WHERE order_id = ?
      `).run(findings, impression, image_url, dicom_metadata, reported_by, order_id);
    } else {
      db.prepare(`
        INSERT INTO radiology_results (order_id, findings, impression, image_url, dicom_metadata, reported_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(order_id, findings, impression, image_url, dicom_metadata, reported_by);
    }
    
    db.prepare("UPDATE radiology_orders SET status = 'Completed' WHERE id = ?").run(order_id);
    res.json({ success: true });
  });

  app.post("/api/radiology/mock-pacs-fetch", (req, res) => {
    const { orderId, testName } = req.body;
    // Simulate fetching from a PACS server
    const mockImages: Record<string, string> = {
      'Chest X-Ray PA View': 'https://picsum.photos/seed/xray/800/800?grayscale',
      'Ultrasound Whole Abdomen': 'https://picsum.photos/seed/usg/800/800?blur=2',
      'ECG - 12 Lead': 'https://picsum.photos/seed/ecg/800/400',
      'CT Brain Plain': 'https://picsum.photos/seed/ct/800/800?grayscale',
      'MRI Lumbar Spine': 'https://picsum.photos/seed/mri/800/800?grayscale'
    };
    
    const imageUrl = mockImages[testName] || 'https://picsum.photos/seed/rad/800/800';
    const dicomMetadata = JSON.stringify({
      Modality: testName.split(' ')[0],
      PatientID: "P-" + Math.floor(Math.random() * 10000),
      StudyDate: new Date().toISOString().split('T')[0],
      Manufacturer: "GE Healthcare",
      StationName: "RAD-STATION-01"
    });

    res.json({ success: true, imageUrl, dicomMetadata });
  });

  // Emergency & ICU
  app.get("/api/emergency/patients", (req, res) => {
    const hospitalId = req.query.hospitalId;
    const patients = db.prepare(`
      SELECT * FROM emergency_patients 
      WHERE hospital_id = ? 
      ORDER BY 
        CASE triage_level 
          WHEN 'Red' THEN 1 
          WHEN 'Yellow' THEN 2 
          WHEN 'Green' THEN 3 
          WHEN 'Black' THEN 4 
        END, 
        arrival_time DESC
    `).all(hospitalId);
    res.json(patients);
  });

  app.post("/api/emergency/register", (req, res) => {
    const { hospital_id, patient_name, age, gender, mobile, chief_complaint, triage_level } = req.body;
    const info = db.prepare(`
      INSERT INTO emergency_patients (hospital_id, patient_name, age, gender, mobile, chief_complaint, triage_level)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(hospital_id, patient_name, age, gender, mobile, chief_complaint, triage_level);
    
    // Trigger WhatsApp: Emergency Alert (if mobile provided)
    if (mobile) {
      // We need a version of sendWhatsAppMessage that takes a phone number directly
      // Or we just use the existing one if we can link it to a patient record
      // For now, let's just log it or add a direct sender
      console.log(`[WhatsApp] Emergency Alert for ${patient_name} at ${mobile}`);
    }

    res.json({ success: true, id: info.lastInsertRowid });
  });

  app.patch("/api/emergency/patients/:id", (req, res) => {
    const { id } = req.params;
    const { triage_level, status, vitals_hr, vitals_bp, vitals_spo2, vitals_temp } = req.body;
    
    db.prepare(`
      UPDATE emergency_patients 
      SET triage_level = COALESCE(?, triage_level),
          status = COALESCE(?, status),
          vitals_hr = COALESCE(?, vitals_hr),
          vitals_bp = COALESCE(?, vitals_bp),
          vitals_spo2 = COALESCE(?, vitals_spo2),
          vitals_temp = COALESCE(?, vitals_temp)
      WHERE id = ?
    `).run(triage_level, status, vitals_hr, vitals_bp, vitals_spo2, vitals_temp, id);
    
    res.json({ success: true });
  });

  app.get("/api/icu/vitals/:patientId", (req, res) => {
    const { patientId } = req.params;
    const vitals = db.prepare(`
      SELECT * FROM icu_vitals 
      WHERE patient_id = ? 
      ORDER BY recorded_at DESC 
      LIMIT 50
    `).all(patientId);
    res.json(vitals);
  });

  app.post("/api/icu/vitals", (req, res) => {
    const { patient_id, hr, bp_sys, bp_dia, spo2, temp } = req.body;
    db.prepare(`
      INSERT INTO icu_vitals (patient_id, hr, bp_sys, bp_dia, spo2, temp)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(patient_id, hr, bp_sys, bp_dia, spo2, temp);
    
    // Update current vitals in patient record too
    db.prepare(`
      UPDATE emergency_patients 
      SET vitals_hr = ?, vitals_bp = ?, vitals_spo2 = ?, vitals_temp = ?
      WHERE id = ?
    `).run(hr, `${bp_sys}/${bp_dia}`, spo2, temp, patient_id);
    
    res.json({ success: true });
  });

  app.get("/api/icu/equipment", (req, res) => {
    const hospitalId = req.query.hospitalId;
    const equipment = db.prepare("SELECT * FROM icu_equipment WHERE hospital_id = ?").all(hospitalId);
    res.json(equipment);
  });

  app.patch("/api/icu/equipment/:id", (req, res) => {
    const { id } = req.params;
    const { status, assigned_to_patient_id } = req.body;
    db.prepare(`
      UPDATE icu_equipment 
      SET status = ?, assigned_to_patient_id = ?
      WHERE id = ?
    `).run(status, assigned_to_patient_id, id);
    res.json({ success: true });
  });

  app.get("/api/icu/crash-cart", (req, res) => {
    const hospitalId = req.query.hospitalId;
    const items = db.prepare("SELECT * FROM crash_cart_inventory WHERE hospital_id = ?").all(hospitalId);
    res.json(items);
  });

  app.patch("/api/icu/crash-cart/:id", (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;
    db.prepare("UPDATE crash_cart_inventory SET quantity = ? WHERE id = ?").run(quantity, id);
    res.json({ success: true });
  });

  // --- Prescription Endpoints ---
  app.get("/api/prescriptions/templates", (req, res) => {
    const hospitalId = req.query.hospitalId;
    const templates = db.prepare(`
      SELECT t.*, 
             (SELECT json_group_array(json_object(
               'medicine_name', medicine_name, 
               'dosage', dosage, 
               'frequency', frequency, 
               'duration', duration, 
               'instructions', instructions
             )) FROM prescription_template_items WHERE template_id = t.id) as items
      FROM prescription_templates t
      WHERE t.hospital_id = ?
    `).all(hospitalId);
    
    const parsedTemplates = templates.map((t: any) => ({
      ...t,
      items: JSON.parse(t.items)
    }));
    
    res.json(parsedTemplates);
  });

  app.get("/api/prescriptions/history/:patientId", (req, res) => {
    const { patientId } = req.params;
    const history = db.prepare(`
      SELECT p.*, d.name as doctor_name,
             (SELECT json_group_array(json_object(
               'medicine_name', medicine_name, 
               'dosage', dosage, 
               'frequency', frequency, 
               'duration', duration, 
               'instructions', instructions
             )) FROM prescription_items WHERE prescription_id = p.id) as items
      FROM prescriptions p
      JOIN doctors d ON p.doctor_id = d.id
      WHERE p.patient_id = ?
      ORDER BY p.created_at DESC
    `).all(patientId);

    const parsedHistory = history.map((h: any) => ({
      ...h,
      items: JSON.parse(h.items)
    }));

    res.json(parsedHistory);
  });

  app.post("/api/prescriptions", (req, res) => {
    const { hospital_id, patient_id, doctor_id, visit_id, admission_id, diagnosis, notes, items, doctor_signature } = req.body;
    
    const info = db.prepare(`
      INSERT INTO prescriptions (hospital_id, patient_id, doctor_id, visit_id, admission_id, diagnosis, notes, doctor_signature)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(hospital_id, patient_id, doctor_id, visit_id, admission_id, diagnosis, notes, doctor_signature);
    
    const prescriptionId = info.lastInsertRowid;
    const insertItem = db.prepare(`
      INSERT INTO prescription_items (prescription_id, medicine_name, dosage, frequency, duration, instructions)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    items.forEach((item: any) => {
      insertItem.run(prescriptionId, item.medicine_name, item.dosage, item.frequency, item.duration, item.instructions);
    });

    // Also update the visit or admission if provided
    if (visit_id) {
      db.prepare("UPDATE opd_visits SET diagnosis = ?, prescription = 'Prescription Generated' WHERE id = ?").run(diagnosis, visit_id);
    }

    res.json({ success: true, id: prescriptionId });
  });

  // --- Consultant Appointments ---
  app.get("/api/consultants/appointments", (req, res) => {
    const { hospitalId } = req.query;
    const appointments = db.prepare(`
      SELECT ca.*, p.name as patient_name, d.name as doctor_name, d.department as specialty
      FROM consultant_appointments ca
      JOIN patients p ON ca.patient_id = p.id
      JOIN doctors d ON ca.doctor_id = d.id
      WHERE ca.hospital_id = ?
      ORDER BY ca.appointment_date DESC
    `).all(hospitalId);
    res.json(appointments);
  });

  app.post("/api/consultants/appointments", (req, res) => {
    const { hospital_id, doctor_id, patient_id, appointment_date, referral_source, consultation_fee } = req.body;
    const info = db.prepare(`
      INSERT INTO consultant_appointments (hospital_id, doctor_id, patient_id, appointment_date, referral_source, consultation_fee)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(hospital_id, doctor_id, patient_id, appointment_date, referral_source, consultation_fee);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/consultants/appointments/:id", (req, res) => {
    const { id } = req.params;
    const { status, payment_status } = req.body;
    if (status) {
      db.prepare("UPDATE consultant_appointments SET status = ? WHERE id = ?").run(status, id);
    }
    if (payment_status) {
      db.prepare("UPDATE consultant_appointments SET payment_status = ? WHERE id = ?").run(payment_status, id);
    }
    res.json({ success: true });
  });

  // --- Referrals ---
  app.get("/api/consultants/referrals", (req, res) => {
    const { hospitalId } = req.query;
    const referrals = db.prepare(`
      SELECT r.*, p.name as patient_name, d.name as from_doctor_name
      FROM referrals r
      JOIN patients p ON r.patient_id = p.id
      JOIN doctors d ON r.from_doctor_id = d.id
      WHERE r.hospital_id = ?
      ORDER BY r.id DESC
    `).all(hospitalId);
    res.json(referrals);
  });

  app.post("/api/consultants/referrals", (req, res) => {
    const { hospital_id, patient_id, from_doctor_id, to_specialty, reason } = req.body;
    const info = db.prepare(`
      INSERT INTO referrals (hospital_id, patient_id, from_doctor_id, to_specialty, reason)
      VALUES (?, ?, ?, ?, ?)
    `).run(hospital_id, patient_id, from_doctor_id, to_specialty, reason);
    res.json({ id: info.lastInsertRowid });
  });

  // --- Ambulances ---
  app.get("/api/ambulances", (req, res) => {
    const { hospitalId } = req.query;
    const ambulances = db.prepare("SELECT * FROM ambulances WHERE hospital_id = ?").all(hospitalId);
    res.json(ambulances);
  });

  app.get("/api/ambulances/bookings", (req, res) => {
    const { hospitalId } = req.query;
    const bookings = db.prepare(`
      SELECT ab.*, p.name as patient_name, a.vehicle_number, a.driver_name
      FROM ambulance_bookings ab
      LEFT JOIN patients p ON ab.patient_id = p.id
      LEFT JOIN ambulances a ON ab.ambulance_id = a.id
      WHERE ab.hospital_id = ?
      ORDER BY ab.booking_time DESC
    `).all(hospitalId);
    res.json(bookings);
  });

  app.post("/api/ambulances/bookings", (req, res) => {
    const { hospital_id, patient_id, pickup_location, destination, fare } = req.body;
    const info = db.prepare(`
      INSERT INTO ambulance_bookings (hospital_id, patient_id, pickup_location, destination, fare)
      VALUES (?, ?, ?, ?, ?)
    `).run(hospital_id, patient_id, pickup_location, destination, fare);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/ambulances/bookings/:id", (req, res) => {
    const { id } = req.params;
    const { status, ambulance_id, completion_time } = req.body;
    if (status) {
      db.prepare("UPDATE ambulance_bookings SET status = ? WHERE id = ?").run(status, id);
      
      // If completed, free up the ambulance
      if (status === 'Completed' && ambulance_id) {
        db.prepare("UPDATE ambulances SET status = 'Available' WHERE id = ?").run(ambulance_id);
      }
    }
    if (ambulance_id) {
      db.prepare("UPDATE ambulance_bookings SET ambulance_id = ?, status = 'Assigned' WHERE id = ?").run(ambulance_id, id);
      db.prepare("UPDATE ambulances SET status = 'Busy' WHERE id = ?").run(ambulance_id);
    }
    if (completion_time) {
      db.prepare("UPDATE ambulance_bookings SET completion_time = ? WHERE id = ?").run(completion_time, id);
    }
    res.json({ success: true });
  });

  // --- Billing Endpoints ---
  app.get("/api/billing", (req, res) => {
    const { hospitalId } = req.query;
    const bills = db.prepare(`
      SELECT b.*, p.name as patient_name, p.patient_id_str
      FROM billing_records b
      JOIN patients p ON b.patient_id = p.id
      WHERE b.hospital_id = ?
      ORDER BY b.bill_date DESC
    `).all(hospitalId);
    res.json(bills);
  });

  app.get("/api/billing/:id", (req, res) => {
    const { id } = req.params;
    const bill = db.prepare(`
      SELECT b.*, p.name as patient_name, p.patient_id_str, p.mobile as patient_mobile, p.address as patient_address
      FROM billing_records b
      JOIN patients p ON b.patient_id = p.id
      WHERE b.id = ?
    `).get(id);
    
    if (!bill) return res.status(404).json({ error: "Bill not found" });
    
    const items = db.prepare("SELECT * FROM billing_items WHERE bill_id = ?").all(id);
    res.json({ ...bill, items });
  });

  app.post("/api/billing", (req, res) => {
    const { hospital_id, patient_id, bill_number, total_amount, discount_amount, tax_amount, net_amount, payment_mode, category, items } = req.body;
    
    const transaction = db.transaction(() => {
      const info = db.prepare(`
        INSERT INTO billing_records (hospital_id, patient_id, bill_number, total_amount, discount_amount, tax_amount, net_amount, payment_mode, category, payment_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Paid')
      `).run(hospital_id, patient_id, bill_number, total_amount, discount_amount, tax_amount, net_amount, payment_mode, category);
      
      const billId = info.lastInsertRowid;
      const insertItem = db.prepare(`
        INSERT INTO billing_items (bill_id, description, quantity, unit_price, total_price, category)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      for (const item of items) {
        insertItem.run(billId, item.description, item.quantity, item.unit_price, item.total_price, item.category);
      }
      
      return billId;
    });
    
    const billId = transaction();
    
    // Trigger WhatsApp: Payment received
    sendWhatsAppMessage(
      hospital_id,
      patient_id,
      "Payment Confirmation",
      `Thank you! We have received your payment of ₹${net_amount} for ${category} bill ${bill_number}.`
    );
    
    res.json({ success: true, id: billId });
  });

  // --- Statutory Endpoints ---
  app.get("/api/statutory", (req, res) => {
    const { hospitalId } = req.query;
    const registers = db.prepare("SELECT * FROM statutory_registers WHERE hospital_id = ? ORDER BY entry_date DESC").all(hospitalId);
    res.json(registers);
  });

  app.post("/api/statutory", (req, res) => {
    const { hospital_id, type, recorded_by, details_json, status } = req.body;
    const info = db.prepare(`
      INSERT INTO statutory_registers (hospital_id, type, recorded_by, details_json, status)
      VALUES (?, ?, ?, ?, ?)
    `).run(hospital_id, type, recorded_by, details_json, status);
    res.json({ id: info.lastInsertRowid });
  });

  // --- Birth & Death Endpoints ---
  app.get("/api/birth-records", (req, res) => {
    const { hospitalId } = req.query;
    const records = db.prepare(`
      SELECT b.*, d.name as doctor_name
      FROM birth_records b
      JOIN doctors d ON b.doctor_id = d.id
      WHERE b.hospital_id = ? AND b.archived = 0
      ORDER BY b.date_of_birth DESC
    `).all(hospitalId);
    res.json(records);
  });

  app.post("/api/birth-records", (req, res) => {
    const { hospital_id, patient_id, baby_name, gender, date_of_birth, time_of_birth, weight_kg, mother_name, father_name, address, doctor_id } = req.body;
    const info = db.prepare(`
      INSERT INTO birth_records (hospital_id, patient_id, baby_name, gender, date_of_birth, time_of_birth, weight_kg, mother_name, father_name, address, doctor_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(hospital_id, patient_id, baby_name, gender, date_of_birth, time_of_birth, weight_kg, mother_name, father_name, address, doctor_id);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/death-records", (req, res) => {
    const { hospitalId } = req.query;
    const records = db.prepare(`
      SELECT dr.*, p.name as patient_name, d.name as doctor_name
      FROM death_records dr
      JOIN patients p ON dr.patient_id = p.id
      JOIN doctors d ON dr.doctor_id = d.id
      WHERE dr.hospital_id = ? AND dr.archived = 0
      ORDER BY dr.date_of_death DESC
    `).all(hospitalId);
    res.json(records);
  });

  app.post("/api/death-records", (req, res) => {
    const { hospital_id, patient_id, date_of_death, time_of_death, cause_of_death, doctor_id } = req.body;
    const info = db.prepare(`
      INSERT INTO death_records (hospital_id, patient_id, date_of_death, time_of_death, cause_of_death, doctor_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(hospital_id, patient_id, date_of_death, time_of_death, cause_of_death, doctor_id);
    res.json({ id: info.lastInsertRowid });
  });

  // --- Discharge Endpoints ---
  app.get("/api/discharge-records", (req, res) => {
    const { hospitalId } = req.query;
    const records = db.prepare(`
      SELECT dr.*, p.name as patient_name, d.name as doctor_name
      FROM discharge_records dr
      JOIN patients p ON dr.patient_id = p.id
      JOIN doctors d ON dr.doctor_id = d.id
      WHERE dr.hospital_id = ?
      ORDER BY dr.discharge_date DESC
    `).all(hospitalId);
    res.json(records);
  });

  app.post("/api/discharge-records", (req, res) => {
    const { hospital_id, admission_id, patient_id, doctor_id, discharge_summary, medications_json, follow_up_date, follow_up_notes } = req.body;
    const info = db.prepare(`
      INSERT INTO discharge_records (hospital_id, admission_id, patient_id, doctor_id, discharge_summary, medications_json, follow_up_date, follow_up_notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(hospital_id, admission_id, patient_id, doctor_id, discharge_summary, medications_json, follow_up_date, follow_up_notes);
    
    const recordId = info.lastInsertRowid;
    
    // Trigger WhatsApp: Discharge summary ready
    sendWhatsAppMessage(
      hospital_id,
      patient_id,
      "Discharge Summary",
      "Your discharge summary is ready. Please collect it from the nursing station. Wishing you a speedy recovery!"
    );
    
    res.json({ success: true, id: recordId });
  });
  // --- End of API Routes ---

  app.post("/api/lab/mock-device-fetch", (req, res) => {
    const { orderId, deviceType } = req.body;
    // Simulate HL7/FHIR fetch from a device
    const results = db.prepare(`
      SELECT r.id, t.name 
      FROM lab_results r
      JOIN lab_test_catalog t ON r.test_id = t.id
      WHERE r.order_id = ?
    `).all(orderId);

    const mockResults = (results as any[]).map(r => {
      let val = "";
      if (r.name.includes("Hemoglobin")) val = (12 + Math.random() * 4).toFixed(1);
      else if (r.name.includes("Sugar")) val = (80 + Math.random() * 100).toFixed(0);
      else if (r.name.includes("Creatinine")) val = (0.6 + Math.random() * 0.8).toFixed(2);
      else val = (Math.random() * 10).toFixed(1);

      return {
        id: r.id,
        result_value: val,
        is_abnormal: false,
        performed_by: "Auto-Device-" + deviceType,
        device_id: "DEV-" + Math.random().toString(36).substring(7).toUpperCase()
      };
    });

    res.json({ success: true, results: mockResults });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
