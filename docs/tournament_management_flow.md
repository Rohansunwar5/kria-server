# Kria Sports - Tournament Management Flow Documentation

## Architecture Overview

Phase 2 introduces five interconnected modules for tournament management:

```
┌────────────────────────────────────────────────────────────────────┐
│                        TOURNAMENT                                   │
│                   /api/v1/tournaments                               │
│  Created by: Organizer | Managed by: Organizer + Staff             │
└────────────────────────────────────────────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         ▼                  ▼                  ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│     TEAMS       │  │   CATEGORIES    │  │  REGISTRATIONS  │
│  Budget + Owner │  │  Bracket Config │  │  Player → Team  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
                                                    │
                                          ┌────────┴────────┐
                                          ▼                 ▼
                                    ┌──────────┐      ┌──────────┐
                                    │ AUCTIONED│      │ ASSIGNED │
                                    └──────────┘      └──────────┘

┌────────────────────────────────────────────────────────────────────┐
│                      SPORT CONFIG                                   │
│                   /api/v1/sports                                    │
│  Pre-seeded configs for scoring, formats, team sizes per sport     │
└────────────────────────────────────────────────────────────────────┘
```

---

## 1. Tournament Lifecycle

```
DRAFT → REGISTRATION_OPEN → REGISTRATION_CLOSED → AUCTION_IN_PROGRESS → ONGOING → COMPLETED
                                                                                      ↓
                                                                                  CANCELLED
```

| Status | Description | Allowed Actions |
|--------|-------------|-----------------|
| `draft` | Initial setup | Edit all fields |
| `registration_open` | Players can register | Add teams, categories |
| `registration_closed` | Prep for auction | Configure brackets |
| `auction_in_progress` | Live auction | Bid on players |
| `ongoing` | Matches in progress | Score matches |
| `completed` | Tournament finished | View results |
| `cancelled` | Cancelled (any time) | No actions |

---

## 2. Tournament API

Base URL: `/api/v1/tournaments`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET /` | Public | List tournaments (filterable) |
| `GET /:id` | Public | Get tournament details |
| `POST /` | Organizer | Create tournament |
| `PUT /:id` | Organizer/Staff | Update tournament |
| `DELETE /:id` | Organizer | Soft delete |
| `POST /:id/open-registration` | Organizer/Staff | Open registration |
| `POST /:id/close-registration` | Organizer/Staff | Close registration |
| `POST /:id/start-auction` | Organizer/Staff | Start auction |
| `POST /:id/start` | Organizer/Staff | Start tournament |
| `POST /:id/complete` | Organizer/Staff | Complete tournament |
| `POST /:id/cancel` | Organizer | Cancel tournament |
| `POST /:id/staff` | Organizer | Add staff |
| `DELETE /:id/staff/:staffId` | Organizer | Remove staff |

---

## 3. Team Management

Base URL: `/api/v1`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET /tournaments/:tid/teams` | Public | List teams |
| `GET /teams/:id` | Public | Get team |
| `POST /tournaments/:tid/teams` | Organizer/Staff | Create team |
| `PUT /teams/:id` | Organizer/Staff | Update team |
| `DELETE /teams/:id` | Organizer | Delete team |
| `PUT /teams/:id/budget` | Organizer/Staff | Update budget |
| `POST /teams/:id/reset-budget` | Organizer/Staff | Reset budget |

---

## 4. Category Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET /tournaments/:tid/categories` | Public | List categories |
| `GET /categories/:id` | Public | Get category |
| `POST /tournaments/:tid/categories` | Organizer/Staff | Create category |
| `PUT /categories/:id` | Organizer/Staff | Update category |
| `DELETE /categories/:id` | Organizer | Delete category |
| `POST /categories/:id/open-registration` | Organizer/Staff | Open registration |
| `POST /categories/:id/start-auction` | Organizer/Staff | Start auction |
| `POST /categories/:id/configure-bracket` | Organizer/Staff | Configure bracket |
| `POST /categories/:id/start` | Organizer/Staff | Start matches |
| `POST /categories/:id/complete` | Organizer/Staff | Complete category |

---

## 5. Player Registration (NEW)

Base URL: `/api/v1/registrations`

### Player Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST /register` | Register for tournament category |
| `GET /my-registrations` | Get player's registrations |
| `POST /:id/withdraw` | Withdraw registration |

### Organizer/Staff Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET /tournaments/:id` | List registrations (filterable) |
| `POST /:id/approve` | Approve registration |
| `POST /:id/reject` | Reject registration |
| `POST /bulk-approve` | Bulk approve |

### Team Assignment (Auction)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST /:id/assign` | Assign via auction (soldPrice) |
| `POST /:id/manual-assign` | Manual reassignment |
| `POST /:id/unassign` | Unassign from team |
| `GET /teams/:id/roster` | Get team roster |
| `GET /categories/:id/available` | Get unassigned players |

### Registration Status Flow

```
PENDING → APPROVED → AUCTIONED / ASSIGNED
           ↓
        REJECTED
           ↓
       WITHDRAWN
```

---

## 6. Sport Configuration (NEW)

Base URL: `/api/v1/sports`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET /` | Public | List all sport configs |
| `GET /:sport` | Public | Get config for sport |
| `POST /seed` | Organizer | Seed default configs |
| `POST /` | Organizer | Create sport config |
| `PUT /:id` | Organizer | Update sport config |
| `DELETE /:id` | Organizer | Delete sport config |

### Pre-seeded Sports

| Sport | Status | Scoring Type |
|-------|--------|--------------|
| Badminton | ✅ Active | Points (21) |
| Table Tennis | ✅ Active | Points (11) |
| Cricket | 🔜 Coming Soon | Runs/Wickets |
| Football | 🔜 Coming Soon | Goals |
| Kabaddi | 🔜 Coming Soon | Raid Points |

---

## 7. Entity Relationships

```
Tournament ──┬── Team ──── TournamentRegistration (players)
             │
             └── Category ─── TournamentRegistration (players)
                                      │
                                      └── Match (Phase 3)

SportConfig ──── Tournament (sport type)
```

---

## 8. File Structure

```
src/
├── models/
│   ├── tournament.model.ts
│   ├── team.model.ts
│   ├── category.model.ts
│   ├── tournamentRegistration.model.ts
│   └── sportConfig.model.ts
├── repository/
│   ├── tournament.repository.ts
│   ├── team.repository.ts
│   ├── category.repository.ts
│   ├── tournamentRegistration.repository.ts
│   └── sportConfig.repository.ts
├── services/
│   ├── tournament.service.ts
│   ├── team.service.ts
│   ├── category.service.ts
│   ├── tournamentRegistration.service.ts
│   └── sportConfig.service.ts
├── controllers/
│   ├── tournament.controller.ts
│   ├── team.controller.ts
│   ├── category.controller.ts
│   ├── tournamentRegistration.controller.ts
│   └── sportConfig.controller.ts
├── middlewares/validators/
│   ├── tournament.validator.ts
│   ├── team.validator.ts
│   ├── category.validator.ts
│   ├── tournamentRegistration.validator.ts
│   └── sportConfig.validator.ts
└── routes/
    ├── tournament.route.ts
    ├── team.route.ts
    ├── category.route.ts
    ├── tournamentRegistration.route.ts
    ├── sportConfig.route.ts
    └── v1.route.ts
```
