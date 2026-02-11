# API Testing Guide - Phase 2 Modules

This guide provides a step-by-step testing order to validate all endpoints.

---

## Prerequisites

1. Server running: `npm run dev`
2. MongoDB connected
3. Postman or similar tool
4. Base URL: `http://localhost:3000/api/v1`

---

## Step 1: Seed Sport Configs

First, seed the sport configurations (requires organizer token).

```
POST /organizer/auth/login
Body: { "email": "...", "password": "..." }
→ Save access_token
```

```
POST /sports/seed
Headers: Authorization: Bearer <organizer_token>
→ Should return seeded sports (badminton, table_tennis, etc.)
```

**Verify:**
```
GET /sports
→ Should list all sports with isActive status

GET /sports/badminton
→ Should return badminton config with scoring rules
```

---

## Step 2: Create Tournament

```
POST /tournaments
Headers: Authorization: Bearer <organizer_token>
Body:
{
  "name": "Summer Badminton Cup 2026",
  "sport": "badminton",
  "startDate": "2026-04-01",
  "endDate": "2026-04-15",
  "registrationDeadline": "2026-03-25",
  "venue": {
    "name": "City Sports Complex",
    "city": "Mumbai"
  },
  "settings": {
    "maxTeams": 8,
    "defaultBudget": 100000,
    "auctionType": "manual"
  }
}
→ Save tournament _id
```

**Verify:**
```
GET /tournaments
→ Should list tournament

GET /tournaments/:id
→ Should return tournament details

GET /tournaments/organizer/my-tournaments
Headers: Authorization: Bearer <organizer_token>
→ Should list organizer's tournaments
```

---

## Step 3: Add Teams

```
POST /tournaments/:tournamentId/teams
Headers: Authorization: Bearer <organizer_token>
Body:
{
  "name": "Mumbai Warriors",
  "primaryColor": "#FF5722",
  "secondaryColor": "#FFC107",
  "owner": {
    "name": "John Doe",
    "phone": "+91-9876543210",
    "email": "john@example.com"
  }
}
→ Save team _id (create 4+ teams)
```

**Verify:**
```
GET /tournaments/:tournamentId/teams
→ Should list all teams

GET /teams/:id
→ Should return team with budget from tournament settings
```

---

## Step 4: Add Categories

```
POST /tournaments/:tournamentId/categories
Headers: Authorization: Bearer <organizer_token>
Body:
{
  "name": "Men's Singles U-21",
  "gender": "male",
  "ageGroup": { "label": "Under 21", "min": 0, "max": 21 },
  "matchType": "singles",
  "matchFormat": { "bestOf": 3, "pointsPerGame": 21 },
  "bracketType": "knockout"
}
→ Save category _id
```

**Verify:**
```
GET /tournaments/:tournamentId/categories
→ Should list categories

GET /categories/:id
→ Should return category details
```

---

## Step 5: Open Registration

```
POST /tournaments/:id/open-registration
Headers: Authorization: Bearer <organizer_token>
→ Tournament status → "registration_open"
```

**Verify:**
```
GET /tournaments/:id
→ status should be "registration_open"
```

---

## Step 6: Player Registration

First, login as a player:
```
POST /player/auth/login
Body: { "email": "...", "password": "..." }
→ Save player access_token
```

**Register for tournament:**
```
POST /registrations/register
Headers: Authorization: Bearer <player_token>
Body:
{
  "tournamentId": "<tournament_id>",
  "categoryId": "<category_id>",
  "profile": {
    "name": "Rahul Sharma",
    "age": 19,
    "gender": "male",
    "phone": "+91-9876543210",
    "skillLevel": "intermediate"
  },
  "basePrice": 5000
}
→ Save registration _id
```

**Verify:**
```
GET /registrations/my-registrations
Headers: Authorization: Bearer <player_token>
→ Should list player's registrations
```

---

## Step 7: Approve Registrations (Organizer)

```
GET /registrations/tournaments/:tournamentId
Headers: Authorization: Bearer <organizer_token>
→ Should list all registrations

POST /registrations/:id/approve
Headers: Authorization: Bearer <organizer_token>
→ Should approve registration
```

**Bulk approve:**
```
POST /registrations/bulk-approve
Headers: Authorization: Bearer <organizer_token>
Body: { "registrationIds": ["id1", "id2", "id3"] }
```

---

## Step 8: Close Registration & Start Auction

```
POST /tournaments/:id/close-registration
Headers: Authorization: Bearer <organizer_token>
→ status → "registration_closed"

POST /tournaments/:id/start-auction
Headers: Authorization: Bearer <organizer_token>
→ status → "auction_in_progress"
```

---

## Step 9: Auction - Assign Players to Teams

Get available players:
```
GET /registrations/categories/:categoryId/available
Headers: Authorization: Bearer <organizer_token>
→ Should return approved, unassigned players
```

Assign via auction:
```
POST /registrations/:registrationId/assign
Headers: Authorization: Bearer <organizer_token>
Body: { "teamId": "<team_id>", "soldPrice": 15000 }
→ Player assigned, team budget deducted
```

