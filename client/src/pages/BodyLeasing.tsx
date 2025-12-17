import { useKPIData } from '../hooks/useKPIData';
import MindyAvatar from '../components/Mindy/MindyAvatar';
import ChampionsLeagueTable from '../components/BodyLeasing/ChampionsLeague';
import { 
  TrendLineChart, 
  TeamComparisonChart, 
  PlacementsPieChart, 
  TargetGauge,
  ChampionsPodium,
  CumulativeChart
} from '../components/Charts';
import { RefreshCw, Calendar, Users, TrendingUp, Award, Target } from 'lucide-react';

const MONTHS_PL = [
  '', 'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

export default function BodyLeasing() {
  const { 
    weeklyData,
    monthlyData,
    championsData,
    trendsData,
    weeklyByPosition,
    availableWeeks,
    availableMonths,
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

  // Calculate team stats
  const sourcerStats = weeklyByPosition.Sourcer;
  const recruiterStats = weeklyByPosition.Rekruter;
  const tacStats = weeklyByPosition.TAC;

  const avgSourcerTarget = sourcerStats.length > 0 
    ? Math.round(sourcerStats.reduce((sum, s) => sum + s.targetAchievement, 0) / sourcerStats.length)
    : 0;
  
  const avgRecruiterTarget = recruiterStats.length > 0
    ? Math.round(recruiterStats.reduce((sum, s) => sum + s.targetAchievement, 0) / recruiterStats.length)
    : 0;

  const totalPlacements = weeklyData.reduce((sum, d) => sum + d.placements, 0);
  const totalInterviews = weeklyData.reduce((sum, d) => sum + d.interviews, 0);

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
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <select 
              value={selectedWeek || ''}
              onChange={(e) => setSelectedWeek(e.target.value || undefined)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Najnowszy tydzień</option>
              {availableWeeks.map((w: any) => (
                <option key={w.week_start} value={w.week_start}>
                  {w.year}-W{w.week_number} ({new Date(w.week_start).toLocaleDateString('pl-PL')})
                </option>
              ))}
            </select>
          </div>

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
            Odśwież
          </button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{weeklyData.length}</p>
              <p className="text-sm text-gray-500">Pracowników</p>
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
              <p className="text-sm text-gray-500">Placements (tydzień)</p>
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
              <p className="text-sm text-gray-500">Interviews (tydzień)</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round((avgSourcerTarget + avgRecruiterTarget) / 2)}%
              </p>
              <p className="text-sm text-gray-500">Śr. realizacja targetu</p>
            </div>
          </div>
        </div>
      </div>

      {/* Position Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Sourcers */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-blue-600 text-white p-4">
            <h3 className="font-semibold">👀 Sourcerzy</h3>
            <p className="text-blue-100 text-sm">Target: 4 weryfikacje/dzień</p>
          </div>
          <div className="p-4">
            {sourcerStats.length > 0 ? (
              <div className="space-y-3">
                {sourcerStats.map(s => (
                  <div key={s.employeeId} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.daysWorked} dni pracy</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">{s.verifications}</p>
                      <p className="text-xs text-gray-500">{s.verificationsPerDay}/dzień</p>
                    </div>
                    <div className={`text-right ${s.targetAchievement >= 100 ? 'text-green-600' : s.targetAchievement >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                      <p className="font-bold">{s.targetAchievement}%</p>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t">
                  <TargetGauge 
                    value={avgSourcerTarget} 
                    target={100} 
                    label="Średnia zespołu" 
                    color="#3B82F6" 
                  />
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Brak danych</p>
            )}
          </div>
        </div>

        {/* Recruiters */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-green-600 text-white p-4">
            <h3 className="font-semibold">📋 Rekruterzy</h3>
            <p className="text-green-100 text-sm">Target: 5 CV/dzień</p>
          </div>
          <div className="p-4">
            {recruiterStats.length > 0 ? (
              <div className="space-y-3">
                {recruiterStats.map(s => (
                  <div key={s.employeeId} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.daysWorked} dni pracy</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{s.cvAdded}</p>
                      <p className="text-xs text-gray-500">{s.cvPerDay}/dzień</p>
                    </div>
                    <div className={`text-right ${s.targetAchievement >= 100 ? 'text-green-600' : s.targetAchievement >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                      <p className="font-bold">{s.targetAchievement}%</p>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t">
                  <TargetGauge 
                    value={avgRecruiterTarget} 
                    target={100} 
                    label="Średnia zespołu" 
                    color="#22C55E" 
                  />
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Brak danych</p>
            )}
          </div>
        </div>

        {/* TAC */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-purple-600 text-white p-4">
            <h3 className="font-semibold">🤝 TAC</h3>
            <p className="text-purple-100 text-sm">Target: 1 placement/miesiąc</p>
          </div>
          <div className="p-4">
            {tacStats.length > 0 ? (
              <div className="space-y-3">
                {tacStats.map(s => (
                  <div key={s.employeeId} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.daysWorked} dni pracy</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-purple-600">{s.recommendations}</p>
                      <p className="text-xs text-gray-500">rekomendacji</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{s.placements}</p>
                      <p className="text-xs text-gray-500">placements</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Brak danych</p>
            )}
          </div>
        </div>
      </div>

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
    </div>
  );
}
