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
    <div className="overflow-x-auto">
      <table className="w-full min-w-[500px]">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-2 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
            <th className="px-2 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-600 uppercase tracking-wider">Pracownik</th>
            <th className="px-1 md:px-4 py-2 md:py-3 text-center text-[10px] md:text-xs font-semibold text-gray-600 uppercase tracking-wider">💼</th>
            <th className="px-1 md:px-4 py-2 md:py-3 text-center text-[10px] md:text-xs font-semibold text-gray-600 uppercase tracking-wider">🎤</th>
            <th className="px-1 md:px-4 py-2 md:py-3 text-center text-[10px] md:text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">📤</th>
            <th className="px-1 md:px-4 py-2 md:py-3 text-center text-[10px] md:text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">✓</th>
            <th className="px-2 md:px-4 py-2 md:py-3 text-right text-[10px] md:text-xs font-semibold text-gray-600 uppercase tracking-wider">SUMA</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((entry, index) => (
            <tr
              key={entry.employeeId}
              className={`hover:bg-gray-50 transition-colors ${index < 3 ? 'bg-yellow-50/50' : ''}`}
            >
              <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap">
                <span className={`text-base md:text-lg ${index < 3 ? 'text-xl md:text-2xl' : 'text-gray-500'}`}>
                  {getMedalEmoji(entry.rank)}
                </span>
              </td>
              <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap">
                <div>
                  <p className="font-medium text-gray-900 text-sm md:text-base">{entry.name}</p>
                  <span className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full ${getPositionColor(entry.position)}`}>
                    {entry.position}
                  </span>
                </div>
              </td>
              <td className="px-1 md:px-4 py-2 md:py-3 text-center">
                <div>
                  <span className="font-semibold text-gray-900 text-sm md:text-base">{entry.placements}</span>
                  <span className="text-[10px] md:text-xs text-gray-500 block">{entry.placementPoints}p</span>
                </div>
              </td>
              <td className="px-1 md:px-4 py-2 md:py-3 text-center">
                <div>
                  <span className="font-semibold text-gray-900 text-sm md:text-base">{entry.interviews}</span>
                  <span className="text-[10px] md:text-xs text-gray-500 block">{entry.interviewPoints}p</span>
                </div>
              </td>
              <td className="px-1 md:px-4 py-2 md:py-3 text-center hidden sm:table-cell">
                <div>
                  <span className="font-semibold text-gray-900 text-sm md:text-base">{entry.recommendations}</span>
                  <span className="text-[10px] md:text-xs text-gray-500 block">{entry.recommendationPoints}p</span>
                </div>
              </td>
              <td className="px-1 md:px-4 py-2 md:py-3 text-center hidden sm:table-cell">
                <div>
                  <span className="font-semibold text-gray-900 text-sm md:text-base">{entry.verifications}</span>
                  <span className="text-[10px] md:text-xs text-gray-500 block">{entry.verificationPoints}p</span>
                </div>
              </td>
              <td className="px-2 md:px-4 py-2 md:py-3 text-right">
                <span className={`font-bold text-base md:text-lg ${index === 0 ? 'text-yellow-600' : index < 3 ? 'text-amber-600' : 'text-gray-900'}`}>
                  {entry.totalPoints}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="bg-gray-50 px-2 md:px-4 py-2 md:py-3 border-t">
        <p className="text-[10px] md:text-xs text-gray-500">
          💼 Plac | 🎤 Int | <span className="hidden sm:inline">📤 Rek | ✓ Wer</span>
        </p>
      </div>
    </div>
  );

  if (embedded) {
    return tableContent;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-yellow-400 to-amber-500 p-3 md:p-4">
        <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
          🏆 Liga Mistrzow
        </h3>
        <p className="text-yellow-100 text-[10px] md:text-sm mt-1">
          100p = Plac | 10p = Int | 2p = Rek | 1p = Wer
        </p>
      </div>
      {tableContent}
    </div>
  );
}
