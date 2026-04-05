import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Stethoscope, 
  Clock, 
  CreditCard 
} from 'lucide-react';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Doctor } from '../../../types';

interface DoctorsManagementProps {
  hospitalId: number;
}

export const DoctorsManagement = ({ hospitalId }: DoctorsManagementProps) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [schedule, setSchedule] = useState('');
  const [fee, setFee] = useState('0');

  const fetchDoctors = async () => {
    const res = await fetch(`/api/doctors?hospitalId=${hospitalId}`);
    setDoctors(await res.json());
  };

  useEffect(() => { fetchDoctors(); }, [hospitalId]);

  useEffect(() => {
    if (editingDoctor) {
      setName(editingDoctor.name);
      setDepartment(editingDoctor.department);
      setSchedule(editingDoctor.schedule || '');
      setFee((editingDoctor.consultation_fee || 0).toString());
      setShowAdd(true);
    } else {
      setName(''); setDepartment(''); setSchedule(''); setFee('0');
    }
  }, [editingDoctor]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDoctor) {
      await fetch(`/api/doctors/${editingDoctor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, department, schedule, consultation_fee: parseFloat(fee) })
      });
      setEditingDoctor(null);
    } else {
      await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hospital_id: hospitalId, name, department, schedule, consultation_fee: parseFloat(fee) })
      });
    }
    setName(''); setDepartment(''); setSchedule(''); setFee('0');
    setShowAdd(false);
    fetchDoctors();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      await fetch(`/api/doctors/${id}`, { method: 'DELETE' });
      fetchDoctors();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text">Doctors Directory</h2>
          <p className="text-text/60">Manage medical staff and schedules</p>
        </div>
        <button 
          onClick={() => {
            setShowAdd(!showAdd);
            if (showAdd) setEditingDoctor(null);
          }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-all"
        >
          <Plus size={20} />
          {showAdd ? 'Cancel' : 'Add Doctor'}
        </button>
      </div>

      {showAdd && (
        <Card title={editingDoctor ? "Edit Doctor Details" : "Register New Doctor"}>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Full Name</label>
              <input 
                className="w-full px-4 py-2 rounded-lg border border-black/10 focus:ring-2 focus:ring-primary/20"
                value={name} onChange={e => setName(e.target.value)} required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Department</label>
              <input 
                className="w-full px-4 py-2 rounded-lg border border-black/10 focus:ring-2 focus:ring-primary/20"
                value={department} onChange={e => setDepartment(e.target.value)} required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Schedule (e.g. Mon-Fri, 9am-5pm)</label>
              <input 
                className="w-full px-4 py-2 rounded-lg border border-black/10 focus:ring-2 focus:ring-primary/20"
                value={schedule} onChange={e => setSchedule(e.target.value)} required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text/40 uppercase tracking-wider">Consultation Fee (₹)</label>
              <input 
                type="number"
                className="w-full px-4 py-2 rounded-lg border border-black/10 focus:ring-2 focus:ring-primary/20"
                value={fee} onChange={e => setFee(e.target.value)} required
              />
            </div>
            <div className="md:col-span-4 flex justify-end gap-3">
              {editingDoctor && (
                <button 
                  type="button" 
                  onClick={() => {
                    setEditingDoctor(null);
                    setShowAdd(false);
                  }}
                  className="px-8 py-2 rounded-lg font-semibold border border-black/10 hover:bg-bg transition-colors"
                >
                  Cancel
                </button>
              )}
              <button type="submit" className="bg-primary text-white px-8 py-2 rounded-lg font-semibold shadow-lg shadow-primary/20">
                {editingDoctor ? 'Update Doctor' : 'Save Doctor'}
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.map(d => (
          <div key={d.id}>
            <Card title={d.name}>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-text/80">
                  <Stethoscope size={16} className="text-primary" />
                  <span className="font-medium">{d.department}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-text/60">
                  <Clock size={16} />
                  <span>{d.schedule || 'Schedule not set'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-primary">
                  <CreditCard size={16} />
                  <span>Fee: ₹{d.consultation_fee || 0}</span>
                </div>
                <div className="pt-3 flex gap-2">
                  <Badge variant="info">Active</Badge>
                  <Badge>On Duty</Badge>
                </div>
                <div className="pt-3 border-t border-black/5 flex justify-end gap-2">
                  <button 
                    onClick={() => setEditingDoctor(d)}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(d.id)}
                    className="text-xs font-bold text-error hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};
