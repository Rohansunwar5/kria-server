# Kria Sports – Backend Architecture & Implementation Guide

> **Mission**: Build a highly optimized, scalable, and maintainable backend for the all-in-one sports tournament organizer application.

---

## Table of Contents

1. [Technology Stack](#1-technology-stack)
2. [Architecture Overview](#2-architecture-overview)
3. [Directory Structure](#3-directory-structure)
4. [Data Models](#4-data-models)
5. [API Endpoints](#5-api-endpoints)
6. [Core Features Implementation](#6-core-features-implementation)
7. [Real-time Features](#7-real-time-features)
8. [Performance & Optimization](#8-performance--optimization)
9. [Security Best Practices](#9-security-best-practices)
10. [Testing Strategy](#10-testing-strategy)
11. [Deployment & DevOps](#11-deployment--devops)
12. [Implementation Roadmap](#12-implementation-roadmap)

---

## 1. Technology Stack

### Core Technologies

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Runtime** | Node.js (v20 LTS) | JavaScript runtime |
| **Language** | TypeScript | Type safety & developer experience |
| **Framework** | Express.js | HTTP server & routing |
| **Database** | MongoDB (Mongoose) | Primary data store |
| **Cache** | Redis | Session cache, leaderboards, real-time data |
| **Auth** | JWT + Refresh Tokens | Stateless authentication |
| **Validation** | express-validator | Request validation |
| **Real-time** | Socket.IO | Live auction, live scores |
| **File Storage** | AWS S3 / Cloudinary | Team logos, player photos |
| **Push Notifications** | Firebase Cloud Messaging (FCM) | Mobile notifications |
| **Job Queue** | Bull (Redis-backed) | Background jobs, scheduled tasks |
| **API Documentation** | Swagger / OpenAPI 3.0 | Auto-generated API docs |
| **Logging** | Winston + CloudWatch | Structured logging |
| **Monitoring** | PM2 / New Relic | Performance monitoring |

### Additional Packages to Install

```bash
# Real-time & Queues
npm install socket.io bull ioredis

# Push Notifications
npm install firebase-admin

# File Upload
npm install @aws-sdk/client-s3 multer-s3

# API Documentation
npm install swagger-ui-express swagger-jsdoc

# Testing
npm install -D jest @types/jest ts-jest supertest @types/supertest

# Rate Limiting
npm install express-rate-limit

# Compression
npm install compression
```
---

## 2. Architecture Overview

### Layered Architecture (Strict Separation)

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Mobile App)                      │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API GATEWAY / LOAD BALANCER                  │
│                    (Nginx / AWS ALB / Cloudflare)                │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                         EXPRESS SERVER                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Middleware │──│   Routes    │──│      Controllers        │  │
│  │  (Auth,     │  │  (Validators)│  │  (Request/Response)     │  │
│  │   Logging)  │  │             │  │                         │  │
│  └─────────────┘  └─────────────┘  └───────────┬─────────────┘  │
│                                                 │                │
│  ┌─────────────────────────────────────────────▼─────────────┐  │
│  │                      SERVICES                              │  │
│  │              (Business Logic Layer)                        │  │
│  └─────────────────────────────────────────────┬─────────────┘  │
│                                                 │                │
│  ┌─────────────────────────────────────────────▼─────────────┐  │
│  │                    REPOSITORIES                            │  │
│  │              (Data Access Layer)                           │  │
│  └─────────────────────────────────────────────┬─────────────┘  │
│                                                 │                │
└─────────────────────────────────────────────────│────────────────┘
                                                  │
        ┌─────────────────────────────────────────┼──────────────────┐
        │                                         │                  │
        ▼                                         ▼                  ▼
┌───────────────┐                    ┌───────────────┐    ┌──────────────┐
│   MongoDB     │                    │     Redis     │    │  Socket.IO   │
│  (Primary DB) │                    │   (Cache +    │    │  (Real-time) │
│               │                    │   Pub/Sub)    │    │              │
└───────────────┘                    └───────────────┘    └──────────────┘
```

### Request Flow (Mandatory)

```
Route → Validator Middleware → Auth Middleware → Controller → Service → Repository → Model → Response via next()
```

---

## 3. Directory Structure

```
src/
├── @types/                     # Custom TypeScript declarations
│   └── express.d.ts            # Extended Express types
│
├── config/
│   └── index.ts                # All env variables (single source)
│   └── database.ts             # MongoDB connection config
│   └── redis.ts                # Redis connection config
│   └── socket.ts               # Socket.IO configuration
│   └── firebase.ts             # FCM configuration
│
├── controllers/
│   ├── auth.controller.ts
│   ├── tournament.controller.ts
│   ├── team.controller.ts
│   ├── player.controller.ts
│   ├── category.controller.ts
│   ├── auction.controller.ts
│   ├── match.controller.ts
│   ├── leaderboard.controller.ts
│   └── health.controller.ts
│
├── services/
│   ├── auth.service.ts
│   ├── tournament.service.ts
│   ├── team.service.ts
│   ├── player.service.ts
│   ├── category.service.ts
│   ├── auction.service.ts
│   ├── match.service.ts
│   ├── leaderboard.service.ts
│   ├── notification.service.ts
│   ├── cache/
│   │   └── cacheManager.ts
│   └── socket/
│       └── socketManager.ts
│
├── repository/
│   ├── user.repository.ts
│   ├── tournament.repository.ts
│   ├── team.repository.ts
│   ├── player.repository.ts
│   ├── category.repository.ts
│   ├── auction.repository.ts
│   ├── match.repository.ts
│   └── leaderboard.repository.ts
│
├── models/
│   ├── user.model.ts
│   ├── tournament.model.ts
│   ├── team.model.ts
│   ├── player.model.ts
│   ├── category.model.ts
│   ├── auction.model.ts
│   ├── match.model.ts
│   └── score.model.ts
│
├── routes/
│   ├── index.ts                # Route aggregator
│   ├── auth.routes.ts
│   ├── tournament.routes.ts
│   ├── team.routes.ts
│   ├── player.routes.ts
│   ├── category.routes.ts
│   ├── auction.routes.ts
│   ├── match.routes.ts
│   └── leaderboard.routes.ts
│
├── middlewares/
│   ├── auth.middleware.ts
│   ├── role.middleware.ts
│   ├── validators/
│   │   ├── auth.validator.ts
│   │   ├── tournament.validator.ts
│   │   ├── team.validator.ts
│   │   ├── player.validator.ts
│   │   ├── category.validator.ts
│   │   ├── auction.validator.ts
│   │   └── match.validator.ts
│   ├── asyncHandler.ts
│   ├── globalHandler.ts
│   ├── rateLimiter.ts
│   └── errorHandler.ts
│
├── errors/
│   ├── BaseError.ts
│   ├── BadRequestError.ts
│   ├── NotFoundError.ts
│   ├── UnauthorizedError.ts
│   ├── ForbiddenError.ts
│   └── ConflictError.ts
│
├── utils/
│   ├── logger.ts
│   ├── response.ts
│   ├── pagination.ts
│   ├── bracketGenerator.ts     # Tournament bracket logic
│   ├── scoreCalculator.ts      # Match scoring logic
│   └── rankingCalculator.ts    # Leaderboard logic
│
├── jobs/
│   ├── queue.ts                # Bull queue setup
│   ├── notificationJob.ts
│   ├── leaderboardJob.ts
│   └── cleanupJob.ts
│
├── db/
│   └── connect.ts
│
├── app.ts
└── index.ts
```

---

## 4. Data Models

### Enum Pattern (Standard)

> **Important**: All models MUST use TypeScript enums for type safety. Define enums separately and use them in both schema and interface.

```typescript
// Example pattern from discount.model.ts
import mongoose from "mongoose";

// Step 1: Define enums
export enum IUserRole {
    PLAYER = 'player',
    ORGANIZER = 'organizer',
    STAFF = 'staff',
    ADMIN = 'admin'
}

export enum IUserStatus {
    PENDING = 'pending',
    VERIFIED = 'verified',
    SUSPENDED = 'suspended'
}

// Step 2: Use in schema with `enum: EnumName`
const userSchema = new mongoose.Schema({
    role: {
        type: String,
        required: true,
        enum: IUserRole,
        default: IUserRole.PLAYER
    },
    status: {
        type: String,
        required: true,
        enum: IUserStatus,
        default: IUserStatus.PENDING
    }
}, { timestamps: true });

// Step 3: Interface uses string type (matches enum values)
export interface IUser extends mongoose.Document {
    role: string;      // Will be one of IUserRole values
    status: string;    // Will be one of IUserStatus values
}
```

---

### User Model (`user.model.ts`)

> **Dual Auth Support**: Users can login via password OR OTP. During registration, OTP verifies email, then user sets password.

```typescript
import mongoose from "mongoose";

// Enums
export enum IUserRole {
    PLAYER = 'player',
    ORGANIZER = 'organizer',
    STAFF = 'staff',
    ADMIN = 'admin'
}

export enum IUserStatus {
    PENDING = 'pending',           // Registered, OTP sent but not verified
    OTP_VERIFIED = 'otp_verified', // OTP verified, needs to set password
    VERIFIED = 'verified',         // Fully registered (password set)
    SUSPENDED = 'suspended'
}

export enum IAuthProvider {
    EMAIL = 'email',
    GOOGLE = 'google'
}

// Schema
const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    phone: {
        type: String,
        required: true,
        trim: true,
    },
    password: {
        type: String,
        minLength: 8,
        // Not required initially - set after OTP verification
    },
    role: {
        type: String,
        required: true,
        enum: IUserRole,
        default: IUserRole.PLAYER,
    },
    status: {
        type: String,
        required: true,
        enum: IUserStatus,
        default: IUserStatus.PENDING,
    },
    authProvider: {
        type: String,
        required: true,
        enum: IAuthProvider,
        default: IAuthProvider.EMAIL,
    },
    profileImage: {
        type: String,
    },
    fcmTokens: [{
        type: String,
    }],
    otp: {
        code: { type: String },
        expiresAt: { type: Date },
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ status: 1, role: 1 });

// Interface
export interface IUser extends mongoose.Document {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password?: string;
    role: string;
    status: string;
    authProvider: string;
    profileImage?: string;
    fcmTokens: string[];
    otp?: {
        code: string;
        expiresAt: Date;
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export default mongoose.model<IUser>('User', userSchema);
```

### Tournament Model (`tournament.model.ts`)

```typescript
interface ITournament {
  _id: string;
  name: string;
  description: string;
  sport: 'badminton' | 'cricket' | 'football' | 'kabaddi';  // Extensible
  bannerImage?: string;
  startDate: Date;
  endDate: Date;
  venue: {
    name: string;
    address: string;
    city: string;
    coordinates?: { lat: number; lng: number };
  };
  registrationDeadline: Date;
  status: 'draft' | 'registration_open' | 'registration_closed' | 'auction_in_progress' | 'ongoing' | 'completed' | 'cancelled';
  createdBy: string;             // User ID (organizer)
  staffIds: string[];            // User IDs (staff members)
  settings: {
    maxTeams: number;
    defaultBudget: number;       // Per team budget
    auctionType: 'manual' | 'live';
    allowLateRegistration: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### Team Model (`team.model.ts`)

```typescript
interface ITeam {
  _id: string;
  tournamentId: string;
  name: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  owner: {
    name: string;
    phone: string;
    email?: string;
  };
  whatsappGroupLink?: string;
  budget: number;                 // Remaining budget
  initialBudget: number;          // Starting budget
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Category Model (`category.model.ts`)

```typescript
interface ICategory {
  _id: string;
  tournamentId: string;
  name: string;                   // e.g., "Under 21 - Women (Doubles)"
  gender: 'male' | 'female' | 'mixed';
  ageGroup: {
    min?: number;
    max?: number;
    label: string;                // e.g., "Under 21", "Open"
  };
  matchType: 'singles' | 'doubles';
  matchFormat: {
    bestOf: 1 | 3 | 5;            // Best of X games
    pointsPerGame: number;        // 18, 21, 25
    tieBreakPoints?: number;
  };
  bracketType: 'league' | 'knockout' | 'hybrid';
  hybridConfig?: {
    leagueSize: number;           // Teams in league phase
    topN: number;                 // Top N advance to knockout
  };
  status: 'setup' | 'registration' | 'auction' | 'bracket_configured' | 'ongoing' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}
```

### Player Model (`player.model.ts`)

```typescript
interface IPlayer {
  _id: string;
  userId: string;                 // Reference to User
  tournamentId: string;
  categoryId: string;
  profile: {
    name: string;
    age: number;
    gender: 'male' | 'female';
    phone: string;
    photo?: string;
    skillLevel?: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  };
  status: 'pending' | 'approved' | 'rejected' | 'auctioned' | 'assigned' | 'withdrawn';
  teamId?: string;                // Assigned after auction
  auctionData?: {
    basePrice: number;
    soldPrice?: number;
    auctionedAt?: Date;
  };
  stats: {
    matchesPlayed: number;
    matchesWon: number;
    pointsContributed: number;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### Auction Model (`auction.model.ts`)

```typescript
interface IAuction {
  _id: string;
  tournamentId: string;
  categoryId: string;
  status: 'not_started' | 'in_progress' | 'paused' | 'completed';
  auctionType: 'manual' | 'live';
  currentPlayerId?: string;       // Currently being auctioned
  settings: {
    minBidIncrement: number;
    bidDurationSeconds: number;   // For live auction
  };
  logs: IAuctionLog[];
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface IAuctionLog {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  finalPrice: number;
  auctionType: 'manual' | 'live';
  recordedBy: string;             // Staff/Admin user ID
  timestamp: Date;
}
```

### SportConfig Model (`sportConfig.model.ts`)

> **Multi-Sport Support**: This configuration model defines sport-specific rules, scoring systems, player counts, and match formats. Each tournament references a sport config.

```typescript
export enum ISportType {
    BADMINTON = 'badminton',
    CRICKET = 'cricket',
    FOOTBALL = 'football',
    KABADDI = 'kabaddi',
    TABLE_TENNIS = 'table_tennis',
    TENNIS = 'tennis'
}

export enum IScoringType {
    POINTS = 'points',           // Badminton, Table Tennis
    SETS_GAMES = 'sets_games',   // Tennis
    GOALS = 'goals',             // Football
    RUNS_WICKETS = 'runs_wickets', // Cricket
    RAID_POINTS = 'raid_points'  // Kabaddi
}

interface ISportConfig {
    _id: string;
    sport: ISportType;
    displayName: string;
    scoringType: IScoringType;
    matchDurationType: 'points_based' | 'time_based' | 'overs_based' | 'sets_based';
    teamConfig: {
        minPlayersPerTeam: number;
        maxPlayersPerTeam: number;
        playersOnField: number;
        allowSubstitutes: boolean;
    };
    matchFormats: Array<{
        name: string;           // "Singles", "Doubles", "5-a-side"
        playersPerSide: number;
    }>;
    scoringConfig: {
        pointsToWin?: number;
        minPointsDifference?: number;
        setsToWin?: number;
        periodDurationMinutes?: number;
        defaultOvers?: number;
    };
    bestOfOptions: number[];    // [1, 3, 5, 7]
    scoreLabels: {
        primary: string;        // "Points", "Goals", "Runs"
        secondary?: string;     // "Games", "Wickets"
    };
    defaults: {
        bestOf: number;
        pointsToWin: number;
    };
}
```

**Example Sport Configurations:**

| Sport | Scoring | Players | Default Format |
|-------|---------|---------|----------------|
| Badminton | Points (21, best of 3) | 1-2 per side | Singles/Doubles |
| Cricket | Runs/Wickets/Overs | 11 per team | Limited overs |
| Football | Goals | 5-11 per team | 2 halves |
| Kabaddi | Raid points | 7 per team | 2 halves |
| Tennis | Sets/Games/Points | 1-2 per side | Best of 3/5 sets |

---

### Match Model (`match.model.ts`)

> **Flexible Scoring**: Uses different score arrays based on sport type. Only populate the relevant array.

```typescript
interface IMatch {
    _id: string;
    tournamentId: string;
    categoryId: string;
    sportType: string;
    bracketRound: string;
    matchNumber: number;
    teams: {
        team1Id: string;
        team2Id: string;
        team1Name: string;
        team2Name: string;
    };
    players: {
        team1Players: string[];
        team2Players: string[];
    };
    schedule?: {
        date: Date;
        time: string;
        court?: string;
        venue?: string;
    };
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'walkover';
    
    // ========== FLEXIBLE SCORING (use based on sport) ==========
    gameScores: IGameScore[];      // Points-based (Badminton, Table Tennis)
    setScores: ISetScore[];        // Sets-based (Tennis)
    periodScores: IPeriodScore[];  // Time-based (Football, Kabaddi)
    inningsScores: IInningsScore[]; // Overs-based (Cricket)
    
    matchConfig: {
        bestOf?: number;
        pointsToWin?: number;
        maxOvers?: number;
        periodMinutes?: number;
    };
    
    result: {
        team1Summary: string;      // "2 sets", "3-1", "245/8"
        team2Summary: string;
        marginOfVictory?: string;  // "by 2 games", "by 50 runs"
    };
    winnerId?: string;
    winReason?: string;            // "by_score", "walkover", "forfeit"
}

// Points-based (Badminton, Table Tennis)
interface IGameScore {
    gameNumber: number;
    team1Score: number;
    team2Score: number;
    winnerId?: string;
}

// Sets-based (Tennis)
interface ISetScore {
    setNumber: number;
    team1Games: number;
    team2Games: number;
    isTieBreak: boolean;
    tieBreakScore?: { team1: number; team2: number };
}

// Time-based (Football, Kabaddi)
interface IPeriodScore {
    periodNumber: number;
    periodName: string;  // "First Half", "Extra Time"
    team1Score: number;
    team2Score: number;
}

// Overs-based (Cricket)
interface IInningsScore {
    inningsNumber: number;
    battingTeamId: string;
    runs: number;
    wickets: number;
    overs: number;
    balls: number;
    extras: { wides: number; noBalls: number; byes: number; legByes: number };
    isDeclared: boolean;
    isAllOut: boolean;
}
```

---

## 5. API Endpoints

### Authentication (Password + OTP Dual Login)

> **Auth Flow**: 
> - **Registration (3 steps)**: Register → Verify OTP → Set Password
> - **Login Options**: Password login OR OTP login (user's choice)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/v1/auth/register` | Start registration (firstName, lastName, email, phone) | Public |
| POST | `/api/v1/auth/verify-otp` | Verify registration OTP | Public |
| POST | `/api/v1/auth/set-password` | Set password to complete registration | Public |
| POST | `/api/v1/auth/resend-otp` | Resend OTP to email | Public |
| POST | `/api/v1/auth/login` | Login with password | Public |
| POST | `/api/v1/auth/login/otp` | Request login OTP (passwordless) | Public |
| POST | `/api/v1/auth/login/otp/verify` | Verify login OTP | Public |
| POST | `/api/v1/auth/google` | Google OAuth login (organizer/staff) | Public |
| POST | `/api/v1/auth/refresh-token` | Refresh access token | Public |
| POST | `/api/v1/auth/forgot-password` | Request password reset OTP | Public |
| POST | `/api/v1/auth/reset-password` | Reset password with OTP | Public |
| POST | `/api/v1/auth/change-password` | Change password (logged in) | Authenticated |
| GET | `/api/v1/auth/profile` | Get current user profile | Authenticated |
| PATCH | `/api/v1/auth/profile` | Update profile | Authenticated |
| PUT | `/api/v1/auth/profile-image` | Upload profile image | Authenticated |
| POST | `/api/v1/auth/fcm-token` | Register FCM token | Authenticated |
| DELETE | `/api/v1/auth/fcm-token` | Remove FCM token | Authenticated |

#### Registration Flow (3 Steps)

```
┌─────────────────────────────────────────────────────────────────┐
│                    PLAYER REGISTRATION FLOW                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  STEP 1: POST /auth/register                                     │
│     Body: { firstName, lastName, email, phone }                  │
│     → User created with status: 'pending'                        │
│     → OTP generated and sent to email                            │
│     → Response: { message: "OTP sent to email" }                 │
│                                                                  │
│  STEP 2: POST /auth/verify-otp                                   │
│     Body: { email, otp }                                         │
│     → OTP validated                                              │
│     → User status updated to 'otp_verified'                      │
│     → Response: { message: "OTP verified. Set password." }       │
│                                                                  │
│  STEP 3: POST /auth/set-password                                 │
│     Body: { email, password }                                    │
│     → Password hashed and stored                                 │
│     → User status updated to 'verified'                          │
│     → JWT tokens generated                                       │
│     → Response: { accessToken, refreshToken, user }              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Login Flow (Two Options)

```
┌─────────────────────────────────────────────────────────────────┐
│                   OPTION 1: PASSWORD LOGIN                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  POST /auth/login                                                │
│     Body: { email, password }                                    │
│     → Verify credentials                                         │
│     → JWT tokens generated                                       │
│     → Response: { accessToken, refreshToken, user }              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   OPTION 2: OTP LOGIN (Passwordless)             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  STEP 1: POST /auth/login/otp                                    │
│     Body: { email }                                              │
│     → OTP generated and sent to email                            │
│     → Response: { message: "OTP sent to email" }                 │
│                                                                  │
│  STEP 2: POST /auth/login/otp/verify                             │
│     Body: { email, otp }                                         │
│     → OTP validated                                              │
│     → JWT tokens generated                                       │
│     → Response: { accessToken, refreshToken, user }              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Password Recovery Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    FORGOT PASSWORD FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  STEP 1: POST /auth/forgot-password                              │
│     Body: { email }                                              │
│     → OTP generated and sent to email                            │
│     → Response: { message: "OTP sent to email" }                 │
│                                                                  │
│  STEP 2: POST /auth/reset-password                               │
│     Body: { email, otp, newPassword }                            │
│     → OTP validated, password updated                            │
│     → Response: { message: "Password reset successfully" }       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

> **Future Enhancement**: Phone number OTP authentication will replace email OTP. The same flow applies, just change `email` to `phone` and use SMS service instead of email.

### Tournaments

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/v1/tournaments` | Create tournament | Organizer |
| GET | `/api/v1/tournaments` | List tournaments | Public |
| GET | `/api/v1/tournaments/:id` | Get tournament details | Public |
| PUT | `/api/v1/tournaments/:id` | Update tournament | Organizer/Staff |
| DELETE | `/api/v1/tournaments/:id` | Delete tournament | Organizer |
| POST | `/api/v1/tournaments/:id/staff` | Add staff member | Organizer |
| DELETE | `/api/v1/tournaments/:id/staff/:userId` | Remove staff | Organizer |

### Teams

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/v1/tournaments/:tournamentId/teams` | Create team | Organizer/Staff |
| GET | `/api/v1/tournaments/:tournamentId/teams` | List teams | Public |
| GET | `/api/v1/teams/:id` | Get team details | Public |
| PUT | `/api/v1/teams/:id` | Update team | Organizer/Staff |
| DELETE | `/api/v1/teams/:id` | Delete team | Organizer/Staff |
| GET | `/api/v1/teams/:id/players` | Get team roster | Public |

### Categories

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/v1/tournaments/:tournamentId/categories` | Create category | Organizer/Staff |
| GET | `/api/v1/tournaments/:tournamentId/categories` | List categories | Public |
| GET | `/api/v1/categories/:id` | Get category details | Public |
| PUT | `/api/v1/categories/:id` | Update category | Organizer/Staff |
| DELETE | `/api/v1/categories/:id` | Delete category | Organizer/Staff |

### Player Registration

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/v1/categories/:categoryId/register` | Register for category | Player |
| GET | `/api/v1/categories/:categoryId/players` | List players in category | Public |
| GET | `/api/v1/players/:id` | Get player details | Public |
| PUT | `/api/v1/players/:id/status` | Approve/Reject player | Organizer/Staff |
| PUT | `/api/v1/players/:id/team` | Assign/Reassign to team | Organizer/Staff |
| DELETE | `/api/v1/players/:id` | Remove player | Organizer/Staff |
| GET | `/api/v1/users/:userId/registrations` | My registrations | Player |

### Auction

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/v1/categories/:categoryId/auction/start` | Start auction | Organizer/Staff |
| POST | `/api/v1/categories/:categoryId/auction/pause` | Pause auction | Organizer/Staff |
| POST | `/api/v1/categories/:categoryId/auction/resume` | Resume auction | Organizer/Staff |
| POST | `/api/v1/categories/:categoryId/auction/end` | End auction | Organizer/Staff |
| GET | `/api/v1/categories/:categoryId/auction` | Get auction status | Public |
| POST | `/api/v1/auction/manual-assign` | Manual player assignment | Staff |
| POST | `/api/v1/auction/bid` | Place bid (live auction) | Team Owner |
| GET | `/api/v1/categories/:categoryId/auction/logs` | Auction history | Public |
| POST | `/api/v1/auction/undo-last` | Undo last assignment | Admin |

### Matches

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/v1/categories/:categoryId/brackets/generate` | Generate brackets | Organizer/Staff |
| GET | `/api/v1/categories/:categoryId/matches` | List matches | Public |
| GET | `/api/v1/matches/:id` | Get match details | Public |
| PUT | `/api/v1/matches/:id/schedule` | Schedule match | Organizer/Staff |
| POST | `/api/v1/matches/:id/score` | Update score | Staff |
| POST | `/api/v1/matches/:id/complete` | Complete & lock match | Staff |
| POST | `/api/v1/matches/:id/walkover` | Mark as walkover | Staff |

### Leaderboards & Rankings

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/v1/categories/:categoryId/leaderboard/teams` | Team leaderboard (category) | Public |
| GET | `/api/v1/categories/:categoryId/leaderboard/players` | Player leaderboard (category) | Public |
| GET | `/api/v1/tournaments/:tournamentId/rankings/teams` | Overall team rankings | Public |
| GET | `/api/v1/tournaments/:tournamentId/rankings/players` | Overall player rankings | Public |

---

## 6. Core Features Implementation

### 6.1 Tournament Setup Flow

```typescript
// tournament.service.ts
class TournamentService {
  async createTournament(data: CreateTournamentDTO, userId: string) {
    // 1. Validate organizer role
    // 2. Create tournament with 'draft' status
    // 3. Return tournament

    const tournament = await this._tournamentRepository.create({
      ...data,
      createdBy: userId,
      status: 'draft',
    });

    // Cache tournament for quick access
    await this._cacheManager.set(`tournament:${tournament._id}`, tournament, 3600);

    return tournament;
  }

  async addTeams(tournamentId: string, teams: CreateTeamDTO[]) {
    // Bulk create teams with initial budgets
    // This MUST happen before registration opens
  }

  async openRegistration(tournamentId: string) {
    // Validate: Tournament must have teams
    // Update status to 'registration_open'
    // Send push notifications to all users about new tournament
  }
}
```

### 6.2 Auction System

#### Manual Auction (Type 1)

```typescript
// auction.service.ts
class AuctionService {
  async manualAssignPlayer(data: ManualAssignDTO, staffId: string) {
    const { playerId, teamId, finalPrice, categoryId } = data;

    // 1. Verify player is approved and not yet auctioned
    const player = await this._playerRepository.getById(playerId);
    if (player.status !== 'approved') {
      throw new BadRequestError('Player is not eligible for auction');
    }

    // 2. Verify team has sufficient budget
    const team = await this._teamRepository.getById(teamId);
    if (team.budget < finalPrice) {
      throw new BadRequestError('Insufficient team budget');
    }

    // 3. Deduct from team budget
    await this._teamRepository.deductBudget(teamId, finalPrice);

    // 4. Assign player to team
    await this._playerRepository.assignToTeam(playerId, teamId, finalPrice);

    // 5. Log auction action
    await this._auctionRepository.addLog({
      playerId,
      playerName: player.profile.name,
      teamId,
      teamName: team.name,
      finalPrice,
      auctionType: 'manual',
      recordedBy: staffId,
      timestamp: new Date(),
    });

    // 6. Emit real-time update via Socket.IO
    this._socketManager.emitToRoom(`auction:${categoryId}`, 'player_sold', {
      player,
      team,
      finalPrice,
    });

    // 7. Send push notification to player
    await this._notificationService.sendToUser(player.userId, {
      title: `You've been acquired by ${team.name}!`,
      body: `Congratulations! Join your team's WhatsApp group.`,
      data: { teamId, whatsappLink: team.whatsappGroupLink },
    });

    return { player, team, finalPrice };
  }

  async undoLastAssignment(categoryId: string, adminId: string) {
    // Reverse the last auction log entry
    // Restore team budget
    // Reset player status to 'approved'
    // Emit real-time update
  }
}
```

#### Live Auction (Type 2)

```typescript
// liveAuction.service.ts
class LiveAuctionService {
  private activeBids: Map<string, BidState> = new Map();

  async startBidding(playerId: string, categoryId: string) {
    const player = await this._playerRepository.getById(playerId);
    
    const bidState: BidState = {
      playerId,
      categoryId,
      currentBid: player.auctionData?.basePrice || 1000,
      currentBidderId: null,
      countdown: 30,
      history: [],
    };

    this.activeBids.set(playerId, bidState);

    // Emit to all connected clients
    this._socketManager.emitToRoom(`auction:${categoryId}`, 'bidding_started', {
      player,
      basePrice: bidState.currentBid,
      countdown: bidState.countdown,
    });

    // Start countdown timer
    this.startCountdown(playerId, categoryId);
  }

  async placeBid(playerId: string, teamId: string, bidAmount: number) {
    const bidState = this.activeBids.get(playerId);
    
    if (bidAmount <= bidState.currentBid) {
      throw new BadRequestError('Bid must be higher than current bid');
    }

    // Verify team budget
    const team = await this._teamRepository.getById(teamId);
    if (team.budget < bidAmount) {
      throw new BadRequestError('Insufficient budget');
    }

    // Update bid state
    bidState.currentBid = bidAmount;
    bidState.currentBidderId = teamId;
    bidState.countdown = 15; // Reset countdown on new bid
    bidState.history.push({ teamId, amount: bidAmount, timestamp: new Date() });

    // Emit update
    this._socketManager.emitToRoom(`auction:${bidState.categoryId}`, 'bid_placed', {
      playerId,
      currentBid: bidAmount,
      teamId,
      countdown: bidState.countdown,
    });
  }

  private startCountdown(playerId: string, categoryId: string) {
    const interval = setInterval(async () => {
      const bidState = this.activeBids.get(playerId);
      bidState.countdown--;

      this._socketManager.emitToRoom(`auction:${categoryId}`, 'countdown_tick', {
        playerId,
        countdown: bidState.countdown,
      });

      if (bidState.countdown <= 0) {
        clearInterval(interval);
        await this.finalizeBid(playerId);
      }
    }, 1000);
  }
}
```

### 6.3 Match Scoring

```typescript
// match.service.ts
class MatchService {
  async updateScore(matchId: string, scoreData: UpdateScoreDTO, staffId: string) {
    const match = await this._matchRepository.getById(matchId);

    if (match.status === 'completed') {
      throw new BadRequestError('Match is already completed');
    }

    const { gameNumber, team1Score, team2Score } = scoreData;
    const category = await this._categoryRepository.getById(match.categoryId);
    const pointsToWin = category.matchFormat.pointsPerGame;

    // Determine game winner
    let gameWinnerId: string | null = null;
    if (team1Score >= pointsToWin && team1Score - team2Score >= 2) {
      gameWinnerId = match.teams.team1Id;
    } else if (team2Score >= pointsToWin && team2Score - team1Score >= 2) {
      gameWinnerId = match.teams.team2Id;
    }

    // Update scores array
    const updatedScores = [...match.scores];
    const existingGameIndex = updatedScores.findIndex(g => g.gameNumber === gameNumber);
    
    if (existingGameIndex >= 0) {
      updatedScores[existingGameIndex] = { gameNumber, team1Score, team2Score, winnerId: gameWinnerId };
    } else {
      updatedScores.push({ gameNumber, team1Score, team2Score, winnerId: gameWinnerId });
    }

    await this._matchRepository.update(matchId, {
      scores: updatedScores,
      status: 'in_progress',
    });

    // Emit real-time score update
    this._socketManager.emitToRoom(`match:${matchId}`, 'score_updated', {
      matchId,
      scores: updatedScores,
    });

    // Also emit to tournament room for live followers
    this._socketManager.emitToRoom(`tournament:${match.tournamentId}`, 'live_score', {
      matchId,
      team1: match.teams.team1Name,
      team2: match.teams.team2Name,
      scores: updatedScores,
    });

    return { matchId, scores: updatedScores };
  }

  async completeMatch(matchId: string, staffId: string) {
    const match = await this._matchRepository.getById(matchId);
    const category = await this._categoryRepository.getById(match.categoryId);
    
    // Calculate match winner
    const team1Games = match.scores.filter(s => s.winnerId === match.teams.team1Id).length;
    const team2Games = match.scores.filter(s => s.winnerId === match.teams.team2Id).length;
    
    const gamesToWin = Math.ceil(category.matchFormat.bestOf / 2);
    let winnerId: string;
    
    if (team1Games >= gamesToWin) {
      winnerId = match.teams.team1Id;
    } else if (team2Games >= gamesToWin) {
      winnerId = match.teams.team2Id;
    } else {
      throw new BadRequestError('Match is not yet complete');
    }

    // Lock the match
    await this._matchRepository.update(matchId, {
      status: 'completed',
      winnerId,
      result: { team1Games, team2Games },
      recordedBy: staffId,
      lockedAt: new Date(),
    });

    // Update player stats
    await this.updatePlayerStats(match, winnerId);

    // Trigger leaderboard recalculation (async job)
    await this._leaderboardQueue.add('recalculate', {
      categoryId: match.categoryId,
      tournamentId: match.tournamentId,
    });

    // Send notifications
    // Emit real-time updates
  }
}
```

### 6.4 Bracket Generation

```typescript
// utils/bracketGenerator.ts
export class BracketGenerator {
  /**
   * Generate league matches (round-robin)
   */
  static generateLeagueMatches(teams: ITeam[], categoryId: string, tournamentId: string): IMatch[] {
    const matches: IMatch[] = [];
    let matchNumber = 1;

    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        matches.push({
          tournamentId,
          categoryId,
          bracketRound: 'League',
          matchNumber: matchNumber++,
          teams: {
            team1Id: teams[i]._id,
            team2Id: teams[j]._id,
            team1Name: teams[i].name,
            team2Name: teams[j].name,
          },
          status: 'scheduled',
          scores: [],
        });
      }
    }

    return matches;
  }

  /**
   * Generate knockout bracket (single elimination)
   */
  static generateKnockoutBracket(teams: ITeam[], categoryId: string, tournamentId: string): IMatch[] {
    // Seed teams (could be random or based on league standings)
    const seededTeams = this.seedTeams(teams);
    const matches: IMatch[] = [];
    
    const rounds = Math.ceil(Math.log2(seededTeams.length));
    let matchNumber = 1;

    // Generate first round
    const firstRoundTeams = seededTeams.length;
    const roundNames = this.getRoundNames(rounds);

    for (let i = 0; i < Math.floor(firstRoundTeams / 2); i++) {
      matches.push({
        tournamentId,
        categoryId,
        bracketRound: roundNames[0],
        matchNumber: matchNumber++,
        teams: {
          team1Id: seededTeams[i * 2]._id,
          team2Id: seededTeams[i * 2 + 1]._id,
          team1Name: seededTeams[i * 2].name,
          team2Name: seededTeams[i * 2 + 1].name,
        },
        status: 'scheduled',
        scores: [],
      });
    }

    // Placeholder matches for subsequent rounds
    // These will be populated as previous round matches complete

    return matches;
  }

  private static getRoundNames(totalRounds: number): string[] {
    const names = ['Final', 'Semi Final', 'Quarter Final'];
    const result = [];
    
    for (let i = totalRounds - 1; i >= 0; i--) {
      if (i < 3) {
        result.unshift(names[i]);
      } else {
        result.unshift(`Round of ${Math.pow(2, i + 1)}`);
      }
    }
    
    return result;
  }

  private static seedTeams(teams: ITeam[]): ITeam[] {
    // For MVP: random seeding
    return [...teams].sort(() => Math.random() - 0.5);
  }
}
```

### 6.5 Leaderboard Calculation

```typescript
// leaderboard.service.ts
class LeaderboardService {
  async getTeamLeaderboard(categoryId: string): Promise<TeamLeaderboardEntry[]> {
    // Try cache first
    const cacheKey = `leaderboard:team:${categoryId}`;
    const cached = await this._cacheManager.get<TeamLeaderboardEntry[]>(cacheKey);
    if (cached) return cached;

    // Calculate from matches
    const matches = await this._matchRepository.getCompletedByCategory(categoryId);
    const teams = await this._teamRepository.getByCategory(categoryId);

    const leaderboard: Record<string, TeamLeaderboardEntry> = {};

    // Initialize all teams
    teams.forEach(team => {
      leaderboard[team._id] = {
        teamId: team._id,
        teamName: team.name,
        logo: team.logo,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        gamesWon: 0,
        gamesLost: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        points: 0, // Competition points
      };
    });

    // Process matches
    matches.forEach(match => {
      const { team1Id, team2Id } = match.teams;
      const team1 = leaderboard[team1Id];
      const team2 = leaderboard[team2Id];

      team1.matchesPlayed++;
      team2.matchesPlayed++;

      if (match.winnerId === team1Id) {
        team1.wins++;
        team1.points += 3; // 3 points for win
        team2.losses++;
      } else {
        team2.wins++;
        team2.points += 3;
        team1.losses++;
      }

      // Calculate games and points
      match.scores.forEach(game => {
        team1.pointsFor += game.team1Score;
        team1.pointsAgainst += game.team2Score;
        team2.pointsFor += game.team2Score;
        team2.pointsAgainst += game.team1Score;

        if (game.winnerId === team1Id) {
          team1.gamesWon++;
          team2.gamesLost++;
        } else {
          team2.gamesWon++;
          team1.gamesLost++;
        }
      });
    });

    // Sort by points, then game difference, then point difference
    const sorted = Object.values(leaderboard).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const aGameDiff = a.gamesWon - a.gamesLost;
      const bGameDiff = b.gamesWon - b.gamesLost;
      if (bGameDiff !== aGameDiff) return bGameDiff - aGameDiff;
      const aPointDiff = a.pointsFor - a.pointsAgainst;
      const bPointDiff = b.pointsFor - b.pointsAgainst;
      return bPointDiff - aPointDiff;
    });

    // Add rank
    sorted.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    // Cache for 60 seconds (frequently updated during matches)
    await this._cacheManager.set(cacheKey, sorted, 60);

    return sorted;
  }
}
```

---

## 7. Real-time Features

### Socket.IO Setup

```typescript
// config/socket.ts
import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';

export function setupSocket(httpServer: HTTPServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = verifyToken(token);
      socket.data.user = decoded;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.data.user._id}`);

    // Join tournament room
    socket.on('join:tournament', (tournamentId: string) => {
      socket.join(`tournament:${tournamentId}`);
    });

    // Join auction room
    socket.on('join:auction', (categoryId: string) => {
      socket.join(`auction:${categoryId}`);
    });

    // Join match room for live scoring
    socket.on('join:match', (matchId: string) => {
      socket.join(`match:${matchId}`);
    });

    // Leave rooms
    socket.on('leave:room', (room: string) => {
      socket.leave(room);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.data.user._id}`);
    });
  });

  return io;
}
```

### SocketManager Service

```typescript
// services/socket/socketManager.ts
import { Server } from 'socket.io';

class SocketManager {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  emitToRoom(room: string, event: string, data: any) {
    this.io.to(room).emit(event, data);
  }

  emitToUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  broadcastToAll(event: string, data: any) {
    this.io.emit(event, data);
  }
}

export default SocketManager;
```

### Events Reference

| Event | Direction | Room | Payload |
|-------|-----------|------|---------|
| `player_sold` | Server → Client | `auction:{categoryId}` | `{ player, team, finalPrice }` |
| `bidding_started` | Server → Client | `auction:{categoryId}` | `{ player, basePrice, countdown }` |
| `bid_placed` | Server → Client | `auction:{categoryId}` | `{ playerId, currentBid, teamId, countdown }` |
| `countdown_tick` | Server → Client | `auction:{categoryId}` | `{ playerId, countdown }` |
| `auction_ended` | Server → Client | `auction:{categoryId}` | `{ categoryId, stats }` |
| `score_updated` | Server → Client | `match:{matchId}` | `{ matchId, scores }` |
| `match_completed` | Server → Client | `match:{matchId}` | `{ matchId, winner, result }` |
| `live_score` | Server → Client | `tournament:{tournamentId}` | `{ matchId, team1, team2, scores }` |
| `team_roster_updated` | Server → Client | `tournament:{tournamentId}` | `{ teamId, players }` |

---

## 8. Performance & Optimization

### 8.1 Caching Strategy

```typescript
// Cache layers with TTL
const CACHE_CONFIG = {
  // High frequency reads, low changes
  tournament: { ttl: 3600 },           // 1 hour
  categories: { ttl: 3600 },
  teams: { ttl: 1800 },                // 30 minutes
  
  // Frequently changing during events
  leaderboard: { ttl: 60 },            // 1 minute
  auctionState: { ttl: 5 },            // 5 seconds
  liveScores: { ttl: 10 },             // 10 seconds
  
  // User specific
  userProfile: { ttl: 600 },           // 10 minutes
  userRegistrations: { ttl: 300 },     // 5 minutes
};
```

### 8.2 Database Indexing

```typescript
// Essential indexes for performance
// tournament.model.ts
TournamentSchema.index({ status: 1, startDate: 1 });
TournamentSchema.index({ createdBy: 1 });
TournamentSchema.index({ 'venue.city': 1 });

// player.model.ts
PlayerSchema.index({ tournamentId: 1, categoryId: 1, status: 1 });
PlayerSchema.index({ teamId: 1 });
PlayerSchema.index({ userId: 1 });

// match.model.ts
MatchSchema.index({ tournamentId: 1, categoryId: 1, status: 1 });
MatchSchema.index({ 'teams.team1Id': 1 });
MatchSchema.index({ 'teams.team2Id': 1 });
MatchSchema.index({ 'schedule.date': 1 });

// auction.model.ts
AuctionSchema.index({ tournamentId: 1, categoryId: 1 });
AuctionSchema.index({ 'logs.timestamp': -1 });
```

### 8.3 Query Optimization

```typescript
// Use projections to limit returned fields
const tournaments = await Tournament.find({ status: 'ongoing' })
  .select('name sport venue.city startDate bannerImage')
  .lean()
  .limit(20);

// Use aggregation for complex leaderboards
const leaderboard = await Match.aggregate([
  { $match: { categoryId: new ObjectId(categoryId), status: 'completed' } },
  { $unwind: '$scores' },
  { $group: {
    _id: '$scores.winnerId',
    gamesWon: { $sum: 1 },
    pointsFor: { $sum: '$scores.team1Score' },
  }},
  { $sort: { gamesWon: -1 } },
]);
```

### 8.4 Connection Pooling

```typescript
// config/database.ts
const mongoOptions = {
  maxPoolSize: 100,          // Max connections in pool
  minPoolSize: 10,           // Min connections to maintain
  socketTimeoutMS: 45000,    // Socket timeout
  serverSelectionTimeoutMS: 5000,
  heartbeatFrequencyMS: 10000,
};

// config/redis.ts
const redisConfig = {
  socket: {
    connectTimeout: 5000,
    reconnectStrategy: (retries: number) => {
      if (retries > 10) return new Error('Max retries reached');
      return Math.min(retries * 100, 3000);
    },
  },
  maxRetriesPerRequest: 3,
};
```

### 8.5 Rate Limiting

```typescript
// middlewares/rateLimiter.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

export const generalLimiter = rateLimit({
  store: new RedisStore({ client: redisClient }),
  windowMs: 60 * 1000,       // 1 minute
  max: 100,                   // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  store: new RedisStore({ client: redisClient }),
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                    // 10 login attempts
  message: 'Too many login attempts, please try again later',
});

export const bidLimiter = rateLimit({
  store: new RedisStore({ client: redisClient }),
  windowMs: 1000,            // 1 second
  max: 5,                     // 5 bids per second per user
});
```

---

## 9. Security Best Practices

### 9.1 Authentication & Authorization

```typescript
// JWT Configuration
const JWT_CONFIG = {
  accessToken: {
    secret: process.env.JWT_ACCESS_SECRET!,
    expiresIn: '15m',        // Short-lived
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET!,
    expiresIn: '7d',
  },
};

// Role-based access control
export const roles = {
  player: ['read:own', 'register:tournament'],
  staff: ['read:all', 'write:scores', 'manage:auction', 'manage:players'],
  organizer: ['all:tournament', 'manage:staff', 'delete:tournament'],
  admin: ['*'],              // Super admin
};

// Role middleware
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    next();
  };
};
```

### 9.2 Input Validation & Sanitization

```typescript
// All inputs validated at route level
router.post('/tournaments',
  authenticate,
  requireRole('organizer', 'admin'),
  tournamentValidator.create,  // Validation rules
  asyncHandler(tournamentController.create)
);

// Validators use express-validator
export const tournamentValidator = {
  create: [
    body('name')
      .trim()
      .notEmpty().withMessage('Tournament name is required')
      .isLength({ min: 3, max: 100 }).withMessage('Name must be 3-100 characters'),
    body('sport')
      .isIn(['badminton', 'cricket', 'football', 'kabaddi'])
      .withMessage('Invalid sport'),
    body('startDate')
      .isISO8601().withMessage('Invalid date format')
      .custom((value) => new Date(value) > new Date())
      .withMessage('Start date must be in the future'),
    validationMiddleware,  // Throws if validation fails
  ],
};
```

### 9.3 Security Headers & Middleware

```typescript
// app.ts
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';

app.use(helmet());
app.use(mongoSanitize());     // Prevent NoSQL injection
app.use(xss());               // Prevent XSS
app.use(express.json({ limit: '10kb' }));  // Limit body size
```

---

## 10. Testing Strategy

### 10.1 Test Structure

```
tests/
├── unit/
│   ├── services/
│   │   ├── tournament.service.test.ts
│   │   ├── auction.service.test.ts
│   │   └── leaderboard.service.test.ts
│   └── utils/
│       ├── bracketGenerator.test.ts
│       └── scoreCalculator.test.ts
├── integration/
│   ├── auth.test.ts
│   ├── tournament.test.ts
│   ├── auction.test.ts
│   └── match.test.ts
├── e2e/
│   ├── playerJourney.test.ts
│   └── tournamentLifecycle.test.ts
└── fixtures/
    ├── tournaments.ts
    ├── teams.ts
    └── players.ts
```

### 10.2 Test Examples

```typescript
// integration/auction.test.ts
describe('Auction API', () => {
  describe('Manual Auction', () => {
    it('should assign player to team and deduct budget', async () => {
      const response = await request(app)
        .post('/api/v1/auction/manual-assign')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          playerId: testPlayer._id,
          teamId: testTeam._id,
          finalPrice: 5000,
          categoryId: testCategory._id,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.player.teamId).toBe(testTeam._id);
      
      const updatedTeam = await Team.findById(testTeam._id);
      expect(updatedTeam.budget).toBe(testTeam.budget - 5000);
    });

    it('should reject if team has insufficient budget', async () => {
      const response = await request(app)
        .post('/api/v1/auction/manual-assign')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          playerId: testPlayer._id,
          teamId: testTeam._id,
          finalPrice: 999999,  // Exceeds budget
          categoryId: testCategory._id,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Insufficient');
    });
  });
});
```

---

## 11. Deployment & DevOps

### 11.1 Environment Configuration

```env
# .env.example
# Server
NODE_ENV=production
PORT=3000

# Database
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...

# Auth
JWT_ACCESS_SECRET=your-256-bit-secret
JWT_REFRESH_SECRET=your-256-bit-secret
GOOGLE_CLIENT_ID=your-google-client-id

# AWS (for S3 file uploads)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_BUCKET_NAME=kria-sports-assets
AWS_REGION=ap-south-1

# Firebase (for push notifications)
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### 11.2 Docker Configuration

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
EXPOSE 3000
CMD ["npm", "start"]
```

### 11.3 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # Deploy to your platform (AWS ECS, Railway, Render, etc.)
```

---

## 12. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

- [x] **Setup & Configuration**
  - [x] Initialize project with Express + TypeScript
  - [x] Configure MongoDB, Redis connections (with authentication)
  - [x] Setup authentication (JWT with Redis caching + encryption)
  - [ ] Setup Socket.IO infrastructure
  - [x] Configure logging and error handling

- [x] **Core Models & Repositories**
  - [x] Player model + repository (separate from User for auth)
  - [x] Organizer model + repository (with role: organizer/staff)
  - [ ] Tournament model + repository
  - [ ] Team model + repository
  - [ ] Category model + repository
  - [ ] TournamentRegistration model (for player-to-tournament registration)

#### ✅ Auth Implementation Complete (2026-02-05)

**Player Authentication** (`/api/v1/player/auth/`):
- Models: `player.model.ts` (IPlayerStatus: pending → otp_verified → verified)
- Routes: `playerAuth.route.ts`
- Service: `playerAuth.service.ts` (3-step registration, dual login)
- Middleware: `isPlayerLoggedIn.middleware.ts` (JWT + Redis cache validation)
- Endpoints: register, verify-otp, set-password, login, login-with-otp, verify-login-otp, profile, update-profile, update-profile-image, forgot-password, reset-password, resend-otp, fcm-token

**Organizer Authentication** (`/api/v1/organizer/auth/`):
- Models: `organizer.model.ts` (IOrganizerRole: organizer/staff, IOrganizerStatus)
- Routes: `organizerAuth.route.ts`
- Service: `organizerAuth.service.ts` (3-step registration, dual login)
- Middleware: `isOrganizerLoggedIn.middleware.ts` (JWT + Redis cache validation + role check)
- Endpoints: Same as Player + role-based access control

**JWT Strategy**:
- Single `JWT_SECRET` for token signing
- `ACCESS_TOKEN_EXPIRY` from env (default 7d)
- Encrypted JWT caching in Redis (`playerJWTCacheManager`, `organizerJWTCacheManager`)
- Token payload: `{ _id, type: 'player'|'organizer', role? }`

### Phase 2: Tournament Setup (Week 3-4)

- [ ] **Tournament Management**
  - [ ] CRUD for tournaments
  - [ ] Staff management
  - [ ] Team creation and management
  - [ ] Category configuration

- [ ] **Player Registration**
  - [ ] Player registration flow
  - [ ] Approval/rejection by staff
  - [ ] Manual player addition
  - [ ] Player reassignment

### Phase 3: Auction System (Week 5-6)

- [ ] **Manual Auction (Type 1)**
  - [ ] Auction state management
  - [ ] Player assignment with budget deduction
  - [ ] Auction logging
  - [ ] Undo functionality
  - [ ] Real-time updates via Socket.IO

- [ ] **Live Auction (Type 2)**
  - [ ] Real-time bidding
  - [ ] Countdown timer
  - [ ] Automatic player assignment
  - [ ] Concurrency handling

### Phase 4: Match & Scoring (Week 7-8)

- [ ] **Bracket Generation**
  - [ ] League (round-robin) generation
  - [ ] Knockout (single elimination) generation
  - [ ] Hybrid (league → knockout) support

- [ ] **Match Scoring**
  - [ ] Score updates with validation
  - [ ] Match completion and locking
  - [ ] Walkover handling
  - [ ] Real-time score broadcasting

### Phase 5: Leaderboards & Polish (Week 9-10)

- [ ] **Leaderboards & Rankings**
  - [ ] Team leaderboard per category
  - [ ] Player leaderboard per category
  - [ ] Overall tournament rankings
  - [ ] Caching for performance

- [ ] **Notifications & Polish**
  - [ ] Push notifications (FCM)
  - [ ] WhatsApp group link distribution
  - [ ] API documentation (Swagger)
  - [ ] Performance optimization
  - [ ] Security audit

---

## Appendix

### A. Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_001` | 401 | Invalid credentials |
| `AUTH_002` | 401 | Token expired |
| `AUTH_003` | 403 | Insufficient permissions |
| `TOUR_001` | 404 | Tournament not found |
| `TOUR_002` | 400 | Registration is closed |
| `TEAM_001` | 400 | Insufficient budget |
| `TEAM_002` | 404 | Team not found |
| `PLAY_001` | 400 | Player already registered |
| `PLAY_002` | 400 | Player not eligible for auction |
| `AUCT_001` | 400 | Auction not in progress |
| `AUCT_002` | 400 | Bid too low |
| `MATCH_001` | 400 | Match already completed |
| `MATCH_002` | 400 | Invalid score |

### B. Response Format

```typescript
// Success Response
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}

// Error Response
{
  "success": false,
  "error": {
    "code": "AUTH_001",
    "message": "Invalid credentials"
  }
}

// Paginated Response
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

> **Note**: This document serves as the comprehensive backend architecture guide. All implementations must strictly follow the layered architecture and coding standards defined in the project rules.
