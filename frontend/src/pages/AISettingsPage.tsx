import React, { useState, useEffect } from 'react';
import {
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  ExternalLink,
  Sliders,
  ShieldCheck,
  Server
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export const AISettingsPage: React.FC = () => {
  const toast = useToast();
  const [aiHealth, setAiHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const res = await api.getAiHealth();
      setAiHealth(res);
    } catch (err: any) {
      toast.error('Health Check Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Cpu className="w-6 h-6 text-indigo-600" />
            Local AI Engine & Ollama Configuration
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor local language model connectivity, inspect configured weights, and toggle offline fallback engines.
          </p>
        </div>

        <button
          onClick={checkHealth}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 p-2 rounded-lg border border-slate-200 dark:border-slate-800 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Check Status</span>
        </button>
      </div>

      {/* Main Status Card */}
      <div className={`p-6 rounded-2xl border shadow-sm space-y-4 ${
        aiHealth?.is_available
          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
          : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              aiHealth?.is_available ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
            }`}>
              {aiHealth?.is_available ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {aiHealth?.is_available ? 'Local Ollama Engine Connected' : 'Ollama Offline — Demo Fallback Active'}
                </h2>
                <Badge variant={aiHealth?.is_available ? 'success' : 'warning'} size="sm">
                  {aiHealth?.is_available ? 'ONLINE' : 'FALLBACK ACTIVE'}
                </Badge>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {aiHealth?.message}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 font-mono text-xs">
          <div>
            <span className="text-slate-400 font-sans block text-[11px]">Base Endpoint:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{aiHealth?.base_url || 'http://localhost:11434'}</span>
          </div>
          <div>
            <span className="text-slate-400 font-sans block text-[11px]">Target Model:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{aiHealth?.configured_model || 'llama3'}</span>
          </div>
          <div>
            <span className="text-slate-400 font-sans block text-[11px]">Model Found:</span>
            <span className={`font-semibold ${aiHealth?.model_installed ? 'text-emerald-600' : 'text-amber-600'}`}>
              {aiHealth?.model_installed ? 'Yes (Local)' : 'No (Requires Pull)'}
            </span>
          </div>
        </div>
      </div>

      {/* Ollama Setup Instructions Guide Mandated by Section 2 */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-600" />
          Setup & Run Free Local AI Models
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          SocialPilot AI never forces external paid API keys. You can run 100% free, private models right on your local machine using Ollama:
        </p>

        <div className="space-y-3 font-mono text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 space-y-1">
            <div className="text-[10px] text-slate-400 uppercase font-sans font-bold">
              Step 1: Download & Install Ollama
            </div>
            <div># Visit https://ollama.ai/download and run the installer for Windows / Mac / Linux</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 space-y-1">
            <div className="text-[10px] text-slate-400 uppercase font-sans font-bold">
              Step 2: Download Free Compatible Weights (in terminal)
            </div>
            <div className="text-emerald-400">ollama pull llama3</div>
            <div className="text-slate-400 text-[11px]"># or lightweight: ollama pull mistral or phi3</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 space-y-1">
            <div className="text-[10px] text-slate-400 uppercase font-sans font-bold">
              Step 3: Run Ollama Daemon
            </div>
            <div className="text-emerald-400">ollama serve</div>
            <div className="text-slate-400 text-[11px]"># Runs background HTTP server on http://localhost:11434</div>
          </div>
        </div>
      </div>

      {/* Free Cloud AI Image Generation Engine (Pollinations.ai) */}
      <div className="p-6 rounded-2xl border shadow-sm space-y-4 bg-teal-50/50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900/60">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-teal-600 text-white shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Free AI Image Engine (Pollinations.ai / Flux.1)
                </h2>
                <Badge variant="teal" size="sm">
                  100% FREE • NO KEY REQUIRED
                </Badge>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Connected to Pollinations open cloud inference edge. Generates high-resolution 3D visuals, device mockups, and corporate artwork with 0 API keys.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-teal-200/60 dark:border-teal-800/60 font-mono text-xs">
          <div>
            <span className="text-slate-400 font-sans block text-[11px]">Endpoint:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">image.pollinations.ai</span>
          </div>
          <div>
            <span className="text-slate-400 font-sans block text-[11px]">Active Models:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">FLUX.1 • SDXL • SANA</span>
          </div>
          <div>
            <span className="text-slate-400 font-sans block text-[11px]">Authentication:</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Zero Keys (Public Edge)</span>
          </div>
          <div>
            <span className="text-slate-400 font-sans block text-[11px]">Hybrid Compositor:</span>
            <span className="font-semibold text-teal-600 dark:text-teal-400">Auto Vector Overlays</span>
          </div>
        </div>
      </div>
    </div>
  );
};
