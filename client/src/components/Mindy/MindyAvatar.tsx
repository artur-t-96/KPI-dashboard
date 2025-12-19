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
    const allTimeAvgIntPerDay = allTimeTotalDays > 0 ? (allTimeTotalInterviews / allTimeTotalDays).toFixed(2) : '0';
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
      allTimeAvgIntPerDay,
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

  // Determine emotion based on overall achievement
  type MindyMood = 'ecstatic' | 'happy' | 'satisfied' | 'neutral' | 'concerned' | 'worried' | 'sad';

  const getMood = (achievement: number): MindyMood => {
    if (achievement >= 100) return 'ecstatic';
    if (achievement >= 85) return 'happy';
    if (achievement >= 70) return 'satisfied';
    if (achievement >= 60) return 'neutral';
    if (achievement >= 50) return 'concerned';
    if (achievement >= 40) return 'worried';
    return 'sad';
  };

  const mood = getMood(stats.overallAchievement);

  const moodConfig = {
    ecstatic: { color: '#10B981', bgFrom: '#D1FAE5', bgTo: '#6EE7B7', eyeColor: '#FBBF24', label: 'Zachwycona!', emoji: '🌟' },
    happy: { color: '#22C55E', bgFrom: '#DCFCE7', bgTo: '#86EFAC', eyeColor: '#22D3EE', label: 'Szczęśliwa', emoji: '😊' },
    satisfied: { color: '#3B82F6', bgFrom: '#DBEAFE', bgTo: '#93C5FD', eyeColor: '#60A5FA', label: 'Zadowolona', emoji: '🙂' },
    neutral: { color: '#F59E0B', bgFrom: '#FEF3C7', bgTo: '#FCD34D', eyeColor: '#FBBF24', label: 'Neutralna', emoji: '😐' },
    concerned: { color: '#F97316', bgFrom: '#FFEDD5', bgTo: '#FDBA74', eyeColor: '#FB923C', label: 'Zaniepokojona', emoji: '😟' },
    worried: { color: '#EF4444', bgFrom: '#FEE2E2', bgTo: '#FCA5A5', eyeColor: '#F87171', label: 'Zmartwiona', emoji: '😰' },
    sad: { color: '#DC2626', bgFrom: '#FEE2E2', bgTo: '#F87171', eyeColor: '#EF4444', label: 'Smutna', emoji: '😢' }
  };

  const currentMood = moodConfig[mood];

  // Emotional Mindy Robot
  const MindyRobot = () => {
    return (
      <div className="flex flex-col items-center">
        <svg width="110" height="140" viewBox="0 0 110 140">
          <defs>
            <linearGradient id="mindyBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={currentMood.bgFrom} />
              <stop offset="100%" stopColor={currentMood.bgTo} />
            </linearGradient>
            <linearGradient id="mindyShine" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0.4" />
              <stop offset="50%" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <filter id="mindyGlow">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="mindyShadow">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.15"/>
            </filter>
          </defs>

          {/* Antennae */}
          <g>
            <line x1="35" y1="18" x2="30" y2="8" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round"/>
            <circle cx="30" cy="6" r="5" fill={currentMood.color} filter="url(#mindyGlow)"/>
            <line x1="75" y1="18" x2="80" y2="8" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round"/>
            <circle cx="80" cy="6" r="5" fill={currentMood.color} filter="url(#mindyGlow)"/>
          </g>

          {/* Head/Face - main circle */}
          <g filter="url(#mindyShadow)">
            <circle cx="55" cy="55" r="40" fill="url(#mindyBg)" stroke={currentMood.color} strokeWidth="3"/>
            <ellipse cx="55" cy="45" rx="35" ry="25" fill="url(#mindyShine)"/>
          </g>

          {/* Eyes based on mood */}
          {mood === 'ecstatic' ? (
            <>
              {/* Star eyes for ecstatic */}
              <path d="M35 50 L37 54 L41 55 L38 58 L39 62 L35 60 L31 62 L32 58 L29 55 L33 54 Z" fill={currentMood.eyeColor} filter="url(#mindyGlow)"/>
              <path d="M75 50 L77 54 L81 55 L78 58 L79 62 L75 60 L71 62 L72 58 L69 55 L73 54 Z" fill={currentMood.eyeColor} filter="url(#mindyGlow)"/>
            </>
          ) : mood === 'sad' || mood === 'worried' ? (
            <>
              {/* Sad/worried eyes - droopy */}
              <ellipse cx="38" cy="50" rx="10" ry="8" fill="white"/>
              <ellipse cx="72" cy="50" rx="10" ry="8" fill="white"/>
              <circle cx="38" cy="52" r="5" fill="#1E293B"/>
              <circle cx="72" cy="52" r="5" fill="#1E293B"/>
              <circle cx="36" cy="50" r="2" fill="white"/>
              <circle cx="70" cy="50" r="2" fill="white"/>
              {/* Eyebrows - worried */}
              <path d="M28 42 Q35 38 48 44" stroke="#64748B" strokeWidth="2" fill="none" strokeLinecap="round"/>
              <path d="M82 42 Q75 38 62 44" stroke="#64748B" strokeWidth="2" fill="none" strokeLinecap="round"/>
              {/* Tear for sad */}
              {mood === 'sad' && (
                <ellipse cx="48" cy="62" rx="3" ry="4" fill="#60A5FA" opacity="0.7"/>
              )}
            </>
          ) : (
            <>
              {/* Normal/happy eyes */}
              <ellipse cx="38" cy="50" rx="10" ry={mood === 'happy' || mood === 'satisfied' ? '10' : '8'} fill="white"/>
              <ellipse cx="72" cy="50" rx="10" ry={mood === 'happy' || mood === 'satisfied' ? '10' : '8'} fill="white"/>
              <circle cx="38" cy="50" r="6" fill="#1E293B"/>
              <circle cx="72" cy="50" r="6" fill="#1E293B"/>
              <circle cx="36" cy="48" r="2" fill="white"/>
              <circle cx="70" cy="48" r="2" fill="white"/>
              {/* Sparkle for happy */}
              {(mood === 'happy' || mood === 'satisfied') && (
                <>
                  <circle cx="42" cy="46" r="1.5" fill={currentMood.eyeColor}/>
                  <circle cx="76" cy="46" r="1.5" fill={currentMood.eyeColor}/>
                </>
              )}
            </>
          )}

          {/* Cheeks - blush for happy moods */}
          {(mood === 'ecstatic' || mood === 'happy' || mood === 'satisfied') && (
            <>
              <ellipse cx="22" cy="60" rx="8" ry="5" fill="#FDA4AF" opacity="0.5"/>
              <ellipse cx="88" cy="60" rx="8" ry="5" fill="#FDA4AF" opacity="0.5"/>
            </>
          )}

          {/* Mouth based on mood */}
          {mood === 'ecstatic' ? (
            <path d="M35 72 Q55 90 75 72" stroke={currentMood.color} strokeWidth="4" fill="none" strokeLinecap="round"/>
          ) : mood === 'happy' ? (
            <path d="M35 70 Q55 85 75 70" stroke={currentMood.color} strokeWidth="3" fill="none" strokeLinecap="round"/>
          ) : mood === 'satisfied' ? (
            <path d="M38 72 Q55 82 72 72" stroke={currentMood.color} strokeWidth="3" fill="none" strokeLinecap="round"/>
          ) : mood === 'neutral' ? (
            <line x1="40" y1="75" x2="70" y2="75" stroke={currentMood.color} strokeWidth="3" strokeLinecap="round"/>
          ) : mood === 'concerned' ? (
            <path d="M40 78 Q55 72 70 78" stroke={currentMood.color} strokeWidth="3" fill="none" strokeLinecap="round"/>
          ) : mood === 'worried' ? (
            <path d="M38 80 Q55 70 72 80" stroke={currentMood.color} strokeWidth="3" fill="none" strokeLinecap="round"/>
          ) : (
            <path d="M35 82 Q55 68 75 82" stroke={currentMood.color} strokeWidth="4" fill="none" strokeLinecap="round"/>
          )}

          {/* Body */}
          <rect x="35" y="95" width="40" height="30" rx="8" fill="url(#mindyBg)" stroke={currentMood.color} strokeWidth="2"/>

          {/* Achievement display on body */}
          <rect x="42" y="102" width="26" height="16" rx="4" fill="#1E293B"/>
          <text x="55" y="115" textAnchor="middle" fontSize="11" fill={currentMood.color} fontWeight="bold">
            {stats.overallAchievement}%
          </text>

          {/* Arms */}
          <rect x="15" y="98" width="18" height="8" rx="4" fill="url(#mindyBg)" stroke={currentMood.color} strokeWidth="2"/>
          <rect x="77" y="98" width="18" height="8" rx="4" fill="url(#mindyBg)" stroke={currentMood.color} strokeWidth="2"/>

          {/* Hands - waving for happy, down for sad */}
          {mood === 'ecstatic' || mood === 'happy' ? (
            <>
              <circle cx="10" cy="95" r="6" fill="url(#mindyBg)" stroke={currentMood.color} strokeWidth="2"/>
              <circle cx="100" cy="95" r="6" fill="url(#mindyBg)" stroke={currentMood.color} strokeWidth="2"/>
            </>
          ) : (
            <>
              <circle cx="12" cy="105" r="6" fill="url(#mindyBg)" stroke={currentMood.color} strokeWidth="2"/>
              <circle cx="98" cy="105" r="6" fill="url(#mindyBg)" stroke={currentMood.color} strokeWidth="2"/>
            </>
          )}

          {/* Feet */}
          <ellipse cx="45" cy="132" rx="10" ry="6" fill="url(#mindyBg)" stroke={currentMood.color} strokeWidth="2"/>
          <ellipse cx="65" cy="132" rx="10" ry="6" fill="url(#mindyBg)" stroke={currentMood.color} strokeWidth="2"/>
        </svg>

        {/* Mood label */}
        <div className={`mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium`} style={{ backgroundColor: currentMood.bgTo, color: currentMood.color }}>
          {currentMood.emoji} {currentMood.label}
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
                <div className="flex items-center gap-1">
                  <span className={`text-xs font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{stats.totalInterviews}</span>
                  <span className={`text-[8px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{stats.avgInterviewsPerDay}/d</span>
                </div>
              </div>
              <div className={`flex-1 flex items-center justify-between p-1 rounded ${isDark ? 'bg-gray-800/50' : 'bg-pink-50'} border ${isDark ? 'border-gray-700' : 'border-pink-200'}`}>
                <div className="flex items-center gap-0.5">
                  <Star className={`w-2.5 h-2.5 ${isDark ? 'text-pink-400' : 'text-pink-600'}`} />
                  <span className={`text-[9px] ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Rek</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-xs font-bold ${isDark ? 'text-pink-400' : 'text-pink-600'}`}>{stats.totalRecommendations}</span>
                  <span className={`text-[8px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{stats.avgRecommendationsPerDay}/d</span>
                </div>
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
                <div className="flex items-center gap-1">
                  <span className={`text-xs font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{stats.allTimeTotalInterviews}</span>
                  <span className={`text-[8px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{stats.allTimeAvgIntPerDay}/d</span>
                </div>
              </div>
              <div className={`flex-1 flex items-center justify-between p-1 rounded ${isDark ? 'bg-gray-800/50' : 'bg-pink-50'} border ${isDark ? 'border-gray-700' : 'border-pink-200'}`}>
                <div className="flex items-center gap-0.5">
                  <Star className={`w-2.5 h-2.5 ${isDark ? 'text-pink-400' : 'text-pink-600'}`} />
                  <span className={`text-[9px] ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Rek</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-xs font-bold ${isDark ? 'text-pink-400' : 'text-pink-600'}`}>{stats.allTimeTotalRecommendations}</span>
                  <span className={`text-[8px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{stats.allTimeAvgRecPerDay}/d</span>
                </div>
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
