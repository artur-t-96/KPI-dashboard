import { useState } from 'react';
import { useKPIData } from '../hooks/useKPIData';
import MindyAvatar from '../components/Mindy/MindyAvatar';
import ChampionsLeagueTable from '../components/BodyLeasing/ChampionsLeague';
import AIReportGenerator from '../components/Reports/AIReportGenerator';
import CollapsibleSection from '../components/CollapsibleSection';
import { RefreshCw, Calendar, CalendarDays } from 'lucide-react';

const MONTHS_PL = [
  '', 'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

export default function BodyLeasing() {
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'year'>('week');

  const {
    weeklyData,
    monthlyData,
    yearlyData,
    championsData,
    allTimePlacements,
    allTimeVerifications,
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
    <div className="space-y-4">
      {/* Mindy Section */}
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
        </div>
      </div>

      {/* Combined Summary Table */}
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

      {/* Champions League Table */}
      <CollapsibleSection
        title={`Liga Mistrzow - ${MONTHS_PL[selectedMonth]} ${selectedYear}`}
        subtitle="Punkty: Placement 100pkt | Interview 20pkt | Rekomendacja 10pkt"
        icon="🏆"
        headerClassName="bg-gradient-to-r from-yellow-500 to-amber-600 text-white"
      >
        <ChampionsLeagueTable data={championsData} embedded />
      </CollapsibleSection>

      {/* Monthly Data Table */}
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

      {/* Placements Tables */}
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

      {/* All-Time Verifications per Working Day */}
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

      {/* AI Report Generator */}
      <CollapsibleSection
        title="Generator Raportow AI"
        subtitle="Zapytaj o dane lub wygeneruj raport"
        icon="🤖"
        headerClassName="bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
      >
        <AIReportGenerator embedded />
      </CollapsibleSection>
    </div>
  );
}
