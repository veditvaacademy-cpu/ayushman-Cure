import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Baby, 
  Skull, 
  FileText, 
  CheckCircle2, 
  X, 
  Printer 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { clsx } from 'clsx';
import { 
  BirthRecord, 
  DeathRecord, 
  Patient, 
  Doctor 
} from '../../types';

interface BirthDeathManagementProps {
  hospitalId: number;
}

export const BirthDeathManagement = ({ hospitalId }: BirthDeathManagementProps) => {
  const [activeTab, setActiveTab] = useState<'birth' | 'death'>('birth');
  const [birthRecords, setBirthRecords] = useState<BirthRecord[]>([]);
  const [deathRecords, setDeathRecords] = useState<DeathRecord[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

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

  const approveRecord = async (id: number, type: 'birth' | 'death') => {
    const endpoint = type === 'birth' ? `/api/birth-records/${id}` : `/api/death-records/${id}`;
    try {
      await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Approved' })
      });
      fetchData();
    } catch (error) {
      console.error("Error approving record:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text">Birth & Death Registry</h2>
          <p className="text-text/40">Official records and certificate management</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={20} />
          <span>New {activeTab === 'birth' ? 'Birth' : 'Death'} Record</span>
        </button>
      </div>

      <div className="flex gap-2 p-1 bg-bg rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('birth')}
          className={clsx(
            "flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === 'birth' ? "bg-white text-primary shadow-sm" : "text-text/40 hover:text-text"
          )}
        >
          <Baby size={18} />
          Birth Records
        </button>
        <button
          onClick={() => setActiveTab('death')}
          className={clsx(
            "flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === 'death' ? "bg-white text-error shadow-sm" : "text-text/40 hover:text-text"
          )}
        >
          <Skull size={18} />
          Death Records
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {(activeTab === 'birth' ? birthRecords : deathRecords).map((record: any) => (
            <div key={record.id}>
              <Card>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className={clsx(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      activeTab === 'birth' ? "bg-primary/10 text-primary" : "bg-error/10 text-error"
                    )}>
                      {activeTab === 'birth' ? <Baby size={24} /> : <Skull size={24} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-text">
                        {activeTab === 'birth' ? record.baby_name : record.patient_name}
                      </h4>
                      <p className="text-sm text-text/40">
                        {activeTab === 'birth' ? `Mother: ${record.mother_name}` : `Cause: ${record.cause_of_death}`}
                      </p>
                      <p className="text-xs text-text/40 mt-1">
                        Date: {activeTab === 'birth' ? record.birth_date : record.death_date}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={record.status === 'Approved' ? 'success' : 'alert'}>
                      {record.status}
                    </Badge>
                    <div className="flex gap-1 ml-4 border-l border-black/5 pl-4">
                      {record.status === 'Pending' && (
                        <button 
                          onClick={() => approveRecord(record.id, activeTab)}
                          className="p-2 text-success hover:bg-success/5 rounded-lg transition-colors"
                          title="Approve Record"
                        >
                          <CheckCircle2 size={20} />
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          setSelectedRecord(record);
                          setShowCertificate(true);
                        }}
                        className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-colors"
                        title="View Certificate"
                      >
                        <FileText size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
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
              <h3 className="text-xl font-bold">New {activeTab === 'birth' ? 'Birth' : 'Death'} Entry</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddRecord} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {activeTab === 'birth' ? (
                <>
                  <div>
                    <label className="text-xs font-bold text-text/40 uppercase">Baby Name</label>
                    <input name="baby_name" required className="w-full p-2 bg-bg rounded-lg mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Gender</label>
                      <select name="gender" className="w-full p-2 bg-bg rounded-lg mt-1">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Weight (kg)</label>
                      <input type="number" step="0.1" name="weight" className="w-full p-2 bg-bg rounded-lg mt-1" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text/40 uppercase">Mother Name</label>
                    <input name="mother_name" required className="w-full p-2 bg-bg rounded-lg mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text/40 uppercase">Birth Date & Time</label>
                    <input type="datetime-local" name="birth_date" required className="w-full p-2 bg-bg rounded-lg mt-1" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-bold text-text/40 uppercase">Select Patient</label>
                    <select name="patient_id" required className="w-full p-2 bg-bg rounded-lg mt-1">
                      <option value="">Choose Patient</option>
                      {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text/40 uppercase">Death Date & Time</label>
                    <input type="datetime-local" name="death_date" required className="w-full p-2 bg-bg rounded-lg mt-1" />
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

      {showCertificate && selectedRecord && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-black/5 flex justify-between items-center no-print">
              <h3 className="font-bold">Certificate Preview</h3>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold" onClick={() => window.print()}>
                  <Printer size={16} /> Print
                </button>
                <button onClick={() => setShowCertificate(false)} className="p-2 hover:bg-bg rounded-full">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-12 text-center space-y-8 bg-[#fdfbf7] min-h-[600px] border-[16px] border-double border-primary/20 m-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-serif font-bold text-primary uppercase tracking-widest">
                  {activeTab === 'birth' ? 'Birth Certificate' : 'Death Certificate'}
                </h1>
                <p className="text-sm font-bold text-text/40 italic">Issued by Hospital Management System</p>
              </div>
              
              <div className="py-8 space-y-6">
                <p className="text-lg">This is to certify that</p>
                <h2 className="text-4xl font-serif font-bold text-text border-b-2 border-primary/20 pb-2 inline-block px-8">
                  {activeTab === 'birth' ? selectedRecord.baby_name : selectedRecord.patient_name}
                </h2>
                <div className="grid grid-cols-2 gap-8 text-left max-w-md mx-auto pt-8">
                  <div>
                    <p className="text-[10px] font-bold text-text/40 uppercase tracking-widest">Date</p>
                    <p className="font-bold">{activeTab === 'birth' ? selectedRecord.birth_date : selectedRecord.death_date}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-text/40 uppercase tracking-widest">Gender</p>
                    <p className="font-bold">{selectedRecord.gender || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold text-text/40 uppercase tracking-widest">
                      {activeTab === 'birth' ? 'Mother Name' : 'Cause of Death'}
                    </p>
                    <p className="font-bold">
                      {activeTab === 'birth' ? selectedRecord.mother_name : selectedRecord.cause_of_death}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-12 flex justify-between items-end px-12">
                <div className="text-center">
                  <div className="w-32 border-b border-text/20 mb-2" />
                  <p className="text-[10px] font-bold text-text/40 uppercase tracking-widest">Registrar Signature</p>
                </div>
                <div className="text-center">
                  <div className="w-32 border-b border-text/20 mb-2" />
                  <p className="text-[10px] font-bold text-text/40 uppercase tracking-widest">Hospital Seal</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
