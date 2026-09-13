# 🚀 RythuJanaSethu: Production Deployment & CI/CD Guide

Comprehensive, step-by-step deployment and real-time Continuous Integration & Continuous Deployment (CI/CD) setup for **RythuJanaSethu**.

* **Repository:** [HarshithGadipelli/RythuSethu96](https://github.com/HarshithGadipelli/RythuSethu96)
* **Branch:** `main`
* **Stack:** MongoDB Atlas (Database) + Render (Node.js/Socket.io Backend) + Vercel (React Vite Frontend)

---

## 🏗️ Architecture & Real-Time Sync Overview

```
 [User Browser / Phone]
         │
         ├─── (HTTPS Requests & Assets) ───►  [Vercel (Frontend CDN)]
         │                                          ▲
         │                                          │ Auto-Deploy on Git Push
         │                                          │
         ├─── (REST APIs & WebSocket)  ───►  [Render (Backend Service)]
                                                    ▲       ▲
                           Auto-Deploy on Git Push  │       │ Real-Time Queries & Mutations
                                                    │       ▼
                                            [GitHub]  [MongoDB Atlas (Cloud DB)]
                                        (Branch: main)
```

1. **Code CI/CD (Real-time Code Updates):** Whenever you commit and push to `main`, GitHub notifies both **Vercel** and **Render** via webhooks. Both platforms automatically pull the commit, build, and deploy zero-downtime updates in real time.
2. **Data Real-time Sync:** All user actions (orders, location tracking, crop additions) instantly write to **MongoDB Atlas** and broadcast live to other users via **Socket.io**.

---

## 1. 🍃 MongoDB Atlas (Cloud Database)

### Configuration Details
* **Cluster:** `rythu.qoqwvah.mongodb.net`
* **Database Name:** `rythu_sethu`
* **Username:** `harshithgadipelli66_db_user`

### Steps to Verify & Finalize
1. Log into [MongoDB Atlas](https://cloud.mongodb.com/).
2. **Network Access (Whitelist):**
   * Go to **Security** > **Network Access**.
   * Ensure `0.0.0.0/0` (Allow Access from Anywhere) is active. This allows Render's cloud servers to connect securely without IP lockouts.
3. **Database URI:**
   Your production URI is:
   ```
   mongodb+srv://harshithgadipelli66_db_user:<YOUR_PASSWORD>@rythu.qoqwvah.mongodb.net/rythu_sethu?retryWrites=true&w=majority&appName=Rythu
   ```

---

## 2. ⚡ Render (Backend Deployment & Auto CI/CD)

Render hosts the Express API and the live WebSocket (Socket.io) server.

### Initial Setup Steps
1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** > **Web Service**.
3. Select **Build and deploy from a Git repository** and connect:
   * **Repository:** `HarshithGadipelli/RythuSethu96`
4. Configure the service:
   * **Name:** `rythu-backend` (or your choice)
   * **Region:** Singapore / Frankfurt / Oregon (choose closest to your users)
   * **Branch:** `main`
   * **Root Directory:** `backend`
   * **Runtime:** `Node`
   * **Build Command:** `npm install`
   * **Start Command:** `npm start`
   * **Instance Type:** `Free`

### Environment Variables on Render
Go to the **Environment** tab in your Render service and add:

| Key | Value | Purpose |
|---|---|---|
| `MONGO_URI` | `mongodb+srv://harshithgadipelli66_db_user:<PASSWORD>@rythu.qoqwvah.mongodb.net/rythu_sethu?retryWrites=true&w=majority&appName=Rythu` | MongoDB Atlas Connection |
| `JWT_SECRET` | `rythu_secret` | User authentication token signing |
| `ADMIN_SECRET` | `RYTHUADMIN2026` | Admin verification key |
| `RAZORPAY_KEY_ID` | `rzp_test_TU3fEg7yVGE3do` | Payment Gateway key |
| `RAZORPAY_KEY_SECRET` | `YPFJyrpGZxRbpvr8s67uBuh0` | Payment Gateway secret |
| `DELIVERY_BASE_CHARGE` | `30` | Base delivery charge |
| `DELIVERY_PER_KM_CHARGE` | `5` | Per km delivery charge |
| `PLATFORM_COMMISSION_PERCENT` | `5` | Platform fee percent |
| `GEMINI_API_KEY` | `<YOUR_GEMINI_API_KEY_FROM_ENV>` | Google GenAI integration |
| `MERCHANT_UPI_ID` | `8688938604@upi` | UPI payment recipient |
| `FRONTEND_URL` | `https://<YOUR-VERCEL-DOMAIN>.vercel.app` | CORS authorization |

### Render CI/CD Auto-Deploy
* Under **Settings** > **Build & Deploy**, verify **Auto-Deploy** is set to **`Yes`**.
* Whenever you run `git push origin main`, Render automatically builds and deploys the new backend code in real time!

---

## 3. ▲ Vercel (Frontend Deployment & Auto CI/CD)

Vercel hosts the React + Vite frontend on high-speed global edge networks.

### Initial Setup Steps
1. Log in to [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** > **Project**.
3. Import `HarshithGadipelli/RythuSethu96`.
4. Configure the project:
   * **Framework Preset:** `Vite`
   * **Root Directory:** Click **Edit** and choose `frontend`
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
   * **Install Command:** Ensure `.npmrc` with `legacy-peer-deps=true` is used, or override with:
     ```bash
     npm install --legacy-peer-deps
     ```

### Environment Variables on Vercel
Go to **Settings** > **Environment Variables** and add:

| Key | Value | Purpose |
|---|---|---|
| `VITE_API_URL` | `https://<YOUR-RENDER-BACKEND-URL>.onrender.com` | Live backend API & Socket connection |

*(Make sure there is no trailing slash `/` at the end of the URL).*

### Vercel CI/CD Auto-Deploy
* Vercel connects automatically to the `main` branch.
* Every push to `main` instantly triggers a new production deployment.
* Pull requests will generate preview URLs for testing before merging.

---

## 4. 🔄 How the CI/CD Pipeline Works in Real-Time

RythuJanaSethu utilizes a dual-layer Continuous Integration and Continuous Deployment pipeline:

1. **GitHub Actions Automated CI Pipeline (`.github/workflows/ci-cd.yml`):**
   - Automatically triggered on every `push` and `pull_request` to `main`.
   - **Backend CI:** Sets up Node.js 20, installs dependencies, and runs Jest tests (`npm test`).
   - **Frontend CI:** Sets up Node.js 20, installs dependencies, and executes `npm run build` to verify zero production compilation or bundle errors.
   - **Monorepo Compatibility:** Root `package.json` coordinates scripts across backend and frontend.

2. **Automated Cloud Deployments (Zero Manual Logins):**
   ```bash
   # 1. Stage all changed files
   git add .

   # 2. Commit with a descriptive message
   git commit -m "feat: in-page workflows, natural voice engine, and specialized agent portals"

   # 3. Push to GitHub
   git push origin main
   ```

### What happens automatically on push:
1. **GitHub** receives the commit on `main` and immediately launches the **GitHub Actions CI/CD Workflow** to test and build both tiers.
2. **Vercel** instantly catches the push via webhook:
   * Builds the frontend with the latest components, assets, and routes.
   * Purges edge caches and serves the updated site globally in ~30-60 seconds.
3. **Render** instantly catches the push via webhook:
   * Pulls the backend directory.
   * Runs `npm install` and restarts `server.js` with zero-downtime rolling restart.
4. **MongoDB Atlas** remains continuously available and stores live user updates without any service interruptions.

---

## 5. 📱 Progressive Web App (PWA) Features

RythuJanaSethu is fully configured as an installable PWA:
* **One-Tap Home Screen Installation:** Android, iOS Safari, and Desktop Chrome display a custom in-app install banner with the app emblem.
* **Offline Resilient:** Service worker (`sw.js`) caches the core app shell, fonts, and images, allowing offline browsing with instant load times.
* **Web App Manifest:** Configured with standalone display, portrait locking, splash theme (`#1a4a2e`), and quick shortcut links.

---

## 6. 🌓 Dual-Environment Architecture (Localhost vs Vercel)

How the codebase automatically switches between Localhost and Production:

| Feature | Local Development (`localhost`) | Production (`Vercel` / `Render`) |
|---|---|---|
| **API & Sockets** | Defaults to `http://localhost:5000` | Injected via `VITE_API_URL=https://<your-backend>.onrender.com` |
| **Hot Reload** | Instant Vite HMR (no caching) | Production minified chunks with hashed asset caching |
| **Service Worker** | Auto-unregistered in dev (`import.meta.env.DEV`) to prevent stale code | Active & auto-updating every 60s in production (`import.meta.env.PROD`) |
| **Database** | Connects to Atlas `rythu_sethu` with local DNS fallback | Connects to Atlas `rythu_sethu` with high-throughput cloud connection |

---

## 7. 🔍 Health Check & Verification Checklist

- [ ] **Backend Health:** Open `https://<YOUR-RENDER-URL>.onrender.com/` — it should display: `Rythu Jana Sethu Backend Running`.
- [ ] **Frontend Live:** Open `https://<YOUR-VERCEL-DOMAIN>.vercel.app/`.
- [ ] **Realtime Sockets:** Open developer tools (F12) > Console — verify `🟢 Realtime client connected` without CORS errors.
- [ ] **PWA Install Banner:** Visit the live site on mobile or Chrome desktop — verify the install banner appears.
- [ ] **Database Verification:** Sign up a test user on the live Vercel site, then check MongoDB Atlas Collections (`rythu_sethu.users`) to confirm live persistence.
