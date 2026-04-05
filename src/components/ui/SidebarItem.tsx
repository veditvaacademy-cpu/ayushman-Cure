import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
  hidden?: boolean;
}

export const SidebarItem = ({ icon: Icon, label, active, onClick, hidden }: SidebarItemProps) => {
  if (hidden) return null;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
        active 
          ? 'bg-primary text-white' 
          : 'text-white/70 hover:bg-white/10 hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );
};
