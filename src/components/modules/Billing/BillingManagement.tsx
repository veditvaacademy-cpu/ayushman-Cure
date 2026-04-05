import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  CreditCard, 
  Share2, 
  Printer 
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { clsx } from 'clsx';
import { 
  BillingRecord 
} from '../../types';

interface BillingManagementProps {
  hospitalId: number;
}

export const BillingManagement = ({ hospitalId }: BillingManagementProps) => {
  const [bills, setBills] = useState<BillingRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'opd' | 'ipd' | 'pharmacy' | 'lab' | 'radiology' | 'ot' | 'icu' | 'ambulance' | 'package'>('all');

  useEffect(() => {
    const mockBills: BillingRecord[] = [
      {
        id: 1,
        hospital_id: 1,
        patient_id: 1,
        bill_number: 'BILL-2024-001',
        bill_date: '2024-03-07',
        items: [{ id: 1, bill_id: 1, description: 'Consultation Fee', quantity: 1, unit_price: 500, total_price: 500, category: 'OPD' }],
        total_amount: 500,
        discount_amount: 0,
        tax_amount: 0,
        net_amount: 500,
        payment_status: 'Paid',
        payment_mode: 'UPI',
        category: 'OPD',
        patient_name: 'John Doe',
        patient_id_str: 'PAT001'
      },
      {
        id: 2,
        hospital_id: 1,
        patient_id: 2,
        bill_number: 'BILL-2024-002',
        bill_date: '2024-03-07',
        items: [{ id: 2, bill_id: 2, description: 'Amoxicillin 500mg', quantity: 2, unit_price: 150, total_price: 300, category: 'Pharmacy' }],
        total_amount: 300,
        discount_amount: 0,
        tax_amount: 0,
        net_amount: 300,
        payment_status: 'Paid',
        payment_mode: 'Cash',
        category: 'Pharmacy',
        patient_name: 'Jane Smith',
        patient_id_str: 'PAT002'
      }
    ];
    setBills(mockBills);
  }, []);

  const filteredBills = activeTab === 'all' ? bills : bills.filter(b => b.category.toLowerCase() === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text">Centralized Billing</h2>
          <p className="text-text/40">Manage payments and invoices across all departments</p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">
          <Plus size={20} />
          <span>New Bill</span>
        </button>
      </div>

      <div className="flex gap-2 p-1 bg-bg rounded-xl w-fit overflow-x-auto max-w-full">
        {['all', 'opd', 'ipd', 'pharmacy', 'lab', 'radiology', 'ot', 'icu', 'ambulance', 'package'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={clsx(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
              activeTab === tab ? "bg-white text-primary shadow-sm" : "text-text/40 hover:text-text"
            )}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredBills.map(bill => (
          <div key={bill.id}>
            <Card>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-text">{bill.bill_number}</h4>
                      <Badge variant={bill.payment_status === 'Paid' ? 'success' : 'alert'}>
                        {bill.payment_status}
                      </Badge>
                    </div>
                    <p className="text-sm text-text/40">{bill.patient_name} ({bill.patient_id_str}) • {bill.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-right">
                    <p className="text-xs text-text/40 uppercase tracking-wider font-bold">Amount</p>
                    <p className="text-lg font-bold text-text">₹{bill.net_amount}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 text-text/40 hover:text-primary hover:bg-primary/5 rounded-lg transition-all" title="Share Bill">
                      <Share2 size={18} />
                    </button>
                    <button className="p-2 text-text/40 hover:text-primary hover:bg-primary/5 rounded-lg transition-all" title="Print Bill">
                      <Printer size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ))}
        {filteredBills.length === 0 && (
          <div className="py-20 text-center bg-white rounded-2xl border-2 border-dashed border-black/5">
            <div className="w-16 h-16 bg-bg rounded-full flex items-center justify-center mx-auto mb-4 text-text/20">
              <CreditCard size={32} />
            </div>
            <p className="text-text/40 font-medium italic">No billing records found for this category</p>
          </div>
        )}
      </div>
    </div>
  );
};
