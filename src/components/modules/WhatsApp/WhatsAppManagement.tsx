import React, { useState, useEffect } from 'react';
import { 
  Gift, 
  ShoppingCart, 
  Cake, 
  AlertTriangle, 
  Bell 
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { 
  WhatsAppLog, 
  Patient 
} from '../../types';

interface WhatsAppManagementProps {
  hospitalId: number;
}

export const WhatsAppManagement = ({ hospitalId }: WhatsAppManagementProps) => {
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

  useEffect(() => { fetchData(); }, [hospitalId]);

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
