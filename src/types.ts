export interface User {
  id: number;
  hospital_id: number | null;
  username: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'DOCTOR' | 'NURSE' | 'LAB_TECH' | 'RADIO_TECH' | 'PHARMACY' | 'BILLING' | 'RECEPTION' | 'OT_COORDINATOR' | 'HR_ADMIN' | 'AMBULANCE_OPERATOR';
  name: string;
  hospital_name?: string;
}

export interface Hospital {
  id: number;
  name: string;
  address: string;
  config: string; // JSON
}

export interface Patient {
  id: number;
  patient_id_str: string;
  name: string;
  age: number;
  gender: string;
  address: string;
  mobile: string;
}

export interface Doctor {
  id: number;
  name: string;
  department: string;
  schedule?: string;
  consultation_fee?: number;
}

export interface OPDVisit {
  id: number;
  patient_id: number;
  doctor_id: number;
  visit_date: string;
  token_number: number;
  symptoms: string;
  diagnosis: string;
  prescription: string;
  notes: string;
  status: 'Waiting' | 'In-Progress' | 'Completed';
  patient_name?: string;
  patient_id_str?: string;
  doctor_name?: string;
  fee_amount?: number;
  payment_status?: 'Paid' | 'Unpaid' | 'Pending';
  vitals_temp?: string;
  vitals_bp?: string;
  vitals_pulse?: string;
  vitals_spo2?: string;
  vitals_weight?: string;
  vitals_height?: string;
  vitals_bmi?: string;
  vitals_rr?: string;
}

export interface Bed {
  id: number;
  hospital_id: number;
  ward_name: string;
  bed_number: string;
  type: 'General' | 'Private' | 'ICU';
  status: 'Available' | 'Occupied';
}

export interface IPDAdmission {
  id: number;
  hospital_id: number;
  patient_id: number;
  doctor_id: number;
  bed_id: number;
  admission_date: string;
  admission_note?: string;
  treatment_plan?: string;
  surgery_notes?: string;
  status: 'Admitted' | 'Discharged';
  discharge_date?: string;
  discharge_summary?: string;
  patient_name?: string;
  patient_id_str?: string;
  doctor_name?: string;
  ward_name?: string;
  bed_number?: string;
  bed_type?: string;
  age?: number;
  gender?: string;
  vitals?: IPDVital[];
  nursingNotes?: IPDNursingNote[];
  rounds?: IPDConsultantRound[];
  medications?: IPDMedication[];
}

export interface IPDVital {
  id: number;
  admission_id: number;
  recorded_at: string;
  temp?: string;
  bp?: string;
  pulse?: string;
  spO2?: string;
  respiration?: string;
}

export interface IPDNursingNote {
  id: number;
  admission_id: number;
  recorded_at: string;
  note: string;
}

export interface IPDConsultantRound {
  id: number;
  admission_id: number;
  doctor_id: number;
  round_date: string;
  notes: string;
  doctor_name?: string;
}

export interface IPDMedication {
  id: number;
  admission_id: number;
  medicine_name: string;
  dosage?: string;
  frequency?: string;
  start_date: string;
  end_date?: string;
  status: string;
}

export interface PharmacyItem {
  id: number;
  hospital_id: number;
  name: string;
  generic_name?: string;
  category: string;
  uom: string;
  is_narcotic: number;
  min_stock_level: number;
  total_stock?: number;
}

export interface PharmacyBatch {
  id: number;
  item_id: number;
  batch_number: string;
  expiry_date: string;
  mrp: number;
  purchase_price: number;
  gst_percent: number;
  current_stock: number;
  item_name?: string;
  is_narcotic?: number;
}

export interface PharmacySupplier {
  id: number;
  hospital_id: number;
  name: string;
  contact_person?: string;
  mobile?: string;
  email?: string;
  address?: string;
  gstin?: string;
}

export interface PharmacyNarcoticsLog {
  id: number;
  item_id: number;
  batch_id: number;
  action_type: string;
  quantity: number;
  log_date: string;
  item_name?: string;
  batch_number?: string;
}

export interface OTRoom {
  id: number;
  hospital_id: number;
  name: string;
  type: string;
  status: 'Available' | 'Occupied' | 'Maintenance';
}

