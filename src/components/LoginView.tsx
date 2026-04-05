import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Hospital as HospitalIcon, 
  User as LucideUser, 
  ShieldCheck, 
  Eye, 
  EyeOff 
} from 'lucide-react';
import { User } from '../types';

export const LoginView = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        onLogin(data.user);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center p-4 relative" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop")' }}>
      <div className="absolute inset-0 bg-black/20" />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass rounded-[32px] p-6 lg:p-10 shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-primary/90 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl">
            <HospitalIcon size={40} />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Cure Manage HMS</h1>
          <p className="text-white/80 text-lg font-medium">Hospital Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60">
              <LucideUser size={20} />
            </div>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white/10 border border-white/20 pl-12 pr-4 py-4 rounded-2xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
              placeholder="Username"
              required
            />
          </div>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60">
              <ShieldCheck size={20} />
            </div>
            <input 
              type={showPassword ? "text" : "password"} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/10 border border-white/20 pl-12 pr-12 py-4 rounded-2xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
              placeholder="Password"
              required
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          
          {error && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-300 text-sm font-medium text-center"
            >
              {error}
            </motion.p>
          )}

          <button 
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl transition-all shadow-xl text-lg"
          >
            Login
          </button>

          <div className="flex items-center justify-between px-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/10 text-primary focus:ring-primary/50"
              />
              <span className="text-sm text-white/80 group-hover:text-white transition-colors">Remember Me</span>
            </label>
            <button type="button" className="text-sm text-white/80 hover:text-white transition-colors font-medium">
              Forgot Password?
            </button>
          </div>
        </form>
        
        <div className="mt-10 pt-8 border-t border-white/10 text-center">
          <p className="text-sm font-bold text-white tracking-widest uppercase">DIGITAL COMMUNIQUE PVT LTD</p>
        </div>
      </motion.div>
    </div>
  );
};
