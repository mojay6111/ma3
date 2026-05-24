# Ma3 🚌
### *Jua Ma3 Yako — Know Your Matatu*

> Real-time matatu fleet intelligence for Nairobi, powered by machine learning and Africa's Talking APIs.

Built for the **Africa's Talking Transportation & Logistics Hackathon** — May 28, 2026.

---

## The Problem

Every day, 3 million Nairobi commuters ask the same question — **lini ma3 inakuja?**

Nobody knows. Not the commuter at the stage. Not the SACCO manager at the office. Not even the driver. Matatu SACCOs operate blind — no fleet visibility, no demand forecasting, no driver accountability. Everything runs on cash and guesswork.

---

## The Solution

Ma3 is a three-sided intelligence platform connecting every actor in the matatu ecosystem:

| User | Interface | Needs |
|---|---|---|
| **Commuter** | SMS + USSD | Real-time ETA, cashless fare — no smartphone, no data |
| **Driver** | USSD `*384#` | Route check-in, wallet, daily score |
| **SACCO Manager** | Web dashboard | Fleet map, demand forecast, driver leaderboard |

No app download. No smartphone required. Works on any Safaricom line.

---

## Live Demo Flow

```
Driver dials *384#
    → checks in at CBD stage
        → telemetry hits backend
            → ML predicts ETA
                → Commuter texts WESTLANDS
                    → gets SMS: "Ma3 46 inakuja in ~4 min. KSh 50."
                        → SACCO manager sees dot move on map
```

---

## ML Models

Three models, each solving a real operational problem:

| Model | Algorithm | Problem | Metric |
|---|---|---|---|
| ETA Prediction | LSTM (Keras) | When does the next matatu arrive? | MAE: **0.65 min** |
| Demand Forecast | XGBoost | Which routes need more vehicles? | R²: **0.9564** |
| Driver Scoring | Isolation Forest | Who is driving dangerously? | ROC-AUC: **1.0000** |

All models trained on synthetic Nairobi route data — real stop coordinates, real peak hour patterns, real SACCO structures.

---

## Africa's Talking APIs

| API | Usage |
|---|---|
| **SMS** | Commuter ETA alerts, fare receipts, end-of-shift driver summaries |
| **USSD** | Driver check-ins via `*384#`, wallet balance, passenger count input |
| **Payments** | M-Pesa STK push for cashless fares, driver wallet disbursement |

---

## Tech Stack

```
Backend          FastAPI + SQLAlchemy (async) + PostgreSQL
ML               TensorFlow/Keras · XGBoost · scikit-learn
Dashboard        Next.js 15 · Tailwind CSS · Leaflet.js
Real-time        WebSockets (FastAPI) → Next.js live updates
SMS/USSD         Africa's Talking SDK
Payments         Africa's Talking Payments → M-Pesa STK Push
Infra            Docker Compose
Dev Environment  WSL2 Ubuntu 24.04 · Conda (datascience env)
```

---

## Project Structure

```
ma3/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers
│   │   │   ├── telemetry.py    # GPS ingestion + WebSocket broadcast
│   │   │   ├── ussd.py         # USSD handler (*384#)
│   │   │   ├── sms.py          # Incoming SMS → ETA response
│   │   │   ├── predict.py      # ML inference endpoints
│   │   │   ├── drivers.py      # Driver CRUD + leaderboard
│   │   │   ├── vehicles.py     # Vehicle CRUD
│   │   │   └── payments.py     # M-Pesa fare collection
│   │   ├── core/
│   │   │   ├── config.py       # Pydantic settings
│   │   │   ├── at_service.py   # Africa's Talking wrapper
│   │   │   └── ws_manager.py   # WebSocket connection manager
│   │   ├── db/
│   │   │   ├── models.py       # SQLAlchemy models
│   │   │   ├── session.py      # Async DB session
│   │   │   └── seed.py         # Nairobi routes, stops, drivers
│   │   └── ml/
│   │       ├── loader.py       # Joblib model loader
│   │       └── eta_wrapper.py  # Keras wrapper for joblib pickling
│   ├── ml_models/              # Trained model files
│   ├── Dockerfile
│   └── requirements.txt
│
├── ml/
│   ├── notebooks/
│   │   ├── 01_data_generation.ipynb    # Synthetic Nairobi datasets
│   │   ├── 02_eta_model.ipynb          # LSTM training
│   │   ├── 03_demand_forecast.ipynb    # XGBoost training
│   │   ├── 04_driver_scoring.ipynb     # Isolation Forest training
│   │   └── 05_save_and_export.ipynb    # Model verification
│   ├── data/                           # Generated CSVs
│   └── models/                         # Saved model files
│
├── dashboard/
│   ├── app/
│   │   ├── page.tsx            # Main SACCO dashboard
│   │   └── layout.tsx
│   ├── components/
│   │   ├── FleetMap.tsx        # Leaflet live map
│   │   ├── DemandPanel.tsx     # Route demand bars
│   │   ├── Leaderboard.tsx     # Driver score table
│   │   ├── LiveFeed.tsx        # WebSocket telemetry feed
│   │   └── StatCard.tsx        # KPI cards
│   ├── hooks/
│   │   └── useWebSocket.ts     # WS connection + reconnect
│   ├── lib/
│   │   └── api.ts              # Backend API helpers
│   └── types/
│       └── index.ts            # Shared TypeScript types
│
├── scripts/
│   └── simulate_gps.py         # GPS simulator for demo
│
├── docker-compose.yml
├── .env
└── README.md
```

