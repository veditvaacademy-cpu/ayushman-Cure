import React from 'react';
import { 
  CheckCircle2, 
  Calendar, 
  Bed, 
  FileText, 
  Phone 
} from 'lucide-react';
import { clsx } from 'clsx';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface NurseDashboardProps {
  hospitalId: number;
}

export const NurseDashboard = ({ hospitalId }: NurseDashboardProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card title="Medication Due Alerts" className="border-t-4 border-t-error">
          <div className="space-y-3 mt-2">
            {[
              { time: '10:00 AM', room: '204', patient: 'Rajesh K.', med: 'Paracetamol 500mg', urgent: true },
              { time: '10:15 AM', room: '102', patient: 'Sunita W.', med: 'Insulin 10 Units', urgent: false },
              { time: '10:30 AM', room: '305', patient: 'Vikram S.', med: 'Amoxicillin', urgent: false },
              { time: '11:00 AM', room: '208', patient: 'Anita S.', med: 'IV Fluids', urgent: true },
            ].map((alert, i) => (
              <div key={i} className={clsx(
                "p-3 rounded-2xl border transition-all flex justify-between items-center group cursor-pointer",
                alert.urgent ? "bg-error/5 border-error/10 hover:bg-error/10" : "bg-black/2 border-black/5 hover:bg-black/5"
              )}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={clsx("text-[10px] font-black px-1.5 py-0.5 rounded", alert.urgent ? "bg-error text-white" : "bg-black/10 text-text/60")}>
                      {alert.time}
                    </span>
                    <span className="text-[10px] font-bold text-text/40 uppercase tracking-widest">Room {alert.room}</span>
                  </div>
                  <p className="text-sm font-black text-text">{alert.patient}</p>
                  <p className="text-xs text-text/60 font-medium">{alert.med}</p>
                </div>
                <button className="w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center text-success hover:scale-110 active:scale-90 transition-all">
                  <CheckCircle2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Vital Signs Pending" className="border-t-4 border-t-warning">
          <div className="space-y-3 mt-2">
            {[
              { room: '201', name: 'Anita Sharma', last: '4 hrs ago', status: 'Overdue' },
              { room: '205', name: 'Gopal Das', last: '3.5 hrs ago', status: 'Due' },
              { room: '108', name: 'Meena Kumari', last: '5 hrs ago', status: 'Overdue' },
              { room: '302', name: 'Rahul Singh', last: '2 hrs ago', status: 'Upcoming' },
            ].map((vital, i) => (
              <div key={i} className="p-3 bg-black/2 border border-black/5 rounded-2xl flex justify-between items-center hover:bg-black/5 transition-all">
                <div>
                  <p className="text-sm font-black text-text">Room {vital.room} - {vital.name}</p>
                  <p className="text-[10px] text-text/40 font-bold uppercase mt-0.5">Last: {vital.last}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={clsx(
                    "text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full",
                    vital.status === 'Overdue' ? "bg-error/10 text-error" : "bg-warning/10 text-warning"
                  )}>
                    {vital.status}
                  </span>
                  <button className="px-3 py-1 bg-primary text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">Record</button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card title="Shift & Bed Status">
            <div className="space-y-6">
              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-primary/20 rounded-lg text-primary"><Calendar size={18} /></div>
                  <span className="text-sm font-black text-text">Shift Schedule</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-text/60">Current Shift</p>
                    <p className="text-sm font-black text-text">Morning (8am - 2pm)</p>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
              </div>

              <div className="p-4 bg-accent/5 rounded-2xl border border-accent/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-accent/20 rounded-lg text-accent"><Bed size={18} /></div>
                  <span className="text-sm font-black text-text">Bed Allotment</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-2 bg-white rounded-xl border border-black/5">
                    <p className="text-[10px] font-bold text-text/40 uppercase">Occupied</p>
                    <p className="text-xl font-black text-text">42</p>
                  </div>
                  <div className="text-center p-2 bg-white rounded-xl border border-black/5">
                    <p className="text-[10px] font-bold text-text/40 uppercase">Available</p>
                    <p className="text-xl font-black text-accent">08</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Quick Resources">
            <div className="grid grid-cols-2 gap-2">
              <button className="p-3 bg-black/2 hover:bg-black/5 rounded-xl border border-black/5 flex flex-col items-center gap-2 transition-all">
                <FileText size={18} className="text-text/40" />
                <span className="text-[10px] font-bold uppercase">Forms</span>
              </button>
              <button className="p-3 bg-black/2 hover:bg-black/5 rounded-xl border border-black/5 flex flex-col items-center gap-2 transition-all">
                <Phone size={18} className="text-text/40" />
                <span className="text-[10px] font-bold uppercase">Directory</span>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
