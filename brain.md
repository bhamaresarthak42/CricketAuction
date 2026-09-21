🧠 Project Brain: Live Cricket Auction Platform

🎯 Project Identity

Name: Real-Time Cricket Auction Web App
Objective: Build a multi-device, real-time application to facilitate a live cricket auction.
Target Users:

Admin: Sets up teams, uploads players.

Host: Controls the live auction, brings players to the hammer, marks sold/unsold.

Team Owner: Participates in live bidding against other owners with strict budget and squad composition rules.

🛠️ Tech Stack & Architecture

Frontend: React.js (via Vite), Tailwind CSS (for UI/UX, dark mode preferred).

Routing: React Router (/admin, /host, /owner).

Backend / Database: Firebase

Firestore: Persistent data (Teams, Players, Rosters).

Realtime Database (RTDB): Ephemeral, high-speed data (Live auction state, current bids).

Storage: Player images and Team logos.

🗄️ Database Schema (Source of Truth)

Firestore: teams Collection

id (String - Auto)

name (String)

total_budget (Number - e.g., 1000000000)

current_purse (Number)

squad_count (Number - Max 25)

overseas_count (Number - Max 8)

logo_url (String)

Firestore: players Collection

id (String - Auto)

name (String)

image_url (String)

role (String: "Batter", "Bowler", "All-Rounder", "Wicket Keeper")

nationality (String: "Domestic", "Overseas")

base_price (Number)

status (String: "upcoming", "sold", "unsold")

sold_to_team_id (String - Nullable)

sold_price (Number - Nullable)

Realtime Database: live_auction Node

player_id (String)

current_bid (Number)

highest_bidder_team_id (String)

status (String: "waiting", "bidding")

🛑 Strict Business Logic & Constraints (MUST ENFORCE)

Budget Check: A bid transaction must be rejected if bid_amount > team.current_purse.

Squad Size Check: A bid transaction must be rejected if team.squad_count >= 25.

Overseas Limit Check: If the current player is "Overseas", a bid must be rejected if team.overseas_count >= 8.

Bid Increment Validation: Any manual or dynamic bid MUST be strictly greater than the live_auction.current_bid.

Database Syncing: When a player is "Sold", three things must happen atomically (or in safe sequence):

Player document updates (status = sold, team_id, price).

Team document updates (deduct current_purse, increment squad_count, and conditionally increment overseas_count).

RTDB live_auction node clears.

🤖 Directives for the AI IDE (Antigravity/Cursor/Windsurf)

Context Preservation: Read this file before starting a new session or making major architectural changes.

Component Structure: Keep React components modular (e.g., BiddingControls, PlayerCard, TeamStats).

Error Handling: Always wrap Firebase calls in try/catch and provide user-friendly toast/alert notifications for failed validations (especially during bidding).

Self-Updating: As features are completed, check them off in the Progress Tracker below.

🚀 Progress Tracker

[x] Step 1: Initialize Vite + React + Tailwind + Firebase Config & Routing.

[x] Step 2: Build /admin - Team and Player creation (Firestore & Storage integration).

[x] Step 3: Build /host - Live auction initializer and Realtime DB connection.

[x] Step 4: Build /owner - Bidding interface with dynamic buttons and strict validation logic.

[x] Step 5: Build Host Controls - "Sell", "Unsold", and the "Unsold Queue/Recall" logic.

[x] Step 6: Real-time Dashboards, My Squad Roster & Broadcast UI Polish.

[x] Step 8: Critical Bug Fixes, Auth RBAC & Architecture Overhaul.

