import { useState } from 'react';
import { getMindyResponse } from '../../services/api';
import type { MindyEmotion, WeeklyKPI, MonthlyKPI } from '../../types';
import type { AllTimeVerifications, AllTimePlacement } from '../../services/api';
import { Sparkles, Users, TrendingUp, Calendar, MessageCircle, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
  weeklyData?: WeeklyKPI[];
  monthlyData?: MonthlyKPI[];
  allTimeVerifications?: AllTimeVerifications[];
  allTimePlacements?: AllTimePlacement[];
  viewMode?: 'week' | 'month' | 'year';
  selectedMonth?: number;
  selectedYear?: number;
}

const emotionConfig: Record<MindyEmotion, { color: string; bgColor: string; bgColorDark: string; animation: string }> = {
  ecstatic: { color: '#FFD700', bgColor: 'bg-yellow-50', bgColorDark: 'bg-yellow-900/20', animation: 'animate-bounce' },
  happy: { color: '#22C55E', bgColor: 'bg-green-50', bgColorDark: 'bg-green-900/20', animation: '' },
  satisfied: { color: '#86EFAC', bgColor: 'bg-green-50', bgColorDark: 'bg-green-900/20', animation: '' },
  neutral: { color: '#3B82F6', bgColor: 'bg-blue-50', bgColorDark: 'bg-blue-900/20', animation: '' },
  concerned: { color: '#EAB308', bgColor: 'bg-yellow-50', bgColorDark: 'bg-yellow-900/20', animation: '' },
  worried: { color: '#F97316', bgColor: 'bg-orange-50', bgColorDark: 'bg-orange-900/20', animation: '' },
  sad: { color: '#EF4444', bgColor: 'bg-red-50', bgColorDark: 'bg-red-900/20', animation: '' },
  motivated: { color: '#8B5CF6', bgColor: 'bg-purple-50', bgColorDark: 'bg-purple-900/20', animation: '' }
};

const MONTHS_PL = [
  '', 'Styczen', 'Luty', 'Marzec', 'Kwiecien', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpien', 'Wrzesien', 'Pazdziernik', 'Listopad', 'Grudzien'
];

