# 🧠 Project Brain: Universal Live Cricket Auction Platform (CricAuction Pro)

## 🎯 Project Overview & Identity
- **Name**: CricAuction Pro - Real-Time Live Cricket Auction Platform
- **Objective**: A universal multi-league, multi-event, real-time web application to host live cricket auctions with synchronized bidding across browsers and mobile devices. Suitable for IPL, Corporate Leagues, College Tournaments, and Club Competitions.
- **GitHub Repository**: `https://github.com/bhamaresarthak42/CricketAuction.git`
- **Hosting & Deployment**: Vercel (Auto-deploy on `git push origin main`) / Netlify Ready

---

## 🛠️ Tech Stack & Architecture

### Frontend & UI System
- **Core Framework**: React 18 + Vite 5 (Fast ESM HMR & production bundle builds)
- **Styling**: Tailwind CSS (Dark broadcast aesthetics, glassmorphism, gold/emerald/cyan gradient highlights)
- **Icons**: Lucide React (`Trophy`, `Gavel`, `Users`, `Database`, `Shield`, `ShieldCheck`, `Flame`, `Zap`, `Radio`, `BarChart2`, `Calendar`, `Clock`, etc.)
- **Routing**: React Router v6 (`/`, `/login`, `/admin`, `/host`, `/owner`, `/unauthorized`)

### Backend & Cloud Infrastructure (Firebase)
- **Firebase Firestore**: Persistent database storing `teams`, `players`, `auction_event/config`, and fallback for `live_auction`.
- **Firebase Realtime Database (RTDB)**: Ephemeral WebSocket database for sub-second rapid live auction state pushes.
- **Firebase Storage**: Bucket storage for team logos (`team_logos/`) and player pictures (`player_images/`).
- **Firebase Anonymous Auth**: Role-Based Access Control (RBAC) credentials.

### Dual-Sync Realtime Bidding Engine (CRDT Architecture)
- **Dual Write**: Bids and hammer stage transitions update **both** Firestore (`doc(db, 'live_auction', 'current')`) and RTDB (`ref(rtdb, 'live_auction')`).
- **Dual Listeners**: Components subscribe to `onSnapshot` (Firestore) and `onValue` (RTDB).
- **Conflict Resolution (LWW)**: State updates use a **Last-Write-Wins (LWW) CRDT timestamp resolver** (`timestamp: Date.now()`). Out-of-order or stale cached snapshots are ignored (`newData.timestamp >= prev.timestamp`), ensuring uninterrupted continuous bidding across all connected teams.

---

## 📊 100% Free Rich Tournament Analytics Engine (`src/components/AnalyticsModal.jsx`)
- **Purse Utilization Rate (%)**: Computes overall spent money vs total allocated budget across all franchise teams.
- **Role-Wise Expenditure Distribution**: Calculates financial & count percentages spent on Batters, Bowlers, All-Rounders, and Wicket Keepers with dynamic colored progress bars.
- **Market Price Inflation Index**: Calculates average player selling price relative to base price (`1.0x` to `25.0x` inflation).
- **Overseas vs Domestic Slots**: Tracks foreign quota acquisition rates across teams.
- **Top 5 Player Acquisitions**: Real-time leaderboard displaying the highest-paid players in the tournament.

---

## 📅 Tournament Schedule & Universal Rebranding Engine

### Event Title & Time Scheduling (`src/pages/AdminPage.jsx`)
- **Custom Event Title**: Admin can name any tournament (e.g. *Corporate Premier League 2026*, *College Championship Auction*).
- **Start & End Time Scheduling**: Stores start and end timestamps in `doc(db, 'auction_event', 'config')`.
- **Universal Rebranding**: Platform rebranded to **CricAuction Pro** for universal league compatibility.

---

## 🔐 Security, RBAC & Team Owner Session Lock

### User Authentication (`src/context/AuthContext.jsx`)
- **Session Isolation**: Tab-isolated session storage (`ca_user_role`, `ca_user_team_id`, `ca_user_team_name`).
- **Role Credentials**:
  - **Admin**: Security PIN `1234`
  - **Host**: Security PIN `5678`
  - **Owner**: Select Franchise Team from dynamic Firestore list
- **Graceful Auth Fallback**: `signInAnonymously(auth)` wrapped in try/catch to fall back to session PIN auth cleanly.

### Team Owner Session Lock (`src/pages/OwnerPage.jsx`)
- **Strict Isolation**: Once a Team Owner signs in for a specific franchise (e.g. *Chennai Super Kings*), their session is **LOCKED** to that team.
- **Dropdown Disabling**: Dropdown replaced with a locked badge (`Playing Team (Session Locked)`).
- **Impersonation Prevention**: Team Owners CANNOT switch teams mid-session to inspect or place bids on behalf of rival franchises.

---

## 🗄️ Database Schemas (Source of Truth)

### Firestore: `auction_event/config` Document
```json
{
  "title": "String (e.g. Corporate Premier League 2026)",
  "startTime": "String (ISO Date String)",
  "endTime": "String (ISO Date String)",
  "status": "String ('scheduled' | 'live' | 'completed')",
  "updatedAt": "Timestamp"
}
```

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

## 🚀 Progress Tracker & Status

- [x] Step 1: Initialize Vite + React + Tailwind + Firebase Config & Routing.
- [x] Step 2: Build `/admin` - Team & Player data creation with Firebase Storage uploads.
- [x] Step 3: Build Live Cricket API Importer & Quick Auto-Seed preset features.
- [x] Step 4: Build `/host` - Live auctioneer controller, atomic sales, and unsold recall queue.
- [x] Step 5: Build `/owner` - Live bidding interface with strict validation rules and role-filtered squad roster.
- [x] Step 6: Step 8 Security, Auth Context, RBAC, PIN Protection, and Protected Routes.
- [x] Step 7: Dual-Sync Realtime Bidding Engine & LWW Conflict Resolution.
- [x] Step 8: Team Owner Session Locking & Impersonation Prevention.
- [x] Step 9: Host Conclude & Close Auction Event with Broadcast Summary Modal.
- [x] Step 10: Admin 1-Click Season Reset Engine for New Auction Events.
- [x] Step 11: Universal Rebranding to CricAuction Pro for All Leagues.
- [x] Step 12: Tournament Schedule Engine (Start/End Date & Time configuration).
- [x] Step 13: 100% Free Rich Analytics Dashboard Modal (`AnalyticsModal.jsx`).
- [x] Step 14: Production Build Verification & SPA Routing (`_redirects` & `vercel.json`).
- [x] Step 15: GitHub Integration & Vercel Automated CI/CD Deployment setup.
- [x] Step 16: Authentication & Render Stability - Resolved blank screen on login by defining missing `handleClearStage`, adding AuthContext loading spinner & 2.5s fallback timer, and wrapping the app in a React `ErrorBoundary`.

