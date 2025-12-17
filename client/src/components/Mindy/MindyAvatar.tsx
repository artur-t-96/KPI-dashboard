import { useState } from 'react';
import { getMindyResponse } from '../../services/api';
import type { MindyEmotion, MindyResponse, WeeklyKPI, MonthlyKPI } from '../../types';
import type { AllTimeVerifications } from '../../services/api';
import { RefreshCw, Sparkles, Users, TrendingUp, Calendar } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
  weeklyData?: WeeklyKPI[];
  monthlyData?: MonthlyKPI[];
  allTimeVerifications?: AllTimeVerifications[];
  viewMode?: 'week' | 'month' | 'year';
  selectedMonth?: number;
  selectedYear?: number;
}

const emotionConfig: Record<MindyEmotion, { color: string; bgColor: string; bgColorDark: string; animation: string; eyes: string }> = {
  ecstatic: { color: '#FFD700', bgColor: 'bg-yellow-50', bgColorDark: 'bg-yellow-900/20', animation: 'animate-bounce', eyes: '^_^' },
  happy: { color: '#22C55E', bgColor: 'bg-green-50', bgColorDark: 'bg-green-900/20', animation: '', eyes: '^u^' },
  satisfied: { color: '#86EFAC', bgColor: 'bg-green-50', bgColorDark: 'bg-green-900/20', animation: '', eyes: '^_^' },
  neutral: { color: '#3B82F6', bgColor: 'bg-blue-50', bgColorDark: 'bg-blue-900/20', animation: '', eyes: '• •' },
  concerned: { color: '#EAB308', bgColor: 'bg-yellow-50', bgColorDark: 'bg-yellow-900/20', animation: '', eyes: 'o o' },
  worried: { color: '#F97316', bgColor: 'bg-orange-50', bgColorDark: 'bg-orange-900/20', animation: '', eyes: '>_<' },
  sad: { color: '#EF4444', bgColor: 'bg-red-50', bgColorDark: 'bg-red-900/20', animation: '', eyes: 'T_T' },
  motivated: { color: '#8B5CF6', bgColor: 'bg-purple-50', bgColorDark: 'bg-purple-900/20', animation: '', eyes: '*_*' }
};

const MONTHS_PL = [
  '', 'Styczen', 'Luty', 'Marzec', 'Kwiecien', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpien', 'Wrzesien', 'Pazdziernik', 'Listopad', 'Grudzien'
];

