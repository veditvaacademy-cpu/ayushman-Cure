import React, { useState, useEffect } from 'react';
import { 
  Bed, 
  Stethoscope, 
  Clock, 
  ChevronRight 
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { IPDAdmissionDetails } from './IPDAdmissionDetails';
import { IPDAdmission, Patient, Doctor, Bed as BedType } from '../../types';

export const IPDManagement = ({ hospitalId }: { hospitalId: number }) => {
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
                  <span>View Details</span>
                  <ChevronRight size={16} />
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
