import { db } from "../db";
import { motion } from "framer-motion";
import QRCode from "react-qr-code"; // <--- LOCAL GENERATOR
import { 
  ArrowLeft, Trash2, Download, Upload, 
  AlertTriangle, ShieldCheck, Share2, QrCode
} from "lucide-react";

export default function Settings({ onBack }: { onBack: () => void }) {
  
  // --- SHARE LOGIC ---
  // If running locally, this is 'http://localhost:5173'. 
  // If deployed, it's 'https://your-app.netlify.app'
  const currentUrl = window.location.href; 

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'MacroPrep',
          text: 'My Local-First Kitchen Companion',
          url: currentUrl,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(currentUrl);
      alert("Link copied to clipboard!");
    }
  };

  // --- DATA LOGIC ---
  const exportData = async () => {
    const backup = {
      user: await db.user.toArray(),
      ingredients: await db.ingredients.toArray(),
      fridge: await db.fridge.toArray(),
      recipes: await db.recipes.toArray(),
      logs: await db.logs.toArray(),
      version: 9,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MacroPrep_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (confirm("This will overwrite your current data. Continue?")) {
          await db.transaction('rw', [db.user, db.ingredients, db.fridge, db.logs, db.recipes], async () => {
            await db.user.clear(); await db.user.bulkAdd(data.user);
            await db.ingredients.clear(); await db.ingredients.bulkAdd(data.ingredients);
            await db.fridge.clear(); await db.fridge.bulkAdd(data.fridge);
            if (data.recipes) { await db.recipes.clear(); await db.recipes.bulkAdd(data.recipes); }
            await db.logs.clear(); await db.logs.bulkAdd(data.logs);
          });
          alert("Restore Complete!");
          window.location.reload();
        }
      } catch (err) {
        alert("Invalid Backup File");
      }
    };
    reader.readAsText(file);
  };

  const nukeEverything = async () => {
    if (confirm("WARNING: This will delete ALL your data, recipes, and history. There is no undo. Proceed?")) {
      await db.delete(); 
      window.location.reload();
    }
  };

  return (
    <motion.div initial={{ x: -300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="min-h-screen bg-slate-950 p-6 pb-32">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 bg-slate-900 rounded-full border border-slate-800 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-white">System Settings</h1>
      </div>

      <div className="space-y-6">
        
        {/* 1. SHARE SECTION */}
        <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 shadow-xl overflow-hidden relative">
           <div className="absolute top-0 right-0 p-6 opacity-10"><QrCode size={120} className="text-teal-500"/></div>
           
           <h2 className="text-xs font-bold text-teal-500 uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10">
             <Share2 size={14} /> Share Access
           </h2>

           <div className="flex flex-col items-center justify-center relative z-10">
              {/* QR CONTAINER - White background ensures camera readability */}
              <div className="bg-white p-4 rounded-3xl shadow-lg mb-6">
                 <QRCode 
                    value={currentUrl} 
                    size={160}
                    fgColor="#020617" // Deep Slate Color
                    bgColor="#ffffff" // White Background
                 />
              </div>
              
              <button 
                onClick={handleShare}
                className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-900 px-6 py-3 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-teal-500/20"
              >
                <Share2 size={18} /> Share App Link
              </button>
              <p className="text-[10px] text-slate-500 mt-4 text-center max-w-xs leading-relaxed">
                 Scan this code to open MacroPrep on another device.
                 <br/>(Only works if you are on the same Wi-Fi or have deployed the app).
              </p>
           </div>
        </div>

        {/* 2. DATA MANAGEMENT */}
        <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <ShieldCheck size={14} className="text-slate-400"/> Data Security
          </h2>
          
          <div className="grid grid-cols-1 gap-3">
             <button 
               onClick={exportData}
               className="w-full flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800 hover:border-teal-500/50 transition-colors group"
             >
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-slate-900 rounded-lg text-teal-500"><Download size={18} /></div>
                   <span className="text-sm font-bold text-slate-200">Export Backup</span>
                </div>
                <span className="text-[10px] text-slate-600 font-mono">.json</span>
             </button>

             <label className="w-full flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800 hover:border-amber-500/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-slate-900 rounded-lg text-amber-500"><Upload size={18} /></div>
                   <span className="text-sm font-bold text-slate-200">Import Backup</span>
                </div>
                <input type="file" accept=".json" onChange={importData} className="hidden" />
             </label>
          </div>
        </div>

        {/* 3. THE DANGER ZONE */}
        <div className="bg-red-500/5 p-6 rounded-[2rem] border border-red-500/20">
          <h2 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <AlertTriangle size={14} /> Danger Zone
          </h2>
          <p className="text-[10px] text-red-400/70 mb-6 leading-relaxed">
            Performing a system reset will permanently delete your user profile, pantry ingredients, fridge inventory, saved memories, and eating history.
          </p>
          <button 
            onClick={nukeEverything}
            className="w-full flex items-center justify-center gap-2 p-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-2xl font-bold transition-all"
          >
            <Trash2 size={18} />
            Reset Entire System
          </button>
        </div>
      </div>
    </motion.div>
  );
}