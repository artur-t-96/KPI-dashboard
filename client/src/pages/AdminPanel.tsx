import { useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { uploadExcel, getUploadHistory, getEmployees, addEmployee, deleteEmployee } from '../services/api';
import { Upload, FileSpreadsheet, Users, History, Plus, Trash2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { Employee } from '../types';

export default function AdminPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'upload' | 'employees' | 'history'>('upload');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: '', position: 'Sourcer' });
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
        message: error.response?.data?.error || 'Błąd podczas uploadu pliku'
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (error) {
      console.error('Failed to load employees:', error);
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

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployee.name.trim()) return;

    try {
      await addEmployee(newEmployee.name, newEmployee.position);
      setNewEmployee({ name: '', position: 'Sourcer' });
      loadEmployees();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Błąd dodawania pracownika');
    }
  };

  const handleDeleteEmployee = async (id: number, name: string) => {
    if (!confirm(`Czy na pewno chcesz dezaktywować pracownika ${name}?`)) return;

    try {
      await deleteEmployee(id);
      loadEmployees();
    } catch (error) {
      alert('Błąd dezaktywacji pracownika');
    }
  };

  // Load data when tab changes
  const handleTabChange = (tab: 'upload' | 'employees' | 'history') => {
    setActiveTab(tab);
    if (tab === 'employees') loadEmployees();
    if (tab === 'history') loadHistory();
  };

  if (user?.role !== 'admin') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-yellow-800">Brak dostępu</h2>
        <p className="text-yellow-700 mt-2">Ta sekcja jest dostępna tylko dla administratorów.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">⚙️ Panel Administratora</h1>
        <p className="text-gray-600">Zarządzaj danymi KPI, pracownikami i uploadami.</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b">
          <button
            onClick={() => handleTabChange('upload')}
            className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 font-medium transition-colors ${
              activeTab === 'upload' 
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Upload className="w-5 h-5" />
            Upload Excel
          </button>
          <button
            onClick={() => handleTabChange('employees')}
            className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 font-medium transition-colors ${
              activeTab === 'employees' 
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Users className="w-5 h-5" />
            Pracownicy
          </button>
          <button
            onClick={() => handleTabChange('history')}
            className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 font-medium transition-colors ${
              activeTab === 'history' 
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <History className="w-5 h-5" />
            Historia uploadów
          </button>
        </div>

        <div className="p-6">
          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  uploading ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
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
                  <FileSpreadsheet className={`w-16 h-16 mx-auto mb-4 ${uploading ? 'text-blue-500 animate-pulse' : 'text-gray-400'}`} />
                  <p className="text-lg font-medium text-gray-700">
                    {uploading ? 'Przetwarzanie pliku...' : 'Kliknij lub przeciągnij plik Excel'}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Akceptowane formaty: .xlsx, .xls
                  </p>
                </label>
              </div>

              {uploadResult && (
                <div className={`p-4 rounded-lg ${uploadResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-start gap-3">
                    {uploadResult.success ? (
                      <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                    )}
                    <div>
                      <p className={`font-medium ${uploadResult.success ? 'text-green-800' : 'text-red-800'}`}>
                        {uploadResult.message}
                      </p>
                      {uploadResult.details && (
                        <div className="mt-2 text-sm">
                          <p>Przetworzono: {uploadResult.details.rowsProcessed} wierszy</p>
                          <p className="text-green-600">Sukces: {uploadResult.details.rowsSuccess}</p>
                          {uploadResult.details.rowsFailed > 0 && (
                            <>
                              <p className="text-red-600">Błędy: {uploadResult.details.rowsFailed}</p>
                              <ul className="mt-2 list-disc list-inside text-red-600">
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

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-2">📋 Format pliku Excel</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Plik powinien zawierać następujące kolumny w arkuszu "Dane tygodniowe":
                </p>
                <div className="overflow-x-auto">
                  <table className="text-sm w-full">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="px-2 py-1 text-left">A</th>
                        <th className="px-2 py-1 text-left">B</th>
                        <th className="px-2 py-1 text-left">C</th>
                        <th className="px-2 py-1 text-left">D</th>
                        <th className="px-2 py-1 text-left">E</th>
                        <th className="px-2 py-1 text-left">F</th>
                        <th className="px-2 py-1 text-left">G</th>
                        <th className="px-2 py-1 text-left">H</th>
                        <th className="px-2 py-1 text-left">I</th>
                        <th className="px-2 py-1 text-left">J</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="px-2 py-1">Imię i nazwisko</td>
                        <td className="px-2 py-1">Stanowisko</td>
                        <td className="px-2 py-1">Tydzień od</td>
                        <td className="px-2 py-1">Tydzień do</td>
                        <td className="px-2 py-1">Dni pracy</td>
                        <td className="px-2 py-1">Weryfikacje</td>
                        <td className="px-2 py-1">CV dodane</td>
                        <td className="px-2 py-1">Rekomendacje</td>
                        <td className="px-2 py-1">Interviews</td>
                        <td className="px-2 py-1">Placements</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Employees Tab */}
          {activeTab === 'employees' && (
            <div className="space-y-6">
              {/* Add Employee Form */}
              <form onSubmit={handleAddEmployee} className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Imię i nazwisko</label>
                  <input
                    type="text"
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Jan Kowalski"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stanowisko</label>
                  <select
                    value={newEmployee.position}
                    onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Sourcer">Sourcer</option>
                    <option value="Rekruter">Rekruter</option>
                    <option value="TAC">TAC</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Dodaj
                </button>
              </form>

              {/* Employees List */}
              {loading ? (
                <div className="text-center py-8 text-gray-500">Ładowanie...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">ID</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Imię i nazwisko</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Stanowisko</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Akcje</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {employees.map((emp) => (
                        <tr key={emp.id} className={`hover:bg-gray-50 ${!emp.is_active ? 'opacity-50' : ''}`}>
                          <td className="px-4 py-3 text-gray-500">{emp.id}</td>
                          <td className="px-4 py-3 font-medium">{emp.name}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              emp.position === 'Sourcer' ? 'bg-blue-100 text-blue-800' :
                              emp.position === 'Rekruter' ? 'bg-green-100 text-green-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {emp.position}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              emp.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {emp.is_active ? 'Aktywny' : 'Nieaktywny'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {emp.is_active && (
                              <button
                                onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                                className="text-red-600 hover:text-red-800"
                                title="Dezaktywuj"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Ładowanie...</div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Brak historii uploadów</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Data</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Plik</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Użytkownik</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Wiersze</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Sukces</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Błędy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {history.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">
                            {new Date(item.uploaded_at).toLocaleString('pl-PL')}
                          </td>
                          <td className="px-4 py-3 font-medium">{item.filename}</td>
                          <td className="px-4 py-3">{item.uploaded_by_name}</td>
                          <td className="px-4 py-3 text-center">{item.rows_processed}</td>
                          <td className="px-4 py-3 text-center text-green-600">{item.rows_success}</td>
                          <td className="px-4 py-3 text-center text-red-600">{item.rows_failed}</td>
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