export default function MindyAvatar({
  weeklyData = [],
  monthlyData = [],
  allTimeVerifications = [],
  allTimePlacements = [],
  viewMode = 'week',
  selectedMonth = new Date().getMonth() + 1,
  selectedYear = new Date().getFullYear()
}: Props) {
  const [mindyTip, setMindyTip] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const fetchMindyTip = async () => {
    setLoading(true);
    setShowTip(true);
    try {
      const data = await getMindyResponse();
      setMindyTip(data.tip);
    } catch (error) {
      console.error('Failed to fetch Mindy tip:', error);
      setMindyTip('Przepraszam, nie moglam pobrac rady. Sprobuj ponownie.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate team stats
  const calculateTeamStats = () => {
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

    // Targets
    const sourcerDays = sourcers.reduce((sum, d: any) =>
      sum + (viewMode === 'week' ? d.daysWorked : (monthlyData.find(m => m.employeeId === d.employeeId)?.totalDaysWorked || 0)), 0);
    const recruiterDays = recruiters.reduce((sum, d: any) =>
      sum + (viewMode === 'week' ? d.daysWorked : (monthlyData.find(m => m.employeeId === d.employeeId)?.totalDaysWorked || 0)), 0);

    const verificationTarget = sourcerDays * 4;
    const cvTarget = recruiterDays * 5;
    const placementTarget = weeklyData.length;

    const verificationAchievement = verificationTarget > 0 ? Math.round((totalVerifications / verificationTarget) * 100) : 0;
    const cvAchievement = cvTarget > 0 ? Math.round((totalCV / cvTarget) * 100) : 0;
    const placementAchievement = placementTarget > 0 ? Math.round((totalPlacements / placementTarget) * 100) : 0;

    // All-time stats
    const allTimeTotalDays = allTimeVerifications.reduce((sum, d) => sum + d.totalDaysWorked, 0);
    const allTimeTotalVerifications = allTimeVerifications.reduce((sum, d) => sum + d.totalVerifications, 0);
    const allTimeTotalCV = allTimeVerifications.reduce((sum, d) => sum + d.totalCvAdded, 0);
    const allTimeVerPerDay = allTimeTotalDays > 0 ? (allTimeTotalVerifications / allTimeTotalDays).toFixed(2) : '0';
    const allTimeCVPerDay = allTimeTotalDays > 0 ? (allTimeTotalCV / allTimeTotalDays).toFixed(2) : '0';

    // All-time placements stats
    const allTimeTotalPlacements = allTimePlacements.reduce((sum, d) => sum + d.total_placements, 0);
    // Calculate months worked from first_week to last_week
    let allTimeMonths = 1;
    if (allTimePlacements.length > 0) {
      const allFirstWeeks = allTimePlacements.map(d => new Date(d.first_week).getTime()).filter(t => !isNaN(t));
      const allLastWeeks = allTimePlacements.map(d => new Date(d.last_week).getTime()).filter(t => !isNaN(t));
      if (allFirstWeeks.length > 0 && allLastWeeks.length > 0) {
        const earliestDate = new Date(Math.min(...allFirstWeeks));
        const latestDate = new Date(Math.max(...allLastWeeks));
        allTimeMonths = Math.max(1, Math.ceil((latestDate.getTime() - earliestDate.getTime()) / (30 * 24 * 60 * 60 * 1000)));
      }
    }
    const allTimePlacementsPerMonth = allTimeMonths > 0 ? (allTimeTotalPlacements / allTimeMonths).toFixed(2) : '0';
    const allTimePlacementTarget = weeklyData.length; // 1 per person per month

    // Team-wide verifications per placement
    const teamVerificationsPerPlacement = allTimeTotalPlacements > 0
      ? (allTimeTotalVerifications / allTimeTotalPlacements).toFixed(1)
      : '∞';

    // All-time interviews
    const allTimeTotalInterviews = allTimePlacements.reduce((sum, d) => sum + d.total_interviews, 0);
    const teamInterviewsPerPlacement = allTimeTotalPlacements > 0
      ? (allTimeTotalInterviews / allTimeTotalPlacements).toFixed(1)
      : '∞';

    const overallAchievement = Math.round((verificationAchievement + cvAchievement + placementAchievement) / 3);

    // Average per person for current period
    const teamSizeForAvg = currentData.length || 1;
    const avgVerificationsPerPerson = (totalVerifications / teamSizeForAvg).toFixed(1);
    const avgCVPerPerson = (totalCV / teamSizeForAvg).toFixed(1);
    const avgPlacementsPerPerson = (totalPlacements / teamSizeForAvg).toFixed(2);
    const avgInterviewsPerPerson = (totalInterviews / teamSizeForAvg).toFixed(2);

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
      avgVerificationsPerPerson,
      avgCVPerPerson,
      avgPlacementsPerPerson,
      avgInterviewsPerPerson,
      allTimeTotalDays,
      allTimeVerPerDay,
      allTimeCVPerDay,
      allTimeTotalPlacements,
      allTimeTotalVerifications,
      allTimeTotalInterviews,
      allTimePlacementsPerMonth,
      allTimePlacementTarget,
      teamVerificationsPerPlacement,
      teamInterviewsPerPlacement
    };
  };

  const stats = calculateTeamStats();
  const emotion: MindyEmotion = stats.overallAchievement >= 100 ? 'happy' : stats.overallAchievement >= 70 ? 'satisfied' : stats.overallAchievement >= 50 ? 'neutral' : 'concerned';
  const config = emotionConfig[emotion];

  // Full body robot SVG
  const MindyRobot = ({ size = 100 }: { size?: number }) => (
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
      <circle cx="14" cy="135" r="10" fill={config.color} />
      <circle cx="106" cy="135" r="10" fill={config.color} />

      {/* Legs */}
      <rect x="35" y="142" width="18" height="30" rx="6" fill={config.color} />
      <rect x="67" y="142" width="18" height="30" rx="6" fill={config.color} />
      <rect x="30" y="168" width="28" height="12" rx="4" fill={config.color} />
      <rect x="62" y="168" width="28" height="12" rx="4" fill={config.color} />
    </svg>
  );

  return (
    <div className={`${isDark ? config.bgColorDark : config.bgColor} rounded-2xl shadow-lg p-6 border-2`} style={{ borderColor: config.color }}>
      <div className="flex items-start gap-6">
        {/* Mindy Robot */}
        <div className={`flex-shrink-0 ${config.animation}`}>
          <MindyRobot size={90} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Mindy - Statystyki Zespolu</h2>
            <button
              onClick={fetchMindyTip}
              disabled={loading}
              className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                loading
                  ? 'bg-gray-300 text-gray-500 cursor-wait'
                  : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 shadow-sm'
              }`}
              title="Poproś Mindy o radę"
            >
              <MessageCircle className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
              {loading ? 'Myślę...' : 'Porada AI'}
            </button>
          </div>

          {/* AI Tip (shown when requested) */}
          {showTip && (
            <div className={`${isDark ? 'bg-purple-900/30 border-purple-500' : 'bg-purple-50 border-purple-300'} border rounded-xl p-3 mb-4 relative`}>
              <button
                onClick={() => setShowTip(false)}
                className={`absolute top-2 right-2 p-1 rounded-full ${isDark ? 'hover:bg-purple-800' : 'hover:bg-purple-100'}`}
              >
                <X className={`w-4 h-4 ${isDark ? 'text-purple-300' : 'text-purple-600'}`} />
              </button>
              <div className="flex items-start gap-2 pr-6">
                <Sparkles className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDark ? 'text-purple-300' : 'text-purple-600'}`} />
                <p className={`${isDark ? 'text-purple-200' : 'text-purple-800'} text-sm leading-relaxed`}>
                  {loading ? 'Analizuję dane zespołu...' : mindyTip}
                </p>
              </div>
            </div>
          )}

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
                  <div className="text-right">
                    <span className={`text-sm font-bold ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
                      {stats.allTimeVerPerDay}/dzien
                    </span>
                    <span className={`text-xs ml-1 ${Number(stats.allTimeVerPerDay) >= 4 ? 'text-green-500' : 'text-orange-500'}`}>
                      (cel: 4)
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>CV dodane:</span>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                      {stats.allTimeCVPerDay}/dzien
                    </span>
                    <span className={`text-xs ml-1 ${Number(stats.allTimeCVPerDay) >= 5 ? 'text-green-500' : 'text-orange-500'}`}>
                      (cel: 5)
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Placements:</span>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                      {stats.allTimePlacementsPerMonth}/mies.
                    </span>
                    <span className={`text-xs ml-1 ${Number(stats.allTimePlacementsPerMonth) >= stats.allTimePlacementTarget ? 'text-green-500' : 'text-orange-500'}`}>
                      (cel: {stats.allTimePlacementTarget})
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Dni pracy:</span>
                  <span className={`text-sm font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {stats.allTimeTotalDays}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-gray-200 dark:border-gray-600 mt-1">
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Wer./Plac.:</span>
                  <span className={`text-sm font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                    {stats.teamVerificationsPerPlacement}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Int./Plac.:</span>
                  <span className={`text-sm font-bold ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
                    {stats.teamInterviewsPerPlacement}
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
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${stats.verificationAchievement >= 100 ? 'text-green-500' : stats.verificationAchievement >= 70 ? 'text-yellow-500' : 'text-red-500'}`}>
                      {stats.totalVerifications}/{stats.verificationTarget} ({stats.verificationAchievement}%)
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                      sr. {stats.avgVerificationsPerPerson}/os.
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>CV:</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${stats.cvAchievement >= 100 ? 'text-green-500' : stats.cvAchievement >= 70 ? 'text-yellow-500' : 'text-red-500'}`}>
                      {stats.totalCV}/{stats.cvTarget} ({stats.cvAchievement}%)
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${isDark ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
                      sr. {stats.avgCVPerPerson}/os.
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Placements:</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${stats.placementAchievement >= 100 ? 'text-green-500' : stats.placementAchievement >= 70 ? 'text-yellow-500' : 'text-red-500'}`}>
                      {stats.totalPlacements}/{stats.placementTarget} ({stats.placementAchievement}%)
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${isDark ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700'}`}>
                      sr. {stats.avgPlacementsPerPerson}/os.
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Interviews:</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                      {stats.totalInterviews}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${isDark ? 'bg-orange-900/50 text-orange-300' : 'bg-orange-100 text-orange-700'}`}>
                      sr. {stats.avgInterviewsPerPerson}/os.
                    </span>
                  </div>
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
              {stats.sourcers}x Sourcer (4 wer./dz.)
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800'}`}>
              {stats.recruiters}x Rekruter (5 CV/dz.)
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
