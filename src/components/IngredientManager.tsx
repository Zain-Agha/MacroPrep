import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Ingredient } from "../db";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Save, ScanBarcode, Trash2, Search, Droplets, Scale, Layers, Edit2, XCircle } from "lucide-react";

export default function IngredientManager({ onBack }: { onBack: () => void }) {
  // --- FORM STATE ---
  const [form, setForm] = useState({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    category: "protein",
    measure: "g" as "g" | "ml" | "unit",
    unitWeight: "" 
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null); // Track which item is being edited

  // --- QUERY ---
  const myIngredients = useLiveQuery(
     () => db.ingredients
       .filter(ing => ing.name.toLowerCase().includes(searchQuery.toLowerCase()))
       .limit(20)
       .toArray(), 
     [searchQuery]
  );

  // --- ACTIONS ---
  
  const startEdit = (ing: Ingredient) => {
    setEditingId(ing.id!);
    setForm({
      name: ing.name,
      calories: ing.calories.toString(),
      protein: ing.protein.toString(),
      carbs: ing.carbs.toString(),
      fat: ing.fat.toString(),
      category: ing.category,
      measure: ing.measure || 'g',
      unitWeight: ing.unitWeight ? ing.unitWeight.toString() : ""
    });
    // Scroll to top to see the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ 
      name: "", calories: "", protein: "", carbs: "", fat: "", 
      category: "protein", measure: "g", unitWeight: "" 
    });
  };

  const save = async () => {
    if (!form.name || !form.calories) return;

    const payload = {
      name: form.name,
      calories: Number(form.calories),
      protein: Number(form.protein) || 0,
      carbs: Number(form.carbs) || 0,
      fat: Number(form.fat) || 0,
      category: form.category,
      measure: form.measure,
      unitWeight: form.measure === 'unit' ? Number(form.unitWeight) : undefined
    };

    if (editingId) {
      // UPDATE EXISTING
      await db.ingredients.update(editingId, payload);
      setEditingId(null);
    } else {
      // CREATE NEW
      await db.ingredients.add(payload);
    }

    // Reset Form
    setForm({ 
      name: "", calories: "", protein: "", carbs: "", fat: "", 
      category: "protein", measure: "g", unitWeight: "" 
    });
    alert(editingId ? "Item Updated!" : "Item Added!");
  };

  const remove = async (id: number) => {
    if (confirm("Delete this ingredient forever?")) {
      await db.ingredients.delete(id);
      if (editingId === id) cancelEdit(); // If we deleted the item we were editing, reset form
    }
  };

  return (
    <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="min-h-screen bg-slate-950 p-4 pb-20">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 bg-slate-900 rounded-full border border-slate-800 text-slate-400">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <ScanBarcode size={20} className="text-teal-500" /> Pantry Manager
        </h1>
      </div>

      {/* 1. EDIT/ADD SECTION */}
      <div className={`p-6 rounded-2xl border shadow-xl mb-10 transition-colors duration-300 ${editingId ? 'bg-slate-900 border-amber-500/50' : 'bg-slate-900 border-slate-800'}`}>
         <div className="flex justify-between items-center mb-4">
            <h3 className={`font-bold ${editingId ? 'text-amber-500' : 'text-white'}`}>
              {editingId ? "Editing Item" : "Add Custom Food"}
            </h3>
            {editingId && (
              <button onClick={cancelEdit} className="text-xs text-slate-500 flex items-center gap-1 hover:text-white">
                <XCircle size={14}/> Cancel
              </button>
            )}
         </div>
         
         <div className="space-y-4">
            <div>
               <label className="text-xs text-slate-500 uppercase tracking-wider block mb-2">Food Name</label>
               <input 
                 className="w-full bg-slate-950 border border-slate-700 text-white p-3 rounded-lg focus:border-teal-500 outline-none"
                 placeholder="e.g. Almond Milk"
                 value={form.name}
                 onChange={e => setForm({...form, name: e.target.value})}
               />
            </div>

            {/* UNIT TYPE SELECTOR */}
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
               {[
                 { id: 'g', label: 'Grams', icon: Scale },
                 { id: 'ml', label: 'Milliliters', icon: Droplets },
                 { id: 'unit', label: 'Units/Pieces', icon: Layers }
               ].map((type) => (
                 <button 
                    key={type.id}
                    onClick={() => setForm({...form, measure: type.id as any})}
                    className={`flex-1 py-2 text-[10px] uppercase font-bold rounded flex flex-col items-center gap-1 transition-all ${form.measure === type.id ? 'bg-slate-800 text-white shadow' : 'text-slate-600'}`}
                 >
                    <type.icon size={14} />
                    {type.label}
                 </button>
               ))}
            </div>

            {/* MACROS GRID */}
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Calories</label>
                  <input type="number" className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded outline-none" placeholder="0" value={form.calories} onChange={e => setForm({...form, calories: e.target.value})} />
               </div>
               <div>
                  <label className="text-xs text-teal-500 uppercase tracking-wider block mb-1">Protein (g)</label>
                  <input type="number" className="w-full bg-slate-950 border border-teal-500/20 text-white p-2 rounded outline-none" placeholder="0" value={form.protein} onChange={e => setForm({...form, protein: e.target.value})} />
               </div>
               <div>
                  <label className="text-xs text-amber-500 uppercase tracking-wider block mb-1">Carbs (g)</label>
                  <input type="number" className="w-full bg-slate-950 border border-amber-500/20 text-white p-2 rounded outline-none" placeholder="0" value={form.carbs} onChange={e => setForm({...form, carbs: e.target.value})} />
               </div>
               <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Fat (g)</label>
                  <input type="number" className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded outline-none" placeholder="0" value={form.fat} onChange={e => setForm({...form, fat: e.target.value})} />
               </div>
            </div>

            {/* WEIGHT PER PIECE (Only for Units) */}
            <AnimatePresence>
              {form.measure === 'unit' && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg mt-2">
                      <label className="text-xs text-amber-500 uppercase tracking-wider block mb-1">Avg Grams per piece</label>
                      <input type="number" className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded outline-none" placeholder="e.g. 28 for bread" value={form.unitWeight} onChange={e => setForm({...form, unitWeight: e.target.value})} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              onClick={save} 
              disabled={!form.name} 
              className={`w-full mt-4 text-slate-950 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 ${editingId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-teal-500 hover:bg-teal-600'}`}
            >
              {editingId ? <Edit2 size={20}/> : <Save size={20} />}
              {editingId ? "Update Item" : "Save to Database"}
            </button>
         </div>
      </div>

      {/* 2. MANAGE / DELETE SECTION */}
      <div className="border-t border-slate-800 pt-8">
         <h3 className="text-white font-bold mb-4">Culinary Library</h3>
         <div className="relative mb-6">
             <Search className="absolute left-3 top-3 text-slate-500" size={18} />
             <input 
               className="w-full bg-slate-900 border border-slate-800 text-white pl-10 pr-4 py-3 rounded-xl focus:border-slate-600 outline-none"
               placeholder="Find items to edit..."
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
             />
         </div>

         <div className="space-y-2">
            {myIngredients?.map(ing => (
               <div key={ing.id} className="flex justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-800">
                  <div className="flex-1">
                     <p className="text-white font-medium mb-1">{ing.name}</p>
                     <div className="flex gap-2 text-[10px] font-mono">
                        <span className="text-teal-400">P: {ing.protein}g</span>
                        <span className="text-amber-500">C: {ing.carbs}g</span>
                        <span className="text-slate-400">F: {ing.fat}g</span>
                        <span className="text-slate-600 uppercase ml-2">{ing.measure}</span>
                     </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(ing)} className="text-slate-500 hover:text-amber-500 p-2 transition-colors bg-slate-950 rounded-lg border border-slate-800">
                       <Edit2 size={16} />
                    </button>
                    <button onClick={() => remove(ing.id!)} className="text-slate-700 hover:text-red-500 p-2 transition-colors">
                       <Trash2 size={18} />
                    </button>
                  </div>
               </div>
            ))}
            {myIngredients?.length === 0 && (
               <p className="text-center text-slate-600 text-sm py-10">No items found.</p>
            )}
         </div>
      </div>

    </motion.div>
  );
}