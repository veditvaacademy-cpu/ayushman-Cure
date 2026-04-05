import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  HeartPulse, 
  Zap, 
  Package, 
  Truck, 
  Plus, 
  LayoutGrid, 
  Wind, 
  Thermometer, 
  AlertTriangle 
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { clsx } from 'clsx';
import { 
  EmergencyPatient, 
  ICUEquipment, 
  CrashCartItem, 
  AmbulanceBooking, 
  ICUVitals, 
  TriageLevel 
} from '../../types';

interface EmergencyManagementProps {
  hospitalId: number;
}

export const EmergencyManagement = ({ hospitalId }: EmergencyManagementProps) => {
  const [activeTab, setActiveTab] = useState<'triage' | 'icu' | 'equipment' | 'crash-cart'>('triage');
  const [patients, setPatients] = useState<EmergencyPatient[]>([]);
  const [incomingAmbulances, setIncomingAmbulances] = useState<AmbulanceBooking[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<EmergencyPatient | null>(null);
  const [vitalsHistory, setVitalsHistory] = useState<ICUVitals[]>([]);
  const [equipment, setEquipment] = useState<ICUEquipment[]>([]);
  const [crashCart, setCrashCart] = useState<CrashCartItem[]>([]);
  const [showQuickReg, setShowQuickReg] = useState(false);
  const [showNewEquipment, setShowNewEquipment] = useState(false);
  const [eqName, setEqName] = useState('');
  const [eqType, setEqType] = useState('Ventilator');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, eRes, cRes, aRes] = await Promise.all([
        fetch(`/api/emergency/patients?hospitalId=${hospitalId}`),
        fetch(`/api/icu/equipment?hospitalId=${hospitalId}`),
        fetch(`/api/icu/crash-cart?hospitalId=${hospitalId}`),
        fetch(`/api/ambulances/bookings?hospitalId=${hospitalId}`)
      ]);
      setPatients(await pRes.json());
      setEquipment(await eRes.json());
      setCrashCart(await cRes.json());
      const ambData = await aRes.json();
      setIncomingAmbulances(ambData.filter((b: any) => b.status === 'Enroute' || b.status === 'Assigned'));
    } catch (error) {
      console.error("Error fetching emergency data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [hospitalId]);

  useEffect(() => {
    if (selectedPatient) {
      const fetchVitals = async () => {
        const res = await fetch(`/api/icu/vitals/${selectedPatient.id}`);
        const data = await res.json();
        setVitalsHistory(data.reverse());
      };
      fetchVitals();
      const interval = setInterval(fetchVitals, 5000); // Live vitals simulation
      return () => clearInterval(interval);
    }
  }, [selectedPatient]);

  const handleQuickRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      hospital_id: hospitalId,
      patient_name: formData.get('patient_name'),
      age: parseInt(formData.get('age') as string),
      gender: formData.get('gender'),
      chief_complaint: formData.get('chief_complaint'),
      triage_level: formData.get('triage_level')
    };

    const res = await fetch('/api/emergency/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      setShowQuickReg(false);
      fetchData();
    }
  };

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/icu/equipment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hospital_id: hospitalId,
        name: eqName,
        type: eqType,
        status: 'Available',
        last_service_date: new Date().toISOString()
      })
    });
    setShowNewEquipment(false);
    setEqName('');
    fetchData();
  };

  const simulateVitals = async () => {
    if (!selectedPatient) return;
    const lastVitals = vitalsHistory[vitalsHistory.length - 1] || { hr: 80, bp_sys: 120, bp_dia: 80, spo2: 98, temp: 37 };
    
    const newVitals = {
      patient_id: selectedPatient.id,
      hr: Math.max(40, Math.min(180, lastVitals.hr + (Math.random() * 10 - 5))),
      bp_sys: Math.max(80, Math.min(200, lastVitals.bp_sys + (Math.random() * 6 - 3))),
      bp_dia: Math.max(50, Math.min(120, lastVitals.bp_dia + (Math.random() * 4 - 2))),
      spo2: Math.max(70, Math.min(100, lastVitals.spo2 + (Math.random() * 2 - 1))),
      temp: Math.max(35, Math.min(41, lastVitals.temp + (Math.random() * 0.4 - 0.2)))
    };

    await fetch('/api/icu/vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newVitals)
    });
  };

  const getTriageColor = (level: TriageLevel) => {
    switch (level) {
      case 'Red': return 'bg-red-500 text-white';
      case 'Yellow': return 'bg-yellow-400 text-black';
      case 'Green': return 'bg-emerald-500 text-white';
      case 'Black': return 'bg-slate-900 text-white';
      default: return 'bg-slate-200 text-slate-600';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Emergency & ICU Management</h2>
          <p className="text-slate-500">Real-time triage and critical care monitoring</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowNewEquipment(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-lg"
          >
            <Zap size={18} />
            Add Equipment
          </button>
          <button 
            onClick={() => setShowQuickReg(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
          >
            <Plus size={18} />
            Quick Registration
          </button>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {[
          { id: 'triage', label: 'Triage Board', icon: Activity },
          { id: 'icu', label: 'ICU Monitoring', icon: HeartPulse },
          { id: 'equipment', label: 'Life Support', icon: Zap },
          { id: 'crash-cart', label: 'Crash Cart', icon: Package }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === tab.id ? "bg-white text-red-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'triage' && (
        <div className="space-y-6">
          {incomingAmbulances.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-4 text-red-600">
                <div className="p-2 bg-red-600 text-white rounded-lg"><Truck size={24} /></div>
                <div>
                  <h4 className="font-bold uppercase tracking-wider">Incoming Ambulance Alert</h4>
                  <p className="text-xs font-medium">{incomingAmbulances.length} vehicle(s) currently enroute</p>
                </div>
              </div>
              <div className="flex gap-2">
                {incomingAmbulances.map(amb => (
                  <div key={amb.id} className="px-3 py-1 bg-white border border-red-200 rounded-lg text-[10px] font-bold text-red-600 shadow-sm">
                    {amb.vehicle_number} • {amb.pickup_location}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {(['Red', 'Yellow', 'Green', 'Black'] as TriageLevel[]).map(level => (
            <div key={level} className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
              <div className={clsx("px-4 py-2 font-bold text-sm uppercase tracking-wider flex justify-between items-center", getTriageColor(level))}>
                {level} Priority
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  {patients.filter(p => p.triage_level === level).length}
                </span>
              </div>
              <div className="p-3 space-y-3 min-h-[400px]">
                {patients.filter(p => p.triage_level === level).map(patient => (
                  <motion.div
                    layoutId={`patient-${patient.id}`}
                    key={patient.id}
                    onClick={() => { setSelectedPatient(patient); setActiveTab('icu'); }}
                    className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm cursor-pointer hover:border-red-300 transition-colors group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-slate-900 group-hover:text-red-600 transition-colors">{patient.patient_name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(patient.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3 italic">"{patient.chief_complaint}"</p>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 rounded-full text-slate-600">
                        {patient.age}y • {patient.gender}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
          </div>
        </div>
      )}

      {activeTab === 'icu' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-900">Patient List</h3>
                <div className="flex items-center gap-2 text-xs text-red-600 font-bold animate-pulse">
                  <Activity size={12} />
                  LIVE
                </div>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                <div 
                  onClick={() => setSelectedPatient(null)}
                  className={clsx(
                    "p-4 border-b border-slate-50 cursor-pointer transition-colors flex items-center gap-4",
                    !selectedPatient ? "bg-slate-900 text-white" : "hover:bg-slate-50"
                  )}
                >
                  <LayoutGrid size={16} />
                  <div className="flex-1">
                    <p className="font-bold text-sm">Central Monitoring</p>
                    <p className={clsx("text-[10px]", !selectedPatient ? "text-slate-400" : "text-slate-500")}>All active patients</p>
                  </div>
                </div>
                {patients.filter(p => p.status !== 'Discharged').map(p => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPatient(p)}
                    className={clsx(
                      "p-4 border-b border-slate-50 cursor-pointer transition-colors flex items-center gap-4",
                      selectedPatient?.id === p.id ? "bg-red-50 border-l-4 border-l-red-500" : "hover:bg-slate-50"
                    )}
                  >
                    <div className={clsx("w-3 h-3 rounded-full shrink-0", getTriageColor(p.triage_level))} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 truncate">{p.patient_name}</p>
                      <p className="text-xs text-slate-500">{p.age}y • {p.gender}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            {!selectedPatient ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {patients.filter(p => p.status !== 'Discharged').map(p => (
                  <div key={p.id} className="bg-slate-900 text-white rounded-2xl p-4 border border-white/10 shadow-xl">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold truncate max-w-[150px]">{p.patient_name}</h4>
                        <p className="text-[10px] text-slate-400">ID: EM-{p.id} • {p.triage_level}</p>
                      </div>
                      <div className={clsx("w-2 h-2 rounded-full animate-ping", getTriageColor(p.triage_level))} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                        <p className="text-[8px] text-slate-500 font-bold uppercase">HR</p>
                        <p className="text-xl font-mono font-bold text-red-400">{p.vitals_hr || '--'}</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                        <p className="text-[8px] text-slate-500 font-bold uppercase">SpO2</p>
                        <p className="text-xl font-mono font-bold text-emerald-400">{p.vitals_spo2 || '--'}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <HeartPulse size={120} />
                  </div>
                  <div className="relative z-10 flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={clsx("px-2 py-0.5 rounded text-[10px] font-bold uppercase", getTriageColor(selectedPatient.triage_level))}>
                          {selectedPatient.triage_level} PRIORITY
                        </span>
                        <h2 className="text-2xl font-bold">{selectedPatient.patient_name}</h2>
                      </div>
                      <p className="text-slate-400 text-sm">Age: {selectedPatient.age} | Gender: {selectedPatient.gender} | ID: EM-{selectedPatient.id}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={simulateVitals}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-xs transition-colors"
                      >
                        Simulate Reading
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                    {[
                      { label: 'HEART RATE', value: vitalsHistory[vitalsHistory.length-1]?.hr || '--', unit: 'BPM', color: 'text-red-400', icon: Activity },
                      { label: 'SpO2', value: vitalsHistory[vitalsHistory.length-1]?.spo2 || '--', unit: '%', color: 'text-emerald-400', icon: Wind },
                      { label: 'BP (SYS/DIA)', value: vitalsHistory[vitalsHistory.length-1] ? `${vitalsHistory[vitalsHistory.length-1].bp_sys}/${vitalsHistory[vitalsHistory.length-1].bp_dia}` : '--/--', unit: 'mmHg', color: 'text-blue-400', icon: Zap },
                      { label: 'TEMP', value: vitalsHistory[vitalsHistory.length-1]?.temp?.toFixed(1) || '--', unit: '°C', color: 'text-orange-400', icon: Thermometer }
                    ].map(stat => (
                      <div key={stat.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-2 mb-1 opacity-60">
                          <stat.icon size={12} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">{stat.label}</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className={clsx("text-2xl font-mono font-bold", stat.color)}>{stat.value}</span>
                          <span className="text-[10px] text-slate-500">{stat.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Activity size={16} className="text-red-500" />
                      Heart Rate Trend
                    </h4>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={vitalsHistory}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="recorded_at" hide />
                          <YAxis domain={['dataMin - 10', 'dataMax + 10']} hide />
                          <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            labelFormatter={(val) => new Date(val).toLocaleTimeString()}
                          />
                          <Line type="monotone" dataKey="hr" stroke="#ef4444" strokeWidth={2} dot={false} animationDuration={300} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Wind size={16} className="text-emerald-500" />
                      SpO2 Trend
                    </h4>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={vitalsHistory}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="recorded_at" hide />
                          <YAxis domain={[70, 100]} hide />
                          <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            labelFormatter={(val) => new Date(val).toLocaleTimeString()}
                          />
                          <Line type="monotone" dataKey="spo2" stroke="#10b981" strokeWidth={2} dot={false} animationDuration={300} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === 'equipment' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {equipment.map(item => (
            <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className={clsx(
                  "p-2 rounded-xl",
                  item.status === 'Available' ? "bg-emerald-50 text-emerald-600" : 
                  item.status === 'In Use' ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"
                )}>
                  {item.type === 'Ventilator' ? <Wind size={20} /> : 
                   item.type === 'Monitor' ? <Activity size={20} /> : 
                   item.type === 'Defibrillator' ? <Zap size={20} /> : <HeartPulse size={20} />}
                </div>
                <span className={clsx(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                  item.status === 'Available' ? "bg-emerald-100 text-emerald-700" : 
                  item.status === 'In Use' ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                )}>
                  {item.status}
                </span>
              </div>
              <h4 className="font-bold text-slate-900 mb-1">{item.name}</h4>
              <p className="text-xs text-slate-500 mb-4">{item.type}</p>
              <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                <div className="text-[10px] text-slate-400">
                  Last Service: {new Date(item.last_service_date).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'crash-cart' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-900">Crash Cart Inventory</h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1 text-xs text-orange-600 font-medium">
                <AlertTriangle size={12} />
                {crashCart.filter(i => i.quantity <= i.min_quantity).length} Low Stock Items
              </span>
            </div>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-6 py-3">Item Name</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Stock Level</th>
                <th className="px-6 py-3">Expiry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {crashCart.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900 text-sm">{item.item_name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-600">{item.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={clsx(
                            "h-full transition-all",
                            item.quantity <= item.min_quantity ? "bg-orange-500" : "bg-emerald-500"
                          )}
                          style={{ width: `${Math.min(100, (item.quantity / (item.min_quantity * 2)) * 100)}%` }}
                        />
                      </div>
                      <span className={clsx(
                        "text-xs font-mono font-bold",
                        item.quantity <= item.min_quantity ? "text-orange-600" : "text-slate-600"
                      )}>
                        {item.quantity}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-500">{new Date(item.expiry_date).toLocaleDateString()}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