**Verify team roster:**
```
GET /registrations/teams/:teamId/roster
→ Should list team players and total spent
```

**Test manual reassignment:**
```
POST /registrations/:id/manual-assign
Headers: Authorization: Bearer <organizer_token>
Body: { "teamId": "<different_team_id>" }
```

**Test unassign:**
```
POST /registrations/:id/unassign
Headers: Authorization: Bearer <organizer_token>
→ Player unassigned, budget restored
```

---

## Step 10: Team Budget Operations

```
PUT /teams/:id/budget
Headers: Authorization: Bearer <organizer_token>
Body: { "budget": 80000 }
→ Should update budget

POST /teams/:id/reset-budget
Headers: Authorization: Bearer <organizer_token>
→ Should reset to initialBudget
```

---

## Step 11: Tournament Lifecycle Completion

```
POST /tournaments/:id/start
Headers: Authorization: Bearer <organizer_token>
→ status → "ongoing"

POST /tournaments/:id/complete
Headers: Authorization: Bearer <organizer_token>
→ status → "completed"
```

---

## Step 12: Staff Management

```
POST /tournaments/:id/staff
Headers: Authorization: Bearer <organizer_token>
Body: { "staffId": "<another_organizer_id>" }
→ Staff added

DELETE /tournaments/:id/staff/:staffId
Headers: Authorization: Bearer <organizer_token>
→ Staff removed
```

---

## Step 13: Player Withdrawal (Edge Case)

```
POST /registrations/:id/withdraw
Headers: Authorization: Bearer <player_token>
→ Should work only if not yet assigned to team
```

---

## Step 14: Delete Operations

```
DELETE /categories/:id
Headers: Authorization: Bearer <organizer_token>

DELETE /teams/:id
Headers: Authorization: Bearer <organizer_token>

DELETE /tournaments/:id
Headers: Authorization: Bearer <organizer_token>
```

---

## Negative Test Cases

| Test | Expected |
|------|----------|
| Register when status != registration_open | 400 Error |
| Approve already approved registration | 400 Error |
| Assign player exceeding team budget | 400 Error |
| Player withdraw after team assignment | 400 Error |
| Staff edit tournament they're not on | 403 Forbidden |
| Invalid status transition | 400 Error |

---

## Quick Checklist

### Sport Config
- [ ] `GET /sports` - List all
- [ ] `GET /sports/:sport` - Get one
- [ ] `POST /sports/seed` - Seed defaults
- [ ] `POST /sports` - Create custom
- [ ] `PUT /sports/:id` - Update
- [ ] `DELETE /sports/:id` - Delete

### Tournament
- [ ] `GET /tournaments` - List
- [ ] `GET /tournaments/:id` - Get
- [ ] `GET /tournaments/organizer/my-tournaments` - My tournaments
- [ ] `POST /tournaments` - Create
- [ ] `PUT /tournaments/:id` - Update
- [ ] `DELETE /tournaments/:id` - Delete
- [ ] `POST /:id/open-registration` - Open
- [ ] `POST /:id/close-registration` - Close
- [ ] `POST /:id/start-auction` - Auction
- [ ] `POST /:id/start` - Start
- [ ] `POST /:id/complete` - Complete
- [ ] `POST /:id/cancel` - Cancel
- [ ] `POST /:id/staff` - Add staff
- [ ] `DELETE /:id/staff/:staffId` - Remove staff

### Team
- [ ] `GET /tournaments/:tid/teams` - List
- [ ] `GET /teams/:id` - Get
- [ ] `POST /tournaments/:tid/teams` - Create
- [ ] `PUT /teams/:id` - Update
- [ ] `DELETE /teams/:id` - Delete
- [ ] `PUT /teams/:id/budget` - Update budget
- [ ] `POST /teams/:id/reset-budget` - Reset budget

### Category
- [ ] `GET /tournaments/:tid/categories` - List
- [ ] `GET /categories/:id` - Get
- [ ] `POST /tournaments/:tid/categories` - Create
- [ ] `PUT /categories/:id` - Update
- [ ] `DELETE /categories/:id` - Delete
- [ ] `POST /categories/:id/open-registration`
- [ ] `POST /categories/:id/start-auction`
- [ ] `POST /categories/:id/configure-bracket`
- [ ] `POST /categories/:id/start`
- [ ] `POST /categories/:id/complete`

### Registration
- [ ] `POST /registrations/register` - Register (player)
- [ ] `GET /registrations/my-registrations` - My regs (player)
- [ ] `POST /registrations/:id/withdraw` - Withdraw (player)
- [ ] `GET /registrations/tournaments/:id` - List (organizer)
- [ ] `GET /registrations/categories/:id` - By category
- [ ] `POST /registrations/:id/approve` - Approve
- [ ] `POST /registrations/:id/reject` - Reject
- [ ] `POST /registrations/bulk-approve` - Bulk approve
- [ ] `POST /registrations/:id/assign` - Auction assign
- [ ] `POST /registrations/:id/manual-assign` - Manual
- [ ] `POST /registrations/:id/unassign` - Unassign
- [ ] `GET /registrations/teams/:id/roster` - Roster
- [ ] `GET /registrations/categories/:id/available` - Available
