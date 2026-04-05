import React, { useState, useEffect } from 'react';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Plus, X, AlertTriangle, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';
import { FireExtinguisher, FacilityMaintenance, SafetyIncident, CCTVLog } from '../../../types';

interface SafetyFacilityManagementProps {
  hospitalId: number;
}

export const SafetyFacilityManagement = ({ hospitalId }: SafetyFacilityManagementProps) => {
  const [activeSubTab, setActiveSubTab] = useState<'fire' | 'maintenance' | 'incidents' | 'cctv'>('fire');
  const [fireExtinguishers, setFireExtinguishers] = useState<FireExtinguisher[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<FacilityMaintenance[]>([]);
  const [incidents, setIncidents] = useState<SafetyIncident[]>([]);
  const [cctvLogs, setCctvLogs] = useState<CCTVLog[]>([]);
  const [showModal, setShowModal] = useState(false);

  const fetchData = async () => {
    try {
      const [fireRes, maintRes, incRes, cctvRes] = await Promise.all([
        fetch(`/api/safety/fire-extinguishers?hospitalId=${hospitalId}`),
        fetch(`/api/safety/maintenance?hospitalId=${hospitalId}`),
        fetch(`/api/safety/incidents?hospitalId=${hospitalId}`),
        fetch(`/api/safety/cctv-logs?hospitalId=${hospitalId}`)
      ]);
      
      if (fireRes.ok) setFireExtinguishers(await fireRes.json());
      if (maintRes.ok) setMaintenanceRecords(await maintRes.json());
      if (incRes.ok) setIncidents(await incRes.json());
      if (cctvRes.ok) setCctvLogs(await cctvRes.json());
    } catch (error) {
      console.error("Error fetching safety data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [hospitalId]);

  const handleAddRecord = async (data: any) => {
    let endpoint = '';
    if (activeSubTab === 'fire') endpoint = '/api/safety/fire-extinguishers';
    else if (activeSubTab === 'maintenance') endpoint = '/api/safety/maintenance';
    else if (activeSubTab === 'incidents') endpoint = '/api/safety/incidents';
    else if (activeSubTab === 'cctv') endpoint = '/api/safety/cctv-logs';

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text">Safety & Facility Management</h2>
          <p className="text-text/40">Monitor hospital safety, maintenance, and security</p>
        </div>
        <div className="flex bg-bg p-1 rounded-xl">
          <button 
            onClick={() => setActiveSubTab('fire')}
            className={clsx("px-4 py-2 rounded-lg text-sm font-bold transition-all", activeSubTab === 'fire' ? "bg-white text-primary shadow-sm" : "text-text/40 hover:text-text")}
          >
            Fire Safety
          </button>
          <button 
            onClick={() => setActiveSubTab('maintenance')}
            className={clsx("px-4 py-2 rounded-lg text-sm font-bold transition-all", activeSubTab === 'maintenance' ? "bg-white text-primary shadow-sm" : "text-text/40 hover:text-text")}
          >
            Maintenance
          </button>
          <button 
            onClick={() => setActiveSubTab('incidents')}
            className={clsx("px-4 py-2 rounded-lg text-sm font-bold transition-all", activeSubTab === 'incidents' ? "bg-white text-primary shadow-sm" : "text-text/40 hover:text-text")}
          >
            Incidents
          </button>
          <button 
            onClick={() => setActiveSubTab('cctv')}
            className={clsx("px-4 py-2 rounded-lg text-sm font-bold transition-all", activeSubTab === 'cctv' ? "bg-white text-primary shadow-sm" : "text-text/40 hover:text-text")}
          >
            CCTV Logs
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'fire' && (
          <motion.div 
            key="fire"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 gap-6"
          >
            <Card title="Fire Extinguishers & AMC" action={<button onClick={() => setShowModal(true)} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Plus size={18} /> Add Extinguisher</button>}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-black/5">
                      <th className="pb-4 font-bold text-text/40 text-xs uppercase tracking-widest">Location</th>
                      <th className="pb-4 font-bold text-text/40 text-xs uppercase tracking-widest">Type</th>
                      <th className="pb-4 font-bold text-text/40 text-xs uppercase tracking-widest">Last Service</th>
                      <th className="pb-4 font-bold text-text/40 text-xs uppercase tracking-widest">Expiry</th>
                      <th className="pb-4 font-bold text-text/40 text-xs uppercase tracking-widest">AMC Provider</th>
                      <th className="pb-4 font-bold text-text/40 text-xs uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {fireExtinguishers.map(item => (
                      <tr key={item.id} className="group hover:bg-bg/50 transition-colors">
                        <td className="py-4 font-medium text-text">{item.location}</td>
                        <td className="py-4 text-text/60">{item.type} ({item.capacity})</td>
                        <td className="py-4 text-text/60">{item.last_service_date}</td>
                        <td className="py-4 text-text/60">{item.expiry_date}</td>
                        <td className="py-4 text-text/60">{item.amc_provider}</td>
                        <td className="py-4">
                          <Badge variant={item.status === 'Functional' ? 'success' : 'alert'}>
                            {item.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {fireExtinguishers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-text/40 italic">No fire safety records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {activeSubTab === 'maintenance' && (
          <motion.div 
            key="maintenance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 gap-6"
          >
            <Card title="Facility Maintenance" action={<button onClick={() => setShowModal(true)} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Plus size={18} /> Schedule Maintenance</button>}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-black/5">
                      <th className="pb-4 font-bold text-text/40 text-xs uppercase tracking-widest">Asset</th>
                      <th className="pb-4 font-bold text-text/40 text-xs uppercase tracking-widest">Type</th>
                      <th className="pb-4 font-bold text-text/40 text-xs uppercase tracking-widest">Last Maint.</th>
                      <th className="pb-4 font-bold text-text/40 text-xs uppercase tracking-widest">Next Maint.</th>
                      <th className="pb-4 font-bold text-text/40 text-xs uppercase tracking-widest">Performed By</th>
                      <th className="pb-4 font-bold text-text/40 text-xs uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {maintenanceRecords.map(item => (
                      <tr key={item.id} className="group hover:bg-bg/50 transition-colors">
                        <td className="py-4 font-medium text-text">{item.asset_name}</td>
                        <td className="py-4 text-text/60">{item.asset_type}</td>
                        <td className="py-4 text-text/60">{item.last_maintenance_date}</td>
                        <td className="py-4 text-text/60">{item.next_maintenance_date}</td>
                        <td className="py-4 text-text/60">{item.performed_by}</td>
                        <td className="py-4">
                          <Badge variant={item.status === 'Operational' ? 'success' : 'alert'}>
                            {item.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {maintenanceRecords.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-text/40 italic">No maintenance records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {activeSubTab === 'incidents' && (
          <motion.div 
            key="incidents"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 gap-6"
          >
            <Card title="Incident / Accident Reporting" action={<button onClick={() => setShowModal(true)} className="bg-error text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><ShieldAlert size={18} /> Report Incident</button>}>
              <div className="space-y-4">
                {incidents.map(incident => (
                  <div key={incident.id} className="p-4 border border-black/5 rounded-xl hover:bg-bg transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className={clsx("w-10 h-10 rounded-lg flex items-center justify-center", 
                          incident.severity === 'Critical' ? "bg-error/10 text-error" : 
                          incident.severity === 'High' ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary")}>
                          <AlertTriangle size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-text">{incident.incident_type} at {incident.location}</h4>
                          <p className="text-xs text-text/40">{incident.incident_date} {incident.incident_time} • Reported by {incident.reported_by}</p>
                        </div>
                      </div>
                      <Badge variant={incident.status === 'Resolved' ? 'success' : 'alert'}>{incident.status}</Badge>
                    </div>
                    <p className="text-sm text-text/60 mb-3">{incident.description}</p>
                    <div className="bg-bg/50 p-3 rounded-lg text-xs">
                      <span className="font-bold text-text/40 uppercase tracking-widest mr-2">Action Taken:</span>
                      <span className="text-text/60">{incident.action_taken}</span>
                    </div>
                  </div>
                ))}
                {incidents.length === 0 && (
                  <div className="py-10 text-center text-text/40 italic">No incidents reported.</div>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {activeSubTab === 'cctv' && (
          <motion.div 
            key="cctv"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 gap-6"
          >
            <Card title="CCTV Monitoring Logs" action={<button onClick={() => setShowModal(true)} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Plus size={18} /> New Log Entry</button>}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-black/5">
                      <th className="pb-4 font-bold text-text/40 text-xs uppercase tracking-widest">Date</th>
                      <th className="pb-4 font-bold text-text/40 text-xs uppercase tracking-widest">Camera Location</th>
                      <th className="pb-4 font-bold text-text/40 text-xs uppercase tracking-widest">Checked By</th>
                      <th className="pb-4 font-bold text-text/40 text-xs uppercase tracking-widest">Status</th>
                      <th className="pb-4 font-bold text-text/40 text-xs uppercase tracking-widest">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {cctvLogs.map(log => (
                      <tr key={log.id} className="group hover:bg-bg/50 transition-colors">
                        <td className="py-4 text-text/60">{log.log_date}</td>
                        <td className="py-4 font-medium text-text">{log.camera_location}</td>
                        <td className="py-4 text-text/60">{log.checked_by}</td>
                        <td className="py-4">
                          <Badge variant={log.status === 'Normal' ? 'success' : 'alert'}>
                            {log.status}
                          </Badge>
                        </td>
                        <td className="py-4 text-text/60 italic">{log.notes}</td>
                      </tr>
                    ))}
                    {cctvLogs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-text/40 italic">No CCTV logs found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-black/5 flex justify-between items-center bg-primary text-white">
              <h3 className="text-xl font-bold">
                {activeSubTab === 'fire' ? 'Add Fire Extinguisher' : 
                 activeSubTab === 'maintenance' ? 'Schedule Maintenance' : 
                 activeSubTab === 'incidents' ? 'Report Incident' : 'New CCTV Log'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = Object.fromEntries(formData.entries());
              handleAddRecord(data);
            }} className="p-6 space-y-4">
              {activeSubTab === 'fire' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Location</label>
                      <input name="location" required className="w-full p-2 bg-bg rounded-lg mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Type</label>
                      <input name="type" required className="w-full p-2 bg-bg rounded-lg mt-1" placeholder="CO2, Dry Powder, etc." />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Capacity</label>
                      <input name="capacity" required className="w-full p-2 bg-bg rounded-lg mt-1" placeholder="5kg, 2kg, etc." />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">AMC Provider</label>
                      <input name="amc_provider" className="w-full p-2 bg-bg rounded-lg mt-1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Last Service Date</label>
                      <input type="date" name="last_service_date" required className="w-full p-2 bg-bg rounded-lg mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Expiry Date</label>
                      <input type="date" name="expiry_date" required className="w-full p-2 bg-bg rounded-lg mt-1" />
                    </div>
                  </div>
                </>
              )}

              {activeSubTab === 'maintenance' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Asset Name</label>
                      <input name="asset_name" required className="w-full p-2 bg-bg rounded-lg mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Asset Type</label>
                      <select name="asset_type" required className="w-full p-2 bg-bg rounded-lg mt-1">
                        <option value="Lift">Lift</option>
                        <option value="Electrical">Electrical</option>
                        <option value="Generator">Generator</option>
                        <option value="Plumbing">Plumbing</option>
                        <option value="HVAC">HVAC</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Last Maint. Date</label>
                      <input type="date" name="last_maintenance_date" className="w-full p-2 bg-bg rounded-lg mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Next Maint. Date</label>
                      <input type="date" name="next_maintenance_date" required className="w-full p-2 bg-bg rounded-lg mt-1" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text/40 uppercase">Performed By</label>
                    <input name="performed_by" required className="w-full p-2 bg-bg rounded-lg mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text/40 uppercase">Notes</label>
                    <textarea name="notes" className="w-full p-2 bg-bg rounded-lg mt-1 h-20" />
                  </div>
                </>
              )}

              {activeSubTab === 'incidents' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Incident Type</label>
                      <input name="incident_type" required className="w-full p-2 bg-bg rounded-lg mt-1" placeholder="Accident, Theft, etc." />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Severity</label>
                      <select name="severity" required className="w-full p-2 bg-bg rounded-lg mt-1">
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Date</label>
                      <input type="date" name="incident_date" required className="w-full p-2 bg-bg rounded-lg mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Time</label>
                      <input type="time" name="incident_time" required className="w-full p-2 bg-bg rounded-lg mt-1" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text/40 uppercase">Location</label>
                    <input name="location" required className="w-full p-2 bg-bg rounded-lg mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text/40 uppercase">Description</label>
                    <textarea name="description" required className="w-full p-2 bg-bg rounded-lg mt-1 h-20" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text/40 uppercase">Action Taken</label>
                    <textarea name="action_taken" className="w-full p-2 bg-bg rounded-lg mt-1 h-20" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text/40 uppercase">Reported By</label>
                    <input name="reported_by" required className="w-full p-2 bg-bg rounded-lg mt-1" />
                  </div>
                </>
              )}

              {activeSubTab === 'cctv' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-text/40 uppercase">Camera Location</label>
                    <input name="camera_location" required className="w-full p-2 bg-bg rounded-lg mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Log Date</label>
                      <input type="date" name="log_date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-2 bg-bg rounded-lg mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-text/40 uppercase">Status</label>
                      <select name="status" required className="w-full p-2 bg-bg rounded-lg mt-1">
                        <option value="Normal">Normal</option>
                        <option value="Issue Detected">Issue Detected</option>
                        <option value="Maintenance Required">Maintenance Required</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text/40 uppercase">Checked By</label>
                    <input name="checked_by" required className="w-full p-2 bg-bg rounded-lg mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text/40 uppercase">Notes</label>
                    <textarea name="notes" className="w-full p-2 bg-bg rounded-lg mt-1 h-20" />
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
    </div>
  );
};
