# KPI Dashboard - B2B Network

System webowy do prezentacji i zarządzania danymi KPI dla firmy rekrutacyjnej B2B Network S.A.

## Funkcjonalności

- **Body Leasing KPI** - wyniki tygodniowe/miesięczne dla Sourcerów, Rekruterów i TAC
- **Liga Mistrzów** - ranking punktowy (100 pkt placement, 10 pkt interview, 2 pkt rekomendacja, 1 pkt weryfikacja)
- **Mindy AI** - inteligentna maskotka z Claude API
- **Panel Admina** - upload Excel, zarządzanie pracownikami
- **Wykresy** - trendy, porównania, gauges

## Stack

- **Frontend:** React + TypeScript + Tailwind CSS + Recharts
- **Backend:** Node.js + Express
- **Baza danych:** SQLite (plik na dysku)
- **AI:** Claude API (Anthropic)

---

## Deployment na Render (jeden Web Service)

### 1. Utwórz Web Service

1. [render.com](https://render.com) -> **New** -> **Web Service**
2. Polacz z repozytorium GitHub
3. Ustawienia:

| Pole | Wartosc |
|------|---------|
| **Name** | `kpi-dashboard` |
| **Root Directory** | `server` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |

### 2. Dodaj Disk (dla SQLite)

W zakladce **Disks**:
- **Name:** `kpi-data`
- **Mount Path:** `/data`
- **Size:** `1 GB`

### 3. Ustaw Environment Variables

| Zmienna | Wartosc |
|---------|---------|
| `NODE_ENV` | `production` |
| `DATA_DIR` | `/data` |
| `JWT_SECRET` | *(wygeneruj losowy string)* |
| `ANTHROPIC_API_KEY` | *(twoj klucz Claude - opcjonalny)* |
| `ADMIN_PASSWORD` | *(haslo admina)* |

### 4. Deploy!

Render automatycznie zbuduje i uruchomi aplikacje.

**Pierwszy start:** Baza danych zostanie automatycznie utworzona z przykladowymi danymi.

---

## Instalacja lokalna

```bash
# 1. Sklonuj i zainstaluj
git clone <repo>
cd kpi-dashboard
cd server && npm install
cd ../client && npm install

# 2. Skonfiguruj
cd ../server
cp .env.example .env
# Edytuj .env

# 3. Uruchom (w dwoch terminalach)
# Terminal 1 - backend:
cd server && npm run dev

# Terminal 2 - frontend:
cd client && npm run dev

# 4. Otworz http://localhost:5173
```

## Logowanie

- **Login:** `admin`
- **Haslo:** `admin123` (lub wartosc `ADMIN_PASSWORD`)

---

## Format Excel

| Kolumna | Przyklad | Uwagi |
|---------|----------|-------|
| Imie i nazwisko | Anna Kowalska | |
| Stanowisko | Sourcer / Rekruter / TAC | |
| Tydzien od | 2025-01-13 | |
| Tydzien do | 2025-01-19 | |
| Dni przepracowane | 5 | |
| Weryfikacje | 22 | |
| CV dodane | - | **IGNOROWANE** |
| Rekomendacje | 5 | |
| Interviews | 2 | |
| Placements | 1 | |

> **UWAGA:** Kolumna "CV dodane" jest calkowicie ignorowana przez system. Dane CV nie sa przetwarzane, przechowywane ani raportowane.

---

## Targety

| Stanowisko | Dzienny | Miesieczny |
|------------|---------|------------|
| Sourcer | 4 weryfikacje | 1 placement |
| Rekruter | 2 interviews | 1 placement |
| TAC | - | 1 placement |

## Punktacja Ligi Mistrzow

| Akcja | Punkty |
|-------|--------|
| Placement | 100 |
| Interview | 10 |
| Rekomendacja | 2 |
| Weryfikacja | 1 |

> **WAZNE:** Wolumen CV jest calkowicie wykluczony z systemu - dane CV nie sa przetwarzane, nie sa wyswietlane w raportach i nie wplywaja na zadne metryki.

## Persystencja Danych

Dane sa przechowywane w trybie przyrostowym (incremental):
- Nowe uploady **dodaja wartosci** do istniejacych rekordow zamiast je nadpisywac
- Historyczne dane nigdy nie sa resetowane ani usuwane
- Kazdy upload tworzy pelny obraz od poczatku projektu

---

(c) 2025 B2B Network S.A.
