import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  ClipboardCheck, 
  MessageSquare 
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Appointment, Patient, Doctor } from '../../types';

interface AppointmentManagementProps {
  hospitalId: number;
}

export const AppointmentManagement = ({ hospitalId }: AppointmentManagementProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newAppt, setNewAppt] = useState({
    patient_id: '',
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    reason: ''
  });

  const fetchData = async () => {
    const [apptsRes, patientsRes, doctorsRes] = await Promise.all([
      fetch(`/api/appointments?hospitalId=${hospitalId}`),
      fetch(`/api/patients?hospitalId=${hospitalId}`),
      fetch(`/api/doctors?hospitalId=${hospitalId}`)
    ]);
    setAppointments(await apptsRes.json());
    setPatients(await patientsRes.json());
    setDoctors(await doctorsRes.json());
  };

  useEffect(() => { fetchData(); }, [hospitalId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newAppt, hospital_id: hospitalId })
    });
    setShowAdd(false);
    setNewAppt({ patient_id: '', doctor_id: '', appointment_date: '', appointment_time: '', reason: '' });
    fetchData();
  };

  const updateStatus = async (id: number, status: string) => {
    await fetch(`/api/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    fetchData();
  };

  const shareToWhatsApp = (mobile: string, message: string) => {
    const url = `https://wa.me/${mobile}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text">Appointments</h2>
          <p className="text-text/60">Schedule and manage patient visits</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-all"
        >
          <Plus size={20} />
          New Appointment
        </button>
      </div>

      {showAdd && (
        <Card title="Schedule Appointment">
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select 
              className="px-4 py-2 rounded-lg border border-black/10"
              value={newAppt.patient_id}
              onChange={e => setNewAppt({...newAppt, patient_id: e.target.value})}
              required
            >
              <option value="">Select Patient</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.patient_id_str})</option>)}
            </select>
            <select 
              className="px-4 py-2 rounded-lg border border-black/10"
              value={newAppt.doctor_id}
              onChange={e => setNewAppt({...newAppt, doctor_id: e.target.value})}
              required
            >
              <option value="">Select Doctor</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.name} - {d.department}</option>)}
            </select>
            <input 
              type="date"
              className="px-4 py-2 rounded-lg border border-black/10"
              value={newAppt.appointment_date}
              onChange={e => setNewAppt({...newAppt, appointment_date: e.target.value})}
              required
            />
            <input 
              type="time"
              className="px-4 py-2 rounded-lg border border-black/10"
              value={newAppt.appointment_time}
              onChange={e => setNewAppt({...newAppt, appointment_time: e.target.value})}
              required
            />
            <textarea 
              placeholder="Reason for visit"
              className="md:col-span-2 px-4 py-2 rounded-lg border border-black/10"
              value={newAppt.reason}
              onChange={e => setNewAppt({...newAppt, reason: e.target.value})}
            />
            <div className="md:col-span-2 flex justify-end gap-2">
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-text/60">Cancel</button>
              <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg">Schedule</button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-black/5 text-xs font-bold text-text/40 uppercase tracking-widest">
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Doctor</th>
                <th className="px-4 py-3">Date & Time</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {appointments.map(a => (
                <tr key={a.id} className="text-sm hover:bg-black/[0.02] transition-colors">
                  <td className="px-4 py-3 font-medium">{a.patient_name}</td>
                  <td className="px-4 py-3">{a.doctor_name}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span>{a.appointment_date}</span>
                      <span className="text-xs text-text/40">{a.appointment_time}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={
                      a.status === 'Confirmed' ? 'success' : 
                      a.status === 'Cancelled' ? 'error' : 
                      a.status === 'Completed' ? 'info' : 'default'
                    }>
                      {a.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {a.status === 'Requested' && (
                        <button 
                          onClick={() => updateStatus(a.id, 'Confirmed')}
                          className="p-1.5 text-success hover:bg-success/10 rounded-lg transition-colors"
                          title="Confirm"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      {a.status !== 'Cancelled' && a.status !== 'Completed' && (
                        <button 
                          onClick={() => updateStatus(a.id, 'Cancelled')}
                          className="p-1.5 text-error hover:bg-error/10 rounded-lg transition-colors"
                          title="Cancel"
                        >
                          <AlertTriangle size={16} />
                        </button>
                      )}
                      {a.status === 'Confirmed' && (
                        <button 
                          onClick={() => updateStatus(a.id, 'Completed')}
                          className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Complete"
                        >
                          <ClipboardCheck size={16} />
                        </button>
                      )}
                      <button 
                        onClick={() => shareToWhatsApp('919999999999', `Hi ${a.patient_name}, this is a reminder for your appointment with Dr. ${a.doctor_name} on ${a.appointment_date} at ${a.appointment_time}.`)}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Remind on WhatsApp"
                      >
                        <MessageSquare size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
