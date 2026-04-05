import React, { useState, useEffect, useMemo, useRef } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  LineChart,
  Line,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area
} from 'recharts';
import { 
  LayoutDashboard, 
  Users, 
  Hospital as HospitalIcon, 
  Stethoscope, 
  ClipboardList, 
  LogOut,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  UserPlus,
  CreditCard,
  Settings,
  ShieldCheck,
  Activity,
  Bed,
  Thermometer,
  Pill,
  FileText,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  Save,
  ShoppingCart,
  Package,
  Truck,
  AlertTriangle,
  History,
  BarChart3,
  Scissors,
  Syringe,
  ShieldAlert,
  ClipboardCheck,
  Calendar,
  Microscope,
  Share2,
  FileDown,
  TrendingUp,
  FileText as FileTextIcon,
  ClipboardList as ClipboardListIcon,
  Printer,
  Download,
  MessageSquare,
  Send,
  Bell,
  Cake,
  HeartPulse,
  Zap,
  Wind,
  Gauge,
  X,
  Baby,
  Skull,
  Archive,
  Search as SearchIcon,
  Flame,
  Video,
  Wrench,
  Phone,
  Barcode,
  QrCode,
  LayoutGrid,
  DollarSign,
  MapPin,
  Gift,
  Eye,
  EyeOff,
  User as LucideUser,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';

import { 
  User, 
  Hospital, 
  Patient, 
  Doctor, 
  OPDVisit, 
  Bed as BedType, 
  IPDAdmission, 
  IPDVital, 
  IPDNursingNote, 
  IPDConsultantRound, 
  IPDMedication,
  PharmacyItem,
  PharmacyBatch,
  PharmacySupplier,
  PharmacyNarcoticsLog,
  OTRoom,
  OTBooking,
  OTInventoryItem,
  OTInfectionLog,
  NursingTask,
  NursingMedicationAdministration,
  NursingShift,
  LabTest,
  LabOrder,
  LabResult,
  RadiologyTest,
  RadiologyOrder,
  RadiologyResult,
  Appointment,
  WhatsAppLog,
  EmergencyPatient,
  TriageLevel,
  ICUVitals,
  ICUEquipment,
  CrashCartItem,
  Prescription,
  PrescriptionItem,
  PrescriptionTemplate,
  ConsultantAppointment,
  Referral,
  Ambulance,
  AmbulanceBooking,
  BillingRecord,
  StatutoryRegister,
  BirthRecord,
  DeathRecord,
  DischargeRecord,
  FireExtinguisher,
  FacilityMaintenance,
  SafetyIncident,
  CCTVLog
} from './types';

// --- Components ---

// --- Constants & Types ---

const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ['*'],
  ADMIN: ['*'],
  DOCTOR: ['dashboard', 'opd', 'ipd', 'prescriptions', 'laboratory', 'radiology', 'consultants', 'appointments', 'birthdeath', 'discharge', 'reports'],
  NURSE: ['dashboard', 'ipd', 'nursing', 'emergency', 'birthdeath', 'discharge'],
  LAB_TECH: ['dashboard', 'laboratory'],
  RADIO_TECH: ['dashboard', 'radiology'],
  PHARMACY: ['dashboard', 'pharmacy', 'billing'],
  BILLING: ['dashboard', 'billing'],
  RECEPTION: ['dashboard', 'patients', 'appointments', 'billing', 'whatsapp', 'opd'],
  OT_COORDINATOR: ['dashboard', 'ot'],
  HR_ADMIN: ['dashboard', 'statutory', 'safety', 'hr'],
  AMBULANCE_OPERATOR: ['dashboard', 'ambulance'],
};

const hasPermission = (role: string, tab: string) => {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes('*') || permissions.includes(tab);
};

const SidebarItem = ({ icon: Icon, label, active, onClick, hidden }: { icon: any, label: string, active: boolean, onClick: () => void, hidden?: boolean }) => {
  if (hidden) return null;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
        active 
          ? 'bg-primary text-white' 
          : 'text-white/70 hover:bg-white/10 hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );
};

const shareToWhatsApp = (phone: string, message: string) => {
  const url = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};

const Card = ({ children, title, action, className }: { children: React.ReactNode, title?: string, action?: React.ReactNode, className?: string }) => (
  <div className={clsx("bg-white rounded-xl shadow-sm border border-black/5 overflow-hidden", className)}>
    {(title || action) && (
      <div className="px-6 py-4 border-b border-black/5 flex justify-between items-center">
        {title && <h3 className="font-semibold text-text">{title}</h3>}
        {action}
      </div>
    )}
    <div className="p-6">
      {children}
    </div>
  </div>
);

const Badge = ({ children, variant = 'default', className }: { children: React.ReactNode, variant?: 'default' | 'success' | 'alert' | 'error' | 'info', className?: string }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-600',
    success: 'bg-success/10 text-success',
    alert: 'bg-alert/10 text-alert',
    error: 'bg-error/10 text-error',
    info: 'bg-accent/10 text-accent',
  };
  return (
    <span className={clsx("px-2 py-1 rounded-full text-xs font-medium", variants[variant], className)}>
      {children}
    </span>
  );
};

// --- Views ---

const LoginView = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        onLogin(data.user);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center p-4 relative" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop")' }}>
      <div className="absolute inset-0 bg-black/20" />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass rounded-[32px] p-6 lg:p-10 shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-primary/90 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl">
            <HospitalIcon size={40} />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Cure Manage HMS</h1>
          <p className="text-white/80 text-lg font-medium">Hospital Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60">
              <LucideUser size={20} />
            </div>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white/10 border border-white/20 pl-12 pr-4 py-4 rounded-2xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
              placeholder="Username"
              required
            />
          </div>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60">
              <ShieldCheck size={20} />
            </div>
            <input 
              type={showPassword ? "text" : "password"} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/10 border border-white/20 pl-12 pr-12 py-4 rounded-2xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
              placeholder="Password"
              required
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          
          {error && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-300 text-sm font-medium text-center"
            >
              {error}
            </motion.p>
          )}

          <button 
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl transition-all shadow-xl text-lg"
          >
            Login
          </button>

          <div className="flex items-center justify-between px-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/10 text-primary focus:ring-primary/50"
              />
              <span className="text-sm text-white/80 group-hover:text-white transition-colors">Remember Me</span>
            </label>
            <button type="button" className="text-sm text-white/80 hover:text-white transition-colors font-medium">
              Forgot Password?
            </button>
          </div>
        </form>
        
        <div className="mt-10 pt-8 border-t border-white/10 text-center">
          <p className="text-sm font-bold text-white tracking-widest uppercase">DIGITAL COMMUNIQUE PVT LTD</p>
        </div>
      </motion.div>
    </div>
  );
};

