import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type UserProfile } from "../db";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, Calendar, Activity, CheckCircle, Flame } from "lucide-react";
import { 
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell,
  AreaChart, Area
} from "recharts";
import { 
  format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, 
  startOfYear, endOfYear, eachMonthOfInterval, isSameDay, isSameMonth 
} from "date-fns";

export default function DataLab({ profile, onBack }: { profile: UserProfile, onBack: () => void }) {
  const [view, setView] = useState<'week' | 'month' | 'year'>('week');

  const today = new Date();
  let dateRange: Date[] = [];
  let formatStr = 'EEE'; 

  if (view === 'week') {
    dateRange = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));
  } else if (view === 'month') {
    dateRange = eachDayOfInterval({ start: startOfMonth(today), end: endOfMonth(today) });
    formatStr = 'd'; 
  } else if (view === 'year') {
    dateRange = eachMonthOfInterval({ start: startOfYear(today), end: endOfYear(today) });
    formatStr = 'MMM'; 
  }

  const allLogs = useLiveQuery(() => db.logs.toArray());

  const chartData = dateRange.map(date => {
    let matchLogs = [];
    if (view === 'year') {
      matchLogs = allLogs?.filter(l => isSameMonth(new Date(l.date), date)) || [];
    } else {
      matchLogs = allLogs?.filter(l => isSameDay(new Date(l.date), date)) || [];
    }

    const cals = matchLogs.reduce((sum, l) => sum + l.calories, 0);
    const prot = matchLogs.reduce((sum, l) => sum + l.protein, 0);

    const displayCals = view === 'year' ? Math.round(cals / (matchLogs.length || 1)) : cals;
    const displayProt = view === 'year' ? Math.round(prot / (matchLogs.length || 1)) : prot;

    return {
      label: format(date, formatStr),
      cals: displayCals,
      prot: displayProt,
      fullDate: format(date, 'yyyy-MM-dd')
    };
  });

  // --- DYNAMIC CONSISTENCY LOGIC ---
  const activeDays = chartData.filter(d => d.cals > 0);
  const totalInPeriod = activeDays.length;
  
  const calSuccess = activeDays.filter(d => {
    if (profile.goal === 'maintain') {
      // Success if: Ceiling is target, Floor is -200
      return d.cals <= profile.targetCalories && d.cals >= (profile.targetCalories - 200);
    }
    if (profile.goal === 'gain') {
      // Success if: Floor is target, Ceiling is +200
      return d.cals >= profile.targetCalories && d.cals <= (profile.targetCalories + 200);
    }
    if (profile.goal === 'lose') {
      // Success if: Anything at or below target
      return d.cals <= profile.targetCalories;
    }
    return false;
  }).length;

  const protSuccess = activeDays.filter(d => d.prot >= profile.targetProtein).length;

  // Dynamic Labels for the UI
  const dynamicCalLabel = 
    profile.goal === 'maintain' ? "Days within -200 range" :
    profile.goal === 'gain' ? "Days within +200 surplus" :
    "Days under deficit budget";

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl">
          <p className="text-slate-300 text-xs mb-1">{label}</p>
          <div className="flex flex-col gap-1">
            <span className="text-amber-500 font-bold text-xs">{payload[0].payload.cals} kcal</span>
            <span className="text-teal-400 font-bold text-xs">{payload[0].payload.prot}g Protein</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const sharedXAxisProps = {
    dataKey: "label",
    axisLine: false,
    tickLine: false,
    tick: { fill: '#64748b', fontSize: 10 },
    dy: 10,
    padding: { left: 20, right: 20 },
    interval: view === 'month' ? 5 : 0
  };

  return (
    <motion.div initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="min-h-screen bg-slate-950 p-4">
      
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 bg-slate-900 rounded-full border border-slate-800 text-slate-400">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <TrendingUp size={20} className="text-amber-500" /> DataLab
        </h1>
      </div>

      <div className="flex bg-slate-900 p-1 rounded-xl mb-6 border border-slate-800">
        {(['week', 'month', 'year'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 py-2 text-xs uppercase font-bold rounded-lg transition-all ${
              view === v ? 'bg-slate-800 text-white shadow' : 'text-slate-500'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {/* DYNAMIC SCORECARD */}
      <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 mb-6">
         <h3 className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-4">Consistency Scorecard</h3>
         <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
               <div className="flex items-center gap-2 mb-2 text-amber-500">
                  <Flame size={16} />
                  <span className="text-[10px] font-bold uppercase">Calorie Range</span>
               </div>
               <p className="text-2xl font-bold text-white">{calSuccess}<span className="text-slate-700 mx-1">/</span>{totalInPeriod}</p>
               <p className="text-[9px] text-slate-500 mt-1 leading-tight">{dynamicCalLabel}</p>
            </div>

            <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
               <div className="flex items-center gap-2 mb-2 text-teal-500">
                  <CheckCircle size={16} />
                  <span className="text-[10px] font-bold uppercase">Protein Goal</span>
               </div>
               <p className="text-2xl font-bold text-white">{protSuccess}<span className="text-slate-700 mx-1">/</span>{totalInPeriod}</p>
               <p className="text-[9px] text-slate-500 mt-1">Days target met</p>
            </div>
         </div>
      </div>

      {/* CHART 1: CALORIES */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl mb-6">
        <div className="flex justify-between items-center mb-6">
           <h3 className="text-slate-400 text-xs uppercase font-bold tracking-wider">Calorie History</h3>
           <span className="text-amber-500 text-xs font-mono font-bold">{profile.targetCalories} kcal</span>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ right: 10, left: 10 }}>
              <XAxis {...sharedXAxisProps} />
              <Tooltip cursor={{fill: '#1e293b'}} content={<CustomTooltip />} />
              <ReferenceLine y={profile.targetCalories} stroke="#f59e0b" strokeDasharray="3 3" opacity={0.5} />
              <Bar dataKey="cals" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.cals > profile.targetCalories ? '#ef4444' : '#f59e0b'} 
                    opacity={entry.cals === 0 ? 0.1 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CHART 2: PROTEIN */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl mb-6">
        <div className="flex justify-between items-center mb-6">
           <h3 className="text-slate-400 text-xs uppercase font-bold tracking-wider">Protein Trend</h3>
           <span className="text-teal-400 text-xs font-mono font-bold">{profile.targetProtein}g</span>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ right: 10, left: 10 }}>
              <defs>
                <linearGradient id="colorProt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis {...sharedXAxisProps} scale="point" />
              <Tooltip cursor={{fill: '#1e293b'}} content={<CustomTooltip />} />
              <ReferenceLine y={profile.targetProtein} stroke="#14b8a6" strokeDasharray="3 3" opacity={0.5} />
              <Area 
                type="monotone" 
                dataKey="prot" 
                stroke="#14b8a6" 
                fillOpacity={1} 
                fill="url(#colorProt)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
         <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
            <Calendar className="text-slate-400 mb-2" size={20} />
            <p className="text-slate-500 text-xs">Total Logs</p>
            <p className="text-2xl font-bold text-white">{allLogs?.length || 0}</p>
         </div>
         <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
            <Activity className="text-teal-500 mb-2" size={20} />
            <p className="text-slate-500 text-xs">Avg Protein</p>
            <p className="text-2xl font-bold text-white">
              {allLogs && allLogs.length > 0 
                ? Math.round(allLogs.reduce((a,b) => a + b.protein, 0) / allLogs.length) 
                : 0}g
            </p>
         </div>
      </div>
    </motion.div>
  );
}