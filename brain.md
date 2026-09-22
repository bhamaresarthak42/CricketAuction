# 🧠 Project Brain: Live Cricket Auction Platform

## 🎯 Project Overview & Identity
- **Name**: Real-Time IPL-Style Cricket Auction Platform
- **Objective**: A multi-device, real-time web application to host live cricket auctions with synchronized bidding across browsers and mobile devices.
- **GitHub Repository**: `https://github.com/bhamaresarthak42/CricketAuction.git`
- **Hosting & Deployment**: Vercel (Auto-deploy on `git push origin main`) / Netlify Ready

---

## 🛠️ Tech Stack & Architecture

### Frontend & UI System
- **Core Framework**: React 18 + Vite 5 (Fast ESM HMR & production bundle builds)
- **Styling**: Tailwind CSS (Dark broadcast aesthetics, glassmorphism, gold/emerald/cyan gradient highlights)
- **Icons**: Lucide React (`Trophy`, `Gavel`, `Users`, `Database`, `Shield`, `Flame`, `Zap`, `Radio`, etc.)
- **Routing**: React Router v6 (`/`, `/login`, `/admin`, `/host`, `/owner`, `/unauthorized`)

### Backend & Cloud Infrastructure (Firebase)
- **Firebase Firestore**: Persistent database storing `teams` and `players` collections, plus primary fallback for `live_auction`.
- **Firebase Realtime Database (RTDB)**: Ephemeral WebSocket database for sub-second rapid live auction state pushes.
- **Firebase Storage**: Bucket storage for team logos (`team_logos/`) and player pictures (`player_images/`).
- **Firebase Anonymous Auth**: Role-Based Access Control (RBAC) credentials.

### Dual-Sync Realtime Bidding Engine (CRDT Architecture)
- **Dual Write**: Bids and hammer stage transitions update **both** Firestore (`doc(db, 'live_auction', 'current')`) and RTDB (`ref(rtdb, 'live_auction')`).
- **Dual Listeners**: Components subscribe to `onSnapshot` (Firestore) and `onValue` (RTDB).
- **Conflict Resolution (LWW)**: State updates use a **Last-Write-Wins (LWW) CRDT timestamp resolver** (`timestamp: Date.now()`). Out-of-order or stale cached snapshots are ignored (`newData.timestamp >= prev.timestamp`), ensuring uninterrupted continuous bidding across all connected teams.

---

## 🔐 Security & Role-Based Access Control (RBAC)

### User Authentication (`src/context/AuthContext.jsx`)
- **Session Isolation**: Tab-isolated session storage (`ca_user_role`, `ca_user_team_id`, `ca_user_team_name`) allows multiple tabs on the same computer to represent different franchise teams without overwriting credentials.
- **Role Credentials**:
  - **Admin**: Security PIN `1234`
  - **Host**: Security PIN `5678`
  - **Owner**: Select Franchise Team from dynamic Firestore list
- **Graceful Auth Fallback**: `signInAnonymously(auth)` is wrapped in a try/catch block so that if Firebase Anonymous Auth is disabled in Firebase Console, PIN authentication continues seamlessly without throwing `auth/configuration-not-found`.

### Route Guards (`src/components/ProtectedRoute.jsx`)
- `ProtectedRoute` checks `userRole` and `allowedRoles`.
- Unauthenticated users attempting to access `/admin`, `/host`, or `/owner` are redirected to `/login`.
- Authenticated users attempting to access a route outside their permitted role are redirected to `/unauthorized`.

---

## 🗄️ Database Schemas (Source of Truth)

### Firestore: `teams` Collection
```json
{
  "id": "String (Auto-generated)",
  "name": "String (e.g. Chennai Super Kings)",
  "total_budget": "Number (in INR, e.g. 1000000000 for 100 Cr)",
  "current_purse": "Number (in INR, remaining purse)",
  "squad_count": "Number (current bought players count, max 25)",
  "overseas_count": "Number (current overseas players count, max 8)",
  "max_squad_size": "Number (default 25)",
  "logo_url": "String (Firebase Storage URL or UI-Avatars fallback)",
  "createdAt": "Timestamp"
}
```