export default function MindyAvatar({
  weeklyData = [],
  monthlyData = [],
  allTimeVerifications = [],
  viewMode = 'week',
  selectedMonth = new Date().getMonth() + 1,
  selectedYear = new Date().getFullYear()
}: Props) {
  const [mindyData, setMindyData] = useState<MindyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const fetchMindy = async () => {
    setLoading(true);
    try {
      const data = await getMindyResponse();
      setMindyData(data);
      setHasLoaded(true);
    } catch (error) {
      console.error('Failed to fetch Mindy data:', error);
      setMindyData({
        emotion: 'neutral',
        tip: 'Przepraszam, nie moglam pobrac danych. Sprobuj ponownie.',
        stats: { avgTargetAchievement: 0, topPerformer: '-', totalPlacements: 0, alertsCount: 0 }
      });
      setHasLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  // Calculate team stats
  const calculateTeamStats = () => {
    // Count employees by position
    const sourcers = weeklyData.filter(d => d.position === 'Sourcer');
    const recruiters = weeklyData.filter(d => d.position === 'Rekruter');
    const tacs = weeklyData.filter(d => d.position === 'TAC');

    // Current period stats
    const currentData = viewMode === 'week' ? weeklyData : monthlyData;
    const totalDaysWorked = currentData.reduce((sum, d: any) =>
      sum + (viewMode === 'week' ? d.daysWorked : d.totalDaysWorked), 0);
    const totalVerifications = currentData.reduce((sum, d: any) =>
      sum + (viewMode === 'week' ? d.verifications : d.totalVerifications), 0);
    const totalCV = currentData.reduce((sum, d: any) =>
      sum + (viewMode === 'week' ? d.cvAdded : d.totalCvAdded), 0);
    const totalPlacements = currentData.reduce((sum, d: any) =>
      sum + (viewMode === 'week' ? d.placements : d.totalPlacements), 0);
    const totalInterviews = currentData.reduce((sum, d: any) =>
      sum + (viewMode === 'week' ? d.interviews : d.totalInterviews), 0);

    // Calculate targets for current period
    // Sourcers: 4 verifications/day each
    // Recruiters: 5 CV/day each
    // Everyone: 1 placement/month
    const sourcerDays = sourcers.reduce((sum, d: any) =>
      sum + (viewMode === 'week' ? d.daysWorked : (monthlyData.find(m => m.employeeId === d.employeeId)?.totalDaysWorked || 0)), 0);
    const recruiterDays = recruiters.reduce((sum, d: any) =>
      sum + (viewMode === 'week' ? d.daysWorked : (monthlyData.find(m => m.employeeId === d.employeeId)?.totalDaysWorked || 0)), 0);

    const verificationTarget = sourcerDays * 4;
    const cvTarget = recruiterDays * 5;
    const placementTarget = weeklyData.length; // 1 per person per month

    const verificationAchievement = verificationTarget > 0 ? Math.round((totalVerifications / verificationTarget) * 100) : 0;
    const cvAchievement = cvTarget > 0 ? Math.round((totalCV / cvTarget) * 100) : 0;
    const placementAchievement = placementTarget > 0 ? Math.round((totalPlacements / placementTarget) * 100) : 0;

    // All-time stats (per working day)
    const allTimeTotalDays = allTimeVerifications.reduce((sum, d) => sum + d.totalDaysWorked, 0);
    const allTimeTotalVerifications = allTimeVerifications.reduce((sum, d) => sum + d.totalVerifications, 0);
    const allTimeTotalCV = allTimeVerifications.reduce((sum, d) => sum + d.totalCvAdded, 0);
    const allTimeVerPerDay = allTimeTotalDays > 0 ? (allTimeTotalVerifications / allTimeTotalDays).toFixed(2) : '0';
    const allTimeCVPerDay = allTimeTotalDays > 0 ? (allTimeTotalCV / allTimeTotalDays).toFixed(2) : '0';

    // Overall team target achievement
    const overallAchievement = Math.round((verificationAchievement + cvAchievement + placementAchievement) / 3);

    return {
      teamSize: weeklyData.length,
      sourcers: sourcers.length,
      recruiters: recruiters.length,
      tacs: tacs.length,
      totalDaysWorked,
      totalVerifications,
      totalCV,
      totalPlacements,
      totalInterviews,
      verificationTarget,
      cvTarget,
      placementTarget,
      verificationAchievement,
      cvAchievement,
      placementAchievement,
      overallAchievement,
      allTimeTotalDays,
      allTimeVerPerDay,
      allTimeCVPerDay
    };
  };

  const stats = calculateTeamStats();
  const emotion = mindyData?.emotion || (stats.overallAchievement >= 100 ? 'happy' : stats.overallAchievement >= 70 ? 'satisfied' : stats.overallAchievement >= 50 ? 'neutral' : 'concerned');
  const config = emotionConfig[emotion];

  // Full body robot SVG
  const MindyRobot = ({ size = 120 }: { size?: number }) => (
    <svg width={size} height={size * 1.5} viewBox="0 0 120 180" className="drop-shadow-lg">
      {/* Antenna */}
      <line x1="60" y1="12" x2="60" y2="0" stroke={config.color} strokeWidth="3" strokeLinecap="round">
        <animate attributeName="y1" values="12;8;12" dur="1.5s" repeatCount="indefinite" />
      </line>
      <circle cx="60" cy="0" r="5" fill={config.color}>
        <animate attributeName="r" values="5;7;5" dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0.6;1" dur="1.5s" repeatCount="indefinite" />
      </circle>

      {/* Head */}
      <rect x="20" y="15" width="80" height="55" rx="12" fill={config.color} />
      <rect x="24" y="19" width="72" height="47" rx="10" fill="white" />

      {/* Eyes */}
      <circle cx="42" cy="42" r="8" fill={config.color}>
        <animate attributeName="r" values="8;6;8" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="78" cy="42" r="8" fill={config.color}>
        <animate attributeName="r" values="8;6;8" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="42" cy="42" r="3" fill="white" />
      <circle cx="78" cy="42" r="3" fill="white" />

      {/* Mouth */}
      {stats.overallAchievement >= 70 ? (
        <path d="M 40 55 Q 60 68 80 55" stroke={config.color} strokeWidth="3" fill="none" strokeLinecap="round" />
      ) : stats.overallAchievement >= 50 ? (
        <line x1="42" y1="58" x2="78" y2="58" stroke={config.color} strokeWidth="3" strokeLinecap="round" />
      ) : (
        <path d="M 40 62 Q 60 52 80 62" stroke={config.color} strokeWidth="3" fill="none" strokeLinecap="round" />
      )}

      {/* Neck */}
      <rect x="50" y="70" width="20" height="12" fill={config.color} rx="2" />

      {/* Body */}
      <rect x="25" y="82" width="70" height="60" rx="10" fill={config.color} />
      <rect x="30" y="87" width="60" height="50" rx="8" fill="white" />

      {/* Body screen/display */}
      <rect x="38" y="95" width="44" height="35" rx="4" fill={config.color} opacity="0.2" />
      <text x="60" y="108" textAnchor="middle" fontSize="10" fill={config.color} fontWeight="bold">
        {stats.overallAchievement}%
      </text>
      <text x="60" y="122" textAnchor="middle" fontSize="8" fill={config.color}>
        TARGET
      </text>

      {/* Arms */}
      <rect x="5" y="85" width="18" height="45" rx="8" fill={config.color} />
      <rect x="97" y="85" width="18" height="45" rx="8" fill={config.color} />
      {/* Hands */}
      <circle cx="14" cy="135" r="10" fill={config.color} />
      <circle cx="106" cy="135" r="10" fill={config.color} />

      {/* Legs */}
      <rect x="35" y="142" width="18" height="30" rx="6" fill={config.color} />
      <rect x="67" y="142" width="18" height="30" rx="6" fill={config.color} />
      {/* Feet */}
      <rect x="30" y="168" width="28" height="12" rx="4" fill={config.color} />
      <rect x="62" y="168" width="28" height="12" rx="4" fill={config.color} />
    </svg>
  );

  // Initial state - button to trigger Mindy
  if (!hasLoaded && !loading) {
    return (
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-6 border-2 border-dashed ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
        <div className="flex items-start gap-6">
          {/* Robot */}
          <div className="flex-shrink-0 opacity-50">
            <MindyRobot size={100} />
          </div>

          {/* Content */}
          <div className="flex-1">
            <h2 className={`text-xl font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Mindy - Asystent KPI Zespolu
            </h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
              Kliknij aby zobaczyc statystyki zespolu i otrzymac analize AI
            </p>

            {/* Team composition preview */}
            <div className="flex gap-3 mb-4 flex-wrap">
              <span className={`text-xs px-3 py-1.5 rounded-full ${isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
                <Users className="w-3 h-3 inline mr-1" />
                {stats.teamSize} osob
              </span>
              <span className={`text-xs px-3 py-1.5 rounded-full ${isDark ? 'bg-cyan-900/50 text-cyan-300' : 'bg-cyan-100 text-cyan-800'}`}>
                {stats.sourcers} Sourcer
              </span>
              <span className={`text-xs px-3 py-1.5 rounded-full ${isDark ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800'}`}>
                {stats.recruiters} Rekruter
              </span>
              <span className={`text-xs px-3 py-1.5 rounded-full ${isDark ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-800'}`}>
                {stats.tacs} TAC
              </span>
            </div>

            <button
              onClick={fetchMindy}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md text-sm font-medium"
            >
              <Sparkles className="w-4 h-4" />
              Aktywuj Mindy
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-6`}>
        <div className="flex items-center gap-6">
          <div className={`w-24 h-36 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-xl animate-pulse flex items-center justify-center`}>
            <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
          </div>
          <div className="flex-1">
            <div className={`h-6 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-3/4 animate-pulse mb-3`}></div>
            <div className={`h-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-1/2 animate-pulse mb-2`}></div>
            <div className={`h-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-2/3 animate-pulse`}></div>
          </div>
        </div>
      </div>
    );
  }

  const tip = mindyData?.tip || 'Czesc! Jestem Mindy, Twoja asystentka KPI!';

  return (
    <div className={`${isDark ? config.bgColorDark : config.bgColor} rounded-2xl shadow-lg p-6 border-2`} style={{ borderColor: config.color }}>
      <div className="flex items-start gap-6">
        {/* Mindy Robot */}
        <div className={`flex-shrink-0 ${config.animation}`}>
          <MindyRobot size={100} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Mindy</h2>
            <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: config.color }}>
              {emotion === 'ecstatic' ? 'Super!' :
               emotion === 'happy' ? 'Dobrze!' :
               emotion === 'satisfied' ? 'OK' :
               emotion === 'neutral' ? 'Neutralnie' :
               emotion === 'concerned' ? 'Uwaga' :
               emotion === 'worried' ? 'Martwię się' :
               emotion === 'sad' ? 'Smutno' :
               'Zmotywowana!'}
            </span>
            <button
              onClick={fetchMindy}
              className={`ml-auto p-1.5 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-white/50'} transition-colors`}
              title="Odswież analize"
            >
              <RefreshCw className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>
          </div>

          {/* AI Tip */}
          <div className={`${isDark ? 'bg-gray-700/50' : 'bg-white/70'} rounded-xl p-3 mb-4 shadow-sm`}>
            <p className={`${isDark ? 'text-gray-200' : 'text-gray-700'} text-sm leading-relaxed`}>{tip}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* All-Time Stats (per working day) */}
            <div className={`${isDark ? 'bg-gray-700/50' : 'bg-white/70'} rounded-xl p-3`}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                <span className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Od poczatku (per dzien)
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Weryfikacje:</span>
                  <span className={`text-sm font-bold ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
                    {stats.allTimeVerPerDay}/dzien
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>CV dodane:</span>
                  <span className={`text-sm font-bold ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                    {stats.allTimeCVPerDay}/dzien
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Dni pracy:</span>
                  <span className={`text-sm font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {stats.allTimeTotalDays}
                  </span>
                </div>
              </div>
            </div>

            {/* Current Period Stats */}
            <div className={`${isDark ? 'bg-gray-700/50' : 'bg-white/70'} rounded-xl p-3`}>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                <span className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {viewMode === 'week' ? 'Ten tydzien' : `${MONTHS_PL[selectedMonth]} ${selectedYear}`}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Weryfikacje:</span>
                  <span className={`text-sm font-bold ${stats.verificationAchievement >= 100 ? 'text-green-500' : stats.verificationAchievement >= 70 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {stats.totalVerifications}/{stats.verificationTarget} ({stats.verificationAchievement}%)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>CV:</span>
                  <span className={`text-sm font-bold ${stats.cvAchievement >= 100 ? 'text-green-500' : stats.cvAchievement >= 70 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {stats.totalCV}/{stats.cvTarget} ({stats.cvAchievement}%)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Placements:</span>
                  <span className={`text-sm font-bold ${stats.placementAchievement >= 100 ? 'text-green-500' : stats.placementAchievement >= 70 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {stats.totalPlacements}/{stats.placementTarget} ({stats.placementAchievement}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Team composition badges */}
          <div className="flex gap-2 mt-3 flex-wrap">
            <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
              <Users className="w-3 h-3 inline mr-1" />
              {stats.teamSize} osob
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-cyan-900/50 text-cyan-300' : 'bg-cyan-100 text-cyan-800'}`}>
              {stats.sourcers}x Sourcer (target: {stats.sourcers * 4} wer./dz.)
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800'}`}>
              {stats.recruiters}x Rekruter (target: {stats.recruiters * 5} CV/dz.)
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-800'}`}>
              Interviews: {stats.totalInterviews}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
