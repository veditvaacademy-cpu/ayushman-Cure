import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  AlertTriangle, 
  MapPin, 
  Phone, 
  TrendingUp, 
  Activity, 
  X, 
  User as LucideUser 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { clsx } from 'clsx';
import { 
  Ambulance, 
  AmbulanceBooking, 
  Patient 
} from '../../types';

interface AmbulanceManagementProps {
  hospitalId: number;
}

export const AmbulanceManagement = ({ hospitalId }: AmbulanceManagementProps) => {
  const [view, setView] = useState<'bookings' | 'fleet' | 'request'>('bookings');
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [bookings, setBookings] = useState<AmbulanceBooking[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [trackingBooking, setTrackingBooking] = useState<AmbulanceBooking | null>(null);
  const [simulatedPos, setSimulatedPos] = useState({ lat: 28.6139, lng: 77.2090 });

  // Form states
  const [selectedPatient, setSelectedPatient] = useState('');
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [fare, setFare] = useState('0');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ambRes, bookRes, patRes] = await Promise.all([
        fetch(`/api/ambulances?hospitalId=${hospitalId}`),
        fetch(`/api/ambulances/bookings?hospitalId=${hospitalId}`),
        fetch(`/api/patients?hospitalId=${hospitalId}`)
      ]);
      setAmbulances(await ambRes.json());
      setBookings(await bookRes.json());
      setPatients(await patRes.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [hospitalId]);

  useEffect(() => {
    let interval: any;
    if (trackingBooking) {
      interval = setInterval(() => {
        setSimulatedPos(prev => ({
          lat: prev.lat + (Math.random() - 0.5) * 0.001,
          lng: prev.lng + (Math.random() - 0.5) * 0.001
        }));
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [trackingBooking]);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/ambulances/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hospital_id: hospitalId,
        patient_id: selectedPatient ? parseInt(selectedPatient) : null,
        pickup_location: pickup,
        destination: destination,
        fare: parseFloat(fare)
      })
    });
    setView('bookings');
    fetchData();
  };

  const assignAmbulance = async (bookingId: number, ambulanceId: number) => {
    await fetch(`/api/ambulances/bookings/${bookingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ambulance_id: ambulanceId, status: 'Assigned' })
    });
    fetchData();
  };

  const updateBookingStatus = async (bookingId: number, status: string, ambulanceId?: number) => {
    await fetch(`/api/ambulances/bookings/${bookingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        status, 
        ambulance_id: ambulanceId,
        completion_time: status === 'Completed' ? new Date().toISOString() : undefined
      })
    });
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text">Ambulance Services</h2>
          <p className="text-text/60">Emergency Transport & Fleet Management</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setView('bookings')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'bookings' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white border border-black/10 text-text/60 hover:bg-bg'}`}
          >
            Active Bookings
          </button>
          <button 
            onClick={() => setView('fleet')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'fleet' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white border border-black/10 text-text/60 hover:bg-bg'}`}
          >
            Fleet Status
          </button>
          <button 
            onClick={() => setView('request')}
            className="flex items-center gap-2 px-4 py-2 bg-error text-white rounded-lg text-sm font-bold shadow-lg shadow-error/20 hover:bg-error/90 transition-all"
          >
            <AlertTriangle size={16} />
            Request Ambulance
          </button>
        </div>
      </div>

      {view === 'request' ? (
        <Card title="New Ambulance Request">
          <form onSubmit={handleRequest} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-text/60 uppercase tracking-widest">Patient (Optional)</label>
                <select 
                  className="w-full px-4 py-2 rounded-xl border border-black/10 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={selectedPatient}
                  onChange={e => setSelectedPatient(e.target.value)}
                >
                  <option value="">Walk-in / Emergency</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.patient_id_str})</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-text/60 uppercase tracking-widest">Estimated Fare (₹)</label>
                <input 
                  required
                  type="number"
                  className="w-full px-4 py-2 rounded-xl border border-black/10 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={fare}
                  onChange={e => setFare(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-text/60 uppercase tracking-widest">Pickup Location</label>
                <input 
                  required
                  className="w-full px-4 py-2 rounded-xl border border-black/10 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={pickup}
                  onChange={e => setPickup(e.target.value)}
                  placeholder="Enter full address or landmark"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-text/60 uppercase tracking-widest">Destination</label>
                <input 
                  required
                  className="w-full px-4 py-2 rounded-xl border border-black/10 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  placeholder="Hospital Ward or External Facility"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => setView('bookings')}
                className="px-6 py-2 rounded-xl border border-black/10 font-bold text-text/60 hover:bg-bg transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-8 py-2 bg-error text-white rounded-xl font-bold shadow-lg shadow-error/20 hover:bg-error/90 transition-all"
              >
                Dispatch Request
              </button>
            </div>
          </form>
        </Card>
      ) : view === 'bookings' ? (
        <div className="grid grid-cols-1 gap-4">
          {trackingBooking && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row h-[80vh]"
              >
                <div className="flex-1 bg-slate-100 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/light-v10/static/70,20,10/800x600?access_token=mock')] bg-cover bg-center opacity-50" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute -inset-4 bg-primary/20 rounded-full"
                      />
                      <div className="relative z-10 p-3 bg-primary text-white rounded-full shadow-xl">
                        <Truck size={24} />
                      </div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white px-2 py-1 rounded shadow text-[10px] font-bold whitespace-nowrap">
                        {trackingBooking.vehicle_number}
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                    <div className="bg-white/90 backdrop-blur p-3 rounded-xl shadow-lg border border-black/5">
                      <p className="text-[10px] font-bold text-text/40 uppercase tracking-widest">Current Location</p>
                      <p className="text-sm font-bold">{simulatedPos.lat.toFixed(4)}°N, {simulatedPos.lng.toFixed(4)}°E</p>
                      <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                        <Activity size={10} /> Live GPS Signal
                      </p>
                    </div>
                    <button onClick={() => setTrackingBooking(null)} className="p-2 bg-white rounded-full shadow-lg hover:bg-bg transition-colors">
                      <X size={20} />
                    </button>
                  </div>
                </div>
                <div className="w-full md:w-80 p-6 flex flex-col">
                  <div className="mb-6">
                    <Badge variant="info">In Transit</Badge>
                    <h3 className="text-xl font-bold mt-2">{trackingBooking.patient_name || 'Emergency Case'}</h3>
                    <p className="text-sm text-text/60">Trip ID: AMB-{trackingBooking.id}</p>
                  </div>
                  
                  <div className="space-y-6 flex-1">
                    <div className="relative pl-6 space-y-8">
                      <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-slate-100" />
                      <div className="relative">
                        <div className="absolute left-[-23px] top-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm" />
                        <p className="text-[10px] font-bold text-text/40 uppercase">Pickup</p>
                        <p className="text-sm font-medium">{trackingBooking.pickup_location}</p>
                      </div>
                      <div className="relative">
                        <div className="absolute left-[-23px] top-1 w-4 h-4 rounded-full bg-primary border-4 border-white shadow-sm" />
                        <p className="text-[10px] font-bold text-text/40 uppercase">Destination</p>
                        <p className="text-sm font-medium">{trackingBooking.destination}</p>
                      </div>
                    </div>
                    
                    <div className="pt-6 border-t border-black/5">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                            <LucideUser size={20} />
                          </div>
                          <div>
                            <p className="text-xs font-bold">{trackingBooking.driver_name}</p>
                            <p className="text-[10px] text-text/40">Driver</p>
                          </div>
                        </div>
                        <button className="p-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors">
                          <Phone size={16} />
                        </button>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl">
                        <p className="text-[10px] font-bold text-text/40 uppercase mb-1">Estimated Arrival</p>
                        <p className="text-lg font-bold text-primary">12 Minutes</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
          {bookings.map(book => (
            <div key={book.id}>
              <Card>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className={clsx(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    book.status === 'Requested' ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'
                  )}>
                    <Truck size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-text">{book.patient_name || 'Emergency Case'}</h4>
                    <p className="text-xs text-text/60 flex items-center gap-1">
                      <TrendingUp size={12} className="text-error" /> {book.pickup_location} → {book.destination}
                    </p>
                    <p className="text-[10px] text-text/40 mt-1">
                      Requested: {new Date(book.booking_time).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {book.vehicle_number && (
                    <div className="text-right mr-4">
                      <p className="text-[10px] text-text/40 uppercase font-bold tracking-widest">Assigned Vehicle</p>
                      <p className="text-sm font-bold text-primary">{book.vehicle_number}</p>
                      <p className="text-[10px] text-text/40">{book.driver_name}</p>
                    </div>
                  )}
                  <Badge variant={book.status === 'Completed' ? 'success' : book.status === 'Requested' ? 'error' : 'info'}>
                    {book.status}
                  </Badge>
                  
                  <div className="flex gap-2 ml-4 border-l border-black/5 pl-4">
                    {book.status === 'Assigned' && (
                      <button 
                        onClick={() => setTrackingBooking(book)}
                        className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded text-[10px] font-bold hover:bg-primary/20 transition-colors"
                      >
                        <MapPin size={12} />
                        Track Live
                      </button>
                    )}
                    {book.status === 'Requested' && (
                      <div className="flex gap-2">
                        <select 
                          className="px-2 py-1 rounded border border-black/10 text-[10px] font-bold"
                          onChange={(e) => assignAmbulance(book.id, parseInt(e.target.value))}
                          defaultValue=""
                        >
                          <option value="" disabled>Assign Driver</option>
                          {ambulances.filter(a => a.status === 'Available').map(a => (
                            <option key={a.id} value={a.id}>{a.vehicle_number} ({a.driver_name})</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {book.status === 'Assigned' && (
                      <button 
                        onClick={() => updateBookingStatus(book.id, 'Enroute', book.ambulance_id)}
                        className="px-3 py-1 bg-accent text-white rounded text-[10px] font-bold"
                      >
                        Start Trip
                      </button>
                    )}
                    {book.status === 'Enroute' && (
                      <button 
                        onClick={() => updateBookingStatus(book.id, 'Completed', book.ambulance_id)}
                        className="px-3 py-1 bg-success text-white rounded text-[10px] font-bold"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
            </div>
          ))}
          {bookings.length === 0 && (
            <div className="py-20 text-center bg-white rounded-2xl border-2 border-dashed border-black/5">
              <div className="w-16 h-16 bg-bg rounded-full flex items-center justify-center mx-auto mb-4 text-text/20">
                <Truck size={32} />
              </div>
              <p className="text-text/40 font-medium italic">No active ambulance bookings</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {ambulances.map(amb => (
            <div key={amb.id}>
              <Card>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                    <Truck size={24} />
                  </div>
                  <Badge variant={amb.status === 'Available' ? 'success' : amb.status === 'Busy' ? 'error' : 'alert'}>
                    {amb.status}
                  </Badge>
                </div>
                <h4 className="font-bold text-lg">{amb.vehicle_number}</h4>
                <p className="text-sm text-text/60 mb-4">{amb.vehicle_type}</p>
                <div className="pt-4 border-t border-black/5 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-bold text-text/40 uppercase">Driver</p>
                    <p className="text-sm font-medium">{amb.driver_name}</p>
                  </div>
                  <button className="p-2 text-primary hover:bg-primary/5 rounded-full transition-colors">
                    <Phone size={18} />
                  </button>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
