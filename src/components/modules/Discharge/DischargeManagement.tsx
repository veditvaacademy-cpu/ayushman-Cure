import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  Share2, 
  X, 
  ClipboardList, 
  Calendar, 
  Pill, 
  CheckCircle2 
} from 'lucide-react';
import { motion } from 'motion/react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { IPDAdmission, DischargeRecord } from '../../types';

interface DischargeManagementProps {
  hospitalId: number;
}

export const DischargeManagement = ({ hospitalId }: DischargeManagementProps) => {
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
