export type Position = 'Sourcer' | 'Rekruter' | 'TAC';

export interface Employee {
  id: number;
  name: string;
  position: Position;
  is_active: boolean;
  created_at: string;
}

export interface WeeklyKPI {
  employeeId: number;
  name: string;
  position: Position;
  weekStart: string;
  weekEnd: string;
  year: number;
  weekNumber: number;
  verifications: number;
  recommendations: number;
  interviews: number;
  placements: number;
  daysWorked: number;
  verificationsPerDay: number;
  recommendationsPerDay: number;
  targetAchievement: number;
  points: number;
}

export interface MonthlyKPI {
  employeeId: number;
  name: string;
  position: Position;
  year: number;
  month: number;
  totalVerifications: number;
  totalRecommendations: number;
  totalInterviews: number;
  totalPlacements: number;
  totalDaysWorked: number;
  verificationsPerDay: number;
  targetAchievement: number;
  points: number;
}

export interface ChampionEntry {
  rank: number;
  employeeId: number;
  name: string;
  position: Position;
  placements: number;
  interviews: number;
  recommendations: number;
  verifications: number;
  placementPoints: number;
  interviewPoints: number;
  recommendationPoints: number;
  verificationPoints: number;
  totalPoints: number;
}

export type MindyEmotion =
  | 'ecstatic'
  | 'happy'
  | 'satisfied'
  | 'neutral'
  | 'concerned'
  | 'worried'
  | 'sad'
  | 'motivated';

export interface MindyResponse {
  emotion: MindyEmotion;
  tip: string;
  stats: {
    avgTargetAchievement: number;
    topPerformer: string;
    totalPlacements: number;
    alertsCount: number;
  };
}

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'viewer';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface UploadResult {
  success: boolean;
  message: string;
  details: {
    rowsProcessed: number;
    rowsSuccess: number;
    rowsFailed: number;
    errors: string[];
  };
}

export interface TrendData {
  week_start: string;
  week_number: number;
  year: number;
  position: Position;
  total_verifications: number;
  total_recommendations: number;
  total_interviews: number;
  total_placements: number;
  total_days_worked: number;
  employee_count: number;
}

export interface SummaryData {
  monthlyTotals: {
    verifications: number;
    recommendations: number;
    interviews: number;
    placements: number;
    days_worked: number;
  };
  positionBreakdown: Array<{
    position: Position;
    employee_count: number;
    verifications: number;
    recommendations: number;
    interviews: number;
    placements: number;
  }>;
  weeklyChange: {
    current_verifications: number;
    current_placements: number;
    previous_verifications: number;
    previous_placements: number;
  };
}
