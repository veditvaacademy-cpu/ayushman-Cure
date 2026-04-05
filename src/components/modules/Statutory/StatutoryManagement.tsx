import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  ShieldCheck, 
  FileText, 
  ClipboardCheck, 
  X 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { clsx } from 'clsx';
import { 
  StatutoryRegister 
} from '../../types';

interface StatutoryManagementProps {
  hospitalId: number;
}

export const StatutoryManagement = ({ hospitalId }: StatutoryManagementProps) => {
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

      <div className="flex gap-2 p-1 bg-bg rounded-xl w-fit overflow-x-auto max-full">
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
