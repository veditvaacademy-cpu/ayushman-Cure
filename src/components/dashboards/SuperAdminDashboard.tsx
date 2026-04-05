import React, { useState, useEffect } from 'react';
import { Plus, Settings } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Hospital } from '../../types';

export const SuperAdminDashboard = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const fetchHospitals = async () => {
    const res = await fetch('/api/hospitals');
    const data = await res.json();
    setHospitals(data);
  };

  useEffect(() => { fetchHospitals(); }, []);

  const handleAddHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/hospitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, address: newAddress, config: { opd: true } })
    });
    setNewName('');
    setNewAddress('');
    setShowAdd(false);
    fetchHospitals();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text">Hospital Management</h2>
          <p className="text-text/60">Manage all registered medical facilities</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-all"
        >
          <Plus size={20} />
          Add Hospital
        </button>
      </div>

      {showAdd && (
        <Card title="Register New Hospital">
          <form onSubmit={handleAddHospital} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              placeholder="Hospital Name" 
              className="px-4 py-2 rounded-lg border border-black/10"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              required
            />
            <input 
              placeholder="Address" 
              className="px-4 py-2 rounded-lg border border-black/10"
              value={newAddress}
              onChange={e => setNewAddress(e.target.value)}
              required
            />
            <div className="md:col-span-2 flex justify-end gap-2">
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-text/60">Cancel</button>
              <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg">Save Hospital</button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hospitals.map(h => (
          <div key={h.id}>
            <Card title={h.name}>
              <div className="space-y-4">
                <div className="flex items-start gap-3 text-sm text-text/60">
                  <Settings size={16} className="mt-1" />
                  <p>{h.address}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="success">OPD Active</Badge>
                  <Badge variant="info">Admin Panel</Badge>
                </div>
                <button className="w-full mt-4 py-2 border border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary/5 transition-all">
                  Configure Access
                </button>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};
