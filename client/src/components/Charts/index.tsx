import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  AreaChart, Area
} from 'recharts';
import type { WeeklyKPI, TrendData, ChampionEntry } from '../../types';

const COLORS = {
  sourcer: '#3B82F6',
  rekruter: '#22C55E', 
  tac: '#8B5CF6',
  primary: '#3B82F6',
  success: '#22C55E',
  warning: '#EAB308',
  danger: '#EF4444'
};

const POSITION_COLORS: Record<string, string> = {
  Sourcer: COLORS.sourcer,
  Rekruter: COLORS.rekruter,
  TAC: COLORS.tac
};

// Trend Line Chart
export function TrendLineChart({ data }: { data: TrendData[] }) {
  const chartData = data.reduce((acc: any[], item) => {
    const weekKey = `${item.year}-W${item.week_number}`;
    let week = acc.find(w => w.week === weekKey);
    if (!week) {
      week = { week: weekKey, weekStart: item.week_start };
      acc.push(week);
    }
    week[`${item.position}_verifications`] = Number(item.total_verifications) || 0;
    week[`${item.position}_cv`] = Number(item.total_cv_added) || 0;
    week[`${item.position}_placements`] = Number(item.total_placements) || 0;
    return acc;
  }, []).sort((a, b) => a.weekStart.localeCompare(b.weekStart));

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">📈 Trend tygodniowy</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="#6B7280" />
          <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
          />
          <Legend />
          <Line type="monotone" dataKey="Sourcer_verifications" name="Sourcer - Weryfikacje" stroke={COLORS.sourcer} strokeWidth={2} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="Rekruter_cv" name="Rekruter - CV" stroke={COLORS.rekruter} strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Team Comparison Bar Chart
export function TeamComparisonChart({ data }: { data: WeeklyKPI[] }) {
  const chartData = data.map(d => ({
    name: d.name.split(' ')[0],
    position: d.position,
    verifications: d.verifications,
    cv: d.cvAdded,
    recommendations: d.recommendations,
    interviews: d.interviews,
    targetAchievement: d.targetAchievement
  }));

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Porównanie zespołu</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis type="number" tick={{ fontSize: 12 }} stroke="#6B7280" />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} stroke="#6B7280" width={80} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
          />
          <Legend />
          <Bar dataKey="verifications" name="Weryfikacje" fill={COLORS.sourcer} radius={[0, 4, 4, 0]} />
          <Bar dataKey="cv" name="CV" fill={COLORS.rekruter} radius={[0, 4, 4, 0]} />
          <Bar dataKey="recommendations" name="Rekomendacje" fill={COLORS.tac} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Placements Pie Chart
export function PlacementsPieChart({ data }: { data: WeeklyKPI[] }) {
  const pieData = [
    { name: 'Sourcer', value: data.filter(d => d.position === 'Sourcer').reduce((sum, d) => sum + d.placements, 0), color: COLORS.sourcer },
    { name: 'Rekruter', value: data.filter(d => d.position === 'Rekruter').reduce((sum, d) => sum + d.placements, 0), color: COLORS.rekruter },
    { name: 'TAC', value: data.filter(d => d.position === 'TAC').reduce((sum, d) => sum + d.placements, 0), color: COLORS.tac },
  ].filter(d => d.value > 0);

  if (pieData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🥧 Placements per stanowisko</h3>
        <div className="h-[200px] flex items-center justify-center text-gray-500">
          Brak placementów w wybranym okresie
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">🥧 Placements per stanowisko</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            label={({ name, value }) => `${name}: ${value}`}
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// Target Progress Gauge
export function TargetGauge({ value, target, label, color: _color }: { value: number; target: number; label: string; color: string }) {
  const percentage = Math.min((value / target) * 100, 150);
  const displayPercentage = Math.round(percentage);
  
  const getColor = () => {
    if (percentage >= 100) return COLORS.success;
    if (percentage >= 70) return COLORS.warning;
    return COLORS.danger;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 text-center">
      <h4 className="text-sm font-medium text-gray-600 mb-2">{label}</h4>
      <div className="relative w-32 h-16 mx-auto">
        <svg viewBox="0 0 100 50" className="w-full h-full">
          {/* Background arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Progress arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={getColor()}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${Math.min(percentage, 100) * 1.26} 126`}
          />
        </svg>
        <div className="absolute inset-0 flex items-end justify-center pb-1">
          <span className="text-2xl font-bold" style={{ color: getColor() }}>{displayPercentage}%</span>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-1">{value} / {target}</p>
    </div>
  );
}

// Performance Radar Chart
export function PerformanceRadar({ data }: { data: WeeklyKPI }) {
  const radarData = [
    { subject: 'Weryfikacje', value: data.verifications, fullMark: 30 },
    { subject: 'CV', value: data.cvAdded, fullMark: 35 },
    { subject: 'Rekomendacje', value: data.recommendations, fullMark: 10 },
    { subject: 'Interviews', value: data.interviews, fullMark: 5 },
    { subject: 'Placements', value: data.placements * 10, fullMark: 10 },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{data.name}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <RadarChart data={radarData}>
          <PolarGrid stroke="#E5E7EB" />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
          <PolarRadiusAxis tick={{ fontSize: 10 }} />
          <Radar
            name={data.name}
            dataKey="value"
            stroke={POSITION_COLORS[data.position]}
            fill={POSITION_COLORS[data.position]}
            fillOpacity={0.5}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Champions League Podium
export function ChampionsPodium({ data }: { data: ChampionEntry[] }) {
  const top3 = data.slice(0, 3);
  const podiumOrder = [1, 0, 2]; // Silver, Gold, Bronze positions

  if (top3.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🏆 Liga Mistrzów - Podium</h3>
        <div className="h-[200px] flex items-center justify-center text-gray-500">
          Brak danych
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl shadow-sm p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">🏆 Liga Mistrzów - Podium</h3>
      <div className="flex justify-center items-end gap-4 h-48">
        {podiumOrder.map((idx, displayIdx) => {
          const entry = top3[idx];
          if (!entry) return null;
          
          const heights = ['h-28', 'h-36', 'h-20'];
          const medals = ['🥈', '🥇', '🥉'];
          const bgColors = ['bg-gray-200', 'bg-yellow-300', 'bg-amber-600'];
          
          return (
            <div key={entry.employeeId} className="flex flex-col items-center">
              <span className="text-3xl mb-2">{medals[displayIdx]}</span>
              <div className="text-center mb-2">
                <p className="font-semibold text-sm">{entry.name.split(' ')[0]}</p>
                <p className="text-xs text-gray-600">{entry.totalPoints} pkt</p>
              </div>
              <div className={`${heights[displayIdx]} w-20 ${bgColors[displayIdx]} rounded-t-lg flex items-center justify-center`}>
                <span className="text-2xl font-bold text-white">{idx + 1}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Area Chart for cumulative progress
export function CumulativeChart({ data }: { data: TrendData[] }) {
  const chartData = data.reduce((acc: any[], item) => {
    const weekKey = `W${item.week_number}`;
    let week = acc.find(w => w.week === weekKey);
    if (!week) {
      week = { week: weekKey, placements: 0, interviews: 0 };
      acc.push(week);
    }
    week.placements += Number(item.total_placements) || 0;
    week.interviews += Number(item.total_interviews) || 0;
    return acc;
  }, []);

  // Calculate cumulative
  let cumPlacements = 0;
  let cumInterviews = 0;
  chartData.forEach(d => {
    cumPlacements += d.placements;
    cumInterviews += d.interviews;
    d.cumPlacements = cumPlacements;
    d.cumInterviews = cumInterviews;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">📈 Postęp kumulatywny</h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="#6B7280" />
          <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
          <Tooltip />
          <Legend />
          <Area type="monotone" dataKey="cumPlacements" name="Placements" stroke={COLORS.success} fill={COLORS.success} fillOpacity={0.3} />
          <Area type="monotone" dataKey="cumInterviews" name="Interviews" stroke={COLORS.tac} fill={COLORS.tac} fillOpacity={0.3} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