const SuperAdminDashboard = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const fetchHospitals = async () => {
    const res = await fetch('/api/hospitals');
    const data = await res.json();
    setHospitals(data);
  };

  useEffect(() => { fetchHospitals(); }, []);

  const handleAddHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/hospitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, address: newAddress, config: { opd: true } })
    });
    setNewName('');
    setNewAddress('');
    setShowAdd(false);
    fetchHospitals();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text">Hospital Management</h2>
          <p className="text-text/60">Manage all registered medical facilities</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-all"
        >
          <Plus size={20} />
          Add Hospital
        </button>
      </div>

      {showAdd && (
        <Card title="Register New Hospital">
          <form onSubmit={handleAddHospital} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              placeholder="Hospital Name" 
              className="px-4 py-2 rounded-lg border border-black/10"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              required
            />
            <input 
              placeholder="Address" 
              className="px-4 py-2 rounded-lg border border-black/10"
              value={newAddress}
              onChange={e => setNewAddress(e.target.value)}
              required
            />
            <div className="md:col-span-2 flex justify-end gap-2">
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-text/60">Cancel</button>
              <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg">Save Hospital</button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hospitals.map(h => (
          <div key={h.id}>
            <Card title={h.name}>
              <div className="space-y-4">
                <div className="flex items-start gap-3 text-sm text-text/60">
                  <Settings size={16} className="mt-1" />
                  <p>{h.address}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="success">OPD Active</Badge>
                  <Badge variant="info">Admin Panel</Badge>
                </div>
                <button className="w-full mt-4 py-2 border border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary/5 transition-all">
                  Configure Access
                </button>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- OPD Token & Receipt ---
const OPDTokenReceipt = ({ visitId, onClose }: { visitId: number; onClose: () => void }) => {
  const [visit, setVisit] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVisit = async () => {
      try {
        const res = await fetch(`/api/opd/visits/${visitId}`);
        const data = await res.json();
        setVisit(data);
      } catch (error) {
        console.error("Error fetching visit for receipt:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVisit();
  }, [visitId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!visit) return;
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(79, 70, 229); // Primary color
      doc.text(visit.hospital_name || 'HOSPITAL NAME', 105, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(visit.hospital_address || '', 105, 28, { align: 'center' });
      
      doc.setDrawColor(200);
      doc.line(20, 35, 190, 35);
      
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('OPD TOKEN & FEE RECEIPT', 105, 45, { align: 'center' });
      
      // Token Number
      doc.setFontSize(40);
      doc.setTextColor(79, 70, 229);
      doc.text(`#${visit.token_number}`, 105, 65, { align: 'center' });
      
      // Patient & Doctor Info
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text('PATIENT DETAILS', 20, 80);
      doc.setTextColor(0);
      doc.setFontSize(12);
      doc.text(visit.patient_name, 20, 87);
      doc.setFontSize(10);
      doc.text(`${visit.patient_id_str} | ${visit.age}Y | ${visit.gender}`, 20, 94);
      doc.text(visit.mobile || '', 20, 101);
      
      doc.setTextColor(100);
      doc.text('VISIT DETAILS', 120, 80);
      doc.setTextColor(0);
      doc.setFontSize(12);
      doc.text(`Dr. ${visit.doctor_name}`, 120, 87);
      doc.setFontSize(10);
      doc.text(visit.department || '', 120, 94);
      doc.text(`${new Date(visit.visit_date).toLocaleDateString()} ${new Date(visit.visit_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, 120, 101);
      
      doc.line(20, 110, 190, 110);
      
      // Billing
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text('BILLING SUMMARY', 20, 120);
      
      doc.setTextColor(0);
      doc.text('Consultation Fee', 20, 130);
      doc.text(`INR ${visit.fee_amount}`, 190, 130, { align: 'right' });
      
      doc.line(120, 135, 190, 135);
      
      doc.setFontSize(14);
      doc.text('TOTAL PAID', 120, 145);
      doc.setTextColor(79, 70, 229);
      doc.text(`INR ${visit.fee_amount}`, 190, 145, { align: 'right' });
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Payment Status: ${visit.payment_status}`, 20, 145);
      
      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text('This is a computer generated receipt.', 105, 170, { align: 'center' });
      doc.text(`Thank you for choosing ${visit.hospital_name}`, 105, 175, { align: 'center' });
      
      doc.save(`OPD_Receipt_${visit.patient_id_str}_${visit.id}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF receipt.");
    }
  };

  if (loading) return null;
  if (!visit) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden print:shadow-none print:rounded-none print:w-full print:max-w-none"
      >
        <div className="p-6 space-y-6 print:p-0">
          <div className="text-center space-y-2 border-b border-black/5 pb-6">
            <h2 className="text-xl font-black text-primary uppercase tracking-tighter">{visit.hospital_name}</h2>
            <p className="text-[10px] text-text/60 font-medium">{visit.hospital_address}</p>
            <div className="inline-block px-4 py-1 bg-primary text-white text-[10px] font-black uppercase rounded-full tracking-widest">
              OPD Token & Fee Receipt
            </div>
          </div>

          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-[10px] text-text/40 font-bold uppercase">Patient Details</p>
              <h3 className="text-lg font-bold text-text">{visit.patient_name}</h3>
              <p className="text-xs text-text/60">{visit.patient_id_str} | {visit.age}Y | {visit.gender}</p>
              <p className="text-xs text-text/60">{visit.mobile}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[10px] text-text/40 font-bold uppercase">Token Number</p>
              <div className="text-4xl font-black text-primary">#{visit.token_number}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 py-4 border-y border-black/5">
            <div>
              <p className="text-[10px] text-text/40 font-bold uppercase">Doctor</p>
              <p className="text-xs font-bold text-text">{visit.doctor_name}</p>
              <p className="text-[10px] text-text/60">{visit.department}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-text/40 font-bold uppercase">Date & Time</p>
              <p className="text-xs font-bold text-text">
                {new Date(visit.visit_date).toLocaleDateString()}
              </p>
              <p className="text-[10px] text-text/60">
                {new Date(visit.visit_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] text-text/40 font-bold uppercase">Billing Summary</p>
            <div className="flex justify-between items-center text-sm">
              <span className="text-text/60">Consultation Fee</span>
              <span className="font-bold text-text">₹{visit.fee_amount}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-black/5">
              <span className="text-xs font-bold text-text uppercase">Total Paid</span>
              <span className="text-xl font-black text-primary">₹{visit.fee_amount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-text/40 font-bold uppercase">Payment Status</span>
              <Badge variant={visit.payment_status === 'Paid' ? 'success' : 'alert'}>
                {visit.payment_status}
              </Badge>
            </div>
          </div>

          <div className="pt-6 text-center space-y-4 print:hidden">
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <button 
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-bg text-text/60 rounded-xl font-bold hover:bg-black/5 transition-all"
                >
                  Close
                </button>
                <button 
                  onClick={handlePrint}
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                >
                  <Printer size={18} /> Print
                </button>
              </div>
              <button 
                onClick={handleDownload}
                className="w-full px-4 py-3 bg-success text-white rounded-xl font-bold shadow-lg shadow-success/20 hover:bg-success/90 transition-all flex items-center justify-center gap-2"
              >
                <Download size={18} /> Download Receipt
              </button>
            </div>
          </div>

          <div className="hidden print:block pt-12 text-center border-t border-dashed border-black/20">
            <p className="text-[10px] text-text/40 font-medium italic">This is a computer generated receipt.</p>
            <p className="text-[10px] text-text/40 font-medium">Thank you for choosing {visit.hospital_name}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const OPDManagement = ({ hospitalId }: { hospitalId: number }) => {
  const [view, setView] = useState<'list' | 'register' | 'case'>('list');
  const [visits, setVisits] = useState<OPDVisit[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [prescribingVisit, setPrescribingVisit] = useState<OPDVisit | null>(null);
  const [referringVisit, setReferringVisit] = useState<OPDVisit | null>(null);
  const [referralSpecialty, setReferralSpecialty] = useState('');
  const [referralReason, setReferralReason] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  
  // Registration Form
  const [regName, setRegName] = useState('');
  const [regAge, setRegAge] = useState('');
  const [regGender, setRegGender] = useState('Male');
  const [regMobile, setRegMobile] = useState('');
  const [regDoctor, setRegDoctor] = useState('');
  const [regSymptoms, setRegSymptoms] = useState('');
  const [regFee, setRegFee] = useState('0');
  const [regPaymentStatus, setRegPaymentStatus] = useState<'Paid' | 'Unpaid' | 'Pending'>('Unpaid');
  const [regTemp, setRegTemp] = useState('');
  const [regBP, setRegBP] = useState('');
  const [regPulse, setRegPulse] = useState('');
  const [regSpO2, setRegSpO2] = useState('');
  const [regWeight, setRegWeight] = useState('');
  const [regHeight, setRegHeight] = useState('');
  const [regRR, setRegRR] = useState('');
  const [printingVisitId, setPrintingVisitId] = useState<number | null>(null);
  const [editingVisit, setEditingVisit] = useState<OPDVisit | null>(null);

  const fetchData = async () => {
    const [vRes, dRes, pRes] = await Promise.all([
      fetch(`/api/opd/visits?hospitalId=${hospitalId}`),
      fetch(`/api/doctors?hospitalId=${hospitalId}`),
      fetch(`/api/patients?hospitalId=${hospitalId}`)
    ]);
    setVisits(await vRes.json());
    setDoctors(await dRes.json());
    setPatients(await pRes.json());
  };

  useEffect(() => { fetchData(); }, [hospitalId]);

  useEffect(() => {
    if (regDoctor) {
      const doctor = doctors.find(d => d.id === parseInt(regDoctor));
      if (doctor && doctor.consultation_fee) {
        setRegFee(doctor.consultation_fee.toString());
      }
    }
  }, [regDoctor, doctors]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingVisit) {
      await fetch(`/api/opd/visits/${editingVisit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: parseInt(regDoctor),
          symptoms: regSymptoms,
          fee_amount: parseFloat(regFee),
          payment_status: regPaymentStatus,
          vitals_temp: regTemp,
          vitals_bp: regBP,
          vitals_pulse: regPulse,
          vitals_spo2: regSpO2,
          vitals_weight: regWeight,
          vitals_height: regHeight,
          vitals_rr: regRR
        })
      });
      setEditingVisit(null);
    } else {
      // 1. Create/Find Patient
      const pRes = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospital_id: hospitalId,
          name: regName,
          age: parseInt(regAge),
          gender: regGender,
          mobile: regMobile
        })
      });
      const patient = await pRes.json();

      // 2. Create Visit
      const vRes = await fetch('/api/opd/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospital_id: hospitalId,
          patient_id: patient.id,
          doctor_id: parseInt(regDoctor),
          symptoms: regSymptoms,
          fee_amount: parseFloat(regFee),
          payment_status: regPaymentStatus,
          vitals_temp: regTemp,
          vitals_bp: regBP,
          vitals_pulse: regPulse,
          vitals_spo2: regSpO2,
          vitals_weight: regWeight,
          vitals_height: regHeight,
          vitals_rr: regRR
        })
      });
      const visitData = await vRes.json();
      
      if (confirm('Registration successful! Do you want to print the token/receipt?')) {
        setPrintingVisitId(visitData.id);
      }
    }

    // Reset and refresh
    setRegName(''); setRegAge(''); setRegMobile(''); setRegDoctor(''); setRegSymptoms(''); setRegFee('0'); setRegPaymentStatus('Unpaid');
    setRegTemp(''); setRegBP(''); setRegPulse(''); setRegSpO2(''); setRegWeight(''); setRegHeight(''); setRegRR('');
    
    setView('list');
    fetchData();
  };

  const handleDeleteVisit = async (id: number) => {
    if (!confirm("Are you sure you want to delete this visit?")) return;
    await fetch(`/api/opd/visits/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const handleReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referringVisit) return;
    await fetch('/api/consultants/referrals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hospital_id: hospitalId,
        patient_id: referringVisit.patient_id,
        from_doctor_id: referringVisit.doctor_id,
        to_specialty: referralSpecialty,
        reason: referralReason
      })
    });
    setReferringVisit(null);
    setReferralSpecialty('');
    setReferralReason('');
    alert('Referral sent to Consultant Panel');
  };

  if (selectedPatientId) {
    return <PatientOverview patientId={selectedPatientId} hospitalId={hospitalId} onBack={() => setSelectedPatientId(null)} />;
  }

  if (prescribingVisit) {
    return (
      <div className="space-y-4">
        <button onClick={() => setPrescribingVisit(null)} className="flex items-center gap-2 text-primary font-bold mb-4">
          <ArrowLeft size={16} /> Back to Queue
        </button>
        <PrescriptionModule 
          hospitalId={hospitalId} 
          patientId={prescribingVisit.patient_id} 
          visitId={prescribingVisit.id}
          onComplete={() => {
            setPrescribingVisit(null);
            fetchData();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text">OPD Management</h2>
          <p className="text-text/60">Outpatient Department Queue & Registration</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setView('list')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${view === 'list' ? 'bg-primary text-white' : 'bg-white text-text/60 border border-black/5'}`}
          >
            Queue List
          </button>
          <button 
            onClick={() => setView('register')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${view === 'register' ? 'bg-primary text-white' : 'bg-white text-text/60 border border-black/5'}`}
          >
            <UserPlus size={20} />
            New Registration
          </button>
        </div>
      </div>

      {view === 'register' && (
        <Card title="Patient Registration & Token Generation">
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Full Name</label>
                <input 
                  className="w-full px-4 py-2 rounded-lg border border-black/10 focus:ring-2 focus:ring-primary/20"
                  value={regName} onChange={e => setRegName(e.target.value)} required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Age</label>
                <input 
                  type="number"
                  className="w-full px-4 py-2 rounded-lg border border-black/10 focus:ring-2 focus:ring-primary/20"
                  value={regAge} onChange={e => setRegAge(e.target.value)} required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Gender</label>
                <select 
                  className="w-full px-4 py-2 rounded-lg border border-black/10 focus:ring-2 focus:ring-primary/20"
                  value={regGender} onChange={e => setRegGender(e.target.value)}
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Mobile Number</label>
                <input 
                  className="w-full px-4 py-2 rounded-lg border border-black/10 focus:ring-2 focus:ring-primary/20"
                  value={regMobile} onChange={e => setRegMobile(e.target.value)} required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Assign Doctor</label>
                <select 
                  className="w-full px-4 py-2 rounded-lg border border-black/10 focus:ring-2 focus:ring-primary/20"
                  value={regDoctor} onChange={e => setRegDoctor(e.target.value)} required
                >
                  <option value="">Select Doctor</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.department})</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Consultation Fee (₹)</label>
                <input 
                  type="number"
                  className="w-full px-4 py-2 rounded-lg border border-black/10 focus:ring-2 focus:ring-primary/20"
                  value={regFee} onChange={e => setRegFee(e.target.value)} required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Payment Status</label>
                <select 
                  className="w-full px-4 py-2 rounded-lg border border-black/10 focus:ring-2 focus:ring-primary/20"
                  value={regPaymentStatus} onChange={e => setRegPaymentStatus(e.target.value as any)}
                >
                  <option value="Unpaid">Unpaid</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Symptoms / Reason for Visit</label>
              <textarea 
                className="w-full px-4 py-2 rounded-lg border border-black/10 focus:ring-2 focus:ring-primary/20 h-24"
                value={regSymptoms} onChange={e => setRegSymptoms(e.target.value)}
              />
            </div>

            <div className="p-4 bg-bg/50 rounded-xl space-y-4">
              <h4 className="text-xs font-bold text-text/40 uppercase tracking-widest flex items-center gap-2">
                <Activity size={14} className="text-primary" /> Patient Vitals (Nurse/Doctor)
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text/40 uppercase">Temp (°F)</label>
                  <input className="w-full px-3 py-1.5 rounded-lg border border-black/10 text-sm" value={regTemp} onChange={e => setRegTemp(e.target.value)} placeholder="98.6" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text/40 uppercase">BP (mmHg)</label>
                  <input className="w-full px-3 py-1.5 rounded-lg border border-black/10 text-sm" value={regBP} onChange={e => setRegBP(e.target.value)} placeholder="120/80" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text/40 uppercase">Pulse (bpm)</label>
                  <input className="w-full px-3 py-1.5 rounded-lg border border-black/10 text-sm" value={regPulse} onChange={e => setRegPulse(e.target.value)} placeholder="72" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text/40 uppercase">SpO2 (%)</label>
                  <input className="w-full px-3 py-1.5 rounded-lg border border-black/10 text-sm" value={regSpO2} onChange={e => setRegSpO2(e.target.value)} placeholder="98" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text/40 uppercase">Weight (kg)</label>
                  <input className="w-full px-3 py-1.5 rounded-lg border border-black/10 text-sm" value={regWeight} onChange={e => setRegWeight(e.target.value)} placeholder="70" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text/40 uppercase">Height (cm)</label>
                  <input className="w-full px-3 py-1.5 rounded-lg border border-black/10 text-sm" value={regHeight} onChange={e => setRegHeight(e.target.value)} placeholder="170" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text/40 uppercase">RR (bpm)</label>
                  <input className="w-full px-3 py-1.5 rounded-lg border border-black/10 text-sm" value={regRR} onChange={e => setRegRR(e.target.value)} placeholder="18" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => { setView('list'); setEditingVisit(null); }} className="px-6 py-2 text-text/60">Cancel</button>
              <button type="submit" className="bg-primary text-white px-8 py-2 rounded-lg font-semibold shadow-lg shadow-primary/20">
                {editingVisit ? 'Update Visit' : 'Generate Token'}
              </button>
            </div>
          </form>
        </Card>
      )}

      {referringVisit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-black/5 flex justify-between items-center bg-primary text-white">
              <h3 className="font-bold">Refer Patient: {referringVisit.patient_name}</h3>
              <button onClick={() => setReferringVisit(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleReferral} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-text/40 uppercase">Refer to Specialty</label>
                <select 
                  required
                  className="w-full px-4 py-2 rounded-lg border border-black/10"
                  value={referralSpecialty}
                  onChange={e => setReferralSpecialty(e.target.value)}
                >
                  <option value="">Select Specialty</option>
                  <option>Cardiology</option>
                  <option>Neurology</option>
                  <option>Orthopedics</option>
                  <option>Oncology</option>
                  <option>Pediatrics</option>
                  <option>Dermatology</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-text/40 uppercase">Reason for Referral</label>
                <textarea 
                  required
                  className="w-full px-4 py-2 rounded-lg border border-black/10 h-24"
                  value={referralReason}
                  onChange={e => setReferralReason(e.target.value)}
                  placeholder="Clinical findings and reason for specialist consultation..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setReferringVisit(null)} className="px-4 py-2 text-text/60 font-bold">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-primary text-white rounded-lg font-bold shadow-lg shadow-primary/20">Send Referral</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}      {view === 'list' && (
        <Card title="Today's OPD Queue">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-black/5">
                  <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Token</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Patient</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Doctor</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Fee</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {visits.map(v => (
                  <tr key={v.id} className="hover:bg-bg/50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="w-10 h-10 bg-secondary/20 text-primary rounded-lg flex items-center justify-center font-bold">
                        #{v.token_number}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-text">{v.patient_name}</div>
                      <div className="text-xs text-text/40">{v.patient_id_str}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-text/80">{v.doctor_name}</td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-bold text-text">₹{v.fee_amount}</div>
                      <div className={`text-[10px] font-black uppercase ${v.payment_status === 'Paid' ? 'text-success' : 'text-alert'}`}>
                        {v.payment_status}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={v.status === 'Completed' ? 'success' : v.status === 'In-Progress' ? 'info' : 'alert'}>
                        {v.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-3">
                        <button 
                          onClick={() => setPrintingVisitId(v.id)}
                          className="text-primary hover:underline text-sm font-medium flex items-center gap-1"
                        >
                          <Printer size={14} /> Token
                        </button>
                        <button 
                          onClick={() => setSelectedPatientId(v.patient_id)}
                          className="text-primary hover:underline text-sm font-medium"
                        >
                          View Case Sheet
                        </button>
                        <button 
                          onClick={() => setPrescribingVisit(v)}
                          className="text-accent hover:underline text-sm font-medium"
                        >
                          Prescribe
                        </button>
                        <button 
                          onClick={() => setReferringVisit(v)}
                          className="text-primary hover:underline text-sm font-medium"
                        >
                          Refer
                        </button>
                        <button 
                          onClick={() => {
                            setEditingVisit(v);
                            setRegName(v.patient_name);
                            setRegAge(v.age.toString());
                            setRegGender(v.gender);
                            setRegMobile(v.mobile || '');
                            setRegDoctor(v.doctor_id.toString());
                            setRegSymptoms(v.symptoms || '');
                            setRegFee(v.fee_amount.toString());
                            setRegPaymentStatus(v.payment_status);
                            setRegTemp(v.vitals_temp || '');
                            setRegBP(v.vitals_bp || '');
                            setRegPulse(v.vitals_pulse || '');
                            setRegSpO2(v.vitals_spo2 || '');
                            setRegWeight(v.vitals_weight || '');
                            setRegHeight(v.vitals_height || '');
                            setRegRR(v.vitals_rr || '');
                            setView('register');
                          }}
                          className="text-primary hover:underline text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteVisit(v.id)}
                          className="text-error hover:underline text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {visits.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-text/40 italic">No patients in queue</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {printingVisitId && (
        <OPDTokenReceipt 
          visitId={printingVisitId} 
          onClose={() => setPrintingVisitId(null)} 
        />
      )}
    </div>
  );
};

const DoctorsManagement = ({ hospitalId }: { hospitalId: number }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [schedule, setSchedule] = useState('');
  const [fee, setFee] = useState('0');

  const fetchDoctors = async () => {
    const res = await fetch(`/api/doctors?hospitalId=${hospitalId}`);
    setDoctors(await res.json());
  };

  useEffect(() => { fetchDoctors(); }, [hospitalId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingDoctor ? `/api/doctors/${editingDoctor.id}` : '/api/doctors';
    const method = editingDoctor ? 'PATCH' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hospital_id: hospitalId, name, department, schedule, consultation_fee: parseFloat(fee) })
    });
    setName(''); setDepartment(''); setSchedule(''); setFee('0');
    setShowAdd(false);
    setEditingDoctor(null);
    fetchDoctors();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this doctor?")) return;
    await fetch(`/api/doctors/${id}`, { method: 'DELETE' });
    fetchDoctors();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text">Doctors Directory</h2>
          <p className="text-text/60">Manage medical staff and schedules</p>
        </div>
        <button 
          onClick={() => {
            if (showAdd) {
              setEditingDoctor(null);
              setName(''); setDepartment(''); setSchedule(''); setFee('0');
            }
            setShowAdd(!showAdd);
          }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-all"
        >
          <Plus size={20} />
          {showAdd ? 'Cancel' : 'Add Doctor'}
        </button>
      </div>

      {showAdd && (
        <Card title={editingDoctor ? "Edit Doctor" : "Register New Doctor"}>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Full Name</label>
              <input 
                className="w-full px-4 py-2 rounded-lg border border-black/10 focus:ring-2 focus:ring-primary/20"
                value={name} onChange={e => setName(e.target.value)} required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Department</label>
              <input 
                className="w-full px-4 py-2 rounded-lg border border-black/10 focus:ring-2 focus:ring-primary/20"
                value={department} onChange={e => setDepartment(e.target.value)} required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Schedule (e.g. Mon-Fri, 9am-5pm)</label>
              <input 
                className="w-full px-4 py-2 rounded-lg border border-black/10 focus:ring-2 focus:ring-primary/20"
                value={schedule} onChange={e => setSchedule(e.target.value)} required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Consultation Fee (₹)</label>
              <input 
                type="number"
                className="w-full px-4 py-2 rounded-lg border border-black/10 focus:ring-2 focus:ring-primary/20"
                value={fee} onChange={e => setFee(e.target.value)} required
              />
            </div>
            <div className="md:col-span-4 flex justify-end">
              <button type="submit" className="bg-primary text-white px-8 py-2 rounded-lg font-semibold shadow-lg shadow-primary/20">
                {editingDoctor ? 'Update Doctor' : 'Save Doctor'}
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.map(d => (
          <div key={d.id}>
            <Card title={d.name}>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-text/80">
                  <Stethoscope size={16} className="text-primary" />
                  <span className="font-medium">{d.department}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-text/60">
                  <Clock size={16} />
                  <span>{d.schedule || 'Schedule not set'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-primary">
                  <CreditCard size={16} />
                  <span>Fee: ₹{d.consultation_fee || 0}</span>
                </div>
                <div className="pt-3 flex gap-2">
                  <Badge variant="info">Active</Badge>
                  <Badge>On Duty</Badge>
                </div>
                <div className="pt-3 border-t border-black/5 flex justify-end gap-2">
                  <button 
                    onClick={() => {
                      setEditingDoctor(d);
                      setName(d.name);
                      setDepartment(d.department);
                      setSchedule(d.schedule);
                      setFee(d.consultation_fee.toString());
                      setShowAdd(true);
                    }}
                    className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all"
                    title="Edit Doctor"
                  >
                    <ClipboardListIcon size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(d.id)}
                    className="p-2 text-error hover:bg-error/10 rounded-lg transition-all"
                    title="Delete Doctor"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

const IPDManagement = ({ hospitalId }: { hospitalId: number }) => {
  const [admissions, setAdmissions] = useState<IPDAdmission[]>([]);
  const [selectedAdmissionId, setSelectedAdmissionId] = useState<number | null>(null);
  const [showAdmitForm, setShowAdmitForm] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [beds, setBeds] = useState<BedType[]>([]);

  // Form states
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [bedId, setBedId] = useState('');
  const [admissionNote, setAdmissionNote] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');

  const fetchData = async () => {
    const [admRes, patRes, docRes, bedRes] = await Promise.all([
      fetch(`/api/ipd/admissions?hospitalId=${hospitalId}`),
      fetch(`/api/patients?hospitalId=${hospitalId}`),
      fetch(`/api/doctors?hospitalId=${hospitalId}`),
      fetch(`/api/beds?hospitalId=${hospitalId}`)
    ]);
    setAdmissions(await admRes.json());
    setPatients(await patRes.json());
    setDoctors(await docRes.json());
    setBeds(await bedRes.json());
  };

  useEffect(() => { fetchData(); }, [hospitalId]);

  const handleAdmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/ipd/admissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        hospital_id: hospitalId, 
        patient_id: parseInt(patientId), 
        doctor_id: parseInt(doctorId), 
        bed_id: parseInt(bedId), 
        admission_note: admissionNote, 
        treatment_plan: treatmentPlan 
      })
    });
    setShowAdmitForm(false);
    fetchData();
  };

  const handleDeleteAdmission = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this admission?')) {
      try {
        const res = await fetch(`/api/ipd/admissions/${id}`, { method: 'DELETE' });
        if (res.ok) fetchData();
      } catch (error) {
        console.error("Error deleting admission:", error);
      }
    }
  };

  if (selectedAdmissionId) {
    return <IPDAdmissionDetails admissionId={selectedAdmissionId} onBack={() => { setSelectedAdmissionId(null); fetchData(); }} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text">In-Patient Management (IPD)</h2>
          <p className="text-text/60">Manage admissions, bed allocation, and patient care</p>
        </div>
        <button 
          onClick={() => setShowAdmitForm(!showAdmitForm)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-all"
        >
          <Bed size={20} />
          {showAdmitForm ? 'Cancel' : 'Admit Patient'}
        </button>
      </div>

      {showAdmitForm && (
        <Card title="New Patient Admission">
          <form onSubmit={handleAdmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Select Patient</label>
              <select 
                className="w-full px-4 py-2 rounded-lg border border-black/10 focus:ring-2 focus:ring-primary/20"
                value={patientId} onChange={e => setPatientId(e.target.value)} required
              >
                <option value="">Choose Patient...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.patient_id_str})</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Primary Consultant</label>
              <select 
                className="w-full px-4 py-2 rounded-lg border border-black/10 focus:ring-2 focus:ring-primary/20"
                value={doctorId} onChange={e => setDoctorId(e.target.value)} required
              >
                <option value="">Choose Doctor...</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.department})</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Bed Allocation</label>
              <select 
                className="w-full px-4 py-2 rounded-lg border border-black/10 focus:ring-2 focus:ring-primary/20"
                value={bedId} onChange={e => setBedId(e.target.value)} required
              >
                <option value="">Choose Bed...</option>
                {beds.filter(b => b.status === 'Available').map(b => (
                  <option key={b.id} value={b.id}>{b.ward_name} - Bed {b.bed_number} ({b.type})</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-3 space-y-1">
              <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Admission Note</label>
              <textarea 
                className="w-full px-4 py-2 rounded-lg border border-black/10 focus:ring-2 focus:ring-primary/20"
                rows={2} value={admissionNote} onChange={e => setAdmissionNote(e.target.value)}
              />
            </div>
            <div className="md:col-span-3 space-y-1">
              <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Initial Treatment Plan</label>
              <textarea 
                className="w-full px-4 py-2 rounded-lg border border-black/10 focus:ring-2 focus:ring-primary/20"
                rows={2} value={treatmentPlan} onChange={e => setTreatmentPlan(e.target.value)}
              />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <button type="submit" className="bg-primary text-white px-8 py-2 rounded-lg font-semibold shadow-lg shadow-primary/20">
                Confirm Admission
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {admissions.map(a => (
          <div key={a.id} onClick={() => setSelectedAdmissionId(a.id)} className="cursor-pointer group">
            <Card title={a.patient_name}>
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-xs font-mono text-primary">{a.patient_id_str}</p>
                    <p className="text-sm font-medium text-text/80">{a.ward_name} - Bed {a.bed_number}</p>
                  </div>
                  <Badge variant={a.status === 'Admitted' ? 'success' : 'info'}>{a.status}</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-text/60">
                  <Stethoscope size={16} />
                  <span>{a.doctor_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-text/60">
                  <Clock size={16} />
                  <span>Admitted: {new Date(a.admission_date).toLocaleDateString()}</span>
                </div>
                <div className="pt-2 border-t border-black/5 flex items-center justify-between text-primary font-medium text-sm group-hover:translate-x-1 transition-transform">
                  <div className="flex items-center gap-2">
                    <span>View Details</span>
                    <ChevronRight size={16} />
                  </div>
                  <button 
                    onClick={(e) => handleDeleteAdmission(a.id, e)}
                    className="p-1.5 text-text/40 hover:text-error hover:bg-error/10 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Card>
          </div>
        ))}
        {admissions.length === 0 && (
          <div className="md:col-span-3 py-12 text-center text-text/40 italic">
            No active IPD admissions found.
          </div>
        )}
      </div>
    </div>
  );
};

const IPDAdmissionDetails = ({ admissionId, onBack }: { admissionId: number, onBack: () => void }) => {
  const [admission, setAdmission] = useState<IPDAdmission | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'vitals' | 'nursing' | 'rounds' | 'meds' | 'prescription' | 'discharge'>('overview');
  
  // Form states
  const [temp, setTemp] = useState('');
  const [bp, setBp] = useState('');
  const [pulse, setPulse] = useState('');
  const [spO2, setSpO2] = useState('');
  const [resp, setResp] = useState('');
  const [note, setNote] = useState('');
  const [roundNote, setRoundNote] = useState('');
  const [medName, setMedName] = useState('');
  const [dosage, setDosage] = useState('');
  const [freq, setFreq] = useState('');
  const [dischargeSummary, setDischargeSummary] = useState('');

  const fetchDetails = async () => {
    const res = await fetch(`/api/ipd/admissions/${admissionId}`);
    setAdmission(await res.json());
  };

  useEffect(() => { fetchDetails(); }, [admissionId]);

  const handleAddVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/ipd/vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admission_id: admissionId, temp, bp, pulse, spO2, respiration: resp })
    });
    setTemp(''); setBp(''); setPulse(''); setSpO2(''); setResp('');
    fetchDetails();
  };

  const handleAddNursingNote = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/ipd/nursing-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admission_id: admissionId, note })
    });
    setNote('');
    fetchDetails();
  };

  const handleAddRound = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/ipd/consultant-rounds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admission_id: admissionId, doctor_id: admission?.doctor_id, notes: roundNote })
    });
    setRoundNote('');
    fetchDetails();
  };

  const handleAddMed = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/ipd/medications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admission_id: admissionId, medicine_name: medName, dosage, frequency: freq })
    });
    setMedName(''); setDosage(''); setFreq('');
    fetchDetails();
  };

  const handleDischarge = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/ipd/admissions/${admissionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Discharged', discharge_summary: dischargeSummary })
    });
    onBack();
  };

  const handleDownloadAdmission = () => {
    if (!admission) return;
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(79, 70, 229);
      doc.text('ADMISSION RECORD', 105, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Admission ID: #${admission.id}`, 105, 28, { align: 'center' });
      
      doc.setDrawColor(200);
      doc.line(20, 35, 190, 35);
      
      // Patient Info
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.setFont("helvetica", "bold");
      doc.text('PATIENT INFORMATION', 20, 45);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Name: ${admission.patient_name}`, 20, 52);
      doc.text(`ID: ${admission.patient_id_str}`, 20, 57);
      doc.text(`Age/Gender: ${admission.age}Y / ${admission.gender}`, 20, 62);
      
      // Admission Info
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text('ADMISSION DETAILS', 120, 45);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Date: ${new Date(admission.admission_date).toLocaleString()}`, 120, 52);
      doc.text(`Ward/Bed: ${admission.ward_name} / ${admission.bed_number}`, 120, 57);
      doc.text(`Consultant: ${admission.doctor_name}`, 120, 62);
      
      doc.line(20, 70, 190, 70);
      
      // Notes
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text('ADMISSION NOTE', 20, 80);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const noteLines = doc.splitTextToSize(admission.admission_note || 'N/A', 170);
      doc.text(noteLines, 20, 87);
      
      const noteHeight = noteLines.length * 5;
      const planY = 87 + noteHeight + 10;
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text('TREATMENT PLAN', 20, planY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const planLines = doc.splitTextToSize(admission.treatment_plan || 'N/A', 170);
      doc.text(planLines, 20, planY + 7);
      
      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text('Generated by Hospital Management System', 105, 280, { align: 'center' });
      
      doc.save(`Admission_${admission.patient_id_str}_${admission.id}.pdf`);
    } catch (error) {
      console.error("Error generating Admission PDF:", error);
      alert("Failed to generate admission record PDF.");
    }
  };

  if (!admission) return <div className="p-12 text-center">Loading details...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="flex items-center gap-2 text-primary font-medium hover:underline">
          <ArrowLeft size={18} />
          Back to Admissions
        </button>
        <button 
          onClick={handleDownloadAdmission}
          className="flex items-center gap-2 bg-success text-white px-4 py-2 rounded-lg font-medium hover:bg-success/90 transition-all shadow-sm"
        >
          <Download size={18} />
          Download Admission Record
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Patient Info Sidebar */}
        <div className="lg:w-80 space-y-6">
          <Card>
            <div className="text-center space-y-3">
              <div className="w-20 h-20 bg-bg rounded-full mx-auto flex items-center justify-center text-primary">
                <Users size={40} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-text">{admission.patient_name}</h3>
                <p className="text-sm font-mono text-primary">{admission.patient_id_str}</p>
              </div>
              <div className="flex justify-center gap-4 text-sm text-text/60">
                <span>{admission.age} Yrs</span>
                <span>{admission.gender}</span>
              </div>
              <Badge variant={admission.status === 'Admitted' ? 'success' : 'info'}>{admission.status}</Badge>
            </div>
            <div className="mt-6 pt-6 border-t border-black/5 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-text/40">Ward:</span>
                <span className="font-medium text-text">{admission.ward_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text/40">Bed:</span>
                <span className="font-medium text-text">{admission.bed_number} ({admission.bed_type})</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text/40">Consultant:</span>
                <span className="font-medium text-text">{admission.doctor_name}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 space-y-6">
          <div className="flex bg-white rounded-xl shadow-sm border border-black/5 p-1 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: FileText },
              { id: 'vitals', label: 'Vitals Chart', icon: Thermometer },
              { id: 'nursing', label: 'Nursing Notes', icon: ClipboardList },
              { id: 'rounds', label: 'Consultant Rounds', icon: Stethoscope },
              { id: 'meds', label: 'Medication Chart', icon: Pill },
              { id: 'prescription', label: 'Prescription', icon: FileTextIcon },
              { id: 'discharge', label: 'Discharge', icon: LogOut },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-primary text-white' : 'text-text/60 hover:bg-bg'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <Card title="Admission Note">
                    <p className="text-text/80 whitespace-pre-wrap">{admission.admission_note || 'No admission note recorded.'}</p>
                  </Card>
                  <Card title="Treatment Plan">
                    <p className="text-text/80 whitespace-pre-wrap">{admission.treatment_plan || 'No treatment plan recorded.'}</p>
                  </Card>
                  {admission.surgery_notes && (
                    <Card title="Surgery Notes">
                      <p className="text-text/80 whitespace-pre-wrap">{admission.surgery_notes}</p>
                    </Card>
                  )}
                </div>
              )}

              {activeTab === 'prescription' && (
                <PrescriptionModule 
                  hospitalId={admission.hospital_id} 
                  patientId={admission.patient_id} 
                  admissionId={admission.id}
                  onComplete={() => setActiveTab('overview')}
                />
              )}

              {activeTab === 'vitals' && (
                <div className="space-y-6">
                  <Card title="Record New Vitals">
                    <form onSubmit={handleAddVitals} className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-text/40 uppercase">Temp (°F)</label>
                        <input className="w-full px-3 py-1.5 rounded border border-black/10 text-sm" value={temp} onChange={e => setTemp(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-text/40 uppercase">BP (mmHg)</label>
                        <input className="w-full px-3 py-1.5 rounded border border-black/10 text-sm" value={bp} onChange={e => setBp(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-text/40 uppercase">Pulse (bpm)</label>
                        <input className="w-full px-3 py-1.5 rounded border border-black/10 text-sm" value={pulse} onChange={e => setPulse(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-text/40 uppercase">SpO2 (%)</label>
                        <input className="w-full px-3 py-1.5 rounded border border-black/10 text-sm" value={spO2} onChange={e => setSpO2(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-text/40 uppercase">Resp (bpm)</label>
                        <input className="w-full px-3 py-1.5 rounded border border-black/10 text-sm" value={resp} onChange={e => setResp(e.target.value)} />
                      </div>
                      <div className="col-span-2 md:col-span-5 flex justify-end">
                        <button type="submit" className="bg-primary text-white px-4 py-1.5 rounded-lg text-sm font-bold">Save Vitals</button>
                      </div>
                    </form>
                  </Card>
                  <Card title="Vitals History">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-black/5">
                            <th className="py-2">Time</th>
                            <th className="py-2">Temp</th>
                            <th className="py-2">BP</th>
                            <th className="py-2">Pulse</th>
                            <th className="py-2">SpO2</th>
                            <th className="py-2">Resp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                          {admission.vitals?.map(v => (
                            <tr key={v.id}>
                              <td className="py-2 text-text/40">{new Date(v.recorded_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                              <td className="py-2 font-medium">{v.temp}</td>
                              <td className="py-2 font-medium">{v.bp}</td>
                              <td className="py-2 font-medium">{v.pulse}</td>
                              <td className="py-2 font-medium">{v.spO2}</td>
                              <td className="py-2 font-medium">{v.respiration}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              )}

              {activeTab === 'nursing' && (
                <div className="space-y-6">
                  <Card title="Add Nursing Note">
                    <form onSubmit={handleAddNursingNote} className="space-y-4">
                      <textarea 
                        className="w-full px-4 py-2 rounded-lg border border-black/10 text-sm" 
                        rows={3} value={note} onChange={e => setNote(e.target.value)} required
                        placeholder="Enter nursing observations, care provided, etc."
                      />
                      <div className="flex justify-end">
                        <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold">Add Note</button>
                      </div>
                    </form>
                  </Card>
                  <div className="space-y-4">
                    {admission.nursingNotes?.map(n => (
                      <div key={n.id} className="bg-white p-4 rounded-xl shadow-sm border border-black/5">
                        <div className="flex justify-between text-[10px] font-bold text-text/40 uppercase mb-2">
                          <span>Nursing Staff</span>
                          <span>{new Date(n.recorded_at).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-text/80">{n.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'rounds' && (
                <div className="space-y-6">
                  <Card title="Record Consultant Round">
                    <form onSubmit={handleAddRound} className="space-y-4">
                      <textarea 
                        className="w-full px-4 py-2 rounded-lg border border-black/10 text-sm" 
                        rows={3} value={roundNote} onChange={e => setRoundNote(e.target.value)} required
                        placeholder="Enter consultant findings, plan changes, etc."
                      />
                      <div className="flex justify-end">
                        <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold">Save Round Note</button>
                      </div>
                    </form>
                  </Card>
                  <div className="space-y-4">
                    {admission.rounds?.map(r => (
                      <div key={r.id} className="bg-white p-4 rounded-xl shadow-sm border border-black/5">
                        <div className="flex justify-between text-[10px] font-bold text-text/40 uppercase mb-2">
                          <span>{r.doctor_name}</span>
                          <span>{new Date(r.round_date).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-text/80">{r.notes}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'meds' && (
                <div className="space-y-6">
                  <Card title="Add Medication">
                    <form onSubmit={handleAddMed} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-text/40 uppercase">Medicine Name</label>
                        <input className="w-full px-3 py-1.5 rounded border border-black/10 text-sm" value={medName} onChange={e => setMedName(e.target.value)} required />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-text/40 uppercase">Dosage</label>
                        <input className="w-full px-3 py-1.5 rounded border border-black/10 text-sm" value={dosage} onChange={e => setDosage(e.target.value)} required />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-text/40 uppercase">Frequency</label>
                        <input className="w-full px-3 py-1.5 rounded border border-black/10 text-sm" value={freq} onChange={e => setFreq(e.target.value)} required />
                      </div>
                      <div className="md:col-span-3 flex justify-end">
                        <button type="submit" className="bg-primary text-white px-4 py-1.5 rounded-lg text-sm font-bold">Add to Chart</button>
                      </div>
                    </form>
                  </Card>
                  <Card title="Medication Chart">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-black/5">
                            <th className="py-2">Medicine</th>
                            <th className="py-2">Dosage</th>
                            <th className="py-2">Frequency</th>
                            <th className="py-2">Started</th>
                            <th className="py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                          {admission.medications?.map(m => (
                            <tr key={m.id}>
                              <td className="py-2 font-medium">{m.medicine_name}</td>
                              <td className="py-2">{m.dosage}</td>
                              <td className="py-2">{m.frequency}</td>
                              <td className="py-2 text-text/40">{new Date(m.start_date).toLocaleDateString()}</td>
                              <td className="py-2"><Badge variant="success">{m.status}</Badge></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              )}

              {activeTab === 'discharge' && (
                <div className="space-y-6">
                  {admission.status === 'Admitted' ? (
                    <Card title="Process Discharge">
                      <form onSubmit={handleDischarge} className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Discharge Summary</label>
                          <textarea 
                            className="w-full px-4 py-2 rounded-lg border border-black/10 text-sm" 
                            rows={6} value={dischargeSummary} onChange={e => setDischargeSummary(e.target.value)} required
                            placeholder="Summarize the patient's stay, treatment outcome, and follow-up instructions."
                          />
                        </div>
                        <div className="flex justify-end">
                          <button type="submit" className="bg-error text-white px-8 py-2 rounded-lg font-bold shadow-lg shadow-error/20">
                            Confirm Discharge
                          </button>
                        </div>
                      </form>
                    </Card>
                  ) : (
                    <Card title="Discharge Summary">
                      <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-text/40">Discharge Date:</span>
                          <span className="font-medium">{new Date(admission.discharge_date!).toLocaleString()}</span>
                        </div>
                        <div className="pt-4 border-t border-black/5">
                          <p className="text-text/80 whitespace-pre-wrap">{admission.discharge_summary}</p>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const NursingStationDashboard = ({ hospitalId }: { hospitalId: number }) => {
  const [admissions, setAdmissions] = useState<IPDAdmission[]>([]);
  const [vitals, setVitals] = useState<IPDVital[]>([]);
  const [medications, setMedications] = useState<IPDMedication[]>([]);
  const [tasks, setTasks] = useState<NursingTask[]>([]);
  const [shifts, setShifts] = useState<NursingShift[]>([]);
  const [selectedAdmission, setSelectedAdmission] = useState<IPDAdmission | null>(null);
  const [icuTrends, setIcuTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/nursing/dashboard?hospitalId=${hospitalId}`);
      const data = await res.json();
      setAdmissions(data.admissions || []);
      setVitals(data.vitals || []);
      setMedications(data.medications || []);
      setTasks(data.tasks || []);
      setShifts(data.shifts || []);
    } catch (error) {
      console.error("Error fetching nursing dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIcuTrends = async (admissionId: number) => {
    try {
      const res = await fetch(`/api/nursing/icu/vitals-trend/${admissionId}`);
      const data = await res.json();
      setIcuTrends(data);
    } catch (error) {
      console.error("Error fetching ICU trends:", error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [hospitalId]);

  useEffect(() => {
    if (selectedAdmission && selectedAdmission.bed_type === 'ICU') {
      fetchIcuTrends(selectedAdmission.id);
    }
  }, [selectedAdmission]);

  const getLatestVital = (admissionId: number) => {
    return vitals.find(v => (v as any).admission_id === admissionId);
  };

  const updateRiskCode = async (admissionId: number, riskCode: string) => {
    const res = await fetch(`/api/nursing/admissions/${admissionId}/risk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ risk_code: riskCode })
    });
    if (res.ok) {
      fetchData();
    }
  };

  const completeTask = async (taskId: number) => {
    const res = await fetch(`/api/nursing/tasks/${taskId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ performed_by: 'Nurse On Duty', notes: 'Completed as per schedule' })
    });
    if (res.ok) {
      fetchData();
    }
  };

  if (loading && admissions.length === 0) {
    return <div className="flex items-center justify-center h-64 text-text/40">Loading Nursing Dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text">Smart Nursing Station</h2>
          <p className="text-text/60">Real-time Ward Monitoring & Workflow</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-black/5 shadow-sm">
            <div className="w-3 h-3 rounded-full bg-success"></div>
            <span className="text-xs font-bold text-text/60">Stable</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-black/5 shadow-sm">
            <div className="w-3 h-3 rounded-full bg-alert"></div>
            <span className="text-xs font-bold text-text/60">Moderate Risk</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-black/5 shadow-sm">
            <div className="w-3 h-3 rounded-full bg-error"></div>
            <span className="text-xs font-bold text-text/60">High Risk</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Patient Overview Panel */}
        <div className="xl:col-span-3 space-y-6">
          <Card title="Ward Patient Overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {admissions.map(adm => {
                const latestVital = getLatestVital(adm.id);
                const riskColor = (adm as any).risk_code === 'RED' ? 'border-error bg-error/5' : 
                                 (adm as any).risk_code === 'YELLOW' ? 'border-alert bg-alert/5' : 
                                 'border-success bg-success/5';
                
                return (
                  <div 
                    key={adm.id} 
                    onClick={() => setSelectedAdmission(adm)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${riskColor} ${selectedAdmission?.id === adm.id ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="bg-white px-2 py-1 rounded-md text-[10px] font-bold shadow-sm">BED {adm.bed_number}</div>
                      <div className="flex gap-1">
                        <button onClick={(e) => { e.stopPropagation(); updateRiskCode(adm.id, 'RED'); }} className="w-4 h-4 rounded-full bg-error"></button>
                        <button onClick={(e) => { e.stopPropagation(); updateRiskCode(adm.id, 'YELLOW'); }} className="w-4 h-4 rounded-full bg-alert"></button>
                        <button onClick={(e) => { e.stopPropagation(); updateRiskCode(adm.id, 'GREEN'); }} className="w-4 h-4 rounded-full bg-success"></button>
                      </div>
                    </div>
                    <div className="mb-3">
                      <h4 className="font-bold text-text truncate">{adm.patient_name}</h4>
                      <p className="text-[10px] text-text/60">{adm.gender}, {adm.age}y | {adm.patient_id_str}</p>
                    </div>
                    {latestVital ? (
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="flex items-center gap-1">
                          <Activity size={10} className="text-text/40" />
                          <span className="font-bold">BP: {latestVital.bp}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity size={10} className="text-text/40" />
                          <span className="font-bold">Pulse: {latestVital.pulse}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Thermometer size={10} className="text-text/40" />
                          <span className="font-bold">Temp: {latestVital.temp}°F</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity size={10} className="text-text/40" />
                          <span className="font-bold">SpO2: {latestVital.spO2}%</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-text/40 italic">No vitals recorded</div>
                    )}
                  </div>
                );
              })}
              {admissions.length === 0 && (
                <div className="col-span-full py-12 text-center text-text/40 italic">No patients currently admitted in this ward.</div>
              )}
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Medication Management */}
            <Card title="Medication Due List" action={<Badge variant="alert">{medications.length} Pending</Badge>}>
              <div className="space-y-3">
                {medications.map(med => (
                  <div key={med.id} className="flex items-center justify-between p-3 bg-bg rounded-xl border border-black/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                        <Pill size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-text">{med.medicine_name}</p>
                        <p className="text-[10px] text-text/60">{med.dosage} | {med.frequency}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-alert">Due Now</p>
                      <button className="text-[10px] text-primary font-bold hover:underline">Mark Administered</button>
                    </div>
                  </div>
                ))}
                {medications.length === 0 && (
                  <div className="py-8 text-center text-text/40 italic text-xs">No medications due at this time.</div>
                )}
              </div>
            </Card>

            {/* Task Assignment Module */}
            <Card title="Nursing Tasks" action={<button className="text-xs text-primary font-bold hover:underline">+ Add Task</button>}>
              <div className="space-y-3">
                {tasks.map(task => (
                  <div key={task.id} className={`flex items-center justify-between p-3 rounded-xl border ${task.status === 'Completed' ? 'bg-success/5 border-success/20' : 'bg-bg border-black/5'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${task.status === 'Completed' ? 'bg-success/20 text-success' : 'bg-primary/10 text-primary'}`}>
                        {task.task_type === 'Injection' ? <Syringe size={16} /> : <ClipboardCheck size={16} />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-text">{task.task_type}</p>
                        <p className="text-[10px] text-text/60">Bed {task.bed_number} - {task.patient_name}</p>
                      </div>
                    </div>
                    {task.status === 'Pending' ? (
                      <button 
                        onClick={() => completeTask(task.id)}
                        className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-lg shadow-sm"
                      >
                        Complete
                      </button>
                    ) : (
                      <CheckCircle2 size={16} className="text-success" />
                    )}
                  </div>
                ))}
                {tasks.length === 0 && (
                  <div className="py-8 text-center text-text/40 italic text-xs">No pending tasks.</div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Sidebar Panel: Shifts & ICU Monitoring */}
        <div className="space-y-6">
          {/* Shift & Roster Panel */}
          <Card title="Shift Roster">
            <div className="space-y-4">
              {shifts.map(shift => (
                <div key={shift.id} className="p-3 bg-bg rounded-xl border border-black/5">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{shift.shift_name} SHIFT</p>
                    <Badge variant="info">Active</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-xs font-bold border border-black/5 shadow-sm">
                      {shift.nurse_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-text">{shift.nurse_name}</p>
                      <p className="text-[10px] text-text/60">{shift.ward_name}</p>
                    </div>
                  </div>
                </div>
              ))}
              {shifts.length === 0 && (
                <div className="text-center py-4 text-text/40 italic text-xs">No active shift records.</div>
              )}
              <button className="w-full py-2 border border-primary/20 text-primary text-xs font-bold rounded-lg hover:bg-primary/5 transition-colors">
                View Full Roster
              </button>
            </div>
          </Card>

          {/* ICU Smart Monitoring */}
          <Card title="ICU Smart Monitoring">
            {selectedAdmission && selectedAdmission.bed_type === 'ICU' ? (
              <div className="space-y-4">
                <div className="p-4 bg-black rounded-xl border-2 border-success/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                      <span className="text-[10px] font-bold text-success uppercase tracking-widest">Live Monitor</span>
                    </div>
                    <span className="text-[10px] text-white/40 font-mono">BED {selectedAdmission.bed_number}</span>
                  </div>
                  
                  <div className="h-32 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={icuTrends}>
                        <defs>
                          <linearGradient id="colorPulse" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="pulse" stroke="#22c55e" fillOpacity={1} fill="url(#colorPulse)" isAnimationActive={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="text-center">
                      <p className="text-[8px] text-white/40 uppercase font-bold">Pulse</p>
                      <p className="text-2xl font-bold text-success font-mono">{icuTrends[icuTrends.length-1]?.pulse || '--'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] text-white/40 uppercase font-bold">SpO2</p>
                      <p className="text-2xl font-bold text-success font-mono">{icuTrends[icuTrends.length-1]?.spO2 || '--'}%</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-error/10 rounded-xl border border-error/20">
                  <div className="flex items-center gap-2 text-error mb-1">
                    <AlertTriangle size={14} />
                    <span className="text-[10px] font-bold uppercase">Critical Alerts</span>
                  </div>
                  <p className="text-[10px] text-error/80">No critical alerts detected for this patient.</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-text/40 italic text-xs">
                Select an ICU patient to view live monitoring data.
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

// --- Laboratory Management ---
const LaboratoryManagement = ({ hospitalId }: { hospitalId: number }) => {
  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'tests' | 'trends'>('orders');
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [tests, setTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
  const [results, setResults] = useState<LabResult[]>([]);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [selectedTrendTest, setSelectedTrendTest] = useState<string>('');
  const [selectedTrendPatient, setSelectedTrendPatient] = useState<number | null>(null);
  const [showAddTestModal, setShowAddTestModal] = useState(false);
  const [newTest, setNewTest] = useState<Partial<LabTest>>({
    name: '',
    category: '',
    reference_range: '',
    unit: '',
    price: 0,
    is_group: 0,
    item_ids: []
  });

  useEffect(() => {
    fetchData();
  }, [hospitalId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, testsRes, patientsRes, doctorsRes] = await Promise.all([
        fetch(`/api/lab/orders?hospitalId=${hospitalId}`),
        fetch(`/api/lab/tests?hospitalId=${hospitalId}`),
        fetch(`/api/patients?hospitalId=${hospitalId}`),
        fetch(`/api/doctors?hospitalId=${hospitalId}`)
      ]);
      setOrders(await ordersRes.json());
      setTests(await testsRes.json());
      setPatients(await patientsRes.json());
      setDoctors(await doctorsRes.json());
    } catch (error) {
      console.error("Error fetching lab data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async (orderId: number) => {
    try {
      const res = await fetch(`/api/lab/results/${orderId}`);
      setResults(await res.json());
    } catch (error) {
      console.error("Error fetching results:", error);
    }
  };

  const handleOrderSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const testIds = formData.getAll('test_ids').map(Number);
    
    const payload = {
      hospital_id: hospitalId,
      patient_id: Number(formData.get('patient_id')),
      doctor_id: Number(formData.get('doctor_id')),
      priority: formData.get('priority'),
      notes: formData.get('notes'),
      test_ids: testIds
    };

    try {
      const res = await fetch('/api/lab/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowOrderModal(false);
        fetchData();
      }
    } catch (error) {
      console.error("Error creating lab order:", error);
    }
  };

  const handleResultUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updatedResults = results.map(r => ({
      id: r.id,
      order_id: selectedOrder?.id,
      result_value: formData.get(`result_${r.id}`),
      is_abnormal: formData.get(`abnormal_${r.id}`) === 'on',
      performed_by: "Lab Technician",
      device_id: formData.get(`device_${r.id}`) || "Manual"
    }));

    try {
      const res = await fetch('/api/lab/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results: updatedResults })
      });
      if (res.ok) {
        setSelectedOrder(null);
        fetchData();
      }
    } catch (error) {
      console.error("Error updating results:", error);
    }
  };

  const fetchTrends = async () => {
    if (!selectedTrendPatient || !selectedTrendTest) return;
    try {
      const res = await fetch(`/api/lab/trends?patientId=${selectedTrendPatient}&testName=${encodeURIComponent(selectedTrendTest)}`);
      const data = await res.json();
      setTrends(data.map((d: any) => ({
        ...d,
        value: parseFloat(d.result_value),
        date: new Date(d.performed_at).toLocaleDateString()
      })));
    } catch (error) {
      console.error("Error fetching trends:", error);
    }
  };

  const handleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/lab/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newTest, hospital_id: hospitalId })
      });
      if (res.ok) {
        setShowAddTestModal(false);
        setNewTest({ name: '', category: '', reference_range: '', unit: '', price: 0, is_group: 0, item_ids: [] });
        fetchData();
      }
    } catch (error) {
      console.error("Error adding test:", error);
    }
  };

  const handleDeviceFetch = async (deviceType: string) => {
    if (!selectedOrder) return;
    try {
      const res = await fetch('/api/lab/mock-device-fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: selectedOrder.id, deviceType })
      });
      const data = await res.json();
      if (data.success) {
        const newResults = results.map(r => {
          const mock = data.results.find((m: any) => m.id === r.id);
          return mock ? { ...r, ...mock } : r;
        });
        setResults(newResults);
      }
    } catch (error) {
      console.error("Error fetching from device:", error);
    }
  };

  const generatePDF = (order: LabOrder, results: LabResult[]) => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.setTextColor(79, 70, 229); // Primary color
      doc.text('Laboratory Report', 105, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Hospital ID: ${hospitalId}`, 20, 30);
      doc.text(`Order Date: ${new Date(order.order_date).toLocaleString()}`, 20, 35);
      doc.text(`Report Date: ${new Date().toLocaleString()}`, 20, 40);
      
      doc.setDrawColor(200);
      doc.line(20, 45, 190, 45);
      
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(`Patient Name: ${order.patient_name}`, 20, 55);
      doc.text(`Patient ID: ${order.patient_id_str}`, 20, 60);
      doc.text(`Doctor: ${order.doctor_name}`, 120, 55);
      
      doc.line(20, 65, 190, 65);
      
      const tableData = results.map(r => [
        r.test_name,
        r.result_value || 'N/A',
        r.unit || '',
        r.reference_range || '',
        r.is_abnormal ? 'ABNORMAL' : 'Normal'
      ]);

      autoTable(doc, {
        startY: 75,
        head: [['Test Name', 'Result', 'Unit', 'Reference Range', 'Status']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { top: 75 },
        didDrawPage: (data) => {
          // Footer
          const str = "Page " + (doc as any).internal.getNumberOfPages();
          doc.setFontSize(10);
          const pageSize = doc.internal.pageSize;
          const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
          doc.text(str, data.settings.margin.left, pageHeight - 10);
        }
      });

      doc.save(`LabReport_${order.patient_id_str}_${order.id}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const sendWhatsApp = (order: LabOrder) => {
    const message = `Hello ${order.patient_name}, your lab report for Order #${order.id} is ready. You can view it at our portal.`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleDeleteOrder = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        const res = await fetch(`/api/lab/orders/${id}`, { method: 'DELETE' });
        if (res.ok) fetchData();
      } catch (error) {
        console.error("Error deleting lab order:", error);
      }
    }
  };

  const handleDeleteTest = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this test?')) {
      try {
        const res = await fetch(`/api/lab/tests/${id}`, { method: 'DELETE' });
        if (res.ok) fetchData();
      } catch (error) {
        console.error("Error deleting lab test:", error);
      }
    }
  };

  if (loading) return <div className="p-8 text-center">Loading Laboratory Module...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text tracking-tight">Laboratory (Pathology)</h1>
          <p className="text-text/60 mt-1">Manage test orders, results, and diagnostics</p>
        </div>
        <div className="flex items-center gap-3">
          {activeSubTab === 'tests' && (
            <button 
              onClick={() => setShowAddTestModal(true)}
              className="flex items-center gap-2 bg-white border border-primary text-primary px-4 py-2 rounded-xl hover:bg-primary/5 transition-all shadow-sm font-bold text-sm"
            >
              <Plus className="w-4 h-4" />
              Add New Test
            </button>
          )}
          <button 
            onClick={() => setShowOrderModal(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 transition-all shadow-sm font-bold text-sm"
          >
            <Plus className="w-4 h-4" />
            New Test Order
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-black/5 p-1 rounded-xl w-fit mb-8">
        <button 
          onClick={() => setActiveSubTab('orders')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeSubTab === 'orders' ? "bg-white text-primary shadow-sm" : "text-text/60 hover:text-text"}`}
        >
          Test Orders
        </button>
        <button 
          onClick={() => setActiveSubTab('tests')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeSubTab === 'tests' ? "bg-white text-primary shadow-sm" : "text-text/60 hover:text-text"}`}
        >
          Test Catalog
        </button>
        <button 
          onClick={() => setActiveSubTab('trends')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeSubTab === 'trends' ? "bg-white text-primary shadow-sm" : "text-text/60 hover:text-text"}`}
        >
          Trend Analysis
        </button>
      </div>

      {activeSubTab === 'orders' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-black/5">
                      <th className="px-4 py-3 text-xs font-bold text-text/40 uppercase">Order ID</th>
                      <th className="px-4 py-3 text-xs font-bold text-text/40 uppercase">Patient</th>
                      <th className="px-4 py-3 text-xs font-bold text-text/40 uppercase">Doctor</th>
                      <th className="px-4 py-3 text-xs font-bold text-text/40 uppercase">Status</th>
                      <th className="px-4 py-3 text-xs font-bold text-text/40 uppercase">Priority</th>
                      <th className="px-4 py-3 text-xs font-bold text-text/40 uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-bg/50 transition-colors">
                        <td className="px-4 py-4 text-sm font-mono text-primary">#{order.id}</td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-bold text-text">{order.patient_name}</p>
                          <p className="text-[10px] text-text/60">{order.patient_id_str}</p>
                        </td>
                        <td className="px-4 py-4 text-sm text-text/60">{order.doctor_name}</td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                            order.status === 'Completed' ? "bg-success/10 text-success" :
                            order.status === 'Processing' ? "bg-alert/10 text-alert" :
                            "bg-black/5 text-text/60"
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-[10px] font-bold ${
                            order.priority === 'STAT' ? "text-error" :
                            order.priority === 'Urgent' ? "text-alert" :
                            "text-text/40"
                          }`}>
                            {order.priority}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => {
                                setSelectedOrder(order);
                                fetchResults(order.id);
                              }}
                              className="p-2 text-text/40 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                            >
                              <ClipboardListIcon size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteOrder(order.id)}
                              className="p-2 text-text/40 hover:text-error hover:bg-error/10 rounded-lg transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                            {order.status === 'Completed' && (
                              <>
                                <button 
                                  disabled={downloadingId === order.id}
                                  onClick={async () => {
                                    try {
                                      setDownloadingId(order.id);
                                      const res = await fetch(`/api/lab/results/${order.id}`);
                                      if (!res.ok) throw new Error("Failed to fetch results");
                                      const resultsData = await res.json();
                                      generatePDF(order, resultsData);
                                    } catch (error) {
                                      console.error("Download error:", error);
                                      alert("Failed to download report.");
                                    } finally {
                                      setDownloadingId(null);
                                    }
                                  }}
                                  className={`p-2 rounded-lg transition-all ${
                                    downloadingId === order.id 
                                      ? "text-text/20 bg-black/5 animate-pulse" 
                                      : "text-success hover:bg-success/10"
                                  }`}
                                  title="Download Report"
                                >
                                  <FileDown size={16} className={downloadingId === order.id ? "animate-bounce" : ""} />
                                </button>
                                <button 
                                  onClick={() => sendWhatsApp(order)}
                                  className="p-2 text-success hover:bg-success/10 rounded-lg transition-all"
                                  title="Share on WhatsApp"
                                >
                                  <Share2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            {selectedOrder ? (
              <Card title={`Result Entry: #${selectedOrder.id}`}>
                <div className="mb-6 p-4 bg-bg rounded-xl border border-black/5">
                  <p className="text-xs font-bold text-text">{selectedOrder.patient_name}</p>
                  <p className="text-[10px] text-text/60">Ordered: {new Date(selectedOrder.order_date).toLocaleString()}</p>
                </div>

                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                  <button onClick={() => handleDeviceFetch('Hematology')} className="flex-shrink-0 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-[10px] font-bold border border-primary/20 hover:bg-primary/20">Fetch Hematology</button>
                  <button onClick={() => handleDeviceFetch('Biochemistry')} className="flex-shrink-0 px-3 py-1.5 bg-success/10 text-success rounded-lg text-[10px] font-bold border border-success/20 hover:bg-success/20">Fetch Biochemistry</button>
                </div>

                <form onSubmit={handleResultUpdate} className="space-y-6">
                  {results.map((r) => (
                    <div key={r.id} className="space-y-2 p-3 border border-black/5 rounded-xl bg-bg/30">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-text">{r.test_name}</label>
                        <span className="text-[10px] text-text/40">{r.reference_range} {r.unit}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input 
                          name={`result_${r.id}`}
                          defaultValue={r.result_value || ''}
                          placeholder="Value"
                          className="flex-1 px-3 py-2 bg-white border border-black/10 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <div className="flex items-center gap-2">
                          <input type="checkbox" name={`abnormal_${r.id}`} defaultChecked={r.is_abnormal} className="rounded text-primary" />
                          <span className="text-[10px] text-text/60 font-bold">Abnormal</span>
                        </div>
                      </div>
                      <input type="hidden" name={`device_${r.id}`} defaultValue={r.device_id} />
                    </div>
                  ))}
                  <button type="submit" className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-sm text-sm">Save Results</button>
                </form>
              </Card>
            ) : (
              <div className="bg-primary/5 rounded-2xl p-8 text-center border border-primary/10">
                <Microscope className="w-12 h-12 text-primary/20 mx-auto mb-4" />
                <h3 className="text-sm font-bold text-text">Select an Order</h3>
                <p className="text-xs text-text/40 mt-2">Click on the clipboard icon to enter or view test results.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'tests' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-black/5">
                  <th className="px-4 py-3 text-xs font-bold text-text/40 uppercase">Test Name</th>
                  <th className="px-4 py-3 text-xs font-bold text-text/40 uppercase">Category</th>
                  <th className="px-4 py-3 text-xs font-bold text-text/40 uppercase">Ref. Range</th>
                  <th className="px-4 py-3 text-xs font-bold text-text/40 uppercase">Unit</th>
                  <th className="px-4 py-3 text-xs font-bold text-text/40 uppercase text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {tests.map((test) => (
                  <tr key={test.id} className="hover:bg-bg/50 transition-colors">
                    <td className="px-4 py-4 text-sm font-bold text-text">
                      {test.name}
                      {test.is_group === 1 && (
                        <span className="ml-2 px-1.5 py-0.5 bg-primary/10 text-primary text-[8px] rounded uppercase font-black">Group</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-text/60">{test.category}</td>
                    <td className="px-4 py-4 text-sm text-text/60">{test.is_group ? 'Multiple' : test.reference_range}</td>
                    <td className="px-4 py-4 text-sm text-text/60">{test.is_group ? '-' : test.unit}</td>
                    <td className="px-4 py-4 text-sm font-bold text-text text-right">₹{test.price}</td>
                    <td className="px-4 py-4 text-right">
                      <button 
                        onClick={() => handleDeleteTest(test.id)}
                        className="p-2 text-text/40 hover:text-error hover:bg-error/10 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeSubTab === 'trends' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <Card title="Filters">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-text/40 uppercase mb-1">Patient</label>
                  <select 
                    className="w-full px-3 py-2 bg-bg border border-black/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    onChange={(e) => setSelectedTrendPatient(Number(e.target.value))}
                  >
                    <option value="">Select Patient</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.patient_id_str})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text/40 uppercase mb-1">Test Parameter</label>
                  <select 
                    className="w-full px-3 py-2 bg-bg border border-black/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    onChange={(e) => setSelectedTrendTest(e.target.value)}
                  >
                    <option value="">Select Test</option>
                    {tests.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
                <button 
                  onClick={fetchTrends}
                  className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-sm flex items-center justify-center gap-2 text-xs"
                >
                  <TrendingUp className="w-4 h-4" />
                  Show Trend
                </button>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card title="Historical Trend Analysis">
              <div className="h-[350px]">
                {trends.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trends}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0066FF" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#0066FF" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => [`${value} ${trends[0].unit}`, selectedTrendTest]}
                      />
                      <Area type="monotone" dataKey="value" stroke="#0066FF" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-text/20">
                    <TrendingUp className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-xs font-bold">Select patient and test to see trend</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {showOrderModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between bg-bg">
              <h3 className="text-lg font-bold text-text">New Laboratory Order</h3>
              <button onClick={() => setShowOrderModal(false)} className="text-text/40 hover:text-text"><LogOut size={20} /></button>
            </div>
            <form onSubmit={handleOrderSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-text/40 uppercase mb-1">Patient</label>
                  <select name="patient_id" required className="w-full px-3 py-2 bg-bg border border-black/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Select Patient</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.patient_id_str})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text/40 uppercase mb-1">Ordering Doctor</label>
                  <select name="doctor_id" required className="w-full px-3 py-2 bg-bg border border-black/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Select Doctor</option>
                    {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text/40 uppercase mb-1">Priority</label>
                  <select name="priority" className="w-full px-3 py-2 bg-bg border border-black/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="Routine">Routine</option>
                    <option value="Urgent">Urgent</option>
                    <option value="STAT">STAT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text/40 uppercase mb-2">Select Tests</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto p-4 bg-bg rounded-xl border border-black/10">
                  {tests.map(test => (
                    <label key={test.id} className="flex items-center gap-2 p-2 hover:bg-white rounded-lg transition-all cursor-pointer border border-transparent hover:border-black/5">
                      <input type="checkbox" name="test_ids" value={test.id} className="rounded text-primary" />
                      <div className="flex flex-col">
                        <span className="text-[10px] text-text font-bold leading-tight">{test.name}</span>
                        {test.is_group === 1 && (
                          <span className="text-[8px] text-primary font-black uppercase">Group</span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text/40 uppercase mb-1">Clinical Notes</label>
                <textarea name="notes" rows={3} className="w-full px-3 py-2 bg-bg border border-black/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Reason for tests..."></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/5">
                <button type="button" onClick={() => setShowOrderModal(false)} className="px-4 py-2 text-xs font-bold text-text/40 hover:text-text">Cancel</button>
                <button type="submit" className="bg-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-sm text-sm">Create Order</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {showAddTestModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between bg-bg">
              <h3 className="text-lg font-bold text-text">Add New Laboratory Test</h3>
              <button onClick={() => setShowAddTestModal(false)} className="text-text/40 hover:text-text"><X size={20} /></button>
            </div>
            <form onSubmit={handleTestSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-text/40 uppercase mb-1">Test Name</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full px-3 py-2 bg-bg border border-black/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    value={newTest.name}
                    onChange={e => setNewTest({...newTest, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text/40 uppercase mb-1">Category</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full px-3 py-2 bg-bg border border-black/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    value={newTest.category}
                    onChange={e => setNewTest({...newTest, category: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text/40 uppercase mb-1">Price (₹)</label>
                  <input 
                    type="number" 
                    required 
                    className="w-full px-3 py-2 bg-bg border border-black/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    value={newTest.price}
                    onChange={e => setNewTest({...newTest, price: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-xl border border-primary/10">
                <input 
                  type="checkbox" 
                  id="is_group"
                  className="rounded text-primary"
                  checked={newTest.is_group === 1}
                  onChange={e => setNewTest({...newTest, is_group: e.target.checked ? 1 : 0, item_ids: []})}
                />
                <label htmlFor="is_group" className="text-xs font-bold text-primary cursor-pointer">This is a Group Test (Profile/Package)</label>
              </div>

              {newTest.is_group === 1 ? (
                <div>
                  <label className="block text-[10px] font-bold text-text/40 uppercase mb-2">Select Tests to Include in Group</label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-3 bg-bg rounded-xl border border-black/10">
                    {tests.filter(t => !t.is_group).map(test => (
                      <label key={test.id} className="flex items-center gap-2 p-1.5 hover:bg-white rounded transition-all cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="rounded text-primary"
                          checked={newTest.item_ids?.includes(test.id)}
                          onChange={e => {
                            const ids = newTest.item_ids || [];
                            if (e.target.checked) {
                              setNewTest({...newTest, item_ids: [...ids, test.id]});
                            } else {
                              setNewTest({...newTest, item_ids: ids.filter(id => id !== test.id)});
                            }
                          }}
                        />
                        <span className="text-[10px] text-text">{test.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-text/40 uppercase mb-1">Ref. Range</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 bg-bg border border-black/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      value={newTest.reference_range}
                      onChange={e => setNewTest({...newTest, reference_range: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text/40 uppercase mb-1">Unit</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 bg-bg border border-black/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      value={newTest.unit}
                      onChange={e => setNewTest({...newTest, unit: e.target.value})}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/5">
                <button type="button" onClick={() => setShowAddTestModal(false)} className="px-4 py-2 text-xs font-bold text-text/40 hover:text-text">Cancel</button>
                <button type="submit" className="bg-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-sm text-sm">Save Test</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

// --- Radiology Management ---
const RadiologyManagement = ({ hospitalId }: { hospitalId: number }) => {
  const [activeSubTab, setActiveSubTab] = useState<'requisitions' | 'reporting' | 'pacs'>('requisitions');
  const [orders, setOrders] = useState<RadiologyOrder[]>([]);
  const [tests, setTests] = useState<RadiologyTest[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<RadiologyOrder | null>(null);
  const [report, setReport] = useState<{ findings: string; impression: string; image_url: string; dicom_metadata: string }>({
    findings: '',
    impression: '',
    image_url: '',
    dicom_metadata: ''
  });

  useEffect(() => {
    fetchData();
  }, [hospitalId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, testsRes, patientsRes, doctorsRes] = await Promise.all([
        fetch(`/api/radiology/orders?hospitalId=${hospitalId}`),
        fetch(`/api/radiology/tests?hospitalId=${hospitalId}`),
        fetch(`/api/patients?hospitalId=${hospitalId}`),
        fetch(`/api/doctors?hospitalId=${hospitalId}`)
      ]);
      setOrders(await ordersRes.json());
      setTests(await testsRes.json());
      setPatients(await patientsRes.json());
      setDoctors(await doctorsRes.json());
    } catch (error) {
      console.error("Error fetching radiology data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResult = async (orderId: number) => {
    try {
      const res = await fetch(`/api/radiology/results/${orderId}`);
      const data = await res.json();
      if (data) {
        setReport({
          findings: data.findings || '',
          impression: data.impression || '',
          image_url: data.image_url || '',
          dicom_metadata: data.dicom_metadata || ''
        });
      } else {
        setReport({ findings: '', impression: '', image_url: '', dicom_metadata: '' });
      }
    } catch (error) {
      console.error("Error fetching result:", error);
    }
  };

  const handleOrderSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      hospital_id: hospitalId,
      patient_id: Number(formData.get('patient_id')),
      doctor_id: Number(formData.get('doctor_id')),
      test_id: Number(formData.get('test_id')),
      priority: formData.get('priority'),
      clinical_history: formData.get('clinical_history')
    };

    try {
      const res = await fetch('/api/radiology/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowOrderModal(false);
        fetchData();
      }
    } catch (error) {
      console.error("Error creating radiology order:", error);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      const res = await fetch('/api/radiology/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: selectedOrder.id,
          ...report,
          reported_by: "Dr. Radiologist"
        })
      });
      if (res.ok) {
        setSelectedOrder(null);
        fetchData();
      }
    } catch (error) {
      console.error("Error submitting report:", error);
    }
  };

  const handlePacsFetch = async () => {
    if (!selectedOrder) return;
    try {
      const res = await fetch('/api/radiology/mock-pacs-fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: selectedOrder.id, testName: selectedOrder.test_name })
      });
      const data = await res.json();
      if (data.success) {
        setReport(prev => ({ ...prev, image_url: data.imageUrl, dicom_metadata: data.dicomMetadata }));
      }
    } catch (error) {
      console.error("Error fetching from PACS:", error);
    }
  };

  const generateReportPDF = (order: RadiologyOrder, result: any) => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.setTextColor(79, 70, 229);
      doc.text('Radiology Report', 105, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Hospital ID: ${hospitalId}`, 20, 30);
      doc.text(`Order Date: ${new Date(order.order_date).toLocaleString()}`, 20, 35);
      doc.text(`Report Date: ${new Date().toLocaleString()}`, 20, 40);
      
      doc.setDrawColor(200);
      doc.line(20, 45, 190, 45);
      
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(`Patient: ${order.patient_name} (${order.patient_id_str})`, 20, 55);
      doc.text(`Doctor: ${order.doctor_name}`, 120, 55);
      doc.text(`Investigation: ${order.test_name}`, 20, 65);
      
      doc.line(20, 70, 190, 70);
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text('Findings:', 20, 80);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const findingsLines = doc.splitTextToSize(result.findings || 'No findings reported.', 170);
      doc.text(findingsLines, 20, 85);
      
      const findingsHeight = findingsLines.length * 5;
      const impressionY = 85 + findingsHeight + 10;
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text('Impression:', 20, impressionY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const impressionLines = doc.splitTextToSize(result.impression || 'No impression reported.', 170);
      doc.text(impressionLines, 20, impressionY + 5);
      
      doc.save(`RadReport_${order.patient_id_str}_${order.id}.pdf`);
    } catch (error) {
      console.error("Error generating Radiology PDF:", error);
      alert("Failed to generate report PDF.");
    }
  };

  const handleDeleteOrder = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this requisition?')) {
      try {
        const res = await fetch(`/api/radiology/orders/${id}`, { method: 'DELETE' });
        if (res.ok) fetchData();
      } catch (error) {
        console.error("Error deleting radiology order:", error);
      }
    }
  };

  if (loading) return <div className="p-8 text-center">Loading Radiology Module...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text tracking-tight">Radiology & Imaging</h1>
          <p className="text-text/60 mt-1">Manage X-Ray, Ultrasound, CT/MRI, and PACS</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowOrderModal(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 transition-all shadow-sm font-bold text-sm"
          >
            <Plus className="w-4 h-4" />
            New Investigation
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-black/5 p-1 rounded-xl w-fit mb-8">
        <button 
          onClick={() => setActiveSubTab('requisitions')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeSubTab === 'requisitions' ? "bg-white text-primary shadow-sm" : "text-text/60 hover:text-text"}`}
        >
          Requisitions
        </button>
        <button 
          onClick={() => setActiveSubTab('reporting')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeSubTab === 'reporting' ? "bg-white text-primary shadow-sm" : "text-text/60 hover:text-text"}`}
        >
          Reporting
        </button>
        <button 
          onClick={() => setActiveSubTab('pacs')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeSubTab === 'pacs' ? "bg-white text-primary shadow-sm" : "text-text/60 hover:text-text"}`}
        >
          PACS Viewer
        </button>
      </div>

      {activeSubTab === 'requisitions' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-black/5">
                  <th className="px-4 py-3 text-xs font-bold text-text/40 uppercase">Order ID</th>
                  <th className="px-4 py-3 text-xs font-bold text-text/40 uppercase">Patient</th>
                  <th className="px-4 py-3 text-xs font-bold text-text/40 uppercase">Investigation</th>
                  <th className="px-4 py-3 text-xs font-bold text-text/40 uppercase">Status</th>
                  <th className="px-4 py-3 text-xs font-bold text-text/40 uppercase">Priority</th>
                  <th className="px-4 py-3 text-xs font-bold text-text/40 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-bg/50 transition-colors">
                    <td className="px-4 py-4 text-sm font-mono text-primary">#{order.id}</td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-bold text-text">{order.patient_name}</p>
                      <p className="text-[10px] text-text/60">{order.patient_id_str}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-text/60">{order.test_name}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                        order.status === 'Completed' ? "bg-success/10 text-success" :
                        order.status === 'Scheduled' ? "bg-alert/10 text-alert" :
                        "bg-black/5 text-text/60"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-[10px] font-bold ${
                        order.priority === 'STAT' ? "text-error" :
                        order.priority === 'Urgent' ? "text-alert" :
                        "text-text/40"
                      }`}>
                        {order.priority}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => {
                            setSelectedOrder(order);
                            fetchResult(order.id);
                            setActiveSubTab('reporting');
                          }}
                          className="p-2 text-text/40 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                        >
                          <FileTextIcon size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteOrder(order.id)}
                          className="p-2 text-text/40 hover:text-error hover:bg-error/10 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                        {order.status === 'Completed' && (
                          <button 
                            disabled={downloadingId === order.id}
                            onClick={async () => {
                              try {
                                setDownloadingId(order.id);
                                const res = await fetch(`/api/radiology/results/${order.id}`);
                                if (!res.ok) throw new Error("Failed to fetch results");
                                const result = await res.json();
                                generateReportPDF(order, result);
                              } catch (error) {
                                console.error("Download error:", error);
                                alert("Failed to download report.");
                              } finally {
                                setDownloadingId(null);
                              }
                            }}
                            className={`p-2 rounded-lg transition-all ${
                              downloadingId === order.id 
                                ? "text-text/20 bg-black/5 animate-pulse" 
                                : "text-success hover:bg-success/10"
                            }`}
                            title="Download Report"
                          >
                            <Download size={16} className={downloadingId === order.id ? "animate-bounce" : ""} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeSubTab === 'reporting' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {selectedOrder ? (
              <Card title={`Radiology Report: #${selectedOrder.id}`}>
                <div className="mb-6 p-4 bg-bg rounded-xl border border-black/5 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-text">{selectedOrder.patient_name}</p>
                    <p className="text-[10px] text-text/60">{selectedOrder.test_name} | {selectedOrder.priority}</p>
                  </div>
                  <button 
                    onClick={handlePacsFetch}
                    className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-[10px] font-bold border border-primary/20 hover:bg-primary/20 flex items-center gap-2"
                  >
                    <Activity className="w-3 h-3" />
                    Fetch from PACS
                  </button>
                </div>

                <form onSubmit={handleReportSubmit} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-text/40 uppercase mb-1">Findings</label>
                    <textarea 
                      value={report.findings}
                      onChange={(e) => setReport(prev => ({ ...prev, findings: e.target.value }))}
                      rows={8}
                      className="w-full px-3 py-2 bg-bg border border-black/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Detailed findings..."
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text/40 uppercase mb-1">Impression</label>
                    <textarea 
                      value={report.impression}
                      onChange={(e) => setReport(prev => ({ ...prev, impression: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 bg-bg border border-black/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Final diagnosis/impression..."
                    ></textarea>
                  </div>
                  <div className="flex items-center justify-end gap-3">
                    <button type="button" onClick={() => setSelectedOrder(null)} className="px-4 py-2 text-xs font-bold text-text/40 hover:text-text">Clear</button>
                    <button type="submit" className="bg-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-sm text-sm">Submit Report</button>
                  </div>
                </form>
              </Card>
            ) : (
              <div className="bg-primary/5 rounded-2xl p-12 text-center border border-primary/10">
                <FileTextIcon className="w-16 h-16 text-primary/20 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-text">Select a Requisition</h3>
                <p className="text-sm text-text/40 mt-2">Choose an order from the Requisitions tab to start reporting.</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <Card title="PACS Preview">
              {report.image_url ? (
                <div className="space-y-4">
                  <div className="aspect-square bg-black rounded-xl overflow-hidden border border-black/10 relative group">
                    <img 
                      src={report.image_url} 
                      alt="PACS" 
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        onClick={() => setActiveSubTab('pacs')}
                        className="bg-white text-primary px-4 py-2 rounded-lg text-xs font-bold shadow-lg"
                      >
                        Open in Full Viewer
                      </button>
                    </div>
                  </div>
                  {report.dicom_metadata && (
                    <div className="p-3 bg-bg rounded-xl border border-black/5">
                      <p className="text-[10px] font-bold text-text/40 uppercase mb-2">DICOM Metadata</p>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(JSON.parse(report.dicom_metadata)).map(([key, val]) => (
                          <div key={key}>
                            <p className="text-[8px] text-text/40">{key}</p>
                            <p className="text-[10px] font-bold text-text">{String(val)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-square bg-bg rounded-xl border border-dashed border-black/10 flex flex-col items-center justify-center text-text/20">
                  <Activity className="w-12 h-12 mb-2" />
                  <p className="text-[10px] font-bold">No Image Fetched</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {activeSubTab === 'pacs' && (
        <div className="bg-black rounded-2xl p-4 h-[700px] flex flex-col">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-4">
              <h2 className="text-white font-bold text-sm">PACS Digital Imaging Station</h2>
              <span className="text-white/40 text-[10px] bg-white/10 px-2 py-0.5 rounded">DICOM 3.0 Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg"><Plus size={16} /></button>
              <button className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg"><Search size={16} /></button>
              <button className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg"><Activity size={16} /></button>
            </div>
          </div>
          
          <div className="flex-1 grid grid-cols-4 gap-4 overflow-hidden">
            <div className="col-span-3 bg-zinc-900 rounded-xl relative flex items-center justify-center border border-white/5">
              {report.image_url ? (
                <img 
                  src={report.image_url} 
                  alt="Full PACS" 
                  className="max-w-full max-h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-white/10 flex flex-col items-center">
                  <Activity className="w-24 h-24 mb-4" />
                  <p className="text-sm font-bold">Select a study to view images</p>
                </div>
              )}
              <div className="absolute top-4 left-4 text-white/40 text-[10px] font-mono">
                {report.dicom_metadata && JSON.parse(report.dicom_metadata).PatientID}
              </div>
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold backdrop-blur-md">Invert</button>
                <button className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold backdrop-blur-md">Zoom</button>
                <button className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold backdrop-blur-md">Measure</button>
              </div>
            </div>
            
            <div className="col-span-1 space-y-4 overflow-y-auto pr-2">
              <div className="bg-zinc-900 p-4 rounded-xl border border-white/5">
                <h3 className="text-white/60 text-[10px] font-bold uppercase mb-4">Study List</h3>
                <div className="space-y-2">
                  {orders.filter(o => o.status === 'Completed').map(o => (
                    <button 
                      key={o.id}
                      onClick={() => {
                        setSelectedOrder(o);
                        fetchResult(o.id);
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedOrder?.id === o.id ? "bg-primary/20 border-primary/40" : "bg-white/5 border-transparent hover:bg-white/10"
                      }`}
                    >
                      <p className="text-white text-[10px] font-bold">{o.patient_name}</p>
                      <p className="text-white/40 text-[8px]">{o.test_name}</p>
                      <p className="text-white/20 text-[8px] mt-1">{new Date(o.order_date).toLocaleDateString()}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showOrderModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between bg-bg">
              <h3 className="text-lg font-bold text-text">New Radiology Requisition</h3>
              <button onClick={() => setShowOrderModal(false)} className="text-text/40 hover:text-text"><LogOut size={20} /></button>
            </div>
            <form onSubmit={handleOrderSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-text/40 uppercase mb-1">Patient</label>
                  <select name="patient_id" required className="w-full px-3 py-2 bg-bg border border-black/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Select Patient</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.patient_id_str})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text/40 uppercase mb-1">Ordering Doctor</label>
                  <select name="doctor_id" required className="w-full px-3 py-2 bg-bg border border-black/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Select Doctor</option>
                    {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text/40 uppercase mb-1">Investigation</label>
                  <select name="test_id" required className="w-full px-3 py-2 bg-bg border border-black/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Select Test</option>
                    {tests.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text/40 uppercase mb-1">Priority</label>
                  <select name="priority" className="w-full px-3 py-2 bg-bg border border-black/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="Routine">Routine</option>
                    <option value="Urgent">Urgent</option>
                    <option value="STAT">STAT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text/40 uppercase mb-1">Clinical History / Indication</label>
                <textarea name="clinical_history" rows={3} className="w-full px-3 py-2 bg-bg border border-black/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Relevant clinical details..."></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/5">
                <button type="button" onClick={() => setShowOrderModal(false)} className="px-4 py-2 text-xs font-bold text-text/40 hover:text-text">Cancel</button>
                <button type="submit" className="bg-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-sm text-sm">Create Requisition</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const OTManagement = ({ hospitalId }: { hospitalId: number }) => {
  const [activeSubTab, setActiveSubTab] = useState<'scheduling' | 'inventory' | 'infection' | 'billing'>('scheduling');
  const [rooms, setRooms] = useState<OTRoom[]>([]);
  const [bookings, setBookings] = useState<OTBooking[]>([]);
  const [inventory, setInventory] = useState<OTInventoryItem[]>([]);
  const [infectionLogs, setInfectionLogs] = useState<OTInfectionLog[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<OTBooking | null>(null);

  // Booking Form State
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [surgeryName, setSurgeryName] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [duration, setDuration] = useState('60');

  // Infection Log Form
  const [logRoomId, setLogRoomId] = useState('');
  const [actionType, setActionType] = useState<'Sterilization' | 'Fumigation' | 'Cleaning'>('Sterilization');
  const [performedBy, setPerformedBy] = useState('');
  const [logNotes, setLogNotes] = useState('');

  const fetchData = async () => {
    const [rRes, bRes, iRes, lRes, pRes, dRes] = await Promise.all([
      fetch(`/api/ot/rooms?hospitalId=${hospitalId}`),
      fetch(`/api/ot/bookings?hospitalId=${hospitalId}`),
      fetch(`/api/ot/inventory?hospitalId=${hospitalId}`),
      fetch(`/api/ot/infection-logs?hospitalId=${hospitalId}`),
      fetch(`/api/patients?hospitalId=${hospitalId}`),
      fetch(`/api/doctors?hospitalId=${hospitalId}`)
    ]);
    setRooms(await rRes.json());
    setBookings(await bRes.json());
    setInventory(await iRes.json());
    setInfectionLogs(await lRes.json());
    setPatients(await pRes.json());
    setDoctors(await dRes.json());
  };

  useEffect(() => { fetchData(); }, [hospitalId, activeSubTab]);

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/ot/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hospital_id: hospitalId,
        patient_id: parseInt(selectedPatientId),
        doctor_id: parseInt(selectedDoctorId),
        room_id: parseInt(selectedRoomId),
        surgery_name: surgeryName,
        scheduled_at: scheduledAt,
        duration_minutes: parseInt(duration)
      })
    });
    if (res.ok) {
      alert("Surgery Scheduled Successfully");
      setSurgeryName('');
      fetchData();
    }
  };

  const handleAddInfectionLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/ot/infection-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room_id: parseInt(logRoomId),
        action_type: actionType,
        performed_by: performedBy,
        notes: logNotes
      })
    });
    if (res.ok) {
      alert("Infection Control Log Added");
      setLogNotes('');
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      {selectedBooking ? (
        <div className="space-y-6">
          <button onClick={() => setSelectedBooking(null)} className="flex items-center gap-2 text-primary font-medium hover:underline">
            <ArrowLeft size={18} />
            Back to Schedule
          </button>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-text">{selectedBooking.surgery_name}</h2>
              <p className="text-text/60">{selectedBooking.patient_name} | {selectedBooking.doctor_name} | {selectedBooking.room_name}</p>
            </div>
            <Badge variant={selectedBooking.status === 'Scheduled' ? 'info' : 'success'}>{selectedBooking.status}</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Pre-Operative Assessment">
              <div className="space-y-4">
                <div className="p-4 bg-bg rounded-xl border border-black/5">
                  <p className="text-xs font-bold text-text/40 uppercase mb-2">Fitness Status</p>
                  <p className="text-sm font-medium">Fit for Surgery (ASA-I)</p>
                </div>
                <div className="p-4 bg-bg rounded-xl border border-black/5">
                  <p className="text-xs font-bold text-text/40 uppercase mb-2">Pre-op Vitals</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>BP: 120/80</div>
                    <div>Pulse: 72</div>
                    <div>SpO2: 98%</div>
                  </div>
                </div>
                <button className="w-full py-2 border border-primary text-primary rounded-lg text-sm font-bold">Update Assessment</button>
              </div>
            </Card>

            <Card title="Anesthesia Record">
              <div className="space-y-4">
                <div className="p-4 bg-bg rounded-xl border border-black/5">
                  <p className="text-xs font-bold text-text/40 uppercase mb-2">Anesthesia Type</p>
                  <p className="text-sm font-medium">General Anesthesia</p>
                </div>
                <div className="p-4 bg-bg rounded-xl border border-black/5">
                  <p className="text-xs font-bold text-text/40 uppercase mb-2">Medications</p>
                  <p className="text-xs text-text/60">Propofol, Fentanyl, Rocuronium</p>
                </div>
                <button className="w-full py-2 border border-primary text-primary rounded-lg text-sm font-bold">Manage Anesthesia</button>
              </div>
            </Card>

            <Card title="Intra-Operative Notes">
              <div className="space-y-4">
                <textarea className="w-full px-4 py-2 rounded-lg border border-black/10 text-sm" rows={4} placeholder="Enter procedure details..." />
                <button className="w-full bg-primary text-white py-2 rounded-lg text-sm font-bold">Save Intra-op Notes</button>
              </div>
            </Card>

            <Card title="OT Consumables Usage">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <select className="flex-1 px-3 py-2 rounded-lg border border-black/10 text-sm">
                    <option>Select Consumable...</option>
                    {inventory.map(i => <option key={i.id}>{i.name}</option>)}
                  </select>
                  <input type="number" className="w-20 px-3 py-2 rounded-lg border border-black/10 text-sm" placeholder="Qty" />
                  <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold">Add</button>
                </div>
                <div className="text-xs text-text/40 italic text-center py-4">No consumables recorded yet.</div>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-text">Operation Theatre Management</h2>
              <p className="text-text/60">Scheduling, Intra-op Records & Sterilization</p>
            </div>
            <div className="flex bg-white rounded-lg border border-black/5 p-1">
              {(['scheduling', 'inventory', 'infection', 'billing'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveSubTab(tab)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${activeSubTab === tab ? 'bg-primary text-white shadow-sm' : 'text-text/60 hover:text-text'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

      {activeSubTab === 'scheduling' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card title="OT Schedule">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-black/5">
                      <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Time</th>
                      <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Surgery</th>
                      <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Patient</th>
                      <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Surgeon</th>
                      <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Room</th>
                      <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Status</th>
                      <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {bookings.map(b => (
                      <tr key={b.id} className="hover:bg-bg/50 transition-colors">
                        <td className="px-4 py-4 text-sm">
                          <div className="font-bold">{new Date(b.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          <div className="text-[10px] text-text/40">{new Date(b.scheduled_at).toLocaleDateString()}</div>
                        </td>
                        <td className="px-4 py-4 font-medium text-text">{b.surgery_name}</td>
                        <td className="px-4 py-4 text-sm">{b.patient_name}</td>
                        <td className="px-4 py-4 text-sm">{b.doctor_name}</td>
                        <td className="px-4 py-4 text-sm text-text/60">{b.room_name}</td>
                        <td className="px-4 py-4">
                          <Badge variant={b.status === 'Scheduled' ? 'info' : b.status === 'In-Progress' ? 'alert' : 'success'}>
                            {b.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-4">
                          <button 
                            onClick={() => setSelectedBooking(b)}
                            className="text-primary hover:underline text-xs font-bold"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                    {bookings.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-text/40 italic">No surgeries scheduled</td></tr>}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
          <div className="space-y-6">
            <Card title="Schedule New Surgery">
              <form onSubmit={handleCreateBooking} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-text/40 uppercase">Patient</label>
                  <select className="w-full px-4 py-2 rounded-lg border border-black/10 mt-1" value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)} required>
                    <option value="">Select Patient...</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.patient_id_str})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-text/40 uppercase">Surgeon</label>
                  <select className="w-full px-4 py-2 rounded-lg border border-black/10 mt-1" value={selectedDoctorId} onChange={e => setSelectedDoctorId(e.target.value)} required>
                    <option value="">Select Doctor...</option>
                    {doctors.map(d => <option key={d.id} value={d.id}>{d.name} - {d.department}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-text/40 uppercase">OT Room</label>
                  <select className="w-full px-4 py-2 rounded-lg border border-black/10 mt-1" value={selectedRoomId} onChange={e => setSelectedRoomId(e.target.value)} required>
                    <option value="">Select Room...</option>
                    {rooms.map(r => <option key={r.id} value={r.id}>{r.name} ({r.type})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-text/40 uppercase">Surgery Name</label>
                  <input className="w-full px-4 py-2 rounded-lg border border-black/10 mt-1" value={surgeryName} onChange={e => setSurgeryName(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-text/40 uppercase">Date & Time</label>
                    <input type="datetime-local" className="w-full px-4 py-2 rounded-lg border border-black/10 mt-1" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} required />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-text/40 uppercase">Duration (Min)</label>
                    <input type="number" className="w-full px-4 py-2 rounded-lg border border-black/10 mt-1" value={duration} onChange={e => setDuration(e.target.value)} required />
                  </div>
                </div>
                <button type="submit" className="w-full bg-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                  <Calendar size={18} />
                  Confirm Schedule
                </button>
              </form>
            </Card>
          </div>
        </div>
      )}

      {activeSubTab === 'inventory' && (
        <Card title="OT Specific Inventory">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-black/5">
                  <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Item Name</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Category</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Stock</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {inventory.map(i => (
                  <tr key={i.id} className="hover:bg-bg/50 transition-colors">
                    <td className="px-4 py-4 font-medium text-text">{i.name}</td>
                    <td className="px-4 py-4 text-sm text-text/60">{i.category}</td>
                    <td className="px-4 py-4 text-sm font-bold">
                      <span className={i.current_stock < i.min_stock_level ? 'text-error' : 'text-success'}>
                        {i.current_stock} {i.uom}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={i.current_stock > 0 ? 'success' : 'alert'}>
                        {i.current_stock > 0 ? 'In Stock' : 'Out of Stock'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeSubTab === 'infection' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card title="Infection Control Logs">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-black/5">
                      <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Date & Time</th>
                      <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Room</th>
                      <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Action</th>
                      <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Performed By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {infectionLogs.map(l => (
                      <tr key={l.id}>
                        <td className="px-4 py-4 text-sm">{new Date(l.performed_at).toLocaleString()}</td>
                        <td className="px-4 py-4 font-medium">{l.room_name}</td>
                        <td className="px-4 py-4">
                          <Badge variant={l.action_type === 'Sterilization' ? 'success' : 'info'}>{l.action_type}</Badge>
                        </td>
                        <td className="px-4 py-4 text-sm text-text/60">{l.performed_by}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
          <Card title="Log New Action">
            <form onSubmit={handleAddInfectionLog} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text/40 uppercase">OT Room</label>
                <select className="w-full px-4 py-2 rounded-lg border border-black/10 mt-1" value={logRoomId} onChange={e => setLogRoomId(e.target.value)} required>
                  <option value="">Select Room...</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-text/40 uppercase">Action Type</label>
                <select className="w-full px-4 py-2 rounded-lg border border-black/10 mt-1" value={actionType} onChange={e => setActionType(e.target.value as any)} required>
                  <option value="Sterilization">Sterilization</option>
                  <option value="Fumigation">Fumigation</option>
                  <option value="Cleaning">Cleaning</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-text/40 uppercase">Performed By</label>
                <input className="w-full px-4 py-2 rounded-lg border border-black/10 mt-1" value={performedBy} onChange={e => setPerformedBy(e.target.value)} required />
              </div>
              <div>
                <label className="text-xs font-semibold text-text/40 uppercase">Notes</label>
                <textarea className="w-full px-4 py-2 rounded-lg border border-black/10 mt-1" rows={3} value={logNotes} onChange={e => setLogNotes(e.target.value)} />
              </div>
              <button type="submit" className="w-full bg-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                <ShieldAlert size={18} />
                Save Log
              </button>
            </form>
          </Card>
        </div>
      )}

      {activeSubTab === 'billing' && (
        <Card title="OT Consumables & Billing">
          <div className="text-center py-12 text-text/40 italic">
            Select a completed surgery to review consumables usage and generate billing.
          </div>
        </Card>
      )}
    </>
  )}
</div>
);
};

const PharmacyManagement = ({ hospitalId }: { hospitalId: number }) => {
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'inventory' | 'dispensing' | 'purchase' | 'narcotics' | 'returns'>('dashboard');
  const [items, setItems] = useState<PharmacyItem[]>([]);
  const [batches, setBatches] = useState<PharmacyBatch[]>([]);
  const [suppliers, setSuppliers] = useState<PharmacySupplier[]>([]);
  const [narcoticsLog, setNarcoticsLog] = useState<PharmacyNarcoticsLog[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);

  // Dispensing State
  const [cart, setCart] = useState<{ batch_id: number, name: string, quantity: number, price: number, total: number }[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [dispenseQty, setDispenseQty] = useState(1);
  const [patientId, setPatientId] = useState('');

  // Purchase State
  const [purchaseMode, setPurchaseMode] = useState<'grn' | 'po'>('grn');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [invoiceNum, setInvoiceNum] = useState('');
  const [grnItems, setGrnItems] = useState<{ item_id: number, name: string, batch_number: string, expiry_date: string, mrp: number, purchase_price: number, quantity: number, gst: number }[]>([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [newBatchNum, setNewBatchNum] = useState('');
  const [newExpiry, setNewExpiry] = useState('');
  const [newMrp, setNewMrp] = useState('');
  const [newPurchasePrice, setNewPurchasePrice] = useState('');
  const [newQty, setNewQty] = useState('');
  const [newGst, setNewGst] = useState('12');

  // Return State
  const [returnDispenseId, setReturnDispenseId] = useState('');
  const [returnReason, setReturnReason] = useState('');

  const [recentDispensing, setRecentDispensing] = useState<any[]>([]);

  const fetchData = async () => {
    const [iRes, bRes, sRes, nRes, poRes, dRes] = await Promise.all([
      fetch(`/api/pharmacy/items?hospitalId=${hospitalId}`),
      fetch(`/api/pharmacy/batches?hospitalId=${hospitalId}`),
      fetch(`/api/pharmacy/suppliers?hospitalId=${hospitalId}`),
      fetch(`/api/pharmacy/narcotics-log?hospitalId=${hospitalId}`),
      fetch(`/api/pharmacy/po?hospitalId=${hospitalId}`),
      fetch(`/api/pharmacy/dispensing?hospitalId=${hospitalId}`)
    ]);
    setItems(await iRes.json());
    setBatches(await bRes.json());
    setSuppliers(await sRes.json());
    setNarcoticsLog(await nRes.json());
    setPurchaseOrders(await poRes.json());
    setRecentDispensing(await dRes.json());
  };

  useEffect(() => { fetchData(); }, [hospitalId, activeSubTab]);

  const addToCart = () => {
    const batch = batches.find(b => b.id === parseInt(selectedBatchId));
    if (!batch) return;
    if (batch.current_stock < dispenseQty) {
      alert("Insufficient stock!");
      return;
    }
    setCart([...cart, { 
      batch_id: batch.id, 
      name: batch.item_name!, 
      quantity: dispenseQty, 
      price: batch.mrp, 
      total: batch.mrp * dispenseQty 
    }]);
    setSelectedBatchId('');
    setDispenseQty(1);
  };

  const handleDispense = async () => {
    const total = cart.reduce((sum, item) => sum + item.total, 0);
    const res = await fetch('/api/pharmacy/dispense', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hospital_id: hospitalId,
        patient_id: patientId ? parseInt(patientId) : null,
        items: cart.map(i => ({ batch_id: i.batch_id, quantity: i.quantity, unit_price: i.price, total_price: i.total })),
        total_amount: total,
        discount: 0,
        net_amount: total
      })
    });
    const data = await res.json();
    if (data.success) {
      alert(`Bill Generated: ${data.bill_number}`);
      setCart([]);
      setPatientId('');
      fetchData();
    }
  };

  const addToGrn = () => {
    const item = items.find(i => i.id === parseInt(selectedItemId));
    if (!item) return;
    setGrnItems([...grnItems, {
      item_id: item.id,
      name: item.name,
      batch_number: newBatchNum,
      expiry_date: newExpiry,
      mrp: parseFloat(newMrp),
      purchase_price: parseFloat(newPurchasePrice),
      quantity: parseInt(newQty),
      gst: parseFloat(newGst)
    }]);
    setNewBatchNum(''); setNewExpiry(''); setNewMrp(''); setNewPurchasePrice(''); setNewQty('');
  };

  const handleGrn = async () => {
    const total = grnItems.reduce((sum, i) => sum + (i.purchase_price * i.quantity), 0);
    const res = await fetch('/api/pharmacy/grn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hospital_id: hospitalId,
        supplier_id: parseInt(selectedSupplierId),
        invoice_number: invoiceNum,
        invoice_date: new Date().toISOString().split('T')[0],
        items: grnItems,
        total_amount: total
      })
    });
    const data = await res.json();
    if (data.success) {
      alert(`GRN Generated: ${data.grn_number}`);
      setGrnItems([]);
      setInvoiceNum('');
      fetchData();
    }
  };

  const handlePo = async () => {
    const total = grnItems.reduce((sum, i) => sum + (i.purchase_price * i.quantity), 0);
    const res = await fetch('/api/pharmacy/po', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hospital_id: hospitalId,
        supplier_id: parseInt(selectedSupplierId),
        items: grnItems.map(i => ({ item_id: i.item_id, quantity: i.quantity, unit_price: i.purchase_price })),
        total_amount: total
      })
    });
    const data = await res.json();
    if (data.success) {
      alert(`PO Generated: ${data.po_number}`);
      setGrnItems([]);
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text">Pharmacy Management</h2>
          <p className="text-text/60">Inventory, Dispensing & Procurement</p>
        </div>
        <div className="flex bg-white rounded-lg border border-black/5 p-1">
          {(['dashboard', 'inventory', 'dispensing', 'purchase', 'narcotics', 'returns'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${activeSubTab === tab ? 'bg-primary text-white shadow-sm' : 'text-text/60 hover:text-text'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeSubTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 text-primary rounded-xl"><Package size={24} /></div>
                <div>
                  <p className="text-xs text-text/40 font-semibold uppercase">Total Drugs</p>
                  <h4 className="text-2xl font-bold">{items.length}</h4>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-alert/10 text-alert rounded-xl"><AlertTriangle size={24} /></div>
                <div>
                  <p className="text-xs text-text/40 font-semibold uppercase">Low Stock Alerts</p>
                  <h4 className="text-2xl font-bold">{items.filter(i => (i.total_stock || 0) < i.min_stock_level).length}</h4>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-error/10 text-error rounded-xl"><Clock size={24} /></div>
                <div>
                  <p className="text-xs text-text/40 font-semibold uppercase">Expiring Soon</p>
                  <h4 className="text-2xl font-bold">{batches.filter(b => new Date(b.expiry_date) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)).length}</h4>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Low Stock Items">
              <div className="space-y-4">
                {items.filter(i => (i.total_stock || 0) < i.min_stock_level).map(i => (
                  <div key={i.id} className="flex justify-between items-center p-3 bg-bg rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{i.name}</p>
                      <p className="text-xs text-text/40">{i.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-error">{i.total_stock || 0} {i.uom}</p>
                      <p className="text-[10px] text-text/40">Min: {i.min_stock_level}</p>
                    </div>
                  </div>
                ))}
                {items.filter(i => (i.total_stock || 0) < i.min_stock_level).length === 0 && <p className="text-center text-text/40 italic py-4">All stock levels healthy</p>}
              </div>
            </Card>
            <Card title="Recent Narcotics Activity">
              <div className="space-y-4">
                {narcoticsLog.slice(0, 5).map(l => (
                  <div key={l.id} className="flex justify-between items-center p-3 bg-bg rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{l.item_name}</p>
                      <p className="text-xs text-text/40">Batch: {l.batch_number}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={l.action_type === 'Received' ? 'success' : 'alert'}>{l.action_type}</Badge>
                      <p className="text-xs font-bold mt-1">{l.quantity} Units</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeSubTab === 'inventory' && (
        <Card title="Drug Master Inventory">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-black/5">
                  <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Medicine Name</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Generic Name</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Category</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Stock</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {items.map(i => (
                  <tr key={i.id} className="hover:bg-bg/50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="font-medium text-text">{i.name}</div>
                      {i.is_narcotic === 1 && <Badge variant="error">Narcotic</Badge>}
                    </td>
                    <td className="px-4 py-4 text-sm text-text/60">{i.generic_name}</td>
                    <td className="px-4 py-4 text-sm text-text/60">{i.category}</td>
                    <td className="px-4 py-4 text-sm font-bold">
                      <span className={(i.total_stock || 0) < i.min_stock_level ? 'text-error' : 'text-success'}>
                        {i.total_stock || 0} {i.uom}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={(i.total_stock || 0) > 0 ? 'success' : 'alert'}>
                        {(i.total_stock || 0) > 0 ? 'In Stock' : 'Out of Stock'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeSubTab === 'dispensing' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card title="Dispense Medicine">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Select Medicine Batch</label>
                  <select 
                    className="w-full px-4 py-2 rounded-lg border border-black/10 focus:ring-2 focus:ring-primary/20"
                    value={selectedBatchId} onChange={e => setSelectedBatchId(e.target.value)}
                  >
                    <option value="">Choose Batch...</option>
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.item_name} - {b.batch_number} (Exp: {b.expiry_date}) - ₹{b.mrp} [Stock: {b.current_stock}]
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Qty</label>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      className="w-full px-4 py-2 rounded-lg border border-black/10"
                      value={dispenseQty} onChange={e => setDispenseQty(parseInt(e.target.value))}
                    />
                    <button onClick={addToCart} className="bg-primary text-white p-2 rounded-lg"><Plus size={20} /></button>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-bg">
                    <tr>
                      <th className="px-4 py-2">Medicine</th>
                      <th className="px-4 py-2">Qty</th>
                      <th className="px-4 py-2">Price</th>
                      <th className="px-4 py-2">Total</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {cart.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 font-medium">{item.name}</td>
                        <td className="px-4 py-3">{item.quantity}</td>
                        <td className="px-4 py-3">₹{item.price}</td>
                        <td className="px-4 py-3 font-bold">₹{item.total}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-error hover:underline">Remove</button>
                        </td>
                      </tr>
                    ))}
                    {cart.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-text/40 italic">Cart is empty</td></tr>}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Billing Summary">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Patient ID (Optional)</label>
                  <input 
                    placeholder="PAT-123456"
                    className="w-full px-4 py-2 rounded-lg border border-black/10 mt-1"
                    value={patientId} onChange={e => setPatientId(e.target.value)}
                  />
                </div>
                <div className="pt-4 border-t border-black/5 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text/60">Subtotal</span>
                    <span className="font-medium">₹{cart.reduce((sum, i) => sum + i.total, 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text/60">Discount</span>
                    <span className="font-medium">₹0</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-black/5">
                    <span>Net Amount</span>
                    <span className="text-primary">₹{cart.reduce((sum, i) => sum + i.total, 0)}</span>
                  </div>
                </div>
                <button 
                  onClick={handleDispense}
                  disabled={cart.length === 0}
                  className="w-full bg-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={20} />
                  Generate Bill & Dispense
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeSubTab === 'purchase' && (
        <div className="space-y-6">
          <div className="flex gap-4 border-b border-black/5 pb-4">
            <button 
              onClick={() => setPurchaseMode('grn')}
              className={`px-4 py-2 rounded-lg text-sm font-bold ${purchaseMode === 'grn' ? 'bg-primary text-white' : 'bg-bg text-text/40'}`}
            >
              GRN (Stock Entry)
            </button>
            <button 
              onClick={() => setPurchaseMode('po')}
              className={`px-4 py-2 rounded-lg text-sm font-bold ${purchaseMode === 'po' ? 'bg-primary text-white' : 'bg-bg text-text/40'}`}
            >
              Purchase Orders
            </button>
          </div>

          {purchaseMode === 'grn' ? (
            <Card title="Stock Inward (GRN Entry)">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Supplier</label>
                  <select 
                    className="w-full px-4 py-2 rounded-lg border border-black/10"
                    value={selectedSupplierId} onChange={e => setSelectedSupplierId(e.target.value)}
                  >
                    <option value="">Select Supplier...</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Invoice Number</label>
                  <input 
                    className="w-full px-4 py-2 rounded-lg border border-black/10"
                    value={invoiceNum} onChange={e => setInvoiceNum(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-4 bg-bg rounded-xl space-y-4">
                <p className="text-sm font-bold">Add Item to GRN</p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-xs">Medicine</label>
                    <select className="w-full px-3 py-1.5 rounded border" value={selectedItemId} onChange={e => setSelectedItemId(e.target.value)}>
                      <option value="">Select Item...</option>
                      {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs">Batch No</label>
                    <input className="w-full px-3 py-1.5 rounded border" value={newBatchNum} onChange={e => setNewBatchNum(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs">Expiry Date</label>
                    <input type="date" className="w-full px-3 py-1.5 rounded border" value={newExpiry} onChange={e => setNewExpiry(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs">MRP</label>
                    <input type="number" className="w-full px-3 py-1.5 rounded border" value={newMrp} onChange={e => setNewMrp(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs">Purchase Price</label>
                    <input type="number" className="w-full px-3 py-1.5 rounded border" value={newPurchasePrice} onChange={e => setNewPurchasePrice(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs">GST %</label>
                    <select className="w-full px-3 py-1.5 rounded border" value={newGst} onChange={e => setNewGst(e.target.value)}>
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs">Quantity</label>
                    <input type="number" className="w-full px-3 py-1.5 rounded border" value={newQty} onChange={e => setNewQty(e.target.value)} />
                  </div>
                  <div className="flex items-end">
                    <button onClick={addToGrn} className="w-full bg-secondary text-primary font-bold py-1.5 rounded border border-primary/20 hover:bg-primary hover:text-white transition-all">Add Item</button>
                  </div>
                </div>
              </div>

              <div className="mt-6 border rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-bg">
                    <tr>
                      <th className="px-4 py-2">Item</th>
                      <th className="px-4 py-2">Batch</th>
                      <th className="px-4 py-2">Expiry</th>
                      <th className="px-4 py-2">Qty</th>
                      <th className="px-4 py-2">GST</th>
                      <th className="px-4 py-2">P.Price</th>
                      <th className="px-4 py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {grnItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 font-medium">{item.name}</td>
                        <td className="px-4 py-3">{item.batch_number}</td>
                        <td className="px-4 py-3">{item.expiry_date}</td>
                        <td className="px-4 py-3">{item.quantity}</td>
                        <td className="px-4 py-3">{item.gst}%</td>
                        <td className="px-4 py-3">₹{item.purchase_price}</td>
                        <td className="px-4 py-3 font-bold">₹{item.purchase_price * item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={handleGrn}
                  disabled={grnItems.length === 0 || !selectedSupplierId}
                  className="bg-primary text-white px-8 py-2 rounded-lg font-bold shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  Submit GRN & Update Stock
                </button>
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card title="Purchase Orders History">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-black/5">
                        <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">PO Number</th>
                        <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Supplier</th>
                        <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Date</th>
                        <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Amount</th>
                        <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {purchaseOrders.map(po => (
                        <tr key={po.id}>
                          <td className="px-4 py-4 font-mono text-primary">{po.po_number}</td>
                          <td className="px-4 py-4">{po.supplier_name}</td>
                          <td className="px-4 py-4 text-sm">{new Date(po.po_date).toLocaleDateString()}</td>
                          <td className="px-4 py-4 font-bold">₹{po.total_amount}</td>
                          <td className="px-4 py-4"><Badge variant="info">{po.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
              <Card title="Create New Purchase Order">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Supplier</label>
                    <select 
                      className="w-full px-4 py-2 rounded-lg border border-black/10"
                      value={selectedSupplierId} onChange={e => setSelectedSupplierId(e.target.value)}
                    >
                      <option value="">Select Supplier...</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="p-4 bg-bg rounded-xl space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-xs">Medicine</label>
                      <select className="w-full px-3 py-1.5 rounded border" value={selectedItemId} onChange={e => setSelectedItemId(e.target.value)}>
                        <option value="">Select Item...</option>
                        {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs">Expected Price</label>
                      <input type="number" className="w-full px-3 py-1.5 rounded border" value={newPurchasePrice} onChange={e => setNewPurchasePrice(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs">Quantity</label>
                      <input type="number" className="w-full px-3 py-1.5 rounded border" value={newQty} onChange={e => setNewQty(e.target.value)} />
                    </div>
                    <div className="flex items-end">
                      <button onClick={addToGrn} className="w-full bg-primary text-white font-bold py-1.5 rounded">Add to PO</button>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button 
                    onClick={handlePo}
                    disabled={grnItems.length === 0 || !selectedSupplierId}
                    className="bg-primary text-white px-8 py-2 rounded-lg font-bold shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    Generate Purchase Order
                  </button>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'narcotics' && (
        <Card title="Narcotics Register (Statutory Compliance)">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-black/5">
                  <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Date</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Medicine</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Batch</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Action</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {narcoticsLog.map(l => (
                  <tr key={l.id} className="hover:bg-bg/50 transition-colors">
                    <td className="px-4 py-4 text-sm text-text/60">{new Date(l.log_date).toLocaleString()}</td>
                    <td className="px-4 py-4 font-medium text-text">{l.item_name}</td>
                    <td className="px-4 py-4 text-sm text-text/60">{l.batch_number}</td>
                    <td className="px-4 py-4">
                      <Badge variant={l.action_type === 'Received' ? 'success' : l.action_type === 'Returned' ? 'info' : 'alert'}>{l.action_type}</Badge>
                    </td>
                    <td className="px-4 py-4 text-sm font-bold">{l.quantity} Units</td>
                  </tr>
                ))}
                {narcoticsLog.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-text/40 italic">No narcotics transactions recorded</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeSubTab === 'returns' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Process Medicine Return">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Select Bill to Return</label>
                <select 
                  className="w-full px-4 py-2 rounded-lg border border-black/10"
                  value={returnDispenseId} onChange={e => setReturnDispenseId(e.target.value)}
                >
                  <option value="">Choose Bill...</option>
                  {recentDispensing.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.bill_number} - {d.patient_name || 'Walk-in'} (₹{d.net_amount})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Reason for Return</label>
                <textarea 
                  className="w-full px-4 py-2 rounded-lg border border-black/10"
                  rows={3}
                  value={returnReason} onChange={e => setReturnReason(e.target.value)}
                />
              </div>
              <div className="p-4 bg-alert/5 border border-alert/20 rounded-xl">
                <p className="text-xs font-bold text-alert flex items-center gap-2">
                  <AlertTriangle size={14} />
                  Return Policy Notice
                </p>
                <p className="text-[10px] text-text/60 mt-1">
                  Ensure medicines are in original packaging and not expired. Narcotics returns require additional documentation.
                </p>
              </div>
              <button 
                onClick={async () => {
                  if (!returnDispenseId) return;
                  // For simplicity in this demo, we'll return all items in the bill
                  const res = await fetch('/api/pharmacy/returns', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      hospital_id: hospitalId,
                      dispensing_id: parseInt(returnDispenseId),
                      reason: returnReason,
                      items: [] // In real app, we'd pass items to return
                    })
                  });
                  if ((await res.json()).success) {
                    alert("Return processed successfully");
                    setReturnDispenseId('');
                    setReturnReason('');
                    fetchData();
                  }
                }}
                className="w-full bg-error text-white py-3 rounded-xl font-bold"
              >
                Process Full Return
              </button>
            </div>
          </Card>
          <Card title="Recent Dispensing History">
            <div className="space-y-4">
              {recentDispensing.slice(0, 10).map(d => (
                <div key={d.id} className="flex justify-between items-center p-3 bg-bg rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{d.bill_number}</p>
                    <p className="text-xs text-text/40">{d.patient_name || 'Walk-in'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">₹{d.net_amount}</p>
                    <p className="text-[10px] text-text/40">{new Date(d.bill_date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
              {recentDispensing.length === 0 && <p className="text-center text-text/40 italic py-4">No dispensing history</p>}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

const TransferToIPDModal = ({ patient, hospitalId, onClose, onComplete }: { patient: any, hospitalId: number, onClose: () => void, onComplete: () => void }) => {
  const [beds, setBeds] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    doctor_id: '',
    bed_id: '',
    admission_note: '',
    treatment_plan: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      const [bedsRes, doctorsRes] = await Promise.all([
        fetch(`/api/beds?hospitalId=${hospitalId}`),
        fetch(`/api/doctors?hospitalId=${hospitalId}`)
      ]);
      const bedsData = await bedsRes.json();
      setBeds(bedsData.filter((b: any) => b.status === 'Available'));
      setDoctors(await doctorsRes.json());
      setLoading(false);
    };
    fetchData();
  }, [hospitalId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.doctor_id || !formData.bed_id) return;
    
    setSubmitting(true);
    try {
      const res = await fetch('/api/ipd/admissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospital_id: hospitalId,
          patient_id: patient.id,
          ...formData
        })
      });
      if (res.ok) {
        onComplete();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl"
      >
        <div className="p-8 border-b border-black/5 flex justify-between items-center bg-primary text-white">
          <div>
            <h3 className="text-xl font-black uppercase tracking-widest">Transfer to IPD</h3>
            <p className="text-xs font-bold opacity-60 uppercase tracking-widest mt-1">Patient: {patient.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {loading ? (
            <div className="py-12 text-center text-text/40 font-bold uppercase tracking-widest">Loading options...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-text/40 uppercase tracking-widest mb-2">Admitting Doctor</label>
                  <select 
                    required
                    className="w-full px-4 py-3 bg-black/2 border border-black/5 rounded-2xl text-sm focus:outline-none focus:border-primary transition-all"
                    value={formData.doctor_id}
                    onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                  >
                    <option value="">Select Doctor</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.department})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-text/40 uppercase tracking-widest mb-2">Select Bed</label>
                  <select 
                    required
                    className="w-full px-4 py-3 bg-black/2 border border-black/5 rounded-2xl text-sm focus:outline-none focus:border-primary transition-all"
                    value={formData.bed_id}
                    onChange={(e) => setFormData({ ...formData, bed_id: e.target.value })}
                  >
                    <option value="">Select Available Bed</option>
                    {beds.map(b => (
                      <option key={b.id} value={b.id}>{b.ward_name} - Bed {b.bed_number} ({b.type})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-text/40 uppercase tracking-widest mb-2">Admission Note</label>
                  <textarea 
                    className="w-full px-4 py-3 bg-black/2 border border-black/5 rounded-2xl text-sm focus:outline-none focus:border-primary transition-all min-h-[80px]"
                    placeholder="Reason for admission..."
                    value={formData.admission_note}
                    onChange={(e) => setFormData({ ...formData, admission_note: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-text/40 uppercase tracking-widest mb-2">Initial Treatment Plan</label>
                  <textarea 
                    className="w-full px-4 py-3 bg-black/2 border border-black/5 rounded-2xl text-sm focus:outline-none focus:border-primary transition-all min-h-[80px]"
                    placeholder="Plan for the first 24 hours..."
                    value={formData.treatment_plan}
                    onChange={(e) => setFormData({ ...formData, treatment_plan: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-4 bg-black/5 text-text font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-black/10 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {submitting ? 'Processing...' : 'Confirm Admission'}
                </button>
              </div>
            </>
          )}
        </form>
      </motion.div>
    </div>
  );
};

const PatientOverview = ({ patientId, hospitalId, onBack }: { patientId: number, hospitalId: number, onBack: () => void }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showTransferModal, setShowTransferModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch(`/api/patients/${patientId}/overview`);
    setData(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [patientId]);

  if (loading) return <div className="flex items-center justify-center h-64 text-text/40">Loading Patient Overview...</div>;
  if (!data) return <div className="text-center py-12 text-error">Patient not found</div>;

  const { patient, admission, vitals, opdVitals, medications, prescriptions, financial } = data;

  const donutData = [
    { name: 'Used', value: financial.used_credit, color: '#ef4444' },
    { name: 'Balance', value: financial.balance, color: '#22c55e' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-black/5 rounded-full transition-all">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-black text-text">Patient Overview</h2>
        {!admission && (
          <button 
            onClick={() => setShowTransferModal(true)}
            className="ml-auto flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Bed size={18} />
            Transfer to IPD
          </button>
        )}
      </div>

      {showTransferModal && (
        <TransferToIPDModal 
          patient={patient} 
          hospitalId={hospitalId} 
          onClose={() => setShowTransferModal(false)} 
          onComplete={() => {
            setShowTransferModal(false);
            fetchData();
          }} 
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Patient Profile & Case Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-2">
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 overflow-hidden">
                  <img 
                    src={`https://picsum.photos/seed/${patient.id}/200`} 
                    alt={patient.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="space-y-2 w-full">
                  <div className="flex justify-between text-xs">
                    <span className="text-text/40 font-bold uppercase">Barcode</span>
                    <Barcode size={16} className="text-text/60" />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text/40 font-bold uppercase">QR Code</span>
                    <QrCode size={16} className="text-text/60" />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 grid grid-cols-2 gap-y-4 gap-x-8">
                <div>
                  <p className="text-[10px] font-black text-text/30 uppercase tracking-widest">Gender</p>
                  <p className="text-sm font-bold text-text">{patient.gender}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-text/30 uppercase tracking-widest">Age</p>
                  <p className="text-sm font-bold text-text">{patient.age} Years</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-text/30 uppercase tracking-widest">Guardian Name</p>
                  <p className="text-sm font-bold text-text">Edward Thomas</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-text/30 uppercase tracking-widest">Phone</p>
                  <p className="text-sm font-bold text-text">{patient.mobile}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-black/5 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-[10px] font-black text-text/30 uppercase tracking-widest">Case ID</p>
                <p className="text-sm font-bold text-text">115</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-text/30 uppercase tracking-widest">IPD No</p>
                <p className="text-sm font-bold text-text">{admission?.id ? `IPDN${admission.id}` : 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-text/30 uppercase tracking-widest">Admission Date</p>
                <p className="text-sm font-bold text-text">{admission?.admission_date ? new Date(admission.admission_date).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-text/30 uppercase tracking-widest">Bed</p>
                <p className="text-sm font-bold text-text">{admission?.ward_name} - {admission?.bed_number}</p>
              </div>
            </div>

            {opdVitals && (
              <div className="mt-8 pt-8 border-t border-black/5">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
                    <Activity size={16} /> Latest Vitals (OPD)
                  </h4>
                  <span className="text-[10px] text-text/40 font-bold">Recorded on: {new Date(opdVitals.visit_date).toLocaleDateString()}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  <div className="p-3 bg-bg/50 rounded-xl border border-black/5">
                    <p className="text-[10px] text-text/40 font-bold uppercase mb-1">Temp</p>
                    <p className="text-sm font-black text-text">{opdVitals.vitals_temp || '--'} °F</p>
                  </div>
                  <div className="p-3 bg-bg/50 rounded-xl border border-black/5">
                    <p className="text-[10px] text-text/40 font-bold uppercase mb-1">BP</p>
                    <p className="text-sm font-black text-text">{opdVitals.vitals_bp || '--'}</p>
                  </div>
                  <div className="p-3 bg-bg/50 rounded-xl border border-black/5">
                    <p className="text-[10px] text-text/40 font-bold uppercase mb-1">Pulse</p>
                    <p className="text-sm font-black text-text">{opdVitals.vitals_pulse || '--'} bpm</p>
                  </div>
                  <div className="p-3 bg-bg/50 rounded-xl border border-black/5">
                    <p className="text-[10px] text-text/40 font-bold uppercase mb-1">SpO2</p>
                    <p className="text-sm font-black text-text">{opdVitals.vitals_spo2 || '--'} %</p>
                  </div>
                  <div className="p-3 bg-bg/50 rounded-xl border border-black/5">
                    <p className="text-[10px] text-text/40 font-bold uppercase mb-1">Weight</p>
                    <p className="text-sm font-black text-text">{opdVitals.vitals_weight || '--'} kg</p>
                  </div>
                  <div className="p-3 bg-bg/50 rounded-xl border border-black/5">
                    <p className="text-[10px] text-text/40 font-bold uppercase mb-1">Height</p>
                    <p className="text-sm font-black text-text">{opdVitals.vitals_height || '--'} cm</p>
                  </div>
                  <div className="p-3 bg-bg/50 rounded-xl border border-black/5">
                    <p className="text-[10px] text-text/40 font-bold uppercase mb-1">RR</p>
                    <p className="text-sm font-black text-text">{opdVitals.vitals_rr || '--'} bpm</p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card title="Current Vitals">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                {[
                  { label: 'Height', value: '180 Centimeters', status: 'Normal', color: 'success' },
                  { label: 'Weight', value: '85kg Kilograms', status: 'High', color: 'error' },
                  { label: 'Pulse', value: '80 Beats per', status: 'Normal', color: 'success' },
                  { label: 'Temperature', value: '95.2 Fahrenheit', status: 'Low', color: 'warning' },
                  { label: 'BP', value: '120 mmHg', status: 'High', color: 'error' },
                  { label: 'BMI', value: '26.23', status: 'Normal', color: 'success' },
                ].map((vital, i) => (
                  <div key={i} className="flex items-center justify-between group">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-text/30 uppercase tracking-widest">{vital.label}</span>
                      <span className="text-sm font-bold text-text">{vital.value}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={vital.color as any}>{vital.status}</Badge>
                      <span className="text-[10px] text-text/30 font-bold">04/08/2025</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-center justify-center bg-bg/50 rounded-3xl p-6">
                <div className="relative w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {donutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-text">74.87%</span>
                  </div>
                </div>
                <div className="mt-4 text-center space-y-1">
                  <p className="text-xs font-bold text-text/40 uppercase">Credit Limit: ${financial.credit_limit}</p>
                  <p className="text-xs font-bold text-error uppercase">Used Credit: ${financial.used_credit}</p>
                  <p className="text-xs font-bold text-success uppercase">Balance Credit: ${financial.balance}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Billing & Medication */}
        <div className="space-y-6">
          <Card title="Billing & Payments">
            <div className="space-y-6">
              {[
                { label: 'Pathology', ...financial.billing.pathology, color: 'primary' },
                { label: 'Radiology', ...financial.billing.radiology, color: 'accent' },
                { label: 'Blood Bank', ...financial.billing.blood_bank, color: 'warning' },
                { label: 'Ambulance', ...financial.billing.ambulance, color: 'success' },
              ].map((bill, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-text/40 uppercase tracking-widest">{bill.label} Payment/Billing</span>
                    <span className="text-[10px] font-bold text-text/60">₹{bill.paid} / ₹{bill.total}</span>
                  </div>
                  <div className="w-full h-2 bg-bg rounded-full overflow-hidden">
                    <div 
                      className={clsx("h-full rounded-full", `bg-${bill.color}`)} 
                      style={{ width: `${(bill.paid / bill.total) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] font-black text-text/30">{((bill.paid / bill.total) * 100).toFixed(2)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Medication">
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-bg border-y border-black/5">
                    <th className="px-6 py-2 font-black text-text/40 uppercase tracking-widest">Medicine</th>
                    <th className="px-6 py-2 font-black text-text/40 uppercase tracking-widest">Dose</th>
                    <th className="px-6 py-2 font-black text-text/40 uppercase tracking-widest">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {medications.map((med: any, i: number) => (
                    <tr key={i} className="hover:bg-bg/50">
                      <td className="px-6 py-3 font-bold text-text">{med.medicine_name}</td>
                      <td className="px-6 py-3 text-text/60">{med.dosage}</td>
                      <td className="px-6 py-3 text-text/60">{med.frequency}</td>
                    </tr>
                  ))}
                  {medications.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center text-text/30 italic">No active medications</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Recent Prescriptions">
            <div className="space-y-4">
              {prescriptions.map((p: any, i: number) => (
                <div key={i} className="p-3 bg-bg/50 rounded-2xl border border-black/5 hover:border-primary/20 transition-all cursor-pointer">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black text-primary uppercase">Prescription #{p.id}</span>
                    <span className="text-[10px] font-bold text-text/40">{new Date(p.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs font-bold text-text line-clamp-2">{p.diagnosis}</p>
                </div>
              ))}
              {prescriptions.length === 0 && (
                <p className="text-center py-4 text-text/30 italic text-xs">No prescription history</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const PatientsManagement = ({ hospitalId }: { hospitalId: number }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');

  const fetchPatients = async () => {
    const res = await fetch(`/api/patients?hospitalId=${hospitalId}`);
    setPatients(await res.json());
  };

  useEffect(() => { fetchPatients(); }, [hospitalId]);

  if (selectedPatientId) {
    return <PatientOverview patientId={selectedPatientId} hospitalId={hospitalId} onBack={() => setSelectedPatientId(null)} />;
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hospital_id: hospitalId, name, age: parseInt(age), gender, mobile, address })
    });
    setName(''); setAge(''); setMobile(''); setAddress('');
    setShowAdd(false);
    fetchPatients();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text">Patient Records</h2>
          <p className="text-text/60">View and manage hospital patient database</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-all"
        >
          <UserPlus size={20} />
          {showAdd ? 'Cancel' : 'Add Patient'}
        </button>
      </div>

      {showAdd && (
        <Card title="New Patient Registration">
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Full Name</label>
              <input 
                className="w-full px-4 py-2 rounded-lg border border-black/10 focus:ring-2 focus:ring-primary/20"
                value={name} onChange={e => setName(e.target.value)} required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Age</label>
              <input 
                type="number"
                className="w-full px-4 py-2 rounded-lg border border-black/10 focus:ring-2 focus:ring-primary/20"
                value={age} onChange={e => setAge(e.target.value)} required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Gender</label>
              <select 
                className="w-full px-4 py-2 rounded-lg border border-black/10 focus:ring-2 focus:ring-primary/20"
                value={gender} onChange={e => setGender(e.target.value)}
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Mobile</label>
              <input 
                className="w-full px-4 py-2 rounded-lg border border-black/10 focus:ring-2 focus:ring-primary/20"
                value={mobile} onChange={e => setMobile(e.target.value)} required
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Address</label>
              <input 
                className="w-full px-4 py-2 rounded-lg border border-black/10 focus:ring-2 focus:ring-primary/20"
                value={address} onChange={e => setAddress(e.target.value)} required
              />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <button type="submit" className="bg-primary text-white px-8 py-2 rounded-lg font-semibold shadow-lg shadow-primary/20">
                Register Patient
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card title="Patient List">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-black/5">
                <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">ID</th>
                <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Name</th>
                <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Age/Gender</th>
                <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Mobile</th>
                <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {patients.map(p => (
                <tr 
                  key={p.id} 
                  className="hover:bg-bg/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedPatientId(p.id)}
                >
                  <td className="px-4 py-4 text-sm font-mono text-primary">{p.patient_id_str}</td>
                  <td className="px-4 py-4 font-medium text-text">{p.name}</td>
                  <td className="px-4 py-4 text-sm text-text/60">{p.age} / {p.gender}</td>
                  <td className="px-4 py-4 text-sm text-text/60">{p.mobile}</td>
                  <td className="px-4 py-4 text-sm text-text/60 truncate max-w-[200px]">{p.address}</td>
                </tr>
              ))}
              {patients.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-text/40 italic">No patient records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const AppointmentManagement = ({ hospitalId }: { hospitalId: number }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newAppt, setNewAppt] = useState({
    patient_id: '',
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    reason: ''
  });

  const fetchData = async () => {
    const [apptsRes, patientsRes, doctorsRes] = await Promise.all([
      fetch(`/api/appointments?hospitalId=${hospitalId}`),
      fetch(`/api/patients?hospitalId=${hospitalId}`),
      fetch(`/api/doctors?hospitalId=${hospitalId}`)
    ]);
    setAppointments(await apptsRes.json());
    setPatients(await patientsRes.json());
    setDoctors(await doctorsRes.json());
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newAppt, hospital_id: hospitalId })
    });
    setShowAdd(false);
    setNewAppt({ patient_id: '', doctor_id: '', appointment_date: '', appointment_time: '', reason: '' });
    fetchData();
  };

  const updateStatus = async (id: number, status: string) => {
    await fetch(`/api/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text">Appointments</h2>
          <p className="text-text/60">Schedule and manage patient visits</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-all"
        >
          <Plus size={20} />
          New Appointment
        </button>
      </div>

      {showAdd && (
        <Card title="Schedule Appointment">
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select 
              className="px-4 py-2 rounded-lg border border-black/10"
              value={newAppt.patient_id}
              onChange={e => setNewAppt({...newAppt, patient_id: e.target.value})}
              required
            >
              <option value="">Select Patient</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.patient_id_str})</option>)}
            </select>
            <select 
              className="px-4 py-2 rounded-lg border border-black/10"
              value={newAppt.doctor_id}
              onChange={e => setNewAppt({...newAppt, doctor_id: e.target.value})}
              required
            >
              <option value="">Select Doctor</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.name} - {d.department}</option>)}
            </select>
            <input 
              type="date"
              className="px-4 py-2 rounded-lg border border-black/10"
              value={newAppt.appointment_date}
              onChange={e => setNewAppt({...newAppt, appointment_date: e.target.value})}
              required
            />
            <input 
              type="time"
              className="px-4 py-2 rounded-lg border border-black/10"
              value={newAppt.appointment_time}
              onChange={e => setNewAppt({...newAppt, appointment_time: e.target.value})}
              required
            />
            <textarea 
              placeholder="Reason for visit"
              className="md:col-span-2 px-4 py-2 rounded-lg border border-black/10"
              value={newAppt.reason}
              onChange={e => setNewAppt({...newAppt, reason: e.target.value})}
            />
            <div className="md:col-span-2 flex justify-end gap-2">
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-text/60">Cancel</button>
              <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg">Schedule</button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-black/5 text-xs font-bold text-text/40 uppercase tracking-widest">
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Doctor</th>
                <th className="px-4 py-3">Date & Time</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {appointments.map(a => (
                <tr key={a.id} className="text-sm hover:bg-black/[0.02] transition-colors">
                  <td className="px-4 py-3 font-medium">{a.patient_name}</td>
                  <td className="px-4 py-3">{a.doctor_name}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span>{a.appointment_date}</span>
                      <span className="text-xs text-text/40">{a.appointment_time}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={
                      a.status === 'Confirmed' ? 'success' : 
                      a.status === 'Cancelled' ? 'error' : 
                      a.status === 'Completed' ? 'info' : 'default'
                    }>
                      {a.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {a.status === 'Requested' && (
                        <button 
                          onClick={() => updateStatus(a.id, 'Confirmed')}
                          className="p-1.5 text-success hover:bg-success/10 rounded-lg transition-colors"
                          title="Confirm"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      {a.status !== 'Cancelled' && a.status !== 'Completed' && (
                        <button 
                          onClick={() => updateStatus(a.id, 'Cancelled')}
                          className="p-1.5 text-error hover:bg-error/10 rounded-lg transition-colors"
                          title="Cancel"
                        >
                          <AlertTriangle size={16} />
                        </button>
                      )}
                      {a.status === 'Confirmed' && (
                        <button 
                          onClick={() => updateStatus(a.id, 'Completed')}
                          className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Complete"
                        >
                          <ClipboardCheck size={16} />
                        </button>
                      )}
                      <button 
                        onClick={() => shareToWhatsApp('919999999999', `Hi ${a.patient_name}, this is a reminder for your appointment with Dr. ${a.doctor_name} on ${a.appointment_date} at ${a.appointment_time}.`)}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Remind on WhatsApp"
                      >
                        <MessageSquare size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const EmergencyManagement = ({ hospitalId }: { hospitalId: number }) => {
  const [activeTab, setActiveTab] = useState<'triage' | 'icu' | 'equipment' | 'crash-cart'>('triage');
  const [patients, setPatients] = useState<EmergencyPatient[]>([]);
  const [incomingAmbulances, setIncomingAmbulances] = useState<AmbulanceBooking[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<EmergencyPatient | null>(null);
  const [vitalsHistory, setVitalsHistory] = useState<ICUVitals[]>([]);
  const [equipment, setEquipment] = useState<ICUEquipment[]>([]);
  const [crashCart, setCrashCart] = useState<CrashCartItem[]>([]);
  const [showQuickReg, setShowQuickReg] = useState(false);
  const [showNewEquipment, setShowNewEquipment] = useState(false);
  const [eqName, setEqName] = useState('');
  const [eqType, setEqType] = useState('Ventilator');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, eRes, cRes, aRes] = await Promise.all([
        fetch(`/api/emergency/patients?hospitalId=${hospitalId}`),
        fetch(`/api/icu/equipment?hospitalId=${hospitalId}`),
        fetch(`/api/icu/crash-cart?hospitalId=${hospitalId}`),
        fetch(`/api/ambulances/bookings?hospitalId=${hospitalId}`)
      ]);
      setPatients(await pRes.json());
      setEquipment(await eRes.json());
      setCrashCart(await cRes.json());
      const ambData = await aRes.json();
      setIncomingAmbulances(ambData.filter((b: any) => b.status === 'Enroute' || b.status === 'Assigned'));
    } catch (error) {
      console.error("Error fetching emergency data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [hospitalId]);

  useEffect(() => {
    if (selectedPatient) {
      const fetchVitals = async () => {
        const res = await fetch(`/api/icu/vitals/${selectedPatient.id}`);
        const data = await res.json();
        setVitalsHistory(data.reverse());
      };
      fetchVitals();
      const interval = setInterval(fetchVitals, 5000); // Live vitals simulation
      return () => clearInterval(interval);
    }
  }, [selectedPatient]);

  const handleQuickRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      hospital_id: hospitalId,
      patient_name: formData.get('patient_name'),
      age: parseInt(formData.get('age') as string),
      gender: formData.get('gender'),
      chief_complaint: formData.get('chief_complaint'),
      triage_level: formData.get('triage_level')
    };

    const res = await fetch('/api/emergency/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      setShowQuickReg(false);
      fetchData();
    }
  };

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/icu/equipment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hospital_id: hospitalId,
        name: eqName,
        type: eqType,
        status: 'Available',
        last_service_date: new Date().toISOString()
      })
    });
    setShowNewEquipment(false);
    setEqName('');
    fetchData();
  };

  const updateTriage = async (id: number, level: TriageLevel) => {
    await fetch(`/api/emergency/patients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ triage_level: level })
    });
    fetchData();
  };

  const updateStatus = async (id: number, status: string) => {
    await fetch(`/api/emergency/patients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    fetchData();
  };

  const simulateVitals = async () => {
    if (!selectedPatient) return;
    const lastVitals = vitalsHistory[vitalsHistory.length - 1] || { hr: 80, bp_sys: 120, bp_dia: 80, spo2: 98, temp: 37 };
    
    const newVitals = {
      patient_id: selectedPatient.id,
      hr: Math.max(40, Math.min(180, lastVitals.hr + (Math.random() * 10 - 5))),
      bp_sys: Math.max(80, Math.min(200, lastVitals.bp_sys + (Math.random() * 6 - 3))),
      bp_dia: Math.max(50, Math.min(120, lastVitals.bp_dia + (Math.random() * 4 - 2))),
      spo2: Math.max(70, Math.min(100, lastVitals.spo2 + (Math.random() * 2 - 1))),
      temp: Math.max(35, Math.min(41, lastVitals.temp + (Math.random() * 0.4 - 0.2)))
    };

    await fetch('/api/icu/vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newVitals)
    });
  };

  const getTriageColor = (level: TriageLevel) => {
    switch (level) {
      case 'Red': return 'bg-red-500 text-white';
      case 'Yellow': return 'bg-yellow-400 text-black';
      case 'Green': return 'bg-emerald-500 text-white';
      case 'Black': return 'bg-slate-900 text-white';
      default: return 'bg-slate-200 text-slate-600';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Emergency & ICU Management</h2>
          <p className="text-slate-500">Real-time triage and critical care monitoring</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowNewEquipment(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-lg"
          >
            <Zap size={18} />
            Add Equipment
          </button>
          <button 
            onClick={() => setShowQuickReg(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
          >
            <Plus size={18} />
            Quick Registration
          </button>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {[
          { id: 'triage', label: 'Triage Board', icon: Activity },
          { id: 'icu', label: 'ICU Monitoring', icon: HeartPulse },
          { id: 'equipment', label: 'Life Support', icon: Zap },
          { id: 'crash-cart', label: 'Crash Cart', icon: Package }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === tab.id ? "bg-white text-red-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'triage' && (
        <div className="space-y-6">
          {incomingAmbulances.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-4 text-red-600">
                <div className="p-2 bg-red-600 text-white rounded-lg"><Truck size={24} /></div>
                <div>
                  <h4 className="font-bold uppercase tracking-wider">Incoming Ambulance Alert</h4>
                  <p className="text-xs font-medium">{incomingAmbulances.length} vehicle(s) currently enroute</p>
                </div>
              </div>
              <div className="flex gap-2">
                {incomingAmbulances.map(amb => (
                  <div key={amb.id} className="px-3 py-1 bg-white border border-red-200 rounded-lg text-[10px] font-bold text-red-600 shadow-sm">
                    {amb.vehicle_number} • {amb.pickup_location}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {(['Red', 'Yellow', 'Green', 'Black'] as TriageLevel[]).map(level => (
            <div key={level} className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
              <div className={clsx("px-4 py-2 font-bold text-sm uppercase tracking-wider flex justify-between items-center", getTriageColor(level))}>
                {level} Priority
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  {patients.filter(p => p.triage_level === level).length}
                </span>
              </div>
              <div className="p-3 space-y-3 min-h-[400px]">
                {patients.filter(p => p.triage_level === level).map(patient => (
                  <motion.div
                    layoutId={`patient-${patient.id}`}
                    key={patient.id}
                    onClick={() => { setSelectedPatient(patient); setActiveTab('icu'); }}
                    className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm cursor-pointer hover:border-red-300 transition-colors group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-slate-900 group-hover:text-red-600 transition-colors">{patient.patient_name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(patient.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3 italic">"{patient.chief_complaint}"</p>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 rounded-full text-slate-600">
                        {patient.age}y • {patient.gender}
                      </span>
                      <div className="flex gap-1">
                        {patient.vitals_hr && (
                          <div className={clsx("w-2 h-2 rounded-full animate-pulse", patient.vitals_hr > 120 ? "bg-red-500" : "bg-emerald-500")} />
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
          </div>
        </div>
      )}

      {activeTab === 'icu' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-900">Patient List</h3>
                <div className="flex items-center gap-2 text-xs text-red-600 font-bold animate-pulse">
                  <Activity size={12} />
                  LIVE
                </div>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                <div 
                  onClick={() => setSelectedPatient(null)}
                  className={clsx(
                    "p-4 border-b border-slate-50 cursor-pointer transition-colors flex items-center gap-4",
                    !selectedPatient ? "bg-slate-900 text-white" : "hover:bg-slate-50"
                  )}
                >
                  <LayoutGrid size={16} />
                  <div className="flex-1">
                    <p className="font-bold text-sm">Central Monitoring</p>
                    <p className={clsx("text-[10px]", !selectedPatient ? "text-slate-400" : "text-slate-500")}>All active patients</p>
                  </div>
                </div>
                {patients.filter(p => p.status !== 'Discharged').map(p => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPatient(p)}
                    className={clsx(
                      "p-4 border-b border-slate-50 cursor-pointer transition-colors flex items-center gap-4",
                      selectedPatient?.id === p.id ? "bg-red-50 border-l-4 border-l-red-500" : "hover:bg-slate-50"
                    )}
                  >
                    <div className={clsx("w-3 h-3 rounded-full shrink-0", getTriageColor(p.triage_level))} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 truncate">{p.patient_name}</p>
                      <p className="text-xs text-slate-500">{p.age}y • {p.gender}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono font-bold text-red-600">{p.vitals_hr || '--'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            {!selectedPatient ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {patients.filter(p => p.status !== 'Discharged').map(p => (
                  <div key={p.id} className="bg-slate-900 text-white rounded-2xl p-4 border border-white/10 shadow-xl">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold truncate max-w-[150px]">{p.patient_name}</h4>
                        <p className="text-[10px] text-slate-400">ID: EM-{p.id} • {p.triage_level}</p>
                      </div>
                      <div className={clsx("w-2 h-2 rounded-full animate-ping", getTriageColor(p.triage_level))} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                        <p className="text-[8px] text-slate-500 font-bold uppercase">HR</p>
                        <p className="text-xl font-mono font-bold text-red-400">{p.vitals_hr || '--'}</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                        <p className="text-[8px] text-slate-500 font-bold uppercase">SpO2</p>
                        <p className="text-xl font-mono font-bold text-emerald-400">{p.vitals_spo2 || '--'}%</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                        <p className="text-[8px] text-slate-500 font-bold uppercase">BP</p>
                        <p className="text-sm font-mono font-bold text-blue-400">{p.vitals_bp || '--/--'}</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                        <p className="text-[8px] text-slate-500 font-bold uppercase">TEMP</p>
                        <p className="text-sm font-mono font-bold text-orange-400">{p.vitals_temp || '--'}°C</p>
                      </div>
                    </div>
                    <div className="mt-4 h-12">
                       <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={Array.from({length: 10}).map((_, i) => ({ val: 60 + Math.random() * 40 }))}>
                          <Line type="monotone" dataKey="val" stroke="#ef4444" strokeWidth={1} dot={false} isAnimationActive={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <HeartPulse size={120} />
                  </div>
                  <div className="relative z-10 flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={clsx("px-2 py-0.5 rounded text-[10px] font-bold uppercase", getTriageColor(selectedPatient.triage_level))}>
                          {selectedPatient.triage_level} PRIORITY
                        </span>
                        <h2 className="text-2xl font-bold">{selectedPatient.patient_name}</h2>
                      </div>
                      <p className="text-slate-400 text-sm">Age: {selectedPatient.age} | Gender: {selectedPatient.gender} | ID: EM-{selectedPatient.id}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={simulateVitals}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-xs transition-colors"
                      >
                        Simulate Reading
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                    {[
                      { label: 'HEART RATE', value: vitalsHistory[vitalsHistory.length-1]?.hr || '--', unit: 'BPM', color: 'text-red-400', icon: Activity },
                      { label: 'SpO2', value: vitalsHistory[vitalsHistory.length-1]?.spo2 || '--', unit: '%', color: 'text-emerald-400', icon: Wind },
                      { label: 'BP (SYS/DIA)', value: vitalsHistory[vitalsHistory.length-1] ? `${vitalsHistory[vitalsHistory.length-1].bp_sys}/${vitalsHistory[vitalsHistory.length-1].bp_dia}` : '--/--', unit: 'mmHg', color: 'text-blue-400', icon: Zap },
                      { label: 'TEMP', value: vitalsHistory[vitalsHistory.length-1]?.temp?.toFixed(1) || '--', unit: '°C', color: 'text-orange-400', icon: Thermometer }
                    ].map(stat => (
                      <div key={stat.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-2 mb-1 opacity-60">
                          <stat.icon size={12} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">{stat.label}</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className={clsx("text-2xl font-mono font-bold", stat.color)}>{stat.value}</span>
                          <span className="text-[10px] text-slate-500">{stat.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Activity size={16} className="text-red-500" />
                      Heart Rate Trend
                    </h4>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={vitalsHistory}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="recorded_at" hide />
                          <YAxis domain={['dataMin - 10', 'dataMax + 10']} hide />
                          <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            labelFormatter={(val) => new Date(val).toLocaleTimeString()}
                          />
                          <Line type="monotone" dataKey="hr" stroke="#ef4444" strokeWidth={2} dot={false} animationDuration={300} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Wind size={16} className="text-emerald-500" />
                      SpO2 Trend
                    </h4>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={vitalsHistory}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="recorded_at" hide />
                          <YAxis domain={[70, 100]} hide />
                          <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            labelFormatter={(val) => new Date(val).toLocaleTimeString()}
                          />
                          <Line type="monotone" dataKey="spo2" stroke="#10b981" strokeWidth={2} dot={false} animationDuration={300} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === 'equipment' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {equipment.map(item => (
            <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className={clsx(
                  "p-2 rounded-xl",
                  item.status === 'Available' ? "bg-emerald-50 text-emerald-600" : 
                  item.status === 'In Use' ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"
                )}>
                  {item.type === 'Ventilator' ? <Wind size={20} /> : 
                   item.type === 'Monitor' ? <Activity size={20} /> : 
                   item.type === 'Defibrillator' ? <Zap size={20} /> : <HeartPulse size={20} />}
                </div>
                <span className={clsx(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                  item.status === 'Available' ? "bg-emerald-100 text-emerald-700" : 
                  item.status === 'In Use' ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                )}>
                  {item.status}
                </span>
              </div>
              <h4 className="font-bold text-slate-900 mb-1">{item.name}</h4>
              <p className="text-xs text-slate-500 mb-4">{item.type}</p>
              <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                <div className="text-[10px] text-slate-400">
                  Last Service: {new Date(item.last_service_date).toLocaleDateString()}
                </div>
                {item.status === 'Available' && (
                  <button className="text-xs font-bold text-red-600 hover:underline">Assign</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'crash-cart' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-900">Crash Cart Inventory</h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1 text-xs text-orange-600 font-medium">
                <AlertTriangle size={12} />
                {crashCart.filter(i => i.quantity <= i.min_quantity).length} Low Stock Items
              </span>
            </div>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-6 py-3">Item Name</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Stock Level</th>
                <th className="px-6 py-3">Expiry</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {crashCart.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900 text-sm">{item.item_name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-600">{item.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={clsx(
                            "h-full transition-all",
                            item.quantity <= item.min_quantity ? "bg-orange-500" : "bg-emerald-500"
                          )}
                          style={{ width: `${Math.min(100, (item.quantity / (item.min_quantity * 2)) * 100)}%` }}
                        />
                      </div>
                      <span className={clsx(
                        "text-xs font-mono font-bold",
                        item.quantity <= item.min_quantity ? "text-orange-600" : "text-slate-600"
                      )}>
                        {item.quantity}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-500">{new Date(item.expiry_date).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={async () => {
                        await fetch(`/api/icu/crash-cart/${item.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ quantity: item.quantity + 1 })
                        });
                        fetchData();
                      }}
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNewEquipment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-900">Add Life Support Equipment</h3>
              <button onClick={() => setShowNewEquipment(false)} className="p-2 hover:bg-white rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddEquipment} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Equipment Name</label>
                <input 
                  required
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                  value={eqName}
                  onChange={e => setEqName(e.target.value)}
                  placeholder="e.g. Philips Respironics V60"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Equipment Type</label>
                <select 
                  required
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                  value={eqType}
                  onChange={e => setEqType(e.target.value)}
                >
                  <option value="Ventilator">Ventilator</option>
                  <option value="Monitor">Patient Monitor</option>
                  <option value="Defibrillator">Defibrillator</option>
                  <option value="Infusion Pump">Infusion Pump</option>
                </select>
              </div>
              <button 
                type="submit"
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all mt-4"
              >
                Register Equipment
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {showQuickReg && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 bg-red-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Emergency Registration</h3>
                <p className="text-red-100 text-xs">Fast-track entry for critical patients</p>
              </div>
              <button onClick={() => setShowQuickReg(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleQuickRegister} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Patient Name</label>
                <input name="patient_name" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none" placeholder="Full Name" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Mobile Number</label>
                <input name="mobile" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none" placeholder="+91 XXXXX XXXXX" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Age</label>
                  <input name="age" type="number" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Gender</label>
                  <select name="gender" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none">
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Triage Level</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Red', 'Yellow', 'Green', 'Black'] as TriageLevel[]).map(level => (
                    <label key={level} className="cursor-pointer group">
                      <input type="radio" name="triage_level" value={level} className="peer hidden" defaultChecked={level === 'Green'} />
                      <div className={clsx(
                        "py-2 text-center rounded-lg text-[10px] font-bold border transition-all",
                        level === 'Red' ? "border-red-200 text-red-600 peer-checked:bg-red-600 peer-checked:text-white" :
                        level === 'Yellow' ? "border-yellow-200 text-yellow-600 peer-checked:bg-yellow-400 peer-checked:text-black" :
                        level === 'Green' ? "border-emerald-200 text-emerald-600 peer-checked:bg-emerald-500 peer-checked:text-white" :
                        "border-slate-200 text-slate-600 peer-checked:bg-slate-900 peer-checked:text-white"
                      )}>
                        {level}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Chief Complaint</label>
                <textarea name="chief_complaint" rows={3} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none resize-none" placeholder="Reason for arrival..." />
              </div>
              <button type="submit" className="w-full py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-200 mt-2">
                Register & Admit
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const ConsultantManagement = ({ hospitalId }: { hospitalId: number }) => {
  const [view, setView] = useState<'appointments' | 'referrals' | 'schedule' | 'payments' | 'new-referral'>('appointments');
  const [appointments, setAppointments] = useState<ConsultantAppointment[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [referralSource, setReferralSource] = useState('');
  const [fee, setFee] = useState('500');
  const [toSpecialty, setToSpecialty] = useState('');
  const [referralReason, setReferralReason] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appRes, refRes, docRes, patRes, payRes] = await Promise.all([
        fetch(`/api/consultants/appointments?hospitalId=${hospitalId}`),
        fetch(`/api/consultants/referrals?hospitalId=${hospitalId}`),
        fetch(`/api/doctors?hospitalId=${hospitalId}`),
        fetch(`/api/patients?hospitalId=${hospitalId}`),
        fetch(`/api/consultants/payments?hospitalId=${hospitalId}`)
      ]);
      setAppointments(await appRes.json());
      setReferrals(await refRes.json());
      setDoctors(await docRes.json());
      setPatients(await patRes.json());
      setPayments(await payRes.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [hospitalId]);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/consultants/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hospital_id: hospitalId,
        doctor_id: parseInt(selectedDoctor),
        patient_id: parseInt(selectedPatient),
        appointment_date: appointmentDate,
        referral_source: referralSource,
        consultation_fee: parseFloat(fee)
      })
    });
    setView('appointments');
    fetchData();
  };

  const handleReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/consultants/referrals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hospital_id: hospitalId,
        patient_id: parseInt(selectedPatient),
        from_doctor_id: parseInt(selectedDoctor),
        to_specialty: toSpecialty,
        reason: referralReason
      })
    });
    setView('referrals');
    fetchData();
  };

  const updateStatus = async (id: number, status: string) => {
    await fetch(`/api/consultants/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    fetchData();
  };

  const updatePayment = async (id: number, payment_status: string) => {
    await fetch(`/api/consultants/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_status })
    });
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text">Consultant Panel</h2>
          <p className="text-text/60">Specialist Appointments & Referrals</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setView('appointments')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'appointments' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white border border-black/10 text-text/60 hover:bg-bg'}`}
          >
            Appointments
          </button>
          <button 
            onClick={() => setView('referrals')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'referrals' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white border border-black/10 text-text/60 hover:bg-bg'}`}
          >
            Referrals
          </button>
          <button 
            onClick={() => setView('payments')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'payments' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white border border-black/10 text-text/60 hover:bg-bg'}`}
          >
            Payments
          </button>
          <div className="flex gap-2">
            <button 
              onClick={() => setView('new-referral')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold shadow-lg hover:bg-slate-800 transition-all"
            >
              <Share2 size={16} />
              New Referral
            </button>
            <button 
              onClick={() => setView('schedule')}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-bold shadow-lg shadow-accent/20 hover:bg-accent/90 transition-all"
            >
              <Plus size={16} />
              Schedule Visit
            </button>
          </div>
        </div>
      </div>

      {view === 'new-referral' ? (
        <Card title="Create New Referral">
          <form onSubmit={handleReferral} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-text/60 uppercase tracking-widest">Select Patient</label>
                <select 
                  required
                  className="w-full px-4 py-2 rounded-xl border border-black/10 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={selectedPatient}
                  onChange={e => setSelectedPatient(e.target.value)}
                >
                  <option value="">Choose Patient</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.patient_id_str})</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-text/60 uppercase tracking-widest">Referring Doctor</label>
                <select 
                  required
                  className="w-full px-4 py-2 rounded-xl border border-black/10 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={selectedDoctor}
                  onChange={e => setSelectedDoctor(e.target.value)}
                >
                  <option value="">Choose Doctor</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.department})</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-text/60 uppercase tracking-widest">Target Specialty</label>
                <input 
                  required
                  className="w-full px-4 py-2 rounded-xl border border-black/10 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={toSpecialty}
                  onChange={e => setToSpecialty(e.target.value)}
                  placeholder="e.g. Cardiology, Neurology"
                />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-text/60 uppercase tracking-widest">Reason for Referral</label>
                <textarea 
                  required
                  className="w-full px-4 py-2 rounded-xl border border-black/10 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  rows={3}
                  value={referralReason}
                  onChange={e => setReferralReason(e.target.value)}
                  placeholder="Detailed reason for specialist consultation..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => setView('referrals')}
                className="px-6 py-2 rounded-xl border border-black/10 font-bold text-text/60 hover:bg-bg transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-8 py-2 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all"
              >
                Create Referral
              </button>
            </div>
          </form>
        </Card>
      ) : view === 'payments' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {payments.map((pay, i) => (
            <div key={i}>
              <Card>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                    <DollarSign size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-text">{pay.doctor_name}</h4>
                    <p className="text-xs text-text/40">{pay.department}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-bg p-3 rounded-xl">
                    <p className="text-[10px] font-bold text-text/40 uppercase mb-1">Total Earnings</p>
                    <p className="text-lg font-bold text-emerald-600">₹{pay.total_earnings}</p>
                  </div>
                  <div className="bg-bg p-3 rounded-xl">
                    <p className="text-[10px] font-bold text-text/40 uppercase mb-1">Visits</p>
                    <p className="text-lg font-bold text-text">{pay.visit_count}</p>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      ) : view === 'schedule' ? (
        <Card title="Schedule Specialist Visit">
          <form onSubmit={handleSchedule} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-text/60 uppercase tracking-widest">Select Patient</label>
                <select 
                  required
                  className="w-full px-4 py-2 rounded-xl border border-black/10 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={selectedPatient}
                  onChange={e => setSelectedPatient(e.target.value)}
                >
                  <option value="">Choose Patient</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.patient_id_str})</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-text/60 uppercase tracking-widest">Select Specialist</label>
                <select 
                  required
                  className="w-full px-4 py-2 rounded-xl border border-black/10 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={selectedDoctor}
                  onChange={e => setSelectedDoctor(e.target.value)}
                >
                  <option value="">Choose Doctor</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.department})</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-text/60 uppercase tracking-widest">Appointment Date & Time</label>
                <input 
                  required
                  type="datetime-local"
                  className="w-full px-4 py-2 rounded-xl border border-black/10 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={appointmentDate}
                  onChange={e => setAppointmentDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-text/60 uppercase tracking-widest">Consultation Fee (₹)</label>
                <input 
                  required
                  type="number"
                  className="w-full px-4 py-2 rounded-xl border border-black/10 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={fee}
                  onChange={e => setFee(e.target.value)}
                />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-text/60 uppercase tracking-widest">Referral Source / Reason</label>
                <textarea 
                  className="w-full px-4 py-2 rounded-xl border border-black/10 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  rows={3}
                  value={referralSource}
                  onChange={e => setReferralSource(e.target.value)}
                  placeholder="e.g. Referred by Dr. Gupta for Cardiac Evaluation"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => setView('appointments')}
                className="px-6 py-2 rounded-xl border border-black/10 font-bold text-text/60 hover:bg-bg transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-8 py-2 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
              >
                Confirm Appointment
              </button>
            </div>
          </form>
        </Card>
      ) : view === 'appointments' ? (
        <div className="grid grid-cols-1 gap-4">
          {appointments.map(app => (
            <div key={app.id}>
              <Card>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-text">{app.patient_name}</h4>
                    <p className="text-xs text-text/60">Specialist: <span className="font-bold text-primary">{app.doctor_name}</span> ({app.specialty})</p>
                    <p className="text-[10px] text-text/40 mt-1 flex items-center gap-1">
                      <Clock size={10} /> {new Date(app.appointment_date).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-right mr-4">
                    <p className="text-[10px] text-text/40 uppercase font-bold tracking-widest">Consultation Fee</p>
                    <p className="text-sm font-bold text-success">₹{app.consultation_fee}</p>
                  </div>
                  <Badge variant={app.status === 'Authorized' ? 'success' : app.status === 'Completed' ? 'info' : 'alert'}>
                    {app.status}
                  </Badge>
                  <Badge variant={app.payment_status === 'Paid' ? 'success' : 'error'}>
                    {app.payment_status}
                  </Badge>
                  <div className="flex gap-1 ml-4 border-l border-black/5 pl-4">
                    {app.status === 'Pending' && (
                      <button 
                        onClick={() => updateStatus(app.id, 'Authorized')}
                        className="p-2 text-success hover:bg-success/10 rounded-lg transition-colors"
                        title="Authorize Visit"
                      >
                        <ShieldCheck size={18} />
                      </button>
                    )}
                    {app.status === 'Authorized' && (
                      <button 
                        onClick={() => updateStatus(app.id, 'Completed')}
                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Mark Completed"
                      >
                        <CheckCircle2 size={18} />
                      </button>
                    )}
                    {app.payment_status === 'Unpaid' && (
                      <button 
                        onClick={() => updatePayment(app.id, 'Paid')}
                        className="p-2 text-alert hover:bg-alert/10 rounded-lg transition-colors"
                        title="Mark Paid"
                      >
                        <ShoppingCart size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
            </div>
          ))}
          {appointments.length === 0 && (
            <div className="py-20 text-center bg-white rounded-2xl border-2 border-dashed border-black/5">
              <div className="w-16 h-16 bg-bg rounded-full flex items-center justify-center mx-auto mb-4 text-text/20">
                <Calendar size={32} />
              </div>
              <p className="text-text/40 font-medium italic">No specialist appointments scheduled</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {referrals.map(ref => (
            <div key={ref.id}>
              <Card>
                <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                    <Share2 size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-text">{ref.patient_name}</h4>
                    <p className="text-xs text-text/60">Referred to: <span className="font-bold text-accent">{ref.to_specialty}</span></p>
                    <p className="text-[10px] text-text/40 mt-1 italic">Reason: {ref.reason}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-text/40 uppercase font-bold tracking-widest">From Doctor</p>
                  <p className="text-sm font-bold text-text">{ref.from_doctor_name}</p>
                  <Badge variant={ref.status === 'Completed' ? 'success' : 'alert'}>{ref.status}</Badge>
                </div>
              </div>
            </Card>
            </div>
          ))}
          {referrals.length === 0 && (
            <div className="py-20 text-center bg-white rounded-2xl border-2 border-dashed border-black/5">
              <div className="w-16 h-16 bg-bg rounded-full flex items-center justify-center mx-auto mb-4 text-text/20">
                <Share2 size={32} />
              </div>
              <p className="text-text/40 font-medium italic">No active referrals found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AmbulanceManagement = ({ hospitalId }: { hospitalId: number }) => {
  const [view, setView] = useState<'bookings' | 'fleet' | 'request'>('bookings');
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [bookings, setBookings] = useState<AmbulanceBooking[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);

  // Request states
  const [selectedPatient, setSelectedPatient] = useState('');
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [fare, setFare] = useState('1500');
  const [trackingBooking, setTrackingBooking] = useState<AmbulanceBooking | null>(null);
  const [simulatedPos, setSimulatedPos] = useState({ lat: 20, lng: 70 });

  useEffect(() => {
    let interval: any;
    if (trackingBooking && trackingBooking.status === 'Assigned') {
      interval = setInterval(() => {
        setSimulatedPos(prev => ({
          lat: prev.lat + (Math.random() - 0.5) * 0.01,
          lng: prev.lng + (Math.random() - 0.5) * 0.01
        }));
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [trackingBooking]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ambRes, bookRes, patRes] = await Promise.all([
        fetch(`/api/ambulances?hospitalId=${hospitalId}`),
        fetch(`/api/ambulances/bookings?hospitalId=${hospitalId}`),
        fetch(`/api/patients?hospitalId=${hospitalId}`)
      ]);
      setAmbulances(await ambRes.json());
      setBookings(await bookRes.json());
      setPatients(await patRes.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [hospitalId]);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/ambulances/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hospital_id: hospitalId,
        patient_id: selectedPatient ? parseInt(selectedPatient) : null,
        pickup_location: pickup,
        destination: destination,
        fare: parseFloat(fare)
      })
    });
    setView('bookings');
    fetchData();
  };

  const assignAmbulance = async (bookingId: number, ambulanceId: number) => {
    await fetch(`/api/ambulances/bookings/${bookingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ambulance_id: ambulanceId })
    });
    fetchData();
  };

  const updateBookingStatus = async (bookingId: number, status: string, ambulanceId?: number) => {
    await fetch(`/api/ambulances/bookings/${bookingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        status, 
        ambulance_id: ambulanceId,
        completion_time: status === 'Completed' ? new Date().toISOString() : undefined
      })
    });
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text">Ambulance Services</h2>
          <p className="text-text/60">Emergency Transport & Fleet Management</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setView('bookings')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'bookings' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white border border-black/10 text-text/60 hover:bg-bg'}`}
          >
            Active Bookings
          </button>
          <button 
            onClick={() => setView('fleet')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'fleet' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white border border-black/10 text-text/60 hover:bg-bg'}`}
          >
            Fleet Status
          </button>
          <button 
            onClick={() => setView('request')}
            className="flex items-center gap-2 px-4 py-2 bg-error text-white rounded-lg text-sm font-bold shadow-lg shadow-error/20 hover:bg-error/90 transition-all"
          >
            <AlertTriangle size={16} />
            Request Ambulance
          </button>
        </div>
      </div>

      {view === 'request' ? (
        <Card title="New Ambulance Request">
          <form onSubmit={handleRequest} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-text/60 uppercase tracking-widest">Patient (Optional)</label>
                <select 
                  className="w-full px-4 py-2 rounded-xl border border-black/10 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={selectedPatient}
                  onChange={e => setSelectedPatient(e.target.value)}
                >
                  <option value="">Walk-in / Emergency</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.patient_id_str})</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-text/60 uppercase tracking-widest">Estimated Fare (₹)</label>
                <input 
                  required
                  type="number"
                  className="w-full px-4 py-2 rounded-xl border border-black/10 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={fare}
                  onChange={e => setFare(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-text/60 uppercase tracking-widest">Pickup Location</label>
                <input 
                  required
                  className="w-full px-4 py-2 rounded-xl border border-black/10 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={pickup}
                  onChange={e => setPickup(e.target.value)}
                  placeholder="Enter full address or landmark"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-text/60 uppercase tracking-widest">Destination</label>
                <input 
                  required
                  className="w-full px-4 py-2 rounded-xl border border-black/10 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  placeholder="Hospital Ward or External Facility"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => setView('bookings')}
                className="px-6 py-2 rounded-xl border border-black/10 font-bold text-text/60 hover:bg-bg transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-8 py-2 bg-error text-white rounded-xl font-bold shadow-lg shadow-error/20 hover:bg-error/90 transition-all"
              >
                Dispatch Request
              </button>
            </div>
          </form>
        </Card>
      ) : view === 'bookings' ? (
        <div className="grid grid-cols-1 gap-4">
          {trackingBooking && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row h-[80vh]"
              >
                <div className="flex-1 bg-slate-100 relative overflow-hidden">
                  {/* Simulated Map */}
                  <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/light-v10/static/70,20,10/800x600?access_token=mock')] bg-cover bg-center opacity-50" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute -inset-4 bg-primary/20 rounded-full"
                      />
                      <div className="relative z-10 p-3 bg-primary text-white rounded-full shadow-xl">
                        <Truck size={24} />
                      </div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white px-2 py-1 rounded shadow text-[10px] font-bold whitespace-nowrap">
                        {trackingBooking.vehicle_number}
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                    <div className="bg-white/90 backdrop-blur p-3 rounded-xl shadow-lg border border-black/5">
                      <p className="text-[10px] font-bold text-text/40 uppercase tracking-widest">Current Location</p>
                      <p className="text-sm font-bold">{simulatedPos.lat.toFixed(4)}°N, {simulatedPos.lng.toFixed(4)}°E</p>
                      <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                        <Activity size={10} /> Live GPS Signal
                      </p>
                    </div>
                    <button onClick={() => setTrackingBooking(null)} className="p-2 bg-white rounded-full shadow-lg hover:bg-bg transition-colors">
                      <X size={20} />
                    </button>
                  </div>
                </div>
                <div className="w-full md:w-80 p-6 flex flex-col">
                  <div className="mb-6">
                    <Badge variant="info">In Transit</Badge>
                    <h3 className="text-xl font-bold mt-2">{trackingBooking.patient_name || 'Emergency Case'}</h3>
                    <p className="text-sm text-text/60">Trip ID: AMB-{trackingBooking.id}</p>
                  </div>
                  
                  <div className="space-y-6 flex-1">
                    <div className="relative pl-6 space-y-8">
                      <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-slate-100" />
                      <div className="relative">
                        <div className="absolute left-[-23px] top-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm" />
                        <p className="text-[10px] font-bold text-text/40 uppercase">Pickup</p>
                        <p className="text-sm font-medium">{trackingBooking.pickup_location}</p>
                      </div>
                      <div className="relative">
                        <div className="absolute left-[-23px] top-1 w-4 h-4 rounded-full bg-primary border-4 border-white shadow-sm" />
                        <p className="text-[10px] font-bold text-text/40 uppercase">Destination</p>
                        <p className="text-sm font-medium">{trackingBooking.destination}</p>
                      </div>
                    </div>
                    
                    <div className="pt-6 border-t border-black/5">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                            <LucideUser size={20} />
                          </div>
                          <div>
                            <p className="text-xs font-bold">{trackingBooking.driver_name}</p>
                            <p className="text-[10px] text-text/40">Driver</p>
                          </div>
                        </div>
                        <button className="p-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors">
                          <Phone size={16} />
                        </button>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl">
                        <p className="text-[10px] font-bold text-text/40 uppercase mb-1">Estimated Arrival</p>
                        <p className="text-lg font-bold text-primary">12 Minutes</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
          {bookings.map(book => (
            <div key={book.id}>
              <Card>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className={clsx(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    book.status === 'Requested' ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'
                  )}>
                    <Truck size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-text">{book.patient_name || 'Emergency Case'}</h4>
                    <p className="text-xs text-text/60 flex items-center gap-1">
                      <TrendingUp size={12} className="text-error" /> {book.pickup_location} → {book.destination}
                    </p>
                    <p className="text-[10px] text-text/40 mt-1">
                      Requested: {new Date(book.booking_time).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {book.vehicle_number && (
                    <div className="text-right mr-4">
                      <p className="text-[10px] text-text/40 uppercase font-bold tracking-widest">Assigned Vehicle</p>
                      <p className="text-sm font-bold text-primary">{book.vehicle_number}</p>
                      <p className="text-[10px] text-text/40">{book.driver_name}</p>
                    </div>
                  )}
                  <Badge variant={book.status === 'Completed' ? 'success' : book.status === 'Requested' ? 'error' : 'info'}>
                    {book.status}
                  </Badge>
                  
                  <div className="flex gap-2 ml-4 border-l border-black/5 pl-4">
                    {book.status === 'Assigned' && (
                      <button 
                        onClick={() => setTrackingBooking(book)}
                        className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded text-[10px] font-bold hover:bg-primary/20 transition-colors"
                      >
                        <MapPin size={12} />
                        Track Live
                      </button>
                    )}
                    {book.status === 'Requested' && (
                      <div className="flex gap-2">
                        <select 
                          className="px-2 py-1 rounded border border-black/10 text-[10px] font-bold"
                          onChange={(e) => assignAmbulance(book.id, parseInt(e.target.value))}
                          defaultValue=""
                        >
                          <option value="" disabled>Assign Driver</option>
                          {ambulances.filter(a => a.status === 'Available').map(a => (
                            <option key={a.id} value={a.id}>{a.vehicle_number} ({a.driver_name})</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {book.status === 'Assigned' && (
                      <button 
                        onClick={() => updateBookingStatus(book.id, 'Enroute', book.ambulance_id)}
                        className="px-3 py-1 bg-accent text-white rounded text-[10px] font-bold"
                      >
                        Start Trip
                      </button>
                    )}
                    {book.status === 'Enroute' && (
                      <button 
                        onClick={() => updateBookingStatus(book.id, 'Completed', book.ambulance_id)}
                        className="px-3 py-1 bg-success text-white rounded text-[10px] font-bold"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
            </div>
          ))}
          {bookings.length === 0 && (
            <div className="py-20 text-center bg-white rounded-2xl border-2 border-dashed border-black/5">
              <div className="w-16 h-16 bg-bg rounded-full flex items-center justify-center mx-auto mb-4 text-text/20">
                <Truck size={32} />
              </div>
              <p className="text-text/40 font-medium italic">No active ambulance bookings</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ambulances.map(amb => (
            <div key={amb.id}>
              <Card>
                <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 bg-bg rounded-lg flex items-center justify-center text-text/40">
                    <Truck size={20} />
                  </div>
                  <Badge variant={amb.status === 'Available' ? 'success' : amb.status === 'Busy' ? 'alert' : 'error'}>
                    {amb.status}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-bold text-text">{amb.vehicle_number}</h4>
                  <p className="text-xs text-text/60">{amb.driver_name}</p>
                  <p className="text-[10px] text-text/40 font-mono mt-1">{amb.driver_mobile}</p>
                </div>
                <div className="pt-4 border-t border-black/5 flex justify-between items-center">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-success">
                    <CheckCircle2 size={12} /> Live GPS Active
                  </div>
                  <button className="text-primary text-[10px] font-bold hover:underline">Track Now</button>
                </div>
              </div>
            </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const WhatsAppManagement = ({ hospitalId }: { hospitalId: number }) => {
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'logs' | 'triggers'>('logs');
  const [selectedPatient, setSelectedPatient] = useState('');

  const fetchData = async () => {
    const [logsRes, patientsRes] = await Promise.all([
      fetch(`/api/whatsapp/logs?hospitalId=${hospitalId}`),
      fetch(`/api/patients?hospitalId=${hospitalId}`)
    ]);
    setLogs(await logsRes.json());
    setPatients(await patientsRes.json());
  };

  useEffect(() => { fetchData(); }, []);

  const triggerManual = async (type: string) => {
    if (!selectedPatient) return alert("Please select a patient first");
    await fetch('/api/whatsapp/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hospital_id: hospitalId, patient_id: selectedPatient, message_type: type })
    });
    fetchData();
  };

  const sendAllBirthdayWishes = async () => {
    if (!confirm("Send birthday wishes to all patients?")) return;
    for (const patient of patients) {
      await fetch('/api/whatsapp/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hospital_id: hospitalId, patient_id: patient.id, message_type: 'Birthday Wish' })
      });
    }
    fetchData();
    alert("Birthday wishes sent to all patients!");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text">WhatsApp Integration</h2>
          <p className="text-text/60">Automated messaging and communication logs</p>
        </div>
        <div className="flex gap-2 items-center">
          <button 
            onClick={sendAllBirthdayWishes}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all"
          >
            <Gift size={16} />
            Bulk Birthday Wishes
          </button>
          <div className="flex bg-white rounded-xl p-1 shadow-sm border border-black/5">
            <button 
              onClick={() => setActiveSubTab('logs')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeSubTab === 'logs' ? 'bg-primary text-white shadow-md' : 'text-text/60 hover:bg-black/5'}`}
            >
              Message Logs
            </button>
            <button 
              onClick={() => setActiveSubTab('triggers')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeSubTab === 'triggers' ? 'bg-primary text-white shadow-md' : 'text-text/60 hover:bg-black/5'}`}
            >
              Manual Triggers
            </button>
          </div>
        </div>
      </div>

      {activeSubTab === 'logs' ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-black/5 text-xs font-bold text-text/40 uppercase tracking-widest">
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Message</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Sent At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {logs.map(log => (
                  <tr key={log.id} className="text-sm hover:bg-black/[0.02] transition-colors">
                    <td className="px-4 py-3 font-medium">{log.patient_name}</td>
                    <td className="px-4 py-3 text-text/60">{log.phone_number}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-black/5 rounded text-[10px] font-bold uppercase tracking-wider">
                        {log.message_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate" title={log.message_content}>
                      {log.message_content}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={log.status === 'Sent' ? 'success' : 'error'}>
                        {log.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-text/40">
                      {new Date(log.sent_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card title="Select Patient">
              <select 
                className="w-full px-4 py-2 rounded-lg border border-black/10"
                value={selectedPatient}
                onChange={e => setSelectedPatient(e.target.value)}
              >
                <option value="">Select Patient</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <p className="mt-4 text-xs text-text/40 italic">
                Select a patient to test manual WhatsApp triggers for the demo.
              </p>
            </Card>
          </div>
          <div className="md:col-span-2">
            <Card title="Trigger Points">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Payment Reminder', icon: ShoppingCart, color: 'text-alert bg-alert/10' },
                  { label: 'Birthday Wish', icon: Cake, color: 'text-pink-500 bg-pink-50' },
                  { label: 'Emergency Alert', icon: AlertTriangle, color: 'text-error bg-error/10' },
                  { label: 'Follow-up Reminder', icon: Bell, color: 'text-accent bg-accent/10' }
                ].map(trigger => (
                  <button 
                    key={trigger.label}
                    onClick={() => triggerManual(trigger.label)}
                    className="flex items-center gap-4 p-4 rounded-xl border border-black/5 hover:border-primary/20 hover:bg-primary/5 transition-all text-left group"
                  >
                    <div className={`p-3 rounded-lg ${trigger.color} group-hover:scale-110 transition-transform`}>
                      <trigger.icon size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{trigger.label}</p>
                      <p className="text-[10px] text-text/40 uppercase tracking-widest font-bold">Send Now</p>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

const BillingManagement = ({ hospitalId }: { hospitalId: number }) => {
  const [bills, setBills] = useState<BillingRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'opd' | 'ipd' | 'pharmacy' | 'lab' | 'radiology' | 'ot' | 'icu' | 'ambulance' | 'package'>('all');

  useEffect(() => {
    const mockBills: BillingRecord[] = [
      {
        id: 1,
        hospital_id: 1,
        patient_id: 1,
        bill_number: 'BILL-2024-001',
        bill_date: '2024-03-07',
        items: [{ id: 1, bill_id: 1, description: 'Consultation Fee', quantity: 1, unit_price: 500, total_price: 500, category: 'OPD' }],
        total_amount: 500,
        discount_amount: 0,
        tax_amount: 0,
        net_amount: 500,
        payment_status: 'Paid',
        payment_mode: 'UPI',
        category: 'OPD',
        patient_name: 'John Doe',
        patient_id_str: 'PAT001'
      },
      {
        id: 2,
        hospital_id: 1,
        patient_id: 2,
        bill_number: 'BILL-2024-002',
        bill_date: '2024-03-07',
        items: [{ id: 2, bill_id: 2, description: 'Amoxicillin 500mg', quantity: 2, unit_price: 150, total_price: 300, category: 'Pharmacy' }],
        total_amount: 300,
        discount_amount: 0,
        tax_amount: 0,
        net_amount: 300,
        payment_status: 'Paid',
        payment_mode: 'Cash',
        category: 'Pharmacy',
        patient_name: 'Jane Smith',
        patient_id_str: 'PAT002'
      }
    ];
    setBills(mockBills);
  }, []);

  const filteredBills = activeTab === 'all' ? bills : bills.filter(b => b.category.toLowerCase() === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text">Centralized Billing</h2>
          <p className="text-text/40">Manage payments and invoices across all departments</p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">
          <Plus size={20} />
          <span>New Bill</span>
        </button>
      </div>

      <div className="flex gap-2 p-1 bg-bg rounded-xl w-fit overflow-x-auto max-w-full">
        {['all', 'opd', 'ipd', 'pharmacy', 'lab', 'radiology', 'ot', 'icu', 'ambulance', 'package'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={clsx(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
              activeTab === tab ? "bg-white text-primary shadow-sm" : "text-text/40 hover:text-text"
            )}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredBills.map(bill => (
          <div key={bill.id}>
            <Card>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-text">{bill.bill_number}</h4>
                      <Badge variant={bill.payment_status === 'Paid' ? 'success' : 'alert'}>
                        {bill.payment_status}
                      </Badge>
                    </div>
                    <p className="text-sm text-text/40">{bill.patient_name} ({bill.patient_id_str}) • {bill.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-right">
                    <p className="text-xs text-text/40 uppercase tracking-wider font-bold">Amount</p>
                    <p className="text-lg font-bold text-text">₹{bill.net_amount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text/40 uppercase tracking-wider font-bold">Mode</p>
                    <p className="text-sm font-medium text-text">{bill.payment_mode}</p>
                  </div>
                  <button 
                    onClick={() => shareToWhatsApp('919999999999', `Hi ${bill.patient_name}, your bill ${bill.bill_number} for ₹${bill.net_amount} is generated. Status: ${bill.payment_status}.`)}
                    className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-colors"
                    title="Share on WhatsApp"
                  >
                    <MessageSquare size={20} />
                  </button>
                  <button className="p-2 hover:bg-bg rounded-lg text-text/40 transition-colors">
                    <Printer size={20} />
                  </button>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

const StatutoryManagement = ({ hospitalId }: { hospitalId: number }) => {
  const [activeTab, setActiveTab] = useState<'bmw' | 'infection' | 'nabh' | 'fire' | 'drug' | 'controlled'>('bmw');
  const [records, setRecords] = useState<StatutoryRegister[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/statutory?hospitalId=${hospitalId}`);
      const data = await res.json();
      setRecords(data);
    } catch (error) {
      console.error("Error fetching statutory records:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [hospitalId]);

  const handleAddEntry = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const details: any = {};
    formData.forEach((value, key) => {
      if (key !== 'recorded_by' && key !== 'status') {
        details[key] = value;
      }
    });

    const typeMap: Record<string, string> = {
      bmw: 'Biomedical Waste',
      infection: 'Infection Control',
      nabh: 'NABH',
      fire: 'Fire Safety',
      drug: 'Drug License',
      controlled: 'Controlled Substance'
    };

    const data = {
      hospital_id: hospitalId,
      type: typeMap[activeTab],
      recorded_by: formData.get('recorded_by'),
      status: formData.get('status') || 'Compliant',
      details_json: JSON.stringify(details)
    };

    try {
      const res = await fetch('/api/statutory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        setShowModal(false);
        fetchData();
      }
    } catch (error) {
      console.error("Error adding statutory entry:", error);
    }
  };

  const filteredRecords = records.filter(r => {
    if (activeTab === 'bmw') return r.type === 'Biomedical Waste';
    if (activeTab === 'infection') return r.type === 'Infection Control';
    if (activeTab === 'nabh') return r.type === 'NABH';
    if (activeTab === 'fire') return r.type === 'Fire Safety';
    if (activeTab === 'drug') return r.type === 'Drug License';
    if (activeTab === 'controlled') return r.type === 'Controlled Substance';
    return false;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text">Statutory Compliance</h2>
          <p className="text-text/40">Registers, audits, and compliance tracking</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={20} />
          <span>New Entry</span>
        </button>
      </div>

      <div className="flex gap-2 p-1 bg-bg rounded-xl w-fit overflow-x-auto max-w-full">
        {[
          { id: 'bmw', label: 'BMW Register' },
          { id: 'infection', label: 'Infection Audit' },
          { id: 'nabh', label: 'NABH Standards' },
          { id: 'fire', label: 'Fire Safety' },
          { id: 'drug', label: 'Drug License' },
          { id: 'controlled', label: 'Controlled Substances' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={clsx(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
              activeTab === tab.id ? "bg-white text-primary shadow-sm" : "text-text/40 hover:text-text"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRecords.map(record => (
            <div key={record.id}>
              <Card>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                      <ShieldCheck size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-text">{record.type}</h4>
                        <Badge variant={record.status === 'Compliant' ? 'success' : 'alert'}>
                          {record.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-text/40">Recorded by {record.recorded_by} on {record.entry_date}</p>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-bg rounded-lg text-text/40 transition-colors">
                    <FileText size={20} />
                  </button>
                </div>
                <div className="mt-4 p-4 bg-bg rounded-lg">
                  <pre className="text-xs text-text/60 whitespace-pre-wrap">
                    {JSON.stringify(JSON.parse(record.details_json), null, 2)}
                  </pre>
                </div>
              </Card>
            </div>
          ))}
          {filteredRecords.length === 0 && (
            <div className="py-20 text-center bg-white rounded-2xl border-2 border-dashed border-black/5">
              <div className="w-16 h-16 bg-bg rounded-full flex items-center justify-center mx-auto mb-4 text-text/20">
                <ClipboardCheck size={32} />
              </div>
              <h3 className="text-lg font-bold text-text">No Records Found</h3>
              <p className="text-text/40">Start by adding a new compliance entry for this category.</p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-black/5 flex justify-between items-center bg-primary text-white">
              <h3 className="text-xl font-bold">New {activeTab.toUpperCase()} Entry</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddEntry} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-text/40 uppercase">Recorded By</label>
                <input name="recorded_by" required className="w-full p-2 bg-bg rounded-lg mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold text-text/40 uppercase">Status</label>
                <select name="status" className="w-full p-2 bg-bg rounded-lg mt-1">
                  <option value="Compliant">Compliant</option>
                  <option value="Non-Compliant">Non-Compliant</option>
                  <option value="Pending Review">Pending Review</option>
                </select>
              </div>

              {activeTab === 'bmw' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-text/40 uppercase">Yellow (kg)</label>
                    <input type="number" step="0.1" name="yellow" className="w-full p-2 bg-bg rounded-lg mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text/40 uppercase">Red (kg)</label>
                    <input type="number" step="0.1" name="red" className="w-full p-2 bg-bg rounded-lg mt-1" />
                  </div>
                </div>
              )}

              {activeTab === 'fire' && (
                <div>
                  <label className="text-xs font-bold text-text/40 uppercase">Audit Notes</label>
                  <textarea name="audit_notes" className="w-full p-2 bg-bg rounded-lg mt-1 h-20" />
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl font-bold text-text/60 hover:bg-bg transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">Save Entry</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const BirthDeathManagement = ({ hospitalId }: { hospitalId: number }) => {
  const [activeTab, setActiveTab] = useState<'birth' | 'death'>('birth');
  const [birthRecords, setBirthRecords] = useState<BirthRecord[]>([]);
  const [deathRecords, setDeathRecords] = useState<DeathRecord[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [showArchived, setShowArchived] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [birthRes, deathRes, patRes, docRes] = await Promise.all([
        fetch(`/api/birth-records?hospitalId=${hospitalId}`),
        fetch(`/api/death-records?hospitalId=${hospitalId}`),
        fetch(`/api/patients?hospitalId=${hospitalId}`),
        fetch(`/api/doctors?hospitalId=${hospitalId}`)
      ]);
      setBirthRecords(await birthRes.json());
      setDeathRecords(await deathRes.json());
      setPatients(await patRes.json());
      setDoctors(await docRes.json());
    } catch (error) {
      console.error("Error fetching birth/death records:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [hospitalId]);

  const handleAddRecord = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    const endpoint = activeTab === 'birth' ? '/api/birth-records' : '/api/death-records';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, hospital_id: hospitalId })
      });
      if (res.ok) {
        setShowModal(false);
        fetchData();
      }
    } catch (error) {
      console.error("Error adding record:", error);
    }
  };

  const handleApprove = async (id: number, type: 'birth' | 'death') => {
    // In a real app, this would be a PATCH request
    if (type === 'birth') {
      setBirthRecords(prev => prev.map(r => r.id === id ? { ...r, approval_status: 'Approved' } : r));
    } else {
      setDeathRecords(prev => prev.map(r => r.id === id ? { ...r, approval_status: 'Approved' } : r));
    }
  };

  const handleArchive = (id: number, type: 'birth' | 'death') => {
    if (type === 'birth') {
      setBirthRecords(prev => prev.map(r => r.id === id ? { ...r, archived: true } : r));
    } else {
      setDeathRecords(prev => prev.map(r => r.id === id ? { ...r, archived: true } : r));
    }
  };

  const filteredBirths = birthRecords.filter(r => r.archived === showArchived);
  const filteredDeaths = deathRecords.filter(r => r.archived === showArchived);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text">Birth & Death Register</h2>
          <p className="text-text/40">Manage legal records, approvals, and certificates</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowArchived(!showArchived)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
              showArchived ? "bg-primary/10 text-primary" : "bg-bg text-text/60 hover:text-text"
            )}
          >
            <Archive size={20} />
            <span>{showArchived ? 'View Active' : 'View Archived'}</span>
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={20} />
            <span>New {activeTab === 'birth' ? 'Birth' : 'Death'} Entry</span>
          </button>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-bg rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('birth')}
          className={clsx(
            "px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
            activeTab === 'birth' ? "bg-white text-primary shadow-sm" : "text-text/40 hover:text-text"
          )}
        >
          <Baby size={18} />
          <span>Birth Register</span>
        </button>
        <button
          onClick={() => setActiveTab('death')}
          className={clsx(
            "px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
            activeTab === 'death' ? "bg-white text-primary shadow-sm" : "text-text/40 hover:text-text"
          )}
        >
          <Skull size={18} />
          <span>Death Register</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {activeTab === 'birth' ? (
          filteredBirths.map(record => (
            <div key={record.id}>
              <Card>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                      <Baby size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-text">{record.baby_name || `Baby of ${record.mother_name}`}</h4>
                        <Badge variant={record.approval_status === 'Approved' ? 'success' : record.approval_status === 'Pending' ? 'info' : 'alert'}>
                          {record.approval_status}
                        </Badge>
                      </div>
                      <p className="text-sm text-text/40">Born on {record.date_of_birth} at {record.time_of_birth} • {record.gender}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {record.approval_status === 'Pending' && (
                      <button 
                        onClick={() => handleApprove(record.id, 'birth')}
                        className="px-3 py-1.5 bg-success/10 text-success rounded-lg text-xs font-bold hover:bg-success/20 transition-colors"
                      >
                        Approve
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        setSelectedRecord(record);
                        setShowCertificate(true);
                      }}
                      className="p-2 hover:bg-bg rounded-lg text-text/40 transition-colors"
                      title="View Certificate"
                    >
                      <FileText size={20} />
                    </button>
                    {!record.archived && (
                      <button 
                        onClick={() => handleArchive(record.id, 'birth')}
                        className="p-2 hover:bg-bg rounded-lg text-text/40 transition-colors"
                        title="Archive"
                      >
                        <Archive size={20} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-bg rounded-lg">
                  <div>
                    <p className="text-[10px] text-text/40 uppercase font-bold">Mother</p>
                    <p className="text-sm font-medium">{record.mother_name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text/40 uppercase font-bold">Father</p>
                    <p className="text-sm font-medium">{record.father_name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text/40 uppercase font-bold">Weight</p>
                    <p className="text-sm font-medium">{record.weight_kg} kg</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text/40 uppercase font-bold">Doctor</p>
                    <p className="text-sm font-medium">{record.doctor_name}</p>
                  </div>
                </div>
              </Card>
            </div>
          ))
        ) : (
          filteredDeaths.map(record => (
            <div key={record.id}>
              <Card>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-error/10 rounded-xl flex items-center justify-center text-error">
                      <Skull size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-text">{record.patient_name}</h4>
                        <Badge variant={record.approval_status === 'Approved' ? 'success' : record.approval_status === 'Pending' ? 'info' : 'alert'}>
                          {record.approval_status}
                        </Badge>
                      </div>
                      <p className="text-sm text-text/40">Expired on {record.date_of_death} at {record.time_of_death} • Age: {record.age}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {record.approval_status === 'Pending' && (
                      <button 
                        onClick={() => handleApprove(record.id, 'death')}
                        className="px-3 py-1.5 bg-success/10 text-success rounded-lg text-xs font-bold hover:bg-success/20 transition-colors"
                      >
                        Approve
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        setSelectedRecord(record);
                        setShowCertificate(true);
                      }}
                      className="p-2 hover:bg-bg rounded-lg text-text/40 transition-colors"
                      title="View Certificate"
                    >
                      <FileText size={20} />
                    </button>
                    {!record.archived && (
                      <button 
                        onClick={() => handleArchive(record.id, 'death')}
                        className="p-2 hover:bg-bg rounded-lg text-text/40 transition-colors"
                        title="Archive"
                      >
                        <Archive size={20} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-4 p-4 bg-bg rounded-lg">
                  <p className="text-[10px] text-text/40 uppercase font-bold">Cause of Death</p>
                  <p className="text-sm font-medium">{record.cause_of_death}</p>
                </div>
              </Card>
            </div>
          ))
        )}

        {(activeTab === 'birth' ? filteredBirths : filteredDeaths).length === 0 && (
          <div className="py-20 text-center bg-white rounded-2xl border-2 border-dashed border-black/5">
            <div className="w-16 h-16 bg-bg rounded-full flex items-center justify-center mx-auto mb-4 text-text/20">
              {activeTab === 'birth' ? <Baby size={32} /> : <Skull size={32} />}
            </div>
            <h3 className="text-lg font-bold text-text">No Records Found</h3>
            <p className="text-text/40">No {showArchived ? 'archived' : 'active'} {activeTab} records found.</p>
          </div>
        )}
      </div>

      {showCertificate && selectedRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-black/5 flex justify-between items-center bg-primary text-white">
              <h3 className="text-xl font-bold">Certificate Preview</h3>
              <button onClick={() => setShowCertificate(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-12 bg-white">
              <div className="border-8 border-double border-primary/20 p-8 text-center space-y-6">
                <div className="space-y-2">
                  <h2 className="text-3xl font-serif font-bold text-primary uppercase tracking-widest">
                    {activeTab === 'birth' ? 'Birth Certificate' : 'Death Certificate'}
                  </h2>
                  <p className="text-xs text-text/40 uppercase tracking-widest font-bold">Official Hospital Record</p>
                </div>

                <div className="h-px bg-primary/10 w-full" />

                <div className="space-y-4 text-left">
                  {activeTab === 'birth' ? (
                    <>
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <p className="text-[10px] text-text/40 uppercase font-bold">Name of Child</p>
                          <p className="text-lg font-bold">{(selectedRecord as BirthRecord).baby_name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-text/40 uppercase font-bold">Gender</p>
                          <p className="text-lg font-bold">{(selectedRecord as BirthRecord).gender}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <p className="text-[10px] text-text/40 uppercase font-bold">Date of Birth</p>
                          <p className="text-lg font-bold">{(selectedRecord as BirthRecord).date_of_birth}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-text/40 uppercase font-bold">Time of Birth</p>
                          <p className="text-lg font-bold">{(selectedRecord as BirthRecord).time_of_birth}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] text-text/40 uppercase font-bold">Mother's Name</p>
                        <p className="text-lg font-bold">{(selectedRecord as BirthRecord).mother_name}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-[10px] text-text/40 uppercase font-bold">Name of Deceased</p>
                        <p className="text-lg font-bold">{(selectedRecord as DeathRecord).patient_name}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <p className="text-[10px] text-text/40 uppercase font-bold">Date of Death</p>
                          <p className="text-lg font-bold">{(selectedRecord as DeathRecord).date_of_death}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-text/40 uppercase font-bold">Cause of Death</p>
                          <p className="text-lg font-bold">{(selectedRecord as DeathRecord).cause_of_death}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-12 flex justify-between items-end pt-12">
                  <div className="text-center">
                    <div className="w-32 h-px bg-text/20 mb-2" />
                    <p className="text-[10px] text-text/40 uppercase font-bold">Registrar Signature</p>
                  </div>
                  <div className="text-center">
                    <div className="w-32 h-px bg-text/20 mb-2" />
                    <p className="text-[10px] text-text/40 uppercase font-bold">Medical Officer</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 bg-bg border-t border-black/5 flex justify-end gap-3">
              <button onClick={() => setShowCertificate(false)} className="px-6 py-2 rounded-xl font-bold text-text/60 hover:text-text transition-colors">
                Close
              </button>
              <button className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-primary/90 transition-colors">
                <Printer size={20} />
                <span>Print Certificate</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-black/5 flex justify-between items-center bg-primary text-white">
              <h3 className="text-xl font-bold">New {activeTab === 'birth' ? 'Birth' : 'Death'} Record</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddRecord} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {activeTab === 'birth' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Baby Name</label>
                      <input name="baby_name" required className="w-full p-2 bg-bg rounded-lg mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Gender</label>
                      <select name="gender" required className="w-full p-2 bg-bg rounded-lg mt-1">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Date of Birth</label>
                      <input type="date" name="date_of_birth" required className="w-full p-2 bg-bg rounded-lg mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Time of Birth</label>
                      <input type="time" name="time_of_birth" required className="w-full p-2 bg-bg rounded-lg mt-1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Weight (kg)</label>
                      <input type="number" step="0.01" name="weight_kg" required className="w-full p-2 bg-bg rounded-lg mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Doctor</label>
                      <select name="doctor_id" required className="w-full p-2 bg-bg rounded-lg mt-1">
                        {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Mother's Name</label>
                      <input name="mother_name" required className="w-full p-2 bg-bg rounded-lg mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Father's Name</label>
                      <input name="father_name" required className="w-full p-2 bg-bg rounded-lg mt-1" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text/40 uppercase">Address</label>
                    <textarea name="address" required className="w-full p-2 bg-bg rounded-lg mt-1 h-20" />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Patient</label>
                      <select name="patient_id" required className="w-full p-2 bg-bg rounded-lg mt-1">
                        {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.patient_id_str})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Doctor</label>
                      <select name="doctor_id" required className="w-full p-2 bg-bg rounded-lg mt-1">
                        {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Date of Death</label>
                      <input type="date" name="date_of_death" required className="w-full p-2 bg-bg rounded-lg mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Time of Death</label>
                      <input type="time" name="time_of_death" required className="w-full p-2 bg-bg rounded-lg mt-1" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text/40 uppercase">Cause of Death</label>
                    <textarea name="cause_of_death" required className="w-full p-2 bg-bg rounded-lg mt-1 h-20" />
                  </div>
                </>
              )}

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl font-bold text-text/60 hover:bg-bg transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">Save Record</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const DischargeManagement = ({ hospitalId }: { hospitalId: number }) => {
  const [admissions, setAdmissions] = useState<IPDAdmission[]>([]);
  const [discharges, setDischarges] = useState<DischargeRecord[]>([]);
  const [selectedAdmission, setSelectedAdmission] = useState<IPDAdmission | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summary, setSummary] = useState('');
  const [medications, setMedications] = useState<{ medicine_name: string; dosage: string; frequency: string; duration: string; instructions: string; }[]>([]);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [billingStatus, setBillingStatus] = useState<'Cleared' | 'Pending'>('Pending');
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [admissionsRes, dischargesRes] = await Promise.all([
        fetch(`/api/ipd/admissions?hospitalId=${hospitalId}`),
        fetch(`/api/discharges?hospital_id=${hospitalId}`)
      ]);
      
      const admissionsData = await admissionsRes.json();
      const dischargesData = await dischargesRes.json();
      
      setAdmissions(admissionsData.filter((a: IPDAdmission) => a.status === 'Admitted'));
      setDischarges(dischargesData);
    } catch (error) {
      console.error('Error fetching discharge data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [hospitalId]);

  const handleFinalizeDischarge = async () => {
    if (!selectedAdmission) return;
    setLoading(true);
    try {
      const response = await fetch('/api/discharges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospital_id: hospitalId,
          admission_id: selectedAdmission.id,
          patient_id: selectedAdmission.patient_id,
          doctor_id: selectedAdmission.doctor_id,
          discharge_summary: summary,
          medications: medications,
          billing_status: billingStatus,
          follow_up_date: followUpDate,
          follow_up_notes: followUpNotes
        })
      });

      if (response.ok) {
        await fetchData();
        setShowSummaryModal(false);
        setSelectedAdmission(null);
        setSummary('');
        setMedications([]);
        setFollowUpDate('');
        setFollowUpNotes('');
      }
    } catch (error) {
      console.error('Error finalizing discharge:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMedication = () => {
    setMedications([...medications, { medicine_name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text">Discharge Management</h2>
          <p className="text-text/40">Finalize patient stay, summaries, and billing</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Pending Discharges">
          <div className="space-y-4">
            {admissions.map(admission => (
              <div key={admission.id} className="p-4 border border-black/5 rounded-xl hover:bg-bg transition-colors group">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                      <Users size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-text">{admission.patient_name}</h4>
                      <p className="text-xs text-text/40">{admission.patient_id_str} • {admission.ward_name} - {admission.bed_number}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedAdmission(admission);
                      setShowSummaryModal(true);
                    }}
                    className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors"
                  >
                    Process Discharge
                  </button>
                </div>
              </div>
            ))}
            {admissions.length === 0 && (
              <p className="text-center py-8 text-text/40 italic">No patients pending discharge</p>
            )}
          </div>
        </Card>

        <Card title="Recent Discharges">
          <div className="space-y-4">
            {discharges.map(discharge => (
              <div key={discharge.id} className="p-4 border border-black/5 rounded-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-text">{discharge.patient_name}</h4>
                      <Badge variant={discharge.billing_status === 'Cleared' ? 'success' : 'alert'}>
                        {discharge.billing_status}
                      </Badge>
                    </div>
                    <p className="text-xs text-text/40">Discharged on {discharge.discharge_date} by {discharge.doctor_name}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-bg rounded-lg text-text/40 transition-colors" title="View Summary">
                      <FileText size={18} />
                    </button>
                    <button className="p-2 hover:bg-bg rounded-lg text-text/40 transition-colors" title="Send WhatsApp">
                      <Share2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {showSummaryModal && selectedAdmission && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-black/5 flex justify-between items-center bg-primary text-white sticky top-0 z-10">
              <div>
                <h3 className="text-xl font-bold">Discharge Summary</h3>
                <p className="text-white/60 text-sm">{selectedAdmission.patient_name} ({selectedAdmission.patient_id_str})</p>
              </div>
              <button onClick={() => setShowSummaryModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-bold text-text flex items-center gap-2">
                    <ClipboardList size={18} className="text-primary" />
                    Final Summary
                  </h4>
                  <textarea 
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Enter clinical summary, diagnosis, and treatment provided..."
                    className="w-full h-32 p-3 bg-bg rounded-xl border-none focus:ring-2 focus:ring-primary/20 text-sm"
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-text flex items-center gap-2">
                    <Calendar size={18} className="text-primary" />
                    Follow-up & Billing
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-text/40 uppercase font-bold">Follow-up Date</label>
                      <input 
                        type="date" 
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        className="w-full p-2 bg-bg rounded-lg border-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-text/40 uppercase font-bold">Billing Status</label>
                      <select 
                        value={billingStatus}
                        onChange={(e) => setBillingStatus(e.target.value as any)}
                        className="w-full p-2 bg-bg rounded-lg border-none text-sm"
                      >
                        <option value="Pending">Pending Clearance</option>
                        <option value="Cleared">Cleared / Paid</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-text flex items-center gap-2">
                    <Pill size={18} className="text-primary" />
                    Discharge Medications
                  </h4>
                  <button 
                    onClick={addMedication}
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    + Add Medicine
                  </button>
                </div>
                <div className="space-y-3">
                  {medications.map((med, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-2 p-3 bg-bg rounded-xl">
                      <input 
                        placeholder="Medicine" 
                        value={med.medicine_name}
                        onChange={(e) => {
                          const newMeds = [...medications];
                          newMeds[idx].medicine_name = e.target.value;
                          setMedications(newMeds);
                        }}
                        className="p-2 bg-white rounded-lg border-none text-sm"
                      />
                      <input 
                        placeholder="Dosage" 
                        value={med.dosage}
                        onChange={(e) => {
                          const newMeds = [...medications];
                          newMeds[idx].dosage = e.target.value;
                          setMedications(newMeds);
                        }}
                        className="p-2 bg-white rounded-lg border-none text-sm"
                      />
                      <input 
                        placeholder="Frequency" 
                        value={med.frequency}
                        onChange={(e) => {
                          const newMeds = [...medications];
                          newMeds[idx].frequency = e.target.value;
                          setMedications(newMeds);
                        }}
                        className="p-2 bg-white rounded-lg border-none text-sm"
                      />
                      <input 
                        placeholder="Duration" 
                        value={med.duration}
                        onChange={(e) => {
                          const newMeds = [...medications];
                          newMeds[idx].duration = e.target.value;
                          setMedications(newMeds);
                        }}
                        className="p-2 bg-white rounded-lg border-none text-sm"
                      />
                      <button 
                        onClick={() => setMedications(medications.filter((_, i) => i !== idx))}
                        className="text-error p-2 hover:bg-error/10 rounded-lg transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 bg-bg border-t border-black/5 flex justify-end gap-3 sticky bottom-0">
              <button 
                onClick={() => setShowSummaryModal(false)}
                className="px-6 py-2 rounded-xl font-bold text-text/60 hover:text-text transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleFinalizeDischarge}
                disabled={loading}
                className="flex items-center gap-2 bg-primary text-white px-8 py-2 rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 size={20} />
                )}
                <span>{loading ? 'Processing...' : 'Finalize & Discharge'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const SafetyFacilityManagement = ({ hospitalId }: { hospitalId: number }) => {
  const [activeSubTab, setActiveSubTab] = useState<'fire' | 'maintenance' | 'incidents' | 'cctv'>('fire');
  const [fireExtinguishers, setFireExtinguishers] = useState<FireExtinguisher[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<FacilityMaintenance[]>([]);
  const [incidents, setIncidents] = useState<SafetyIncident[]>([]);
  const [cctvLogs, setCctvLogs] = useState<CCTVLog[]>([]);
  const [showModal, setShowModal] = useState(false);

  const fetchData = async () => {
    try {
      const [fireRes, maintRes, incRes, cctvRes] = await Promise.all([
        fetch(`/api/safety/fire-extinguishers?hospitalId=${hospitalId}`),
        fetch(`/api/safety/maintenance?hospitalId=${hospitalId}`),
        fetch(`/api/safety/incidents?hospitalId=${hospitalId}`),
        fetch(`/api/safety/cctv-logs?hospitalId=${hospitalId}`)
      ]);
      
      if (fireRes.ok) setFireExtinguishers(await fireRes.json());
      if (maintRes.ok) setMaintenanceRecords(await maintRes.json());
      if (incRes.ok) setIncidents(await incRes.json());
      if (cctvRes.ok) setCctvLogs(await cctvRes.json());
    } catch (error) {
      console.error("Error fetching safety data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [hospitalId]);

  const handleAddRecord = async (data: any) => {
    let endpoint = '';
    if (activeSubTab === 'fire') endpoint = '/api/safety/fire-extinguishers';
    else if (activeSubTab === 'maintenance') endpoint = '/api/safety/maintenance';
    else if (activeSubTab === 'incidents') endpoint = '/api/safety/incidents';
    else if (activeSubTab === 'cctv') endpoint = '/api/safety/cctv-logs';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, hospital_id: hospitalId })
      });
      if (res.ok) {
        setShowModal(false);
        fetchData();
      }
    } catch (error) {
      console.error("Error adding record:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text">Safety & Facility Management</h2>
          <p className="text-text/40">Monitor hospital safety, maintenance, and security</p>
        </div>
        <div className="flex bg-bg p-1 rounded-xl">
          <button 
            onClick={() => setActiveSubTab('fire')}
            className={clsx("px-4 py-2 rounded-lg text-sm font-bold transition-all", activeSubTab === 'fire' ? "bg-white text-primary shadow-sm" : "text-text/40 hover:text-text")}
          >
            Fire Safety
          </button>
          <button 
            onClick={() => setActiveSubTab('maintenance')}
            className={clsx("px-4 py-2 rounded-lg text-sm font-bold transition-all", activeSubTab === 'maintenance' ? "bg-white text-primary shadow-sm" : "text-text/40 hover:text-text")}
          >
            Maintenance
          </button>
          <button 
            onClick={() => setActiveSubTab('incidents')}
            className={clsx("px-4 py-2 rounded-lg text-sm font-bold transition-all", activeSubTab === 'incidents' ? "bg-white text-primary shadow-sm" : "text-text/40 hover:text-text")}
          >
            Incidents
          </button>
          <button 
            onClick={() => setActiveSubTab('cctv')}
            className={clsx("px-4 py-2 rounded-lg text-sm font-bold transition-all", activeSubTab === 'cctv' ? "bg-white text-primary shadow-sm" : "text-text/40 hover:text-text")}
          >
            CCTV Logs
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'fire' && (
          <motion.div 
            key="fire"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 gap-6"
          >
            <Card title="Fire Extinguishers & AMC" action={<button onClick={() => setShowModal(true)} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Plus size={18} /> Add Extinguisher</button>}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-black/5">
                      <th className="pb-4 font-bold text-text/40 text-xs uppercase tracking-widest">Location</th>
                      <th className="pb-4 font-bold text-text/40 text-xs uppercase tracking-widest">Type</th>
                      <th className="pb-4 font-bold text-text/40 text-xs uppercase tracking-widest">Last Service</th>
                      <th className="pb-4 font-bold text-text/40 text-xs uppercase tracking-widest">Expiry</th>
                      <th className="pb-4 font-bold text-text/40 text-xs uppercase tracking-widest">AMC Provider</th>
                      <th className="pb-4 font-bold text-text/40 text-xs uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {fireExtinguishers.map(item => (
                      <tr key={item.id} className="group hover:bg-bg/50 transition-colors">
                        <td className="py-4 font-medium text-text">{item.location}</td>
                        <td className="py-4 text-text/60">{item.type} ({item.capacity})</td>
                        <td className="py-4 text-text/60">{item.last_service_date}</td>
                        <td className="py-4 text-text/60">{item.expiry_date}</td>
                        <td className="py-4 text-text/60">{item.amc_provider}</td>
                        <td className="py-4">
                          <Badge variant={item.status === 'Functional' ? 'success' : 'alert'}>
                            {item.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {fireExtinguishers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-text/40 italic">No fire safety records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {activeSubTab === 'maintenance' && (
          <motion.div 
            key="maintenance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 gap-6"
          >
            <Card title="Facility Maintenance" action={<button onClick={() => setShowModal(true)} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Plus size={18} /> Schedule Maintenance</button>}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-black/5">
                      <th className="pb-4 font-bold text-text/40 text-xs uppercase tracking-widest">Asset</th>
                      <th className="pb-4 font-bold text-text/40 text-xs uppercase tracking-widest">Type</th>
                      <th className="pb-4 font-bold text-text/40 text-xs uppercase tracking-widest">Last Maint.</th>
                      <th className="pb-4 font-bold text-text/40 text-xs uppercase tracking-widest">Next Maint.</th>
                      <th className="pb-4 font-bold text-text/40 text-xs uppercase tracking-widest">Performed By</th>
                      <th className="pb-4 font-bold text-text/40 text-xs uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {maintenanceRecords.map(item => (
                      <tr key={item.id} className="group hover:bg-bg/50 transition-colors">
                        <td className="py-4 font-medium text-text">{item.asset_name}</td>
                        <td className="py-4 text-text/60">{item.asset_type}</td>
                        <td className="py-4 text-text/60">{item.last_maintenance_date}</td>
                        <td className="py-4 text-text/60">{item.next_maintenance_date}</td>
                        <td className="py-4 text-text/60">{item.performed_by}</td>
                        <td className="py-4">
                          <Badge variant={item.status === 'Operational' ? 'success' : 'alert'}>
                            {item.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {maintenanceRecords.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-text/40 italic">No maintenance records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {activeSubTab === 'incidents' && (
          <motion.div 
            key="incidents"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 gap-6"
          >
            <Card title="Incident / Accident Reporting" action={<button onClick={() => setShowModal(true)} className="bg-error text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><ShieldAlert size={18} /> Report Incident</button>}>
              <div className="space-y-4">
                {incidents.map(incident => (
                  <div key={incident.id} className="p-4 border border-black/5 rounded-xl hover:bg-bg transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className={clsx("w-10 h-10 rounded-lg flex items-center justify-center", 
                          incident.severity === 'Critical' ? "bg-error/10 text-error" : 
                          incident.severity === 'High' ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary")}>
                          <AlertTriangle size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-text">{incident.incident_type} at {incident.location}</h4>
                          <p className="text-xs text-text/40">{incident.incident_date} {incident.incident_time} • Reported by {incident.reported_by}</p>
                        </div>
                      </div>
                      <Badge variant={incident.status === 'Resolved' ? 'success' : 'alert'}>{incident.status}</Badge>
                    </div>
                    <p className="text-sm text-text/60 mb-3">{incident.description}</p>
                    <div className="bg-bg/50 p-3 rounded-lg text-xs">
                      <span className="font-bold text-text/40 uppercase tracking-widest mr-2">Action Taken:</span>
                      <span className="text-text/60">{incident.action_taken}</span>
                    </div>
                  </div>
                ))}
                {incidents.length === 0 && (
                  <div className="py-10 text-center text-text/40 italic">No incidents reported.</div>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {activeSubTab === 'cctv' && (
          <motion.div 
            key="cctv"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 gap-6"
          >
            <Card title="CCTV Monitoring Logs" action={<button onClick={() => setShowModal(true)} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Plus size={18} /> New Log Entry</button>}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-black/5">
                      <th className="pb-4 font-bold text-text/40 text-xs uppercase tracking-widest">Date</th>
                      <th className="pb-4 font-bold text-text/40 text-xs uppercase tracking-widest">Camera Location</th>
                      <th className="pb-4 font-bold text-text/40 text-xs uppercase tracking-widest">Checked By</th>
                      <th className="pb-4 font-bold text-text/40 text-xs uppercase tracking-widest">Status</th>
                      <th className="pb-4 font-bold text-text/40 text-xs uppercase tracking-widest">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {cctvLogs.map(log => (
                      <tr key={log.id} className="group hover:bg-bg/50 transition-colors">
                        <td className="py-4 text-text/60">{log.log_date}</td>
                        <td className="py-4 font-medium text-text">{log.camera_location}</td>
                        <td className="py-4 text-text/60">{log.checked_by}</td>
                        <td className="py-4">
                          <Badge variant={log.status === 'Normal' ? 'success' : 'alert'}>
                            {log.status}
                          </Badge>
                        </td>
                        <td className="py-4 text-text/60 italic">{log.notes}</td>
                      </tr>
                    ))}
                    {cctvLogs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-text/40 italic">No CCTV logs found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-black/5 flex justify-between items-center bg-primary text-white">
              <h3 className="text-xl font-bold">
                {activeSubTab === 'fire' ? 'Add Fire Extinguisher' : 
                 activeSubTab === 'maintenance' ? 'Schedule Maintenance' : 
                 activeSubTab === 'incidents' ? 'Report Incident' : 'New CCTV Log'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = Object.fromEntries(formData.entries());
              handleAddRecord(data);
            }} className="p-6 space-y-4">
              {activeSubTab === 'fire' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Location</label>
                      <input name="location" required className="w-full p-2 bg-bg rounded-lg mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Type</label>
                      <input name="type" required className="w-full p-2 bg-bg rounded-lg mt-1" placeholder="CO2, Dry Powder, etc." />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Capacity</label>
                      <input name="capacity" required className="w-full p-2 bg-bg rounded-lg mt-1" placeholder="5kg, 2kg, etc." />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">AMC Provider</label>
                      <input name="amc_provider" className="w-full p-2 bg-bg rounded-lg mt-1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Last Service Date</label>
                      <input type="date" name="last_service_date" required className="w-full p-2 bg-bg rounded-lg mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Expiry Date</label>
                      <input type="date" name="expiry_date" required className="w-full p-2 bg-bg rounded-lg mt-1" />
                    </div>
                  </div>
                </>
              )}

              {activeSubTab === 'maintenance' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Asset Name</label>
                      <input name="asset_name" required className="w-full p-2 bg-bg rounded-lg mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Asset Type</label>
                      <select name="asset_type" required className="w-full p-2 bg-bg rounded-lg mt-1">
                        <option value="Lift">Lift</option>
                        <option value="Electrical">Electrical</option>
                        <option value="Generator">Generator</option>
                        <option value="Plumbing">Plumbing</option>
                        <option value="HVAC">HVAC</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Last Maint. Date</label>
                      <input type="date" name="last_maintenance_date" className="w-full p-2 bg-bg rounded-lg mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Next Maint. Date</label>
                      <input type="date" name="next_maintenance_date" required className="w-full p-2 bg-bg rounded-lg mt-1" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text/40 uppercase">Performed By</label>
                    <input name="performed_by" required className="w-full p-2 bg-bg rounded-lg mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text/40 uppercase">Notes</label>
                    <textarea name="notes" className="w-full p-2 bg-bg rounded-lg mt-1 h-20" />
                  </div>
                </>
              )}

              {activeSubTab === 'incidents' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Incident Type</label>
                      <input name="incident_type" required className="w-full p-2 bg-bg rounded-lg mt-1" placeholder="Accident, Theft, etc." />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Severity</label>
                      <select name="severity" required className="w-full p-2 bg-bg rounded-lg mt-1">
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Date</label>
                      <input type="date" name="incident_date" required className="w-full p-2 bg-bg rounded-lg mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Time</label>
                      <input type="time" name="incident_time" required className="w-full p-2 bg-bg rounded-lg mt-1" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text/40 uppercase">Location</label>
                    <input name="location" required className="w-full p-2 bg-bg rounded-lg mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text/40 uppercase">Description</label>
                    <textarea name="description" required className="w-full p-2 bg-bg rounded-lg mt-1 h-20" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text/40 uppercase">Action Taken</label>
                    <textarea name="action_taken" className="w-full p-2 bg-bg rounded-lg mt-1 h-20" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text/40 uppercase">Reported By</label>
                    <input name="reported_by" required className="w-full p-2 bg-bg rounded-lg mt-1" />
                  </div>
                </>
              )}

              {activeSubTab === 'cctv' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-text/40 uppercase">Camera Location</label>
                    <input name="camera_location" required className="w-full p-2 bg-bg rounded-lg mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Log Date</label>
                      <input type="date" name="log_date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-2 bg-bg rounded-lg mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Status</label>
                      <select name="status" required className="w-full p-2 bg-bg rounded-lg mt-1">
                        <option value="Normal">Normal</option>
                        <option value="Issue Detected">Issue Detected</option>
                        <option value="Maintenance Required">Maintenance Required</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text/40 uppercase">Checked By</label>
                    <input name="checked_by" required className="w-full p-2 bg-bg rounded-lg mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text/40 uppercase">Notes</label>
                    <textarea name="notes" className="w-full p-2 bg-bg rounded-lg mt-1 h-20" />
                  </div>
                </>
              )}

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl font-bold text-text/60 hover:bg-bg transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">Save Record</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const PrescriptionModule = ({ hospitalId, patientId, visitId, admissionId, onComplete }: { 
  hospitalId: number, 
  patientId?: number, 
  visitId?: number, 
  admissionId?: number,
  onComplete?: () => void 
}) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | undefined>(patientId);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number>(1);
  const [templates, setTemplates] = useState<PrescriptionTemplate[]>([]);
  const [history, setHistory] = useState<Prescription[]>([]);
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Partial<PrescriptionItem>[]>([]);
  const [loading, setLoading] = useState(false);
  const [signature, setSignature] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [vitals, setVitals] = useState<any>(null);

  useEffect(() => {
    if (visitId) {
      fetch(`/api/opd/visits/${visitId}`)
        .then(res => res.json())
        .then(data => {
          setVitals({
            temp: data.vitals_temp,
            bp: data.vitals_bp,
            pulse: data.vitals_pulse,
            spo2: data.vitals_spo2,
            weight: data.vitals_weight,
            height: data.vitals_height,
            bmi: data.vitals_bmi,
            rr: data.vitals_rr
          });
          if (data.diagnosis) setDiagnosis(data.diagnosis);
        });
    }
  }, [visitId]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const [pRes, dRes, tRes] = await Promise.all([
        fetch(`/api/patients?hospitalId=${hospitalId}`),
        fetch(`/api/doctors?hospitalId=${hospitalId}`),
        fetch(`/api/prescriptions/templates?hospitalId=${hospitalId}`)
      ]);
      setPatients(await pRes.json());
      setDoctors(await dRes.json());
      setTemplates(await tRes.json());
    };
    fetchInitialData();
  }, [hospitalId]);

  useEffect(() => {
    if (selectedPatientId) {
      fetch(`/api/prescriptions/history/${selectedPatientId}`)
        .then(res => res.json())
        .then(setHistory);
    }
  }, [selectedPatientId]);

  useEffect(() => {
    // Automated: System suggests template based on diagnosis
    if (diagnosis && diagnosis.length > 3 && items.length === 0) {
      const match = templates.find(t => 
        t.diagnosis.toLowerCase().includes(diagnosis.toLowerCase()) ||
        diagnosis.toLowerCase().includes(t.diagnosis.toLowerCase())
      );
      if (match) {
        setItems(match.items.map(item => ({ ...item })));
      }
    }
  }, [diagnosis, templates]);

  const addItem = () => {
    setItems([...items, { medicine_name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof PrescriptionItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const applyTemplate = (template: PrescriptionTemplate) => {
    setDiagnosis(template.diagnosis);
    setItems(template.items.map(item => ({ ...item })));
  };

  const handleSave = async () => {
    if (!selectedPatientId || items.length === 0) return;
    setLoading(true);
    try {
      // 1. Save Prescription
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospital_id: hospitalId,
          patient_id: selectedPatientId,
          doctor_id: selectedDoctorId,
          visit_id: visitId,
          admission_id: admissionId,
          diagnosis,
          notes,
          items,
          doctor_signature: signature || doctors.find(d => d.id === selectedDoctorId)?.name
        })
      });

      // 2. Update Visit Vitals if visitId exists
      if (visitId && vitals) {
        await fetch(`/api/opd/visits/${visitId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vitals_temp: vitals.temp,
            vitals_bp: vitals.bp,
            vitals_pulse: vitals.pulse,
            vitals_spo2: vitals.spo2,
            vitals_weight: vitals.weight,
            vitals_height: vitals.height,
            vitals_rr: vitals.rr,
            diagnosis: diagnosis // Sync diagnosis too
          })
        });
      }

      if (res.ok) {
        const savedPrescription = {
          patient_id: selectedPatientId,
          doctor_id: selectedDoctorId,
          diagnosis,
          notes,
          items,
          doctor_signature: signature || doctors.find(d => d.id === selectedDoctorId)?.name,
          created_at: new Date().toISOString()
        };
        generatePDF(savedPrescription);
        alert('Prescription saved successfully!');
        if (onComplete) onComplete();
      }
    } catch (error) {
      console.error("Error saving prescription:", error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = (prescription: any) => {
    try {
      const doc = new jsPDF();
      const patient = patients.find(p => p.id === prescription.patient_id);
      const doctor = doctors.find(d => d.id === prescription.doctor_id);

      doc.setFontSize(22);
      doc.setTextColor(79, 70, 229);
      doc.text("PRESCRIPTION", 105, 20, { align: "center" });
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Date: ${new Date(prescription.created_at || Date.now()).toLocaleDateString()}`, 150, 30);
      
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.setFont("helvetica", "bold");
      doc.text(`Patient: ${patient?.name || 'N/A'}`, 20, 40);
      doc.setFont("helvetica", "normal");
      doc.text(`Age/Gender: ${patient?.age || 'N/A'} / ${patient?.gender || 'N/A'}`, 20, 45);
      
      if (vitals) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Vitals:", 20, 52);
        doc.setFont("helvetica", "normal");
        const vitalsStr = `Temp: ${vitals.temp || '--'} | BP: ${vitals.bp || '--'} | Pulse: ${vitals.pulse || '--'} | SpO2: ${vitals.spo2 || '--'} | Wt: ${vitals.weight || '--'}`;
        doc.text(vitalsStr, 35, 52);
      }

      doc.text(`Diagnosis: ${prescription.diagnosis || 'N/A'}`, 20, 60);

      const tableData = prescription.items.map((item: any) => [
        item.medicine_name,
        item.dosage,
        item.frequency,
        item.duration,
        item.instructions
      ]);

      autoTable(doc, {
        startY: 70,
        head: [['Medicine', 'Dosage', 'Frequency', 'Duration', 'Instructions']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229], textColor: 255 },
        styles: { fontSize: 9 }
      });

      const finalY = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(10);
      doc.text("Doctor's Signature:", 140, finalY);
      doc.setFont("courier", "italic");
      doc.text(prescription.doctor_signature || doctor?.name || "Dr. Signature", 140, finalY + 10);

      doc.save(`Prescription_${patient?.name}_${Date.now()}.pdf`);
    } catch (error) {
      console.error("Error generating Prescription PDF:", error);
      alert("Failed to generate prescription PDF.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text">Doctor Prescription Module</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-black/10 rounded-lg text-sm font-bold hover:bg-bg transition-colors"
          >
            <History size={16} />
            {showHistory ? 'Hide History' : 'View History'}
          </button>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {loading ? 'Saving...' : 'Save & Print'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Prescription Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text/40 uppercase">Patient</label>
                <select 
                  className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm"
                  value={selectedPatientId}
                  onChange={e => setSelectedPatientId(Number(e.target.value))}
                  disabled={!!patientId}
                >
                  <option value="">Select Patient</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.patient_id_str})</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text/40 uppercase">Diagnosis</label>
                <input 
                  className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm"
                  value={diagnosis}
                  onChange={e => setDiagnosis(e.target.value)}
                  placeholder="Enter diagnosis"
                />
              </div>
            </div>

            {vitals && (
              <div className="mb-6 p-4 bg-primary/5 rounded-xl border border-primary/10">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                    <Activity size={14} /> Patient Vitals
                  </h4>
                  <span className="text-[10px] text-text/40 italic">Recorded by Nurse/Doctor</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text/40 uppercase">Temp (°F)</label>
                    <input 
                      className="w-full px-2 py-1 rounded border border-black/5 text-xs font-bold" 
                      value={vitals.temp || ''} 
                      onChange={e => setVitals({...vitals, temp: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text/40 uppercase">BP (mmHg)</label>
                    <input 
                      className="w-full px-2 py-1 rounded border border-black/5 text-xs font-bold" 
                      value={vitals.bp || ''} 
                      onChange={e => setVitals({...vitals, bp: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text/40 uppercase">Pulse (bpm)</label>
                    <input 
                      className="w-full px-2 py-1 rounded border border-black/5 text-xs font-bold" 
                      value={vitals.pulse || ''} 
                      onChange={e => setVitals({...vitals, pulse: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text/40 uppercase">SpO2 (%)</label>
                    <input 
                      className="w-full px-2 py-1 rounded border border-black/5 text-xs font-bold" 
                      value={vitals.spo2 || ''} 
                      onChange={e => setVitals({...vitals, spo2: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text/40 uppercase">Weight (kg)</label>
                    <input 
                      className="w-full px-2 py-1 rounded border border-black/5 text-xs font-bold" 
                      value={vitals.weight || ''} 
                      onChange={e => setVitals({...vitals, weight: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text/40 uppercase">Height (cm)</label>
                    <input 
                      className="w-full px-2 py-1 rounded border border-black/5 text-xs font-bold" 
                      value={vitals.height || ''} 
                      onChange={e => setVitals({...vitals, height: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text/40 uppercase">RR (bpm)</label>
                    <input 
                      className="w-full px-2 py-1 rounded border border-black/5 text-xs font-bold" 
                      value={vitals.rr || ''} 
                      onChange={e => setVitals({...vitals, rr: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-text">Medicines</h4>
                <div className="flex gap-2">
                  <select 
                    className="px-2 py-1 rounded border border-black/10 text-[10px] font-bold"
                    onChange={e => {
                      const t = templates.find(temp => temp.id === Number(e.target.value));
                      if (t) applyTemplate(t);
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>Apply Template</option>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.template_name}</option>)}
                  </select>
                  <button onClick={addItem} className="text-primary text-[10px] font-bold hover:underline">+ Add Medicine</button>
                </div>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-2 p-3 bg-bg rounded-xl border border-black/5 relative group">
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[8px] font-bold text-text/40 uppercase">Medicine Name</label>
                      <input 
                        className="w-full px-2 py-1 rounded border border-black/10 text-xs"
                        value={item.medicine_name}
                        onChange={e => updateItem(index, 'medicine_name', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-text/40 uppercase">Dosage</label>
                      <input 
                        className="w-full px-2 py-1 rounded border border-black/10 text-xs"
                        value={item.dosage}
                        onChange={e => updateItem(index, 'dosage', e.target.value)}
                        placeholder="e.g. 1 Tab"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-text/40 uppercase">Freq</label>
                      <select 
                        className="w-full px-2 py-1 rounded border border-black/10 text-xs"
                        value={item.frequency}
                        onChange={e => updateItem(index, 'frequency', e.target.value)}
                      >
                        <option value="">Select</option>
                        <option value="OD">OD (Once Daily)</option>
                        <option value="BD">BD (Twice Daily)</option>
                        <option value="TDS">TDS (Thrice Daily)</option>
                        <option value="QID">QID (Four Times)</option>
                        <option value="HS">HS (At Bedtime)</option>
                        <option value="SOS">SOS (As Needed)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-text/40 uppercase">Dur</label>
                      <input 
                        className="w-full px-2 py-1 rounded border border-black/10 text-xs"
                        value={item.duration}
                        onChange={e => updateItem(index, 'duration', e.target.value)}
                        placeholder="e.g. 5 Days"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-text/40 uppercase">Instr</label>
                      <input 
                        className="w-full px-2 py-1 rounded border border-black/10 text-xs"
                        value={item.instructions}
                        onChange={e => updateItem(index, 'instructions', e.target.value)}
                        placeholder="After Food"
                      />
                    </div>
                    <button 
                      onClick={() => removeItem(index)}
                      className="absolute -right-2 -top-2 w-5 h-5 bg-error text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="py-12 text-center text-text/40 italic text-sm border-2 border-dashed border-black/5 rounded-xl">
                    No medicines added. Click "+ Add Medicine" or apply a template.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 space-y-1">
              <label className="text-[10px] font-bold text-text/40 uppercase">Clinical Notes</label>
              <textarea 
                className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm"
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Enter additional clinical notes or advice..."
              />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="e-Signature">
            <div className="space-y-4">
              <div className="p-4 bg-bg rounded-xl border border-black/5 text-center">
                <p className="text-[10px] text-text/40 uppercase font-bold mb-4">Doctor Signature Area</p>
                <div className="h-24 flex items-center justify-center border-b-2 border-black/20 font-serif italic text-xl">
                  {signature || doctors.find(d => d.id === selectedDoctorId)?.name || 'Dr. Signature'}
                </div>
                <input 
                  type="text" 
                  className="mt-4 w-full px-3 py-1.5 rounded border border-black/10 text-xs text-center"
                  placeholder="Type name for e-Signature"
                  value={signature}
                  onChange={e => setSignature(e.target.value)}
                />
              </div>
              <p className="text-[10px] text-text/40 italic">
                By saving, you are electronically signing this prescription as a registered medical practitioner.
              </p>
            </div>
          </Card>

          {showHistory && (
            <Card title="Previous Prescriptions">
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {history.map(h => (
                  <div key={h.id} className="p-3 bg-bg rounded-xl border border-black/5 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-text">{h.diagnosis}</p>
                        <p className="text-[10px] text-text/40">{new Date(h.created_at!).toLocaleDateString()}</p>
                      </div>
                      <button 
                        onClick={() => generatePDF(h)}
                        className="p-1.5 bg-white border border-black/10 rounded-lg text-primary hover:bg-primary/5"
                      >
                        <FileText size={14} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {h.items.map((item, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-white rounded text-[8px] font-bold border border-black/5">
                          {item.medicine_name}
                        </span>
                      ))}
                    </div>
                    <button 
                      onClick={() => {
                        setDiagnosis(h.diagnosis || '');
                        setItems(h.items.map(item => ({ ...item })));
                      }}
                      className="w-full py-1 text-[10px] font-bold text-primary border border-primary/20 rounded hover:bg-primary/5"
                    >
                      Re-Prescribe
                    </button>
                  </div>
                ))}
                {history.length === 0 && (
                  <div className="py-8 text-center text-text/40 italic text-xs">No previous prescriptions found.</div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

const HospitalAdminDashboard = ({ hospitalId }: { hospitalId: number }) => {
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [recentAdmissions, setRecentAdmissions] = useState<any[]>([]);

  useEffect(() => {
    const fetchAdmissions = async () => {
      const res = await fetch(`/api/ipd/admissions?hospitalId=${hospitalId}`);
      setRecentAdmissions((await res.json()).slice(0, 5));
    };
    fetchAdmissions();
  }, [hospitalId]);

  if (selectedPatientId) {
    return <PatientOverview patientId={selectedPatientId} hospitalId={hospitalId} onBack={() => setSelectedPatientId(null)} />;
  }

  const revenueData = [
    { name: 'Mon', revenue: 45000, opd: 120, ipd: 15 },
    { name: 'Tue', revenue: 52000, opd: 145, ipd: 18 },
    { name: 'Wed', revenue: 48000, opd: 130, ipd: 12 },
    { name: 'Thu', revenue: 61000, opd: 160, ipd: 22 },
    { name: 'Fri', revenue: 55000, opd: 150, ipd: 20 },
    { name: 'Sat', revenue: 38000, opd: 90, ipd: 10 },
    { name: 'Sun', revenue: 25000, opd: 40, ipd: 5 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-primary">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-xl"><Users size={24} /></div>
            <div>
              <p className="text-xs text-text/40 font-bold uppercase tracking-wider">Today's OPD / IPD</p>
              <h4 className="text-2xl font-black text-text">142 / 24</h4>
              <p className="text-[10px] text-success font-bold flex items-center gap-1 mt-1">
                <TrendingUp size={10} /> +12% from yesterday
              </p>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-accent">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-accent/10 text-accent rounded-xl"><Bed size={24} /></div>
            <div>
              <p className="text-xs text-text/40 font-bold uppercase tracking-wider">Bed Occupancy</p>
              <h4 className="text-2xl font-black text-text">82%</h4>
              <p className="text-[10px] text-text/40 font-bold mt-1">42 / 50 Beds Occupied</p>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-warning">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-warning/10 text-warning rounded-xl"><LogOut size={24} /></div>
            <div>
              <p className="text-xs text-text/40 font-bold uppercase tracking-wider">Pending Discharges</p>
              <h4 className="text-2xl font-black text-text">08</h4>
              <p className="text-[10px] text-warning font-bold mt-1">3 Critical Approvals</p>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-error">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-error/10 text-error rounded-xl"><ShieldAlert size={24} /></div>
            <div>
              <p className="text-xs text-text/40 font-bold uppercase tracking-wider">Emergency Cases</p>
              <h4 className="text-2xl font-black text-text">03</h4>
              <p className="text-[10px] text-error font-bold mt-1">Immediate Attention Required</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Revenue & Patient Flow Analytics" className="lg:col-span-2">
          <div className="h-[350px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#999' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#999' }}
                  tickFormatter={(value) => `₹${value/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8f8f8' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '20px' }} />
                <Bar dataKey="revenue" name="Revenue (₹)" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="opd" name="OPD Count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="space-y-6">
          <Card title="Recent Patient Admissions">
            <div className="space-y-4">
              {recentAdmissions.map((adm, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between p-3 bg-bg/50 rounded-2xl border border-black/5 hover:border-primary/20 transition-all cursor-pointer group"
                  onClick={() => setSelectedPatientId(adm.patient_id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {adm.patient_name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-black text-text">{adm.patient_name}</p>
                      <p className="text-[10px] text-text/40 font-bold uppercase">{adm.ward_name} - {adm.bed_number}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-text/20 group-hover:text-primary transition-colors" />
                </div>
              ))}
              {recentAdmissions.length === 0 && (
                <p className="text-center py-4 text-text/30 italic text-xs">No recent admissions</p>
              )}
            </div>
          </Card>

          <Card title="Alerts & Status Summary">
            <div className="space-y-4">
              <div className="p-4 bg-error/5 rounded-2xl border border-error/10 group hover:bg-error/10 transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-error/20 rounded-lg text-error"><Pill size={18} /></div>
                    <span className="text-sm font-black text-text">Pharmacy Low Stock</span>
                  </div>
                  <Badge variant="error">12 Items</Badge>
                </div>
                <div className="w-full bg-error/10 h-1 rounded-full overflow-hidden">
                  <div className="bg-error h-full" style={{ width: '85%' }}></div>
                </div>
              </div>

              <div className="p-4 bg-warning/5 rounded-2xl border border-warning/10 group hover:bg-warning/10 transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-warning/20 rounded-lg text-warning"><Microscope size={18} /></div>
                    <span className="text-sm font-black text-text">Lab Pending Reports</span>
                  </div>
                  <Badge variant="alert">24 Reports</Badge>
                </div>
                <p className="text-[10px] text-text/40 font-bold">Average turnaround: 4.2 hours</p>
              </div>

              <div className="p-4 bg-success/5 rounded-2xl border border-success/10 group hover:bg-success/10 transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-success/20 rounded-lg text-success"><MessageSquare size={18} /></div>
                    <span className="text-sm font-black text-text">WhatsApp Notifications</span>
                  </div>
                  <Badge variant="success">142 Sent</Badge>
                </div>
                <p className="text-[10px] text-text/40 font-bold">98% Delivery Rate Today</p>
              </div>
            </div>
          </Card>

          <Card title="System Health">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-text/60">Server Status: Online</span>
              </div>
              <span className="text-[10px] font-bold text-text/30">v2.4.0</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const DoctorDashboard = ({ hospitalId }: { hospitalId: number }) => {
  const [visits, setVisits] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);

  useEffect(() => {
    const fetchVisits = async () => {
      const res = await fetch(`/api/opd/visits?hospitalId=${hospitalId}`);
      setVisits(await res.json());
    };
    fetchVisits();
  }, [hospitalId]);

  if (selectedPatientId) {
    return <PatientOverview patientId={selectedPatientId} hospitalId={hospitalId} onBack={() => setSelectedPatientId(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Today's OPD Appointments" className="lg:col-span-2" action={
          <div className="flex gap-2">
            <button className="p-1.5 hover:bg-black/5 rounded-lg transition-colors"><Search size={16} className="text-text/40" /></button>
            <button className="p-1.5 hover:bg-black/5 rounded-lg transition-colors"><Printer size={16} className="text-text/40" /></button>
          </div>
        }>
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-black/2 border-y border-black/5">
                  <th className="px-6 py-3 text-[10px] font-black text-text/40 uppercase tracking-widest">Token</th>
                  <th className="px-6 py-3 text-[10px] font-black text-text/40 uppercase tracking-widest">Patient Name</th>
                  <th className="px-6 py-3 text-[10px] font-black text-text/40 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-3 text-[10px] font-black text-text/40 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {visits.map((visit, i) => (
                  <tr 
                    key={i} 
                    className="hover:bg-primary/5 transition-colors group cursor-pointer"
                    onClick={() => setSelectedPatientId(visit.patient_id)}
                  >
                    <td className="px-6 py-4">
                      <span className="text-xs font-black text-text bg-black/5 px-2 py-1 rounded-md">OPD-{visit.token_number}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-bold text-text">{visit.patient_name}</p>
                        <p className="text-[10px] text-text/40 font-bold uppercase">{new Date(visit.visit_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={visit.status === 'Waiting' ? 'alert' : 'success'}>{visit.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 opacity-0 group-hover:opacity-100 transition-all">
                        <ArrowLeft size={14} className="rotate-180" />
                      </button>
                    </td>
                  </tr>
                ))}
                {visits.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-text/30 italic">No appointments today</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-6">
          <Card title="e-Prescription Quick Panel" className="bg-primary text-white border-none shadow-xl shadow-primary/20">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={16} />
                <input 
                  type="text" 
                  placeholder="Patient ID or Name..." 
                  className="w-full pl-10 pr-4 py-3 bg-white/10 rounded-2xl border border-white/20 text-sm focus:outline-none focus:bg-white/20 transition-all placeholder:text-white/40"
                />
              </div>
              <button className="w-full py-4 bg-white text-primary rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg">
                Start New Prescription
              </button>
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest opacity-60">
                <span>Recent: P-2045</span>
                <span>Recent: P-2044</span>
              </div>
            </div>
          </Card>

          <Card title="Clinical Tasks">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-accent/5 rounded-2xl border border-accent/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/20 rounded-lg text-accent"><Bed size={18} /></div>
                  <div>
                    <p className="text-sm font-black text-text">IPD Rounds Pending</p>
                    <p className="text-[10px] text-text/40 font-bold">12 Patients to visit</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-text/20" />
              </div>

              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-2xl border border-primary/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg text-primary"><Microscope size={18} /></div>
                  <div>
                    <p className="text-sm font-black text-text">New Test Results</p>
                    <p className="text-[10px] text-text/40 font-bold">5 Critical findings</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-text/20" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const NurseDashboard = ({ hospitalId }: { hospitalId: number }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card title="Medication Due Alerts" className="border-t-4 border-t-error">
          <div className="space-y-3 mt-2">
            {[
              { time: '10:00 AM', room: '204', patient: 'Rajesh K.', med: 'Paracetamol 500mg', urgent: true },
              { time: '10:15 AM', room: '102', patient: 'Sunita W.', med: 'Insulin 10 Units', urgent: false },
              { time: '10:30 AM', room: '305', patient: 'Vikram S.', med: 'Amoxicillin', urgent: false },
              { time: '11:00 AM', room: '208', patient: 'Anita S.', med: 'IV Fluids', urgent: true },
            ].map((alert, i) => (
              <div key={i} className={clsx(
                "p-3 rounded-2xl border transition-all flex justify-between items-center group cursor-pointer",
                alert.urgent ? "bg-error/5 border-error/10 hover:bg-error/10" : "bg-black/2 border-black/5 hover:bg-black/5"
              )}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={clsx("text-[10px] font-black px-1.5 py-0.5 rounded", alert.urgent ? "bg-error text-white" : "bg-black/10 text-text/60")}>
                      {alert.time}
                    </span>
                    <span className="text-[10px] font-bold text-text/40 uppercase tracking-widest">Room {alert.room}</span>
                  </div>
                  <p className="text-sm font-black text-text">{alert.patient}</p>
                  <p className="text-xs text-text/60 font-medium">{alert.med}</p>
                </div>
                <button className="w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center text-success hover:scale-110 active:scale-90 transition-all">
                  <CheckCircle2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Vital Signs Pending" className="border-t-4 border-t-warning">
          <div className="space-y-3 mt-2">
            {[
              { room: '201', name: 'Anita Sharma', last: '4 hrs ago', status: 'Overdue' },
              { room: '205', name: 'Gopal Das', last: '3.5 hrs ago', status: 'Due' },
              { room: '108', name: 'Meena Kumari', last: '5 hrs ago', status: 'Overdue' },
              { room: '302', name: 'Rahul Singh', last: '2 hrs ago', status: 'Upcoming' },
            ].map((vital, i) => (
              <div key={i} className="p-3 bg-black/2 border border-black/5 rounded-2xl flex justify-between items-center hover:bg-black/5 transition-all">
                <div>
                  <p className="text-sm font-black text-text">Room {vital.room} - {vital.name}</p>
                  <p className="text-[10px] text-text/40 font-bold uppercase mt-0.5">Last: {vital.last}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={clsx(
                    "text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full",
                    vital.status === 'Overdue' ? "bg-error/10 text-error" : "bg-warning/10 text-warning"
                  )}>
                    {vital.status}
                  </span>
                  <button className="px-3 py-1 bg-primary text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">Record</button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card title="Shift & Bed Status">
            <div className="space-y-6">
              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-primary/20 rounded-lg text-primary"><Calendar size={18} /></div>
                  <span className="text-sm font-black text-text">Shift Schedule</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-text/60">Current Shift</p>
                    <p className="text-sm font-black text-text">Morning (8am - 2pm)</p>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
              </div>

              <div className="p-4 bg-accent/5 rounded-2xl border border-accent/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-accent/20 rounded-lg text-accent"><Bed size={18} /></div>
                  <span className="text-sm font-black text-text">Bed Allotment</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-2 bg-white rounded-xl border border-black/5">
                    <p className="text-[10px] font-bold text-text/40 uppercase">Occupied</p>
                    <p className="text-xl font-black text-text">42</p>
                  </div>
                  <div className="text-center p-2 bg-white rounded-xl border border-black/5">
                    <p className="text-[10px] font-bold text-text/40 uppercase">Available</p>
                    <p className="text-xl font-black text-accent">08</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Quick Resources">
            <div className="grid grid-cols-2 gap-2">
              <button className="p-3 bg-black/2 hover:bg-black/5 rounded-xl border border-black/5 flex flex-col items-center gap-2 transition-all">
                <FileText size={18} className="text-text/40" />
                <span className="text-[10px] font-bold uppercase">Forms</span>
              </button>
              <button className="p-3 bg-black/2 hover:bg-black/5 rounded-xl border border-black/5 flex flex-col items-center gap-2 transition-all">
                <Phone size={18} className="text-text/40" />
                <span className="text-[10px] font-bold uppercase">Directory</span>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const Reports = ({ hospitalId }: { hospitalId: number }) => {
  const [activeCategory, setActiveCategory] = useState<'clinical' | 'admin' | 'statutory'>('clinical');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const res = await fetch(`/api/reports/summary?hospital_id=${hospitalId}`);
        const data = await res.json();
        setReportData(data);
      } catch (error) {
        console.error('Error fetching report data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, [hospitalId]);

  const categories = [
    { id: 'clinical', label: 'Clinical Reports', icon: Stethoscope },
    { id: 'admin', label: 'Administrative Reports', icon: BarChart3 },
    { id: 'statutory', label: 'Statutory Reports', icon: ShieldCheck },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-text">Hospital Reporting Module</h2>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-black/5 rounded-xl text-sm font-bold hover:bg-black/2 transition-all">
            <Calendar size={16} />
            <span>Last 7 Days</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
            <Download size={16} />
            <span>Export All</span>
          </button>
        </div>
      </div>

      <div className="flex gap-4 p-1 bg-black/5 rounded-2xl w-fit">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id as any)}
            className={clsx(
              "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all",
              activeCategory === cat.id 
                ? "bg-white text-primary shadow-sm" 
                : "text-text/40 hover:text-text/60"
            )}
          >
            <cat.icon size={18} />
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {activeCategory === 'clinical' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="OPD/IPD Census Trend">
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reportData?.censusTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#999' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#999' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '20px' }} />
                  <Line type="monotone" dataKey="opd" name="OPD Census" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="ipd" name="IPD Census" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Disease-wise Statistics">
            <div className="h-[300px] w-full mt-4 flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reportData?.diseaseStats || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {(reportData?.diseaseStats || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Emergency Cases Report" className="lg:col-span-2">
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-black/2 border-y border-black/5">
                    <th className="px-6 py-3 text-[10px] font-black text-text/40 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-3 text-[10px] font-black text-text/40 uppercase tracking-widest">Case Type</th>
                    <th className="px-6 py-3 text-[10px] font-black text-text/40 uppercase tracking-widest">Severity</th>
                    <th className="px-6 py-3 text-[10px] font-black text-text/40 uppercase tracking-widest">Outcome</th>
                    <th className="px-6 py-3 text-[10px] font-black text-text/40 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {(reportData?.emergencyCases || []).map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-black/2 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-text">{row.date}</td>
                      <td className="px-6 py-4 text-xs font-black text-text">{row.type}</td>
                      <td className="px-6 py-4">
                        <Badge variant={row.severity === 'Critical' ? 'error' : row.severity === 'High' ? 'alert' : 'success'}>{row.severity}</Badge>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-text/60">{row.outcome}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-primary hover:underline text-[10px] font-black uppercase">View Case</button>
                      </td>
                    </tr>
                  ))}
                  {(reportData?.emergencyCases || []).length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-text/40 italic">No emergency cases reported.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeCategory === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="Revenue Distribution" className="lg:col-span-2">
            <div className="h-[350px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData?.revenueStats || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#999' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#999' }} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '20px' }} />
                  <Bar dataKey="opd" name="OPD Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ipd" name="IPD Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="space-y-6">
            <Card title="Department-wise Earnings">
              <div className="space-y-4">
                {[
                  { dept: 'Cardiology', amount: '₹4.2L', growth: '+12%' },
                  { dept: 'Orthopedics', amount: '₹3.8L', growth: '+8%' },
                  { dept: 'Pediatrics', amount: '₹2.1L', growth: '+15%' },
                  { dept: 'Gynecology', amount: '₹5.5L', growth: '+5%' },
                ].map((dept, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-black/2 rounded-xl border border-black/5">
                    <div>
                      <p className="text-xs font-black text-text">{dept.dept}</p>
                      <p className="text-lg font-black text-primary">{dept.amount}</p>
                    </div>
                    <span className="text-[10px] font-black text-success">{dept.growth}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="OT Utilization">
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path className="text-black/5" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                    <path className="text-accent" strokeDasharray="75, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-black text-sm">75%</div>
                </div>
                <div>
                  <p className="text-xs font-bold text-text/40 uppercase">Average Utilization</p>
                  <p className="text-sm font-black text-text">18/24 Hours Active</p>
                </div>
              </div>
            </Card>
          </div>

          <Card title="Pharmacy Inventory Aging" className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: '0-30 Days', value: '₹12.5L', color: 'bg-success' },
                { label: '31-60 Days', value: '₹8.2L', color: 'bg-primary' },
                { label: '61-90 Days', value: '₹4.1L', color: 'bg-warning' },
                { label: '90+ Days', value: '₹1.5L', color: 'bg-error' },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-2xl border border-black/5 bg-black/2">
                  <p className="text-[10px] font-black text-text/40 uppercase mb-1">{item.label}</p>
                  <p className="text-xl font-black text-text">{item.value}</p>
                  <div className={clsx("h-1 w-full rounded-full mt-2", item.color)}></div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeCategory === 'statutory' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Statutory Registers Summary">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <div className="flex items-center gap-3 mb-2">
                  <Baby className="text-primary" size={20} />
                  <span className="text-sm font-black text-text">Births</span>
                </div>
                <p className="text-2xl font-black text-text">142</p>
                <p className="text-[10px] text-text/40 font-bold uppercase">This Month</p>
              </div>
              <div className="p-4 bg-error/5 rounded-2xl border border-error/10">
                <div className="flex items-center gap-3 mb-2">
                  <Skull className="text-error" size={20} />
                  <span className="text-sm font-black text-text">Deaths</span>
                </div>
                <p className="text-2xl font-black text-text">08</p>
                <p className="text-[10px] text-text/40 font-bold uppercase">This Month</p>
              </div>
            </div>
          </Card>

          <Card title="Infection Control (HAI Rate)">
            <div className="h-[200px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={reportData?.censusTrend || []}>
                  <defs>
                    <linearGradient id="colorHai" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" hide />
                  <YAxis hide />
                  <Tooltip />
                  <Area type="monotone" dataKey="ipd" name="HAI Rate" stroke="#ef4444" fillOpacity={1} fill="url(#colorHai)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between items-center mt-4">
              <p className="text-xs font-bold text-text/60">Current HAI Rate: <span className="text-error font-black">0.8%</span></p>
              <Badge variant="success">Below Benchmark</Badge>
            </div>
          </Card>

          <Card title="Waste Management Report" className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { type: 'Yellow (Infectious)', weight: '142 kg', status: 'Collected' },
                { type: 'Red (Plastic)', weight: '85 kg', status: 'Collected' },
                { type: 'White (Sharps)', weight: '12 kg', status: 'Pending' },
                { type: 'Blue (Glass)', weight: '24 kg', status: 'Collected' },
              ].map((waste, i) => (
                <div key={i} className="p-4 bg-black/2 rounded-2xl border border-black/5 flex flex-col items-center text-center">
                  <div className={clsx(
                    "w-12 h-12 rounded-full mb-3 flex items-center justify-center text-white",
                    waste.type.includes('Yellow') ? "bg-yellow-500" : 
                    waste.type.includes('Red') ? "bg-red-500" : 
                    waste.type.includes('White') ? "bg-slate-200 text-slate-600" : "bg-blue-500"
                  )}>
                    <Archive size={20} />
                  </div>
                  <p className="text-xs font-black text-text mb-1">{waste.type}</p>
                  <p className="text-lg font-black text-text">{waste.weight}</p>
                  <Badge variant={waste.status === 'Collected' ? 'success' : 'alert'} className="mt-2">{waste.status}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

const HRManagement = ({ hospitalId }: { hospitalId: number }) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'staff' | 'logs'>('roster');
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text">HR & Roster Management</h2>
        <div className="flex gap-2 bg-white p-1 rounded-lg border border-black/5">
          {(['roster', 'staff', 'logs'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                "px-4 py-1.5 rounded-md text-xs font-bold transition-all uppercase tracking-wider",
                activeTab === tab ? "bg-primary text-white shadow-md" : "text-text/40 hover:bg-black/5"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'roster' && (
        <Card title="Staff Duty Roster">
          <div className="p-6 text-center text-text/40 italic">Roster management interface</div>
        </Card>
      )}
      {activeTab === 'staff' && (
        <Card title="Staff Directory">
          <div className="p-6 text-center text-text/40 italic">Staff records and documentation</div>
        </Card>
      )}
      {activeTab === 'logs' && (
        <Card title="Time Logs & Attendance">
          <div className="p-6 text-center text-text/40 italic">Attendance tracking and logs</div>
        </Card>
      )}
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  const scrollNav = (direction: 'up' | 'down') => {
    if (navRef.current) {
      const scrollAmount = 200;
      navRef.current.scrollBy({
        top: direction === 'up' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return <LoginView onLogin={setUser} />;
  }

  const renderContent = () => {
    if (user.role === 'SUPER_ADMIN') {
      switch (activeTab) {
        case 'dashboard': return <SuperAdminDashboard />;
        default: return <SuperAdminDashboard />;
      }
    }

    if (!hasPermission(user.role, activeTab)) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-12 text-center">
          <div className="w-20 h-20 bg-error/10 text-error rounded-full flex items-center justify-center mb-6">
            <ShieldAlert size={40} />
          </div>
          <h3 className="text-xl font-bold text-text mb-2">Access Denied</h3>
          <p className="text-text/60 max-w-md">You do not have permission to access the {activeTab} module. Please contact your administrator if you believe this is an error.</p>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className="mt-8 px-6 py-2 bg-primary text-white rounded-lg font-bold shadow-lg shadow-primary/20"
          >
            Back to Dashboard
          </button>
        </div>
      );
    }

    // Hospital Specific Roles
    switch (activeTab) {
      case 'dashboard': 
        if (user.role === 'ADMIN') return <HospitalAdminDashboard hospitalId={user.hospital_id!} />;
        if (user.role === 'DOCTOR') return <DoctorDashboard hospitalId={user.hospital_id!} />;
        if (user.role === 'NURSE') return <NurseDashboard hospitalId={user.hospital_id!} />;
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 text-primary rounded-xl"><Users size={24} /></div>
                <div>
                  <p className="text-xs text-text/40 font-semibold uppercase">Total Patients</p>
                  <h4 className="text-2xl font-bold">1,284</h4>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-accent/10 text-accent rounded-xl"><Clock size={24} /></div>
                <div>
                  <p className="text-xs text-text/40 font-semibold uppercase">OPD Queue</p>
                  <h4 className="text-2xl font-bold">12</h4>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-success/10 text-success rounded-xl"><CheckCircle2 size={24} /></div>
                <div>
                  <p className="text-xs text-text/40 font-semibold uppercase">Completed</p>
                  <h4 className="text-2xl font-bold">45</h4>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-alert/10 text-alert rounded-xl"><Activity size={24} /></div>
                <div>
                  <p className="text-xs text-text/40 font-semibold uppercase">Emergency</p>
                  <h4 className="text-2xl font-bold">2</h4>
                </div>
              </div>
            </Card>
          </div>
        );
      case 'opd': return <OPDManagement hospitalId={user.hospital_id!} />;
      case 'ipd': return <IPDManagement hospitalId={user.hospital_id!} />;
      case 'nursing': return <NursingStationDashboard hospitalId={user.hospital_id!} />;
      case 'doctors': return <DoctorsManagement hospitalId={user.hospital_id!} />;
      case 'patients': return <PatientsManagement hospitalId={user.hospital_id!} />;
      case 'pharmacy': return <PharmacyManagement hospitalId={user.hospital_id!} />;
      case 'ot': return <OTManagement hospitalId={user.hospital_id!} />;
      case 'laboratory': return <LaboratoryManagement hospitalId={user.hospital_id!} />;
      case 'radiology': return <RadiologyManagement hospitalId={user.hospital_id!} />;
      case 'appointments': return <AppointmentManagement hospitalId={user.hospital_id!} />;
      case 'emergency': return <EmergencyManagement hospitalId={user.hospital_id!} />;
      case 'consultants': return <ConsultantManagement hospitalId={user.hospital_id!} />;
      case 'ambulance': return <AmbulanceManagement hospitalId={user.hospital_id!} />;
      case 'prescriptions': return <PrescriptionModule hospitalId={user.hospital_id!} />;
      case 'whatsapp': return <WhatsAppManagement hospitalId={user.hospital_id!} />;
      case 'billing': return <BillingManagement hospitalId={user.hospital_id!} />;
      case 'statutory': return <StatutoryManagement hospitalId={user.hospital_id!} />;
      case 'birthdeath': return <BirthDeathManagement hospitalId={user.hospital_id!} />;
      case 'discharge': return <DischargeManagement hospitalId={user.hospital_id!} />;
      case 'safety': return <SafetyFacilityManagement hospitalId={user.hospital_id!} />;
      case 'hr': return <HRManagement hospitalId={user.hospital_id!} />;
      case 'reports': return <Reports hospitalId={user.hospital_id!} />;
      default: return <div className="p-12 text-center text-text/40 italic">Module under development</div>;
    }
  };

  return (
    <div className="min-h-screen flex bg-bg relative">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={clsx(
        "fixed inset-y-0 left-0 w-64 bg-sidebar flex flex-col shadow-xl z-40 transition-transform duration-300 lg:relative lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <HospitalIcon size={24} />
            </div>
            <div>
              <h1 className="font-bold text-sm">CuraManage</h1>
              <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold">HMS Pro</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-white/50 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="px-4 flex flex-col gap-1">
          <button 
            onClick={() => scrollNav('up')}
            className="w-full flex items-center justify-center py-1 text-white/30 hover:text-white transition-colors"
            title="Scroll Up"
          >
            <ChevronUp size={20} />
          </button>
        </div>

        <nav ref={navRef} className="flex-1 mt-2 overflow-y-auto scrollbar-custom">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          
          {user.role === 'SUPER_ADMIN' ? (
            <>
              <SidebarItem 
                icon={HospitalIcon} 
                label="Hospitals" 
                active={activeTab === 'hospitals'} 
                onClick={() => setActiveTab('hospitals')} 
              />
              <SidebarItem 
                icon={ShieldCheck} 
                label="System Logs" 
                active={activeTab === 'logs'} 
                onClick={() => setActiveTab('logs')} 
              />
            </>
          ) : (
            <>
              <SidebarItem 
                icon={ClipboardList} 
                label="OPD Management" 
                active={activeTab === 'opd'} 
                onClick={() => setActiveTab('opd')} 
                hidden={!hasPermission(user.role, 'opd')}
              />
              <SidebarItem 
                icon={Bed} 
                label="IPD Management" 
                active={activeTab === 'ipd'} 
                onClick={() => setActiveTab('ipd')} 
                hidden={!hasPermission(user.role, 'ipd')}
              />
              <SidebarItem 
                icon={LogOut} 
                label="Discharge Management" 
                active={activeTab === 'discharge'} 
                onClick={() => setActiveTab('discharge')} 
                hidden={!hasPermission(user.role, 'discharge')}
              />
              <SidebarItem 
                icon={Activity} 
                label="Nursing Station" 
                active={activeTab === 'nursing'} 
                onClick={() => setActiveTab('nursing')} 
                hidden={!hasPermission(user.role, 'nursing')}
              />
              <SidebarItem 
                icon={ShieldAlert} 
                label="Emergency & ICU" 
                active={activeTab === 'emergency'} 
                onClick={() => setActiveTab('emergency')} 
                hidden={!hasPermission(user.role, 'emergency')}
              />
              <SidebarItem 
                icon={Stethoscope} 
                label="Consultants" 
                active={activeTab === 'consultants'} 
                onClick={() => setActiveTab('consultants')} 
                hidden={!hasPermission(user.role, 'consultants')}
              />
              <SidebarItem 
                icon={Truck} 
                label="Ambulance" 
                active={activeTab === 'ambulance'} 
                onClick={() => setActiveTab('ambulance')} 
                hidden={!hasPermission(user.role, 'ambulance')}
              />
              <SidebarItem 
                icon={Stethoscope} 
                label="Doctors" 
                active={activeTab === 'doctors'} 
                onClick={() => setActiveTab('doctors')} 
                hidden={!hasPermission(user.role, 'doctors')}
              />
              <SidebarItem 
                icon={Users} 
                label="Patients" 
                active={activeTab === 'patients'} 
                onClick={() => setActiveTab('patients')} 
                hidden={!hasPermission(user.role, 'patients')}
              />
              <div className="mt-4 px-4 py-2 text-[10px] font-bold text-white/30 uppercase tracking-widest">Modules</div>
              <SidebarItem 
                icon={Pill} 
                label="Pharmacy" 
                active={activeTab === 'pharmacy'} 
                onClick={() => setActiveTab('pharmacy')} 
                hidden={!hasPermission(user.role, 'pharmacy')}
              />
              <SidebarItem 
                icon={Scissors} 
                label="Operation Theatre" 
                active={activeTab === 'ot'} 
                onClick={() => setActiveTab('ot')} 
                hidden={!hasPermission(user.role, 'ot')}
              />
              <SidebarItem 
                icon={Microscope} 
                label="Laboratory" 
                active={activeTab === 'laboratory'} 
                onClick={() => setActiveTab('laboratory')} 
                hidden={!hasPermission(user.role, 'laboratory')}
              />
              <SidebarItem 
                icon={Activity} 
                label="Radiology" 
                active={activeTab === 'radiology'} 
                onClick={() => setActiveTab('radiology')} 
                hidden={!hasPermission(user.role, 'radiology')}
              />
              <SidebarItem 
                icon={Calendar} 
                label="Appointments" 
                active={activeTab === 'appointments'} 
                onClick={() => setActiveTab('appointments')} 
                hidden={!hasPermission(user.role, 'appointments')}
              />
              <SidebarItem 
                icon={FileText} 
                label="Prescriptions" 
                active={activeTab === 'prescriptions'} 
                onClick={() => setActiveTab('prescriptions')} 
                hidden={!hasPermission(user.role, 'prescriptions')}
              />
              <SidebarItem 
                icon={MessageSquare} 
                label="WhatsApp Logs" 
                active={activeTab === 'whatsapp'} 
                onClick={() => setActiveTab('whatsapp')} 
                hidden={!hasPermission(user.role, 'whatsapp')}
              />
              <SidebarItem 
                icon={CreditCard} 
                label="Billing & Payments" 
                active={activeTab === 'billing'} 
                onClick={() => setActiveTab('billing')} 
                hidden={!hasPermission(user.role, 'billing')}
              />
              <SidebarItem 
                icon={ShieldCheck} 
                label="Statutory Compliance" 
                active={activeTab === 'statutory'} 
                onClick={() => setActiveTab('statutory')} 
                hidden={!hasPermission(user.role, 'statutory')}
              />
              <SidebarItem 
                icon={Baby} 
                label="Birth & Death Register" 
                active={activeTab === 'birthdeath'} 
                onClick={() => setActiveTab('birthdeath')} 
                hidden={!hasPermission(user.role, 'birthdeath')}
              />
              <SidebarItem 
                icon={Wrench} 
                label="Safety & Facility" 
                active={activeTab === 'safety'} 
                onClick={() => setActiveTab('safety')} 
                hidden={!hasPermission(user.role, 'safety')}
              />
              <SidebarItem 
                icon={Users} 
                label="HR & Roster" 
                active={activeTab === 'hr'} 
                onClick={() => setActiveTab('hr')} 
                hidden={!hasPermission(user.role, 'hr')}
              />
              <SidebarItem 
                icon={BarChart3} 
                label="Reports" 
                active={activeTab === 'reports'} 
                onClick={() => setActiveTab('reports')} 
                hidden={!hasPermission(user.role, 'reports')}
              />
              <SidebarItem icon={Settings} label="Accounts" active={false} onClick={() => {}} />
            </>
          )}
        </nav>

        <div className="px-4 flex flex-col gap-1 pb-2">
          <button 
            onClick={() => scrollNav('down')}
            className="w-full flex items-center justify-center py-1 text-white/30 hover:text-white transition-colors"
            title="Scroll Down"
          >
            <ChevronDown size={20} />
          </button>
        </div>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-white/40 truncate">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-error hover:bg-error/10 rounded-lg transition-colors mb-4"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
          <div className="px-2 text-center">
            <p className="text-[9px] text-white/20 uppercase tracking-widest font-bold">Developed by Digital Communique</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-black/5 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-text/60 hover:bg-bg rounded-lg transition-colors"
            >
              <LayoutDashboard size={20} />
            </button>
            <div className="relative w-full max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text/30" />
              <input 
                type="text" 
                placeholder="Search patients, records, or tokens..." 
                className="w-full pl-10 pr-4 py-2 bg-bg rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-bold text-text">{user.hospital_name || 'System Central'}</p>
              <p className="text-[10px] text-text/40">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div className="w-10 h-10 bg-bg rounded-xl flex items-center justify-center text-text/40 hover:text-primary transition-colors cursor-pointer">
              <Settings size={20} />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
