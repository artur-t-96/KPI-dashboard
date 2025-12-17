import { useState } from 'react';
import { useKPIData } from '../hooks/useKPIData';
import MindyAvatar from '../components/Mindy/MindyAvatar';
import ChampionsLeagueTable from '../components/BodyLeasing/ChampionsLeague';
import AIReportGenerator from '../components/Reports/AIReportGenerator';
import {
  TrendLineChart,
  TeamComparisonChart,
  PlacementsPieChart,
  ChampionsPodium,
  CumulativeChart
} from '../components/Charts';
import { RefreshCw, Calendar, Users, TrendingUp, Award, Target, CalendarDays } from 'lucide-react';

const MONTHS_PL = [
  '', 'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

export default function BodyLeasing() {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  const {
    weeklyData,
    monthlyData,
    championsData,
    trendsData,
    allTimePlacements,
    availableWeeks,
    availableMonths: _availableMonths,
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
  const displayData = viewMode === 'week' ? weeklyData : monthlyData;

  // Calculate team stats based on view mode
  const totalPlacements = viewMode === 'week'
    ? weeklyData.reduce((sum, d) => sum + d.placements, 0)
    : monthlyData.reduce((sum, d) => sum + d.totalPlacements, 0);
  const totalInterviews = viewMode === 'week'
    ? weeklyData.reduce((sum, d) => sum + d.interviews, 0)
    : monthlyData.reduce((sum, d) => sum + d.totalInterviews, 0);
  const totalVerifications = viewMode === 'week'
    ? weeklyData.reduce((sum, d) => sum + d.verifications, 0)
    : monthlyData.reduce((sum, d) => sum + d.totalVerifications, 0);

  // Calculate average target achievement
  const avgTargetAchievement = displayData.length > 0
    ? Math.round(displayData.reduce((sum, d: any) => sum + d.targetAchievement, 0) / displayData.length)
    : 0;

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
          <p className="text-red-600 text-lg mb-4">❌ Błąd: {error}</p>
          <button 
            onClick={refreshData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mindy Section */}
      <MindyAvatar />

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
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {MONTHS_PL.slice(1).map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
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

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{weeklyData.length}</p>
              <p className="text-sm text-gray-500">Pracownikow</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalPlacements}</p>
              <p className="text-sm text-gray-500">Placements</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalInterviews}</p>
              <p className="text-sm text-gray-500">Interviews</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
              <span className="text-cyan-600 font-bold">W</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalVerifications}</p>
              <p className="text-sm text-gray-500">Weryfikacje</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{avgTargetAchievement}%</p>
              <p className="text-sm text-gray-500">Sr. target</p>
            </div>
          </div>
        </div>
      </div>

      {/* Combined Summary Table */}
      {displayData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
            <h3 className="font-semibold">
              📊 Podsumowanie {viewMode === 'week' ? 'tygodnia' : `miesiaca: ${MONTHS_PL[selectedMonth]} ${selectedYear}`}
            </h3>
            <p className="text-blue-100 text-sm">
              Targety: Sourcer 4 wer./dzien | Rekruter 5 CV/dzien | Wszyscy 1 placement/mies.
            </p>
          </div>
          <div className="overflow-x-auto">
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
          </div>
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid md:grid-cols-2 gap-4">
        <TrendLineChart data={trendsData} />
        <TeamComparisonChart data={weeklyData} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid md:grid-cols-3 gap-4">
        <PlacementsPieChart data={weeklyData} />
        <ChampionsPodium data={championsData} />
        <CumulativeChart data={trendsData} />
      </div>

      {/* Champions League Table */}
      <ChampionsLeagueTable data={championsData} />

      {/* Monthly Data Table */}
      {monthlyData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gray-800 text-white p-4">
            <h3 className="font-semibold">📅 Podsumowanie miesiąca: {MONTHS_PL[selectedMonth]} {selectedYear}</h3>
          </div>
          <div className="overflow-x-auto">
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
          </div>
        </div>
      )}

      {/* Placements Tables */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Monthly Placements */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-green-600 text-white p-4">
            <h3 className="font-semibold">🏆 Placements - {MONTHS_PL[selectedMonth]} {selectedYear}</h3>
            <p className="text-green-100 text-sm">Target: 1 placement/miesiac na osobe</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Pracownik</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Stanowisko</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Interviews</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Placements</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {monthlyData
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
                      <td className="px-4 py-3 text-center text-purple-600">{d.totalInterviews}</td>
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
          </div>
        </div>

        {/* All-Time Placements */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-4">
            <h3 className="font-semibold">🥇 Placements - Od poczatku</h3>
            <p className="text-amber-100 text-sm">Ranking wszystkich pracownikow</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Pracownik</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Stanowisko</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Placements</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allTimePlacements.map((d, index) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* AI Report Generator */}
      <AIReportGenerator />
    </div>
  );
}
