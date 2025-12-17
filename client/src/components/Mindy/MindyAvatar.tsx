import { useState } from 'react';
import { getMindyResponse } from '../../services/api';
import type { MindyEmotion, MindyResponse } from '../../types';
import { RefreshCw, Sparkles } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

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

export default function MindyAvatar() {
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

  const emotion = mindyData?.emotion || 'neutral';
  const config = emotionConfig[emotion];

  // Initial state - button to trigger Mindy
  if (!hasLoaded && !loading) {
    return (
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-4 flex items-center gap-4 border-2 border-dashed ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
        <div className="relative">
          <svg width="64" height="64" viewBox="0 0 64 64" className="drop-shadow-md opacity-50">
            <rect x="12" y="10" width="40" height="36" rx="8" fill="#9CA3AF" />
            <rect x="14" y="12" width="36" height="32" rx="6" fill="white" />
            <text x="32" y="32" textAnchor="middle" fontSize="14" fill="#9CA3AF" fontWeight="bold">• •</text>
            <rect x="20" y="48" width="24" height="12" rx="4" fill="#9CA3AF" />
          </svg>
        </div>
        <div className="flex-1">
          <p className={`font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Mindy - Asystent KPI</p>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-3`}>
            Kliknij aby otrzymac analize i rekomendacje na podstawie danych historycznych
          </p>
          <button
            onClick={fetchMindy}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
          >
            <Sparkles className="w-4 h-4" />
            Zapytaj Mindy
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-4 flex items-center gap-4`}>
        <div className={`w-16 h-16 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full animate-pulse flex items-center justify-center`}>
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
        <div className="flex-1">
          <div className={`h-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-3/4 animate-pulse mb-2`}></div>
          <div className={`h-3 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-1/2 animate-pulse`}></div>
        </div>
      </div>
    );
  }

  const tip = mindyData?.tip || 'Czesc! Jestem Mindy, Twoja asystentka KPI!';

  return (
    <div className={`${isDark ? config.bgColorDark : config.bgColor} rounded-2xl shadow-lg p-4 flex items-center gap-4 border-2`} style={{ borderColor: config.color }}>
      {/* Mindy Robot Avatar */}
      <div className={`relative ${config.animation}`}>
        <svg width="64" height="64" viewBox="0 0 64 64" className="drop-shadow-md">
          {/* Antenna */}
          <line x1="32" y1="8" x2="32" y2="2" stroke={config.color} strokeWidth="2" strokeLinecap="round">
            <animate attributeName="y1" values="8;6;8" dur="1s" repeatCount="indefinite" />
          </line>
          <circle cx="32" cy="2" r="3" fill={config.color}>
            <animate attributeName="r" values="3;4;3" dur="1s" repeatCount="indefinite" />
          </circle>

          {/* Head */}
          <rect x="12" y="10" width="40" height="36" rx="8" fill={config.color} />
          <rect x="14" y="12" width="36" height="32" rx="6" fill="white" />

          {/* Eyes */}
          <g className="eyes">
            <text x="32" y="32" textAnchor="middle" fontSize="14" fill={config.color} fontWeight="bold">
              {config.eyes}
            </text>
          </g>

          {/* Mouth based on emotion */}
          {(emotion === 'ecstatic' || emotion === 'happy' || emotion === 'satisfied' || emotion === 'motivated') && (
            <path d="M 22 38 Q 32 46 42 38" stroke={config.color} strokeWidth="2" fill="none" strokeLinecap="round" />
          )}
          {(emotion === 'neutral' || emotion === 'concerned') && (
            <line x1="24" y1="40" x2="40" y2="40" stroke={config.color} strokeWidth="2" strokeLinecap="round" />
          )}
          {(emotion === 'worried' || emotion === 'sad') && (
            <path d="M 22 42 Q 32 36 42 42" stroke={config.color} strokeWidth="2" fill="none" strokeLinecap="round" />
          )}

          {/* Body */}
          <rect x="20" y="48" width="24" height="12" rx="4" fill={config.color} />
          <circle cx="26" cy="54" r="2" fill="white" />
          <circle cx="32" cy="54" r="2" fill="white" />
          <circle cx="38" cy="54" r="2" fill="white" />
        </svg>
      </div>

      {/* Speech bubble */}
      <div className="flex-1 relative">
        <div className={`${isDark ? 'bg-gray-700' : 'bg-white'} rounded-xl p-3 shadow-sm border ${isDark ? 'border-gray-600' : 'border-gray-100'}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Mindy</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: config.color, color: 'white' }}>
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
              className={`ml-auto p-1 rounded ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} transition-colors`}
              title="Odswież analize"
            >
              <RefreshCw className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>
          </div>
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm leading-relaxed`}>{tip}</p>
        </div>

        {/* Stats badges */}
        {mindyData?.stats && (
          <div className="flex gap-2 mt-2 flex-wrap">
            <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
              Srednia: {mindyData.stats.avgTargetAchievement}%
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800'}`}>
              Lider: {mindyData.stats.topPerformer}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-800'}`}>
              Placements: {mindyData.stats.totalPlacements}
            </span>
            {mindyData.stats.alertsCount > 0 && (
              <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-800'}`}>
                Alerty: {mindyData.stats.alertsCount}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
