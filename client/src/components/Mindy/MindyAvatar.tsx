import { useState } from 'react';
import { getMindyResponse } from '../../services/api';
import type { WeeklyKPI, MonthlyKPI } from '../../types';
import type { AllTimeVerifications, AllTimePlacement } from '../../services/api';
import { Sparkles, Users, TrendingUp, Calendar, MessageCircle, X, AlertTriangle, CheckCircle2, Zap, Brain, Target, Trophy } from 'lucide-react';
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

    const allTimeTotalDays = allTimeVerifications.reduce((sum, d) => sum + d.totalDaysWorked, 0);
    const allTimeTotalVerifications = allTimeVerifications.reduce((sum, d) => sum + d.totalVerifications, 0);
    const allTimeTotalCV = allTimeVerifications.reduce((sum, d) => sum + d.totalCvAdded, 0);
    const allTimeVerPerDay = allTimeTotalDays > 0 ? (allTimeTotalVerifications / allTimeTotalDays).toFixed(2) : '0';
    const allTimeCVPerDay = allTimeTotalDays > 0 ? (allTimeTotalCV / allTimeTotalDays).toFixed(2) : '0';

    const allTimeTotalPlacements = allTimePlacements.reduce((sum, d) => sum + d.total_placements, 0);
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
    const allTimePlacementTarget = weeklyData.length;

    const teamVerificationsPerPlacement = allTimeTotalPlacements > 0
      ? (allTimeTotalVerifications / allTimeTotalPlacements).toFixed(1)
      : '∞';

    const allTimeTotalInterviews = allTimePlacements.reduce((sum, d) => sum + d.total_interviews, 0);
    const teamInterviewsPerPlacement = allTimeTotalPlacements > 0
      ? (allTimeTotalInterviews / allTimeTotalPlacements).toFixed(1)
      : '∞';

    const overallAchievement = Math.round((verificationAchievement + cvAchievement + placementAchievement) / 3);

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

  // Determine status for each body part
  const verificationOk = stats.verificationAchievement >= 70;
  const cvOk = stats.cvAchievement >= 70;
  const placementOk = stats.placementAchievement >= 70;

  const getStatusColor = (ok: boolean) => ok ? '#10B981' : '#EF4444';

  // Futuristic Mindy Robot
  const MindyRobot = () => (
    <div className="relative">
      <svg width="200" height="280" viewBox="0 0 200 280" className="drop-shadow-2xl">
        <defs>
          {/* Gradients */}
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1F2937" />
            <stop offset="50%" stopColor="#374151" />
            <stop offset="100%" stopColor="#1F2937" />
          </linearGradient>
          <linearGradient id="screenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>
          <linearGradient id="glowGreen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="glowRed" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#DC2626" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="strongGlow">
            <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Antenna with pulse */}
        <g filter="url(#glow)">
          <line x1="100" y1="25" x2="100" y2="5" stroke={getStatusColor(verificationOk)} strokeWidth="4" strokeLinecap="round">
            <animate attributeName="y2" values="5;0;5" dur="2s" repeatCount="indefinite" />
          </line>
          <circle cx="100" cy="5" r="8" fill={getStatusColor(verificationOk)}>
            <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* HEAD - Verifications indicator */}
        <g>
          {/* Head outer shell */}
          <rect x="45" y="25" width="110" height="80" rx="20" fill="url(#bodyGradient)" stroke={getStatusColor(verificationOk)} strokeWidth="3">
            {!verificationOk && <animate attributeName="stroke-opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />}
          </rect>

          {/* Face screen */}
          <rect x="55" y="35" width="90" height="60" rx="12" fill="url(#screenGradient)" />

          {/* Eyes */}
          <g filter="url(#glow)">
            <circle cx="75" cy="60" r="12" fill={getStatusColor(verificationOk)}>
              <animate attributeName="r" values="12;10;12" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="125" cy="60" r="12" fill={getStatusColor(verificationOk)}>
              <animate attributeName="r" values="12;10;12" dur="3s" repeatCount="indefinite" />
            </circle>
            {/* Eye highlights */}
            <circle cx="72" cy="57" r="4" fill="white" opacity="0.8" />
            <circle cx="122" cy="57" r="4" fill="white" opacity="0.8" />
          </g>

          {/* Mouth - changes based on overall status */}
          {stats.overallAchievement >= 70 ? (
            <path d="M 70 80 Q 100 95 130 80" stroke={getStatusColor(true)} strokeWidth="4" fill="none" strokeLinecap="round" filter="url(#glow)" />
          ) : (
            <path d="M 70 88 Q 100 75 130 88" stroke={getStatusColor(false)} strokeWidth="4" fill="none" strokeLinecap="round" filter="url(#glow)">
              <animate attributeName="d" values="M 70 88 Q 100 75 130 88;M 70 85 Q 100 78 130 85;M 70 88 Q 100 75 130 88" dur="2s" repeatCount="indefinite" />
            </path>
          )}

          {/* Brain indicator (verification) */}
          {!verificationOk && (
            <g>
              <circle cx="155" cy="35" r="12" fill="#EF4444" filter="url(#strongGlow)">
                <animate attributeName="opacity" values="1;0.5;1" dur="0.5s" repeatCount="indefinite" />
              </circle>
              <text x="155" y="40" textAnchor="middle" fontSize="14" fill="white" fontWeight="bold">!</text>
            </g>
          )}
        </g>

        {/* NECK */}
        <rect x="85" y="105" width="30" height="20" rx="5" fill="url(#bodyGradient)" />
        <rect x="90" y="108" width="20" height="14" rx="3" fill="#0F172A" />

        {/* BODY / TORSO */}
        <g>
          <rect x="40" y="125" width="120" height="95" rx="15" fill="url(#bodyGradient)" stroke="#4B5563" strokeWidth="2" />

          {/* Chest screen */}
          <rect x="55" y="135" width="90" height="75" rx="10" fill="url(#screenGradient)" />

          {/* Overall achievement display */}
          <text x="100" y="165" textAnchor="middle" fontSize="28" fill={stats.overallAchievement >= 70 ? '#10B981' : '#EF4444'} fontWeight="bold" filter="url(#glow)">
            {stats.overallAchievement}%
          </text>
          <text x="100" y="185" textAnchor="middle" fontSize="12" fill="#9CA3AF">OVERALL</text>

          {/* Status indicators on chest */}
          <g transform="translate(60, 195)">
            <circle cx="0" cy="0" r="6" fill={getStatusColor(verificationOk)} filter="url(#glow)" />
            <text x="0" y="15" textAnchor="middle" fontSize="8" fill="#9CA3AF">WER</text>
          </g>
          <g transform="translate(100, 195)">
            <circle cx="0" cy="0" r="6" fill={getStatusColor(cvOk)} filter="url(#glow)" />
            <text x="0" y="15" textAnchor="middle" fontSize="8" fill="#9CA3AF">CV</text>
          </g>
          <g transform="translate(140, 195)">
            <circle cx="0" cy="0" r="6" fill={getStatusColor(placementOk)} filter="url(#glow)" />
            <text x="0" y="15" textAnchor="middle" fontSize="8" fill="#9CA3AF">PLAC</text>
          </g>
        </g>

        {/* ARMS - CV indicator */}
        <g>
          {/* Left Arm */}
          <rect x="10" y="130" width="28" height="70" rx="10" fill="url(#bodyGradient)" stroke={getStatusColor(cvOk)} strokeWidth="2">
            {!cvOk && <animate attributeName="stroke-opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />}
          </rect>
          <circle cx="24" cy="210" r="16" fill="url(#bodyGradient)" stroke={getStatusColor(cvOk)} strokeWidth="2" />
          {!cvOk && (
            <circle cx="24" cy="130" r="10" fill="#EF4444" filter="url(#strongGlow)">
              <animate attributeName="opacity" values="1;0.5;1" dur="0.5s" repeatCount="indefinite" />
            </circle>
          )}

          {/* Right Arm */}
          <rect x="162" y="130" width="28" height="70" rx="10" fill="url(#bodyGradient)" stroke={getStatusColor(cvOk)} strokeWidth="2">
            {!cvOk && <animate attributeName="stroke-opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />}
          </rect>
          <circle cx="176" cy="210" r="16" fill="url(#bodyGradient)" stroke={getStatusColor(cvOk)} strokeWidth="2" />
          {!cvOk && (
            <circle cx="176" cy="130" r="10" fill="#EF4444" filter="url(#strongGlow)">
              <animate attributeName="opacity" values="1;0.5;1" dur="0.5s" repeatCount="indefinite" />
            </circle>
          )}
        </g>

        {/* LEGS - Placements indicator */}
        <g>
          {/* Left Leg */}
          <rect x="55" y="220" width="30" height="45" rx="8" fill="url(#bodyGradient)" stroke={getStatusColor(placementOk)} strokeWidth="2">
            {!placementOk && <animate attributeName="stroke-opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />}
          </rect>
          <rect x="50" y="260" width="40" height="18" rx="6" fill="url(#bodyGradient)" stroke={getStatusColor(placementOk)} strokeWidth="2" />

          {/* Right Leg */}
          <rect x="115" y="220" width="30" height="45" rx="8" fill="url(#bodyGradient)" stroke={getStatusColor(placementOk)} strokeWidth="2">
            {!placementOk && <animate attributeName="stroke-opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />}
          </rect>
          <rect x="110" y="260" width="40" height="18" rx="6" fill="url(#bodyGradient)" stroke={getStatusColor(placementOk)} strokeWidth="2" />

          {!placementOk && (
            <g>
              <circle cx="70" cy="240" r="10" fill="#EF4444" filter="url(#strongGlow)">
                <animate attributeName="opacity" values="1;0.5;1" dur="0.5s" repeatCount="indefinite" />
              </circle>
              <circle cx="130" cy="240" r="10" fill="#EF4444" filter="url(#strongGlow)">
                <animate attributeName="opacity" values="1;0.5;1" dur="0.5s" repeatCount="indefinite" />
              </circle>
            </g>
          )}
        </g>

        {/* Energy core glow */}
        <circle cx="100" cy="175" r="30" fill="none" stroke={stats.overallAchievement >= 70 ? '#10B981' : '#EF4444'} strokeWidth="1" opacity="0.3">
          <animate attributeName="r" values="30;40;30" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>

      {/* Status labels */}
      <div className="absolute -right-2 top-8 flex flex-col gap-1">
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${verificationOk ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          <Brain className="w-3 h-3" />
          WER
        </div>
      </div>
      <div className="absolute -left-2 top-32 flex flex-col gap-1">
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${cvOk ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          <Target className="w-3 h-3" />
          CV
        </div>
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 bottom-0 flex gap-1">
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${placementOk ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          <Trophy className="w-3 h-3" />
          PLAC
        </div>
      </div>
    </div>
  );

  // Status card component
  const StatusCard = ({
    title,
    icon: Icon,
    value,
    target,
    achievement,
    avg,
    color
  }: {
    title: string;
    icon: any;
    value: number;
    target: number;
    achievement: number;
    avg: string;
    color: string;
  }) => {
    const isOk = achievement >= 70;
    return (
      <div className={`relative overflow-hidden rounded-xl p-4 ${isDark ? 'bg-gray-800/50' : 'bg-white'} border-2 transition-all ${isOk ? 'border-green-500/30' : 'border-red-500/50'}`}>
        {!isOk && (
          <div className="absolute inset-0 bg-red-500/5 animate-pulse" />
        )}
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${isOk ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                <Icon className={`w-5 h-5 ${isOk ? 'text-green-500' : 'text-red-500'}`} />
              </div>
              <span className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{title}</span>
            </div>
            {isOk ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
            )}
          </div>
          <div className="flex items-end justify-between">
            <div>
              <span className={`text-3xl font-bold ${color}`}>{value}</span>
              <span className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>/{target}</span>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${isOk ? 'text-green-500' : 'text-red-500'}`}>
                {achievement}%
              </div>
              <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                sr. {avg}/os.
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isOk ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-gradient-to-r from-red-400 to-red-600'}`}
              style={{ width: `${Math.min(achievement, 100)}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`rounded-2xl shadow-xl overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 to-gray-100'}`}>
      {/* Header */}
      <div className={`px-6 py-4 ${isDark ? 'bg-gray-800' : 'bg-gradient-to-r from-indigo-600 to-purple-600'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">MINDY</h2>
              <p className="text-sm text-white/70">System Monitoringu KPI</p>
            </div>
          </div>
          <button
            onClick={fetchMindyTip}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              loading
                ? 'bg-white/20 text-white/50 cursor-wait'
                : 'bg-white text-indigo-600 hover:bg-white/90 shadow-lg'
            }`}
          >
            <MessageCircle className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
            {loading ? 'Analizuje...' : 'Porada AI'}
          </button>
        </div>
      </div>

      {/* AI Tip */}
      {showTip && (
        <div className={`mx-6 mt-4 ${isDark ? 'bg-purple-900/30 border-purple-500' : 'bg-purple-50 border-purple-300'} border rounded-xl p-4 relative`}>
          <button
            onClick={() => setShowTip(false)}
            className={`absolute top-2 right-2 p-1 rounded-full ${isDark ? 'hover:bg-purple-800' : 'hover:bg-purple-100'}`}
          >
            <X className={`w-4 h-4 ${isDark ? 'text-purple-300' : 'text-purple-600'}`} />
          </button>
          <div className="flex items-start gap-3 pr-6">
            <Sparkles className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isDark ? 'text-purple-300' : 'text-purple-600'}`} />
            <p className={`${isDark ? 'text-purple-200' : 'text-purple-800'} text-sm leading-relaxed`}>
              {loading ? 'Analizuję dane zespołu...' : mindyTip}
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-6">
        <div className="flex gap-8">
          {/* Mindy Robot */}
          <div className="flex-shrink-0">
            <MindyRobot />
          </div>

          {/* Stats Panel */}
          <div className="flex-1 space-y-4">
            {/* Period selector label */}
            <div className="flex items-center gap-2 mb-2">
              <Calendar className={`w-5 h-5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
              <span className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                {viewMode === 'week' ? 'Ten tydzien' : `${MONTHS_PL[selectedMonth]} ${selectedYear}`}
              </span>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 gap-3">
              <StatusCard
                title="Weryfikacje"
                icon={Brain}
                value={stats.totalVerifications}
                target={stats.verificationTarget}
                achievement={stats.verificationAchievement}
                avg={stats.avgVerificationsPerPerson}
                color={isDark ? 'text-cyan-400' : 'text-cyan-600'}
              />
              <StatusCard
                title="CV Dodane"
                icon={Target}
                value={stats.totalCV}
                target={stats.cvTarget}
                achievement={stats.cvAchievement}
                avg={stats.avgCVPerPerson}
                color={isDark ? 'text-purple-400' : 'text-purple-600'}
              />
              <StatusCard
                title="Placements"
                icon={Trophy}
                value={stats.totalPlacements}
                target={stats.placementTarget}
                achievement={stats.placementAchievement}
                avg={stats.avgPlacementsPerPerson}
                color={isDark ? 'text-amber-400' : 'text-amber-600'}
              />
            </div>

            {/* Interviews row */}
            <div className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-orange-50'} border ${isDark ? 'border-gray-700' : 'border-orange-200'}`}>
              <div className="flex items-center gap-2">
                <Zap className={`w-5 h-5 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Interviews</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-2xl font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{stats.totalInterviews}</span>
                <span className={`text-xs px-2 py-1 rounded-lg ${isDark ? 'bg-orange-900/50 text-orange-300' : 'bg-orange-100 text-orange-700'}`}>
                  sr. {stats.avgInterviewsPerPerson}/os.
                </span>
              </div>
            </div>
          </div>

          {/* All-Time Stats Panel */}
          <div className={`w-64 p-4 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
              <span className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Od poczatku</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Wer./dzien:</span>
                <span className={`font-bold ${Number(stats.allTimeVerPerDay) >= 4 ? 'text-green-500' : 'text-orange-500'}`}>
                  {stats.allTimeVerPerDay}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>CV/dzien:</span>
                <span className={`font-bold ${Number(stats.allTimeCVPerDay) >= 5 ? 'text-green-500' : 'text-orange-500'}`}>
                  {stats.allTimeCVPerDay}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Plac./mies.:</span>
                <span className={`font-bold ${Number(stats.allTimePlacementsPerMonth) >= stats.allTimePlacementTarget ? 'text-green-500' : 'text-orange-500'}`}>
                  {stats.allTimePlacementsPerMonth}
                </span>
              </div>
              <hr className={`${isDark ? 'border-gray-700' : 'border-gray-200'}`} />
              <div className="flex justify-between items-center">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Dni pracy:</span>
                <span className={`font-bold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{stats.allTimeTotalDays}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Wer./Plac.:</span>
                <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{stats.teamVerificationsPerPlacement}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Int./Plac.:</span>
                <span className={`font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{stats.teamInterviewsPerPlacement}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Team badges */}
        <div className="flex gap-3 mt-4 flex-wrap">
          <span className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-full ${isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
            <Users className="w-4 h-4" />
            {stats.teamSize} osob
          </span>
          <span className={`text-sm px-3 py-1.5 rounded-full ${isDark ? 'bg-cyan-900/50 text-cyan-300' : 'bg-cyan-100 text-cyan-800'}`}>
            {stats.sourcers}x Sourcer
          </span>
          <span className={`text-sm px-3 py-1.5 rounded-full ${isDark ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800'}`}>
            {stats.recruiters}x Rekruter
          </span>
          {stats.tacs > 0 && (
            <span className={`text-sm px-3 py-1.5 rounded-full ${isDark ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-800'}`}>
              {stats.tacs}x TAC
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
