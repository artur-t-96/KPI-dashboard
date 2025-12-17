import Anthropic from '@anthropic-ai/sdk';
import db from '../db/connection';

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export interface ReportRequest {
  query: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface ReportResponse {
  type: 'question' | 'report';
  content: string;
  reportTitle?: string;
  reportData?: any;
}

const REPORT_SYSTEM_PROMPT = `Jestes asystentem AI do generowania raportow KPI dla firmy rekrutacyjnej B2B Network.

Twoje zadania:
1. Analizowac zapytania uzytkownika o raporty
2. Jesli zapytanie jest niejasne lub brakuje informacji, zadaj jedno konkretne pytanie
3. Gdy masz wszystkie informacje, wygeneruj szczegolowy raport

Dostepne dane:
- Tygodniowe KPI pracownikow (weryfikacje, CV, rekomendacje, interviews, placements)
- Dane historyczne z kilku ostatnich tygodni
- Ranking Ligi Mistrzow (punkty za aktywnosci)
- Podzial na stanowiska: Sourcer, Rekruter, TAC

Targety:
- Sourcer: 4 weryfikacje dziennie (20/tydzien przy 5 dniach pracy)
- Rekruter: 5 CV dziennie (25/tydzien przy 5 dniach pracy)
- Wszyscy: 1 placement/miesiac

System punktowy:
- Placement: 100 punktow
- Interview: 10 punktow
- Rekomendacja: 2 punkty
- Weryfikacja/CV: 1 punkt

Formaty raportow:
1. "PYTANIE: [twoje pytanie]" - jesli potrzebujesz wiecej informacji
2. "RAPORT: [tytul]
   [tresc raportu w formacie markdown z tabelami, listami, podsumowaniami]" - gdy generujesz raport

Pisz po polsku. Uzyj formatowania markdown dla raportow (tabele, listy, naglowki).`;

async function getKPIData() {
  // Get last 4 weeks of data
  const weeklyData = db.prepare(`
    SELECT
      e.name,
      e.position,
      w.week_start,
      w.week_end,
      w.verifications,
      w.cv_added,
      w.recommendations,
      w.interviews,
      w.placements,
      w.days_worked
    FROM weekly_kpi w
    JOIN employees e ON w.employee_id = e.id
    WHERE e.is_active = 1
    ORDER BY w.week_start DESC, e.name
    LIMIT 100
  `).all();

  // Get champions data
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const championsData = db.prepare(`
    SELECT
      e.name,
      e.position,
      COALESCE(SUM(w.placements), 0) as total_placements,
      COALESCE(SUM(w.interviews), 0) as total_interviews,
      COALESCE(SUM(w.recommendations), 0) as total_recommendations,
      COALESCE(SUM(w.verifications), 0) as total_verifications,
      COALESCE(SUM(w.cv_added), 0) as total_cv,
      COALESCE(SUM(w.placements * 100 + w.interviews * 10 + w.recommendations * 2 + w.verifications + w.cv_added), 0) as total_points
    FROM employees e
    LEFT JOIN weekly_kpi w ON e.id = w.employee_id AND w.year = ? AND w.month = ?
    WHERE e.is_active = 1
    GROUP BY e.id, e.name, e.position
    ORDER BY total_points DESC
  `).all(year, month);

  // Get employees count by position
  const positionCounts = db.prepare(`
    SELECT position, COUNT(*) as count
    FROM employees
    WHERE is_active = 1
    GROUP BY position
  `).all();

  return { weeklyData, championsData, positionCounts, currentYear: year, currentMonth: month };
}

export async function generateReport(request: ReportRequest): Promise<ReportResponse> {
  if (!anthropic) {
    // Fallback bez AI
    return {
      type: 'report',
      content: 'AI nie jest dostepne. Sprawdz konfiguracje ANTHROPIC_API_KEY.',
      reportTitle: 'Blad'
    };
  }

  try {
    const kpiData = await getKPIData();

    const dataContext = `
AKTUALNE DANE KPI:

Ostatnie tygodnie (do 100 rekordow):
${JSON.stringify(kpiData.weeklyData.slice(0, 30), null, 2)}

Liga Mistrzow (obecny miesiac ${kpiData.currentMonth}/${kpiData.currentYear}):
${JSON.stringify(kpiData.championsData, null, 2)}

Liczba pracownikow wg stanowiska:
${JSON.stringify(kpiData.positionCounts, null, 2)}
`;

    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    // Add conversation history if exists
    if (request.conversationHistory) {
      messages.push(...request.conversationHistory);
    }

    // Add current query
    messages.push({
      role: 'user',
      content: `${dataContext}\n\nZapytanie uzytkownika: ${request.query}`
    });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: REPORT_SYSTEM_PROMPT,
      messages: messages
    });

    if (response.content[0].type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const aiResponse = response.content[0].text;

    // Check if AI is asking a question
    if (aiResponse.startsWith('PYTANIE:')) {
      return {
        type: 'question',
        content: aiResponse.replace('PYTANIE:', '').trim()
      };
    }

    // Parse report
    if (aiResponse.startsWith('RAPORT:')) {
      const lines = aiResponse.split('\n');
      const title = lines[0].replace('RAPORT:', '').trim();
      const content = lines.slice(1).join('\n').trim();

      return {
        type: 'report',
        content: content,
        reportTitle: title,
        reportData: kpiData
      };
    }

    // Default - treat as report
    return {
      type: 'report',
      content: aiResponse,
      reportTitle: 'Raport KPI'
    };

  } catch (error) {
    console.error('Report generation error:', error);
    return {
      type: 'report',
      content: 'Wystapil blad podczas generowania raportu. Sprobuj ponownie.',
      reportTitle: 'Blad'
    };
  }
}
