MVP – CORE RULES  
Sports
•	 Badminton (ACTIVE)
•	Other sports → Coming Soon (visible, disabled)
Human-assisted MVP philosophy
•	Auctions → partially manual (staff-assisted)
•	Scoring → recorded by staff
•	Organizers + Staff share the same portal
•	App = single source of truth + transparency layer
________________________________________
1. TOURNAMENT STRUCTURE  
Tournament → Categories → Matches
A Tournament can contain multiple Categories.
Examples
•	Under 21 – Women (Doubles)
•	Under 18 – Singles
•	Men – Doubles
Each category is independent in:
•	Match format
•	Points system
•	Bracket logic
•	Leaderboards & rankings
________________________________________
2. TOURNAMENT SETUP (ORGANIZER / STAFF PORTAL)
Mandatory Pre-Registration Setup
Create Tournament
 → Add Teams (mandatory)
 → Create Categories
 → Define Auction Type
 → Set Team Budgets
 → Open Player Registration
________________________________________
Team Setup (Mandatory, Before Registration)
For each team:
•	Team name
•	Team logo / color (optional MVP)
•	Team owner / representative
•	WhatsApp group link (can be added later)
🚫 Registration is blocked until teams exist
This enforces structure and prevents chaos.
________________________________________
Category Setup  
For each category:
•	Category name
•	Gender
•	Singles / Doubles
•	Age group
•	Points per game (dynamic)
o	e.g. 18 / 21 / 25
•	Match format
o	Best of 1 / Best of 3
•	Bracket type
o	League
o	Knockout
o	League → Top N → Knockout (hybrid)
________________________________________
Sport Configuration (DESIGN DECISION)
Approach: Global Defaults + Category Overrides

SportConfig is a GLOBAL, system-level entity:
•	Pre-seeded by admin (badminton, cricket, football, etc.)
•	Read-only for organizers
•	Contains: scoring rules, team sizes, format options

Organizers customize at CATEGORY level:
•	Override pointsPerGame (21 → 15)
•	Override bestOf (3 → 1)
•	Category stores final match rules

Why this approach:
•	Consistency: All "Badminton" tournaments share base rules
•	Flexibility: Each category can have custom scoring
•	Simplicity: Less duplication, easy to maintain

Future: Add Admin role to lock SportConfig mutations
________________________________________
3. PLAYER REGISTRATION 
Player Flow
Register
 → Choose Tournament
 → Choose Category
 → Submit Profile
 → Wait for Approval
Organizer / Staff Capabilities
•	Approve / reject players
•	Add players manually
•	Remove players if needed
•	Reassign players to teams even AFTER auction
________________________________________
4. AUCTION SYSTEMS (UPDATED MVP)
You support two auction modes.
________________________________________
A. AUCTION TYPE 1 — MANUAL ASSISTED (PRIMARY MVP)
Use case
•	Physical auction venue
•	Verbal bidding
•	Your staff operates the app
Workflow
Auction starts
 → Player shown in app
 → Offline bidding happens
 → Staff selects winning team
 → Enter final bid amount
 → Player assigned to team
 → Team budget auto-deducted
 → Auction log updated
App Capabilities
•	Team selector
•	Final price input
•	Confirm assignment
•	Undo last action (admin only)
What users see
•	SOLD badge on player
•	Team rosters updating
•	Remaining team budgets
•	Auction leaderboard:
o	Team
o	Players bought
o	Total spent

📌 POST-MVP NOTE — REAL-TIME UPGRADE
MVP uses HTTP polling (2s interval) for auction display updates.
Once all MVP features are complete, upgrade to WebSockets (Socket.io):
•	Instant real-time updates on broadcast display & player views
•	Eliminates polling overhead
•	Required foundation for Live Auction (Type 2)
•	Server: Socket.io event emitters on sell/skip/next/pause actions
•	Client: Socket.io listeners replace setInterval polling
________________________________________
B. AUCTION TYPE 2 — IN-APP LIVE AUCTION (SECONDARY MVP)
Workflow
Auction starts
 → Player card appears
 → Teams bid in app
 → Highest bid tracked
 → Countdown ends
 → Player auto-assigned
 → Budget deducted
MVP Constraints
•	Controlled environment
•	No complex concurrency
•	No public chaos
________________________________________
Auction Entity (FOUNDATIONAL)
Each auction action stores:
•	Player ID
•	Team ID
•	Category ID
•	Price
•	Timestamp
•	Auction type (manual / live)
This enables:
•	Transparency
•	Dispute resolution
•	Audit history
________________________________________
5. POST-AUCTION EXPERIENCE (UPDATED)
As soon as player is assigned (or reassigned)
Player gets:
1.	WhatsApp group link
2.	Team overview
o	Team name
o	Teammates
o	Assigned category
o	Upcoming matches (once created)
Player Flow
Auctioned / Assigned
 → Notification
 → Join WhatsApp
 → View Team & Category
________________________________________
6. TEAM MANAGEMENT (UPDATED)
Each team page shows:
•	Team name
•	Players grouped by category
•	Player roles (Singles / Doubles)
•	Remaining budget (locked unless admin override)
•	Match results per category
Admin / Staff Powers
•	Add player to team
•	Remove player from team
•	Reassign player between teams
•	All changes logged
This handles real-world last-minute issues.
________________________________________
7. MATCH BRACKETS & SCHEDULING (DYNAMIC)
Organizer / Staff Controls (Per Category)
•	Choose bracket type:
o	League
o	Knockout
o	League → Top N → Knockout
•	Assign teams manually
•	OR randomize teams
Workflow
Auction ends
 → Teams finalized
 → Category brackets configured
 → Matches generated
UI Must Show
•	Category label
•	Team vs Team
•	Court / Slot (optional)
•	Match status
________________________________________
8. MATCH SCORING (STAFF-ONLY, CATEGORY-AWARE)
Scoring Rules (Per Category)
•	Dynamic game points
o	e.g. 18 / 21 / 25
•	Best of X games
•	Winner auto-calculated
Workflow
Match starts
 → Staff selects category + match
 → Updates score
 → Confirms game end
 → Match locked
No public edits
Locked after confirmation
________________________________________
9. LEADERBOARDS & RANKINGS (SEPARATED – IMPORTANT)
You will have FOUR distinct views.
A. Team Leaderboard (Per Category)
•	Matches played
•	Wins / losses
•	Points
•	Rank
B. Team Rankings (Overall Tournament)
•	Aggregated performance
•	Category-weighted (future)
C. Player Leaderboard (Per Category)
•	Matches played
•	Wins
•	Points contributed
D. Player Rankings (Overall)
•	Individual performance across matches
⚠️ Leaderboards ≠ Rankings
________________________________________
10. END-TO-END MVP FLOW (FINAL)
Organizer / Staff
Create Tournament
 → Add Teams
 → Create Categories
 → Open Registration
 → Approve / Manage Players
 → Run Auction (Manual / Live)
 → Adjust Teams if needed
 → Configure Brackets
 → Record Matches
 → Publish Results & Rankings
Player
Register
 → Get Auctioned / Assigned
 → Join Team WhatsApp
 → View Team & Category
 → Play Matches
 → Track Stats & Rankings
Ops Staff
Assist Auction
 → Assign / Reassign Players
 → Record Scores
 → Maintain Accuracy

