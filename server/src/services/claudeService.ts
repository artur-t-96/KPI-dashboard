import Anthropic from '@anthropic-ai/sdk';
import db from '../db/connection';

const anthropic = process.env.ANTHROPIC_API_KEY 
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const MINDY_SYSTEM_PROMPT = `Jesteś Mindy - przyjazną maskotką-robotem systemu KPI dla firmy rekrutacyjnej B2B Network.

Twoja rola to:
1. Analizować dane KPI zespołu
2. Dawać spersonalizowane, konkretne wskazówki
3. Motywować i wspierać zespół
4. Ostrzegać gdy ktoś jest poniżej targetu

Zasady:
- Mów po polsku
- Bądź konkretna i zwięzła (max 2-3 zdania)
- Używaj imion pracowników
- Podawaj konkretne liczby
- Bądź pozytywna ale szczera
- Dostosuj ton do sytuacji (celebracja sukcesu vs delikatne ostrzeżenie)
- Używaj emoji na początku wypowiedzi

Targety:
- Sourcer: 4 weryfikacje dziennie (20/tydzień przy 5 dniach pracy), 1 placement/miesiąc
- Rekruter: 5 CV do bazy dziennie (25/tydzień przy 5 dniach pracy), 1 placement/miesiąc  
- TAC: 1 placement/miesiąc

System punktowy Ligi Mistrzów:
- Placement: 100 punktów
- Interview: 10 punktów
- Rekomendacja: 2 punkty
- Weryfikacja: 1 punkt
- CV dodane: 1 punkt`;

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

export async function getMindyResponse(): Promise<MindyResponse> {
  try {
    const currentData = getCurrentWeekData();
    const championsData = getChampionsData();
    
    const stats = calculateStats(currentData, championsData);
    const emotion = determineEmotion(stats.avgTargetAchievement);
    
    let tip = getDefaultTip(stats, emotion);
    
    if (anthropic && currentData.length > 0) {
      try {
        const aiTip = await getAITip(currentData, championsData);
        if (aiTip) tip = aiTip;
      } catch (error) {
        console.error('Claude API error:', error);
      }
    }
    
    return { emotion, tip, stats };
  } catch (error) {
    console.error('Mindy service error:', error);
    return {
      emotion: 'neutral',
      tip: '🤖 Cześć! Jestem Mindy. Załaduj dane KPI, a dam Ci wskazówki dla zespołu!',
      stats: {
        avgTargetAchievement: 0,
        topPerformer: '-',
        totalPlacements: 0,
        alertsCount: 0
      }
    };
  }
}

function getCurrentWeekData() {
  const query = `
    SELECT 
      e.name,
      e.position,
      w.verifications,
      w.cv_added,
      w.recommendations,
      w.interviews,
      w.placements,
      w.days_worked
    FROM weekly_kpi w
    JOIN employees e ON w.employee_id = e.id
    WHERE w.week_start = (SELECT MAX(week_start) FROM weekly_kpi)
    AND e.is_active = 1
  `;
  return db.prepare(query).all() as any[];
}

function getChampionsData() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  
  const query = `
    SELECT 
      e.name,
      COALESCE(SUM(w.placements * 100 + w.interviews * 10 + w.recommendations * 2 + w.verifications + w.cv_added), 0) as total_points
    FROM employees e
    LEFT JOIN weekly_kpi w ON e.id = w.employee_id AND w.year = ? AND w.month = ?
    WHERE e.is_active = 1
    GROUP BY e.id, e.name
    ORDER BY total_points DESC
    LIMIT 10
  `;
  return db.prepare(query).all(year, month) as any[];
}

function calculateStats(weeklyData: any[], championsData: any[]) {
  let totalAchievement = 0;
  let count = 0;
  let alerts = 0;
  let totalPlacements = 0;
  
  for (const row of weeklyData) {
    const daysWorked = row.days_worked || 1;
    let targetAchievement = 0;
    
    if (row.position === 'Sourcer') {
      const target = daysWorked * 4;
      targetAchievement = target > 0 ? (row.verifications / target) * 100 : 0;
    } else if (row.position === 'Rekruter') {
      const target = daysWorked * 5;
      targetAchievement = target > 0 ? (row.cv_added / target) * 100 : 0;
    } else {
      targetAchievement = row.placements > 0 ? 100 : 50;
    }
    
    totalAchievement += targetAchievement;
    count++;
    
    if (targetAchievement < 70) alerts++;
    totalPlacements += row.placements || 0;
  }
  
  const topPerformer = championsData.length > 0 ? championsData[0].name : '-';
  
  return {
    avgTargetAchievement: count > 0 ? Math.round(totalAchievement / count) : 0,
    topPerformer,
    totalPlacements,
    alertsCount: alerts
  };
}

function determineEmotion(avgTarget: number): MindyEmotion {
  if (avgTarget >= 120) return 'ecstatic';
  if (avgTarget >= 100) return 'happy';
  if (avgTarget >= 80) return 'satisfied';
  if (avgTarget >= 60) return 'neutral';
  if (avgTarget >= 40) return 'concerned';
  if (avgTarget >= 20) return 'worried';
  return 'sad';
}

function getDefaultTip(stats: any, emotion: MindyEmotion): string {
  const tips: Record<MindyEmotion, string> = {
    ecstatic: `🎉 Fantastyczny wynik! Średnia realizacja targetu: ${stats.avgTargetAchievement}%! Zespół daje radę!`,
    happy: `😊 Świetna robota! ${stats.topPerformer} prowadzi w Lidze Mistrzów. Kontynuujcie dobrą passę!`,
    satisfied: `🙂 Dobra praca zespołu! Średnia ${stats.avgTargetAchievement}% targetu. Jeszcze trochę do 100%!`,
    neutral: `😐 Zespół pracuje stabilnie. Średnia realizacja: ${stats.avgTargetAchievement}%. Możemy więcej!`,
    concerned: `😟 Uwaga! ${stats.alertsCount} osób poniżej targetu. Sprawdźmy co możemy poprawić.`,
    worried: `😰 Potrzebujemy mobilizacji! Tylko ${stats.avgTargetAchievement}% targetu. Działamy!`,
    sad: `😢 Trudny tydzień... Ale każdy dzień to nowa szansa. Wspierajmy się nawzajem!`,
    motivated: `🔥 ${stats.totalPlacements} placementów! Rekordowy wynik! Kto jeszcze dołoży?`
  };
  
  return tips[emotion];
}

async function getAITip(weeklyData: any[], championsData: any[]): Promise<string | null> {
  if (!anthropic) return null;
  
  const dataContext = JSON.stringify({
    currentWeek: weeklyData.slice(0, 5),
    topPerformers: championsData.slice(0, 3)
  });
  
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 200,
    system: MINDY_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Oto aktualne dane KPI zespołu: ${dataContext}. 
               Daj jedną krótką, spersonalizowaną wskazówkę lub pochwałę (max 2 zdania).
               Użyj emoji na początku.`
    }]
  });
  
  if (message.content[0].type === 'text') {
    return message.content[0].text;
  }
  
  return null;
}
