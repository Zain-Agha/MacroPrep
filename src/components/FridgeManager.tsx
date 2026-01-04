import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type FridgeItem } from "../db";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Package, ArrowLeft, Trash2, CheckCircle, Scale, Sparkles } from "lucide-react";

export default function FridgeManager({ onBack }: { onBack: () => void }) {
  const fridgeItems = useLiveQuery(() => db.fridge.toArray());
  const [selectedItem, setSelectedItem] = useState<FridgeItem | null>(null);

  const [mode, setMode] = useState<'scale' | 'goal'>('scale');
  const [value, setValue] = useState<string>("");

  // --- ANIMATION VARIANTS ---
  const containerVars: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVars: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { type: "spring", stiffness: 50, damping: 15 } 
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (confirm("Throw this batch away?")) {
      await db.fridge.delete(id);
      if (selectedItem?.id === id) setSelectedItem(null);
    }
  };

  const calculate = () => {
    if (!selectedItem || !value) return { weight: 0, cals: 0, prot: 0, carb: 0, fat: 0 };
    const num = Number(value);
    
    // Safety check for macros to prevent NaN
    const calPerG = (selectedItem.calories || 0) / 100;
    const protPerG = (selectedItem.protein || 0) / 100;
    const carbPerG = (selectedItem.carbs || 0) / 100;
    const fatPerG = (selectedItem.fat || 0) / 100;

    if (mode === 'scale') {
      return { 
        weight: num, 
        cals: Math.round(num * calPerG), 
        prot: Math.round(num * protPerG),
        carb: Math.round(num * carbPerG),
        fat: Math.round(num * fatPerG)
      };
    } else {
      // Avoid division by zero
      if (protPerG <= 0) return { weight: 0, cals: 0, prot: 0, carb: 0, fat: 0 };
      
      const weightNeeded = Math.round(num / protPerG);
      return {
        weight: weightNeeded,
        cals: Math.round(weightNeeded * calPerG),
        prot: num,
        carb: Math.round(weightNeeded * carbPerG),
        fat: Math.round(weightNeeded * fatPerG)
      };
    }
  };

  const result = calculate();

  const handleEat = async () => {
    if (!selectedItem || !selectedItem.id || result.weight <= 0) return;

    const date = new Date().toISOString().split('T')[0];
    await db.logs.add({
      date,
      name: selectedItem.name,
      amountConsumed: result.weight,
      calories: result.cals,
      protein: result.prot,
      carbs: result.carb,
      fat: result.fat,
      timestamp: new Date(),
      fridgeItemId: selectedItem.id 
    });

    const newWeight = selectedItem.currentWeight - result.weight;
    if (newWeight <= 0) {
      await db.fridge.delete(selectedItem.id);
    } else {
      await db.fridge.update(selectedItem.id, { currentWeight: newWeight });
    }
    
    setSelectedItem(null);
    setValue("");
  };

  // --- LOADING STATE ---
  // If database hasn't replied yet, show a spinner instead of blank screen
  if (!fridgeItems) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 flex items-center justify-center">
        <p className="text-slate-500 animate-pulse">Loading Inventory...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVars}
      className="min-h-screen bg-slate-950 p-4"
    >
      
      {/* HEADER */}
      <motion.div variants={itemVars} className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 bg-slate-900 rounded-full border border-slate-800 text-slate-400">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-teal-400 flex items-center gap-2">
          <Package size={20} /> Smart Fridge
        </h1>
      </motion.div>

      {/* GRID LIST */}
      <div className="grid grid-cols-1 gap-4 pb-32">
        {fridgeItems.map((item) => (
          <motion.div 
            key={item.id}
            variants={itemVars}
            layoutId={`card-${item.id}`} // Helper for smooth transitions
            onClick={() => setSelectedItem(item)}
            className={`p-5 rounded-[1.5rem] border relative overflow-hidden group cursor-pointer ${
              selectedItem?.id === item.id 
              ? 'bg-slate-800 border-teal-500 shadow-[0_0_30px_rgba(20,184,166,0.2)]' 
              : 'bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800/60 shadow-lg'
            }`}
          >
            {/* Background Decor */}
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
               <Package size={80} />
            </div>

            <div className="flex justify-between items-start mb-4 relative z-10">
               <div>
                  <h3 className="font-bold text-slate-100 text-lg tracking-tight">{item.name}</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                     Added {new Date(item.createdAt).toLocaleDateString()}
                  </p>
               </div>
               <button onClick={(e) => handleDelete(e, item.id!)} className="text-slate-600 hover:text-red-500 p-2 bg-black/20 rounded-full backdrop-blur-sm">
                 <Trash2 size={16} />
               </button>
            </div>
            
            {/* MACRO PILLS */}
            <div className="flex gap-2 mb-4 relative z-10">
               <div className="px-2 py-1 rounded-md bg-teal-500/10 border border-teal-500/20 text-[10px] font-bold text-teal-400">
                  {Math.round(item.protein)}g P
               </div>
               <div className="px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-500">
                  {Math.round(item.carbs || 0)}g C
               </div>
               <div className="px-2 py-1 rounded-md bg-slate-500/10 border border-slate-500/20 text-[10px] font-bold text-slate-400">
                  {Math.round(item.fat || 0)}g F
               </div>
            </div>

            {/* PROGRESS BAR */}
            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mb-2 relative z-10">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${(item.currentWeight / (item.totalWeight || item.currentWeight)) * 100}%` }}
                 className="h-full bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]" 
               />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400 relative z-10">
               <span><b className="text-white">{item.currentWeight}g</b> left</span>
               <span>{Math.round(item.calories)} kcal/100g</span>
            </div>
          </motion.div>
        ))}

        {fridgeItems.length === 0 && (
          <motion.div variants={itemVars} className="text-center py-20 text-slate-600">
            <Package size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-sm font-medium">Your fridge is empty.</p>
            <p className="text-xs mt-2">Cook a batch in the Kitchen Lab to see it here.</p>
          </motion.div>
        )}
      </div>

      {/* QUICK SCOOP MODAL */}
      <AnimatePresence>
        {selectedItem && (
          <>
            {/* BACKDROP BLUR */}
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
               onClick={() => setSelectedItem(null)}
            />

            {/* MODAL SHEET */}
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              className="fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-700 rounded-t-[2.5rem] p-8 shadow-2xl z-[100]"
            >
               <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-8 opacity-50" />
               
               <div className="flex justify-between items-center mb-8">
                  <div>
                     <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                        {selectedItem.name} <Sparkles size={18} className="text-amber-500"/>
                     </h2>
                     <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Quick Scoop</p>
                  </div>
                  <button onClick={() => setSelectedItem(null)} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white">
                     <ArrowLeft size={20} className="-rotate-90" />
                  </button>
               </div>

               {/* TOGGLE */}
               <div className="flex bg-slate-950 rounded-2xl p-1 mb-8 border border-slate-800">
                  <button 
                    onClick={() => setMode('scale')}
                    className={`flex-1 py-4 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${mode === 'scale' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500'}`}
                  >
                    <Scale size={16} /> By Grams
                  </button>
                  <button 
                    onClick={() => setMode('goal')}
                    className={`flex-1 py-4 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${mode === 'goal' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500'}`}
                  >
                    <CheckCircle size={16} /> By Protein
                  </button>
               </div>

               {/* INPUT */}
               <div className="relative mb-8">
                 <input 
                   autoFocus
                   type="number" 
                   className="w-full bg-slate-950 border border-teal-500/30 text-white font-bold text-6xl p-8 rounded-[2rem] text-center outline-none focus:border-teal-500 transition-colors"
                   value={value}
                   onChange={(e) => setValue(e.target.value)}
                   placeholder="0"
                 />
                 <span className="absolute right-8 bottom-8 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                   {mode === 'scale' ? 'Grams' : 'Prot (g)'}
                 </span>
               </div>

               {/* LIVE STATS */}
               {result.weight > 0 && (
                 <div className="grid grid-cols-3 gap-3 mb-8">
                    <div className="bg-slate-800/50 p-3 rounded-2xl text-center border border-slate-700/50">
                       <p className="text-[9px] text-slate-400 uppercase font-bold">Scoop</p>
                       <p className="text-xl font-bold text-white">{result.weight}g</p>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-2xl text-center border border-slate-700/50">
                       <p className="text-[9px] text-teal-500 uppercase font-bold">Prot</p>
                       <p className="text-xl font-bold text-white">{result.prot}g</p>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-2xl text-center border border-slate-700/50">
                       <p className="text-[9px] text-amber-500 uppercase font-bold">Cals</p>
                       <p className="text-xl font-bold text-white">{result.cals}</p>
                    </div>
                 </div>
               )}

               <button 
                 onClick={handleEat}
                 disabled={!value || result.weight > selectedItem.currentWeight}
                 className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-20 disabled:cursor-not-allowed text-slate-950 font-bold py-5 rounded-2xl shadow-lg shadow-teal-500/20 transition-all active:scale-95 text-sm uppercase tracking-widest"
               >
                 {result.weight > selectedItem.currentWeight 
                   ? "Insufficient Quantity" 
                   : "Log & Eat"
                 }
               </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </motion.div>
  );
}