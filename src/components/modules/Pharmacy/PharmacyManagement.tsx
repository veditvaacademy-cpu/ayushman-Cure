import React, { useState, useEffect } from 'react';
import { 
  Package, 
  AlertTriangle, 
  Clock, 
  Plus, 
  ShoppingCart 
} from 'lucide-react';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { 
  PharmacyItem, 
  PharmacyBatch, 
  PharmacySupplier, 
  PharmacyNarcoticsLog 
} from '../../../types';

interface PharmacyManagementProps {
  hospitalId: number;
}

export const PharmacyManagement = ({ hospitalId }: PharmacyManagementProps) => {
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'inventory' | 'dispensing' | 'purchase' | 'narcotics' | 'returns'>('dashboard');
  const [items, setItems] = useState<PharmacyItem[]>([]);
  const [batches, setBatches] = useState<PharmacyBatch[]>([]);
  const [suppliers, setSuppliers] = useState<PharmacySupplier[]>([]);
  const [narcoticsLog, setNarcoticsLog] = useState<PharmacyNarcoticsLog[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);

  // Item Management State
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState<PharmacyItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [category, setCategory] = useState('Tablets');
  const [uom, setUom] = useState('Strip');
  const [minStock, setMinStock] = useState('10');
  const [isNarcotic, setIsNarcotic] = useState(false);

  // Dispensing State
  const [cart, setCart] = useState<{ batch_id: number, name: string, quantity: number, price: number, total: number }[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [dispenseQty, setDispenseQty] = useState(1);
  const [patientId, setPatientId] = useState('');

  // Purchase State
  const [purchaseMode, setPurchaseMode] = useState<'grn' | 'po'>('grn');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [invoiceNum, setInvoiceNum] = useState('');
  const [grnItems, setGrnItems] = useState<{ item_id: number, name: string, batch_number: string, expiry_date: string, mrp: number, purchase_price: number, quantity: number, gst: number }[]>([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [newBatchNum, setNewBatchNum] = useState('');
  const [newExpiry, setNewExpiry] = useState('');
  const [newMrp, setNewMrp] = useState('');
  const [newPurchasePrice, setNewPurchasePrice] = useState('');
  const [newQty, setNewQty] = useState('');
  const [newGst, setNewGst] = useState('12');

  // Return State
  const [returnDispenseId, setReturnDispenseId] = useState('');
  const [returnReason, setReturnReason] = useState('');

  const [recentDispensing, setRecentDispensing] = useState<any[]>([]);

  const fetchData = async () => {
    const [iRes, bRes, sRes, nRes, poRes, dRes] = await Promise.all([
      fetch(`/api/pharmacy/items?hospitalId=${hospitalId}`),
      fetch(`/api/pharmacy/batches?hospitalId=${hospitalId}`),
      fetch(`/api/pharmacy/suppliers?hospitalId=${hospitalId}`),
      fetch(`/api/pharmacy/narcotics-log?hospitalId=${hospitalId}`),
      fetch(`/api/pharmacy/po?hospitalId=${hospitalId}`),
      fetch(`/api/pharmacy/dispensing?hospitalId=${hospitalId}`)
    ]);
    setItems(await iRes.json());
    setBatches(await bRes.json());
    setSuppliers(await sRes.json());
    setNarcoticsLog(await nRes.json());
    setPurchaseOrders(await poRes.json());
    setRecentDispensing(await dRes.json());
  };

  useEffect(() => { fetchData(); }, [hospitalId, activeSubTab]);

  useEffect(() => {
    if (editingItem) {
      setItemName(editingItem.name);
      setGenericName(editingItem.generic_name || '');
      setCategory(editingItem.category);
      setUom(editingItem.uom);
      setMinStock(editingItem.min_stock_level.toString());
      setIsNarcotic(editingItem.is_narcotic === 1);
      setShowAddItem(true);
    } else {
      setItemName(''); setGenericName(''); setCategory('Tablets'); setUom('Strip'); setMinStock('10'); setIsNarcotic(false);
    }
  }, [editingItem]);

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      hospital_id: hospitalId,
      name: itemName,
      generic_name: genericName,
      category,
      uom,
      min_stock_level: parseInt(minStock),
      is_narcotic: isNarcotic ? 1 : 0
    };

    if (editingItem) {
      await fetch(`/api/pharmacy/items/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setEditingItem(null);
    } else {
      await fetch('/api/pharmacy/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }
    setShowAddItem(false);
    fetchData();
  };

  const handleDeleteItem = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      await fetch(`/api/pharmacy/items/${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  const addToCart = () => {
    const batch = batches.find(b => b.id === parseInt(selectedBatchId));
    if (!batch) return;
    if (batch.current_stock < dispenseQty) {
      alert("Insufficient stock!");
      return;
    }
    setCart([...cart, { 
      batch_id: batch.id, 
      name: batch.item_name!, 
      quantity: dispenseQty, 
      price: batch.mrp, 
      total: batch.mrp * dispenseQty 
    }]);
    setSelectedBatchId('');
    setDispenseQty(1);
  };

  const handleDispense = async () => {
    const total = cart.reduce((sum, item) => sum + item.total, 0);
    const res = await fetch('/api/pharmacy/dispense', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hospital_id: hospitalId,
        patient_id: patientId ? parseInt(patientId) : null,
        items: cart.map(i => ({ batch_id: i.batch_id, quantity: i.quantity, unit_price: i.price, total_price: i.total })),
        total_amount: total,
        discount: 0,
        net_amount: total
      })
    });
    const data = await res.json();
    if (data.success) {
      alert(`Bill Generated: ${data.bill_number}`);
      setCart([]);
      setPatientId('');
      fetchData();
    }
  };

  const addToGrn = () => {
    const item = items.find(i => i.id === parseInt(selectedItemId));
    if (!item) return;
    setGrnItems([...grnItems, {
      item_id: item.id,
      name: item.name,
      batch_number: newBatchNum,
      expiry_date: newExpiry,
      mrp: parseFloat(newMrp),
      purchase_price: parseFloat(newPurchasePrice),
      quantity: parseInt(newQty),
      gst: parseFloat(newGst)
    }]);
    setNewBatchNum(''); setNewExpiry(''); setNewMrp(''); setNewPurchasePrice(''); setNewQty('');
  };

  const handleGrn = async () => {
    const total = grnItems.reduce((sum, i) => sum + (i.purchase_price * i.quantity), 0);
    const res = await fetch('/api/pharmacy/grn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hospital_id: hospitalId,
        supplier_id: parseInt(selectedSupplierId),
        invoice_number: invoiceNum,
        invoice_date: new Date().toISOString().split('T')[0],
        items: grnItems,
        total_amount: total
      })
    });
    const data = await res.json();
    if (data.success) {
      alert(`GRN Generated: ${data.grn_number}`);
      setGrnItems([]);
      setInvoiceNum('');
      fetchData();
    }
  };

  const handlePo = async () => {
    const total = grnItems.reduce((sum, i) => sum + (i.purchase_price * i.quantity), 0);
    const res = await fetch('/api/pharmacy/po', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hospital_id: hospitalId,
        supplier_id: parseInt(selectedSupplierId),
        items: grnItems.map(i => ({ item_id: i.item_id, quantity: i.quantity, unit_price: i.purchase_price })),
        total_amount: total
      })
    });
    const data = await res.json();
    if (data.success) {
      alert(`PO Generated: ${data.po_number}`);
      setGrnItems([]);
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text">Pharmacy Management</h2>
          <p className="text-text/60">Inventory, Dispensing & Procurement</p>
        </div>
        <div className="flex bg-white rounded-lg border border-black/5 p-1">
          {(['dashboard', 'inventory', 'dispensing', 'purchase', 'narcotics', 'returns'] as const).map(tab => (
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

      {activeSubTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 text-primary rounded-xl"><Package size={24} /></div>
                <div>
                  <p className="text-xs text-text/40 font-semibold uppercase">Total Drugs</p>
                  <h4 className="text-2xl font-bold">{items.length}</h4>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-alert/10 text-alert rounded-xl"><AlertTriangle size={24} /></div>
                <div>
                  <p className="text-xs text-text/40 font-semibold uppercase">Low Stock Alerts</p>
                  <h4 className="text-2xl font-bold">{items.filter(i => (i.total_stock || 0) < i.min_stock_level).length}</h4>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-error/10 text-error rounded-xl"><Clock size={24} /></div>
                <div>
                  <p className="text-xs text-text/40 font-semibold uppercase">Expiring Soon</p>
                  <h4 className="text-2xl font-bold">{batches.filter(b => new Date(b.expiry_date) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)).length}</h4>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Low Stock Items">
              <div className="space-y-4">
                {items.filter(i => (i.total_stock || 0) < i.min_stock_level).map(i => (
                  <div key={i.id} className="flex justify-between items-center p-3 bg-bg rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{i.name}</p>
                      <p className="text-xs text-text/40">{i.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-error">{i.total_stock || 0} {i.uom}</p>
                      <p className="text-[10px] text-text/40">Min: {i.min_stock_level}</p>
                    </div>
                  </div>
                ))}
                {items.filter(i => (i.total_stock || 0) < i.min_stock_level).length === 0 && <p className="text-center text-text/40 italic py-4">All stock levels healthy</p>}
              </div>
            </Card>
            <Card title="Recent Narcotics Activity">
              <div className="space-y-4">
                {narcoticsLog.slice(0, 5).map(l => (
                  <div key={l.id} className="flex justify-between items-center p-3 bg-bg rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{l.item_name}</p>
                      <p className="text-xs text-text/40">Batch: {l.batch_number}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={l.action_type === 'Received' ? 'success' : 'alert'}>{l.action_type}</Badge>
                      <p className="text-xs font-bold mt-1">{l.quantity} Units</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeSubTab === 'inventory' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button 
              onClick={() => {
                setShowAddItem(!showAddItem);
                if (showAddItem) setEditingItem(null);
              }}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium"
            >
              <Plus size={20} />
              {showAddItem ? 'Cancel' : 'Add New Drug'}
            </button>
          </div>

          {showAddItem && (
            <Card title={editingItem ? "Edit Drug Details" : "Add New Drug to Master"}>
              <form onSubmit={handleSaveItem} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text/40 uppercase">Medicine Name</label>
                  <input className="w-full px-4 py-2 rounded-lg border" value={itemName} onChange={e => setItemName(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text/40 uppercase">Generic Name</label>
                  <input className="w-full px-4 py-2 rounded-lg border" value={genericName} onChange={e => setGenericName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text/40 uppercase">Category</label>
                  <select className="w-full px-4 py-2 rounded-lg border" value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="Tablets">Tablets</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Ointment">Ointment</option>
                    <option value="Surgical">Surgical</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text/40 uppercase">UOM</label>
                  <input className="w-full px-4 py-2 rounded-lg border" value={uom} onChange={e => setUom(e.target.value)} placeholder="e.g. Strip, Bottle" required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text/40 uppercase">Min Stock Level</label>
                  <input type="number" className="w-full px-4 py-2 rounded-lg border" value={minStock} onChange={e => setMinStock(e.target.value)} required />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input type="checkbox" checked={isNarcotic} onChange={e => setIsNarcotic(e.target.checked)} />
                  <label className="text-sm font-semibold">Narcotic Drug</label>
                </div>
                <div className="md:col-span-4 flex justify-end gap-3">
                  <button type="submit" className="bg-primary text-white px-8 py-2 rounded-lg font-bold">
                    {editingItem ? 'Update Item' : 'Save Item'}
                  </button>
                </div>
              </form>
            </Card>
          )}

          <Card title="Drug Master Inventory">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-black/5">
                    <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Medicine Name</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Generic Name</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Category</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Stock</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {items.map(i => (
                    <tr key={i.id} className="hover:bg-bg/50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-medium text-text">{i.name}</div>
                        {i.is_narcotic === 1 && <Badge variant="error">Narcotic</Badge>}
                      </td>
                      <td className="px-4 py-4 text-sm text-text/60">{i.generic_name}</td>
                      <td className="px-4 py-4 text-sm text-text/60">{i.category}</td>
                      <td className="px-4 py-4 text-sm font-bold">
                        <span className={(i.total_stock || 0) < i.min_stock_level ? 'text-error' : 'text-success'}>
                          {i.total_stock || 0} {i.uom}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={(i.total_stock || 0) > 0 ? 'success' : 'alert'}>
                          {(i.total_stock || 0) > 0 ? 'In Stock' : 'Out of Stock'}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex gap-2">
                          <button onClick={() => setEditingItem(i)} className="text-primary hover:underline">Edit</button>
                          <button onClick={() => handleDeleteItem(i.id)} className="text-error hover:underline">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeSubTab === 'dispensing' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card title="Dispense Medicine">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Select Medicine Batch</label>
                  <select 
                    className="w-full px-4 py-2 rounded-lg border border-black/10 focus:ring-2 focus:ring-primary/20"
                    value={selectedBatchId} onChange={e => setSelectedBatchId(e.target.value)}
                  >
                    <option value="">Choose Batch...</option>
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.item_name} - {b.batch_number} (Exp: {b.expiry_date}) - ₹{b.mrp} [Stock: {b.current_stock}]
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Qty</label>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      className="w-full px-4 py-2 rounded-lg border border-black/10"
                      value={dispenseQty} onChange={e => setDispenseQty(parseInt(e.target.value))}
                    />
                    <button onClick={addToCart} className="bg-primary text-white p-2 rounded-lg"><Plus size={20} /></button>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-bg">
                    <tr>
                      <th className="px-4 py-2">Medicine</th>
                      <th className="px-4 py-2">Qty</th>
                      <th className="px-4 py-2">Price</th>
                      <th className="px-4 py-2">Total</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {cart.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 font-medium">{item.name}</td>
                        <td className="px-4 py-3">{item.quantity}</td>
                        <td className="px-4 py-3">₹{item.price}</td>
                        <td className="px-4 py-3 font-bold">₹{item.total}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-error hover:underline">Remove</button>
                        </td>
                      </tr>
                    ))}
                    {cart.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-text/40 italic">Cart is empty</td></tr>}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Billing Summary">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Patient ID (Optional)</label>
                  <input 
                    placeholder="PAT-123456"
                    className="w-full px-4 py-2 rounded-lg border border-black/10 mt-1"
                    value={patientId} onChange={e => setPatientId(e.target.value)}
                  />
                </div>
                <div className="pt-4 border-t border-black/5 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text/60">Subtotal</span>
                    <span className="font-medium">₹{cart.reduce((sum, i) => sum + i.total, 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text/60">Discount</span>
                    <span className="font-medium">₹0</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-black/5">
                    <span>Net Amount</span>
                    <span className="text-primary">₹{cart.reduce((sum, i) => sum + i.total, 0)}</span>
                  </div>
                </div>
                <button 
                  onClick={handleDispense}
                  disabled={cart.length === 0}
                  className="w-full bg-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={20} />
                  Generate Bill & Dispense
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeSubTab === 'purchase' && (
        <div className="space-y-6">
          <div className="flex gap-4 border-b border-black/5 pb-4">
            <button 
              onClick={() => setPurchaseMode('grn')}
              className={`px-4 py-2 rounded-lg text-sm font-bold ${purchaseMode === 'grn' ? 'bg-primary text-white' : 'bg-bg text-text/40'}`}
            >
              GRN (Stock Entry)
            </button>
            <button 
              onClick={() => setPurchaseMode('po')}
              className={`px-4 py-2 rounded-lg text-sm font-bold ${purchaseMode === 'po' ? 'bg-primary text-white' : 'bg-bg text-text/40'}`}
            >
              Purchase Orders
            </button>
          </div>

          {purchaseMode === 'grn' ? (
            <Card title="Stock Inward (GRN Entry)">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Supplier</label>
                  <select 
                    className="w-full px-4 py-2 rounded-lg border border-black/10"
                    value={selectedSupplierId} onChange={e => setSelectedSupplierId(e.target.value)}
                  >
                    <option value="">Select Supplier...</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Invoice Number</label>
                  <input 
                    className="w-full px-4 py-2 rounded-lg border border-black/10"
                    value={invoiceNum} onChange={e => setInvoiceNum(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-4 bg-bg rounded-xl space-y-4">
                <p className="text-sm font-bold">Add Item to GRN</p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-xs">Medicine</label>
                    <select className="w-full px-3 py-1.5 rounded border" value={selectedItemId} onChange={e => setSelectedItemId(e.target.value)}>
                      <option value="">Select Item...</option>
                      {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs">Batch No</label>
                    <input className="w-full px-3 py-1.5 rounded border" value={newBatchNum} onChange={e => setNewBatchNum(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs">Expiry Date</label>
                    <input type="date" className="w-full px-3 py-1.5 rounded border" value={newExpiry} onChange={e => setNewExpiry(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs">MRP</label>
                    <input type="number" className="w-full px-3 py-1.5 rounded border" value={newMrp} onChange={e => setNewMrp(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs">Purchase Price</label>
                    <input type="number" className="w-full px-3 py-1.5 rounded border" value={newPurchasePrice} onChange={e => setNewPurchasePrice(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs">GST %</label>
                    <select className="w-full px-3 py-1.5 rounded border" value={newGst} onChange={e => setNewGst(e.target.value)}>
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs">Quantity</label>
                    <input type="number" className="w-full px-3 py-1.5 rounded border" value={newQty} onChange={e => setNewQty(e.target.value)} />
                  </div>
                  <div className="flex items-end">
                    <button onClick={addToGrn} className="w-full bg-secondary text-primary font-bold py-1.5 rounded border border-primary/20 hover:bg-primary hover:text-white transition-all">Add Item</button>
                  </div>
                </div>
              </div>

              <div className="mt-6 border rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-bg">
                    <tr>
                      <th className="px-4 py-2">Item</th>
                      <th className="px-4 py-2">Batch</th>
                      <th className="px-4 py-2">Expiry</th>
                      <th className="px-4 py-2">Qty</th>
                      <th className="px-4 py-2">GST</th>
                      <th className="px-4 py-2">P.Price</th>
                      <th className="px-4 py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {grnItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 font-medium">{item.name}</td>
                        <td className="px-4 py-3">{item.batch_number}</td>
                        <td className="px-4 py-3">{item.expiry_date}</td>
                        <td className="px-4 py-3">{item.quantity}</td>
                        <td className="px-4 py-3">{item.gst}%</td>
                        <td className="px-4 py-3">₹{item.purchase_price}</td>
                        <td className="px-4 py-3 font-bold">₹{item.purchase_price * item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={handleGrn}
                  disabled={grnItems.length === 0 || !selectedSupplierId}
                  className="bg-primary text-white px-8 py-2 rounded-lg font-bold shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  Submit GRN & Update Stock
                </button>
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card title="Purchase Orders History">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-black/5">
                        <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">PO Number</th>
                        <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Supplier</th>
                        <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Date</th>
                        <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Amount</th>
                        <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {purchaseOrders.map(po => (
                        <tr key={po.id}>
                          <td className="px-4 py-4 font-mono text-primary">{po.po_number}</td>
                          <td className="px-4 py-4">{po.supplier_name}</td>
                          <td className="px-4 py-4 text-sm">{new Date(po.po_date).toLocaleDateString()}</td>
                          <td className="px-4 py-4 font-bold">₹{po.total_amount}</td>
                          <td className="px-4 py-4"><Badge variant="info">{po.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
              <Card title="Create New Purchase Order">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Supplier</label>
                    <select 
                      className="w-full px-4 py-2 rounded-lg border border-black/10"
                      value={selectedSupplierId} onChange={e => setSelectedSupplierId(e.target.value)}
                    >
                      <option value="">Select Supplier...</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="p-4 bg-bg rounded-xl space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-xs">Medicine</label>
                      <select className="w-full px-3 py-1.5 rounded border" value={selectedItemId} onChange={e => setSelectedItemId(e.target.value)}>
                        <option value="">Select Item...</option>
                        {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs">Expected Price</label>
                      <input type="number" className="w-full px-3 py-1.5 rounded border" value={newPurchasePrice} onChange={e => setNewPurchasePrice(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs">Quantity</label>
                      <input type="number" className="w-full px-3 py-1.5 rounded border" value={newQty} onChange={e => setNewQty(e.target.value)} />
                    </div>
                    <div className="flex items-end">
                      <button onClick={addToGrn} className="w-full bg-primary text-white font-bold py-1.5 rounded">Add to PO</button>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button 
                    onClick={handlePo}
                    disabled={grnItems.length === 0 || !selectedSupplierId}
                    className="bg-primary text-white px-8 py-2 rounded-lg font-bold shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    Generate Purchase Order
                  </button>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'narcotics' && (
        <Card title="Narcotics Register (Statutory Compliance)">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-black/5">
                  <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Date</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Medicine</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Batch</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Action</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text/40 uppercase">Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {narcoticsLog.map(l => (
                  <tr key={l.id} className="hover:bg-bg/50 transition-colors">
                    <td className="px-4 py-4 text-sm text-text/60">{new Date(l.log_date).toLocaleString()}</td>
                    <td className="px-4 py-4 font-medium text-text">{l.item_name}</td>
                    <td className="px-4 py-4 text-sm text-text/60">{l.batch_number}</td>
                    <td className="px-4 py-4">
                      <Badge variant={l.action_type === 'Received' ? 'success' : l.action_type === 'Returned' ? 'info' : 'alert'}>{l.action_type}</Badge>
                    </td>
                    <td className="px-4 py-4 text-sm font-bold">{l.quantity} Units</td>
                  </tr>
                ))}
                {narcoticsLog.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-text/40 italic">No narcotics transactions recorded</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeSubTab === 'returns' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Process Medicine Return">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Select Bill to Return</label>
                <select 
                  className="w-full px-4 py-2 rounded-lg border border-black/10"
                  value={returnDispenseId} onChange={e => setReturnDispenseId(e.target.value)}
                >
                  <option value="">Choose Bill...</option>
                  {recentDispensing.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.bill_number} - {d.patient_name || 'Walk-in'} (₹{d.net_amount})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Reason for Return</label>
                <textarea 
                  className="w-full px-4 py-2 rounded-lg border border-black/10"
                  rows={3}
                  value={returnReason} onChange={e => setReturnReason(e.target.value)}
                />
              </div>
              <div className="p-4 bg-alert/5 border border-alert/20 rounded-xl">
                <p className="text-xs font-bold text-alert flex items-center gap-2">
                  <AlertTriangle size={14} />
                  Return Policy Notice
                </p>
                <p className="text-[10px] text-text/60 mt-1">
                  Ensure medicines are in original packaging and not expired. Narcotics returns require additional documentation.
                </p>
              </div>
              <button 
                onClick={async () => {
                  if (!returnDispenseId) return;
                  // For simplicity in this demo, we'll return all items in the bill
                  const res = await fetch('/api/pharmacy/returns', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      hospital_id: hospitalId,
                      dispensing_id: parseInt(returnDispenseId),
                      reason: returnReason,
                      items: [] // In real app, we'd pass items to return
                    })
                  });
                  if ((await res.json()).success) {
                    alert("Return processed successfully");
                    setReturnDispenseId('');
                    setReturnReason('');
                    fetchData();
                  }
                }}
                className="w-full bg-error text-white py-3 rounded-xl font-bold"
              >
                Process Full Return
              </button>
            </div>
          </Card>
          <Card title="Recent Dispensing History">
            <div className="space-y-4">
              {recentDispensing.slice(0, 10).map(d => (
                <div key={d.id} className="flex justify-between items-center p-3 bg-bg rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{d.bill_number}</p>
                    <p className="text-xs text-text/40">{d.patient_name || 'Walk-in'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">₹{d.net_amount}</p>
                    <p className="text-[10px] text-text/40">{new Date(d.bill_date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
              {recentDispensing.length === 0 && <p className="text-center text-text/40 italic py-4">No dispensing history</p>}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
