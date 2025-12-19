import { useState } from 'react';
import { getMindyResponse } from '../../services/api';
import type { WeeklyKPI, MonthlyKPI } from '../../types';
import type { AllTimeVerifications, AllTimePlacement } from '../../services/api';
import { Users, TrendingUp, Calendar, MessageCircle, X, Zap, Brain, Target, Trophy } from 'lucide-react';
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

    // All-time targets and achievements for consistent display
    const allTimeSourcerDays = allTimeVerifications.filter(d => d.position === 'Sourcer').reduce((sum, d) => sum + d.totalDaysWorked, 0);
    const allTimeRecruiterDays = allTimeVerifications.filter(d => d.position === 'Rekruter').reduce((sum, d) => sum + d.totalDaysWorked, 0);
    const allTimeVerificationTarget = allTimeSourcerDays * 4;
    const allTimeCVTarget = allTimeRecruiterDays * 5;
    const allTimePlacementTargetTotal = allTimeMonths * weeklyData.length;
    const allTimeVerificationAchievement = allTimeVerificationTarget > 0 ? Math.round((allTimeTotalVerifications / allTimeVerificationTarget) * 100) : 0;
    const allTimeCVAchievement = allTimeCVTarget > 0 ? Math.round((allTimeTotalCV / allTimeCVTarget) * 100) : 0;
    const allTimePlacementAchievement = allTimePlacementTargetTotal > 0 ? Math.round((allTimeTotalPlacements / allTimePlacementTargetTotal) * 100) : 0;

    // All-time averages per working day
    const allTimeAvgVerPerDay = allTimeTotalDays > 0 ? (allTimeTotalVerifications / allTimeTotalDays).toFixed(2) : '0';
    const allTimeAvgCVPerDay = allTimeTotalDays > 0 ? (allTimeTotalCV / allTimeTotalDays).toFixed(2) : '0';
    const allTimeAvgPlacPerDay = allTimeTotalDays > 0 ? (allTimeTotalPlacements / allTimeTotalDays).toFixed(3) : '0';

    const teamVerificationsPerPlacement = allTimeTotalPlacements > 0
      ? (allTimeTotalVerifications / allTimeTotalPlacements).toFixed(1)
      : '∞';

    const allTimeTotalInterviews = allTimePlacements.reduce((sum, d) => sum + d.total_interviews, 0);
    const teamInterviewsPerPlacement = allTimeTotalPlacements > 0
      ? (allTimeTotalInterviews / allTimeTotalPlacements).toFixed(1)
      : '∞';

    const overallAchievement = Math.round((verificationAchievement + cvAchievement + placementAchievement) / 3);

    // Current period averages per working day
    const daysForAvg = totalDaysWorked || 1;
    const avgVerificationsPerDay = (totalVerifications / daysForAvg).toFixed(2);
    const avgCVPerDay = (totalCV / daysForAvg).toFixed(2);
    const avgPlacementsPerDay = (totalPlacements / daysForAvg).toFixed(3);
    const avgInterviewsPerDay = (totalInterviews / daysForAvg).toFixed(2);

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
      avgVerificationsPerDay,
      avgCVPerDay,
      avgPlacementsPerDay,
      avgInterviewsPerDay,
      allTimeTotalDays,
      allTimeVerPerDay,
      allTimeCVPerDay,
      allTimeTotalCV,
      allTimeTotalPlacements,
      allTimeTotalVerifications,
      allTimeTotalInterviews,
      allTimePlacementsPerMonth,
      allTimePlacementTarget,
      teamVerificationsPerPlacement,
      teamInterviewsPerPlacement,
      allTimeVerificationTarget,
      allTimeCVTarget,
      allTimePlacementTargetTotal,
      allTimeVerificationAchievement,
      allTimeCVAchievement,
      allTimePlacementAchievement,
      allTimeAvgVerPerDay,
      allTimeAvgCVPerDay,
      allTimeAvgPlacPerDay
    };
  };

  const stats = calculateTeamStats();

  // Determine status for each body part
  const verificationOk = stats.verificationAchievement >= 70;
  const cvOk = stats.cvAchievement >= 70;
  const placementOk = stats.placementAchievement >= 70;

  const getStatusColor = (ok: boolean) => ok ? '#10B981' : '#EF4444';

  // Cute Mindy Robot - smaller with body part KPI indicators
  const MindyRobot = () => (
    <div className="relative">
      <svg width="120" height="160" viewBox="0 0 180 240" className="drop-shadow-xl">
        <defs>
          {/* White/gray body gradient */}
          <linearGradient id="whiteBodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="50%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>
          <linearGradient id="whiteBodyGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F1F5F9" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>
          {/* Dark visor gradient */}
          <linearGradient id="visorGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="strongGlow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="shadow">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.15"/>
          </filter>
          <radialGradient id="headHighlight" cx="30%" cy="30%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="0.8"/>
            <stop offset="100%" stopColor="white" stopOpacity="0"/>
          </radialGradient>
        </defs>

        {/* Shadow under robot */}
        <ellipse cx="90" cy="232" rx="45" ry="6" fill="#94A3B8" opacity="0.3" />

        {/* BODY - Placements indicator */}
        <ellipse cx="90" cy="175" rx="55" ry="60" fill="url(#whiteBodyGradient)" filter="url(#shadow)"
          stroke={getStatusColor(placementOk)} strokeWidth="3" strokeOpacity={placementOk ? 0.3 : 0.8}>
          {!placementOk && <animate attributeName="stroke-opacity" values="0.8;0.3;0.8" dur="1.5s" repeatCount="indefinite" />}
        </ellipse>
        <ellipse cx="75" cy="155" rx="30" ry="25" fill="url(#headHighlight)" />

        {/* Placement indicator on body */}
        <text x="90" y="180" textAnchor="middle" fontSize="20" fill={getStatusColor(placementOk)} fontWeight="bold">
          {stats.placementAchievement}%
        </text>
        <text x="90" y="198" textAnchor="middle" fontSize="9" fill="#64748B">PLAC</text>

        {/* ARMS - CV indicator */}
        <ellipse cx="28" cy="160" rx="18" ry="25" fill="url(#whiteBodyGradient2)" filter="url(#shadow)"
          stroke={getStatusColor(cvOk)} strokeWidth="3" strokeOpacity={cvOk ? 0.3 : 0.8}>
          {!cvOk && <animate attributeName="stroke-opacity" values="0.8;0.3;0.8" dur="1.5s" repeatCount="indefinite" />}
        </ellipse>
        <ellipse cx="152" cy="160" rx="18" ry="25" fill="url(#whiteBodyGradient2)" filter="url(#shadow)"
          stroke={getStatusColor(cvOk)} strokeWidth="3" strokeOpacity={cvOk ? 0.3 : 0.8}>
          {!cvOk && <animate attributeName="stroke-opacity" values="0.8;0.3;0.8" dur="1.5s" repeatCount="indefinite" />}
        </ellipse>

        {/* NECK */}
        <rect x="75" y="95" width="30" height="15" rx="5" fill="url(#whiteBodyGradient)" />

        {/* HEAD - Verifications indicator */}
        <g filter="url(#shadow)">
          <rect x="25" y="10" width="130" height="90" rx="35" fill="url(#whiteBodyGradient)"
            stroke={getStatusColor(verificationOk)} strokeWidth="3" strokeOpacity={verificationOk ? 0.3 : 0.8}>
            {!verificationOk && <animate attributeName="stroke-opacity" values="0.8;0.3;0.8" dur="1.5s" repeatCount="indefinite" />}
          </rect>
          <rect x="35" y="15" width="80" height="40" rx="20" fill="url(#headHighlight)" />

          {/* Ear pieces */}
          <rect x="10" y="40" width="20" height="35" rx="10" fill="url(#whiteBodyGradient2)" />
          <rect x="150" y="40" width="20" height="35" rx="10" fill="url(#whiteBodyGradient2)" />

          {/* Top antenna */}
          <ellipse cx="90" cy="8" rx="10" ry="6" fill="url(#whiteBodyGradient2)" />

          {/* VISOR/FACE */}
          <rect x="35" y="25" width="110" height="65" rx="25" fill="url(#visorGradient)" />

          {/* EYES - Based on verification status */}
          <g filter="url(#strongGlow)">
            <ellipse cx="60" cy="52" rx="12" ry="14" fill={getStatusColor(verificationOk)}>
              <animate attributeName="ry" values="14;12;14" dur="4s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="120" cy="52" rx="12" ry="14" fill={getStatusColor(verificationOk)}>
              <animate attributeName="ry" values="14;12;14" dur="4s" repeatCount="indefinite" />
            </ellipse>
            <circle cx="56" cy="47" r="4" fill="white" opacity="0.9" />
            <circle cx="116" cy="47" r="4" fill="white" opacity="0.9" />
          </g>

          {/* MOUTH */}
          {stats.overallAchievement >= 70 ? (
            <path d="M 75 72 Q 90 82 105 72" stroke="#22D3EE" strokeWidth="3" fill="none" strokeLinecap="round" filter="url(#softGlow)" />
          ) : (
            <path d="M 75 78 Q 90 72 105 78" stroke="#EF4444" strokeWidth="3" fill="none" strokeLinecap="round" filter="url(#softGlow)" />
          )}
        </g>
      </svg>

      {/* Status labels */}
      <div className="flex justify-center gap-2 mt-1">
        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${verificationOk ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-500'}`}>
          <Brain className="w-2.5 h-2.5" />
          WER
        </div>
        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${cvOk ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-500'}`}>
          <Target className="w-2.5 h-2.5" />
          CV
        </div>
        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${placementOk ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-500'}`}>
          <Trophy className="w-2.5 h-2.5" />
          PLAC
        </div>
      </div>
    </div>
  );

  // Compact status card component
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
      <div className={`relative overflow-hidden rounded-lg p-2 ${isDark ? 'bg-gray-800/50' : 'bg-white'} border transition-all ${isOk ? 'border-green-500/30' : 'border-red-500/50'}`}>
        {!isOk && <div className="absolute inset-0 bg-red-500/5 animate-pulse" />}
        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Icon className={`w-3.5 h-3.5 ${isOk ? 'text-green-500' : 'text-red-500'}`} />
              <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{title}</span>
            </div>
            <span className={`text-xs font-bold ${isOk ? 'text-green-500' : 'text-red-500'}`}>{achievement}%</span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <div>
              <span className={`text-lg font-bold ${color}`}>{value}</span>
              <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>/{target}</span>
            </div>
            <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>sr. {avg}/d</span>
          </div>
          <div className="mt-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${isOk ? 'bg-green-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(achievement, 100)}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`rounded-xl shadow-lg overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 to-gray-100'}`}>
      {/* Compact Header */}
      <div className={`px-3 py-2 ${isDark ? 'bg-gray-800' : 'bg-gradient-to-r from-indigo-600 to-purple-600'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-white" />
            <span className="text-sm font-bold text-white">MINDY</span>
          </div>
          <button
            onClick={fetchMindyTip}
            disabled={loading}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
              loading ? 'bg-white/20 text-white/50' : 'bg-white text-indigo-600 hover:bg-white/90'
            }`}
          >
            <MessageCircle className="w-3 h-3" />
            {loading ? '...' : 'AI'}
          </button>
        </div>
      </div>

      {/* AI Tip */}
      {showTip && (
        <div className={`mx-2 mt-2 ${isDark ? 'bg-purple-900/30 border-purple-500' : 'bg-purple-50 border-purple-300'} border rounded-lg p-2 relative`}>
          <button onClick={() => setShowTip(false)} className="absolute top-1 right-1">
            <X className={`w-3 h-3 ${isDark ? 'text-purple-300' : 'text-purple-600'}`} />
          </button>
          <p className={`${isDark ? 'text-purple-200' : 'text-purple-800'} text-xs pr-4`}>
            {loading ? 'Analizuję...' : mindyTip}
          </p>
        </div>
      )}

      {/* Main Content - Compact */}
      <div className="p-3">
        <div className="flex gap-4">
          {/* Mindy Robot */}
          <div className="flex-shrink-0">
            <MindyRobot />
          </div>

          {/* Stats Panel - Ten tydzien */}
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-1">
              <Calendar className={`w-3 h-3 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
              <span className={`text-xs font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                {viewMode === 'week' ? 'Ten tydzien' : `${MONTHS_PL[selectedMonth]} ${selectedYear}`}
              </span>
            </div>

            <div className="space-y-1.5">
              <StatusCard title="Weryfikacje" icon={Brain} value={stats.totalVerifications} target={stats.verificationTarget} achievement={stats.verificationAchievement} avg={stats.avgVerificationsPerDay} color={isDark ? 'text-cyan-400' : 'text-cyan-600'} />
              <StatusCard title="CV Dodane" icon={Target} value={stats.totalCV} target={stats.cvTarget} achievement={stats.cvAchievement} avg={stats.avgCVPerDay} color={isDark ? 'text-purple-400' : 'text-purple-600'} />
              <StatusCard title="Placements" icon={Trophy} value={stats.totalPlacements} target={stats.placementTarget} achievement={stats.placementAchievement} avg={stats.avgPlacementsPerDay} color={isDark ? 'text-amber-400' : 'text-amber-600'} />
            </div>

            <div className={`flex items-center justify-between p-1.5 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-orange-50'} border ${isDark ? 'border-gray-700' : 'border-orange-200'}`}>
              <div className="flex items-center gap-1">
                <Zap className={`w-3 h-3 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Int.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{stats.totalInterviews}</span>
                <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>sr. {stats.avgInterviewsPerDay}/d</span>
              </div>
            </div>
          </div>

          {/* All-Time Stats Panel */}
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-1">
              <TrendingUp className={`w-3 h-3 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
              <span className={`text-xs font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Od poczatku</span>
            </div>

            <div className="space-y-1.5">
              <StatusCard title="Weryfikacje" icon={Brain} value={stats.allTimeTotalVerifications} target={stats.allTimeVerificationTarget} achievement={stats.allTimeVerificationAchievement} avg={stats.allTimeAvgVerPerDay} color={isDark ? 'text-cyan-400' : 'text-cyan-600'} />
              <StatusCard title="CV Dodane" icon={Target} value={stats.allTimeTotalCV} target={stats.allTimeCVTarget} achievement={stats.allTimeCVAchievement} avg={stats.allTimeAvgCVPerDay} color={isDark ? 'text-purple-400' : 'text-purple-600'} />
              <StatusCard title="Placements" icon={Trophy} value={stats.allTimeTotalPlacements} target={stats.allTimePlacementTargetTotal} achievement={stats.allTimePlacementAchievement} avg={stats.allTimeAvgPlacPerDay} color={isDark ? 'text-amber-400' : 'text-amber-600'} />
            </div>

            <div className={`flex items-center justify-between p-1.5 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-orange-50'} border ${isDark ? 'border-gray-700' : 'border-orange-200'}`}>
              <div className="flex items-center gap-1">
                <Zap className={`w-3 h-3 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Int.</span>
              </div>
              <span className={`text-sm font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{stats.allTimeTotalInterviews}</span>
            </div>

            {/* Additional stats - compact */}
            <div className={`p-1.5 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="grid grid-cols-3 gap-1 text-center">
                <div>
                  <div className={`text-[9px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Dni</div>
                  <div className={`text-xs font-bold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{stats.allTimeTotalDays}</div>
                </div>
                <div>
                  <div className={`text-[9px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>W/P</div>
                  <div className={`text-xs font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{stats.teamVerificationsPerPlacement}</div>
                </div>
                <div>
                  <div className={`text-[9px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>I/P</div>
                  <div className={`text-xs font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{stats.teamInterviewsPerPlacement}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Team badges - compact */}
        <div className="flex gap-1.5 mt-2 flex-wrap">
          <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
            <Users className="w-2.5 h-2.5" />
            {stats.teamSize}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isDark ? 'bg-cyan-900/50 text-cyan-300' : 'bg-cyan-100 text-cyan-800'}`}>
            {stats.sourcers}S
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isDark ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800'}`}>
            {stats.recruiters}R
          </span>
          {stats.tacs > 0 && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isDark ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-800'}`}>
              {stats.tacs}T
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
