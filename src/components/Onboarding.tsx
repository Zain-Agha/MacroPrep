import { useState, useEffect } from 'react';
import { db } from '../db';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Edit3, CheckCircle, Cpu, ArrowRight } from 'lucide-react';

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  // --- INTRO STATE ---
  const [showIntro, setShowIntro] = useState(true);

  // --- FORM STATE ---
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [formData, setFormData] = useState({ 
    weight: "", 
    height: "", 
    age: "", 
    gender: "male",
    goal: "maintain" as 'lose' | 'maintain' | 'gain',
    manualCalories: "",
    manualProtein: ""
  });

  // --- INTRO TIMER ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 3500); // 3.5 seconds intro
    return () => clearTimeout(timer);
  }, []);

  const calculateAndSave = async () => {
    const w = Number(formData.weight); 
    let targetCalories = 0;
    let targetProtein = 0;
    let tdee = 0;

    if (mode === 'auto') {
      const h = Number(formData.height);
      const a = Number(formData.age);
      if (!w || !h || !a) return;

      let bmr = 10 * w + 6.25 * h - 5 * a + (formData.gender === "male" ? 5 : -161);
      tdee = Math.round(bmr * 1.3); 

      targetCalories = tdee;
      if (formData.goal === 'lose') targetCalories -= 500;
      if (formData.goal === 'gain') targetCalories += 300;
      targetProtein = Math.round(w * 2);
    } else {
      targetCalories = Number(formData.manualCalories);
      targetProtein = Number(formData.manualProtein);
      if (!targetCalories || !targetProtein) return;
      tdee = targetCalories; 
    }

    await db.user.clear();
    await db.user.add({ tdee, targetCalories, targetProtein, goal: formData.goal });
    onComplete();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 overflow-hidden relative">
      <AnimatePresence mode="wait">
        
        {/* --- 1. THE CINEMATIC INTRO --- */}
        {showIntro ? (
          <motion.div 
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -50, transition: { duration: 0.8, ease: "easeInOut" } }}
            className="flex flex-col items-center justify-center z-50 p-6 text-center"
          >
            {/* Logo Animation */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="mb-6 relative"
            >
              <div className="absolute inset-0 bg-teal-500/20 blur-3xl rounded-full" />
              <Cpu size={64} className="text-white relative z-10" strokeWidth={1} />
            </motion.div>

            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-4xl font-bold text-white tracking-tighter mb-2"
            >
              MacroPrep
            </motion.h1>

            {/* SYED SIGNATURE */}
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "auto", opacity: 1 }}
              transition={{ delay: 1.2, duration: 1 }}
              className="overflow-hidden whitespace-nowrap border-r-2 border-teal-500 pr-1"
            >
              <p className="text-[10px] uppercase tracking-[0.3em] text-teal-500 font-bold">
                Engineered by SYED
              </p>
            </motion.div>

            {/* Loading Bar */}
            <div className="w-32 h-1 bg-slate-800 rounded-full mt-10 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.2, duration: 3, ease: "linear" }}
                className="h-full bg-gradient-to-r from-teal-500 to-amber-500"
              />
            </div>
            <p className="text-[9px] text-slate-600 mt-2 font-mono animate-pulse">Initializing Bio-Metrics...</p>
          </motion.div>
        ) : (
          
          /* --- 2. THE FORM --- */
          <motion.div 
            key="form"
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl relative z-40 mx-4"
          >
            <div className="flex justify-between items-center mb-8">
               <div>
                 <h2 className="text-3xl font-bold text-white mb-1">Setup Engine</h2>
                 <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">Define Parameters</p>
               </div>
               <Cpu size={32} className="text-slate-700" />
            </div>
            
            {/* MODE TOGGLE */}
            <div className="flex bg-slate-950 p-1 rounded-2xl mb-8 border border-slate-800">
               <button 
                 onClick={() => setMode('auto')} 
                 className={`flex-1 py-4 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${mode === 'auto' ? 'bg-amber-500 text-slate-900 shadow-lg' : 'text-slate-500'}`}
               >
                 <Calculator size={16} /> Auto-Calc
               </button>
               <button 
                 onClick={() => setMode('manual')} 
                 className={`flex-1 py-4 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${mode === 'manual' ? 'bg-teal-500 text-slate-900 shadow-lg' : 'text-slate-500'}`}
               >
                 <Edit3 size={16} /> Manual Input
               </button>
            </div>

            <div className="space-y-5">
              
              {mode === 'auto' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="text-[10px] text-slate-500 uppercase font-bold ml-3 mb-1 block">Goal Weight (kg)</label>
                       <input autoFocus type="number" className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white outline-none focus:border-amber-500 transition-colors" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} />
                    </div>
                    <div>
                       <label className="text-[10px] text-slate-500 uppercase font-bold ml-3 mb-1 block">Height (cm)</label>
                       <input type="number" className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white outline-none focus:border-amber-500 transition-colors" value={formData.height} onChange={(e) => setFormData({ ...formData, height: e.target.value })} />
                    </div>
                  </div>
                  
                  <div>
                     <label className="text-[10px] text-slate-500 uppercase font-bold ml-3 mb-1 block">Age</label>
                     <input type="number" className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white outline-none focus:border-amber-500 transition-colors" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} />
                  </div>
                  
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase font-bold ml-3 mb-1 block">Goal Strategy</label>
                    <div className="relative">
                      <select 
                        className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white outline-none focus:border-amber-500 appearance-none"
                        value={formData.goal}
                        onChange={(e) => setFormData({ ...formData, goal: e.target.value as any })}
                      >
                        <option value="lose">Lose Fat (Deficit)</option>
                        <option value="maintain">Maintain (Balance)</option>
                        <option value="gain">Gain Muscle (Surplus)</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">▼</div>
                    </div>
                  </div>
                </motion.div>
              )}

              {mode === 'manual' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                   <div className="p-4 bg-teal-500/10 border border-teal-500/20 rounded-2xl">
                      <p className="text-teal-400 text-xs leading-relaxed">
                         <span className="font-bold">Pro Mode:</span> Enter your exact targets provided by your coach or your own calculations.
                      </p>
                   </div>

                   <div>
                       <label className="text-[10px] text-slate-500 uppercase font-bold ml-3 mb-1 block">Current Weight (kg)</label>
                       <input 
                         autoFocus
                         type="number"
                         className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white outline-none focus:border-teal-500 transition-colors" 
                         placeholder="Optional (for tracking)"
                         value={formData.weight} 
                         onChange={(e) => setFormData({ ...formData, weight: e.target.value })} 
                       />
                    </div>

                   <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="text-[10px] text-amber-500 uppercase font-bold ml-3 mb-1 block">Target Cals</label>
                       <input type="number" className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white outline-none focus:border-amber-500 transition-colors font-bold text-lg" placeholder="2500" value={formData.manualCalories} onChange={(e) => setFormData({ ...formData, manualCalories: e.target.value })} />
                    </div>
                    <div>
                       <label className="text-[10px] text-teal-500 uppercase font-bold ml-3 mb-1 block">Target Protein</label>
                       <input type="number" className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white outline-none focus:border-teal-500 transition-colors font-bold text-lg" placeholder="180" value={formData.manualProtein} onChange={(e) => setFormData({ ...formData, manualProtein: e.target.value })} />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 uppercase font-bold ml-3 mb-1 block">Goal Context</label>
                    <div className="relative">
                      <select 
                        className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white outline-none focus:border-teal-500 appearance-none"
                        value={formData.goal}
                        onChange={(e) => setFormData({ ...formData, goal: e.target.value as any })}
                      >
                        <option value="lose">Cutting</option>
                        <option value="maintain">Maintenance</option>
                        <option value="gain">Bulking</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">▼</div>
                    </div>
                  </div>
                </motion.div>
              )}

              <button 
                onClick={calculateAndSave} 
                className={`w-full text-slate-950 font-bold py-5 rounded-2xl shadow-xl transition-all active:scale-95 mt-6 flex items-center justify-center gap-2 ${mode === 'auto' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-teal-500 hover:bg-teal-600'}`}
              >
                {mode === 'auto' ? <Calculator size={20}/> : <CheckCircle size={20} />}
                {mode === 'auto' ? 'Calculate & Start' : 'Set Custom Targets'}
                <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}