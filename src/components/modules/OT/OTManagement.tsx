import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  ShieldAlert 
} from 'lucide-react';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { 
  OTRoom, 
  OTBooking, 
  OTInventoryItem, 
  OTInfectionLog, 
  Patient, 
  Doctor 
} from '../../../types';

interface OTManagementProps {
  hospitalId: number;
}

export const OTManagement = ({ hospitalId }: OTManagementProps) => {
  const [activeSubTab, setActiveSubTab] = useState<'scheduling' | 'inventory' | 'infection' | 'billing'>('scheduling');
  const [rooms, setRooms] = useState<OTRoom[]>([]);
  const [bookings, setBookings] = useState<OTBooking[]>([]);
  const [inventory, setInventory] = useState<OTInventoryItem[]>([]);
  const [infectionLogs, setInfectionLogs] = useState<OTInfectionLog[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<OTBooking | null>(null);

  // Booking Form State
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [surgeryName, setSurgeryName] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [duration, setDuration] = useState('60');

  // Infection Log Form
  const [logRoomId, setLogRoomId] = useState('');
  const [actionType, setActionType] = useState<'Sterilization' | 'Fumigation' | 'Cleaning'>('Sterilization');
  const [performedBy, setPerformedBy] = useState('');
  const [logNotes, setLogNotes] = useState('');

  const fetchData = async () => {
    const [rRes, bRes, iRes, lRes, pRes, dRes] = await Promise.all([
      fetch(`/api/ot/rooms?hospitalId=${hospitalId}`),
      fetch(`/api/ot/bookings?hospitalId=${hospitalId}`),
      fetch(`/api/ot/inventory?hospitalId=${hospitalId}`),
      fetch(`/api/ot/infection-logs?hospitalId=${hospitalId}`),
      fetch(`/api/patients?hospitalId=${hospitalId}`),
      fetch(`/api/doctors?hospitalId=${hospitalId}`)
    ]);
    setRooms(await rRes.json());
    setBookings(await bRes.json());
    setInventory(await iRes.json());
    setInfectionLogs(await lRes.json());
    setPatients(await pRes.json());
    setDoctors(await dRes.json());
  };

  useEffect(() => { fetchData(); }, [hospitalId, activeSubTab]);

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/ot/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hospital_id: hospitalId,
        patient_id: parseInt(selectedPatientId),
        doctor_id: parseInt(selectedDoctorId),
        room_id: parseInt(selectedRoomId),
        surgery_name: surgeryName,
        scheduled_at: scheduledAt,
        duration_minutes: parseInt(duration)
      })
    });
    if (res.ok) {
      alert("Surgery Scheduled Successfully");
      setSurgeryName('');
      fetchData();
    }
  };

  const handleAddInfectionLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/ot/infection-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room_id: parseInt(logRoomId),
        action_type: actionType,
        performed_by: performedBy,
        notes: logNotes
      })
    });
    if (res.ok) {
      alert("Infection Control Log Added");
      setLogNotes('');
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      {selectedBooking ? (
        <div className="space-y-6">
          <button onClick={() => setSelectedBooking(null)} className="flex items-center gap-2 text-primary font-medium hover:underline">
            <ArrowLeft size={18} />
            Back to Schedule
          </button>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-text">{selectedBooking.surgery_name}</h2>
              <p className="text-text/60">{selectedBooking.patient_name} | {selectedBooking.doctor_name} | {selectedBooking.room_name}</p>
            </div>
            <Badge variant={selectedBooking.status === 'Scheduled' ? 'info' : 'success'}>{selectedBooking.status}</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Pre-Operative Assessment">
              <div className="space-y-4">
                <div className="p-4 bg-bg rounded-xl border border-black/5">
                  <p className="text-xs font-bold text-text/40 uppercase mb-2">Fitness Status</p>
                  <p className="text-sm font-medium">Fit for Surgery (ASA-I)</p>
                </div>
                <div className="p-4 bg-bg rounded-xl border border-black/5">
                  <p className="text-xs font-bold text-text/40 uppercase mb-2">Pre-op Vitals</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>BP: 120/80</div>
                    <div>Pulse: 72</div>
                    <div>SpO2: 98%</div>
                  </div>
                </div>
                <button className="w-full py-2 border border-primary text-primary rounded-lg text-sm font-bold">Update Assessment</button>
              </div>
            </Card>

            <Card title="Anesthesia Record">
              <div className="space-y-4">
                <div className="p-4 bg-bg rounded-xl border border-black/5">
                  <p className="text-xs font-bold text-text/40 uppercase mb-2">Anesthesia Type</p>
                  <p className="text-sm font-medium">General Anesthesia</p>
                </div>
                <div className="p-4 bg-bg rounded-xl border border-black/5">
                  <p className="text-xs font-bold text-text/40 uppercase mb-2">Medications</p>
                  <p className="text-xs text-text/60">Propofol, Fentanyl, Rocuronium</p>
                </div>
                <button className="w-full py-2 border border-primary text-primary rounded-lg text-sm font-bold">Manage Anesthesia</button>
              </div>
            </Card>

            <Card title="Intra-Operative Notes">
              <div className="space-y-4">
                <textarea className="w-full px-4 py-2 rounded-lg border border-black/10 text-sm" rows={4} placeholder="Enter procedure details..." />
                <button className="w-full bg-primary text-white py-2 rounded-lg text-sm font-bold">Save Intra-op Notes</button>
              </div>
            </Card>

            <Card title="OT Consumables Usage">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <select className="flex-1 px-3 py-2 rounded-lg border border-black/10 text-sm">
                    <option>Select Consumable...</option>
                    {inventory.map(i => <option key={i.id}>{i.name}</option>)}
                  </select>
                  <input type="number" className="w-20 px-3 py-2 rounded-lg border border-black/10 text-sm" placeholder="Qty" />
                  <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold">Add</button>
                </div>
                <div className="text-xs text-text/40 italic text-center py-4">No consumables recorded yet.</div>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-text">Operation Theatre Management</h2>
              <p className="text-text/60">Scheduling, Intra-op Records & Sterilization</p>
            </div>
            <div className="flex bg-white rounded-lg border border-black/5 p-1">
              {(['scheduling', 'inventory', 'infection', 'billing'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveSubTab(tab)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${activeSubTab === tab ? 'bg-primary text-white shadow-sm' : 'text-text/60 hover:text-text'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

      {activeSubTab === 'scheduling' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card title="OT Schedule">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-black/5">
                      <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Time</th>
                      <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Surgery</th>
                      <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Patient</th>
                      <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Surgeon</th>
                      <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Room</th>
                      <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Status</th>
                      <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {bookings.map(b => (
                      <tr key={b.id} className="hover:bg-bg/50 transition-colors">
                        <td className="px-4 py-4 text-sm">
                          <div className="font-bold">{new Date(b.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          <div className="text-[10px] text-text/40">{new Date(b.scheduled_at).toLocaleDateString()}</div>
                        </td>
                        <td className="px-4 py-4 font-medium text-text">{b.surgery_name}</td>
                        <td className="px-4 py-4 text-sm">{b.patient_name}</td>
                        <td className="px-4 py-4 text-sm">{b.doctor_name}</td>
                        <td className="px-4 py-4 text-sm text-text/60">{b.room_name}</td>
                        <td className="px-4 py-4">
                          <Badge variant={b.status === 'Scheduled' ? 'info' : b.status === 'In-Progress' ? 'alert' : 'success'}>
                            {b.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-4">
                          <button 
                            onClick={() => setSelectedBooking(b)}
                            className="text-primary hover:underline text-xs font-bold"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                    {bookings.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-text/40 italic">No surgeries scheduled</td></tr>}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
          <div className="space-y-6">
            <Card title="Schedule New Surgery">
              <form onSubmit={handleCreateBooking} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-text/40 uppercase">Patient</label>
                  <select className="w-full px-4 py-2 rounded-lg border border-black/10 mt-1" value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)} required>
                    <option value="">Select Patient...</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.patient_id_str})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-text/40 uppercase">Surgeon</label>
                  <select className="w-full px-4 py-2 rounded-lg border border-black/10 mt-1" value={selectedDoctorId} onChange={e => setSelectedDoctorId(e.target.value)} required>
                    <option value="">Select Doctor...</option>
                    {doctors.map(d => <option key={d.id} value={d.id}>{d.name} - {d.department}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-text/40 uppercase">OT Room</label>
                  <select className="w-full px-4 py-2 rounded-lg border border-black/10 mt-1" value={selectedRoomId} onChange={e => setSelectedRoomId(e.target.value)} required>
                    <option value="">Select Room...</option>
                    {rooms.map(r => <option key={r.id} value={r.id}>{r.name} ({r.type})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-text/40 uppercase">Surgery Name</label>
                  <input className="w-full px-4 py-2 rounded-lg border border-black/10 mt-1" value={surgeryName} onChange={e => setSurgeryName(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-text/40 uppercase">Date & Time</label>
                    <input type="datetime-local" className="w-full px-4 py-2 rounded-lg border border-black/10 mt-1" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} required />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-text/40 uppercase">Duration (Min)</label>
                    <input type="number" className="w-full px-4 py-2 rounded-lg border border-black/10 mt-1" value={duration} onChange={e => setDuration(e.target.value)} required />
                  </div>
                </div>
                <button type="submit" className="w-full bg-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                  <Calendar size={18} />
                  Confirm Schedule
                </button>
              </form>
            </Card>
          </div>
        </div>
      )}

      {activeSubTab === 'inventory' && (
        <Card title="OT Specific Inventory">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-black/5">
                  <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Item Name</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Category</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Stock</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {inventory.map(i => (
                  <tr key={i.id} className="hover:bg-bg/50 transition-colors">
                    <td className="px-4 py-4 font-medium text-text">{i.name}</td>
                    <td className="px-4 py-4 text-sm text-text/60">{i.category}</td>
                    <td className="px-4 py-4 text-sm font-bold">
                      <span className={i.current_stock < i.min_stock_level ? 'text-error' : 'text-success'}>
                        {i.current_stock} {i.uom}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={i.current_stock > 0 ? 'success' : 'alert'}>
                        {i.current_stock > 0 ? 'In Stock' : 'Out of Stock'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeSubTab === 'infection' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card title="Infection Control Logs">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-black/5">
                      <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Date & Time</th>
                      <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Room</th>
                      <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Action</th>
                      <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Performed By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {infectionLogs.map(l => (
                      <tr key={l.id}>
                        <td className="px-4 py-4 text-sm">{new Date(l.performed_at).toLocaleString()}</td>
                        <td className="px-4 py-4 font-medium">{l.room_name}</td>
                        <td className="px-4 py-4">
                          <Badge variant={l.action_type === 'Sterilization' ? 'success' : 'info'}>{l.action_type}</Badge>
                        </td>
                        <td className="px-4 py-4 text-sm text-text/60">{l.performed_by}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
          <Card title="Log New Action">
            <form onSubmit={handleAddInfectionLog} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text/40 uppercase">OT Room</label>
                <select className="w-full px-4 py-2 rounded-lg border border-black/10 mt-1" value={logRoomId} onChange={e => setLogRoomId(e.target.value)} required>
                  <option value="">Select Room...</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-text/40 uppercase">Action Type</label>
                <select className="w-full px-4 py-2 rounded-lg border border-black/10 mt-1" value={actionType} onChange={e => setActionType(e.target.value as any)} required>
                  <option value="Sterilization">Sterilization</option>
                  <option value="Fumigation">Fumigation</option>
                  <option value="Cleaning">Cleaning</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-text/40 uppercase">Performed By</label>
                <input className="w-full px-4 py-2 rounded-lg border border-black/10 mt-1" value={performedBy} onChange={e => setPerformedBy(e.target.value)} required />
              </div>
              <div>
                <label className="text-xs font-semibold text-text/40 uppercase">Notes</label>
                <textarea className="w-full px-4 py-2 rounded-lg border border-black/10 mt-1" rows={3} value={logNotes} onChange={e => setLogNotes(e.target.value)} />
              </div>
              <button type="submit" className="w-full bg-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                <ShieldAlert size={18} />
                Save Log
              </button>
            </form>
          </Card>
        </div>
      )}

      {activeSubTab === 'billing' && (
        <Card title="OT Consumables & Billing">
          <div className="text-center py-12 text-text/40 italic">
            Select a completed surgery to review consumables usage and generate billing.
          </div>
        </Card>
      )}
    </>
  )}
</div>
);
};
