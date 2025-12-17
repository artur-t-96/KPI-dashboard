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

// Mindy
export const getMindyResponse = async (): Promise<MindyResponse> => {
  const response = await api.get('/mindy');
  return response.data;
};

// Admin - Upload
export const uploadExcel = async (file: File): Promise<UploadResult> => {
  const formData = new FormData();
  formData.append('file', file);
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
