import { useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import {
  uploadExcel, getUploadHistory,
  getAllKPIData, deleteWeekData, deleteRecord, deleteAllData,
  UploadType
} from '../services/api';
import {
  Upload, FileSpreadsheet, History, Trash2, CheckCircle,
  XCircle, AlertCircle, Database, RefreshCw, Users, TrendingUp, Building2
} from 'lucide-react';

interface KPIRecord {
  id: number;
  employee_id: number;
  name: string;
  position: string;
  week_start: string;
  week_end: string;
  verifications: number;
  cv_added: number;
  recommendations: number;
  interviews: number;
  placements: number;
  days_worked: number;
}

interface UploadState {
  uploading: boolean;
  result: any;
}

export default function AdminPanel() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<'upload' | 'data' | 'history'>('upload');
  const [uploadStates, setUploadStates] = useState<Record<UploadType, UploadState>>({
    'body-leasing': { uploading: false, result: null },
    'sales': { uploading: false, result: null },
    'supervisory-board': { uploading: false, result: null }
  });
  const [kpiData, setKpiData] = useState<KPIRecord[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRefs = {
    'body-leasing': useRef<HTMLInputElement>(null),
    'sales': useRef<HTMLInputElement>(null),
    'supervisory-board': useRef<HTMLInputElement>(null)
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: UploadType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStates(prev => ({
      ...prev,
      [type]: { uploading: true, result: null }
    }));

    try {
      const result = await uploadExcel(file, type);
      setUploadStates(prev => ({
        ...prev,
        [type]: { uploading: false, result }
      }));
    } catch (error: any) {
      setUploadStates(prev => ({
        ...prev,
        [type]: {
          uploading: false,
          result: {
            success: false,
            message: error.response?.data?.error || 'Blad podczas uploadu pliku'
          }
        }
      }));
    } finally {
      const ref = fileInputRefs[type];
      if (ref.current) {
        ref.current.value = '';
      }
    }
  };

  const loadKPIData = async () => {
    setLoading(true);
    try {
      const data = await getAllKPIData();
      setKpiData(data);
    } catch (error) {
      console.error('Failed to load KPI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await getUploadHistory();
      setHistory(data);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecord = async (id: number) => {
    if (!confirm('Czy na pewno chcesz usunac ten rekord?')) return;

    try {
      await deleteRecord(id);
      loadKPIData();
    } catch (error) {
      alert('Blad usuwania rekordu');
    }
  };

  const handleDeleteWeek = async (weekStart: string) => {
    if (!confirm(`Czy na pewno chcesz usunac wszystkie dane z tygodnia ${weekStart}?`)) return;

    try {
      await deleteWeekData(weekStart);
      loadKPIData();
    } catch (error) {
      alert('Blad usuwania danych');
    }
  };

  const handleDeleteAllData = async () => {
    if (!confirm('UWAGA! Czy na pewno chcesz usunac WSZYSTKIE dane KPI? Ta operacja jest nieodwracalna!')) return;
    if (!confirm('Ostatnie ostrzezenie: Czy jestes absolutnie pewny?')) return;

    try {
      await deleteAllData();
      loadKPIData();
      alert('Wszystkie dane zostaly usuniete');
    } catch (error) {
      alert('Blad usuwania danych');
    }
  };

  const handleTabChange = (tab: 'upload' | 'data' | 'history') => {
    setActiveTab(tab);
    if (tab === 'data') loadKPIData();
    if (tab === 'history') loadHistory();
  };

  const groupedByWeek = kpiData.reduce((acc: Record<string, KPIRecord[]>, record) => {
    if (!acc[record.week_start]) acc[record.week_start] = [];
    acc[record.week_start].push(record);
    return acc;
  }, {});

  if (user?.role !== 'admin') {
    return (
      <div className={`${isDark ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'} border rounded-xl p-8 text-center`}>
        <AlertCircle className={`w-12 h-12 ${isDark ? 'text-yellow-400' : 'text-yellow-500'} mx-auto mb-4`} />
        <h2 className={`text-xl font-semibold ${isDark ? 'text-yellow-300' : 'text-yellow-800'}`}>Brak dostepu</h2>
        <p className={`mt-2 ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>Ta sekcja jest dostepna tylko dla administratorow.</p>
      </div>
    );
  }

  const cardClass = isDark ? 'bg-gray-800' : 'bg-white';
  const textClass = isDark ? 'text-white' : 'text-gray-800';
  const mutedTextClass = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderClass = isDark ? 'border-gray-700' : 'border-gray-200';

  return (
    <div className="space-y-6">
      <div className={`${cardClass} rounded-xl shadow-sm p-6`}>
        <h1 className={`text-2xl font-bold ${textClass} mb-2`}>Panel Administratora</h1>
        <p className={mutedTextClass}>Zarzadzaj danymi KPI, pracownikami i uploadami.</p>
      </div>

      <div className={`${cardClass} rounded-xl shadow-sm overflow-hidden`}>
        <div className={`flex border-b ${borderClass}`}>
          {[
            { id: 'upload', label: 'Upload Excel', icon: Upload },
            { id: 'data', label: 'Dane KPI', icon: Database },
            { id: 'history', label: 'Historia', icon: History },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`flex-1 px-4 py-4 flex items-center justify-center gap-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? isDark ? 'bg-blue-900/50 text-blue-400 border-b-2 border-blue-400' : 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'upload' && (
            <div className="space-y-6">
              {/* Upload Panel Configuration */}
              {([
                {
                  type: 'body-leasing' as UploadType,
                  title: 'Body Leasing',
                  description: 'Upload danych KPI pracownikow rekrutacji',
                  icon: Users,
                  color: 'blue' as const,
                  formatInfo: 'Kolumny: Imie i nazwisko, Stanowisko (Sourcer/Rekruter/TAC), Tydzien od, Tydzien do, Dni pracy, Weryfikacje, CV, Rekomendacje, Interviews, Placements.'
                },
                {
                  type: 'sales' as UploadType,
                  title: 'Sprzedaz',
                  description: 'Upload danych dzialu sprzedazy',
                  icon: TrendingUp,
                  color: 'green' as const,
                  formatInfo: 'Format pliku zostanie udostepniony wkrotce. Plik zostanie zapisany do pozniejszego przetworzenia.'
                },
                {
                  type: 'supervisory-board' as UploadType,
                  title: 'Rada Nadzorcza',
                  description: 'Upload raportow dla rady nadzorczej',
                  icon: Building2,
                  color: 'purple' as const,
                  formatInfo: 'Format pliku zostanie udostepniony wkrotce. Plik zostanie zapisany do pozniejszego przetworzenia.'
                }
              ]).map(({ type, title, description, icon: Icon, color, formatInfo }) => {
                const state = uploadStates[type];
                const colorMap = {
                  blue: {
                    border: isDark ? 'border-blue-400' : 'border-blue-300',
                    bg: isDark ? 'bg-blue-900/20' : 'bg-blue-50',
                    header: 'from-blue-600 to-blue-700',
                    icon: 'text-blue-500'
                  },
                  green: {
                    border: isDark ? 'border-green-400' : 'border-green-300',
                    bg: isDark ? 'bg-green-900/20' : 'bg-green-50',
                    header: 'from-green-600 to-green-700',
                    icon: 'text-green-500'
                  },
                  purple: {
                    border: isDark ? 'border-purple-400' : 'border-purple-300',
                    bg: isDark ? 'bg-purple-900/20' : 'bg-purple-50',
                    header: 'from-purple-600 to-purple-700',
                    icon: 'text-purple-500'
                  }
                };
                const colorClasses = colorMap[color];

                return (
                  <div key={type} className={`border ${borderClass} rounded-xl overflow-hidden`}>
                    {/* Panel Header */}
                    <div className={`bg-gradient-to-r ${colorClasses.header} p-4 flex items-center gap-3`}>
                      <Icon className="w-6 h-6 text-white" />
                      <div>
                        <h3 className="font-semibold text-white">{title}</h3>
                        <p className="text-sm text-white/80">{description}</p>
                      </div>
                    </div>

                    {/* Upload Area */}
                    <div className="p-4">
                      <div
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                          state.uploading
                            ? `${colorClasses.border} ${colorClasses.bg}`
                            : isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <input
                          ref={fileInputRefs[type]}
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={(e) => handleFileUpload(e, type)}
                          className="hidden"
                          id={`file-upload-${type}`}
                          disabled={state.uploading}
                        />
                        <label htmlFor={`file-upload-${type}`} className="cursor-pointer">
                          <FileSpreadsheet className={`w-12 h-12 mx-auto mb-3 ${state.uploading ? `${colorClasses.icon} animate-pulse` : isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                          <p className={`font-medium ${textClass}`}>
                            {state.uploading ? 'Przetwarzanie pliku...' : 'Kliknij aby wybrac plik Excel'}
                          </p>
                          <p className={`text-xs ${mutedTextClass} mt-1`}>.xlsx, .xls</p>
                        </label>
                      </div>

                      {/* Upload Result */}
                      {state.result && (
                        <div className={`mt-3 p-3 rounded-lg ${
                          state.result.success
                            ? isDark ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-200'
                            : isDark ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200'
                        } border`}>
                          <div className="flex items-start gap-2">
                            {state.result.success ? (
                              <CheckCircle className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-500'} flex-shrink-0`} />
                            ) : (
                              <XCircle className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-red-500'} flex-shrink-0`} />
                            )}
                            <div className="text-sm">
                              <p className={`font-medium ${state.result.success ? (isDark ? 'text-green-300' : 'text-green-800') : (isDark ? 'text-red-300' : 'text-red-800')}`}>
                                {state.result.message}
                              </p>
                              {state.result.details && state.result.details.rowsProcessed > 0 && (
                                <p className={mutedTextClass}>
                                  Przetworzono: {state.result.details.rowsSuccess}/{state.result.details.rowsProcessed}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Format Info */}
                      <div className={`mt-3 p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <p className={`text-xs ${mutedTextClass}`}>{formatInfo}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <p className={`text-sm ${mutedTextClass}`}>Zarzadzaj danymi KPI - usuwaj pojedyncze rekordy lub cale tygodnie</p>
                <div className="flex gap-2">
                  <button onClick={loadKPIData} className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                    <RefreshCw className={`w-5 h-5 ${mutedTextClass}`} />
                  </button>
                  <button
                    onClick={handleDeleteAllData}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Usun wszystko
                  </button>
                </div>
              </div>

              {loading ? (
                <div className={`text-center py-8 ${mutedTextClass}`}>Ladowanie...</div>
              ) : Object.keys(groupedByWeek).length === 0 ? (
                <div className={`text-center py-8 ${mutedTextClass}`}>Brak danych</div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedByWeek).map(([weekStart, records]) => (
                    <div key={weekStart} className={`border ${borderClass} rounded-lg overflow-hidden`}>
                      <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} px-4 py-3 flex items-center justify-between`}>
                        <h4 className={`font-medium ${textClass}`}>Tydzien: {weekStart} - {records[0]?.week_end}</h4>
                        <button
                          onClick={() => handleDeleteWeek(weekStart)}
                          className={`text-sm px-3 py-1 rounded ${isDark ? 'bg-red-900/50 text-red-300 hover:bg-red-900' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                        >
                          Usun tydzien
                        </button>
                      </div>
                      <table className="w-full">
                        <thead className={isDark ? 'bg-gray-700/50' : 'bg-gray-100'}>
                          <tr>
                            <th className={`px-3 py-2 text-left text-xs ${mutedTextClass}`}>Pracownik</th>
                            <th className={`px-3 py-2 text-center text-xs ${mutedTextClass}`}>Wer.</th>
                            <th className={`px-3 py-2 text-center text-xs ${mutedTextClass}`}>CV</th>
                            <th className={`px-3 py-2 text-center text-xs ${mutedTextClass}`}>Rek.</th>
                            <th className={`px-3 py-2 text-center text-xs ${mutedTextClass}`}>Int.</th>
                            <th className={`px-3 py-2 text-center text-xs ${mutedTextClass}`}>Plac.</th>
                            <th className={`px-3 py-2 text-center text-xs ${mutedTextClass}`}>Dni</th>
                            <th className={`px-3 py-2 text-center text-xs ${mutedTextClass}`}></th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${borderClass}`}>
                          {records.map(record => (
                            <tr key={record.id} className={isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}>
                              <td className={`px-3 py-2 ${textClass}`}>
                                <span className="font-medium">{record.name}</span>
                                <span className={`ml-2 text-xs ${mutedTextClass}`}>({record.position})</span>
                              </td>
                              <td className={`px-3 py-2 text-center ${textClass}`}>{record.verifications}</td>
                              <td className={`px-3 py-2 text-center ${textClass}`}>{record.cv_added}</td>
                              <td className={`px-3 py-2 text-center ${textClass}`}>{record.recommendations}</td>
                              <td className={`px-3 py-2 text-center ${textClass}`}>{record.interviews}</td>
                              <td className={`px-3 py-2 text-center ${textClass}`}>{record.placements}</td>
                              <td className={`px-3 py-2 text-center ${textClass}`}>{record.days_worked}</td>
                              <td className="px-3 py-2 text-center">
                                <button
                                  onClick={() => handleDeleteRecord(record.id)}
                                  className={isDark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-800'}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              {loading ? (
                <div className={`text-center py-8 ${mutedTextClass}`}>Ladowanie...</div>
              ) : history.length === 0 ? (
                <div className={`text-center py-8 ${mutedTextClass}`}>Brak historii uploadow</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className={isDark ? 'bg-gray-700' : 'bg-gray-50'}>
                      <tr>
                        <th className={`px-4 py-3 text-left text-xs font-semibold ${mutedTextClass}`}>Data</th>
                        <th className={`px-4 py-3 text-left text-xs font-semibold ${mutedTextClass}`}>Plik</th>
                        <th className={`px-4 py-3 text-left text-xs font-semibold ${mutedTextClass}`}>Uzytkownik</th>
                        <th className={`px-4 py-3 text-center text-xs font-semibold ${mutedTextClass}`}>Wiersze</th>
                        <th className={`px-4 py-3 text-center text-xs font-semibold ${mutedTextClass}`}>Sukces</th>
                        <th className={`px-4 py-3 text-center text-xs font-semibold ${mutedTextClass}`}>Bledy</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${borderClass}`}>
                      {history.map((item) => (
                        <tr key={item.id} className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                          <td className={`px-4 py-3 text-sm ${mutedTextClass}`}>
                            {new Date(item.uploaded_at).toLocaleString('pl-PL')}
                          </td>
                          <td className={`px-4 py-3 font-medium ${textClass}`}>{item.filename}</td>
                          <td className={`px-4 py-3 ${mutedTextClass}`}>{item.uploaded_by_name}</td>
                          <td className={`px-4 py-3 text-center ${textClass}`}>{item.rows_processed}</td>
                          <td className={`px-4 py-3 text-center ${isDark ? 'text-green-400' : 'text-green-600'}`}>{item.rows_success}</td>
                          <td className={`px-4 py-3 text-center ${isDark ? 'text-red-400' : 'text-red-600'}`}>{item.rows_failed}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
