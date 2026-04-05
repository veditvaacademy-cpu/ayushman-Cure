import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Users, 
  FileText, 
  Thermometer, 
  ClipboardList, 
  Stethoscope, 
  Pill, 
  FileText as FileTextIcon, 
  LogOut 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { PrescriptionModule } from './PrescriptionModule';
import { IPDAdmission } from '../../types';

export const IPDAdmissionDetails = ({ admissionId, onBack }: { admissionId: number, onBack: () => void }) => {
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

  if (!admission) return <div className="p-12 text-center">Loading details...</div>;

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-primary font-medium hover:underline">
        <ArrowLeft size={18} />
        Back to Admissions
      </button>

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
                      <div className="md:col-span-5 flex justify-end">
                        <button type="submit" className="bg-primary text-white px-6 py-1.5 rounded-lg text-sm font-bold">Add Vitals</button>
                      </div>
                    </form>
                  </Card>
                  <Card title="Vitals History">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-black/5">
                            <th className="py-2 text-text/40">Time</th>
                            <th className="py-2 text-text/40">Temp</th>
                            <th className="py-2 text-text/40">BP</th>
                            <th className="py-2 text-text/40">Pulse</th>
                            <th className="py-2 text-text/40">SpO2</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                          {admission.vitals?.map((v, i) => (
                            <tr key={i}>
                              <td className="py-2">{new Date(v.recorded_at).toLocaleString()}</td>
                              <td className="py-2">{v.temp}°F</td>
                              <td className="py-2">{v.bp}</td>
                              <td className="py-2">{v.pulse}</td>
                              <td className="py-2">{v.spo2}%</td>
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
                        className="w-full px-4 py-2 rounded-lg border border-black/10 h-24"
                        value={note} onChange={e => setNote(e.target.value)}
                        placeholder="Enter nursing observations, care provided..."
                      />
                      <div className="flex justify-end">
                        <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg font-bold">Save Note</button>
                      </div>
                    </form>
                  </Card>
                  <div className="space-y-4">
                    {admission.nursing_notes?.map((n, i) => (
                      <div key={i} className="bg-white p-4 rounded-xl border border-black/5">
                        <div className="flex justify-between text-xs text-text/40 mb-2">
                          <span>Nursing Staff</span>
                          <span>{new Date(n.recorded_at).toLocaleString()}</span>
                        </div>
                        <p className="text-text/80">{n.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'rounds' && (
                <div className="space-y-6">
                  <Card title="Consultant Round Entry">
                    <form onSubmit={handleAddRound} className="space-y-4">
                      <textarea 
                        className="w-full px-4 py-2 rounded-lg border border-black/10 h-24"
                        value={roundNote} onChange={e => setRoundNote(e.target.value)}
                        placeholder="Clinical findings, changes in treatment plan..."
                      />
                      <div className="flex justify-end">
                        <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg font-bold">Save Round Note</button>
                      </div>
                    </form>
                  </Card>
                  <div className="space-y-4">
                    {admission.rounds?.map((r, i) => (
                      <div key={i} className="bg-white p-4 rounded-xl border border-black/5">
                        <div className="flex justify-between text-xs text-text/40 mb-2">
                          <span className="font-bold text-primary">Dr. {r.doctor_name}</span>
                          <span>{new Date(r.recorded_at).toLocaleString()}</span>
                        </div>
                        <p className="text-text/80">{r.notes}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'meds' && (
                <div className="space-y-6">
                  <Card title="Administer Medication">
                    <form onSubmit={handleAddMed} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input className="px-4 py-2 rounded border border-black/10" placeholder="Medicine Name" value={medName} onChange={e => setMedName(e.target.value)} />
                      <input className="px-4 py-2 rounded border border-black/10" placeholder="Dosage (e.g. 500mg)" value={dosage} onChange={e => setDosage(e.target.value)} />
                      <input className="px-4 py-2 rounded border border-black/10" placeholder="Frequency (e.g. BD)" value={freq} onChange={e => setFreq(e.target.value)} />
                      <div className="md:col-span-3 flex justify-end">
                        <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg font-bold">Add to Chart</button>
                      </div>
                    </form>
                  </Card>
                  <Card title="Medication Administration Record">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-black/5">
                            <th className="py-2 text-text/40">Medicine</th>
                            <th className="py-2 text-text/40">Dosage</th>
                            <th className="py-2 text-text/40">Frequency</th>
                            <th className="py-2 text-text/40">Last Given</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                          {admission.medications?.map((m, i) => (
                            <tr key={i}>
                              <td className="py-2 font-medium">{m.medicine_name}</td>
                              <td className="py-2">{m.dosage}</td>
                              <td className="py-2">{m.frequency}</td>
                              <td className="py-2">{new Date(m.recorded_at).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              )}

              {activeTab === 'discharge' && (
                <Card title="Final Discharge Summary">
                  <form onSubmit={handleDischarge} className="space-y-4">
                    <textarea 
                      className="w-full px-4 py-2 rounded-lg border border-black/10 h-48"
                      value={dischargeSummary} onChange={e => setDischargeSummary(e.target.value)}
                      placeholder="Summary of case, treatment given, condition at discharge, follow-up instructions..."
                    />
                    <div className="flex justify-end">
                      <button type="submit" className="bg-alert text-white px-8 py-2 rounded-lg font-bold shadow-lg shadow-alert/20">
                        Finalize Discharge
                      </button>
                    </div>
                  </form>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
