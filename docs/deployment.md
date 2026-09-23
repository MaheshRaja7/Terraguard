# Cloud Deployment Guide — TERRAGUARD AI

This guide documents how to deploy the full-stack TerraGuard AI platform to production.

---

## Architecture Overview
- **Frontend**: Next.js 14 (App Router) on **Vercel**
- **Backend API**: FastAPI / Python 3.10 on **Render** or **Railway**
- **Database**: **MongoDB Atlas** (Cloud Cluster M0 Free or Dedicated)
- **ML Engine**: In-process XGBoost & TreeSHAP inference

---

## 1. Database Setup (MongoDB Atlas)
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a database user and whitelist IP `0.0.0.0/0` for cloud deployment.
3. Obtain your connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/terraguard_ai?retryWrites=true&w=majority
   ```
4. Set `MONGODB_URI` in backend environment variables.

---

## 2. Backend Deployment (Render / Railway)

### Using Render:
1. Create a **New Web Service** pointing to your repository.
2. Root Directory: `.`
3. Runtime: **Python 3**
4. Build Command:
   ```bash
   pip install -r backend/requirements.txt && python -m backend.ml.train
   ```
5. Start Command:
   ```bash
   uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT
   ```
6. Environment Variables:
   ```env
   PROJECT_NAME=TERRAGUARD AI
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=production-secure-key-here
   SMS_PROVIDER=local
   DEMO_MODE=true
   ```
7. Health Check Path: `/api/health`

---

## 3. Frontend Deployment (Vercel)
1. Import repository into [Vercel](https://vercel.com).
2. Set Root Directory: `frontend`
3. Framework Preset: **Next.js**
4. Build Command: `npm run build`
5. Output Directory: `.next`
6. Environment Variables:
   ```env
   NEXT_PUBLIC_API_URL=https://your-backend-service.onrender.com
   ```
7. Deploy!

---

## 4. Local Verification Commands
To test locally before deploying:
```bash
# Terminal 1: Backend
python -m uvicorn backend.app.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev -- -p 3000
```
Visit:
- Frontend: `http://localhost:3000`
- Backend API Docs: `http://localhost:8000/docs`
