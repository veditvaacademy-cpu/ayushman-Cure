import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Bed, 
  LogOut, 
  ShieldAlert, 
  TrendingUp, 
  ChevronRight, 
  Pill, 
  Microscope, 
  MessageSquare 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { PatientOverview } from '../modules/Patients/PatientsManagement';

interface HospitalAdminDashboardProps {
  hospitalId: number;
}

export const HospitalAdminDashboard = ({ hospitalId }: HospitalAdminDashboardProps) => {
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [recentAdmissions, setRecentAdmissions] = useState<any[]>([]);

  useEffect(() => {
    const fetchAdmissions = async () => {
      const res = await fetch(`/api/ipd/admissions?hospitalId=${hospitalId}`);
      setRecentAdmissions((await res.json()).slice(0, 5));
    };
    fetchAdmissions();
  }, [hospitalId]);

  if (selectedPatientId) {
    return <PatientOverview patientId={selectedPatientId} hospitalId={hospitalId} onBack={() => setSelectedPatientId(null)} />;
  }

  const revenueData = [
    { name: 'Mon', revenue: 45000, opd: 120, ipd: 15 },
    { name: 'Tue', revenue: 52000, opd: 145, ipd: 18 },
    { name: 'Wed', revenue: 48000, opd: 130, ipd: 12 },
    { name: 'Thu', revenue: 61000, opd: 160, ipd: 22 },
    { name: 'Fri', revenue: 55000, opd: 150, ipd: 20 },
    { name: 'Sat', revenue: 38000, opd: 90, ipd: 10 },
    { name: 'Sun', revenue: 25000, opd: 40, ipd: 5 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-primary">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-xl"><Users size={24} /></div>
            <div>
              <p className="text-xs text-text/40 font-bold uppercase tracking-wider">Today's OPD / IPD</p>
              <h4 className="text-2xl font-black text-text">142 / 24</h4>
              <p className="text-[10px] text-success font-bold flex items-center gap-1 mt-1">
                <TrendingUp size={10} /> +12% from yesterday
              </p>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-accent">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-accent/10 text-accent rounded-xl"><Bed size={24} /></div>
            <div>
              <p className="text-xs text-text/40 font-bold uppercase tracking-wider">Bed Occupancy</p>
              <h4 className="text-2xl font-black text-text">82%</h4>
              <p className="text-[10px] text-text/40 font-bold mt-1">42 / 50 Beds Occupied</p>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-warning">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-warning/10 text-warning rounded-xl"><LogOut size={24} /></div>
            <div>
              <p className="text-xs text-text/40 font-bold uppercase tracking-wider">Pending Discharges</p>
              <h4 className="text-2xl font-black text-text">08</h4>
              <p className="text-[10px] text-warning font-bold mt-1">3 Critical Approvals</p>
            </div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-error">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-error/10 text-error rounded-xl"><ShieldAlert size={24} /></div>
            <div>
              <p className="text-xs text-text/40 font-bold uppercase tracking-wider">Emergency Cases</p>
              <h4 className="text-2xl font-black text-text">03</h4>
              <p className="text-[10px] text-error font-bold mt-1">Immediate Attention Required</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Revenue & Patient Flow Analytics" className="lg:col-span-2">
          <div className="h-[350px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#999' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#999' }}
                  tickFormatter={(value) => `₹${value/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8f8f8' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '20px' }} />
                <Bar dataKey="revenue" name="Revenue (₹)" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="opd" name="OPD Count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="space-y-6">
          <Card title="Recent Patient Admissions">
            <div className="space-y-4">
              {recentAdmissions.map((adm, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between p-3 bg-bg/50 rounded-2xl border border-black/5 hover:border-primary/20 transition-all cursor-pointer group"
                  onClick={() => setSelectedPatientId(adm.patient_id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {adm.patient_name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-black text-text">{adm.patient_name}</p>
                      <p className="text-[10px] text-text/40 font-bold uppercase">{adm.ward_name} - {adm.bed_number}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-text/20 group-hover:text-primary transition-colors" />
                </div>
              ))}
              {recentAdmissions.length === 0 && (
                <p className="text-center py-4 text-text/30 italic text-xs">No recent admissions</p>
              )}
            </div>
          </Card>

          <Card title="Alerts & Status Summary">
            <div className="space-y-4">
              <div className="p-4 bg-error/5 rounded-2xl border border-error/10 group hover:bg-error/10 transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-error/20 rounded-lg text-error"><Pill size={18} /></div>
                    <span className="text-sm font-black text-text">Pharmacy Low Stock</span>
                  </div>
                  <Badge variant="error">12 Items</Badge>
                </div>
                <div className="w-full bg-error/10 h-1 rounded-full overflow-hidden">
                  <div className="bg-error h-full" style={{ width: '85%' }}></div>
                </div>
              </div>

              <div className="p-4 bg-warning/5 rounded-2xl border border-warning/10 group hover:bg-warning/10 transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-warning/20 rounded-lg text-warning"><Microscope size={18} /></div>
                    <span className="text-sm font-black text-text">Lab Pending Reports</span>
                  </div>
                  <Badge variant="alert">24 Reports</Badge>
                </div>
                <p className="text-[10px] text-text/40 font-bold">Average turnaround: 4.2 hours</p>
              </div>

              <div className="p-4 bg-success/5 rounded-2xl border border-success/10 group hover:bg-success/10 transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-success/20 rounded-lg text-success"><MessageSquare size={18} /></div>
                    <span className="text-sm font-black text-text">WhatsApp Notifications</span>
                  </div>
                  <Badge variant="success">142 Sent</Badge>
                </div>
                <p className="text-[10px] text-text/40 font-bold">98% Delivery Rate Today</p>
              </div>
            </div>
          </Card>

          <Card title="System Health">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-text/60">Server Status: Online</span>
              </div>
              <span className="text-[10px] font-bold text-text/30">v2.4.0</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
