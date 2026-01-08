import { useState, useEffect, useCallback } from 'react';
import {
  getWeeklyKPI,
  getMonthlyKPI,
  getYearlyKPI,
  getChampionsLeague,
  getChampionsLeagueWeekly,
  getChampionsLeagueAllTimePerDay,
  getTrends,
  getSummary,
  getAvailableWeeks,
  getAvailableMonths,
  getAllTimePlacements,
  getAllTimeVerifications,
  getMonthlyTrend,
  getWeeklyVerificationTrend,
  getWeeklyInterviewsTrend,
  getWeeklyPlacementsTrend,
  getEmployees,
  AllTimePlacement,
  AllTimeVerifications,
  MonthlyTrend,
  WeeklyVerificationTrend,
  WeeklyInterviewsTrend,
  WeeklyPlacementsTrend,
  YearlyKPI,
  ChampionEntryPerDay
} from '../services/api';
import type { WeeklyKPI, MonthlyKPI, ChampionEntry, TrendData, SummaryData, Employee } from '../types';

export function useKPIData() {
  const [weeklyData, setWeeklyData] = useState<WeeklyKPI[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyKPI[]>([]);
  const [yearlyData, setYearlyData] = useState<YearlyKPI[]>([]);
  const [championsData, setChampionsData] = useState<ChampionEntry[]>([]);
  const [championsWeeklyData, setChampionsWeeklyData] = useState<ChampionEntry[]>([]);
  const [championsAllTimePerDay, setChampionsAllTimePerDay] = useState<ChampionEntryPerDay[]>([]);
  const [trendsData, setTrendsData] = useState<TrendData[]>([]);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [allTimePlacements, setAllTimePlacements] = useState<AllTimePlacement[]>([]);
  const [allTimeVerifications, setAllTimeVerifications] = useState<AllTimeVerifications[]>([]);
  const [monthlyTrendData, setMonthlyTrendData] = useState<MonthlyTrend[]>([]);
  const [weeklyVerificationTrend, setWeeklyVerificationTrend] = useState<WeeklyVerificationTrend[]>([]);
  const [weeklyInterviewsTrend, setWeeklyInterviewsTrend] = useState<WeeklyInterviewsTrend[]>([]);
  const [weeklyPlacementsTrend, setWeeklyPlacementsTrend] = useState<WeeklyPlacementsTrend[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [availableWeeks, setAvailableWeeks] = useState<any[]>([]);
  const [availableMonths, setAvailableMonths] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedWeek, setSelectedWeek] = useState<string | undefined>();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [weekly, monthly, yearly, champions, championsWeekly, championsAllTime, trends, summary, allTime, allTimeVer, monthlyTrend, weeklyVerTrend, weeklyIntTrend, weeklyPlacTrend, employeesList, weeks, months] = await Promise.all([
        getWeeklyKPI(selectedWeek),
        getMonthlyKPI(selectedYear, selectedMonth),
        getYearlyKPI(selectedYear),
        getChampionsLeague(selectedYear, selectedMonth),
        getChampionsLeagueWeekly(selectedWeek),
        getChampionsLeagueAllTimePerDay(),
        getTrends(), // Fetch all trend data
        getSummary(),
        getAllTimePlacements(),
        getAllTimeVerifications(),
        getMonthlyTrend(),
        getWeeklyVerificationTrend(),
        getWeeklyInterviewsTrend(),
        getWeeklyPlacementsTrend(),
        getEmployees(),
        getAvailableWeeks(),
        getAvailableMonths()
      ]);

      setWeeklyData(weekly);
      setMonthlyData(monthly);
      setYearlyData(yearly);
      setChampionsData(champions);
      setChampionsWeeklyData(championsWeekly);
      setChampionsAllTimePerDay(championsAllTime);
      setTrendsData(trends);
      setSummaryData(summary);
      setAllTimePlacements(allTime);
      setAllTimeVerifications(allTimeVer);
      setMonthlyTrendData(monthlyTrend);
      setWeeklyVerificationTrend(weeklyVerTrend);
      setWeeklyInterviewsTrend(weeklyIntTrend);
      setWeeklyPlacementsTrend(weeklyPlacTrend);
      setEmployees(employeesList);
      setAvailableWeeks(weeks);
      setAvailableMonths(months);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch KPI data');
    } finally {
      setLoading(false);
    }
  }, [selectedWeek, selectedYear, selectedMonth]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const refreshData = () => {
    fetchAllData();
  };

  // Group weekly data by position
  const weeklyByPosition = {
    Sourcer: weeklyData.filter(d => d.position === 'Sourcer'),
    Rekruter: weeklyData.filter(d => d.position === 'Rekruter'),
    TAC: weeklyData.filter(d => d.position === 'TAC')
  };

  // Group monthly data by position
  const monthlyByPosition = {
    Sourcer: monthlyData.filter(d => d.position === 'Sourcer'),
    Rekruter: monthlyData.filter(d => d.position === 'Rekruter'),
    TAC: monthlyData.filter(d => d.position === 'TAC')
  };

  // Calculate team averages
  const teamAverages = {
    verifications: weeklyData.reduce((sum, d) => sum + d.verificationsPerDay, 0) / (weeklyData.length || 1),
    targetAchievement: weeklyData.reduce((sum, d) => sum + d.targetAchievement, 0) / (weeklyData.length || 1)
  };

  return {
    weeklyData,
    monthlyData,
    yearlyData,
    championsData,
    championsWeeklyData,
    championsAllTimePerDay,
    trendsData,
    summaryData,
    allTimePlacements,
    allTimeVerifications,
    monthlyTrendData,
    weeklyVerificationTrend,
    weeklyInterviewsTrend,
    weeklyPlacementsTrend,
    employees,
    weeklyByPosition,
    monthlyByPosition,
    teamAverages,
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
  };
}
