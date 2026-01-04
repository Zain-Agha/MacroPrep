import { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, seedDatabase } from "./db";
import { AnimatePresence, motion } from "framer-motion";
import { 
  LayoutDashboard, 
  ChefHat, 
  Package, 
  BarChart3, 
  Settings as GearIcon,
  ScanBarcode
} from "lucide-react";

// Components
import Onboarding from "./components/Onboarding";
import KitchenLab from "./components/KitchenLab";
import Dashboard from "./components/Dashboard";
import FridgeManager from "./components/FridgeManager";
import DataLab from "./components/DataLab";
import IngredientManager from "./components/IngredientManager";
import Settings from "./components/Settings";

type Tab = 'dashboard' | 'kitchen' | 'fridge' | 'analytics' | 'settings';

export default function App() {
  const user = useLiveQuery(() => db.user.toArray());
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  
  // "Sub-views" are for screens that aren't on the main tab bar (like Ingredient Manager)
  const [subView, setSubView] = useState<'none' | 'ingredients'>('none');

  useEffect(() => { seedDatabase(); }, []);

  if (!user) return <div className="p-10 text-white bg-slate-950 min-h-screen">Loading System...</div>;
  
  // Show Onboarding if no user exists
  if (user.length === 0) {
    return <Onboarding onComplete={() => window.location.reload()} />;
  }

  const profile = user[0];

  return (
    <div className="bg-slate-950 text-slate-50 min-h-screen flex flex-col">
      
      {/* MAIN CONTENT AREA */}
      {/* Always add padding (pb-32) so content clears the fixed nav bar */}
      <div className="flex-1 overflow-y-auto pb-32">
        <AnimatePresence mode="wait">
          
          {subView === 'ingredients' && (
            <IngredientManager key="ing" onBack={() => setSubView('none')} />
          )}

          {subView === 'none' && (
            <>
              {activeTab === 'dashboard' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Dashboard 
                    profile={profile} 
                    onOpenKitchen={() => setActiveTab('kitchen')} 
                    onOpenSettings={() => setActiveTab('settings')}
                  />
                  <button 
                    onClick={() => setSubView('ingredients')}
                    className="fixed bottom-28 right-6 p-4 bg-slate-800 border border-slate-700 rounded-full text-teal-500 shadow-xl z-10"
                  >
                    <ScanBarcode size={24} />
                  </button>
                </motion.div>
              )}

              {activeTab === 'kitchen' && (
                <KitchenLab key="kitchen" onBack={() => setActiveTab('dashboard')} />
              )}

              {activeTab === 'fridge' && (
                <FridgeManager key="fridge" onBack={() => setActiveTab('dashboard')} />
              )}

              {activeTab === 'analytics' && (
                <DataLab key="analytics" profile={profile} onBack={() => setActiveTab('dashboard')} />
              )}

              {activeTab === 'settings' && (
                <Settings key="settings" onBack={() => setActiveTab('dashboard')} />
              )}
            </>
          )}
        </AnimatePresence>
      </div>

      {/* BOTTOM TAB BAR (Always Visible now) */}
      {subView === 'none' && (
        <div className="fixed bottom-0 left-0 w-full bg-slate-900/95 backdrop-blur-md border-t border-slate-800 pb-safe pt-2 px-6 z-50">
          <div className="flex justify-between items-center">
            
            <NavButton 
              active={activeTab === 'fridge'} 
              onClick={() => setActiveTab('fridge')} 
              icon={Package} 
              label="Fridge" 
            />
            
            <NavButton 
              active={activeTab === 'kitchen'} 
              onClick={() => setActiveTab('kitchen')} 
              icon={ChefHat} 
              label="Cook" 
            />
            
            {/* HERO DASHBOARD BUTTON */}
            <div className="relative -top-5">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`w-14 h-14 rounded-full flex items-center justify-center border-4 border-slate-950 shadow-2xl transition-transform active:scale-95 ${
                  activeTab === 'dashboard' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}
              >
                <LayoutDashboard size={24} />
              </button>
            </div>

            <NavButton 
              active={activeTab === 'analytics'} 
              onClick={() => setActiveTab('analytics')} 
              icon={BarChart3} 
              label="Data" 
            />

            <NavButton 
              active={activeTab === 'settings'} 
              onClick={() => setActiveTab('settings')} 
              icon={GearIcon} 
              label="Settings" 
            />

          </div>
        </div>
      )}
    </div>
  );
}

function NavButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button 
      onClick={onClick} 
      className={`flex flex-col items-center gap-1 p-2 transition-colors ${
        active ? 'text-amber-500' : 'text-slate-600 hover:text-slate-400'
      }`}
    >
      <Icon size={22} strokeWidth={active ? 2.5 : 2} />
      <span className="text-[9px] font-bold uppercase tracking-wide">{label}</span>
    </button>
  );
}