import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Ingredient, type SavedRecipe } from "../db";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { 
  Search, Plus, ChefHat, ArrowLeft, Trash2, Edit2, 
  Flame, Calculator, CheckCircle, Save, Package, Droplets, BookOpen, X,
  Target, Utensils, AlertCircle // <--- ENSURED ALERT CIRCLE IS HERE
} from "lucide-react";

interface PotItem {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  weight: number; 
  measure: 'g' | 'unit' | 'ml';
  unitWeight?: number; 
  fromFridgeId?: number; 
}

export default function KitchenLab({ 
  onBack, 
  pot, 
  setPot 
}: { 
  onBack: () => void, 
  pot: PotItem[], 
  setPot: (items: PotItem[]) => void 
}) {
  // --- STATE ---
  const [phase, setPhase] = useState<'prep' | 'cook' | 'distribute'>('prep');
  const [query, setQuery] = useState("");
  
  // Note: 'pot' state is now passed via props (Lifted State)
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Memories / Recipes
  const [showRecipes, setShowRecipes] = useState(false);
  const [saveMode, setSaveMode] = useState(false); 
  const [recipeName, setRecipeName] = useState("");

  const [finalWeight, setFinalWeight] = useState<string>("");
  const [batchName, setBatchName] = useState<string>("");
  const [distMode, setDistMode] = useState<'goal' | 'scale'>('goal'); 
  const [targetValue, setTargetValue] = useState<string>(""); 

  const savedRecipes = useLiveQuery(() => db.recipes.toArray());

  // --- ANIMATION VARIANTS ---
  const containerVars: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };
  const itemVars: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  // --- SAFETY NAVIGATION ---
  const handleBack = () => {
    if (phase === 'distribute') {
      setPhase('cook');
    } else if (phase === 'cook') {
      setPhase('prep');
    } else {
      if (pot.length > 0) {
        if (confirm("Discard this pot and return to dashboard?")) {
          setPot([]); // Clear pot on exit if confirmed
          onBack();
        }
      } else {
        onBack();
      }
    }
  };

  // --- SEARCH LOGIC ---
  const searchResults = useLiveQuery(async () => {
    if (query.length < 1) return [];
    const rawMatch = await db.ingredients.filter(ing => ing.name.toLowerCase().includes(query.toLowerCase())).toArray();
    const fridgeMatch = await db.fridge.filter(f => f.name.toLowerCase().includes(query.toLowerCase())).toArray();
    const combined = [...fridgeMatch.map(f => ({ ...f, isFridge: true })), ...rawMatch.map(r => ({ ...r, isFridge: false }))];
    const unique = combined.filter((item, index, self) => index === self.findIndex((t) => t.name === item.name));
    return unique.slice(0, 10);
  }, [query]);

  // --- ACTIONS ---
  const addRawToPot = (ing: Ingredient) => {
    setPot([...pot, {
      id: Date.now(),
      name: ing.name,
      calories: ing.calories,
      protein: ing.protein || 0,
      carbs: ing.carbs || 0,
      fat: ing.fat || 0,
      weight: ing.measure === 'unit' ? 1 : 100,
      measure: ing.measure || 'g',
      unitWeight: ing.unitWeight
    }]);
    setQuery("");
  };

  const addFridgeToPot = (item: any) => {
    setPot([...pot, {
      id: Date.now(),
      name: item.name,
      calories: item.calories,
      protein: item.protein || 0,
      carbs: item.carbs || 0,
      fat: item.fat || 0,
      weight: 100, 
      measure: 'g',
      fromFridgeId: item.id 
    }]);
    setQuery("");
  };

  // --- MEMORIES LOGIC ---
  const saveRecipe = async () => {
    if (!recipeName || pot.length === 0) return;
    const currentCookedWeight = finalWeight ? Number(finalWeight) : undefined;
    await db.recipes.add({
      name: recipeName,
      ingredients: pot,
      defaultCookedWeight: currentCookedWeight
    });
    setSaveMode(false);
    setRecipeName("");
  };

  const loadRecipe = (recipe: SavedRecipe) => {
    const freshPot = recipe.ingredients.map((i: any) => ({
      ...i,
      id: Date.now() + Math.random() 
    }));
    setPot(freshPot);
    if (recipe.defaultCookedWeight) {
      setFinalWeight(recipe.defaultCookedWeight.toString());
    } else {
      setFinalWeight("");
    }
    setShowRecipes(false);
  };

  const deleteRecipe = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if(confirm("Delete this memory?")) await db.recipes.delete(id);
  };

  // --- TOTALS ---
  const updateWeight = (id: number, newWeight: number) => {
    setPot(pot.map(p => p.id === id ? { ...p, weight: newWeight } : p));
    setEditingId(null);
  };
  const remove = (id: number) => setPot(pot.filter(p => p.id !== id));

  const totalRawWeight = pot.reduce((s, i) => (i.measure === 'unit' ? s + (i.weight * (i.unitWeight || 0)) : s + i.weight), 0);
  const totalCals = pot.reduce((s, i) => (i.measure === 'unit' ? s + (i.calories * i.weight) : s + (i.calories * (i.weight / 100))), 0);
  const totalProt = pot.reduce((s, i) => (i.measure === 'unit' ? s + (i.protein * i.weight) : s + (i.protein * (i.weight / 100))), 0);
  const totalCarb = pot.reduce((s, i) => (i.measure === 'unit' ? s + (i.carbs * i.weight) : s + (i.carbs * (i.weight / 100))), 0);
  const totalFat = pot.reduce((s, i) => (i.measure === 'unit' ? s + (i.fat * i.weight) : s + (i.fat * (i.weight / 100))), 0);

  const cookedWeightNum = Number(finalWeight) || totalRawWeight;

  // --- FINISH ACTIONS ---
  const saveBatchToFridge = async () => {
    if (!batchName || !finalWeight) return;
    await db.fridge.add({
      name: batchName,
      calories: Math.round((totalCals / cookedWeightNum) * 100),
      protein: Math.round((totalProt / cookedWeightNum) * 100),
      carbs: Math.round((totalCarb / cookedWeightNum) * 100),
      fat: Math.round((totalFat / cookedWeightNum) * 100),
      totalWeight: cookedWeightNum,
      currentWeight: cookedWeightNum,
      createdAt: new Date(),
      measure: 'g'
    });
    setPot([]); // Clear pot after saving
    onBack();
  };

  // --- VALIDATION LOGIC (NEW) ---
  const checkLimits = () => {
    const val = Number(targetValue);
    if (!val) return null;

    if (distMode === 'scale') {
      // Input > Total Weight
      if (val > cookedWeightNum) return { type: 'weight', max: cookedWeightNum };
    } else {
      // Input > Total Protein
      if (val > totalProt) return { type: 'prot', max: Math.round(totalProt) };
    }
    return null;
  };

  const limitError = checkLimits();

  const getWizardResults = () => {
    const val = Number(targetValue);
    if (!val) return { weight: 0, cals: 0, prot: 0, carb: 0, fat: 0 };
    
    // Calculate even if over limit so user sees the insane number
    const w = distMode === 'goal' ? Math.round((val / totalProt) * cookedWeightNum) : val;
    const ratio = w / (cookedWeightNum || 1);
    
    return {
      weight: w,
      cals: Math.round(totalCals * ratio),
      prot: Math.round(totalProt * ratio),
      carb: Math.round(totalCarb * ratio),
      fat: Math.round(totalFat * ratio)
    };
  };

  const res = getWizardResults();

  const logToDiary = async () => {
    if (res.weight <= 0 || limitError) return; // Block if error
    const fridgeSource = pot.find(i => i.fromFridgeId);
    await db.logs.add({
      date: new Date().toISOString().split('T')[0],
      name: pot.length === 1 ? pot[0].name : (batchName || "Meal Batch"),
      amountConsumed: res.weight,
      calories: res.cals, protein: res.prot, carbs: res.carb, fat: res.fat,
      timestamp: new Date(),
      fridgeItemId: fridgeSource?.fromFridgeId
    });
    for (const item of pot) {
      if (item.fromFridgeId) {
        const fi = await db.fridge.get(item.fromFridgeId);
        if (fi) {
          const nw = fi.currentWeight - item.weight;
          if (nw <= 0) await db.fridge.delete(fi.id!);
          else await db.fridge.update(fi.id!, { currentWeight: nw });
        }
      }
    }
    setPot([]); // Clear pot after eating
    onBack();
  };

  return (
    <motion.div initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="min-h-screen bg-slate-950 p-4">
      
      {/* TOP HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={handleBack} className="p-2 bg-slate-900 rounded-full border border-slate-800 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-amber-500 flex items-center gap-2">
             <ChefHat size={20}/> 
             {phase === 'prep' ? 'Kitchen Lab' : phase === 'cook' ? 'The Stove' : 'Wizard'}
          </h1>
        </div>
        
        {phase === 'prep' && (
          <button 
            onClick={() => setShowRecipes(true)} 
            className="p-2 bg-slate-900 rounded-full border border-slate-800 text-teal-500 hover:bg-slate-800 transition-colors"
          >
            <BookOpen size={20} />
          </button>
        )}
      </div>

      {/* RECIPE MODAL */}
      <AnimatePresence>
        {showRecipes && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
             <div className="bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-800 p-6 shadow-2xl max-h-[70vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="text-white font-bold text-lg">Your Memories</h3>
                   <button onClick={() => setShowRecipes(false)}><X className="text-slate-500"/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-2 mb-4 scrollbar-hide">
                   {savedRecipes?.map(r => (
                     <div key={r.id} onClick={() => loadRecipe(r)} className="p-4 bg-slate-800 rounded-xl flex justify-between items-center cursor-pointer hover:bg-slate-700">
                        <div>
                           <span className="text-slate-200 font-medium block">{r.name}</span>
                           {r.defaultCookedWeight && <span className="text-[10px] text-teal-500">{r.defaultCookedWeight}g cooked</span>}
                        </div>
                        <button onClick={(e) => deleteRecipe(e, r.id!)} className="text-slate-500 hover:text-red-500 p-1"><Trash2 size={16}/></button>
                     </div>
                   ))}
                   {savedRecipes?.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No saved memories yet.</p>}
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {phase === 'prep' && (
        <>
          <div className="relative mb-6 z-40">
            <Search className="absolute left-3 top-3 text-slate-500" size={20} />
            <input autoFocus type="text" placeholder="Search..." className="w-full bg-slate-900 border border-slate-800 text-slate-200 pl-10 pr-4 py-3 rounded-xl outline-none focus:border-amber-500" value={query} onChange={(e) => setQuery(e.target.value)} />
            <AnimatePresence>
              {query.length > 0 && searchResults && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute top-14 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto z-50 scrollbar-hide">
                  {searchResults.map((item: any) => (
                    <button key={item.isFridge ? `f-${item.id}` : `r-${item.id}`} onClick={() => item.isFridge ? addFridgeToPot(item) : addRawToPot(item)} className={`w-full text-left p-3 hover:bg-slate-800 border-b border-slate-800 flex justify-between items-center group ${item.isFridge ? 'bg-teal-500/5' : ''}`}>
                      <div>
                        <span className={`${item.isFridge ? 'text-teal-400 font-bold' : 'text-slate-300'} text-sm flex items-center gap-2`}>
                          {item.isFridge && <Package size={14}/>} {item.name}
                        </span>
                        <div className="flex gap-2 text-[9px] font-mono mt-1 opacity-60">
                          <span className="text-white font-bold">{item.calories} kcal</span>
                          <span className="text-teal-500">P:{Math.round(item.protein)}</span>
                          <span className="text-amber-500">C:{Math.round(item.carbs)}</span>
                          <span className="text-slate-400">F:{Math.round(item.fat)}</span>
                        </div>
                      </div>
                      {item.isFridge ? <span className="text-[10px] text-teal-600 font-bold">{item.currentWeight}g left</span> : <Plus size={16} className="text-amber-500" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-3 pb-32"> 
            {pot.map((item) => (
              <div key={item.id} className="p-4 bg-slate-900/50 rounded-xl border border-slate-800/50 flex justify-between items-center">
                <div className="flex-1">
                  <p className="text-slate-200 font-medium text-sm flex items-center gap-2">
                    {item.measure === 'ml' && <Droplets size={12} className="text-teal-500"/>}
                    {item.fromFridgeId && <Package size={12} className="text-teal-500"/>}
                    {item.name}
                  </p>
                  {/* ADDED KCAL AND FAT TO LIST ITEMS */}
                  <div className="flex gap-2 text-[9px] mt-1 font-mono">
                    <span className="text-white font-bold">{Math.round(item.calories * (item.measure === 'unit' ? item.weight : item.weight/100))} kcal</span>
                    <span className="text-teal-500">P:{Math.round(item.protein * (item.measure === 'unit' ? item.weight : item.weight/100))}</span>
                    <span className="text-amber-500">C:{Math.round(item.carbs * (item.measure === 'unit' ? item.weight : item.weight/100))}</span>
                    <span className="text-slate-400">F:{Math.round(item.fat * (item.measure === 'unit' ? item.weight : item.weight/100))}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                   {editingId === item.id ? (
                     <input autoFocus type="number" className="w-16 bg-slate-950 border border-amber-500 rounded p-1 text-center text-white outline-none" defaultValue={item.weight} onBlur={(e) => updateWeight(item.id, Number(e.target.value))} onKeyDown={(e) => e.key === 'Enter' && updateWeight(item.id, Number(e.currentTarget.value))} />
                   ) : (
                     <button onClick={() => setEditingId(item.id)} className="text-amber-500 font-mono font-bold flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                       {item.weight}{item.measure === 'unit' ? 'x' : item.measure} <Edit2 size={10} opacity={0.5}/>
                     </button>
                   )}
                   <button onClick={() => remove(item.id)} className="text-slate-700 hover:text-red-500 p-1"><Trash2 size={18}/></button>
                </div>
              </div>
            ))}
            {pot.length === 0 && <div className="text-center py-20 text-slate-700"><ChefHat size={48} className="mx-auto mb-4 opacity-10" /><p className="text-sm">The pot is empty.</p></div>}
          </div>

          <div className="fixed bottom-28 left-0 w-full px-4 z-40 pointer-events-none">
             <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 p-4 rounded-2xl shadow-2xl pointer-events-auto">
                <div className="grid grid-cols-4 gap-2 mb-4">
                    <div className="text-center"><p className="text-[10px] text-slate-500 uppercase font-bold">Cals</p><p className="text-lg font-bold text-white">{Math.round(totalCals)}</p></div>
                    <div className="text-center"><p className="text-[10px] text-slate-500 uppercase font-bold">Prot</p><p className="text-lg font-bold text-teal-500">{Math.round(totalProt)}g</p></div>
                    <div className="text-center"><p className="text-[10px] text-slate-500 uppercase font-bold">Carbs</p><p className="text-lg font-bold text-amber-500">{Math.round(totalCarb)}g</p></div>
                    <div className="text-center"><p className="text-[10px] text-slate-500 uppercase font-bold">Fat</p><p className="text-lg font-bold text-slate-400">{Math.round(totalFat)}g</p></div>
                </div>
                
                <div className="flex gap-2">
                   <button onClick={() => setSaveMode(!saveMode)} disabled={pot.length === 0} className="bg-slate-800 text-teal-500 p-3 rounded-xl border border-slate-700 disabled:opacity-50">
                     <BookOpen size={20} />
                   </button>
                   <button onClick={() => setPhase('cook')} disabled={pot.length === 0} className="flex-1 bg-amber-500 hover:bg-amber-600 active:scale-95 transition-all text-black font-bold py-3 rounded-xl flex justify-center gap-2 shadow-lg">
                     <Flame size={20} /> Cook / Assemble
                   </button>
                </div>

                {saveMode && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-3 flex gap-2">
                     <input autoFocus className="flex-1 bg-slate-950 border border-teal-500/50 rounded-lg px-3 text-sm text-white outline-none" placeholder="Recipe Name..." value={recipeName} onChange={e => setRecipeName(e.target.value)} />
                     <button onClick={saveRecipe} disabled={!recipeName} className="bg-teal-500 text-slate-900 px-4 py-2 rounded-lg font-bold text-xs">Save</button>
                  </motion.div>
                )}
             </div>
          </div>
        </>
      )}

      {/* PHASE 2 & 3: LIFTED CONTENT */}
      {phase !== 'prep' && (
         <div className="pb-28"> 
            {phase === 'cook' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center pt-10 px-4">
                   <h2 className="text-xl font-bold text-white mb-2">Final Weight?</h2>
                   <p className="text-xs text-slate-500 mb-8">Raw Total: {totalRawWeight}g</p>
                   <input 
                     type="number" 
                     placeholder="Grams" 
                     className="w-full max-w-xs bg-slate-900 border border-slate-700 text-white p-6 rounded-3xl text-center font-bold text-4xl mb-8 outline-none focus:border-amber-500" 
                     value={finalWeight} 
                     onChange={(e) => setFinalWeight(e.target.value)} 
                   />
                   
                   <div className="w-full max-w-xs space-y-4">
                      {!saveMode ? (
                        <button onClick={() => setSaveMode(true)} className="w-full bg-slate-800 text-teal-500 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 hover:bg-slate-700 transition-colors">
                           <BookOpen size={16} /> Save cooked version as Memory
                        </button>
                      ) : (
                        <div className="flex gap-2">
                           <input autoFocus className="flex-1 bg-slate-950 border border-teal-500 rounded-lg px-3 text-white" placeholder="Recipe Name" value={recipeName} onChange={e => setRecipeName(e.target.value)} />
                           <button onClick={saveRecipe} className="bg-teal-500 text-slate-900 px-4 rounded-lg font-bold">Save</button>
                        </div>
                      )}

                      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 mt-4">
                        <input type="text" placeholder="Batch Name" className="w-full bg-slate-950 border border-slate-700 text-white p-4 rounded-xl mb-4 outline-none" value={batchName} onChange={(e) => setBatchName(e.target.value)} />
                        <button onClick={saveBatchToFridge} disabled={!batchName || !finalWeight} className="w-full bg-teal-500/10 text-teal-500 border border-teal-500/50 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-teal-500/20 disabled:opacity-20 transition-all"><Save size={18}/> Save to Fridge</button>
                      </div>
                      <div className="relative py-4"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div><div className="relative flex justify-center"><span className="bg-slate-950 px-4 text-slate-600 text-[10px] uppercase font-bold">Or</span></div></div>
                      <button onClick={() => setPhase('distribute')} disabled={!finalWeight} className="w-full bg-amber-500 py-4 rounded-2xl text-black font-bold shadow-lg shadow-amber-500/10">
                         <Utensils size={18}/> Eat Now
                      </button>
                   </div>
                </motion.div>
            )}

            {phase === 'distribute' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                   <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
                      <div className="flex bg-slate-950 rounded-xl p-1 mb-8">
                        <button onClick={() => setDistMode('goal')} className={`flex-1 py-3 text-sm font-bold rounded-lg ${distMode === 'goal' ? 'bg-slate-800 text-white' : 'text-slate-600'}`}>
                           <Target size={14} className="inline mr-2"/>Goal (P)
                        </button>
                        <button onClick={() => setDistMode('scale')} className={`flex-1 py-3 text-sm font-bold rounded-lg ${distMode === 'scale' ? 'bg-slate-800 text-white' : 'text-slate-600'}`}>
                           <Calculator size={14} className="inline mr-2"/>Scale (g)
                        </button>
                      </div>
                      
                      {/* INPUT WITH VALIDATION FEEDBACK */}
                      <div className="relative mb-8 text-center">
                         <input 
                           type="number" 
                           autoFocus 
                           className={`w-full bg-slate-950 border text-white font-bold text-6xl p-6 rounded-[2rem] text-center outline-none transition-all ${limitError ? 'border-red-500 text-red-500' : 'border-amber-500/30 focus:border-amber-500'}`}
                           value={targetValue} 
                           onChange={(e) => setTargetValue(e.target.value)} 
                         />
                         
                         {/* WARNING MESSAGE */}
                         {limitError ? (
                           <div className="absolute -bottom-8 left-0 w-full flex items-center justify-center gap-1.5 text-red-500">
                              <AlertCircle size={12} />
                              <span className="text-[10px] font-bold uppercase tracking-widest">
                                Limit exceeded (Max: {limitError.max}{limitError.type === 'prot' ? 'g Prot' : 'g'})
                              </span>
                           </div>
                         ) : (
                           <span className="absolute -bottom-6 left-0 w-full text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest pointer-events-none">
                              {distMode === 'goal' ? 'Target Protein (g)' : 'Total Weight (g)'}
                           </span>
                         )}
                      </div>

                      <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800 text-center mb-8">
                         <p className="text-4xl font-bold text-white mb-6 font-mono">{res.weight}g</p>
                         <div className="flex justify-around items-center border-t border-slate-900 pt-6">
                            <div className="text-center"><p className="text-[10px] text-teal-600 font-bold uppercase">Prot</p><p className="text-white font-bold">{res.prot}g</p></div>
                            <div className="text-center"><p className="text-[10px] text-amber-600 font-bold uppercase">Carb</p><p className="text-white font-bold">{res.carb}g</p></div>
                            <div className="text-center"><p className="text-[10px] text-slate-600 font-bold uppercase">Fat</p><p className="text-white font-bold">{res.fat}g</p></div>
                         </div>
                      </div>
                      
                      <button 
                        onClick={logToDiary} 
                        disabled={!!limitError || !targetValue} // Disable if error exists
                        className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-20 disabled:cursor-not-allowed py-5 rounded-2xl text-slate-950 font-bold flex items-center justify-center gap-3 transition-all"
                      >
                        <CheckCircle size={24}/> Log Meal
                      </button>
                   </div>
                </motion.div>
            )}
         </div>
      )}
    </motion.div>
  );
}