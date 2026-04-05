import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Printer, 
  ArrowLeft, 
  Bed, 
  Microscope, 
  ChevronRight 
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { PatientOverview } from '../modules/Patients/PatientsManagement';

interface DoctorDashboardProps {
  hospitalId: number;
}

export const DoctorDashboard = ({ hospitalId }: DoctorDashboardProps) => {
  const [visits, setVisits] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);

  useEffect(() => {
    const fetchVisits = async () => {
      const res = await fetch(`/api/opd/visits?hospitalId=${hospitalId}`);
      setVisits(await res.json());
    };
    fetchVisits();
  }, [hospitalId]);

  if (selectedPatientId) {
    return <PatientOverview patientId={selectedPatientId} hospitalId={hospitalId} onBack={() => setSelectedPatientId(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Today's OPD Appointments" className="lg:col-span-2" action={
          <div className="flex gap-2">
            <button className="p-1.5 hover:bg-black/5 rounded-lg transition-colors"><Search size={16} className="text-text/40" /></button>
            <button className="p-1.5 hover:bg-black/5 rounded-lg transition-colors"><Printer size={16} className="text-text/40" /></button>
          </div>
        }>
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-black/2 border-y border-black/5">
                  <th className="px-6 py-3 text-[10px] font-black text-text/40 uppercase tracking-widest">Token</th>
                  <th className="px-6 py-3 text-[10px] font-black text-text/40 uppercase tracking-widest">Patient Name</th>
                  <th className="px-6 py-3 text-[10px] font-black text-text/40 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-3 text-[10px] font-black text-text/40 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {visits.map((visit, i) => (
                  <tr 
                    key={i} 
                    className="hover:bg-primary/5 transition-colors group cursor-pointer"
                    onClick={() => setSelectedPatientId(visit.patient_id)}
                  >
                    <td className="px-6 py-4">
                      <span className="text-xs font-black text-text bg-black/5 px-2 py-1 rounded-md">OPD-{visit.token_number}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-bold text-text">{visit.patient_name}</p>
                        <p className="text-[10px] text-text/40 font-bold uppercase">{new Date(visit.visit_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={visit.status === 'Waiting' ? 'alert' : 'success'}>{visit.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 opacity-0 group-hover:opacity-100 transition-all">
                        <ArrowLeft size={14} className="rotate-180" />
                      </button>
                    </td>
                  </tr>
                ))}
                {visits.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-text/30 italic">No appointments today</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-6">
          <Card title="e-Prescription Quick Panel" className="bg-primary text-white border-none shadow-xl shadow-primary/20">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={16} />
                <input 
                  type="text" 
                  placeholder="Patient ID or Name..." 
                  className="w-full pl-10 pr-4 py-3 bg-white/10 rounded-2xl border border-white/20 text-sm focus:outline-none focus:bg-white/20 transition-all placeholder:text-white/40"
                />
              </div>
              <button className="w-full py-4 bg-white text-primary rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg">
                Start New Prescription
              </button>
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest opacity-60">
                <span>Recent: P-2045</span>
                <span>Recent: P-2044</span>
              </div>
            </div>
          </Card>

          <Card title="Clinical Tasks">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-accent/5 rounded-2xl border border-accent/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/20 rounded-lg text-accent"><Bed size={18} /></div>
                  <div>
                    <p className="text-sm font-black text-text">IPD Rounds Pending</p>
                    <p className="text-[10px] text-text/40 font-bold">12 Patients to visit</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-text/20" />
              </div>

              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-2xl border border-primary/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg text-primary"><Microscope size={18} /></div>
                  <div>
                    <p className="text-sm font-black text-text">New Test Results</p>
                    <p className="text-[10px] text-text/40 font-bold">5 Critical findings</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-text/20" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