export interface OTBooking {
  id: number;
  hospital_id: number;
  patient_id: number;
  doctor_id: number;
  room_id: number;
  surgery_name: string;
  scheduled_at: string;
  duration_minutes: number;
  status: 'Scheduled' | 'In-Progress' | 'Completed' | 'Cancelled';
  patient_name?: string;
  doctor_name?: string;
  room_name?: string;
}

export interface OTPreOpAssessment {
  id: number;
  booking_id: number;
  fitness_status: string;
  vitals_json: string;
  investigations_json: string;
  notes: string;
  recorded_at: string;
}

export interface OTAnesthesiaRecord {
  id: number;
  booking_id: number;
  anesthesiologist_id: number;
  type: string;
  medications_json: string;
  vitals_monitoring_json: string;
  notes: string;
  recorded_at: string;
}

export interface OTIntraOpNote {
  id: number;
  booking_id: number;
  surgeon_id: number;
  procedure_details: string;
  findings: string;
  complications: string;
  recorded_at: string;
}

export interface OTPostOpCare {
  id: number;
  booking_id: number;
  recovery_status: string;
  vitals_json: string;
  instructions: string;
  recorded_at: string;
}

export interface OTInventoryItem {
  id: number;
  hospital_id: number;
  name: string;
  category: 'Surgical Kit' | 'Disposable' | 'Anesthesia Drug' | 'Suture' | 'Implant';
  uom: string;
  current_stock: number;
  min_stock_level: number;
}

export interface OTConsumableUsage {
  id: number;
  booking_id: number;
  item_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  item_name?: string;
}

export interface OTInfectionLog {
  id: number;
  room_id: number;
  action_type: 'Sterilization' | 'Fumigation' | 'Cleaning';
  performed_at: string;
  performed_by: string;
  notes: string;
  room_name?: string;
}

export interface NursingTask {
  id: number;
  admission_id: number;
  task_type: 'Dressing' | 'Nebulization' | 'Injection' | 'IV management' | 'Monitoring';
  scheduled_at: string;
  completed_at?: string;
  performed_by?: string;
  status: 'Pending' | 'Completed' | 'Overdue';
  notes?: string;
  patient_name?: string;
  bed_number?: string;
}

export interface NursingMedicationAdministration {
  id: number;
  medication_id: number;
  scheduled_at: string;
  administered_at?: string;
  administered_by?: string;
  status: 'Pending' | 'Administered' | 'Overdue' | 'Skipped';
  notes?: string;
}

export interface NursingShift {
  id: number;
  hospital_id: number;
  ward_name: string;
  shift_name: 'Morning' | 'Evening' | 'Night';
  nurse_name: string;
  start_time: string;
  end_time: string;
}

export interface LabTest {
  id: number;
  hospital_id: number;
  name: string;
  category: string;
  reference_range: string;
  unit: string;
  price: number;
  is_group?: number;
  item_ids?: number[];
}

export interface LabOrder {
  id: number;
  hospital_id: number;
  patient_id: number;
  doctor_id: number;
  visit_id?: number;
  admission_id?: number;
  order_date: string;
  status: 'Pending' | 'Collected' | 'Processing' | 'Completed' | 'Cancelled';
  priority: 'Routine' | 'Urgent' | 'STAT';
  notes: string;
  patient_name?: string;
  doctor_name?: string;
  patient_id_str?: string;
}

export interface LabResult {
  id: number;
  order_id: number;
  test_id: number;
  result_value: string;
  is_abnormal: boolean;
  performed_at: string;
  performed_by: string;
  device_id?: string;
  test_name?: string;
  reference_range?: string;
  unit?: string;
}

export interface RadiologyTest {
  id: number;
  hospital_id: number;
  name: string;
  category: string;
  price: number;
  instructions: string;
}

export interface RadiologyOrder {
  id: number;
  hospital_id: number;
  patient_id: number;
  doctor_id: number;
  test_id: number;
  status: 'Pending' | 'Scheduled' | 'Completed' | 'Cancelled';
  priority: 'Routine' | 'Urgent' | 'STAT';
  clinical_history: string;
  order_date: string;
  patient_name: string;
  patient_id_str: string;
  doctor_name: string;
  test_name: string;
}

