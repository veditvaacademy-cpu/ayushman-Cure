import Database from "better-sqlite3";

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

// Migrations
try {
  db.prepare("ALTER TABLE doctors ADD COLUMN consultation_fee REAL DEFAULT 0").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE emergency_patients ADD COLUMN mobile TEXT").run();
} catch (e) {}

try {
  db.exec("ALTER TABLE ipd_admissions ADD COLUMN risk_code TEXT DEFAULT 'GREEN'");
} catch (e) {}

export default db;
