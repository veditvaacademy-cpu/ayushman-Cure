import db from "./db.js";

export function seed() {
  // Seed Super Admin if not exists
  const sadmin = db.prepare("SELECT * FROM users WHERE username = ?").get("sadmin");
  if (!sadmin) {
    db.prepare("INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)").run(
      "sadmin",
      "12345@DC",
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
    }
  }
}
