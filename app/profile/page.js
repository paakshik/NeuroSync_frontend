"use client";
import { useState, useRef } from 'react';
import { silentEncrypt } from '@/utils/crypto';
import { setValue } from '@/utils/db';
import { Zap, Brain, Mic, ChevronRight, Sparkles } from 'lucide-react';

export default function ProfileSetup({ onComplete }) {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({ 
    name: "", 
    diagnosis: "General", 
    energy: "medium", 
    focus_time: 15 
  });
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState("READY");
  const mediaRecorder = useRef(null);

  const handleFinalSave = async () => {
    try {
      setStatus("SAVING");
      // Encrypt the full profile object for the vault
      const encrypted = await silentEncrypt(profile);
      await setValue("user_vault", encrypted);
      
      // Save individual preferences for easier access elsewhere
      await setValue("user_diagnosis", profile.diagnosis);
      await setValue("user_energy", profile.energy);
      await setValue("user_focus_time", profile.focus_time);
      
      onComplete();
    } catch (e) { 
      setStatus("ERROR"); 
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      const chunks = [];
      
      mediaRecorder.current.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.current.onstop = async () => {
        setIsRecording(false);
        setStatus("THINKING");
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('file', blob);
        
        try {
          const res = await fetch('/api/bridge', { method: 'POST', body: formData });
          const data = await res.json();
          if (data.transcription) {
            setProfile(prev => ({ ...prev, name: data.transcription }));
          }
          setStatus("READY");
          setStep(2);
        } catch (err) {
          setStatus("READY");
        }
      };
      
      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic access denied");
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0F172A] z-[100] p-6 font-lexend flex flex-col items-center justify-center overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {step === 1 && (
          <div className="space-y-12 text-center animate-in fade-in zoom-in duration-700">
            <h2 className="text-5xl font-black tracking-tight text-white italic">Who are we <span className="text-blue-400 font-normal not-italic">helping?</span></h2>
            <div className="flex flex-col items-center gap-10">
              <button 
                onPointerDown={startRecording}
                onPointerUp={() => mediaRecorder.current?.stop()}
                className={`w-44 h-44 rounded-[3rem] flex items-center justify-center transition-all duration-500 shadow-[0_0_50px_rgba(59,130,246,0.3)] border-4 ${
                  isRecording ? 'bg-red-500 border-white scale-110 shadow-red-500/50' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              >
                <Mic size={48} strokeWidth={2} />
              </button>
              <div className="w-full space-y-4">
                <input 
                  type="text" 
                  value={profile.name}
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                  placeholder="Tap mic or type name..."
                  className="w-full p-6 bg-white text-slate-900 text-2xl font-black text-center rounded-3xl border-4 border-blue-500 shadow-[0_10px_30px_rgba(0,0,0,0.5)] outline-none placeholder:text-slate-300"
                />
                {profile.name.length > 0 && (
                  <button onClick={() => setStep(2)} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-xl hover:bg-blue-500 flex items-center justify-center gap-2 group transition-all">
                    NEXT <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in slide-in-from-bottom-10 duration-500">
            <h2 className="text-3xl font-black text-white text-center mb-8 uppercase tracking-widest">Focus Profile</h2>
            {['ADHD', 'Autism', 'Anxiety', 'General'].map(d => (
              <button 
                key={d} 
                onClick={() => { setProfile({...profile, diagnosis: d}); setStep(3); }} 
                className="w-full p-8 bg-slate-800/50 backdrop-blur-xl rounded-[2rem] border-2 border-slate-700 text-2xl font-black text-left flex justify-between items-center text-white hover:border-blue-400 hover:bg-slate-800 transition-all shadow-xl active:scale-95"
              >
                {d} <Brain size={30} className="text-blue-400" />
              </button>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in zoom-in-95 duration-500">
            <h2 className="text-3xl font-black text-white text-center uppercase tracking-tighter italic">Engine <span className="text-blue-400">Calibration</span></h2>
            <div className="bg-slate-800/80 backdrop-blur-2xl p-8 rounded-[2.5rem] border-2 border-slate-700 shadow-2xl space-y-10">
              <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-[0.2em] text-blue-400">Current Energy</label>
                <div className="grid grid-cols-3 gap-3">
                  {['low', 'medium', 'high'].map(e => (
                    <button 
                      key={e} 
                      onClick={() => setProfile({...profile, energy: e})} 
                      className={`py-4 rounded-2xl font-black uppercase text-xs transition-all border-2 ${
                        profile.energy === e 
                          ? 'bg-blue-600 border-white text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]' 
                          : 'bg-slate-900 border-slate-700 text-slate-500'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4 text-white">
                <div className="flex justify-between font-black text-sm uppercase tracking-widest">
                  <span>Focus Window</span>
                  <span className="text-blue-400">{profile.focus_time} MINS</span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="60" 
                  step="5" 
                  value={profile.focus_time} 
                  onChange={(e) => setProfile({...profile, focus_time: parseInt(e.target.value)})} 
                  className="w-full h-3 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-blue-500 border border-slate-700" 
                />
              </div>
            </div>
            <button onClick={handleFinalSave} className="w-full py-6 bg-white text-slate-900 rounded-[2rem] font-black text-2xl shadow-[0_20px_40px_rgba(59,130,246,0.3)] hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-tight">
              {status === "SAVING" ? "Syncing..." : "Initialize AI"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}