export interface RadiologyResult {
  id: number;
  order_id: number;
  findings: string;
  impression: string;
  image_url: string; // URL to the image (simulated PACS)
  dicom_metadata?: string;
  reported_at: string;
  reported_by: string;
}

export interface Appointment {
  id: number;
  hospital_id: number;
  patient_id: number;
  doctor_id: number;
  appointment_date: string;
  appointment_time: string;
  status: 'Requested' | 'Confirmed' | 'Cancelled' | 'Completed';
  reason: string;
  created_at: string;
  patient_name?: string;
  doctor_name?: string;
  patient_phone?: string;
}

export interface WhatsAppLog {
  id: number;
  hospital_id: number;
  patient_id: number;
  phone_number: string;
  message_type: string;
  message_content: string;
  status: 'Sent' | 'Failed';
  sent_at: string;
  patient_name?: string;
}

export type TriageLevel = 'Red' | 'Yellow' | 'Green' | 'Black';

export interface EmergencyPatient {
  id: number;
  hospital_id: number;
  patient_name: string;
  age: number;
  gender: string;
  chief_complaint: string;
  triage_level: TriageLevel;
  arrival_time: string;
  status: 'Waiting' | 'Under Treatment' | 'Admitted' | 'Discharged' | 'Expired';
  vitals_hr?: number;
  vitals_bp?: string;
  vitals_spo2?: number;
  vitals_temp?: number;
}

export interface ICUVitals {
  id: number;
  patient_id: number;
  hr: number;
  bp_sys: number;
  bp_dia: number;
  spo2: number;
  temp: number;
  recorded_at: string;
}

export interface ICUEquipment {
  id: number;
  hospital_id: number;
  name: string;
  type: 'Ventilator' | 'Monitor' | 'Defibrillator' | 'Infusion Pump' | 'Dialysis Machine';
  status: 'In Use' | 'Available' | 'Maintenance';
  assigned_to_patient_id?: number;
  last_service_date: string;
}

export interface CrashCartItem {
  id: number;
  hospital_id: number;
  item_name: string;
  category: 'Medication' | 'Airway' | 'IV Access' | 'Other';
  quantity: number;
  min_quantity: number;
  expiry_date: string;
}

