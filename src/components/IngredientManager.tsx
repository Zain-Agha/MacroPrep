import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Ingredient } from "../db";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Save, ScanBarcode, Trash2, Search, Droplets, Scale, Layers } from "lucide-react";

export default function IngredientManager({ onBack }: { onBack: () => void }) {
  const [form, setForm] = useState({
    name: "", calories: "", protein: "", carbs: "", fat: "",
    category: "protein", measure: "g" as "g" | "ml" | "unit", unitWeight: "" 
  });

  const [searchQuery, setSearchQuery] = useState("");

  const myIngredients = useLiveQuery(
     () => db.ingredients
       .filter(ing => ing.name.toLowerCase().includes(searchQuery.toLowerCase()))
       .limit(20)
       .toArray(), 
     [searchQuery]
  );

  const save = async () => {
    if (!form.name || !form.calories) return;

    await db.ingredients.add({
      name: form.name,
      calories: Number(form.calories),
      protein: Number(form.protein) || 0,
      carbs: Number(form.carbs) || 0,
      fat: Number(form.fat) || 0,
      category: form.category,
      measure: form.measure,
      unitWeight: form.measure === 'unit' ? Number(form.unitWeight) : undefined
    });

    setForm({ 
      name: "", calories: "", protein: "", carbs: "", fat: "", 
      category: "protein", measure: "g", unitWeight: "" 
    });
  };

  const remove = async (id: number) => {
    if (confirm("Delete this ingredient forever?")) {
      await db.ingredients.delete(id);
    }
  };

  return (
    <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="min-h-screen bg-slate-950 p-4 pb-24">
      
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 bg-slate-900 rounded-full border border-slate-800 text-slate-400">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <ScanBarcode size={20} className="text-teal-500" /> Pantry Manager
        </h1>
      </div>

      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl mb-10">
         <h3 className="text-white font-bold mb-4">Add Custom Item</h3>
         <div className="space-y-4">
            <input className="w-full bg-slate-950 border border-slate-700 text-white p-4 rounded-xl outline-none focus:border-teal-500" placeholder="Food Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />

            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
               {[
                 { id: 'g', label: 'Grams', icon: Scale },
                 { id: 'ml', label: 'Milliliters', icon: Droplets },
                 { id: 'unit', label: 'Pieces', icon: Layers }
               ].map((type) => (
                 <button key={type.id} onClick={() => setForm({...form, measure: type.id as any})} className={`flex-1 py-3 text-[10px] uppercase font-bold rounded-lg flex flex-col items-center gap-1 transition-all ${form.measure === type.id ? 'bg-slate-800 text-white shadow' : 'text-slate-600'}`}>
                    <type.icon size={14} /> {type.label}
                 </button>
               ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div><label className="text-[10px] text-slate-500 uppercase font-bold ml-1">Calories</label><input type="number" className="w-full bg-slate-950 border border-slate-700 text-white p-3 rounded-lg outline-none" value={form.calories} onChange={e => setForm({...form, calories: e.target.value})} /></div>
               <div><label className="text-[10px] text-teal-500 uppercase font-bold ml-1">Protein</label><input type="number" className="w-full bg-slate-950 border border-teal-500/20 text-white p-3 rounded-lg outline-none" value={form.protein} onChange={e => setForm({...form, protein: e.target.value})} /></div>
               <div><label className="text-[10px] text-amber-500 uppercase font-bold ml-1">Carbs</label><input type="number" className="w-full bg-slate-950 border border-amber-500/20 text-white p-3 rounded-lg outline-none" value={form.carbs} onChange={e => setForm({...form, carbs: e.target.value})} /></div>
               <div><label className="text-[10px] text-slate-400 uppercase font-bold ml-1">Fat</label><input type="number" className="w-full bg-slate-950 border border-slate-700 text-white p-3 rounded-lg outline-none" value={form.fat} onChange={e => setForm({...form, fat: e.target.value})} /></div>
            </div>

            <AnimatePresence>
              {form.measure === 'unit' && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="overflow-hidden bg-amber-500/5 p-4 rounded-xl border border-amber-500/20">
                  <label className="text-[10px] text-amber-500 uppercase font-bold block mb-1">Grams per Piece</label>
                  <input type="number" className="w-full bg-slate-950 border border-slate-700 text-white p-3 rounded-lg outline-none" placeholder="e.g. 30" value={form.unitWeight} onChange={e => setForm({...form, unitWeight: e.target.value})} />
                </motion.div>
              )}
            </AnimatePresence>

            <button onClick={save} disabled={!form.name} className="w-full mt-4 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-teal-500/10">
              <Save size={20} /> Save to Database
            </button>
         </div>
      </div>

      <div className="border-t border-slate-800 pt-8">
         <h3 className="text-white font-bold mb-4">Library Management</h3>
         <div className="relative mb-6">
             <Search className="absolute left-4 top-3.5 text-slate-500" size={18} />
             <input className="w-full bg-slate-900 border border-slate-800 text-white pl-12 pr-4 py-3.5 rounded-2xl outline-none focus:border-slate-600" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
         </div>
         <div className="space-y-2">
            {myIngredients?.map(ing => (
               <div key={ing.id} className="flex justify-between items-center bg-slate-900 p-4 rounded-2xl border border-slate-800">
                  <div>
                     <p className="text-white font-bold text-sm">{ing.name}</p>
                     <div className="flex gap-2 text-[9px] font-mono mt-0.5 uppercase">
                        <span className="text-teal-400">P: {ing.protein}g</span>
                        <span className="text-amber-500">C: {ing.carbs}g</span>
                        <span className="text-slate-600 ml-2">{ing.measure}</span>
                     </div>
                  </div>
                  <button onClick={() => remove(ing.id!)} className="text-slate-700 hover:text-red-500 p-2"><Trash2 size={18} /></button>
               </div>
            ))}
         </div>
      </div>
    </motion.div>
  );
}