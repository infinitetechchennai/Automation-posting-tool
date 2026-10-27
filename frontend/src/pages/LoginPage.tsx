import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SendHorizontal, Lock, Mail, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/common/Button';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const fillDemoCredentials = () => {
    setEmail('demo@socialpilot.ai');
    setPassword('Demo123!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!', 'Logged in to SocialPilot AI studio.');
      navigate('/');
    } catch (err: any) {
      toast.error('Login Failed', err.message || 'Incorrect email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-cyan-500/10 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-500/10 blur-[100px] pointer-events-none rounded-full" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>Autonomous Social Media Studio</span>
        </div>

        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-cyan-400 mx-auto flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 ring-1 ring-white/20">
          <SendHorizontal className="w-7 h-7 -rotate-12" />
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-white font-['Outfit',sans-serif]">
          Sign in to <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">SocialPilot AI</span>
        </h1>
        <p className="text-sm text-slate-400 max-w-sm mx-auto">
          AI Content Generator & Multi-Platform Publisher with ₹0 operational cost.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 shadow-2xl shadow-black/60 border border-slate-800 rounded-3xl sm:px-10 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-800/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-150"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={fillDemoCredentials}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                >
                  ⚡ Auto-fill Demo
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-800/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-150"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 mt-2 text-sm font-semibold shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50"
              loading={loading}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Studio
            </Button>
          </form>

          {/* Quick Demo Credentials Pill */}
          <div className="bg-slate-800/50 rounded-2xl p-3 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Demo: <strong className="text-slate-200">demo@socialpilot.ai</strong></span>
            </div>
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="text-indigo-400 hover:text-indigo-300 font-semibold px-2 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 transition-all"
            >
              Use
            </button>
          </div>

          <div className="text-center pt-3 border-t border-slate-800 text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
              Create an account free
            </Link>
          </div>
        </div>

        {/* Platform Integration Badges */}
        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#1877F2]"></span> Facebook</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#E4405F]"></span> Instagram</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#0A66C2]"></span> LinkedIn</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#1DA1F2]"></span> X (Twitter)</span>
        </div>
      </div>
    </div>
  );
};
