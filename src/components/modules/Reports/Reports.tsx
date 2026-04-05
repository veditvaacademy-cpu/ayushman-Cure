import React, { useState, useEffect } from 'react';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { 
  Stethoscope, 
  BarChart3, 
  ShieldCheck, 
  Calendar, 
  Download, 
  Baby, 
  Skull, 
  Archive 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  AreaChart, 
  Area 
} from 'recharts';
import clsx from 'clsx';

interface ReportsProps {
  hospitalId: number;
}

export const Reports = ({ hospitalId }: ReportsProps) => {
  const [activeCategory, setActiveCategory] = useState<'clinical' | 'admin' | 'statutory'>('clinical');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const res = await fetch(`/api/reports/summary?hospital_id=${hospitalId}`);
        const data = await res.json();
        setReportData(data);
      } catch (error) {
        console.error('Error fetching report data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, [hospitalId]);

  const categories = [
    { id: 'clinical', label: 'Clinical Reports', icon: Stethoscope },
    { id: 'admin', label: 'Administrative Reports', icon: BarChart3 },
    { id: 'statutory', label: 'Statutory Reports', icon: ShieldCheck },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-text">Hospital Reporting Module</h2>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-black/5 rounded-xl text-sm font-bold hover:bg-black/2 transition-all">
            <Calendar size={16} />
            <span>Last 7 Days</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
            <Download size={16} />
            <span>Export All</span>
          </button>
        </div>
      </div>

      <div className="flex gap-4 p-1 bg-black/5 rounded-2xl w-fit">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id as any)}
            className={clsx(
              "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all",
              activeCategory === cat.id 
                ? "bg-white text-primary shadow-sm" 
                : "text-text/40 hover:text-text/60"
            )}
          >
            <cat.icon size={18} />
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {activeCategory === 'clinical' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="OPD/IPD Census Trend">
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reportData?.censusTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#999' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#999' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '20px' }} />
                  <Line type="monotone" dataKey="opd" name="OPD Census" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="ipd" name="IPD Census" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Disease-wise Statistics">
            <div className="h-[300px] w-full mt-4 flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reportData?.diseaseStats || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {(reportData?.diseaseStats || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Emergency Cases Report" className="lg:col-span-2">
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-black/2 border-y border-black/5">
                    <th className="px-6 py-3 text-[10px] font-black text-text/40 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-3 text-[10px] font-black text-text/40 uppercase tracking-widest">Case Type</th>
                    <th className="px-6 py-3 text-[10px] font-black text-text/40 uppercase tracking-widest">Severity</th>
                    <th className="px-6 py-3 text-[10px] font-black text-text/40 uppercase tracking-widest">Outcome</th>
                    <th className="px-6 py-3 text-[10px] font-black text-text/40 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {(reportData?.emergencyCases || []).map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-black/2 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-text">{row.date}</td>
                      <td className="px-6 py-4 text-xs font-black text-text">{row.type}</td>
                      <td className="px-6 py-4">
                        <Badge variant={row.severity === 'Critical' ? 'error' : row.severity === 'High' ? 'alert' : 'success'}>{row.severity}</Badge>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-text/60">{row.outcome}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-primary hover:underline text-[10px] font-black uppercase">View Case</button>
                      </td>
                    </tr>
                  ))}
                  {(reportData?.emergencyCases || []).length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-text/40 italic">No emergency cases reported.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeCategory === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="Revenue Distribution" className="lg:col-span-2">
            <div className="h-[350px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData?.revenueStats || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#999' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#999' }} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '20px' }} />
                  <Bar dataKey="opd" name="OPD Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ipd" name="IPD Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="space-y-6">
            <Card title="Department-wise Earnings">
              <div className="space-y-4">
                {[
                  { dept: 'Cardiology', amount: '₹4.2L', growth: '+12%' },
                  { dept: 'Orthopedics', amount: '₹3.8L', growth: '+8%' },
                  { dept: 'Pediatrics', amount: '₹2.1L', growth: '+15%' },
                  { dept: 'Gynecology', amount: '₹5.5L', growth: '+5%' },
                ].map((dept, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-black/2 rounded-xl border border-black/5">
                    <div>
                      <p className="text-xs font-black text-text">{dept.dept}</p>
                      <p className="text-lg font-black text-primary">{dept.amount}</p>
                    </div>
                    <span className="text-[10px] font-black text-success">{dept.growth}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="OT Utilization">
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path className="text-black/5" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                    <path className="text-accent" strokeDasharray="75, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-black text-sm">75%</div>
                </div>
                <div>
                  <p className="text-xs font-bold text-text/40 uppercase">Average Utilization</p>
                  <p className="text-sm font-black text-text">18/24 Hours Active</p>
                </div>
              </div>
            </Card>
          </div>

          <Card title="Pharmacy Inventory Aging" className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: '0-30 Days', value: '₹12.5L', color: 'bg-success' },
                { label: '31-60 Days', value: '₹8.2L', color: 'bg-primary' },
                { label: '61-90 Days', value: '₹4.1L', color: 'bg-warning' },
                { label: '90+ Days', value: '₹1.5L', color: 'bg-error' },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-2xl border border-black/5 bg-black/2">
                  <p className="text-[10px] font-black text-text/40 uppercase mb-1">{item.label}</p>
                  <p className="text-xl font-black text-text">{item.value}</p>
                  <div className={clsx("h-1 w-full rounded-full mt-2", item.color)}></div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeCategory === 'statutory' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Statutory Registers Summary">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <div className="flex items-center gap-3 mb-2">
                  <Baby className="text-primary" size={20} />
                  <span className="text-sm font-black text-text">Births</span>
                </div>
                <p className="text-2xl font-black text-text">142</p>
                <p className="text-[10px] text-text/40 font-bold uppercase">This Month</p>
              </div>
              <div className="p-4 bg-error/5 rounded-2xl border border-error/10">
                <div className="flex items-center gap-3 mb-2">
                  <Skull className="text-error" size={20} />
                  <span className="text-sm font-black text-text">Deaths</span>
                </div>
                <p className="text-2xl font-black text-text">08</p>
                <p className="text-[10px] text-text/40 font-bold uppercase">This Month</p>
              </div>
            </div>
          </Card>

          <Card title="Infection Control (HAI Rate)">
            <div className="h-[200px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={reportData?.censusTrend || []}>
                  <defs>
                    <linearGradient id="colorHai" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" hide />
                  <YAxis hide />
                  <Tooltip />
                  <Area type="monotone" dataKey="ipd" name="HAI Rate" stroke="#ef4444" fillOpacity={1} fill="url(#colorHai)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between items-center mt-4">
              <p className="text-xs font-bold text-text/60">Current HAI Rate: <span className="text-error font-black">0.8%</span></p>
              <Badge variant="success">Below Benchmark</Badge>
            </div>
          </Card>

          <Card title="Waste Management Report" className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { type: 'Yellow (Infectious)', weight: '142 kg', status: 'Collected' },
                { type: 'Red (Plastic)', weight: '85 kg', status: 'Collected' },
                { type: 'White (Sharps)', weight: '12 kg', status: 'Pending' },
                { type: 'Blue (Glass)', weight: '24 kg', status: 'Collected' },
              ].map((waste, i) => (
                <div key={i} className="p-4 bg-black/2 rounded-2xl border border-black/5 flex flex-col items-center text-center">
                  <div className={clsx(
                    "w-12 h-12 rounded-full mb-3 flex items-center justify-center text-white",
                    waste.type.includes('Yellow') ? "bg-yellow-500" : 
                    waste.type.includes('Red') ? "bg-red-500" : 
                    waste.type.includes('White') ? "bg-slate-200 text-slate-600" : "bg-blue-500"
                  )}>
                    <Archive size={20} />
                  </div>
                  <p className="text-xs font-black text-text mb-1">{waste.type}</p>
                  <p className="text-lg font-black text-text">{waste.weight}</p>
                  <Badge variant={waste.status === 'Collected' ? 'success' : 'alert'} className="mt-2">{waste.status}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
