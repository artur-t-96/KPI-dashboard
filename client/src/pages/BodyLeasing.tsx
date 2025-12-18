import { useState, useEffect, useCallback } from 'react';
import { useKPIData } from '../hooks/useKPIData';
import MindyAvatar from '../components/Mindy/MindyAvatar';
import ChampionsLeagueTable from '../components/BodyLeasing/ChampionsLeague';
import AIReportGenerator from '../components/Reports/AIReportGenerator';
import CollapsibleSection from '../components/CollapsibleSection';
import { RefreshCw, Calendar, CalendarDays, GripVertical } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MONTHS_PL = [
  '', 'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

// Section IDs for ordering
const DEFAULT_SECTION_ORDER = [
  'weekly-summary',
  'champions-league',
  'monthly-summary',
  'placements-grid',
  'cv-grid',
  'weekly-verification-trend',
  'verifications-per-placement',
  'monthly-trend',
  'all-time-verifications',
  'ai-reports'
];

export default function BodyLeasing() {
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'year'>('week');

  // Drag and drop state
  const [sectionOrder, setSectionOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('bodyLeasing-sectionOrder');
    return saved ? JSON.parse(saved) : DEFAULT_SECTION_ORDER;
  });
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);

  // Save order to localStorage
  useEffect(() => {
    localStorage.setItem('bodyLeasing-sectionOrder', JSON.stringify(sectionOrder));
  }, [sectionOrder]);

  const handleDragStart = useCallback((e: React.DragEvent, sectionId: string) => {
    setDraggedSection(sectionId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', sectionId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, sectionId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedSection && sectionId !== draggedSection) {
      setDragOverSection(sectionId);
    }
  }, [draggedSection]);

  const handleDragLeave = useCallback(() => {
    setDragOverSection(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetSectionId: string) => {
    e.preventDefault();
    if (!draggedSection || draggedSection === targetSectionId) return;

    setSectionOrder(prev => {
      const newOrder = [...prev];
      const draggedIndex = newOrder.indexOf(draggedSection);
      const targetIndex = newOrder.indexOf(targetSectionId);

      if (draggedIndex !== -1 && targetIndex !== -1) {
        newOrder.splice(draggedIndex, 1);
        newOrder.splice(targetIndex, 0, draggedSection);
      }
      return newOrder;
    });

    setDraggedSection(null);
    setDragOverSection(null);
  }, [draggedSection]);

  const handleDragEnd = useCallback(() => {
    setDraggedSection(null);
    setDragOverSection(null);
  }, []);

  const resetOrder = useCallback(() => {
    setSectionOrder(DEFAULT_SECTION_ORDER);
  }, []);

  const {
    weeklyData,
    monthlyData,
    yearlyData,
    championsData,
    championsWeeklyData,
    championsAllTimePerDay,
    allTimePlacements,
    allTimeVerifications,
    monthlyTrendData,
    weeklyVerificationTrend,
    availableWeeks,
    loading,
    error,
    selectedWeek,
    selectedYear,
    selectedMonth,
    setSelectedWeek,
    setSelectedYear,
    setSelectedMonth,
    refreshData
  } = useKPIData();

  // Use appropriate data based on view mode
  const displayData = viewMode === 'week' ? weeklyData : viewMode === 'month' ? monthlyData : yearlyData;

  // Helper functions for unified data access
  const getData = (d: any) => ({
    employeeId: d.employeeId,
    name: d.name,
    position: d.position,
    daysWorked: viewMode === 'week' ? d.daysWorked : d.totalDaysWorked,
    verifications: viewMode === 'week' ? d.verifications : d.totalVerifications,
    cvAdded: viewMode === 'week' ? d.cvAdded : d.totalCvAdded,
    recommendations: viewMode === 'week' ? d.recommendations : d.totalRecommendations,
    interviews: viewMode === 'week' ? d.interviews : d.totalInterviews,
    placements: viewMode === 'week' ? d.placements : d.totalPlacements,
    verificationsPerDay: d.verificationsPerDay,
    cvPerDay: d.cvPerDay,
    targetAchievement: d.targetAchievement
  });

  // Get period label for summary
  const getPeriodLabel = () => {
    if (viewMode === 'week') return 'tygodnia';
    if (viewMode === 'month') return `miesiaca: ${MONTHS_PL[selectedMonth]} ${selectedYear}`;
    return `roku: ${selectedYear}`;
  };

  // Calculate activity target for each employee
  // Sourcer: 4 verifications/day, Recruiter: 5 CV/day, All: 1 placement/month
  const getActivityTarget = (d: any) => {
    const data = getData(d);
    if (data.position === 'Sourcer') {
      const target = data.daysWorked * 4;
      return target > 0 ? Math.round((data.verifications / target) * 100) : 0;
    } else if (data.position === 'Rekruter') {
      const target = data.daysWorked * 5;
      return target > 0 ? Math.round((data.cvAdded / target) * 100) : 0;
    }
    return 100; // TAC doesn't have daily activity target
  };

  const getActivityValue = (d: any) => {
    const data = getData(d);
    if (data.position === 'Sourcer') return data.verifications;
    if (data.position === 'Rekruter') return data.cvAdded;
    return data.recommendations;
  };

  const getActivityLabel = (position: string) => {
    if (position === 'Sourcer') return 'Weryfikacje';
    if (position === 'Rekruter') return 'CV';
    return 'Rekomendacje';
  };

  const getActivityPerDay = (d: any) => {
    const data = getData(d);
    if (data.position === 'Sourcer') return data.verificationsPerDay;
    if (data.position === 'Rekruter') return data.cvPerDay;
    return data.daysWorked > 0 ? Number((data.recommendations / data.daysWorked).toFixed(2)) : 0;
  };

  // Draggable section wrapper
  const DraggableSection = ({ id, children }: { id: string; children: React.ReactNode }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, id)}
      onDragOver={(e) => handleDragOver(e, id)}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e, id)}
      onDragEnd={handleDragEnd}
      style={{ order: sectionOrder.indexOf(id) }}
      className={`relative group transition-all duration-200 ${
        draggedSection === id ? 'opacity-50 scale-[0.98]' : ''
      } ${
        dragOverSection === id ? 'ring-2 ring-blue-500 ring-offset-2 rounded-xl' : ''
      }`}
    >
      <div className="absolute left-0 top-4 -translate-x-6 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10">
        <GripVertical className="w-5 h-5 text-gray-400" />
      </div>
      {children}
    </div>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <p className="text-red-600 text-lg mb-4">Blad: {error}</p>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Sprobuj ponownie
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pl-6">
      {/* Mindy Section - not draggable, always on top */}
      <MindyAvatar
        weeklyData={weeklyData}
        monthlyData={monthlyData}
        allTimeVerifications={allTimeVerifications}
        allTimePlacements={allTimePlacements}
        viewMode={viewMode}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
      />

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('week')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'week'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Tydzien
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'month'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              Miesiac
            </button>
            <button
              onClick={() => setViewMode('year')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'year'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              Rok
            </button>
          </div>

          {/* Week selector - only visible in week mode */}
          {viewMode === 'week' && (
            <div className="flex items-center gap-2">
              <select
                value={selectedWeek || ''}
                onChange={(e) => setSelectedWeek(e.target.value || undefined)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Najnowszy tydzien</option>
                {availableWeeks.map((w: any) => (
                  <option key={w.week_start} value={w.week_start}>
                    {w.year}-W{w.week_number} ({new Date(w.week_start).toLocaleDateString('pl-PL')})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Month/Year selector */}
          <div className="flex items-center gap-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            {viewMode !== 'year' && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {MONTHS_PL.slice(1).map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
            )}
          </div>

          <button
            onClick={refreshData}
            disabled={loading}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Odswiez
          </button>
          <button
            onClick={resetOrder}
            className="flex items-center gap-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
            title="Resetuj kolejnosc sekcji"
          >
            <GripVertical className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      {/* Draggable sections container */}
      <div className="flex flex-col gap-4">

      {/* Combined Summary Table */}
      <DraggableSection id="weekly-summary">
      {displayData.length > 0 && (
        <CollapsibleSection
          title={`Podsumowanie ${getPeriodLabel()}`}
          subtitle={`Targety: Sourcer 4 wer./dzien | Rekruter 5 CV/dzien | Wszyscy ${viewMode === 'year' ? '12 placements/rok' : '1 placement/mies.'}`}
          icon="📊"
          headerClassName="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
          defaultOpen={true}
        >
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Pracownik</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Stanowisko</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Dni</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Aktywnosc</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">/dzien</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Target %</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Interviews</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Placements</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayData.map((d: any) => {
                const data = getData(d);
                const activityTarget = getActivityTarget(d);
                return (
                  <tr key={data.employeeId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{data.name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        data.position === 'Sourcer' ? 'bg-blue-100 text-blue-800' :
                        data.position === 'Rekruter' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {data.position}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{data.daysWorked}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold">{getActivityValue(d)}</span>
                      <span className="text-xs text-gray-400 ml-1">{getActivityLabel(data.position).slice(0, 3)}</span>
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-gray-700">{getActivityPerDay(d)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${
                        activityTarget >= 100 ? 'text-green-600' :
                        activityTarget >= 70 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {activityTarget}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-purple-600 font-medium">{data.interviews}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${data.placements > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                        {data.placements}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CollapsibleSection>
      )}
      </DraggableSection>

      {/* Champions League Tables - 3 views stacked */}
      <DraggableSection id="champions-league">
      <div className="flex flex-col gap-4">
        {/* Weekly Champions */}
        <CollapsibleSection
          title={`Liga Mistrzow - Tydzien`}
          subtitle="100pkt=Plac | 10pkt=Int | 2pkt=Rek | 1pkt=Wer/CV"
          icon="🏆"
          headerClassName="bg-gradient-to-r from-yellow-400 to-amber-500 text-white"
        >
          <ChampionsLeagueTable data={championsWeeklyData} embedded />
        </CollapsibleSection>

        {/* Monthly Champions */}
        <CollapsibleSection
          title={`Liga Mistrzow - ${MONTHS_PL[selectedMonth]}`}
          subtitle="100pkt=Plac | 10pkt=Int | 2pkt=Rek | 1pkt=Wer/CV"
          icon="🏆"
          headerClassName="bg-gradient-to-r from-yellow-500 to-amber-600 text-white"
        >
          <ChampionsLeagueTable data={championsData} embedded />
        </CollapsibleSection>

        {/* All-Time Per Day Champions */}
        <CollapsibleSection
          title="Liga Mistrzow - /dzien (od poczatku)"
          subtitle="Punkty w przeliczeniu na dzien pracy | 100pkt=Plac | 10pkt=Int | 2pkt=Rek | 1pkt=Wer/CV"
          icon="🏆"
          headerClassName="bg-gradient-to-r from-amber-500 to-orange-600 text-white"
        >
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Pracownik</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">💼</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">🎤</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">📤</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">✓</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">📄</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Dni</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">PKT/DZIEN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {championsAllTimePerDay.map((entry, index) => (
                <tr
                  key={entry.employeeId}
                  className={`hover:bg-gray-50 transition-colors ${index < 3 ? 'bg-yellow-50/50' : ''}`}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-lg ${index < 3 ? 'text-2xl' : 'text-gray-500'}`}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-gray-900">{entry.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        entry.position === 'Sourcer' ? 'bg-blue-100 text-blue-800' :
                        entry.position === 'Rekruter' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {entry.position}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div>
                      <span className="font-semibold text-gray-900">{entry.placements}</span>
                      <span className="text-xs text-gray-500 block">{entry.placementsPerDay}/d</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div>
                      <span className="font-semibold text-gray-900">{entry.interviews}</span>
                      <span className="text-xs text-gray-500 block">{entry.interviewsPerDay}/d</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div>
                      <span className="font-semibold text-gray-900">{entry.recommendations}</span>
                      <span className="text-xs text-gray-500 block">{entry.recommendationsPerDay}/d</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div>
                      <span className="font-semibold text-gray-900">{entry.verifications}</span>
                      <span className="text-xs text-gray-500 block">{entry.verificationsPerDay}/d</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div>
                      <span className="font-semibold text-gray-900">{entry.cvAdded}</span>
                      <span className="text-xs text-gray-500 block">{entry.cvPerDay}/d</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">{entry.totalDaysWorked}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-bold text-lg ${index === 0 ? 'text-yellow-600' : index < 3 ? 'text-amber-600' : 'text-gray-900'}`}>
                      {entry.pointsPerDay}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="bg-gray-50 px-4 py-3 border-t">
            <p className="text-xs text-gray-500">
              💼 Placements (100pkt) | 🎤 Interviews (10pkt) | 📤 Rekomendacje (2pkt) | ✓ Weryfikacje (1pkt) | 📄 CV dodane (1pkt)
            </p>
          </div>
        </CollapsibleSection>
      </div>
      </DraggableSection>

      {/* Monthly Data Table */}
      <DraggableSection id="monthly-summary">
      {monthlyData.length > 0 && (
        <CollapsibleSection
          title={`Podsumowanie miesiaca: ${MONTHS_PL[selectedMonth]} ${selectedYear}`}
          icon="📅"
          headerClassName="bg-gray-800 text-white"
        >
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Pracownik</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Stanowisko</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Dni pracy</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Weryfikacje</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">CV</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Rekomendacje</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Interviews</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Placements</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Target %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {monthlyData.map((d) => (
                <tr key={d.employeeId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{d.name}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      d.position === 'Sourcer' ? 'bg-blue-100 text-blue-800' :
                      d.position === 'Rekruter' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {d.position}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">{d.totalDaysWorked}</td>
                  <td className="px-4 py-3 text-center">{d.totalVerifications}</td>
                  <td className="px-4 py-3 text-center">{d.totalCvAdded}</td>
                  <td className="px-4 py-3 text-center">{d.totalRecommendations}</td>
                  <td className="px-4 py-3 text-center">{d.totalInterviews}</td>
                  <td className="px-4 py-3 text-center font-bold text-green-600">{d.totalPlacements}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-bold ${
                      d.targetAchievement >= 100 ? 'text-green-600' :
                      d.targetAchievement >= 70 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {d.targetAchievement}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CollapsibleSection>
      )}
      </DraggableSection>

      {/* Placements Tables */}
      <DraggableSection id="placements-grid">
      <div className="grid md:grid-cols-2 gap-4">
        {/* Monthly Placements */}
        <CollapsibleSection
          title={`Placements - ${MONTHS_PL[selectedMonth]} ${selectedYear}`}
          subtitle="Target: 1 placement/miesiac na osobe"
          icon="🏆"
          headerClassName="bg-green-600 text-white"
        >
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Pracownik</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Stanowisko</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Placements</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...monthlyData]
                .sort((a, b) => b.totalPlacements - a.totalPlacements)
                .map((d) => (
                  <tr key={d.employeeId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{d.name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        d.position === 'Sourcer' ? 'bg-blue-100 text-blue-800' :
                        d.position === 'Rekruter' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {d.position}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold text-lg ${d.totalPlacements > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                        {d.totalPlacements}
                      </span>
                      {d.totalPlacements >= 1 && <span className="ml-1">✅</span>}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </CollapsibleSection>

        {/* All-Time Placements */}
        <CollapsibleSection
          title="Placements - Od poczatku"
          subtitle="Ranking wszystkich pracownikow"
          icon="🥇"
          headerClassName="bg-gradient-to-r from-amber-500 to-orange-600 text-white"
        >
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Pracownik</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Stanowisko</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Dni pracy</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Placements</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Plac./mies.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allTimePlacements.map((d, index) => {
                // Calculate months worked from first_week to last_week
                let months = 1;
                if (d.first_week && d.last_week) {
                  const firstDate = new Date(d.first_week).getTime();
                  const lastDate = new Date(d.last_week).getTime();
                  if (!isNaN(firstDate) && !isNaN(lastDate)) {
                    months = Math.max(1, Math.ceil((lastDate - firstDate) / (30 * 24 * 60 * 60 * 1000)));
                  }
                }
                const placementsPerMonth = (d.total_placements / months).toFixed(2);
                // Get days worked from allTimeVerifications
                const verificationData = allTimeVerifications.find(v => v.employeeId === d.employee_id);
                const daysWorked = verificationData?.totalDaysWorked || 0;

                return (
                <tr key={d.employee_id} className={`hover:bg-gray-50 ${index < 3 ? 'bg-amber-50' : ''}`}>
                  <td className="px-4 py-3 text-center">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </td>
                  <td className="px-4 py-3 font-medium">{d.name}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      d.position === 'Sourcer' ? 'bg-blue-100 text-blue-800' :
                      d.position === 'Rekruter' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {d.position}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">{daysWorked}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-bold text-lg ${d.total_placements > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      {d.total_placements}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-bold ${Number(placementsPerMonth) >= 1 ? 'text-green-600' : 'text-orange-500'}`}>
                      {placementsPerMonth}
                    </span>
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        </CollapsibleSection>
      </div>
      </DraggableSection>

      {/* CV Added Tables */}
      <DraggableSection id="cv-grid">
      <div className="grid md:grid-cols-3 gap-4">
        {/* Weekly CV */}
        <CollapsibleSection
          title={`CV dodane - Tydzien ${selectedWeek}`}
          subtitle="CV dodane w wybranym tygodniu"
          icon="📄"
          headerClassName="bg-gradient-to-r from-violet-500 to-purple-600 text-white"
        >
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">#</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Pracownik</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">CV</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...weeklyData]
                .sort((a, b) => b.cvAdded - a.cvAdded)
                .map((d, index) => (
                  <tr key={d.employeeId} className={`hover:bg-gray-50 ${index < 3 ? 'bg-violet-50' : ''}`}>
                    <td className="px-3 py-2 text-center text-sm">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                    </td>
                    <td className="px-3 py-2 font-medium text-sm">{d.name}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`font-bold ${d.cvAdded >= 5 ? 'text-green-600' : d.cvAdded > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>
                        {d.cvAdded}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </CollapsibleSection>

        {/* Monthly CV */}
        <CollapsibleSection
          title={`CV dodane - ${MONTHS_PL[selectedMonth]}`}
          subtitle="CV dodane w wybranym miesiacu"
          icon="📋"
          headerClassName="bg-gradient-to-r from-purple-500 to-pink-600 text-white"
        >
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">#</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Pracownik</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">CV</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...monthlyData]
                .sort((a, b) => b.totalCvAdded - a.totalCvAdded)
                .map((d, index) => (
                  <tr key={d.employeeId} className={`hover:bg-gray-50 ${index < 3 ? 'bg-purple-50' : ''}`}>
                    <td className="px-3 py-2 text-center text-sm">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                    </td>
                    <td className="px-3 py-2 font-medium text-sm">{d.name}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`font-bold ${d.totalCvAdded >= 20 ? 'text-green-600' : d.totalCvAdded > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>
                        {d.totalCvAdded}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </CollapsibleSection>

        {/* All-Time CV */}
        <CollapsibleSection
          title="CV dodane - Od poczatku"
          subtitle="Lacznie wszystkie CV"
          icon="📚"
          headerClassName="bg-gradient-to-r from-pink-500 to-rose-600 text-white"
        >
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">#</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Pracownik</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">CV</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">CV/dzien</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...allTimeVerifications]
                .sort((a, b) => b.totalCvAdded - a.totalCvAdded)
                .map((d, index) => (
                  <tr key={d.employeeId} className={`hover:bg-gray-50 ${index < 3 ? 'bg-pink-50' : ''}`}>
                    <td className="px-3 py-2 text-center text-sm">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                    </td>
                    <td className="px-3 py-2 font-medium text-sm">{d.name}</td>
                    <td className="px-3 py-2 text-center">
                      <span className="font-bold text-gray-700">
                        {d.totalCvAdded}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`font-bold ${d.cvPerDay >= 5 ? 'text-green-600' : d.cvPerDay >= 3 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {d.cvPerDay}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </CollapsibleSection>
      </div>
      </DraggableSection>

      {/* Weekly Verification Trend Chart */}
      <DraggableSection id="weekly-verification-trend">
      {weeklyVerificationTrend.length > 0 && (
        <CollapsibleSection
          title="Trend weryfikacji - tygodniowo"
          subtitle="Ilosc weryfikacji zespolu od poczatku (niezalezne od wybranego okresu)"
          icon="📈"
          headerClassName="bg-gradient-to-r from-blue-500 to-cyan-600 text-white"
        >
          <div className="p-4">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart
                data={weeklyVerificationTrend.map(d => ({
                  ...d,
                  label: `W${d.weekNumber}/${d.year}`
                }))}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  interval={Math.max(0, Math.floor(weeklyVerificationTrend.length / 10) - 1)}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Total', angle: -90, position: 'insideLeft', fontSize: 12 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Avg/osoba', angle: 90, position: 'insideRight', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                  formatter={(value: number, name: string) => [
                    value.toLocaleString(),
                    name === 'totalVerifications' ? 'Weryfikacje total' : 'Srednia/osoba'
                  ]}
                />
                <Legend
                  formatter={(value) => value === 'totalVerifications' ? 'Weryfikacje total' : 'Srednia na osobe'}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="totalVerifications"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 3 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgVerificationsPerPerson"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 3 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-xs text-gray-500">Ostatni tydzien</div>
                <div className="text-xl font-bold text-blue-600">
                  {weeklyVerificationTrend[weeklyVerificationTrend.length - 1]?.totalVerifications || 0}
                </div>
                <div className="text-xs text-gray-500">weryfikacji</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-xs text-gray-500">Srednia/osoba</div>
                <div className="text-xl font-bold text-green-600">
                  {weeklyVerificationTrend[weeklyVerificationTrend.length - 1]?.avgVerificationsPerPerson || 0}
                </div>
                <div className="text-xs text-gray-500">ostatni tydzien</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="text-xs text-gray-500">Liczba tygodni</div>
                <div className="text-xl font-bold text-purple-600">
                  {weeklyVerificationTrend.length}
                </div>
                <div className="text-xs text-gray-500">w danych</div>
              </div>
            </div>
          </div>
        </CollapsibleSection>
      )}
      </DraggableSection>

      {/* Verifications per Placement */}
      <DraggableSection id="verifications-per-placement">
      {allTimeVerifications.length > 0 && allTimePlacements.length > 0 && (
        <CollapsibleSection
          title="Weryfikacje na Placement"
          subtitle="Ile weryfikacji potrzeba aby zrobic jeden placement"
          icon="🎯"
          headerClassName="bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
        >
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Pracownik</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Stanowisko</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Weryfikacje</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Placements</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Wer./Plac.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...allTimeVerifications]
                .map(v => {
                  const placement = allTimePlacements.find(p => p.employee_id === v.employeeId);
                  const totalPlacements = placement?.total_placements || 0;
                  const verificationsPerPlacement = totalPlacements > 0
                    ? (v.totalVerifications / totalPlacements).toFixed(1)
                    : '∞';
                  return {
                    ...v,
                    totalPlacements,
                    verificationsPerPlacement,
                    sortValue: totalPlacements > 0 ? v.totalVerifications / totalPlacements : Infinity
                  };
                })
                .sort((a, b) => a.sortValue - b.sortValue)
                .map((d, index) => (
                  <tr key={d.employeeId} className={`hover:bg-gray-50 ${index < 3 && d.totalPlacements > 0 ? 'bg-emerald-50' : ''}`}>
                    <td className="px-4 py-3 text-center">
                      {d.totalPlacements > 0 ? (index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1) : '-'}
                    </td>
                    <td className="px-4 py-3 font-medium">{d.name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        d.position === 'Sourcer' ? 'bg-blue-100 text-blue-800' :
                        d.position === 'Rekruter' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {d.position}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{d.totalVerifications}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${d.totalPlacements > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                        {d.totalPlacements}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold text-lg ${
                        d.totalPlacements === 0 ? 'text-gray-400' :
                        d.sortValue <= 50 ? 'text-green-600' :
                        d.sortValue <= 100 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {d.verificationsPerPlacement}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </CollapsibleSection>
      )}
      </DraggableSection>

      {/* Monthly Conversion Trend */}
      <DraggableSection id="monthly-trend">
      {monthlyTrendData.length > 0 && (
        <CollapsibleSection
          title="Trend konwersji miesiecznie"
          subtitle="Ile weryfikacji i interviews potrzeba na jeden placement"
          icon="📊"
          headerClassName="bg-gradient-to-r from-indigo-500 to-violet-600 text-white"
        >
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Miesiac</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Weryfikacje</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Interviews</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Placements</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Wer./Plac.</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Int./Plac.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {monthlyTrendData.map((d) => (
                <tr key={`${d.year}-${d.month}`} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-center font-medium">
                    {MONTHS_PL[d.month]} {d.year}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">{d.totalVerifications}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{d.totalInterviews}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-bold ${d.totalPlacements > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      {d.totalPlacements}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-bold ${
                      d.verificationsPerPlacement === null ? 'text-gray-400' :
                      d.verificationsPerPlacement <= 50 ? 'text-green-600' :
                      d.verificationsPerPlacement <= 100 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {d.verificationsPerPlacement ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-bold ${
                      d.interviewsPerPlacement === null ? 'text-gray-400' :
                      d.interviewsPerPlacement <= 3 ? 'text-green-600' :
                      d.interviewsPerPlacement <= 5 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {d.interviewsPerPlacement ?? '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CollapsibleSection>
      )}
      </DraggableSection>

      {/* All-Time Verifications per Working Day */}
      <DraggableSection id="all-time-verifications">
      {allTimeVerifications.length > 0 && (
        <CollapsibleSection
          title="Weryfikacje/dzien - Od poczatku"
          subtitle="Srednia ilosc weryfikacji na dzien pracy (dane niezalezne od wybranego okresu)"
          icon="📈"
          headerClassName="bg-gradient-to-r from-cyan-600 to-blue-600 text-white"
        >
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Pracownik</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Stanowisko</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Dni pracy</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Weryfikacje</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Wer./dzien</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allTimeVerifications.map((d, index) => (
                <tr key={d.employeeId} className={`hover:bg-gray-50 ${index < 3 ? 'bg-cyan-50' : ''}`}>
                  <td className="px-4 py-3 text-center">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </td>
                  <td className="px-4 py-3 font-medium">{d.name}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      d.position === 'Sourcer' ? 'bg-blue-100 text-blue-800' :
                      d.position === 'Rekruter' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {d.position}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">{d.totalDaysWorked}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{d.totalVerifications}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-bold text-lg ${
                      d.verificationsPerDay >= 4 ? 'text-green-600' :
                      d.verificationsPerDay >= 3 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {d.verificationsPerDay}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CollapsibleSection>
      )}
      </DraggableSection>

      {/* AI Report Generator */}
      <DraggableSection id="ai-reports">
      <CollapsibleSection
        title="Generator Raportow AI"
        subtitle="Zapytaj o dane lub wygeneruj raport"
        icon="🤖"
        headerClassName="bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
      >
        <AIReportGenerator embedded />
      </CollapsibleSection>
      </DraggableSection>

      </div>
    </div>
  );
}
