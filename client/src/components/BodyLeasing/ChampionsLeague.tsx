import type { ChampionEntry } from '../../types';

interface Props {
  data: ChampionEntry[];
  embedded?: boolean;
}

export default function ChampionsLeagueTable({ data, embedded = false }: Props) {
  const getMedalEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${rank}`;
    }
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'Sourcer': return 'bg-blue-100 text-blue-800';
      case 'Rekruter': return 'bg-green-100 text-green-800';
      case 'TAC': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (data.length === 0) {
    return (
      <div className={embedded ? 'p-6' : 'bg-white rounded-xl shadow-sm p-6'}>
        {!embedded && <h3 className="text-xl font-bold text-gray-800 mb-4">🏆 Liga Mistrzow</h3>}
        <div className="text-center text-gray-500 py-8">
          Brak danych za wybrany okres
        </div>
      </div>
    );
  }

  const tableContent = (
    <>
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Pracownik</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">💼</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">🎤</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">📤</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">✓</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">SUMA</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((entry, index) => (
            <tr
              key={entry.employeeId}
              className={`hover:bg-gray-50 transition-colors ${index < 3 ? 'bg-yellow-50/50' : ''}`}
            >
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={`text-lg ${index < 3 ? 'text-2xl' : 'text-gray-500'}`}>
                  {getMedalEmoji(entry.rank)}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div>
                  <p className="font-medium text-gray-900">{entry.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getPositionColor(entry.position)}`}>
                    {entry.position}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-center">
                <div>
                  <span className="font-semibold text-gray-900">{entry.placements}</span>
                  <span className="text-xs text-gray-500 block">{entry.placementPoints}p</span>
                </div>
              </td>
              <td className="px-4 py-3 text-center">
                <div>
                  <span className="font-semibold text-gray-900">{entry.interviews}</span>
                  <span className="text-xs text-gray-500 block">{entry.interviewPoints}p</span>
                </div>
              </td>
              <td className="px-4 py-3 text-center">
                <div>
                  <span className="font-semibold text-gray-900">{entry.recommendations}</span>
                  <span className="text-xs text-gray-500 block">{entry.recommendationPoints}p</span>
                </div>
              </td>
              <td className="px-4 py-3 text-center">
                <div>
                  <span className="font-semibold text-gray-900">{entry.verifications}</span>
                  <span className="text-xs text-gray-500 block">{entry.verificationPoints}p</span>
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <span className={`font-bold text-lg ${index === 0 ? 'text-yellow-600' : index < 3 ? 'text-amber-600' : 'text-gray-900'}`}>
                  {entry.totalPoints}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="bg-gray-50 px-4 py-3 border-t">
        <p className="text-xs text-gray-500">
          💼 Placements | 🎤 Interviews | 📤 Rekomendacje | ✓ Weryfikacje
        </p>
      </div>
    </>
  );

  if (embedded) {
    return tableContent;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-yellow-400 to-amber-500 p-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          🏆 Liga Mistrzow
        </h3>
        <p className="text-yellow-100 text-sm mt-1">
          100 pkt = Placement | 10 pkt = Interview | 2 pkt = Rekomendacja | 1 pkt = Weryfikacja
        </p>
      </div>
      <div className="overflow-x-auto">
        {tableContent}
      </div>
    </div>
  );
}