export interface PrescriptionItem {
  id: number;
  prescription_id: number;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface Prescription {
  id: number;
  hospital_id: number;
  patient_id: number;
  doctor_id: number;
  visit_id?: number;
  admission_id?: number;
  diagnosis: string;
  notes: string;
  created_at: string;
  doctor_signature: string;
  items: PrescriptionItem[];
  patient_name?: string;
  doctor_name?: string;
}

export interface PrescriptionTemplate {
  id: number;
  hospital_id: number;
  diagnosis: string;
  template_name: string;
  items: Omit<PrescriptionItem, 'id' | 'prescription_id'>[];
}

export interface ConsultantAppointment {
  id: number;
  hospital_id: number;
  doctor_id: number;
  patient_id: number;
  appointment_date: string;
  status: 'Pending' | 'Authorized' | 'Completed' | 'Cancelled';
  referral_source?: string;
  consultation_fee?: number;
  payment_status: 'Unpaid' | 'Paid';
  patient_name?: string;
  doctor_name?: string;
  specialty?: string;
}

export interface Referral {
  id: number;
  hospital_id: number;
  patient_id: number;
  from_doctor_id: number;
  to_specialty: string;
  reason?: string;
  status: 'Pending' | 'Completed';
  patient_name?: string;
  from_doctor_name?: string;
}

export interface Ambulance {
  id: number;
  hospital_id: number;
  vehicle_number: string;
  driver_name: string;
  driver_mobile: string;
  status: 'Available' | 'Busy' | 'Maintenance';
}

export interface AmbulanceBooking {
  id: number;
  hospital_id: number;
  patient_id?: number;
  pickup_location: string;
  destination: string;
  status: 'Requested' | 'Assigned' | 'Enroute' | 'Completed' | 'Cancelled';
  ambulance_id?: number;
  booking_time: string;
  completion_time?: string;
  fare?: number;
  patient_name?: string;
  vehicle_number?: string;
  driver_name?: string;
}

export interface BillingRecord {
  id: number;
  hospital_id: number;
  patient_id: number;
  bill_number: string;
  bill_date: string;
  items: BillingItem[];
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  net_amount: number;
  payment_status: 'Unpaid' | 'Partially Paid' | 'Paid';
  payment_mode: 'Cash' | 'UPI' | 'Debit/Credit' | 'Insurance' | 'Ayushman';
  category: 'OPD' | 'IPD' | 'Pharmacy' | 'Lab' | 'Radiology' | 'OT' | 'ICU' | 'Ambulance' | 'Package';
  patient_name?: string;
  patient_id_str?: string;
}

export interface BillingItem {
  id: number;
  bill_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  category: string;
}

export interface StatutoryRegister {
  id: number;
  hospital_id: number;
  type: 'Biomedical Waste' | 'Infection Control' | 'NABH' | 'Fire Safety' | 'Drug License' | 'Controlled Substance';
  entry_date: string;
  recorded_by: string;
  details_json: string;
  status: 'Compliant' | 'Non-Compliant' | 'Pending Review';
  attachments?: string[];
}

export interface BirthRecord {
  id: number;
  hospital_id: number;
  patient_id?: number; // Mother's ID
  baby_name?: string;
  gender: 'Male' | 'Female' | 'Other';
  date_of_birth: string;
  time_of_birth: string;
  weight_kg: number;
  mother_name: string;
  father_name: string;
  address: string;
  doctor_id: number;
  doctor_name?: string;
  approval_status: 'Pending' | 'Approved' | 'Rejected';
  certificate_generated: boolean;
  legal_registration_number?: string;
  archived: boolean;
}

export interface DeathRecord {
  id: number;
  hospital_id: number;
  patient_id: number;
  patient_name: string;
  patient_id_str: string;
  age: number;
  gender: string;
  date_of_death: string;
  time_of_death: string;
  cause_of_death: string;
  doctor_id: number;
  doctor_name?: string;
  approval_status: 'Pending' | 'Approved' | 'Rejected';
  certificate_generated: boolean;
  legal_registration_number?: string;
  archived: boolean;
}

export interface DischargeRecord {
  id: number;
  hospital_id: number;
  admission_id: number;
  patient_id: number;
  patient_name: string;
  patient_id_str: string;
  doctor_id: number;
  doctor_name: string;
  discharge_date: string;
  discharge_summary: string;
  medications: {
    medicine_name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }[];
  billing_status: 'Cleared' | 'Pending';
  follow_up_date?: string;
  follow_up_notes?: string;
  status: 'Draft' | 'Finalized';
  whatsapp_sent: boolean;
}

export interface FireExtinguisher {
  id: number;
  hospital_id: number;
  location: string;
  type: 'Water' | 'Foam' | 'Dry Powder' | 'CO2' | 'Wet Chemical';
  capacity: string;
  last_service_date: string;
  expiry_date: string;
  amc_provider: string;
  amc_expiry: string;
  status: 'Functional' | 'Needs Service' | 'Expired';
}

export interface FacilityMaintenance {
  id: number;
  hospital_id: number;
  asset_type: 'Lift' | 'Electrical' | 'Generator' | 'Plumbing' | 'HVAC';
  asset_name: string;
  last_maintenance_date: string;
  next_maintenance_date: string;
  maintenance_type: 'Routine' | 'Breakdown' | 'AMC';
  performed_by: string;
  notes: string;
  status: 'Operational' | 'Under Maintenance' | 'Faulty';
}

export interface SafetyIncident {
  id: number;
  hospital_id: number;
  incident_type: 'Accident' | 'Fire' | 'Theft' | 'Security Breach' | 'Medical Error' | 'Other';
  description: string;
  location: string;
  incident_date: string;
  incident_time: string;
  reported_by: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  action_taken: string;
  status: 'Open' | 'Investigating' | 'Resolved' | 'Closed';
}

export interface CCTVLog {
  id: number;
  hospital_id: number;
  camera_location: string;
  log_date: string;
  checked_by: string;
  status: 'Normal' | 'Issue Detected';
  notes: string;
}
