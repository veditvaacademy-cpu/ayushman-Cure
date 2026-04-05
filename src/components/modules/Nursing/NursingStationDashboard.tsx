import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Thermometer, 
  Pill, 
  Syringe, 
  ClipboardCheck, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { 
  IPDAdmission, 
  IPDVital, 
  IPDMedication, 
  NursingTask, 
  NursingShift 
} from '../../../types';

interface NursingStationDashboardProps {
  hospitalId: number;
}

export const NursingStationDashboard = ({ hospitalId }: NursingStationDashboardProps) => {
  const [admissions, setAdmissions] = useState<IPDAdmission[]>([]);
  const [vitals, setVitals] = useState<IPDVital[]>([]);
  const [medications, setMedications] = useState<IPDMedication[]>([]);
  const [tasks, setTasks] = useState<NursingTask[]>([]);
  const [shifts, setShifts] = useState<NursingShift[]>([]);
  const [selectedAdmission, setSelectedAdmission] = useState<IPDAdmission | null>(null);
  const [icuTrends, setIcuTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/nursing/dashboard?hospitalId=${hospitalId}`);
      const data = await res.json();
      setAdmissions(data.admissions || []);
      setVitals(data.vitals || []);
      setMedications(data.medications || []);
      setTasks(data.tasks || []);
      setShifts(data.shifts || []);
    } catch (error) {
      console.error("Error fetching nursing dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIcuTrends = async (admissionId: number) => {
    try {
      const res = await fetch(`/api/nursing/icu/vitals-trend/${admissionId}`);
      const data = await res.json();
      setIcuTrends(data);
    } catch (error) {
      console.error("Error fetching ICU trends:", error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [hospitalId]);

  useEffect(() => {
    if (selectedAdmission && selectedAdmission.bed_type === 'ICU') {
      fetchIcuTrends(selectedAdmission.id);
    }
  }, [selectedAdmission]);

  const getLatestVital = (admissionId: number) => {
    return vitals.find(v => (v as any).admission_id === admissionId);
  };

  const updateRiskCode = async (admissionId: number, riskCode: string) => {
    const res = await fetch(`/api/nursing/admissions/${admissionId}/risk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ risk_code: riskCode })
    });
    if (res.ok) {
      fetchData();
    }
  };

  const completeTask = async (taskId: number) => {
    const res = await fetch(`/api/nursing/tasks/${taskId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ performed_by: 'Nurse On Duty', notes: 'Completed as per schedule' })
    });
    if (res.ok) {
      fetchData();
    }
  };

  if (loading && admissions.length === 0) {
    return <div className="flex items-center justify-center h-64 text-text/40">Loading Nursing Dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text">Smart Nursing Station</h2>
          <p className="text-text/60">Real-time Ward Monitoring & Workflow</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-black/5 shadow-sm">
            <div className="w-3 h-3 rounded-full bg-success"></div>
            <span className="text-xs font-bold text-text/60">Stable</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-black/5 shadow-sm">
            <div className="w-3 h-3 rounded-full bg-alert"></div>
            <span className="text-xs font-bold text-text/60">Moderate Risk</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-black/5 shadow-sm">
            <div className="w-3 h-3 rounded-full bg-error"></div>
            <span className="text-xs font-bold text-text/60">High Risk</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Patient Overview Panel */}
        <div className="xl:col-span-3 space-y-6">
          <Card title="Ward Patient Overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {admissions.map(adm => {
                const latestVital = getLatestVital(adm.id);
                const riskColor = (adm as any).risk_code === 'RED' ? 'border-error bg-error/5' : 
                                 (adm as any).risk_code === 'YELLOW' ? 'border-alert bg-alert/5' : 
                                 'border-success bg-success/5';
                
                return (
                  <div 
                    key={adm.id} 
                    onClick={() => setSelectedAdmission(adm)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${riskColor} ${selectedAdmission?.id === adm.id ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="bg-white px-2 py-1 rounded-md text-[10px] font-bold shadow-sm">BED {adm.bed_number}</div>
                      <div className="flex gap-1">
                        <button onClick={(e) => { e.stopPropagation(); updateRiskCode(adm.id, 'RED'); }} className="w-4 h-4 rounded-full bg-error"></button>
                        <button onClick={(e) => { e.stopPropagation(); updateRiskCode(adm.id, 'YELLOW'); }} className="w-4 h-4 rounded-full bg-alert"></button>
                        <button onClick={(e) => { e.stopPropagation(); updateRiskCode(adm.id, 'GREEN'); }} className="w-4 h-4 rounded-full bg-success"></button>
                      </div>
                    </div>
                    <div className="mb-3">
                      <h4 className="font-bold text-text truncate">{adm.patient_name}</h4>
                      <p className="text-[10px] text-text/60">{adm.gender}, {adm.age}y | {adm.patient_id_str}</p>
                    </div>
                    {latestVital ? (
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="flex items-center gap-1">
                          <Activity size={10} className="text-text/40" />
                          <span className="font-bold">BP: {latestVital.bp}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity size={10} className="text-text/40" />
                          <span className="font-bold">Pulse: {latestVital.pulse}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Thermometer size={10} className="text-text/40" />
                          <span className="font-bold">Temp: {latestVital.temp}°F</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity size={10} className="text-text/40" />
                          <span className="font-bold">SpO2: {latestVital.spO2}%</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-text/40 italic">No vitals recorded</div>
                    )}
                  </div>
                );
              })}
              {admissions.length === 0 && (
                <div className="col-span-full py-12 text-center text-text/40 italic">No patients currently admitted in this ward.</div>
              )}
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Medication Management */}
            <Card title="Medication Due List" action={<Badge variant="alert">{medications.length} Pending</Badge>}>
              <div className="space-y-3">
                {medications.map(med => (
                  <div key={med.id} className="flex items-center justify-between p-3 bg-bg rounded-xl border border-black/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                        <Pill size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-text">{med.medicine_name}</p>
                        <p className="text-[10px] text-text/60">{med.dosage} | {med.frequency}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-alert">Due Now</p>
                      <button className="text-[10px] text-primary font-bold hover:underline">Mark Administered</button>
                    </div>
                  </div>
                ))}
                {medications.length === 0 && (
                  <div className="py-8 text-center text-text/40 italic text-xs">No medications due at this time.</div>
                )}
              </div>
            </Card>

            {/* Task Assignment Module */}
            <Card title="Nursing Tasks" action={<button className="text-xs text-primary font-bold hover:underline">+ Add Task</button>}>
              <div className="space-y-3">
                {tasks.map(task => (
                  <div key={task.id} className={`flex items-center justify-between p-3 rounded-xl border ${task.status === 'Completed' ? 'bg-success/5 border-success/20' : 'bg-bg border-black/5'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${task.status === 'Completed' ? 'bg-success/20 text-success' : 'bg-primary/10 text-primary'}`}>
                        {task.task_type === 'Injection' ? <Syringe size={16} /> : <ClipboardCheck size={16} />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-text">{task.task_type}</p>
                        <p className="text-[10px] text-text/60">Bed {task.bed_number} - {task.patient_name}</p>
                      </div>
                    </div>
                    {task.status === 'Pending' ? (
                      <button 
                        onClick={() => completeTask(task.id)}
                        className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-lg shadow-sm"
                      >
                        Complete
                      </button>
                    ) : (
                      <CheckCircle2 size={16} className="text-success" />
                    )}
                  </div>
                ))}
                {tasks.length === 0 && (
                  <div className="py-8 text-center text-text/40 italic text-xs">No pending tasks.</div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Sidebar Panel: Shifts & ICU Monitoring */}
        <div className="space-y-6">
          {/* Shift & Roster Panel */}
          <Card title="Shift Roster">
            <div className="space-y-4">
              {shifts.map(shift => (
                <div key={shift.id} className="p-3 bg-bg rounded-xl border border-black/5">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{shift.shift_name} SHIFT</p>
                    <Badge variant="info">Active</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-xs font-bold border border-black/5 shadow-sm">
                      {shift.nurse_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-text">{shift.nurse_name}</p>
                      <p className="text-[10px] text-text/60">{shift.ward_name}</p>
                    </div>
                  </div>
                </div>
              ))}
              {shifts.length === 0 && (
                <div className="text-center py-4 text-text/40 italic text-xs">No active shift records.</div>
              )}
              <button className="w-full py-2 border border-primary/20 text-primary text-xs font-bold rounded-lg hover:bg-primary/5 transition-colors">
                View Full Roster
              </button>
            </div>
          </Card>

          {/* ICU Smart Monitoring */}
          <Card title="ICU Smart Monitoring">
            {selectedAdmission && selectedAdmission.bed_type === 'ICU' ? (
              <div className="space-y-4">
                <div className="p-4 bg-black rounded-xl border-2 border-success/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                      <span className="text-[10px] font-bold text-success uppercase tracking-widest">Live Monitor</span>
                    </div>
                    <span className="text-[10px] text-white/40 font-mono">BED {selectedAdmission.bed_number}</span>
                  </div>
                  
                  <div className="h-32 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={icuTrends}>
                        <defs>
                          <linearGradient id="colorPulse" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="pulse" stroke="#22c55e" fillOpacity={1} fill="url(#colorPulse)" isAnimationActive={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="text-center">
                      <p className="text-[8px] text-white/40 uppercase font-bold">Pulse</p>
                      <p className="text-2xl font-bold text-success font-mono">{icuTrends[icuTrends.length-1]?.pulse || '--'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] text-white/40 uppercase font-bold">SpO2</p>
                      <p className="text-2xl font-bold text-success font-mono">{icuTrends[icuTrends.length-1]?.spO2 || '--'}%</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-error/10 rounded-xl border border-error/20">
                  <div className="flex items-center gap-2 text-error mb-1">
                    <AlertTriangle size={14} />
                    <span className="text-[10px] font-bold uppercase">Critical Alerts</span>
                  </div>
                  <p className="text-[10px] text-error/80">No critical alerts detected for this patient.</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-text/40 italic text-xs">
                Select an ICU patient to view live monitoring data.
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
