import { useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import {
  uploadExcel, getUploadHistory,
  getAllKPIData, deleteWeekData, deleteRecord, deleteAllData
} from '../services/api';
import {
  Upload, FileSpreadsheet, History, Trash2, CheckCircle,
  XCircle, AlertCircle, Database, RefreshCw
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

export default function AdminPanel() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<'upload' | 'data' | 'history'>('upload');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [kpiData, setKpiData] = useState<KPIRecord[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);

    try {
      const result = await uploadExcel(file);
      setUploadResult(result);
    } catch (error: any) {
      setUploadResult({
        success: false,
        message: error.response?.data?.error || 'Blad podczas uploadu pliku'
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
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
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  uploading
                    ? isDark ? 'border-blue-400 bg-blue-900/20' : 'border-blue-300 bg-blue-50'
                    : isDark ? 'border-gray-600 hover:border-blue-400' : 'border-gray-300 hover:border-blue-400'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  disabled={uploading}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <FileSpreadsheet className={`w-16 h-16 mx-auto mb-4 ${uploading ? 'text-blue-500 animate-pulse' : isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <p className={`text-lg font-medium ${textClass}`}>
                    {uploading ? 'Przetwarzanie pliku...' : 'Kliknij lub przeciagnij plik Excel'}
                  </p>
                  <p className={`text-sm ${mutedTextClass} mt-2`}>Akceptowane formaty: .xlsx, .xls</p>
                </label>
              </div>

              {uploadResult && (
                <div className={`p-4 rounded-lg ${
                  uploadResult.success
                    ? isDark ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-200'
                    : isDark ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200'
                } border`}>
                  <div className="flex items-start gap-3">
                    {uploadResult.success ? (
                      <CheckCircle className={`w-6 h-6 ${isDark ? 'text-green-400' : 'text-green-500'} flex-shrink-0`} />
                    ) : (
                      <XCircle className={`w-6 h-6 ${isDark ? 'text-red-400' : 'text-red-500'} flex-shrink-0`} />
                    )}
                    <div>
                      <p className={`font-medium ${uploadResult.success ? (isDark ? 'text-green-300' : 'text-green-800') : (isDark ? 'text-red-300' : 'text-red-800')}`}>
                        {uploadResult.message}
                      </p>
                      {uploadResult.details && (
                        <div className="mt-2 text-sm">
                          <p className={mutedTextClass}>Przetworzono: {uploadResult.details.rowsProcessed} wierszy</p>
                          <p className={isDark ? 'text-green-400' : 'text-green-600'}>Sukces: {uploadResult.details.rowsSuccess}</p>
                          {uploadResult.details.rowsFailed > 0 && (
                            <>
                              <p className={isDark ? 'text-red-400' : 'text-red-600'}>Bledy: {uploadResult.details.rowsFailed}</p>
                              <ul className={`mt-2 list-disc list-inside ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                                {uploadResult.details.errors?.slice(0, 5).map((err: string, i: number) => (
                                  <li key={i}>{err}</li>
                                ))}
                              </ul>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                <h3 className={`font-medium ${textClass} mb-2`}>Format pliku Excel</h3>
                <p className={`text-sm ${mutedTextClass}`}>
                  Kolumny: Imie i nazwisko, Stanowisko (Sourcer/Rekruter/TAC), Tydzien od, Tydzien do, Dni pracy, Weryfikacje, CV, Rekomendacje, Interviews, Placements.
                  Pracownicy sa tworzeni automatycznie.
                </p>
              </div>
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
