import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type UserProfile, type DailyLog } from "../db";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { 
  Utensils, ChevronDown, ChevronUp, Trash2, 
  Settings as GearIcon, AlertCircle, Droplets, Flame, Wheat, Package, Target, Sparkles, Split
} from "lucide-react";
import AnimatedCounter from "./AnimatedCounter";

export default function Dashboard({ 
  profile, 
  onOpenSettings 
}: { 
  profile: UserProfile, 
  onOpenKitchen: () => void,
  onOpenSettings: () => void 
}) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  // --- DATA FETCHING ---
  const today = new Date().toISOString().split('T')[0];
  const logs = useLiveQuery(() => db.logs.where('date').equals(today).toArray(), [today]);
  
  // Fetch ALL fridge items to ensure we have data for the AI
  const fridgeItems = useLiveQuery(() => db.fridge.toArray());

  // --- MACRO MATH ---
  const consumedCals = Math.round(logs?.reduce((s, l) => s + l.calories, 0) || 0);
  const consumedProt = Math.round(logs?.reduce((s, l) => s + l.protein, 0) || 0);
  const consumedCarb = Math.round(logs?.reduce((s, l) => s + l.carbs, 0) || 0);
  const consumedFat = Math.round(logs?.reduce((s, l) => s + l.fat, 0) || 0);

  const remainingCals = Math.max(0, profile.targetCalories - consumedCals);
  const remainingProt = Math.max(0, profile.targetProtein - consumedProt);

  // --- CHEF AI LOGIC ---
  const getChefStrategy = () => {
    // Safety checks
    if (!fridgeItems || fridgeItems.length === 0) return null;
    
    // If you've basically hit your goal (within 2g), stop suggesting
    if (remainingProt <= 2) return null; 

    // 1. Sort fridge by Protein Density (High to Low)
    // We filter out items with 0 protein to avoid division by zero errors
    const bestProtein = [...fridgeItems]
      .filter(i => i.protein > 0.1) 
      .sort((a, b) => b.protein - a.protein)[0];

    if (!bestProtein) return null;

    // 2. Calculate Grams needed
    const gramsNeeded = Math.round((remainingProt / bestProtein.protein) * 100);
    
    // 3. Inventory Check
    const canFulfill = gramsNeeded <= bestProtein.currentWeight;
    const actualGrams = canFulfill ? gramsNeeded : bestProtein.currentWeight;
    const proteinOutcome = Math.round(bestProtein.protein * (actualGrams / 100));
    
    // 4. Split Logic (If meal > 500g, suggest splitting)
    const shouldSplit = actualGrams > 500;
    const splitCount = shouldSplit ? 2 : 1;
    const splitWeight = Math.round(actualGrams / splitCount);

    return {
      item: bestProtein,
      grams: actualGrams,
      prot: proteinOutcome,
      isPartial: !canFulfill,
      split: splitCount,
      splitWeight
    };
  };

  const strategy = getChefStrategy();

  // --- DB ACTIONS ---
  const deleteLog = async (log: DailyLog) => {
    if (!log.id) return;
    if (!confirm(`Refund inventory and delete log?`)) return;
    await db.transaction('rw', [db.logs, db.fridge], async () => {
      if (log.fridgeItemId) {
        const item = await db.fridge.get(log.fridgeItemId);
        if (item) await db.fridge.update(log.fridgeItemId, { currentWeight: item.currentWeight + log.amountConsumed });
      }
      await db.logs.delete(log.id);
    });
  };

  const calPercent = Math.min((consumedCals / profile.targetCalories) * 100, 100);
  const protPercent = Math.min((consumedProt / profile.targetProtein) * 100, 100);
  
  const circleCircumference = 377; 
  const circleOffset = circleCircumference - (calPercent / 100) * circleCircumference;
  
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  // --- ANIMATION VARIANTS ---
  // Main sequence for static elements
  const containerVars: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVars: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVars}
      initial="hidden"
      animate="show"
      className="p-6 pb-40 flex flex-col items-center min-h-full"
    >
      
      {/* 1. HEADER */}
      <motion.div variants={itemVars} className="w-full flex justify-between items-center mb-8 pt-4">
        <div>
           <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{greeting}</p>
           <h1 className="text-3xl font-bold text-white tracking-tight">Chef.</h1>
        </div>
        <button onClick={onOpenSettings} className="p-3 bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-full text-slate-400 hover:text-white transition-all">
          <GearIcon size={20} />
        </button>
      </motion.div>
      
      {/* 2. HERO HUD (Static) */}
      <motion.div variants={itemVars} className="w-full max-w-md grid grid-cols-[1.4fr_1fr] gap-4 mb-8">
         {/* Calorie Ring */}
         <div className="relative bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-[2rem] border border-slate-800/60 shadow-2xl flex flex-col justify-between items-center overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-full bg-amber-500/5 blur-3xl rounded-full ${consumedCals > profile.targetCalories ? 'bg-red-500/10' : ''}`} />
            <div className="relative w-40 h-40 flex items-center justify-center">
               <svg className="w-full h-full rotate-[-90deg]">
                  <circle cx="50%" cy="50%" r="60" stroke="#1e293b" strokeWidth="12" fill="transparent" />
                  <motion.circle 
                    cx="50%" cy="50%" r="60" 
                    stroke={consumedCals > profile.targetCalories ? "#ef4444" : "#f59e0b"} 
                    strokeWidth="12" fill="transparent" strokeLinecap="round"
                    strokeDasharray={circleCircumference}
                    initial={{ strokeDashoffset: circleCircumference }}
                    animate={{ strokeDashoffset: circleOffset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
               </svg>
               <div className="absolute text-center">
                  <p className="text-3xl font-bold text-white font-mono tracking-tighter"><AnimatedCounter value={remainingCals} /></p>
                  <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Left</p>
               </div>
            </div>
            <div className="text-center mt-2 z-10">
               <p className="text-xs text-slate-400 font-medium">Daily Budget</p>
               <p className="text-lg font-bold text-amber-500"><AnimatedCounter value={consumedCals}/> / {profile.targetCalories}</p>
            </div>
         </div>

         {/* Protein Pillar */}
         <div className="bg-gradient-to-b from-teal-900/20 to-slate-950 p-1 rounded-[2rem] border border-teal-500/20 relative overflow-hidden flex flex-col justify-end">
            <motion.div 
               className="absolute bottom-0 left-0 w-full bg-teal-500 shadow-[0_0_40px_rgba(20,184,166,0.4)]"
               initial={{ height: 0 }}
               animate={{ height: `${protPercent}%` }}
               transition={{ duration: 1.5, ease: "easeOut" }}
            />
            <div className="relative z-10 p-5 flex flex-col h-full justify-between">
               <div className="self-end p-2 bg-black/20 backdrop-blur-md rounded-full text-teal-400 border border-teal-500/30"><Utensils size={16} /></div>
               <div>
                  <p className="text-3xl font-bold text-white font-mono mix-blend-overlay"><AnimatedCounter value={consumedProt}/></p>
                  <p className="text-[10px] text-teal-200 font-bold uppercase tracking-widest opacity-80">Protein</p>
                  <p className="text-[10px] text-teal-100/50 mt-1">{consumedProt} / {profile.targetProtein}g</p>
               </div>
            </div>
         </div>
      </motion.div>

      {/* 3. DYNAMIC CONTENT (ANIMATION FIX) */}
      {/* Note: We removed 'variants={itemVars}' here to prevent animation lock-up. 
          These sections now handle their own entrance independently. */}
      
      {strategy && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="w-full max-w-md mb-8"
        >
           <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-teal-500/30 p-6 rounded-[2rem] relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={100} className="text-teal-400"/></div>
              
              <div className="flex items-center gap-2 mb-3 relative z-10">
                 <Sparkles size={16} className="text-teal-400" />
                 <h3 className="text-xs font-bold text-teal-400 uppercase tracking-widest">Chef's Strategy</h3>
              </div>

              <div className="relative z-10">
                 <p className="text-slate-300 text-sm leading-relaxed mb-4">
                    To hit your protein goal, consume <span className="text-white font-bold text-lg">{strategy.grams}g</span> of <span className="text-teal-400 font-bold">{strategy.item.name}</span>.
                    {strategy.isPartial && <span className="text-red-400 text-xs block mt-1">(Limit: {strategy.item.currentWeight}g available)</span>}
                 </p>

                 {strategy.split > 1 && (
                    <div className="flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-white/5">
                       <Split size={20} className="text-amber-500" />
                       <div>
                          <p className="text-xs text-slate-300 font-bold">Recommended Split</p>
                          <p className="text-[10px] text-slate-500">2 meals of <span className="text-white font-mono font-bold">{strategy.splitWeight}g</span> each.</p>
                       </div>
                    </div>
                 )}
              </div>
           </div>
        </motion.div>
      )}

      {/* 4. SECONDARY STATS */}
      <motion.div variants={itemVars} className="grid grid-cols-2 gap-3 w-full max-w-md mb-8">
         <div className="bg-slate-900/40 backdrop-blur-sm p-4 rounded-2xl border border-slate-800/50 flex items-center justify-between">
            <div><p className="text-[10px] text-blue-400 font-bold uppercase mb-1">Carbs</p><p className="text-xl font-bold text-white"><AnimatedCounter value={consumedCarb} />g</p></div>
            <Wheat size={20} className="text-blue-500/50" />
         </div>
         <div className="bg-slate-900/40 backdrop-blur-sm p-4 rounded-2xl border border-slate-800/50 flex items-center justify-between">
            <div><p className="text-[10px] text-purple-400 font-bold uppercase mb-1">Fats</p><p className="text-xl font-bold text-white"><AnimatedCounter value={consumedFat} />g</p></div>
            <Droplets size={20} className="text-purple-500/50" />
         </div>
      </motion.div>

      {/* 5. FRIDGE DISCOVERY */}
      {fridgeItems && fridgeItems.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          className="w-full max-w-md mb-8"
        >
           <div className="flex items-center gap-2 mb-3 px-2">
              <AlertCircle size={14} className="text-slate-500" />
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ready to Eat</h3>
           </div>
           
           <div className="flex gap-3 overflow-x-auto pb-4 pt-1 px-1 scrollbar-hide -mx-2 px-2">
              {fridgeItems.map(item => (
                <div key={item.id} className="min-w-[150px] bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-4 rounded-2xl shadow-lg relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity"><Package size={40}/></div>
                   <p className="text-sm font-bold text-slate-100 truncate mb-1">{item.name}</p>
                   <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                      <p className="text-[10px] text-teal-400 font-mono">{item.currentWeight}g left</p>
                   </div>
                </div>
              ))}
           </div>
        </motion.div>
      )}

      {/* 6. HISTORY TRAY */}
      <motion.div variants={itemVars} className="w-full max-w-md">
        <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} className="w-full flex justify-between items-center p-5 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 text-slate-300 hover:bg-slate-800 transition-all shadow-lg">
          <span className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest">
            <div className="bg-amber-500/10 p-1.5 rounded text-amber-500"><Flame size={14} /></div>
            Today's Log ({logs?.length || 0})
          </span>
          {isHistoryOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        <AnimatePresence>
          {isHistoryOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-2 space-y-2">
              {logs?.map((log) => (
                <div key={log.id} className="bg-slate-900/40 border border-slate-800/30 p-4 rounded-2xl flex justify-between items-center group">
                  <div className="flex-1">
                    <p className="text-slate-200 font-bold text-sm">{log.name}</p>
                    <div className="flex gap-3 text-[10px] font-mono mt-1 text-slate-500">
                      <span className="text-white">{Math.round(log.calories)} kcal</span>
                      <span className="text-teal-500">P: {Math.round(log.protein)}g</span>
                      {log.fridgeItemId && <span className="text-teal-600 font-bold flex items-center gap-1"><Package size={8}/> LINKED</span>}
                    </div>
                  </div>
                  <button onClick={() => deleteLog(log)} className="text-slate-600 hover:text-red-500 p-2 bg-slate-950 rounded-lg border border-slate-800"><Trash2 size={16} /></button>
                </div>
              ))}
              {logs?.length === 0 && <p className="text-center text-slate-600 text-xs py-4">Kitchen is quiet today.</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

    </motion.div>
  );
}