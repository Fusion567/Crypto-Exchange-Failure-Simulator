# 🚀 Crypto Exchange Failure Simulation Tool

A high-performance, containerized simulation platform designed to model and visualize various failure scenarios in a cryptocurrency exchange environment. This tool helps developers and SREs understand system behavior during liquidity crises, order book lag, and API outages.

---

## 🛠 Tech Stack

### Frontend
- **Framework:** [React 18](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Language:** TypeScript
- **Styling:** Vanilla CSS / Tailwind CSS
- **State Management:** React Hooks / Context API

### Backend
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11+)
- **Validation:** Pydantic v2
- **Asynchronous Server:** Uvicorn

### Infrastructure
- **Containerization:** Docker & Docker Compose
- **Orchestration:** Multi-container setup (Frontend + Backend)

---

## 📂 Project Structure

```text
crypto-exchange-failure-simulator/
├── docker-compose.yml         # Container orchestration
├── README.md                  # Project documentation
│
├── frontend/                  # React + TypeScript Workspace
│   ├── Dockerfile             # Multi-stage production build
│   ├── package.json
│   ├── tsconfig.json          # Strict type checking
│   └── src/
│       ├── components/        # Visualization & Control components
│       ├── types/             # Shared TypeScript interfaces
│       └── App.tsx            # Main application logic
│
└── backend/                   # FastAPI Workspace
    ├── Dockerfile             # Python environment setup
    ├── requirements.txt       # Backend dependencies
    └── app/
        ├── main.py            # API Entry point & Router
        ├── schema.py          # Data validation models
        └── simulation.py      # Core failure logic engine
```

---

## 🚀 Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### Installation & Execution
1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Crypto-exchange-failure-simulator
   ```

2. **Launch via Docker Compose:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - **Frontend:** [http://localhost:5173](http://localhost:5173)
   - **API Docs (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🧪 Simulation Capabilities

This tool is designed to simulate the following scenarios:
1. **Flash Crashes:** Rapid price depletion via randomized sell pressure.
2. **Order Book Lag:** Artificial latency injection between user actions and engine matching.
3. **Liquidity Drains:** Simulating "bank run" scenarios where buy-side depth vanishes.
4. **API Outages:** Mocking partial or total service failures for downstream system testing.

---

## 🛠 Development Guide

### Running Frontend Locally (No Docker)
```bash
cd frontend
npm install
npm run dev
```

### Running Backend Locally (No Docker)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

---

## 🛡 License
This project is licensed under the MIT License - see the LICENSE file for details.
