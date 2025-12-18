import axios from 'axios';
import type { 
  WeeklyKPI, 
  MonthlyKPI, 
  ChampionEntry, 
  MindyResponse, 
  Employee,
  TrendData,
  SummaryData,
  UploadResult
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = async (username: string, password: string) => {
  const response = await api.post('/auth/login', { username, password });
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// KPI Data
export const getWeeklyKPI = async (week?: string): Promise<WeeklyKPI[]> => {
  const params = week ? { week } : {};
  const response = await api.get('/kpi/weekly', { params });
  return response.data;
};

export const getMonthlyKPI = async (year?: number, month?: number): Promise<MonthlyKPI[]> => {
  const params: any = {};
  if (year) params.year = year;
  if (month) params.month = month;
  const response = await api.get('/kpi/monthly', { params });
  return response.data;
};

export const getChampionsLeague = async (year?: number, month?: number): Promise<ChampionEntry[]> => {
  const params: any = {};
  if (year) params.year = year;
  if (month) params.month = month;
  const response = await api.get('/kpi/champions', { params });
  return response.data;
};

export const getChampionsLeagueWeekly = async (week?: string): Promise<ChampionEntry[]> => {
  const params = week ? { week } : {};
  const response = await api.get('/kpi/champions/weekly', { params });
  return response.data;
};

export interface ChampionEntryPerDay {
  rank: number;
  employeeId: number;
  name: string;
  position: string;
  placements: number;
  interviews: number;
  recommendations: number;
  verifications: number;
  cvAdded: number;
  totalDaysWorked: number;
  placementsPerDay: number;
  interviewsPerDay: number;
  recommendationsPerDay: number;
  verificationsPerDay: number;
  cvPerDay: number;
  totalPoints: number;
  pointsPerDay: number;
}

export const getChampionsLeagueAllTimePerDay = async (): Promise<ChampionEntryPerDay[]> => {
  const response = await api.get('/kpi/champions/all-time-per-day');
  return response.data;
};

export const getTrends = async (): Promise<TrendData[]> => {
  // Fetch all trend data without week limit
  const response = await api.get('/kpi/trends');
  return response.data;
};

export const getSummary = async (): Promise<SummaryData> => {
  const response = await api.get('/kpi/summary');
  return response.data;
};

export const getEmployees = async (): Promise<Employee[]> => {
  const response = await api.get('/kpi/employees');
  return response.data;
};

export const getAvailableWeeks = async () => {
  const response = await api.get('/kpi/weeks');
  return response.data;
};

export const getAvailableMonths = async () => {
  const response = await api.get('/kpi/months');
  return response.data;
};

export interface AllTimePlacement {
  employee_id: number;
  name: string;
  position: string;
  total_placements: number;
  total_interviews: number;
  total_recommendations: number;
  first_week: string;
  last_week: string;
}

export const getAllTimePlacements = async (): Promise<AllTimePlacement[]> => {
  const response = await api.get('/kpi/all-time-placements');
  return response.data;
};

export interface AllTimeVerifications {
  employeeId: number;
  name: string;
  position: string;
  totalVerifications: number;
  totalCvAdded: number;
  totalDaysWorked: number;
  verificationsPerDay: number;
  cvPerDay: number;
}

export const getAllTimeVerifications = async (): Promise<AllTimeVerifications[]> => {
  const response = await api.get('/kpi/all-time-verifications');
  return response.data;
};

export interface YearlyKPI {
  employeeId: number;
  name: string;
  position: string;
  year: number;
  totalVerifications: number;
  totalCvAdded: number;
  totalRecommendations: number;
  totalInterviews: number;
  totalPlacements: number;
  totalDaysWorked: number;
  verificationsPerDay: number;
  cvPerDay: number;
  targetAchievement: number;
}

export const getYearlyKPI = async (year?: number): Promise<YearlyKPI[]> => {
  const params: any = {};
  if (year) params.year = year;
  const response = await api.get('/kpi/yearly', { params });
  return response.data;
};

export interface MonthlyTrend {
  year: number;
  month: number;
  totalVerifications: number;
  totalInterviews: number;
  totalPlacements: number;
  verificationsPerPlacement: number | null;
  interviewsPerPlacement: number | null;
}

export const getMonthlyTrend = async (): Promise<MonthlyTrend[]> => {
  const response = await api.get('/kpi/monthly-trend');
  return response.data;
};

export interface WeeklyVerificationTrend {
  weekStart: string;
  year: number;
  weekNumber: number;
  totalVerifications: number;
  employeeCount: number;
  avgVerificationsPerPerson: number;
}

export const getWeeklyVerificationTrend = async (): Promise<WeeklyVerificationTrend[]> => {
  const response = await api.get('/kpi/weekly-verification-trend');
  return response.data;
};

export interface WeeklyCvTrend {
  weekStart: string;
  year: number;
  weekNumber: number;
  totalCv: number;
  employeeCount: number;
  avgCvPerPerson: number;
}

export const getWeeklyCvTrend = async (): Promise<WeeklyCvTrend[]> => {
  const response = await api.get('/kpi/weekly-cv-trend');
  return response.data;
};

export interface WeeklyInterviewsTrend {
  weekStart: string;
  year: number;
  weekNumber: number;
  totalInterviews: number;
  employeeCount: number;
  avgInterviewsPerPerson: number;
}

export const getWeeklyInterviewsTrend = async (): Promise<WeeklyInterviewsTrend[]> => {
  const response = await api.get('/kpi/weekly-interviews-trend');
  return response.data;
};

export interface WeeklyPlacementsTrend {
  weekStart: string;
  year: number;
  weekNumber: number;
  totalPlacements: number;
  employeeCount: number;
  avgPlacementsPerPerson: number;
}

export const getWeeklyPlacementsTrend = async (): Promise<WeeklyPlacementsTrend[]> => {
  const response = await api.get('/kpi/weekly-placements-trend');
  return response.data;
};

// Individual Employee Trends
export interface EmployeeTrendData {
  employee: {
    id: number;
    name: string;
    position: string;
    is_active: number;
  };
  kpiData: Array<{
    week_start: string;
    week_end: string;
    year: number;
    week_number: number;
    month: number;
    verifications: number;
    cv_added: number;
    recommendations: number;
    interviews: number;
    placements: number;
    days_worked: number;
  }>;
  teamAverages: Array<{
    week_start: string;
    avg_verifications: number;
    avg_cv: number;
    avg_interviews: number;
    avg_placements: number;
  }>;
}

export const getEmployeeTrends = async (employeeId: number): Promise<EmployeeTrendData> => {
  const response = await api.get(`/kpi/employee/${employeeId}/trends`);
  return response.data;
};

// Mindy
export const getMindyResponse = async (): Promise<MindyResponse> => {
  const response = await api.get('/mindy');
  return response.data;
};

// Admin - Upload
export type UploadType = 'body-leasing' | 'sales' | 'supervisory-board';

export const uploadExcel = async (file: File, type: UploadType = 'body-leasing'): Promise<UploadResult> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  const response = await api.post('/admin', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const getUploadHistory = async () => {
  const response = await api.get('/admin/history');
  return response.data;
};

export const getAllKPIData = async () => {
  const response = await api.get('/admin/data');
  return response.data;
};

export const deleteAllData = async () => {
  const response = await api.delete('/admin/all-data');
  return response.data;
};

// Admin - Data Management
export const deleteWeekData = async (weekStart: string) => {
  const response = await api.delete(`/admin/week/${weekStart}`);
  return response.data;
};

export const deleteRecord = async (id: number) => {
  const response = await api.delete(`/admin/record/${id}`);
  return response.data;
};

export const updateRecord = async (id: number, data: Partial<WeeklyKPI>) => {
  const response = await api.put(`/admin/record/${id}`, data);
  return response.data;
};

// Admin - Employees
export const addEmployee = async (name: string, position: string) => {
  const response = await api.post('/admin/employee', { name, position });
  return response.data;
};

export const updateEmployee = async (id: number, data: Partial<Employee>) => {
  const response = await api.put(`/admin/employee/${id}`, data);
  return response.data;
};

export const deleteEmployee = async (id: number) => {
  const response = await api.delete(`/admin/employee/${id}`);
  return response.data;
};

// Reports
export interface ReportResponse {
  type: 'question' | 'report';
  content: string;
  reportTitle?: string;
  reportId?: string;
  expiresAt?: string;
}

export interface SavedReport {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  expiresAt: string;
  remainingMinutes: number;
}

export const generateReport = async (
  query: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<ReportResponse> => {
  const response = await api.post('/reports/generate', { query, conversationHistory });
  return response.data;
};

export const getReports = async (): Promise<SavedReport[]> => {
  const response = await api.get('/reports');
  return response.data;
};

export const getReport = async (id: string): Promise<SavedReport> => {
  const response = await api.get(`/reports/${id}`);
  return response.data;
};

export const deleteReport = async (id: string) => {
  const response = await api.delete(`/reports/${id}`);
  return response.data;
};

export default api;
