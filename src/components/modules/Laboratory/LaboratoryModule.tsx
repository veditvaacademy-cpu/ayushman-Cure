import React, { useState, useEffect } from 'react';
import { 
  Microscope, 
  Plus, 
  ClipboardList as ClipboardListIcon, 
  FileDown, 
  Share2, 
  TrendingUp, 
  LogOut, 
  Search, 
  X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Card } from '../ui/Card';
import { LabOrder, LabTest, LabResult, Patient, Doctor } from '../../types';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const LaboratoryModule = ({ hospitalId }: { hospitalId: number }) => {
  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'tests' | 'trends'>('orders');
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [tests, setTests] = useState<LabTest[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
  const [results, setResults] = useState<LabResult[]>([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showAddTestModal, setShowAddTestModal] = useState(false);
  const [editingTest, setEditingTest] = useState<LabTest | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  
  // Trend Analysis State
  const [selectedTrendPatient, setSelectedTrendPatient] = useState<number | null>(null);
  const [selectedTrendTest, setSelectedTrendTest] = useState<string>('');
  const [trends, setTrends] = useState<any[]>([]);

  // New Order Form
  const [orderPatientId, setOrderPatientId] = useState('');
  const [orderDoctorId, setOrderDoctorId] = useState('');
  const [orderPriority, setOrderPriority] = useState('Routine');
  const [selectedTests, setSelectedTests] = useState<number[]>([]);

  const fetchData = async () => {
    const [oRes, tRes, pRes, dRes] = await Promise.all([
      fetch(`/api/lab/orders?hospitalId=${hospitalId}`),
      fetch(`/api/lab/tests?hospitalId=${hospitalId}`),
      fetch(`/api/patients?hospitalId=${hospitalId}`),
      fetch(`/api/doctors?hospitalId=${hospitalId}`)
    ]);
    setOrders(await oRes.json());
    setTests(await tRes.json());
    setPatients(await pRes.json());
    setDoctors(await dRes.json());
  };

  useEffect(() => { fetchData(); }, [hospitalId]);

  const fetchResults = async (orderId: number) => {
    const res = await fetch(`/api/lab/results/${orderId}`);
    setResults(await res.json());
  };

  const handleResultUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const updates = results.map(r => ({
      id: r.id,
      result_value: formData.get(`result_${r.id}`) as string,
      is_abnormal: formData.get(`abnormal_${r.id}`) === 'on' ? 1 : 0,
      device_id: formData.get(`device_${r.id}`) as string
    }));

    await fetch('/api/lab/results/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: selectedOrder.id, results: updates })
    });
    
    setSelectedOrder(null);
    fetchData();
  };

  const handleDeviceFetch = async (category: string) => {
    if (!selectedOrder) return;
    const res = await fetch(`/api/lab/mock-device-fetch?category=${category}`);
    const mockData = await res.json();
    
    // Update local results state with mock device data
    setResults(prev => prev.map(r => {
      const match = mockData.find((m: any) => m.test_name === r.test_name);
      if (match) {
        return { ...r, result_value: match.value, device_id: match.device };
      }
      return r;
    }));
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/lab/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hospital_id: hospitalId,
        patient_id: parseInt(orderPatientId),
        doctor_id: parseInt(orderDoctorId),
        priority: orderPriority,
        test_ids: selectedTests
      })
    });
    setShowOrderModal(false);
    setSelectedTests([]);
    fetchData();
  };

  const fetchTrends = async () => {
    if (!selectedTrendPatient || !selectedTrendTest) return;
    const res = await fetch(`/api/lab/trends?patientId=${selectedTrendPatient}&testName=${selectedTrendTest}`);
    setTrends(await res.json());
  };

  const handleAddTest = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const payload = {
      hospital_id: hospitalId,
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      reference_range: formData.get('reference_range') as string,
      unit: formData.get('unit') as string,
      price: parseFloat(formData.get('price') as string),
      is_group: formData.get('is_group') === 'on' ? 1 : 0
    };

    const url = editingTest ? `/api/lab/tests/${editingTest.id}` : '/api/lab/tests';
    const method = editingTest ? 'PATCH' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    setShowAddTestModal(false);
    setEditingTest(null);
    fetchData();
  };

  const handleDeleteTest = async (id: number) => {
    if (!confirm("Are you sure you want to delete this test?")) return;
    await fetch(`/api/lab/tests/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const generatePDF = (order: LabOrder, resultsData: LabResult[]) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(0, 102, 255);
    doc.text("CUREMANAGE HMS - LABORATORY REPORT", 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Order ID: #${order.id}`, 20, 35);
    doc.text(`Date: ${new Date(order.order_date).toLocaleString()}`, 20, 40);
    
    // Patient Info
    doc.setDrawColor(200);
    doc.line(20, 45, 190, 45);
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Patient: ${order.patient_name}`, 20, 55);
    doc.text(`ID: ${order.patient_id_str}`, 20, 60);
    doc.text(`Doctor: ${order.doctor_name}`, 120, 55);
    
    // Results Table
    (doc as any).autoTable({
      startY: 70,
      head: [['Test Name', 'Result', 'Unit', 'Reference Range', 'Status']],
      body: resultsData.map(r => [
        r.test_name,
        r.result_value || 'Pending',
        r.unit,
        r.reference_range,
        r.is_abnormal ? 'ABNORMAL' : 'Normal'
      ]),
      headStyles: { fillColor: [0, 102, 255] },
      alternateRowStyles: { fillColor: [245, 247, 250] }
    });
    
    doc.save(`LabReport_${order.patient_name}_${order.id}.pdf`);
  };

  const sendWhatsApp = (order: LabOrder) => {
    const message = `Hello ${order.patient_name}, your laboratory report (#${order.id}) from CureManage HMS is now ready. You can view it in the patient portal.`;
    window.open(`https://wa.me/${order.patient_mobile}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text">Laboratory Management</h2>
          <p className="text-text/60">Diagnostic services, test catalog, and automated reporting</p>
        </div>
        <div className="flex items-center gap-3">
          {activeSubTab === 'tests' && (
            <button 
              onClick={() => setShowAddTestModal(true)}
              className="flex items-center gap-2 bg-white border border-primary text-primary px-4 py-2 rounded-xl hover:bg-primary/5 transition-all shadow-sm font-bold text-sm"
            >
              <Plus className="w-4 h-4" />
              Add New Test
            </button>
          )}
          <button 
            onClick={() => setShowOrderModal(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 transition-all shadow-sm font-bold text-sm"
          >
            <Plus className="w-4 h-4" />
            New Test Order
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-black/5 p-1 rounded-xl w-fit mb-8">
        <button 
          onClick={() => setActiveSubTab('orders')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeSubTab === 'orders' ? "bg-white text-primary shadow-sm" : "text-text/60 hover:text-text"}`}
        >
          Test Orders
        </button>
        <button 
          onClick={() => setActiveSubTab('tests')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeSubTab === 'tests' ? "bg-white text-primary shadow-sm" : "text-text/60 hover:text-text"}`}
        >
          Test Catalog
        </button>
        <button 
          onClick={() => setActiveSubTab('trends')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeSubTab === 'trends' ? "bg-white text-primary shadow-sm" : "text-text/60 hover:text-text"}`}
        >
          Trend Analysis
        </button>
      </div>

      {activeSubTab === 'orders' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-black/5">
                      <th className="px-4 py-3 text-xs font-bold text-text/40 uppercase">Order ID</th>
                      <th className="px-4 py-3 text-xs font-bold text-text/40 uppercase">Patient</th>
                      <th className="px-4 py-3 text-xs font-bold text-text/40 uppercase">Doctor</th>
                      <th className="px-4 py-3 text-xs font-bold text-text/40 uppercase">Status</th>
                      <th className="px-4 py-3 text-xs font-bold text-text/40 uppercase">Priority</th>
                      <th className="px-4 py-3 text-xs font-bold text-text/40 uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-bg/50 transition-colors">
                        <td className="px-4 py-4 text-sm font-mono text-primary">#{order.id}</td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-bold text-text">{order.patient_name}</p>
                          <p className="text-[10px] text-text/60">{order.patient_id_str}</p>
                        </td>
                        <td className="px-4 py-4 text-sm text-text/60">{order.doctor_name}</td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                            order.status === 'Completed' ? "bg-success/10 text-success" :
                            order.status === 'Processing' ? "bg-alert/10 text-alert" :
                            "bg-black/5 text-text/60"
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-[10px] font-bold ${
                            order.priority === 'STAT' ? "text-error" :
                            order.priority === 'Urgent' ? "text-alert" :
                            "text-text/40"
                          }`}>
                            {order.priority}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => {
                                setSelectedOrder(order);
                                fetchResults(order.id);
                              }}
                              className="p-2 text-text/40 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                            >
                              <ClipboardListIcon size={16} />
                            </button>
                            {order.status === 'Completed' && (
                              <>
                                <button 
                                  disabled={downloadingId === order.id}
                                  onClick={async () => {
                                    try {
                                      setDownloadingId(order.id);
                                      const res = await fetch(`/api/lab/results/${order.id}`);
                                      if (!res.ok) throw new Error("Failed to fetch results");
                                      const resultsData = await res.json();
                                      generatePDF(order, resultsData);
                                    } catch (error) {
                                      console.error("Download error:", error);
                                      alert("Failed to download report.");
                                    } finally {
                                      setDownloadingId(null);
                                    }
                                  }}
                                  className={`p-2 rounded-lg transition-all ${
                                    downloadingId === order.id 
                                      ? "text-text/20 bg-black/5 animate-pulse" 
                                      : "text-success hover:bg-success/10"
                                  }`}
                                  title="Download Report"
                                >
                                  <FileDown size={16} className={downloadingId === order.id ? "animate-bounce" : ""} />
                                </button>
                                <button 
                                  onClick={() => sendWhatsApp(order)}
                                  className="p-2 text-success hover:bg-success/10 rounded-lg transition-all"
                                  title="Share on WhatsApp"
                                >
                                  <Share2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            {selectedOrder ? (
              <Card title={`Result Entry: #${selectedOrder.id}`}>
                <div className="mb-6 p-4 bg-bg rounded-xl border border-black/5">
                  <p className="text-xs font-bold text-text">{selectedOrder.patient_name}</p>
                  <p className="text-[10px] text-text/60">Ordered: {new Date(selectedOrder.order_date).toLocaleString()}</p>
                </div>

                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                  <button onClick={() => handleDeviceFetch('Hematology')} className="flex-shrink-0 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-[10px] font-bold border border-primary/20 hover:bg-primary/20">Fetch Hematology</button>
                  <button onClick={() => handleDeviceFetch('Biochemistry')} className="flex-shrink-0 px-3 py-1.5 bg-success/10 text-success rounded-lg text-[10px] font-bold border border-success/20 hover:bg-success/20">Fetch Biochemistry</button>
                </div>

                <form onSubmit={handleResultUpdate} className="space-y-6">
                  {results.map((r) => (
                    <div key={r.id} className="space-y-2 p-3 border border-black/5 rounded-xl bg-bg/30">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-text">{r.test_name}</label>
                        <span className="text-[10px] text-text/40">{r.reference_range} {r.unit}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input 
                          name={`result_${r.id}`}
                          defaultValue={r.result_value || ''}
                          placeholder="Value"
                          className="flex-1 px-3 py-2 bg-white border border-black/10 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <div className="flex items-center gap-2">
                          <input type="checkbox" name={`abnormal_${r.id}`} defaultChecked={r.is_abnormal} className="rounded text-primary" />
                          <span className="text-[10px] text-text/60 font-bold">Abnormal</span>
                        </div>
                      </div>
                      <input type="hidden" name={`device_${r.id}`} defaultValue={r.device_id} />
                    </div>
                  ))}
                  <button type="submit" className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-sm text-sm">Save Results</button>
                </form>
              </Card>
            ) : (
              <div className="bg-primary/5 rounded-2xl p-8 text-center border border-primary/10">
                <Microscope className="w-12 h-12 text-primary/20 mx-auto mb-4" />
                <h3 className="text-sm font-bold text-text">Select an Order</h3>
                <p className="text-xs text-text/40 mt-2">Click on the clipboard icon to enter or view test results.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'tests' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-black/5">
                  <th className="px-4 py-3 text-xs font-bold text-text/40 uppercase">Test Name</th>
                  <th className="px-4 py-3 text-xs font-bold text-text/40 uppercase">Category</th>
                  <th className="px-4 py-3 text-xs font-bold text-text/40 uppercase">Ref. Range</th>
                  <th className="px-4 py-3 text-xs font-bold text-text/40 uppercase">Unit</th>
                  <th className="px-4 py-3 text-xs font-bold text-text/40 uppercase text-right">Price</th>
                  <th className="px-4 py-3 text-xs font-bold text-text/40 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {tests.map((test) => (
                  <tr key={test.id} className="hover:bg-bg/50 transition-colors">
                    <td className="px-4 py-4 text-sm font-bold text-text">
                      {test.name}
                      {test.is_group === 1 && (
                        <span className="ml-2 px-1.5 py-0.5 bg-primary/10 text-primary text-[8px] rounded uppercase font-black">Group</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-text/60">{test.category}</td>
                    <td className="px-4 py-4 text-sm text-text/60">{test.is_group ? 'Multiple' : test.reference_range}</td>
                    <td className="px-4 py-4 text-sm text-text/60">{test.is_group ? '-' : test.unit}</td>
                    <td className="px-4 py-4 text-sm font-bold text-text text-right">₹{test.price}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => {
                            setEditingTest(test);
                            setShowAddTestModal(true);
                          }}
                          className="p-2 text-text/40 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                        >
                          <ClipboardListIcon size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteTest(test.id)}
                          className="p-2 text-text/40 hover:text-error hover:bg-error/10 rounded-lg transition-all"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeSubTab === 'trends' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <Card title="Filters">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-text/40 uppercase mb-1">Patient</label>
                  <select 
                    className="w-full px-3 py-2 bg-bg border border-black/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    onChange={(e) => setSelectedTrendPatient(Number(e.target.value))}
                  >
                    <option value="">Select Patient</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.patient_id_str})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text/40 uppercase mb-1">Test Parameter</label>
                  <select 
                    className="w-full px-3 py-2 bg-bg border border-black/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    onChange={(e) => setSelectedTrendTest(e.target.value)}
                  >
                    <option value="">Select Test</option>
                    {tests.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
                <button 
                  onClick={fetchTrends}
                  className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-sm flex items-center justify-center gap-2 text-xs"
                >
                  <TrendingUp className="w-4 h-4" />
                  Show Trend
                </button>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card title="Historical Trend Analysis">
              <div className="h-[350px]">
                {trends.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trends}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0066FF" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#0066FF" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => [`${value} ${trends[0].unit}`, selectedTrendTest]}
                      />
                      <Area type="monotone" dataKey="value" stroke="#0066FF" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-text/20">
                    <TrendingUp className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-xs font-bold">Select patient and test to see trend</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {showAddTestModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between bg-bg">
              <h3 className="text-lg font-bold text-text">{editingTest ? 'Edit Test' : 'Add New Test'}</h3>
              <button onClick={() => { setShowAddTestModal(false); setEditingTest(null); }} className="text-text/40 hover:text-text"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddTest} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-text/40 uppercase">Test Name</label>
                <input name="name" required defaultValue={editingTest?.name} className="w-full px-4 py-2 rounded-xl border border-black/10 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-text/40 uppercase">Category</label>
                <select name="category" required defaultValue={editingTest?.category} className="w-full px-4 py-2 rounded-xl border border-black/10 text-sm">
                  <option value="Hematology">Hematology</option>
                  <option value="Biochemistry">Biochemistry</option>
                  <option value="Microbiology">Microbiology</option>
                  <option value="Immunology">Immunology</option>
                  <option value="Pathology">Pathology</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text/40 uppercase">Ref. Range</label>
                  <input name="reference_range" defaultValue={editingTest?.reference_range} className="w-full px-4 py-2 rounded-xl border border-black/10 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text/40 uppercase">Unit</label>
                  <input name="unit" defaultValue={editingTest?.unit} className="w-full px-4 py-2 rounded-xl border border-black/10 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text/40 uppercase">Price (₹)</label>
                  <input type="number" name="price" required defaultValue={editingTest?.price} className="w-full px-4 py-2 rounded-xl border border-black/10 text-sm" />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input type="checkbox" name="is_group" defaultChecked={editingTest?.is_group === 1} className="rounded text-primary" />
                  <span className="text-xs font-bold text-text/60">Is Group Test?</span>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-black/5">
                <button type="button" onClick={() => { setShowAddTestModal(false); setEditingTest(null); }} className="px-6 py-2 text-text/40 font-bold">Cancel</button>
                <button type="submit" className="bg-primary text-white px-8 py-2 rounded-xl font-bold shadow-lg shadow-primary/20">
                  {editingTest ? 'Update Test' : 'Add Test'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {showOrderModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between bg-bg">
              <h3 className="text-lg font-bold text-text">New Laboratory Order</h3>
              <button onClick={() => setShowOrderModal(false)} className="text-text/40 hover:text-text"><LogOut size={20} /></button>
            </div>
            <form onSubmit={handleCreateOrder} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-text/40 uppercase mb-1">Patient</label>
                  <select 
                    required
                    className="w-full px-4 py-2 bg-bg border border-black/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={orderPatientId}
                    onChange={(e) => setOrderPatientId(e.target.value)}
                  >
                    <option value="">Select Patient</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.patient_id_str})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text/40 uppercase mb-1">Ordering Doctor</label>
                  <select 
                    required
                    className="w-full px-4 py-2 bg-bg border border-black/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={orderDoctorId}
                    onChange={(e) => setOrderDoctorId(e.target.value)}
                  >
                    <option value="">Select Doctor</option>
                    {doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.department})</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text/40 uppercase mb-3">Select Tests</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {tests.map(test => (
                    <label 
                      key={test.id} 
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedTests.includes(test.id) ? "bg-primary/5 border-primary" : "bg-bg border-black/5 hover:border-black/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          className="rounded text-primary"
                          checked={selectedTests.includes(test.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedTests([...selectedTests, test.id]);
                            else setSelectedTests(selectedTests.filter(id => id !== test.id));
                          }}
                        />
                        <div>
                          <p className="text-xs font-bold text-text">{test.name}</p>
                          <p className="text-[10px] text-text/40">{test.category}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-primary">₹{test.price}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-black/5">
                <button type="button" onClick={() => setShowOrderModal(false)} className="px-6 py-2 text-text/40 font-bold">Cancel</button>
                <button type="submit" className="bg-primary text-white px-8 py-2 rounded-xl font-bold shadow-lg shadow-primary/20">Create Order</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
