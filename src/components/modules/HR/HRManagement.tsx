import React, { useState } from 'react';
import { Card } from '../../ui/Card';
import clsx from 'clsx';

interface HRManagementProps {
  hospitalId: number;
}

export const HRManagement = ({ hospitalId }: HRManagementProps) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'staff' | 'logs'>('roster');
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text">HR & Roster Management</h2>
        <div className="flex gap-2 bg-white p-1 rounded-lg border border-black/5">
          {(['roster', 'staff', 'logs'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                "px-4 py-1.5 rounded-md text-xs font-bold transition-all uppercase tracking-wider",
                activeTab === tab ? "bg-primary text-white shadow-md" : "text-text/40 hover:bg-black/5"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'roster' && (
        <Card title="Staff Duty Roster">
          <div className="p-6 text-center text-text/40 italic">Roster management interface</div>
        </Card>
      )}
      {activeTab === 'staff' && (
        <Card title="Staff Directory">
          <div className="p-6 text-center text-text/40 italic">Staff records and documentation</div>
        </Card>
      )}
      {activeTab === 'logs' && (
        <Card title="Time Logs & Attendance">
          <div className="p-6 text-center text-text/40 italic">Attendance tracking and logs</div>
        </Card>
      )}
    </div>
  );
};
