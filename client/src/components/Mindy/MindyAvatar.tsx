import { useState, useEffect } from 'react';
import { getMindyResponse } from '../../services/api';
import type { MindyEmotion, MindyResponse } from '../../types';

const emotionConfig: Record<MindyEmotion, { color: string; bgColor: string; animation: string; eyes: string }> = {
  ecstatic: { color: '#FFD700', bgColor: 'bg-yellow-50', animation: 'animate-bounce', eyes: '◠◠' },
  happy: { color: '#22C55E', bgColor: 'bg-green-50', animation: 'animate-pulse-slow', eyes: '◡◡' },
  satisfied: { color: '#86EFAC', bgColor: 'bg-green-50', animation: '', eyes: '◡◡' },
  neutral: { color: '#3B82F6', bgColor: 'bg-blue-50', animation: '', eyes: '• •' },
  concerned: { color: '#EAB308', bgColor: 'bg-yellow-50', animation: '', eyes: '◦ ◦' },
  worried: { color: '#F97316', bgColor: 'bg-orange-50', animation: 'animate-wiggle', eyes: '◦ ◦' },
  sad: { color: '#EF4444', bgColor: 'bg-red-50', animation: '', eyes: '︵︵' },
  motivated: { color: '#8B5CF6', bgColor: 'bg-purple-50', animation: 'animate-float', eyes: '★★' }
};

export default function MindyAvatar() {
  const [mindyData, setMindyData] = useState<MindyResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMindy = async () => {
      try {
        const data = await getMindyResponse();
        setMindyData(data);
      } catch (error) {
        console.error('Failed to fetch Mindy data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMindy();
    const interval = setInterval(fetchMindy, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-4 flex items-center gap-4">
        <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
        </div>
      </div>
    );
  }

  const emotion = mindyData?.emotion || 'neutral';
  const config = emotionConfig[emotion];
  const tip = mindyData?.tip || '🤖 Cześć! Jestem Mindy, Twoja asystentka KPI!';

  return (
    <div className={`${config.bgColor} rounded-2xl shadow-lg p-4 flex items-center gap-4 border-2`} style={{ borderColor: config.color }}>
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
        
        {/* Sparkles for ecstatic */}
        {emotion === 'ecstatic' && (
          <>
            <span className="absolute -top-1 -left-1 text-yellow-400 animate-ping">✨</span>
            <span className="absolute -top-1 -right-1 text-yellow-400 animate-ping" style={{ animationDelay: '0.5s' }}>✨</span>
          </>
        )}
        
        {/* Fire for motivated */}
        {emotion === 'motivated' && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xl">🔥</span>
        )}
      </div>

      {/* Speech bubble */}
      <div className="flex-1 relative">
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-gray-800">Mindy</span>
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
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">{tip}</p>
        </div>
        
        {/* Stats badges */}
        {mindyData?.stats && (
          <div className="flex gap-2 mt-2 flex-wrap">
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              📊 Średnia: {mindyData.stats.avgTargetAchievement}%
            </span>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              🏆 Lider: {mindyData.stats.topPerformer}
            </span>
            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
              💼 Placements: {mindyData.stats.totalPlacements}
            </span>
            {mindyData.stats.alertsCount > 0 && (
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                ⚠️ Alerts: {mindyData.stats.alertsCount}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