### Firestore: `players` Collection
```json
{
  "id": "String (Auto-generated)",
  "name": "String (e.g. Virat Kohli)",
  "role": "String ('Batter' | 'Bowler' | 'All-Rounder' | 'Wicket Keeper')",
  "nationality": "String ('Domestic' | 'Overseas')",
  "base_price": "Number (in INR, e.g. 20000000 for 2 Cr)",
  "status": "String ('upcoming' | 'sold' | 'unsold')",
  "sold_to_team_id": "String | null",
  "sold_price": "Number | null (in INR)",
  "image_url": "String (Firebase Storage URL or role fallback avatar)",
  "createdAt": "Timestamp"
}
```

### Firestore & RTDB: `live_auction` Document / Node
```json
{
  "player_id": "String",
  "player_name": "String",
  "player_role": "String",
  "player_nationality": "String",
  "player_image_url": "String",
  "base_price": "Number",
  "current_bid": "Number",
  "highest_bidder_team_id": "String | null",
  "highest_bidder_team_name": "String | null",
  "status": "String ('bidding')",
  "timestamp": "Number (Epoch MS - Used for LWW Conflict Resolution)"
}
```

---

## 🛑 Business Rules & Validation Engine

1. **Rule 0 - Self Bidding Prevention**: A team cannot place a bid if they already hold the `highest_bidder_team_id`.
2. **Rule 1 - Opening & Increment Validation**:
   - Opening bid must be `>= base_price`.
   - Subsequent bids must be strictly `> current_bid`.
3. **Rule 2 - Purse Budget Check**: `bid_amount <= team.current_purse`.
4. **Rule 3 - Squad Capacity Limit**: `team.squad_count < max_squad_size` (max 25 players).
5. **Rule 4 - Overseas Quota Limit**: If `player_nationality === 'Overseas'`, `team.overseas_count < 8`.
6. **Atomic Sale Transaction (`handleSellPlayer`)**:
   - Uses Firestore `runTransaction` to update `players` document (`status = 'sold'`, `sold_to_team_id`, `sold_price`) AND update `teams` document (`current_purse` deduction, `squad_count` increment, conditional `overseas_count` increment) atomically.
   - Clears `live_auction` node across Firestore and RTDB.

---

## 📱 Page Features & Application Structure

### 1. Home Page (`/`)
- Broadcast hero banner introducing the platform.
- Interactive Role Portal cards directing users to Admin, Host, or Owner login.

### 2. Login Portal (`/login`)
- Role selector cards: Admin (PIN: 1234), Host (PIN: 5678), Team Owner (Team selection dropdown).
- Form inputs with inline validation and security feedback.

### 3. Admin Console (`/admin`)
- **Team Management**: Add new teams with budget in Crores, squad limit, and image file upload.
- **Player Management**: Add new players with role, nationality, base price in Lakhs, and photo file upload.
- **Live Cricket API Importer**: Integrates `fetchLiveCricketPlayers()` to fetch real cricket players via CricAPI / CricketData.org directly into Firestore.
- **Quick Auto-Seed**: 1-click seeding of preset IPL teams (CSK, MI, RCB, KKR) and star players.
- **Real-Time Deletion**: Delete teams or players with confirmation dialogs.

### 4. Host Auctioneer Desk (`/host`)
- **Live Ticker Banner**: Broadcast marquee displaying registered teams, upcoming count, unsold count, and live player.
- **Hammer Stage**: Initiate bidding for upcoming players or select specific players from the queue.
- **Host Action Controls**:
  - **Sell Player**: Triggers atomic Firestore transaction.
  - **Mark Unsold**: Updates status to `unsold` and clears stage.
  - **Clear Stage**: Manually resets stage state.
- **Queues**:
  - **Upcoming Queue**: Chronological list of upcoming players with 1-click hammer action.
  - **Unsold Recall Queue**: Displays unsold players with a **"Recall to Auction"** button that resets status to `upcoming`.
- **Franchise Standings Dashboard**: Real-time progress bars for purse utilization, squad filling rates, and overseas slots.

