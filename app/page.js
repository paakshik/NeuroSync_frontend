"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { silentEncrypt, silentDecrypt } from '@/utils/crypto';
import { getValue, setValue } from '@/utils/db';
import Image from 'next/image';
import ProfileSetup from '@/components/Onboarding/Setup';
import { Camera, Sparkles, Mic, Settings, Zap, X, ChevronRight, Trophy, Star, Target, LayoutGrid, ArrowLeft, Shield, User, Brain, Clock, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CompanionApp() {
  const router = useRouter();
  const [stage, setStage] = useState('loading');
  const [name, setName] = useState("");
  const [profileData, setProfileData] = useState(null); // To store full DB details
  const [showSettings, setShowSettings] = useState(false);
  const [steps, setSteps] = useState([]);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [status, setStatus] = useState("READY");
  const [streak, setStreak] = useState(0);
  const [manualPrompt, setManualPrompt] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const mediaRecorder = useRef(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editProfile, setEditProfile] = useState({});
  const [showSplash, setShowSplash] = useState(true);
  useEffect(() => {
    if (showSplash && name) {
      const welcomeText = `Welcome back, ${name}! You have a ${streak} day streak. Let's get ready for the next lesson. You've got this!`;

      // Small delay to ensure browser allows speech
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(welcomeText);
        utterance.rate = 0.88;  // Slightly slower for clarity and support
        utterance.pitch = 1.2; // Higher pitch sounds more enthusiastic/friendly
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
      }, 500);
    }
  }, [showSplash, name, streak]);
  const getBadge = (count) => {
    if (count >= 15) return {
      label: "LEGENDARY",
      icon: <Trophy size={18} strokeWidth={3} />,
      color: "bg-cyan-400 text-slate-950 border-cyan-200",
      glow: "shadow-[0_0_15px_rgba(34,211,238,0.6)]"
    };
    if (count >= 7) return {
      label: "UNSTOPPABLE",
      icon: <Zap size={18} strokeWidth={3} />,
      color: "bg-amber-400 text-slate-950 border-amber-200",
      glow: "shadow-[0_0_15px_rgba(251,191,36,0.6)]"
    };
    if (count >= 3) return {
      label: "MOMENTUM",
      icon: <Star size={18} strokeWidth={3} />,
      color: "bg-fuchsia-500 text-white border-fuchsia-300",
      glow: "shadow-[0_0_15px_rgba(217,70,239,0.6)]"
    };
    return {
      label: "INITIATOR",
      icon: <Target size={18} strokeWidth={3} />,
      color: "bg-slate-800 text-slate-200 border-slate-600",
      glow: ""
    };
  };
  const badge = getBadge(streak);

  useEffect(() => {
    async function init() {
      try {
        const vault = await getValue("user_vault");
        const diag = await getValue("user_diagnosis");
        const energy = await getValue("user_energy");
        const focus = await getValue("user_focus_time");
        const gameData = await getValue("game_data") || { streak: 0, lastVisit: null };

        if (vault) {
          const decrypted = await silentDecrypt(vault);
          setName(decrypted.name || "Explorer");
          setProfileData({ name: decrypted.name, diagnosis: diag, energy, focus_time: focus });

          const today = new Date().toDateString();
          if (gameData.lastVisit !== today) {
            const newStreak = gameData.streak + 1;
            setStreak(newStreak);
            await setValue("game_data", { streak: newStreak, lastVisit: today });
          } else {
            setStreak(gameData.streak);
          }
          setStage('dashboard');
        } else { setStage('name'); }
      } catch (e) { setStage('name'); }
    }
    init();
  }, []);

  const triggerVoiceGuidance = (text) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 300);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (steps.length > 0) {
      const currentStep = steps[activeStepIndex];
      const textToRead = currentStep.title || currentStep;
      setTimeout(() => triggerVoiceGuidance(textToRead), 300);
    }
  }, [activeStepIndex, steps]);
  const handleDeleteProfile = async () => {
    if (confirm("Are you sure? This will permanently delete your identity and progress.")) {
      try {
        // Clear keys from IndexedDB
        await setValue("user_vault", null);
        await setValue("user_diagnosis", null);
        await setValue("user_energy", null);
        await setValue("user_focus_time", null);
        await setValue("game_data", { streak: 0, lastVisit: null });

        // Reset state and send back to onboarding
        window.location.reload();
      } catch (err) {
        alert("Failed to wipe data. Please try again.");
      }
    }
  };
  const handleStepComplete = () => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.7 } });
    if (activeStepIndex < steps.length - 1) setActiveStepIndex(p => p + 1);
    else { setSteps([]); setStatus("MISSION COMPLETE!"); setTimeout(() => setStatus("READY"), 3000); }
  };

  const decomposeCurrentStep = async () => {
    setStatus("BREAKING DOWN...");
    try {
      const res = await fetch('/api/bridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step_title: steps[activeStepIndex], context: "Break into 3 tasks" }),
      });
      const data = await res.json();
      const newSteps = [...steps];
      newSteps.splice(activeStepIndex, 1, ...(data.steps || []));
      setSteps(newSteps);
      setStatus("READY");
    } catch (err) { setStatus("ERROR"); }
  };
  const handleTextSubmit = async () => {
  if (!manualPrompt.trim()) return;
  setStatus("THINKING...");

  try {
    const res = await fetch('/api/bridge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: manualPrompt,
        context: {
          energy: profileData?.energy || 'medium',
          diagnosis: profileData?.diagnosis || 'General',
          focus_time: profileData?.focus_time || 25
        }
      }),
    });

    const d = await res.json();

    // 1. Check if the bridge itself reported an error
    if (d.error || !res.ok) {
      console.error("Bridge reported error:", d.details);
      setStatus("LINK ERROR");
      return;
    }

    // 2. Extract steps with multiple fallbacks
    const finalSteps = d.steps || d.task_breakdown || d.output;

    if (Array.isArray(finalSteps) && finalSteps.length > 0) {
      setSteps(finalSteps);
      setManualPrompt(""); 
      setStatus("READY");
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.8 } });
    } else {
      // 3. If we got data but no steps, it's a formatting issue
      console.warn("Payload missing steps. Data received:", d);
      setStatus("FORMAT ERROR");
    }
  } catch (err) {
    console.error("Critical Connection Error:", err);
    setStatus("OFFLINE");
    setTimeout(() => setStatus("READY"), 3000);
  }
};
  const startCamera = async () => { setShowCamera(true); try { const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }); if (videoRef.current) videoRef.current.srcObject = s; } catch (e) { setShowCamera(false); } };
  const captureImage = async () => { setStatus("ANALYSING..."); const canvas = document.createElement("canvas"); canvas.width = videoRef.current.videoWidth; canvas.height = videoRef.current.videoHeight; canvas.getContext("2d").drawImage(videoRef.current, 0, 0); canvas.toBlob(async (b) => { const f = new FormData(); f.append('file', b, 's.jpg'); f.append('task', "steps"); const r = await fetch('/api/bridge', { method: 'POST', body: f }); const d = await r.json(); setSteps(d.steps || []); setShowCamera(false); setStatus("READY"); }, 'image/jpeg'); };
  const startRecording = async () => { const s = await navigator.mediaDevices.getUserMedia({ audio: true }); mediaRecorder.current = new MediaRecorder(s); const c = []; mediaRecorder.current.ondataavailable = (e) => c.push(e.data); mediaRecorder.current.onstop = async () => { setStatus("THINKING..."); const b = new Blob(c, { type: 'audio/webm' }); const f = new FormData(); f.append('file', b, 'v.webm'); const r = await fetch('/api/bridge', { method: 'POST', body: f }); const d = await r.json(); setSteps(d.steps || []); setStatus("READY"); }; mediaRecorder.current.start(); setStatus("LISTENING..."); };

  if (stage === 'loading') return null;
  if (stage === 'name') return <ProfileSetup onComplete={() => window.location.reload()} />;

  return (
    <div className="min-h-screen bg-[#0F172A] text-white font-lexend pb-32 relative overflow-hidden">
      {showSplash && (
        <div className="fixed inset-0 z-[1000] bg-[#0F172A] flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
          {/* Decorative Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />

          <div className="relative text-center space-y-8 max-w-sm">
            {/* High Visibility Streak Display */}
            <div className="inline-flex items-center gap-4 bg-slate-800/50 border-2 border-amber-400 p-6 rounded-[2.5rem] shadow-[0_0_30px_rgba(251,191,36,0.2)] animate-in zoom-in duration-700">
              <div className="p-4 bg-amber-400 rounded-2xl shadow-[0_0_20px_rgba(251,191,36,0.5)]">
                <Zap size={40} className="text-slate-900 fill-slate-900" />
              </div>
              <div className="text-left">
                <p className="text-amber-400 font-black text-4xl leading-none">{streak}</p>
                <p className="text-amber-400/70 font-black text-xs uppercase tracking-widest">Day Streak</p>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-5xl font-black text-white italic tracking-tighter">Ready, {name}?</h2>
              <p className="text-slate-400 font-medium text-lg">Your next mission is waiting.</p>
            </div>

            {/* THE BOUNCING GLOWING BUTTON */}
            <button
              onClick={() => {
                setShowSplash(false);
                confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
              }}
              className="group relative w-full py-8 bg-blue-600 rounded-[2.5rem] text-white font-black text-2xl uppercase tracking-wider 
                   shadow-[0_0_40px_rgba(37,99,235,0.4)] hover:shadow-[0_0_60px_rgba(37,99,235,0.6)]
                   animate-bounce hover:animate-none transition-all active:scale-95 border-b-8 border-blue-800"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                Start Lesson <ChevronRight size={28} strokeWidth={3} />
              </span>

              {/* Internal Glow Pulse */}
              <div className="absolute inset-0 rounded-[2.5rem] bg-white/20 animate-pulse" />
            </button>

            <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.4em]">Tap to Engage</p>
          </div>
        </div>
      )}
      {isFlashing && <div className="fixed inset-0 z-[500] bg-cyan-400/20 pointer-events-none" />}

      {/* SETTINGS OVERLAY (New Detail Display) */}
      {/* SETTINGS OVERLAY - REFINED UI */}
      {showSettings && (
        <div className="fixed inset-0 z-[600] bg-[#0F172A]/98 backdrop-blur-2xl p-6 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
          {/* High-Contrast Close Button */}
          <button
            onClick={() => { setShowSettings(false); setIsEditing(false); }}
            className="absolute top-10 right-10 p-4 bg-white text-slate-950 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-90 transition-all z-[700]"
          >
            <X size={28} strokeWidth={3} />
          </button>

          <div className="w-full max-w-md space-y-6 overflow-y-auto max-h-[90vh] px-2 pb-10">
            {/* Header Section */}
            <div className="text-center mb-8">
              <div className="inline-block p-4 bg-blue-600 rounded-3xl shadow-[0_0_30px_rgba(37,99,235,0.5)] mb-4">
                <User size={40} className="text-white" />
              </div>
              <h2 className="text-4xl font-[1000] italic tracking-tighter text-white">
                {isEditing ? "EDIT NEURAL LINK" : "NEURAL PROFILE"}
              </h2>
              <div className="h-1.5 w-24 bg-gradient-to-r from-blue-600 to-cyan-400 mx-auto rounded-full mt-2" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Name Card - Full Width */}
              <div className="col-span-2 bg-slate-900 border-[3px] border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Shield size={80} />
                </div>
                <p className="text-[10px] font-black uppercase text-blue-400 tracking-[0.4em] mb-2">Authenticated Explorer</p>
                {isEditing ? (
                  <input
                    value={editProfile.name}
                    onChange={(e) => setEditProfile({ ...editProfile, name: e.target.value })}
                    className="bg-slate-800 border-b-4 border-blue-500 rounded-xl px-4 py-3 text-2xl font-black text-white w-full outline-none focus:bg-slate-700 transition-all"
                  />
                ) : (
                  <p className="text-4xl font-[1000] text-white tracking-tighter drop-shadow-md">{profileData?.name}</p>
                )}
              </div>

              {/* Diagnosis Card */}
              <div className="bg-slate-900 border-[3px] border-purple-500/30 rounded-[2rem] p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Brain size={24} className="text-purple-400" strokeWidth={3} />
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cognitive</p>
                </div>
                {isEditing ? (
                  <select
                    value={editProfile.diagnosis}
                    onChange={(e) => setEditProfile({ ...editProfile, diagnosis: e.target.value })}
                    className="bg-slate-800 text-white font-black text-lg rounded-xl p-2 w-full outline-none border-2 border-purple-500"
                  >
                    {['ADHD', 'Autism', 'Anxiety', 'General'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                ) : (
                  <p className="text-xl font-black text-white italic">{profileData?.diagnosis}</p>
                )}
              </div>

              {/* Energy Card */}
              <div className="bg-slate-900 border-[3px] border-amber-500/30 rounded-[2rem] p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Zap size={24} className="text-amber-400 fill-amber-400/20" strokeWidth={3} />
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Battery</p>
                </div>
                {isEditing ? (
                  <select
                    value={editProfile.energy}
                    onChange={(e) => setEditProfile({ ...editProfile, energy: e.target.value })}
                    className="bg-slate-800 text-white font-black text-lg rounded-xl p-2 w-full outline-none border-2 border-amber-500"
                  >
                    {['low', 'medium', 'high'].map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                ) : (
                  <p className="text-xl font-black text-white italic capitalize">{profileData?.energy}</p>
                )}
              </div>

              {/* Focus Time Slider Card */}
              <div className="col-span-2 bg-slate-900 border-[3px] border-blue-500/30 rounded-[2.5rem] p-8 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Clock size={24} className="text-blue-400" strokeWidth={3} />
                    </div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Neural Focus Window</p>
                  </div>
                  <p className="text-3xl font-[1000] text-blue-400">{isEditing ? editProfile.focus_time : profileData?.focus_time}m</p>
                </div>
                {isEditing && (
                  <input
                    type="range" min="5" max="60" step="5"
                    value={editProfile.focus_time}
                    onChange={(e) => setEditProfile({ ...editProfile, focus_time: parseInt(e.target.value) })}
                    className="w-full h-4 bg-slate-800 rounded-full appearance-none accent-blue-500 cursor-pointer border border-white/5"
                  />
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4 pt-4">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => { setEditProfile({ ...profileData }); setIsEditing(true); }}
                    className="
    group relative w-full py-8 
    bg-gradient-to-b from-blue-600 to-blue-800 
    rounded-[2.5rem] text-white font-[1000] text-2xl uppercase tracking-tighter 
    shadow-[0_15px_40px_rgba(37,99,235,0.4)] 
    border-t-4 border-blue-400 border-b-8 border-blue-950
    /* GENTLE FLOATING ANIMATION */
    animate-[bounce_3s_infinite]
    hover:animate-none 
    active:scale-95 transition-all mb-4
  "
                    style={{ animationTimingFunction: 'ease-in-out', animationDuration: '3s' }}
                  >
                    Modify Neural Link
                  </button>

                  <button
                    onClick={handleDeleteProfile}
                    className="w-full py-5 bg-transparent border-[3px] border-red-500/40 text-red-500 rounded-[2.5rem] font-black uppercase tracking-widest text-sm hover:bg-red-500/10 transition-all flex items-center justify-center gap-3"
                  >
                    <Trash2 size={20} /> Wipe Neural Identity
                  </button>
                </>
              ) : (
                <div className="flex gap-4">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-8 bg-slate-800 text-white border-[3px] border-white/10 rounded-[2.5rem] font-black text-xl uppercase active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      const encrypted = await silentEncrypt(editProfile);
                      await setValue("user_vault", encrypted);
                      await setValue("user_diagnosis", editProfile.diagnosis);
                      await setValue("user_energy", editProfile.energy);
                      await setValue("user_focus_time", editProfile.focus_time);
                      setProfileData(editProfile);
                      setName(editProfile.name);
                      setIsEditing(false);
                      setStatus("PROFILE UPDATED");
                      setTimeout(() => setStatus("READY"), 2000);
                    }}
                    className="flex-1 py-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-[2.5rem] font-black text-xl uppercase shadow-[0_15px_40px_rgba(37,99,235,0.4)] active:scale-95 transition-all"
                  >
                    Save Link
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showCamera && (
        <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <div className="absolute bottom-10 flex gap-6">
            <button onClick={() => setShowCamera(false)} className="p-6 bg-white/10 rounded-full"><X size={32} /></button>
            <button onClick={captureImage} className="w-24 h-24 bg-white rounded-full border-8 border-white/20" />
          </div>
        </div>
      )}

      <header className="px-6 py-6 flex items-center justify-between bg-[#0F172A]/80 backdrop-blur-md sticky top-0 z-[100] border-b border-white/5">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="NeuroSync"
            width={160}
            height={48}
            className="h-10 w-auto object-contain"
            priority
          />
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r ${badge.color} border border-white/10 shadow-lg`}>
            {badge.icon} <span className="text-[10px] font-black uppercase tracking-tighter">{badge.label}</span>
          </div>
          <div className="px-4 py-2 rounded-2xl flex items-center gap-2 bg-white/5 border border-white/10">
            <Zap size={16} className="text-orange-400 fill-orange-400" /> <span className="font-black">{streak}</span>
          </div>
          <button onClick={() => setShowSettings(true)} className="p-2 bg-white/5 rounded-xl border border-white/10 text-slate-400 active:scale-90 transition-all"><Settings size={22} /></button>
          {/* <button onClick={() => setSteps([])} className="p-2 bg-white/5 rounded-xl border border-white/10 text-slate-400"><LayoutGrid size={22} /></button> */}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 pt-10">
        <div className="w-full mb-8">
          <p className="text-blue-400 font-black uppercase tracking-[0.3em] text-[10px] mb-2">{status}</p>
          <h1 className="text-5xl font-black italic">Hey, {name}.</h1>
        </div>

        {steps.length === 0 ? (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="w-full bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
              <h2 className="text-4xl font-black text-white">Let's get it <span className="italic font-normal">done.</span></h2>
              <Sparkles size={100} className="absolute -right-4 -bottom-4 opacity-20" />
            </div>

            <div className="flex flex-col items-center gap-8">
              {/* Voice & Camera Actions */}
              <div className="flex flex-col items-center gap-6 w-full">
                <button
                  onPointerDown={startRecording}
                  onPointerUp={() => mediaRecorder.current?.stop()}
                  className={`w-64 h-64 rounded-[5rem] flex items-center justify-center border-4 transition-all duration-300 ${status === "LISTENING..."
                    ? 'bg-red-500 border-white scale-110 shadow-[0_0_50px_rgba(239,68,68,0.4)]'
                    : 'bg-slate-900 border-slate-800 shadow-2xl'
                    }`}
                >
                  <Mic size={70} className={status === "LISTENING..." ? "text-white" : "text-blue-500"} />
                </button>

                <button onClick={startCamera} className="w-full py-6 bg-indigo-600 border-[3px] border-indigo-400 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-indigo-500 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_10px_30px_rgba(79,70,229,0.3)]">
                  <Camera size={16} /> Scan Environment
                </button>
              </div>

              {/* NEW: Text Input Bridge */}
              {/* NEW: Text Input Bridge */}
              <div className="w-full space-y-3">
                <div className="relative group">
                  <input
                    type="text"
                    value={manualPrompt}
                    onChange={(e) => setManualPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleTextSubmit();
                      }
                    }}
                    placeholder="Or type a task here..."
                    className="w-full p-8 pr-24 border-[4px] border-slate-800 rounded-[3rem] text-slate-900 font-black text-2xl outline-none focus:border-blue-500 transition-all placeholder:text-slate-400 shadow-2xl bg-white"
                  />

                  <button
                    onClick={handleTextSubmit} // Calling the main function instead of inline logic
                    disabled={!manualPrompt.trim()}
                    className={`absolute right-3 top-3 bottom-3 px-8 rounded-[2.2rem] font-black flex items-center justify-center transition-all ${manualPrompt.trim()
                      ? 'bg-blue-600 text-white shadow-lg active:scale-90 opacity-100'
                      : 'bg-slate-200 text-slate-400 opacity-50 cursor-not-allowed'
                      }`}
                  >
                    <ChevronRight size={32} strokeWidth={3} />
                  </button>
                </div>
                <p className="text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] animate-pulse">
                  {status === "THINKING..." ? "Connecting to Neural Link..." : "Press Enter to Break Down"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <button onClick={() => triggerVoiceGuidance(steps[activeStepIndex].title || steps[activeStepIndex])} className="w-full py-6 bg-cyan-400 text-slate-900 rounded-[2.5rem] border-[6px] border-white shadow-xl flex items-center justify-center gap-4">
              <Mic size={32} strokeWidth={4} />
              <span className="
  font-[1000] text-4xl uppercase tracking-tighter leading-none 
  text-slate-950 drop-shadow-md
  /* GENTLE BOUNCE EFFECT */
  animate-[bounce_2s_infinite] 
  inline-block
">Hear It</span>
            </button>

            <div className="bg-white rounded-[3.5rem] p-10 shadow-2xl min-h-[440px] flex flex-col">
              <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-3xl mb-8">{activeStepIndex + 1}</div>
              <h2 className="text-4xl font-black text-slate-900 leading-tight mb-auto">{steps[activeStepIndex].title || steps[activeStepIndex]}</h2>

              <div className="flex flex-col gap-4 mt-8">
                <div className="flex gap-3">
                  {/* REQUIREMENT 2: BACK BUTTON IN STEPS */}
                  {activeStepIndex > 0 && (
                    <button
                      onClick={() => setActiveStepIndex(p => p - 1)}
                      className="
      flex-1 py-8 
      bg-slate-100 
      text-slate-900 
      rounded-[2.2rem] 
      font-[1000] 
      text-xl 
      flex items-center justify-center gap-2 
      border-[3px] border-slate-300
      hover:bg-slate-200 
      active:scale-95 transition-all
    "
                    >
                      <ArrowLeft size={24} />
                    </button>
                  )}
                  <button onClick={handleStepComplete} className="flex-[3] py-8 bg-slate-900 text-white rounded-[2.2rem] font-black text-2xl uppercase shadow-lg shadow-slate-900/20 active:scale-95 transition-all">DONE</button>
                </div>
                <button onClick={decomposeCurrentStep} className="w-full py-6 bg-[#0F172A] text-white border-4 border-blue-500 rounded-[2.2rem] font-black text-xl uppercase active:scale-95 transition-all">BREAK IT DOWN</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}