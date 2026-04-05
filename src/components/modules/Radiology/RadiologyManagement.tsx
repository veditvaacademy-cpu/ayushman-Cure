import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  ClipboardList as ClipboardListIcon, 
  FileDown, 
  Share2, 
  LogOut, 
  X, 
  Image as ImageIcon, 
  Activity, 
  Search,
  Microscope
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { RadiologyOrder, RadiologyTest, Patient, Doctor } from '../../types';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const RadiologyManagement = ({ hospitalId }: { hospitalId: number }) => {
  const [activeSubTab, setActiveSubTab] = useState<'requisitions' | 'reporting' | 'pacs' | 'tests'>('requisitions');
  const [orders, setOrders] = useState<RadiologyOrder[]>([]);
  const [tests, setTests] = useState<RadiologyTest[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showAddTestModal, setShowAddTestModal] = useState(false);
  const [editingTest, setEditingTest] = useState<RadiologyTest | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<RadiologyOrder | null>(null);
  const [report, setReport] = useState<{ findings: string; impression: string; image_url: string; dicom_metadata: string }>({
    findings: '',
    impression: '',
    image_url: '',
    dicom_metadata: ''
  });

  useEffect(() => {
    fetchData();
  }, [hospitalId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, testsRes, patientsRes, doctorsRes] = await Promise.all([
        fetch(`/api/radiology/orders?hospitalId=${hospitalId}`),
        fetch(`/api/radiology/tests?hospitalId=${hospitalId}`),
        fetch(`/api/patients?hospitalId=${hospitalId}`),
        fetch(`/api/doctors?hospitalId=${hospitalId}`)
      ]);
      setOrders(await ordersRes.json());
      setTests(await testsRes.json());
      setPatients(await patientsRes.json());
      setDoctors(await doctorsRes.json());
    } catch (error) {
      console.error("Error fetching radiology data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResult = async (orderId: number) => {
    try {
      const res = await fetch(`/api/radiology/results/${orderId}`);
      const data = await res.json();
      if (data) {
        setReport({
          findings: data.findings || '',
          impression: data.impression || '',
          image_url: data.image_url || '',
          dicom_metadata: data.dicom_metadata || ''
        });
      } else {
        setReport({ findings: '', impression: '', image_url: '', dicom_metadata: '' });
      }
    } catch (error) {
      console.error("Error fetching result:", error);
    }
  };

  const handleOrderSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      hospital_id: hospitalId,
      patient_id: Number(formData.get('patient_id')),
      doctor_id: Number(formData.get('doctor_id')),
      test_id: Number(formData.get('test_id')),
      priority: formData.get('priority'),
      clinical_history: formData.get('clinical_history')
    };

    try {
      const res = await fetch('/api/radiology/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowOrderModal(false);
        fetchData();
      }
    } catch (error) {
      console.error("Error creating radiology order:", error);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      const res = await fetch('/api/radiology/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: selectedOrder.id,
          ...report,
          reported_by: "Dr. Radiologist"
        })
      });
      if (res.ok) {
        setSelectedOrder(null);
        fetchData();
      }
    } catch (error) {
      console.error("Error submitting report:", error);
    }
  };

  const handlePacsFetch = async () => {
    if (!selectedOrder) return;
    try {
      const res = await fetch('/api/radiology/mock-pacs-fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: selectedOrder.id, testName: selectedOrder.test_name })
      });
      const data = await res.json();
      if (data.success) {
        setReport(prev => ({ ...prev, image_url: data.imageUrl, dicom_metadata: data.dicomMetadata }));
      }
    } catch (error) {
      console.error("Error fetching from PACS:", error);
    }
  };

  const handleAddTest = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const payload = {
      hospital_id: hospitalId,
      name: formData.get('name') as string,
      modality: formData.get('modality') as string,
      body_part: formData.get('body_part') as string,
      price: parseFloat(formData.get('price') as string),
      description: formData.get('description') as string
    };

    const url = editingTest ? `/api/radiology/tests/${editingTest.id}` : '/api/radiology/tests';
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
    await fetch(`/api/radiology/tests/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const handleDeleteOrder = async (id: number) => {
    if (!confirm("Are you sure you want to delete this requisition?")) return;
    await fetch(`/api/radiology/orders/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const sendWhatsApp = (order: RadiologyOrder) => {
    const message = `Hello ${order.patient_name}, your radiology report (#${order.id}) for ${order.test_name} from CureManage HMS is now ready. You can view it in the patient portal.`;
    window.open(`https://wa.me/${order.patient_mobile}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const generateReportPDF = (order: RadiologyOrder, result: any) => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.setTextColor(79, 70, 229);
      doc.text('Radiology Report', 105, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Hospital ID: ${hospitalId}`, 20, 30);
      doc.text(`Order Date: ${new Date(order.order_date).toLocaleString()}`, 20, 35);
      doc.text(`Report Date: ${new Date().toLocaleString()}`, 20, 40);
      
      doc.setDrawColor(200);
      doc.line(20, 45, 190, 45);
      
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(`Patient: ${order.patient_name} (${order.patient_id_str})`, 20, 55);
      doc.text(`Doctor: ${order.doctor_name}`, 120, 55);
      doc.text(`Investigation: ${order.test_name}`, 20, 65);
      
      doc.line(20, 70, 190, 70);
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text('Findings:', 20, 80);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const findingsLines = doc.splitTextToSize(result.findings || 'No findings reported.', 170);
      doc.text(findingsLines, 20, 85);
      
      const findingsHeight = findingsLines.length * 5;
      const impressionY = 85 + findingsHeight + 10;
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text('Impression:', 20, impressionY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const impressionLines = doc.splitTextToSize(result.impression || 'No impression reported.', 170);
      doc.text(impressionLines, 20, impressionY + 5);
      
      doc.save(`RadReport_${order.patient_id_str}_${order.id}.pdf`);
    } catch (error) {
      console.error("Error generating Radiology PDF:", error);
      alert("Failed to generate report PDF.");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading Radiology Module...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text">Radiology Management</h2>
          <p className="text-text/60">Imaging services, PACS integration, and diagnostic reporting</p>
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
            New Requisition
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-black/5 p-1 rounded-xl w-fit mb-8">
        {[
          { id: 'requisitions', label: 'Requisitions', icon: ClipboardListIcon },
          { id: 'reporting', label: 'Reporting', icon: Activity },
          { id: 'pacs', label: 'PACS Viewer', icon: ImageIcon },
          { id: 'tests', label: 'Test Catalog', icon: Microscope },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeSubTab === tab.id ? "bg-white text-primary shadow-sm" : "text-text/60 hover:text-text"}`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'requisitions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-black/5">
                      <th className="px-4 py-3 text-xs font-bold text-text/40 uppercase">Order ID</th>
                      <th className="px-4 py-3 text-xs font-bold text-text/40 uppercase">Patient</th>
                      <th className="px-4 py-3 text-xs font-bold text-text/40 uppercase">Investigation</th>
                      <th className="px-4 py-3 text-xs font-bold text-text/40 uppercase">Status</th>
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
                        <td className="px-4 py-4 text-sm text-text/60">{order.test_name}</td>
                        <td className="px-4 py-4">
                          <Badge variant={order.status === 'Completed' ? 'success' : order.status === 'Processing' ? 'info' : 'alert'}>
                            {order.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => {
                                setSelectedOrder(order);
                                fetchResult(order.id);
                                setActiveSubTab('reporting');
                              }}
                              className="p-2 text-text/40 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                            >
                              <ClipboardListIcon size={16} />
                            </button>
                            {order.status === 'Completed' && (
                              <>
                                <button 
                                  onClick={async () => {
                                    try {
                                      setDownloadingId(order.id);
                                      const res = await fetch(`/api/radiology/results/${order.id}`);
                                      const resultData = await res.json();
                                      generateReportPDF(order, resultData);
                                    } catch (error) {
                                      console.error("Download error:", error);
                                    } finally {
                                      setDownloadingId(null);
                                    }
                                  }}
                                  className={`p-2 rounded-lg transition-all ${
                                    downloadingId === order.id ? "text-text/20 animate-pulse" : "text-success hover:bg-success/10"
                                  }`}
                                  title="Download Report"
                                >
                                  <FileDown size={16} />
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
                            <button 
                              onClick={() => handleDeleteOrder(order.id)}
                              className="p-2 text-text/40 hover:text-error hover:bg-error/10 rounded-lg transition-all"
                              title="Delete Requisition"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-text/40 italic">No radiology requisitions found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
          <div className="space-y-6">
            <Card title="Quick Stats">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-primary/5 rounded-xl border border-primary/10">
                  <span className="text-xs font-bold text-text/60">Pending Scans</span>
                  <span className="text-lg font-black text-primary">{orders.filter(o => o.status !== 'Completed').length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-success/5 rounded-xl border border-success/10">
                  <span className="text-xs font-bold text-text/60">Completed Today</span>
                  <span className="text-lg font-black text-success">{orders.filter(o => o.status === 'Completed').length}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeSubTab === 'reporting' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {selectedOrder ? (
              <Card title={`Report Entry: ${selectedOrder.test_name} - ${selectedOrder.patient_name}`}>
                <form onSubmit={handleReportSubmit} className="space-y-6">
                  <div className="p-4 bg-bg rounded-xl border border-black/5 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-text">{selectedOrder.patient_name}</p>
                      <p className="text-[10px] text-text/60">History: {selectedOrder.clinical_history || 'None provided'}</p>
                    </div>
                    <button 
                      type="button"
                      onClick={handlePacsFetch}
                      className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-xs font-bold shadow-lg shadow-accent/20"
                    >
                      <ImageIcon size={14} />
                      Fetch from PACS
                    </button>
                  </div>

                  {report.image_url && (
                    <div className="aspect-video bg-black rounded-xl overflow-hidden relative group">
                      <img src={report.image_url} alt="Radiology Scan" className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <button type="button" className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all"><Search size={20} /></button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-text/40 uppercase">Findings</label>
                      <textarea 
                        required
                        className="w-full px-4 py-2 rounded-xl border border-black/10 h-32 text-sm focus:ring-2 focus:ring-primary/20"
                        value={report.findings}
                        onChange={e => setReport({...report, findings: e.target.value})}
                        placeholder="Detailed radiological findings..."
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-text/40 uppercase">Impression</label>
                      <textarea 
                        required
                        className="w-full px-4 py-2 rounded-xl border border-black/10 h-24 text-sm focus:ring-2 focus:ring-primary/20"
                        value={report.impression}
                        onChange={e => setReport({...report, impression: e.target.value})}
                        placeholder="Final radiological impression..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-black/5">
                    <button type="button" onClick={() => setSelectedOrder(null)} className="px-6 py-2 text-text/40 font-bold">Cancel</button>
                    <button type="submit" className="bg-primary text-white px-8 py-2 rounded-xl font-bold shadow-lg shadow-primary/20">Submit Report</button>
                  </div>
                </form>
              </Card>
            ) : (
              <div className="bg-primary/5 rounded-2xl p-12 text-center border border-primary/10">
                <Activity className="w-16 h-16 text-primary/20 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-text">Select an order to report</h3>
                <p className="text-sm text-text/40 mt-2">Go to the Requisitions tab and click on the reporting icon.</p>
              </div>
            )}
          </div>
          <div className="space-y-6">
            {selectedOrder && report.dicom_metadata && (
              <Card title="DICOM Metadata">
                <div className="space-y-2">
                  {Object.entries(JSON.parse(report.dicom_metadata)).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-[10px] border-b border-black/5 pb-1">
                      <span className="text-text/40 font-bold uppercase">{key}</span>
                      <span className="text-text font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'pacs' && (
        <Card title="PACS Cloud Viewer">
          <div className="aspect-video bg-black rounded-2xl flex items-center justify-center text-white/20 flex-col gap-4">
            <ImageIcon size={64} />
            <p className="text-sm font-bold">Select a study from the reporting tab to view in high resolution</p>
          </div>
        </Card>
      )}

      {activeSubTab === 'tests' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-black/5">
                  <th className="px-4 py-3 text-xs font-bold text-text/40 uppercase">Test Name</th>
                  <th className="px-4 py-3 text-xs font-bold text-text/40 uppercase">Modality</th>
                  <th className="px-4 py-3 text-xs font-bold text-text/40 uppercase">Body Part</th>
                  <th className="px-4 py-3 text-xs font-bold text-text/40 uppercase text-right">Price</th>
                  <th className="px-4 py-3 text-xs font-bold text-text/40 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {tests.map((test) => (
                  <tr key={test.id} className="hover:bg-bg/50 transition-colors">
                    <td className="px-4 py-4 text-sm font-bold text-text">{test.name}</td>
                    <td className="px-4 py-4 text-sm text-text/60">{test.modality}</td>
                    <td className="px-4 py-4 text-sm text-text/60">{test.body_part}</td>
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

      {showAddTestModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between bg-bg">
              <h3 className="text-lg font-bold text-text">{editingTest ? 'Edit Radiology Test' : 'Add New Radiology Test'}</h3>
              <button onClick={() => { setShowAddTestModal(false); setEditingTest(null); }} className="text-text/40 hover:text-text"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddTest} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-text/40 uppercase">Test Name</label>
                <input name="name" required defaultValue={editingTest?.name} className="w-full px-4 py-2 rounded-xl border border-black/10 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text/40 uppercase">Modality</label>
                  <select name="modality" required defaultValue={editingTest?.modality} className="w-full px-4 py-2 rounded-xl border border-black/10 text-sm">
                    <option value="X-Ray">X-Ray</option>
                    <option value="CT Scan">CT Scan</option>
                    <option value="MRI">MRI</option>
                    <option value="Ultrasound">Ultrasound</option>
                    <option value="PET Scan">PET Scan</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text/40 uppercase">Body Part</label>
                  <input name="body_part" required defaultValue={editingTest?.body_part} className="w-full px-4 py-2 rounded-xl border border-black/10 text-sm" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-text/40 uppercase">Price (₹)</label>
                <input type="number" name="price" required defaultValue={editingTest?.price} className="w-full px-4 py-2 rounded-xl border border-black/10 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-text/40 uppercase">Description</label>
                <textarea name="description" defaultValue={editingTest?.description} className="w-full px-4 py-2 rounded-xl border border-black/10 h-24 text-sm" />
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
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between bg-bg">
              <h3 className="text-lg font-bold text-text">New Radiology Requisition</h3>
              <button onClick={() => setShowOrderModal(false)} className="text-text/40 hover:text-text"><X size={20} /></button>
            </div>
            <form onSubmit={handleOrderSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text/40 uppercase">Patient</label>
                  <select name="patient_id" required className="w-full px-4 py-2 rounded-xl border border-black/10 text-sm">
                    <option value="">Select Patient</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.patient_id_str})</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text/40 uppercase">Ordering Doctor</label>
                  <select name="doctor_id" required className="w-full px-4 py-2 rounded-xl border border-black/10 text-sm">
                    <option value="">Select Doctor</option>
                    {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text/40 uppercase">Investigation</label>
                  <select name="test_id" required className="w-full px-4 py-2 rounded-xl border border-black/10 text-sm">
                    <option value="">Select Scan</option>
                    {tests.map(t => <option key={t.id} value={t.id}>{t.name} ({t.modality})</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text/40 uppercase">Priority</label>
                  <select name="priority" className="w-full px-4 py-2 rounded-xl border border-black/10 text-sm">
                    <option value="Routine">Routine</option>
                    <option value="Urgent">Urgent</option>
                    <option value="STAT">STAT</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-text/40 uppercase">Clinical History</label>
                <textarea name="clinical_history" className="w-full px-4 py-2 rounded-xl border border-black/10 h-24 text-sm" placeholder="Reason for scan, clinical findings..." />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-black/5">
                <button type="button" onClick={() => setShowOrderModal(false)} className="px-6 py-2 text-text/40 font-bold">Cancel</button>
                <button type="submit" className="bg-primary text-white px-8 py-2 rounded-xl font-bold shadow-lg shadow-primary/20">Create Requisition</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
