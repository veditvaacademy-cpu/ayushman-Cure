import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Share2, 
  DollarSign, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  ShoppingCart 
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { 
  ConsultantAppointment, 
  Referral, 
  Doctor, 
  Patient 
} from '../../types';

interface ConsultantManagementProps {
  hospitalId: number;
}

export const ConsultantManagement = ({ hospitalId }: ConsultantManagementProps) => {
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
