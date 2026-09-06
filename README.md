# RythuSethu 

RythuSethu is an AI-driven agricultural marketplace connecting farmers directly with customers and B2B buyers.

## Quick Start (Windows)

To start the entire project (Frontend, Backend, and ML API) automatically, simply double-click the `run_project.bat` file in the root directory. 
This will open three command prompt windows, install dependencies if needed, and start all the servers.

### Services Started:
- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`
- **FastAPI ML API**: `http://localhost:8000`

---

## Manual Startup

If you prefer to start the servers manually, run the following commands in separate terminals:

### 1. Backend Server
```bash
cd backend
npm install
npm run dev
```

### 2. Frontend React App
```bash
cd frontend
npm install
npm run dev
```

### 3. FastAPI ML Server
```bash
cd backend/ml_api
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

## Features added in the latest update:
- **Comprehensive AI & ML Architecture Overview** in `RythuSethu_Comprehensive_Architecture_Analysis.txt`.
- **New Delivery Agent Types**: Added Support for Vermicompost and BioGas agents.
- **Farmer Location Verification**: Farmers can now verify their farm location using GPS, Map Pin, or an uploaded Audio Mic recording.
- **Admin Verification Pipeline**: Admins can listen to audio recordings and verify farmer locations in the verification dashboard.
- **Agent Registration Block**: Agents must provide their vehicle and agent photos at the time of registration.
- **Ride-along Payment Split**: Ride-along agents' delivery fees are automatically split: 50% to the agent, 10% to the platform, and 40% refunded to the customer.
