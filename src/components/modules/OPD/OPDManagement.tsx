import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Activity, 
  Printer, 
  ArrowLeft, 
  X 
} from 'lucide-react';
import { motion } from 'motion/react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { PatientOverview } from './PatientOverview';
import { PrescriptionModule } from './PrescriptionModule';
import { OPDTokenReceipt } from './OPDTokenReceipt';
import { OPDVisit, Doctor, Patient } from '../../types';

export const OPDManagement = ({ hospitalId }: { hospitalId: number }) => {
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

  useEffect(() => {
    if (editingVisit) {
      setRegName(editingVisit.patient_name || '');
      setRegAge(editingVisit.age?.toString() || '');
      setRegGender(editingVisit.gender || 'Male');
      setRegMobile(editingVisit.mobile || '');
      setRegDoctor(editingVisit.doctor_id?.toString() || '');
      setRegSymptoms(editingVisit.symptoms || '');
      setRegFee(editingVisit.fee_amount?.toString() || '0');
      setRegPaymentStatus(editingVisit.payment_status || 'Unpaid');
      setRegTemp(editingVisit.vitals_temp || '');
      setRegBP(editingVisit.vitals_bp || '');
      setRegPulse(editingVisit.vitals_pulse || '');
      setRegSpO2(editingVisit.vitals_spo2 || '');
      setRegWeight(editingVisit.vitals_weight || '');
      setRegHeight(editingVisit.vitals_height || '');
      setRegRR(editingVisit.vitals_rr || '');
      setView('register');
    }
  }, [editingVisit]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let patientIdToUse = editingVisit?.patient_id;

    if (!editingVisit) {
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
      patientIdToUse = patient.id;
    }

    // 2. Create or Update Visit
    const url = editingVisit ? `/api/opd/visits/${editingVisit.id}` : '/api/opd/visits';
    const method = editingVisit ? 'PUT' : 'POST';

    const vRes = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hospital_id: hospitalId,
        patient_id: patientIdToUse,
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

    // Reset and refresh
    setRegName(''); setRegAge(''); setRegMobile(''); setRegDoctor(''); setRegSymptoms(''); setRegFee('0'); setRegPaymentStatus('Unpaid');
    setRegTemp(''); setRegBP(''); setRegPulse(''); setRegSpO2(''); setRegWeight(''); setRegHeight(''); setRegRR('');
    setEditingVisit(null);

    // Ask if user wants to print receipt
    if (!editingVisit && confirm('Registration successful! Do you want to print the token/receipt?')) {
      setPrintingVisitId(visitData.id);
    }
    
    setView('list');
    fetchData();
  };

  const handleDeleteVisit = async (id: number) => {
    if (!confirm('Are you sure you want to delete this OPD visit?')) return;
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
            onClick={() => {
              setEditingVisit(null);
              setView('register');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${view === 'register' ? 'bg-primary text-white' : 'bg-white text-text/60 border border-black/5'}`}
          >
            <UserPlus size={20} />
            New Registration
          </button>
        </div>
      </div>

      {view === 'register' && (
        <Card title={editingVisit ? "Edit OPD Visit" : "Patient Registration & Token Generation"}>
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Full Name</label>
                <input 
                  className="w-full px-4 py-2 rounded-lg border border-black/10 focus:ring-2 focus:ring-primary/20 disabled:bg-bg/50"
                  value={regName} onChange={e => setRegName(e.target.value)} required
                  disabled={!!editingVisit}
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
              <button type="button" onClick={() => {
                setView('list');
                setEditingVisit(null);
              }} className="px-6 py-2 text-text/60">Cancel</button>
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
      )}

      {view === 'list' && (
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
                          onClick={() => setEditingVisit(v)}
                          className="text-primary hover:underline text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteVisit(v.id)}
                          className="text-alert hover:underline text-sm font-medium"
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
