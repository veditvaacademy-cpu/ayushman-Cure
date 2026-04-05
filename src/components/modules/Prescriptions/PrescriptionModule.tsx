import React, { useState, useEffect } from 'react';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { 
  History, 
  Save, 
  Activity, 
  X, 
  FileText 
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Patient, 
  Doctor, 
  Prescription, 
  PrescriptionItem, 
  PrescriptionTemplate 
} from '../../../types';

interface PrescriptionModuleProps {
  hospitalId: number;
  patientId?: number;
  visitId?: number;
  admissionId?: number;
  onComplete?: () => void;
}

export const PrescriptionModule = ({ hospitalId, patientId, visitId, admissionId, onComplete }: PrescriptionModuleProps) => {
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