---

## Quickstart

### Prerequisites
- Python 3.11 (conda `datascience` env)
- Node.js 18+
- Docker + Docker Compose (for production)
- Africa's Talking account (sandbox for dev)

### 1. Clone and configure

```bash
git clone https://github.com/cap-mojay/ma3.git
cd ma3
cp .env.example .env
# Edit .env — add your AT_API_KEY
```

### 2. Train the ML models

```bash
conda activate datascience
cd ml && jupyter notebook
# Run notebooks 01 → 05 in order
cp models/* ../backend/ml_models/
```

### 3. Start the backend

```bash
conda activate datascience
cd backend
DATABASE_URL="sqlite+aiosqlite:///./ma3.db" \
AT_API_KEY="your_key" \
MODEL_DIR="ml_models" \
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Seed the database

```bash
cd backend
DATABASE_URL="sqlite+aiosqlite:///./ma3.db" \
AT_API_KEY="your_key" \
python -m app.db.seed
```

### 5. Start the dashboard

```bash
cd dashboard
npm install
npm run dev
# Open http://localhost:3000
```

### 6. Run the GPS simulator

```bash
# Get vehicle IDs first
curl http://localhost:8000/vehicles/

# Update VEHICLES list in scripts/simulate_gps.py
# Then run
python scripts/simulate_gps.py
```

### Docker (production)

```bash
docker compose up --build
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `POST` | `/telemetry/` | Ingest GPS ping from vehicle |
| `GET` | `/telemetry/live` | All active vehicles with position |
| `POST` | `/ussd/` | Africa's Talking USSD callback |
| `POST` | `/sms/incoming` | Africa's Talking SMS callback |
| `GET` | `/drivers/leaderboard` | Top 10 drivers by score |
| `POST` | `/predict/eta` | LSTM ETA prediction |
| `POST` | `/predict/demand` | XGBoost demand forecast |
| `POST` | `/predict/score` | Isolation Forest driver score |
| `POST` | `/payments/fare` | Initiate M-Pesa fare payment |
| `WS` | `/ws` | WebSocket — live telemetry stream |

Full interactive docs at `http://localhost:8000/docs`

---

## Hackathon Objectives Addressed

- ✅ **Public Transport & Matatu Management** — core of the platform
- ✅ **Fleet Management & Vehicle Maintenance** — GPS tracking, driver scoring
- ✅ **Road Safety & Driver Behaviour** — Isolation Forest anomaly detection
- ✅ **Payments & Fintech for Transport** — M-Pesa cashless fares, driver wallets
- ✅ **Ride-Hailing & Mobility-as-a-Service** — commuter ETA subscription via SMS

---

## Why Ma3 Wins

**Inclusive by design.** The commuter with a KaiOS phone, the driver with a basic Safaricom line, and the SACCO manager with a laptop — all connected. No one excluded.

**ML where it matters.** Not ML for the sake of it. Each model solves a real operational gap: arrival uncertainty, demand blindness, driver accountability.

**Built for Nairobi.** Real stop coordinates. Real route numbers. Real fare structures. Sheng in the SMS copy. M-Pesa not Stripe. This was built *from* the culture, not just *for* it.

**Scalable.** 300+ SACCOs, 30,000+ matatus in Nairobi alone. Onboarding a SACCO is one web form. The USSD and SMS channels already reach every Safaricom subscriber in Kenya.

---

## Author

**Edwin George** (`Cap_Mojay{dev}`)
Developer · Data Scientist · ICT Educator
Nairobi, Kenya

- GitHub: [@cap-mojay](https://github.com/cap-mojay)
- Built with: FastAPI · Next.js · TensorFlow · XGBoost · Africa's Talking

---

## License

MIT — build on it, deploy it, make Nairobi move smarter.

---

*Jua Ma3 Yako. Know your matatu.* 🚌
