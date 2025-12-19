import { useState } from 'react';
import { getMindyResponse } from '../../services/api';
import type { WeeklyKPI, MonthlyKPI } from '../../types';
import type { AllTimeVerifications, AllTimePlacement } from '../../services/api';
import { Users, TrendingUp, Calendar, MessageCircle, X, Zap, Brain, Target, Trophy, Star } from 'lucide-react';
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
    const totalRecommendations = currentData.reduce((sum, d: any) =>
      sum + (viewMode === 'week' ? d.recommendations : d.totalRecommendations), 0);

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
    const avgRecommendationsPerDay = (totalRecommendations / daysForAvg).toFixed(2);

    // All-time recommendations from placements data
    const allTimeTotalRecommendations = allTimePlacements.reduce((sum, d) => sum + d.total_recommendations, 0);
    const allTimeAvgRecPerDay = allTimeTotalDays > 0 ? (allTimeTotalRecommendations / allTimeTotalDays).toFixed(2) : '0';

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
      totalRecommendations,
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
      avgRecommendationsPerDay,
      allTimeTotalDays,
      allTimeVerPerDay,
      allTimeCVPerDay,
      allTimeTotalCV,
      allTimeTotalPlacements,
      allTimeTotalVerifications,
      allTimeTotalInterviews,
      allTimeTotalRecommendations,
      allTimeAvgRecPerDay,
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
  const interviewOk = stats.totalInterviews >= stats.totalPlacements * 3; // 3 interviews per placement target
  const recommendationOk = stats.totalRecommendations >= stats.totalPlacements * 2; // 2 recommendations per placement

  // Colors for body parts
  const getColor = (ok: boolean) => ok ? '#10B981' : '#EF4444';
  const getGlow = (ok: boolean) => ok ? '#34D399' : '#F87171';

  // Mindy Robot - Modern humanoid with body-part KPI mapping
  const MindyRobot = () => {
    const overallOk = stats.overallAchievement >= 70;
    return (
      <div className="flex flex-col items-center">
        <svg width="120" height="160" viewBox="0 0 120 160">
          <defs>
            {/* Gradients for each body part */}
            <linearGradient id="headGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={verificationOk ? '#D1FAE5' : '#FEE2E2'} />
              <stop offset="100%" stopColor={verificationOk ? '#6EE7B7' : '#FCA5A5'} />
            </linearGradient>
            <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={placementOk ? '#D1FAE5' : '#FEE2E2'} />
              <stop offset="100%" stopColor={placementOk ? '#6EE7B7' : '#FCA5A5'} />
            </linearGradient>
            <linearGradient id="leftArmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={cvOk ? '#CFFAFE' : '#FEE2E2'} />
              <stop offset="100%" stopColor={cvOk ? '#67E8F9' : '#FCA5A5'} />
            </linearGradient>
            <linearGradient id="rightArmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={recommendationOk ? '#FCE7F3' : '#FEE2E2'} />
              <stop offset="100%" stopColor={recommendationOk ? '#F9A8D4' : '#FCA5A5'} />
            </linearGradient>
            <linearGradient id="legsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={interviewOk ? '#FEF3C7' : '#FEE2E2'} />
              <stop offset="100%" stopColor={interviewOk ? '#FCD34D' : '#FCA5A5'} />
            </linearGradient>
            <filter id="neonGlow">
              <feGaussianBlur stdDeviation="2" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="shadow">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2"/>
            </filter>
          </defs>

          {/* Antenna */}
          <line x1="60" y1="5" x2="60" y2="15" stroke="#64748B" strokeWidth="2"/>
          <circle cx="60" cy="5" r="4" fill={overallOk ? '#22D3EE' : '#EF4444'} filter="url(#neonGlow)"/>

          {/* HEAD - Weryfikacje */}
          <g filter="url(#shadow)">
            <rect x="35" y="15" width="50" height="40" rx="12" fill="url(#headGrad)" stroke={getColor(verificationOk)} strokeWidth="2"/>
            {/* Visor */}
            <rect x="40" y="22" width="40" height="18" rx="6" fill="#1E293B"/>
            {/* Eyes */}
            <circle cx="50" cy="31" r="5" fill={getGlow(verificationOk)} filter="url(#neonGlow)"/>
            <circle cx="70" cy="31" r="5" fill={getGlow(verificationOk)} filter="url(#neonGlow)"/>
            {/* Mouth indicator */}
            <rect x="48" y="45" width="24" height="4" rx="2" fill={getColor(verificationOk)}/>
          </g>

          {/* NECK */}
          <rect x="52" y="55" width="16" height="8" rx="2" fill="#94A3B8"/>

          {/* LEFT ARM - CV */}
          <g filter="url(#shadow)">
            <rect x="8" y="65" width="18" height="45" rx="6" fill="url(#leftArmGrad)" stroke={getColor(cvOk)} strokeWidth="2"/>
            {/* Hand */}
            <circle cx="17" cy="115" r="8" fill="url(#leftArmGrad)" stroke={getColor(cvOk)} strokeWidth="2"/>
            {/* Arm joint */}
            <circle cx="17" cy="72" r="5" fill="#64748B"/>
          </g>

          {/* RIGHT ARM - Rekomendacje */}
          <g filter="url(#shadow)">
            <rect x="94" y="65" width="18" height="45" rx="6" fill="url(#rightArmGrad)" stroke={getColor(recommendationOk)} strokeWidth="2"/>
            {/* Hand with star */}
            <circle cx="103" cy="115" r="8" fill="url(#rightArmGrad)" stroke={getColor(recommendationOk)} strokeWidth="2"/>
            {/* Star icon in hand */}
            <path d="M103 112 L104.5 115 L108 115.5 L105.5 117.5 L106 121 L103 119.5 L100 121 L100.5 117.5 L98 115.5 L101.5 115 Z"
                  fill={getColor(recommendationOk)} transform="scale(0.8) translate(12, 2)"/>
            {/* Arm joint */}
            <circle cx="103" cy="72" r="5" fill="#64748B"/>
          </g>

          {/* BODY/TORSO - Placements */}
          <g filter="url(#shadow)">
            <rect x="26" y="63" width="68" height="50" rx="10" fill="url(#bodyGrad)" stroke={getColor(placementOk)} strokeWidth="2"/>
            {/* Core indicator */}
            <circle cx="60" cy="88" r="12" fill="#1E293B"/>
            <circle cx="60" cy="88" r="8" fill={getGlow(placementOk)} filter="url(#neonGlow)"/>
            {/* Achievement percentage */}
            <text x="60" y="92" textAnchor="middle" fontSize="8" fill="#1E293B" fontWeight="bold">
              {stats.overallAchievement}%
            </text>
            {/* Chest details */}
            <rect x="34" y="70" width="12" height="3" rx="1" fill={getColor(placementOk)} opacity="0.5"/>
            <rect x="74" y="70" width="12" height="3" rx="1" fill={getColor(placementOk)} opacity="0.5"/>
          </g>

          {/* LEGS - Interviews */}
          <g filter="url(#shadow)">
            {/* Left leg */}
            <rect x="32" y="113" width="18" height="35" rx="6" fill="url(#legsGrad)" stroke={getColor(interviewOk)} strokeWidth="2"/>
            <rect x="30" y="145" width="22" height="10" rx="4" fill="url(#legsGrad)" stroke={getColor(interviewOk)} strokeWidth="2"/>

            {/* Right leg */}
            <rect x="70" y="113" width="18" height="35" rx="6" fill="url(#legsGrad)" stroke={getColor(interviewOk)} strokeWidth="2"/>
            <rect x="68" y="145" width="22" height="10" rx="4" fill="url(#legsGrad)" stroke={getColor(interviewOk)} strokeWidth="2"/>

            {/* Hip joint */}
            <rect x="50" y="110" width="20" height="8" rx="3" fill="#64748B"/>
          </g>
        </svg>

        {/* Legend */}
        <div className="flex flex-wrap gap-1 mt-1 justify-center text-[8px]">
          <span className={`px-1 py-0.5 rounded ${verificationOk ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            Głowa:WER
          </span>
          <span className={`px-1 py-0.5 rounded ${placementOk ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            Tułów:PLAC
          </span>
          <span className={`px-1 py-0.5 rounded ${cvOk ? 'bg-cyan-100 text-cyan-700' : 'bg-red-100 text-red-700'}`}>
            L.ręka:CV
          </span>
          <span className={`px-1 py-0.5 rounded ${recommendationOk ? 'bg-pink-100 text-pink-700' : 'bg-red-100 text-red-700'}`}>
            P.ręka:REK
          </span>
          <span className={`px-1 py-0.5 rounded ${interviewOk ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
            Nogi:INT
          </span>
        </div>
      </div>
    );
  };

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
      <div className={`relative overflow-hidden rounded p-1.5 ${isDark ? 'bg-gray-800/50' : 'bg-white'} border transition-all ${isOk ? 'border-green-500/30' : 'border-red-500/50'}`}>
        {!isOk && <div className="absolute inset-0 bg-red-500/5 animate-pulse" />}
        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Icon className={`w-3 h-3 ${isOk ? 'text-green-500' : 'text-red-500'}`} />
              <span className={`text-[10px] font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{title}</span>
            </div>
            <span className={`text-[10px] font-bold ${isOk ? 'text-green-500' : 'text-red-500'}`}>{achievement}%</span>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <span className={`text-sm font-bold ${color}`}>{value}</span>
              <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>/{target}</span>
            </div>
            <span className={`text-[9px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{avg}/d</span>
          </div>
          <div className="mt-0.5 h-0.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
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
        <div className="flex gap-2">
          {/* Mindy Robot */}
          <div className="flex-shrink-0">
            <MindyRobot />
          </div>

          {/* Stats Panel - Ten tydzien */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-1">
              <Calendar className={`w-3 h-3 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
              <span className={`text-[10px] font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                {viewMode === 'week' ? 'Tydzien' : `${MONTHS_PL[selectedMonth]} '${String(selectedYear).slice(-2)}`}
              </span>
            </div>

            <div className="space-y-1">
              <StatusCard title="WER" icon={Brain} value={stats.totalVerifications} target={stats.verificationTarget} achievement={stats.verificationAchievement} avg={stats.avgVerificationsPerDay} color={isDark ? 'text-cyan-400' : 'text-cyan-600'} />
              <StatusCard title="CV" icon={Target} value={stats.totalCV} target={stats.cvTarget} achievement={stats.cvAchievement} avg={stats.avgCVPerDay} color={isDark ? 'text-purple-400' : 'text-purple-600'} />
              <StatusCard title="PLAC" icon={Trophy} value={stats.totalPlacements} target={stats.placementTarget} achievement={stats.placementAchievement} avg={stats.avgPlacementsPerDay} color={isDark ? 'text-amber-400' : 'text-amber-600'} />
            </div>

            <div className="flex gap-1">
              <div className={`flex-1 flex items-center justify-between p-1 rounded ${isDark ? 'bg-gray-800/50' : 'bg-orange-50'} border ${isDark ? 'border-gray-700' : 'border-orange-200'}`}>
                <div className="flex items-center gap-0.5">
                  <Zap className={`w-2.5 h-2.5 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                  <span className={`text-[9px] ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Int</span>
                </div>
                <span className={`text-xs font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{stats.totalInterviews}</span>
              </div>
              <div className={`flex-1 flex items-center justify-between p-1 rounded ${isDark ? 'bg-gray-800/50' : 'bg-pink-50'} border ${isDark ? 'border-gray-700' : 'border-pink-200'}`}>
                <div className="flex items-center gap-0.5">
                  <Star className={`w-2.5 h-2.5 ${isDark ? 'text-pink-400' : 'text-pink-600'}`} />
                  <span className={`text-[9px] ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Rek</span>
                </div>
                <span className={`text-xs font-bold ${isDark ? 'text-pink-400' : 'text-pink-600'}`}>{stats.totalRecommendations}</span>
              </div>
            </div>
          </div>

          {/* All-Time Stats Panel */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-1">
              <TrendingUp className={`w-3 h-3 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
              <span className={`text-[10px] font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Od poczatku</span>
            </div>

            <div className="space-y-1">
              <StatusCard title="WER" icon={Brain} value={stats.allTimeTotalVerifications} target={stats.allTimeVerificationTarget} achievement={stats.allTimeVerificationAchievement} avg={stats.allTimeAvgVerPerDay} color={isDark ? 'text-cyan-400' : 'text-cyan-600'} />
              <StatusCard title="CV" icon={Target} value={stats.allTimeTotalCV} target={stats.allTimeCVTarget} achievement={stats.allTimeCVAchievement} avg={stats.allTimeAvgCVPerDay} color={isDark ? 'text-purple-400' : 'text-purple-600'} />
              <StatusCard title="PLAC" icon={Trophy} value={stats.allTimeTotalPlacements} target={stats.allTimePlacementTargetTotal} achievement={stats.allTimePlacementAchievement} avg={stats.allTimeAvgPlacPerDay} color={isDark ? 'text-amber-400' : 'text-amber-600'} />
            </div>

            <div className="flex gap-1">
              <div className={`flex-1 flex items-center justify-between p-1 rounded ${isDark ? 'bg-gray-800/50' : 'bg-orange-50'} border ${isDark ? 'border-gray-700' : 'border-orange-200'}`}>
                <div className="flex items-center gap-0.5">
                  <Zap className={`w-2.5 h-2.5 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                  <span className={`text-[9px] ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Int</span>
                </div>
                <span className={`text-xs font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{stats.allTimeTotalInterviews}</span>
              </div>
              <div className={`flex-1 flex items-center justify-between p-1 rounded ${isDark ? 'bg-gray-800/50' : 'bg-pink-50'} border ${isDark ? 'border-gray-700' : 'border-pink-200'}`}>
                <div className="flex items-center gap-0.5">
                  <Star className={`w-2.5 h-2.5 ${isDark ? 'text-pink-400' : 'text-pink-600'}`} />
                  <span className={`text-[9px] ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Rek</span>
                </div>
                <span className={`text-xs font-bold ${isDark ? 'text-pink-400' : 'text-pink-600'}`}>{stats.allTimeTotalRecommendations}</span>
              </div>
            </div>

            {/* Additional stats - compact */}
            <div className={`p-1 rounded ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="grid grid-cols-3 gap-0.5 text-center">
                <div>
                  <div className={`text-[8px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Dni</div>
                  <div className={`text-[10px] font-bold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{stats.allTimeTotalDays}</div>
                </div>
                <div>
                  <div className={`text-[8px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>W/P</div>
                  <div className={`text-[10px] font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{stats.teamVerificationsPerPlacement}</div>
                </div>
                <div>
                  <div className={`text-[8px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>I/P</div>
                  <div className={`text-[10px] font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{stats.teamInterviewsPerPlacement}</div>
                </div>
              </div>
            </div>
          </div>
          {/* Employee Count Panel */}
          <div className={`flex-shrink-0 w-20 p-2 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-slate-50'} border ${isDark ? 'border-gray-700' : 'border-slate-200'}`}>
            <div className="flex items-center gap-1 mb-2">
              <Users className={`w-3 h-3 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              <span className={`text-[10px] font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Zespół</span>
            </div>
            <div className="space-y-1.5">
              <div className={`text-center p-1.5 rounded ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                <div className={`text-xl font-bold ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>{stats.teamSize}</div>
                <div className={`text-[8px] ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>TOTAL</div>
              </div>
              <div className={`flex items-center justify-between p-1 rounded ${isDark ? 'bg-cyan-900/30' : 'bg-cyan-50'}`}>
                <span className={`text-[9px] ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>Sourcer</span>
                <span className={`text-sm font-bold ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>{stats.sourcers}</span>
              </div>
              <div className={`flex items-center justify-between p-1 rounded ${isDark ? 'bg-green-900/30' : 'bg-green-50'}`}>
                <span className={`text-[9px] ${isDark ? 'text-green-400' : 'text-green-700'}`}>Rekruter</span>
                <span className={`text-sm font-bold ${isDark ? 'text-green-300' : 'text-green-700'}`}>{stats.recruiters}</span>
              </div>
              {stats.tacs > 0 && (
                <div className={`flex items-center justify-between p-1 rounded ${isDark ? 'bg-purple-900/30' : 'bg-purple-50'}`}>
                  <span className={`text-[9px] ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>TAC</span>
                  <span className={`text-sm font-bold ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>{stats.tacs}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
