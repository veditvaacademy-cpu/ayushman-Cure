import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  ArrowLeft, 
  Phone, 
  MapPin, 
  Calendar, 
  Activity, 
  Pill, 
  FileText, 
  CreditCard 
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer 
} from 'recharts';
import { clsx } from 'clsx';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Patient } from '../../types';

interface PatientsManagementProps {
  hospitalId: number;
}

export const PatientOverview = ({ patientId, hospitalId, onBack }: { patientId: number, hospitalId: number, onBack: () => void }) => {
  const [patient, setPatient] = useState<any>(null);
  const [financial, setFinancial] = useState<any>(null);
  const [medications, setMedications] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, fRes, mRes, prRes] = await Promise.all([
          fetch(`/api/patients/${patientId}`),
          fetch(`/api/patients/${patientId}/financial`),
          fetch(`/api/patients/${patientId}/medications`),
          fetch(`/api/patients/${patientId}/prescriptions`)
        ]);
        setPatient(await pRes.json());
        setFinancial(await fRes.json());
        setMedications(await mRes.json());
        setPrescriptions(await prRes.json());
      } catch (error) {
        console.error("Error fetching patient overview:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [patientId]);

  if (loading || !patient) return <div className="p-12 text-center italic text-text/40">Loading patient profile...</div>;

  const donutData = [
    { name: 'Paid', value: financial.total_paid, color: '#10b981' },
    { name: 'Pending', value: financial.total_bill - financial.total_paid, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-bg rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-text">{patient.name}</h2>
          <p className="text-text/40 font-mono text-xs uppercase tracking-widest">{patient.patient_id_str} • {patient.age}Y • {patient.gender}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Info & Vitals */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Contact Information">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                    <Phone size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-text/30 uppercase tracking-widest">Mobile Number</p>
                    <p className="text-sm font-bold text-text">{patient.mobile}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center text-accent">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-text/30 uppercase tracking-widest">Address</p>
                    <p className="text-sm font-bold text-text">{patient.address}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Registration Details">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-warning/10 rounded-lg flex items-center justify-center text-warning">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-text/30 uppercase tracking-widest">Registered On</p>
                    <p className="text-sm font-bold text-text">{new Date(patient.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center text-success">
                    <FileText size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-text/30 uppercase tracking-widest">Blood Group</p>
                    <p className="text-sm font-bold text-text">O+ Positive</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <Card title="Latest Vitals">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
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
                      className={clsx("h-full rounded-full", bill.color === 'primary' ? 'bg-primary' : bill.color === 'accent' ? 'bg-accent' : bill.color === 'warning' ? 'bg-warning' : 'bg-success')} 
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

export const PatientsManagement = ({ hospitalId }: PatientsManagementProps) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
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

  useEffect(() => {
    if (editingPatient) {
      setName(editingPatient.name);
      setAge(editingPatient.age.toString());
      setGender(editingPatient.gender);
      setMobile(editingPatient.mobile);
      setAddress(editingPatient.address);
      setShowAdd(true);
    } else {
      setName(''); setAge(''); setGender('Male'); setMobile(''); setAddress('');
    }
  }, [editingPatient]);

  if (selectedPatientId) {
    return <PatientOverview patientId={selectedPatientId} hospitalId={hospitalId} onBack={() => setSelectedPatientId(null)} />;
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPatient) {
      await fetch(`/api/patients/${editingPatient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, age: parseInt(age), gender, mobile, address })
      });
      setEditingPatient(null);
    } else {
      await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hospital_id: hospitalId, name, age: parseInt(age), gender, mobile, address })
      });
    }
    setName(''); setAge(''); setMobile(''); setAddress('');
    setShowAdd(false);
    fetchPatients();
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this patient?')) {
      await fetch(`/api/patients/${id}`, { method: 'DELETE' });
      fetchPatients();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text">Patient Records</h2>
          <p className="text-text/60">View and manage hospital patient database</p>
        </div>
        <button 
          onClick={() => {
            setShowAdd(!showAdd);
            if (showAdd) setEditingPatient(null);
          }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-all"
        >
          <UserPlus size={20} />
          {showAdd ? 'Cancel' : 'Add Patient'}
        </button>
      </div>

      {showAdd && (
        <Card title={editingPatient ? "Edit Patient Details" : "New Patient Registration"}>
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
            <div className="md:col-span-3 flex justify-end gap-3">
              {editingPatient && (
                <button 
                  type="button" 
                  onClick={() => {
                    setEditingPatient(null);
                    setShowAdd(false);
                  }}
                  className="px-8 py-2 rounded-lg font-semibold border border-black/10 hover:bg-bg transition-colors"
                >
                  Cancel
                </button>
              )}
              <button type="submit" className="bg-primary text-white px-8 py-2 rounded-lg font-semibold shadow-lg shadow-primary/20">
                {editingPatient ? 'Update Patient' : 'Register Patient'}
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
                <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Actions</th>
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
                  <td className="px-4 py-4 text-sm">
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPatient(p);
                        }}
                        className="p-1 hover:bg-primary/10 text-primary rounded transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={(e) => handleDelete(p.id, e)}
                        className="p-1 hover:bg-error/10 text-error rounded transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
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
