# 📊 KPI Dashboard - B2B Network

System webowy do prezentacji i zarządzania danymi KPI dla firmy rekrutacyjnej B2B Network S.A.

## ✨ Funkcjonalności

- **Body Leasing KPI** - wyniki tygodniowe/miesięczne dla Sourcerów, Rekruterów i TAC
- **Liga Mistrzów** - ranking punktowy (100 pkt placement, 10 pkt interview, 2 pkt rekomendacja)
- **Mindy AI** - inteligentna maskotka z Claude API
- **Panel Admina** - upload Excel, zarządzanie pracownikami
- **Wykresy** - trendy, porównania, gauges

## 🛠️ Stack

- **Frontend:** React + TypeScript + Tailwind CSS + Recharts
- **Backend:** Node.js + Express
- **Baza danych:** SQLite (plik na dysku)
- **AI:** Claude API (Anthropic)

---

## 🚀 Deployment na Render (jeden Web Service)

### 1. Utwórz Web Service

1. [render.com](https://render.com) → **New** → **Web Service**
2. Połącz z repozytorium GitHub
3. Ustawienia:

| Pole | Wartość |
|------|---------|
| **Name** | `kpi-dashboard` |
| **Root Directory** | `server` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |

### 2. Dodaj Disk (dla SQLite)

W zakładce **Disks**:
- **Name:** `kpi-data`
- **Mount Path:** `/data`
- **Size:** `1 GB`

### 3. Ustaw Environment Variables

| Zmienna | Wartość |
|---------|---------|
| `NODE_ENV` | `production` |
| `DATA_DIR` | `/data` |
| `JWT_SECRET` | *(wygeneruj losowy string)* |
| `ANTHROPIC_API_KEY` | *(twój klucz Claude - opcjonalny)* |
| `ADMIN_PASSWORD` | *(hasło admina)* |

### 4. Deploy!

Render automatycznie zbuduje i uruchomi aplikację.

**Pierwszy start:** Baza danych zostanie automatycznie utworzona z przykładowymi danymi.

---

## 💻 Instalacja lokalna

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

# 3. Uruchom (w dwóch terminalach)
# Terminal 1 - backend:
cd server && npm run dev

# Terminal 2 - frontend:
cd client && npm run dev

# 4. Otwórz http://localhost:5173
```

## 🔑 Logowanie

- **Login:** `admin`
- **Hasło:** `admin123` (lub wartość `ADMIN_PASSWORD`)

---

## 📊 Format Excel

| Kolumna | Przykład |
|---------|----------|
| Imię i nazwisko | Anna Kowalska |
| Stanowisko | Sourcer / Rekruter / TAC |
| Tydzień od | 2025-01-13 |
| Tydzień do | 2025-01-19 |
| Dni przepracowane | 5 |
| Weryfikacje | 22 |
| CV dodane | 0 |
| Rekomendacje | 5 |
| Interviews | 2 |
| Placements | 1 |

---

## 🎯 Targety

| Stanowisko | Dzienny | Miesięczny |
|------------|---------|------------|
| Sourcer | 4 weryfikacje | 1 placement |
| Rekruter | 5 CV | 1 placement |
| TAC | - | 1 placement |

## 🏆 Punktacja Ligi Mistrzów

| Akcja | Punkty |
|-------|--------|
| Placement | 100 |
| Interview | 10 |
| Rekomendacja | 2 |
| Weryfikacja | 1 |
| CV dodane | 1 |

---

© 2025 B2B Network S.A.