### 5. Team Owner Bidding Console (`/owner`)
- **Franchise Team Selector**: Tab-specific dropdown selector storing team state in `sessionStorage`.
- **Live Team Metrics**: Real-time cards displaying remaining purse, squad count, and overseas count.
- **Live Stage Display**: Shows player photo, role, nationality, base price, current highest bid, and winning team name.
- **Dynamic Bidding Controls**:
  - Quick Bid buttons: `+ ₹20 Lakhs`, `+ ₹50 Lakhs`, `+ ₹1 Crore`.
  - Custom Bid input box with numeric Lakhs converter.
  - Dynamic button disabling when team holds the highest bid or exceeds budget/roster constraints.
- **My Squad Roster**:
  - Live synchronized list of purchased players.
  - Role filter tabs: All, Batters, Bowlers, All-Rounders, Keepers.
  - Shows price paid for each player and total squad expenditure.

---

## 🌐 Deployment & SPA Single Page Application Config

### Netlify & Vercel SPA Routing Configuration
- **`public/_redirects`**:
  ```text
  /*    /index.html   200
  ```
- **`vercel.json`**:
  ```json
  {
    "rewrites": [
      { "source": "/(.*)", "destination": "/index.html" }
    ]
  }
  ```

### Vercel Continuous Deployment (CI/CD)
- **Repo Connection**: Connected to `bhamaresarthak42/CricketAuction.git` on `main` branch.
- **Auto Deploy**: Every `git push origin main` triggers a 30-second automated Vercel production build.
- **Public Visibility**: Vercel Authentication / Deployment Protection disabled for unrestricted multi-device access worldwide.
- **Local Network Testing**: `npm run dev -- --host` for local WiFi network testing across physical smartphones and tablets.

---

## 🐞 Major Bug Fixes & Audit Log

1. **Missing `formatCurrency` in `LoginPage.jsx`**:
   - *Symptom*: White/blank screen when clicking Admin, Host, or Owner links.
   - *Fix*: Imported `formatCurrency` from `../utils/formatters.js`.
2. **`auth/configuration-not-found` Error**:
   - *Symptom*: Login failed when Anonymous Auth was disabled in Firebase console.
   - *Fix*: Wrapped `signInAnonymously(auth)` in try/catch to fall back to session PIN auth cleanly.
3. **Cross-Tab Live Bidding Sync Issue**:
   - *Symptom*: Live auction state was only written to RTDB, which failed when RTDB rules were locked.
   - *Fix*: Implemented Dual-Sync writing to both Firestore (`doc(db, 'live_auction', 'current')`) and RTDB.
4. **Multi-Team Outbidding Locking Issue**:
   - *Symptom*: Team A couldn't bid after Team B placed a higher bid due to stale listener overwrites.
   - *Fix*: Implemented Last-Write-Wins (LWW) timestamp comparison in `setLiveAuction`.
5. **Windows File Handle `EPERM` Lock**:
   - *Symptom*: `'vite' is not recognized as an internal or external command` after failed `npm i`.
   - *Fix*: Killed stray `node.exe` processes and re-ran `npm install` cleanly.

---

## 🚀 Progress Tracker & Status

- [x] Step 1: Initialize Vite + React + Tailwind + Firebase Config & Routing.
- [x] Step 2: Build `/admin` - Team & Player data creation with Firebase Storage uploads.
- [x] Step 3: Build Live Cricket API Importer & Quick Auto-Seed preset features.
- [x] Step 4: Build `/host` - Live auctioneer controller, atomic sales, and unsold recall queue.
- [x] Step 5: Build `/owner` - Live bidding interface with strict validation rules and role-filtered squad roster.
- [x] Step 6: Step 8 Security, Auth Context, RBAC, PIN Protection, and Protected Routes.
- [x] Step 7: Dual-Sync Realtime Bidding Engine & LWW Conflict Resolution.
- [x] Step 8: Production Build Verification & SPA Routing (`_redirects` & `vercel.json`).
- [x] Step 9: GitHub Integration & Vercel Automated CI/CD Deployment setup.
