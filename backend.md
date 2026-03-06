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
| **Cache** | Redis | JWT token cache, session data |
| **Auth** | JWT (single secret) | Stateless authentication |
| **Validation** | express-validator | Request validation |
| **Real-time** | Socket.IO *(planned)* | Live auction, live scores |
| **File Storage** | AWS S3 | Team logos, player photos, profile images |
| **Email** | Nodemailer (Gmail SMTP) | OTP delivery, notifications |
| **Templates** | EJS | Email templates |
| **Logging** | Winston + AWS CloudWatch | Structured logging |
| **Clustering** | Node.js `cluster` module | Production multi-core |
| **Security** | helmet, xss-clean, express-mongo-sanitize | Request hardening |

### Installed Packages (Actual)

```bash
# Core
express, mongoose, ioredis, cors, dotenv

# Auth & Security
jsonwebtoken, bcryptjs, helmet, xss-clean, express-mongo-sanitize

# Validation
express-validator

# File Upload
multer, @aws-sdk/client-s3, multer-s3

# Email
nodemailer, ejs

# Logging
winston, winston-cloudwatch

# Utilities
xlsx (for bulk Excel uploads)

# Dev
typescript, ts-node-dev, eslint, husky
```
---

## 2. Architecture Overview

### Layered Architecture (Strict Separation)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT (Web App / Mobile)                      │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                         EXPRESS SERVER                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Middleware │──│   Routes    │──│      Controllers        │  │
│  │  (Auth,     │  │ (Validators)│  │  (Request/Response)     │  │
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
│  (Primary DB) │                    │  (JWT Cache)  │    │  (Planned)   │
│               │                    │               │    │              │
└───────────────┘                    └───────────────┘    └──────────────┘
```

### Request Flow (Mandatory)

```
Route → Validator Middleware → validateRequest → Auth Middleware → Controller → Service → Repository → Model → Response via next()
```

---

## 3. Directory Structure

```
src/
├── @types/                     # Custom TypeScript declarations
│   └── custom.d.ts             # Extended Express Request types
│
├── types/
│   └── response.type.ts        # Standardized response format types
│
├── config/
│   └── index.ts                # All env variables (single source)
│
├── controllers/
│   ├── playerAuth.controller.ts
│   ├── organizerAuth.controller.ts
│   ├── tournament.controller.ts
│   ├── team.controller.ts
│   ├── category.controller.ts
│   ├── auction.controller.ts
│   ├── tournamentRegistration.controller.ts
│   ├── sportConfig.controller.ts
│   ├── contact.controller.ts
│   ├── bulkUpload.controller.ts
│   └── health.controller.ts
│
├── services/
│   ├── playerAuth.service.ts
│   ├── organizerAuth.service.ts
│   ├── tournament.service.ts
│   ├── team.service.ts
│   ├── category.service.ts
│   ├── auction.service.ts
│   ├── tournamentRegistration.service.ts
│   ├── sportConfig.service.ts
│   ├── contact.service.ts
│   ├── bulkUpload.service.ts
│   ├── analytics.service.ts
│   ├── crypto.service.ts
│   ├── mail.service.ts
│   ├── upload.service.ts
│   └── cache/
│       ├── index.ts            # Redis client setup
│       ├── manager.ts          # CacheManager class
│       └── entities.ts         # Cache key definitions (playerJWT, organizerJWT, etc.)
│
├── repository/
│   ├── player.repository.ts    # Player auth data access
│   ├── organizer.repository.ts
│   ├── tournament.repository.ts
│   ├── team.repository.ts
│   ├── category.repository.ts
│   ├── auction.repository.ts
│   ├── tournamentRegistration.repository.ts
│   ├── sportConfig.repository.ts
│   ├── contactlead.repository.ts
│   └── impressions.repository.ts
│
├── models/
│   ├── player.model.ts         # Player (authentication entity)
│   ├── organizer.model.ts      # Organizer/Staff (authentication entity)
│   ├── tournament.model.ts
│   ├── team.model.ts
│   ├── category.model.ts
│   ├── auction.model.ts
│   ├── match.model.ts
│   ├── sportConfig.model.ts
│   ├── tournamentRegistration.model.ts  # Player-in-tournament (replaces old Player concept)
│   ├── contactLead.model.ts
│   └── impressions.model.ts
│
├── routes/
│   ├── v1.route.ts              # Route aggregator (mounted at root)
│   ├── playerAuth.route.ts
│   ├── organizerAuth.route.ts
│   ├── tournament.route.ts
│   ├── team.route.ts
│   ├── category.route.ts
│   ├── auction.route.ts
│   ├── tournamentRegistration.route.ts
│   ├── sportConfig.route.ts
│   ├── contact.route.ts
│   └── bulkUpload.route.ts
│
├── middlewares/
│   ├── isPlayerLoggedIn.middleware.ts     # Player JWT auth
│   ├── isOrganizerLoggedIn.middleware.ts  # Organizer JWT auth + role check
│   ├── error-handler.middleware.ts       # globalHandler
│   └── validators/
│       ├── index.ts                      # validateRequest middleware
│       ├── auth.validator.ts
│       ├── tournament.validator.ts
│       ├── team.validator.ts
│       ├── category.validator.ts
│       ├── auction.validator.ts
│       ├── tournamentRegistration.validator.ts
│       ├── sportConfig.validator.ts
│       └── contactlead.validator.ts
│
├── errors/
│   ├── index.ts                # Barrel export
│   ├── custom.error.ts         # Base CustomError class
│   ├── bad-request.error.ts
│   ├── not-found.error.ts
│   ├── unauthorized.error.ts
│   ├── forbidden.error.ts
│   ├── conflict-custom.error.ts
│   ├── internal-server.error.ts
│   ├── not-allowed.error.ts
│   ├── payment-required.error.ts
│   ├── request-validation.error.ts
│   ├── too-many-request.error.ts
│   ├── unprocessable.error.ts
│   └── error-but-ok.error.ts
│
├── utils/
│   ├── asynchandler.ts         # Async wrapper for controllers
│   ├── response.util.ts        # createResponse helper
│   ├── validator.utils.ts      # Common validation helpers
│   ├── multer.util.ts          # File upload (S3 + memory for Excel)
│   ├── s3.util.ts              # AWS S3 client
│   ├── ses.util.ts             # AWS SES client
│   ├── nodemailer.util.ts      # Gmail nodemailer transport
│   ├── hash.util.ts            # Bcrypt helpers
│   ├── date.util.ts            # Date utilities
│   ├── system.util.ts          # System utils (getLocalIP)
│   └── logger/                 # Winston + CloudWatch logger
│
├── templates/                  # EJS email templates
│   ├── otp.ejs
│   ├── verification.ejs
│   ├── reset-password.ejs
│   ├── reset-password-success.ejs
│   ├── contact-us-lead.ejs
│   ├── lead.ejs
│   ├── delete-account.ejs
│   ├── quiz-user-linked.ejs
│   └── spin-user-linked.ejs
│
├── db/
│   └── connect.ts              # MongoDB connection (via Mongoose)
│
├── app.ts                      # Express app setup
└── index.ts                    # Server entry (cluster support)
```

---

## 4. Data Models

### Enum Pattern (Standard)

> **Important**: All models use TypeScript enums for type safety. Define enums separately and use them in both schema and interface.

```typescript
// Example pattern
export enum IPlayerStatus {
    PENDING = 'pending',
    OTP_VERIFIED = 'otp_verified',
    VERIFIED = 'verified',
    SUSPENDED = 'suspended'
}

const playerSchema = new mongoose.Schema({
    status: {
        type: String,
        required: true,
        enum: IPlayerStatus,
        default: IPlayerStatus.PENDING,
    },
}, { timestamps: true });

export interface IPlayer extends mongoose.Document {
    status: string; // Will be one of IPlayerStatus values
}
```

---

### Player Model (`player.model.ts`)

> **Authentication entity for players**. This is NOT the tournament-context player — see `TournamentRegistration` model for that.

```typescript
// Enums
export enum IPlayerStatus {
    PENDING = 'pending',
    OTP_VERIFIED = 'otp_verified',
    VERIFIED = 'verified',
    SUSPENDED = 'suspended'
}

export enum IAuthProvider {
    EMAIL = 'email',
    GOOGLE = 'google'
}

// Schema fields
const playerSchema = new mongoose.Schema({
    firstName: { type: String, required: true, trim: true, maxLength: 50 },
    lastName: { type: String, required: true, trim: true, maxLength: 50 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, minLength: 8 }, // Set after OTP verification
    status: { type: String, required: true, enum: IPlayerStatus, default: IPlayerStatus.PENDING },
    authProvider: { type: String, required: true, enum: IAuthProvider, default: IAuthProvider.EMAIL },
    profileImage: { type: String },
    fcmTokens: [{ type: String }],
    otp: {
        code: { type: String },
        expiresAt: { type: Date },
    },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Indexes
playerSchema.index({ email: 1 });
playerSchema.index({ phone: 1 });
playerSchema.index({ status: 1 });

// Interface
export interface IPlayer extends mongoose.Document {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password?: string;
    status: string;
    authProvider: string;
    profileImage?: string;
    fcmTokens: string[];
    otp?: { code: string; expiresAt: Date };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
```

### Organizer Model (`organizer.model.ts`)

> **Authentication entity for organizers/staff**. Includes organization details. Organizers and staff share this model, differentiated by `role`.

```typescript
// Enums
export enum IOrganizerRole {
    ORGANIZER = 'organizer',
    STAFF = 'staff'
}

export enum IOrganizerStatus {
    PENDING = 'pending',
    OTP_VERIFIED = 'otp_verified',
    VERIFIED = 'verified',
    SUSPENDED = 'suspended'
}

export enum IOrganizerAuthProvider {
    EMAIL = 'email',
    GOOGLE = 'google'
}

// Schema fields
const organizerSchema = new mongoose.Schema({
    firstName: { type: String, required: true, trim: true, maxLength: 50 },
    lastName: { type: String, required: true, trim: true, maxLength: 50 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, minLength: 8 },
    role: { type: String, required: true, enum: IOrganizerRole, default: IOrganizerRole.ORGANIZER },
    status: { type: String, required: true, enum: IOrganizerStatus, default: IOrganizerStatus.PENDING },
    authProvider: { type: String, required: true, enum: IOrganizerAuthProvider, default: IOrganizerAuthProvider.EMAIL },
    profileImage: { type: String },
    organization: {
        name: { type: String, trim: true },
        logo: { type: String },
        description: { type: String },
    },
    fcmTokens: [{ type: String }],
    otp: {
        code: { type: String },
        expiresAt: { type: Date },
    },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Indexes
organizerSchema.index({ email: 1 });
organizerSchema.index({ phone: 1 });
organizerSchema.index({ status: 1, role: 1 });

// Interface
export interface IOrganizer extends mongoose.Document {
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
    organization?: {
        name?: string;
        logo?: string;
        description?: string;
    };
    fcmTokens: string[];
    otp?: { code: string; expiresAt: Date };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
```

### Tournament Model (`tournament.model.ts`)

```typescript
// Enums
export enum ISport {
    BADMINTON = 'badminton',
    CRICKET = 'cricket',
    FOOTBALL = 'football',
    KABADDI = 'kabaddi',
    TABLE_TENNIS = 'table_tennis',
    TENNIS = 'tennis'
}

export enum ITournamentStatus {
    DRAFT = 'draft',
    REGISTRATION_OPEN = 'registration_open',
    REGISTRATION_CLOSED = 'registration_closed',
    AUCTION_IN_PROGRESS = 'auction_in_progress',
    ONGOING = 'ongoing',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
}

export enum IAuctionType {
    MANUAL = 'manual',
    LIVE = 'live'
}

// Interface
export interface ITournament extends mongoose.Document {
    _id: string;
    name: string;
    description?: string;
    sport: string;
    bannerImage?: string;
    startDate: Date;
    endDate: Date;
    venue: {
        name: string;
        address?: string;
        city: string;
        coordinates?: { lat: number; lng: number };
    };
    registrationDeadline: Date;
    status: string;
    createdBy: string;       // Organizer ID
    staffIds: string[];      // Organizer IDs (staff role)
    settings: {
        maxTeams: number;        // default: 8
        defaultBudget: number;   // default: 100000
        auctionType: string;     // default: 'manual'
        allowLateRegistration: boolean;
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
```

### Team Model (`team.model.ts`)

```typescript
export interface ITeam extends mongoose.Document {
    _id: string;
    tournamentId: string;
    name: string;
    logo?: string;
    primaryColor?: string;     // Hex color code (max 7 chars)
    secondaryColor?: string;
    owner: {
        name: string;
        phone: string;
        email?: string;
    };
    whatsappGroupLink?: string;
    budget: number;             // Remaining budget
    initialBudget: number;      // Starting budget
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Indexes
teamSchema.index({ tournamentId: 1 });
teamSchema.index({ tournamentId: 1, name: 1 }, { unique: true });
teamSchema.index({ 'owner.phone': 1 });
```

### Category Model (`category.model.ts`)

```typescript
// Enums
export enum IGender { MALE = 'male', FEMALE = 'female', MIXED = 'mixed' }
export enum IMatchType { SINGLES = 'singles', DOUBLES = 'doubles' }
export enum IBracketType { LEAGUE = 'league', KNOCKOUT = 'knockout', HYBRID = 'hybrid' }
export enum ICategoryStatus {
    SETUP = 'setup',
    REGISTRATION = 'registration',
    AUCTION = 'auction',
    BRACKET_CONFIGURED = 'bracket_configured',
    ONGOING = 'ongoing',
    COMPLETED = 'completed'
}

// Interface
export interface ICategory extends mongoose.Document {
    _id: string;
    tournamentId: string;
    name: string;                   // e.g., "Under 21 - Women (Doubles)"
    gender: string;
    ageGroup: {
        min?: number;
        max?: number;
        label: string;              // e.g., "Under 21", "Open"
    };
    matchType: string;              // 'singles' | 'doubles'
    matchFormat: {
        bestOf: number;             // 1 | 3 | 5
        pointsPerGame: number;      // default: 21
        tieBreakPoints?: number;
    };
    bracketType: string;            // default: 'knockout'
    hybridConfig?: {
        leagueSize: number;
        topN: number;
    };
    status: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Indexes
categorySchema.index({ tournamentId: 1 });
categorySchema.index({ tournamentId: 1, name: 1 }, { unique: true });
categorySchema.index({ status: 1 });
```

### TournamentRegistration Model (`tournamentRegistration.model.ts`)

> **Player-in-tournament context**. Links a Player (auth entity) to a specific tournament+category with profile snapshot, auction data, and stats.

```typescript
// Enums
export enum ITournamentRegistrationStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    AUCTIONED = 'auctioned',
    ASSIGNED = 'assigned',
    WITHDRAWN = 'withdrawn'
}

export enum ISkillLevel {
    BEGINNER = 'beginner',
    INTERMEDIATE = 'intermediate',
    ADVANCED = 'advanced',
    PROFESSIONAL = 'professional'
}

export enum IPlayerGender { MALE = 'male', FEMALE = 'female' }

// Interface
export interface ITournamentRegistration extends mongoose.Document {
    _id: string;
    playerId: string;           // Reference to Player (auth)
    tournamentId: string;
    categoryId: string;
    profile: {
        name: string;
        age: number;
        gender: string;
        phone: string;
        photo?: string;
        skillLevel?: string;
    };
    status: string;
    teamId?: string;            // Assigned after auction
    auctionData?: {
        basePrice: number;      // default: 1000
        soldPrice?: number;
        auctionedAt?: Date;
    };
    stats: {
        matchesPlayed: number;
        matchesWon: number;
        pointsContributed: number;
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Indexes
tournamentRegistrationSchema.index({ tournamentId: 1, categoryId: 1, status: 1 });
tournamentRegistrationSchema.index({ playerId: 1 });
tournamentRegistrationSchema.index({ teamId: 1 });
tournamentRegistrationSchema.index({ playerId: 1, tournamentId: 1, categoryId: 1 }, { unique: true });
```

### Auction Model (`auction.model.ts`)

```typescript
// Enums
export enum IAuctionStatus {
    NOT_STARTED = 'not_started',
    IN_PROGRESS = 'in_progress',
    PAUSED = 'paused',
    SOLD = 'sold',              // Current player just sold
    COMPLETED = 'completed'
}

export enum IAuctionLogType { MANUAL = 'manual', LIVE = 'live' }

// Sub-document Interface
export interface IAuctionLog {
    _id: string;
    registrationId: string;     // TournamentRegistration ID
    playerName: string;
    teamId: string;
    teamName: string;
    finalPrice: number;
    auctionType: string;
    recordedBy: string;         // Organizer ID
    timestamp: Date;
}

export interface ILastSoldResult {
    registrationId: string;
    playerName: string;
    teamId: string;
    teamName: string;
    teamColor: string;
    soldPrice: number;
    timestamp: Date;
}

// Interface
export interface IAuction extends mongoose.Document {
    _id: string;
    tournamentId: string;
    categoryId: string;
    status: string;
    auctionType: string;
    playerQueue: string[];           // Ordered list of registration IDs
    currentPlayerIndex: number;      // Current position in queue
    currentRegistrationId?: string;  // Currently being auctioned
    lastSoldResult?: ILastSoldResult;
    settings: {
        minBidIncrement: number;     // default: 100
        bidDurationSeconds: number;  // default: 30
    };
    logs: IAuctionLog[];
    startedAt?: Date;
    completedAt?: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Indexes
auctionSchema.index({ tournamentId: 1, categoryId: 1 }, { unique: true });
auctionSchema.index({ status: 1 });
auctionSchema.index({ 'logs.timestamp': -1 });
```

### SportConfig Model (`sportConfig.model.ts`)

> **Multi-Sport Support**: Defines sport-specific rules, scoring systems, player counts, and match formats.

```typescript
// Enums
export enum ISportType {
    BADMINTON = 'badminton', CRICKET = 'cricket', FOOTBALL = 'football',
    KABADDI = 'kabaddi', TABLE_TENNIS = 'table_tennis', TENNIS = 'tennis'
}
export enum IScoringType {
    POINTS = 'points', SETS_GAMES = 'sets_games', GOALS = 'goals',
    RUNS_WICKETS = 'runs_wickets', RAID_POINTS = 'raid_points'
}
export enum IMatchDurationType {
    POINTS_BASED = 'points_based', TIME_BASED = 'time_based',
    OVERS_BASED = 'overs_based', SETS_BASED = 'sets_based'
}

// Interface
export interface ISportConfig extends mongoose.Document {
    _id: string;
    sport: string;
    displayName: string;
    scoringType: string;
    matchDurationType: string;
    teamConfig: {
        minPlayersPerTeam: number;
        maxPlayersPerTeam: number;
        playersOnField: number;
        allowSubstitutes: boolean;
    };
    matchFormats: Array<{
        name: string;
        playersPerSide: number;
        description?: string;
    }>;
    scoringConfig: {
        pointsToWin?: number;
        minPointsDifference?: number;
        maxPoints?: number;
        setsToWin?: number;
        gamesPerSet?: number;
        pointsPerGame?: number;
        periodDurationMinutes?: number;
        numberOfPeriods?: number;
        overtimeRules?: string;
        defaultOvers?: number;
        allowTieBreaker: boolean;
        tieBreakerRules?: string;
    };
    bestOfOptions: number[];        // [1, 3, 5, 7]
    scoreLabels: {
        primary?: string;           // "Points", "Goals", "Runs"
        secondary?: string;         // "Games", "Wickets"
        tertiary?: string;          // "Sets"
    };
    defaults: {
        bestOf?: number;
        pointsToWin?: number;
        tieBreakerPoints?: number;
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
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

> **Flexible Scoring**: Uses different score arrays based on sport type. Only populate the relevant array. Uses `mongoose.Types.ObjectId` for relational IDs.

```typescript
// Enums
export enum IMatchStatus {
    SCHEDULED = 'scheduled',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    WALKOVER = 'walkover'
}

// Interface
export interface IMatch extends mongoose.Document {
    _id: string;
    tournamentId: mongoose.Types.ObjectId;
    categoryId: mongoose.Types.ObjectId;
    sportType: string;
    bracketRound: string;
    matchNumber: number;
    teams: {
        team1Id: mongoose.Types.ObjectId;
        team2Id: mongoose.Types.ObjectId;
        team1Name: string;
        team2Name: string;
    };
    players: {
        team1Players: mongoose.Types.ObjectId[];
        team2Players: mongoose.Types.ObjectId[];
    };
    schedule?: {
        date?: Date;
        time?: string;
        court?: string;
        venue?: string;
    };
    status: string;

    // ========== FLEXIBLE SCORING (use based on sport) ==========
    gameScores: IGameScore[];       // Points-based (Badminton, Table Tennis)
    setScores: ISetScore[];         // Sets-based (Tennis)
    periodScores: IPeriodScore[];   // Time-based (Football, Kabaddi)
    inningsScores: IInningsScore[]; // Overs-based (Cricket)

    matchConfig?: {
        bestOf?: number;
        pointsToWin?: number;
        maxOvers?: number;
        periodMinutes?: number;
        numberOfPeriods?: number;
    };
    result?: {
        team1Summary?: string;
        team2Summary?: string;
        team1Total?: number;
        team2Total?: number;
        marginOfVictory?: string;
    };
    winnerId?: mongoose.Types.ObjectId;
    winReason?: string;             // "by_score", "walkover", "forfeit", "dls"
    recordedBy?: mongoose.Types.ObjectId;
    lockedAt?: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Score Sub-interfaces
interface IGameScore {
    gameNumber: number;
    team1Score: number;
    team2Score: number;
    winnerId?: mongoose.Types.ObjectId;
}

interface ISetScore {
    setNumber: number;
    team1Games: number;
    team2Games: number;
    winnerId?: mongoose.Types.ObjectId;
    isTieBreak: boolean;
    tieBreakScore?: { team1: number; team2: number };
}

interface IPeriodScore {
    periodNumber: number;
    periodName?: string;
    team1Score: number;
    team2Score: number;
}

interface IInningsScore {
    inningsNumber: number;
    battingTeamId: mongoose.Types.ObjectId;
    runs: number;
    wickets: number;
    overs: number;
    balls: number;
    extras: { wides: number; noBalls: number; byes: number; legByes: number };
    isDeclared: boolean;
    isAllOut: boolean;
}
```

### ContactLead Model (`contactLead.model.ts`)

> Simple contact form submissions from the landing page.

```typescript
export interface IContactLead extends mongoose.Schema {
    fullName: string;
    email: string;
    subject: string;
    message: string;
    iss: string;          // Issuer / source identifier
    isdCode: string;
    phoneNumber: string;
}
```

### Impressions Model (`impressions.model.ts`)

> Tracks page impressions per game/tournament by country.

```typescript
// Schema: { gameId: ObjectId, country: String }, timestamps: true
// Index: { gameId: 1 }
```

---

## 5. API Endpoints

### Player Authentication (`/player/auth/`)

> **Dual Auth Support**: Players can login via password OR OTP.
> **Registration (3 steps)**: Register → Verify OTP → Set Password

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/register` | Start registration (firstName, lastName, email, phone) | Public |
| POST | `/verify-otp` | Verify registration OTP | Public |
| POST | `/set-password` | Set password to complete registration | Public |
| POST | `/resend-otp` | Resend OTP to email | Public |
| POST | `/login` | Login with password | Public |
| POST | `/login/otp` | Request login OTP (passwordless) | Public |
| POST | `/login/otp/verify` | Verify login OTP | Public |
| POST | `/forgot-password` | Request password reset OTP | Public |
| POST | `/reset-password` | Reset password with OTP | Public |
| POST | `/refresh-token` | Refresh access token | Public |
| GET | `/profile` | Get current player profile | Player |
| PATCH | `/profile` | Update profile | Player |
| PUT | `/profile-image` | Upload profile image (multipart) | Player |
| POST | `/change-password` | Change password (logged in) | Player |
| POST | `/fcm-token` | Register FCM token | Player |
| DELETE | `/fcm-token` | Remove FCM token | Player |

### Organizer Authentication (`/organizer/auth/`)

> Same endpoints as Player auth, plus:

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| PATCH | `/organization` | Update organization details | Organizer |

*All other endpoints are identical to Player auth (register, verify-otp, set-password, login, etc.)*

#### Registration Flow (3 Steps)

```
┌─────────────────────────────────────────────────────────────────┐
│                    REGISTRATION FLOW (Player & Organizer)        │
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
│     → Status updated to 'otp_verified'                           │
│     → Response: { message: "OTP verified. Set password." }       │
│                                                                  │
│  STEP 3: POST /auth/set-password                                 │
│     Body: { email, password }                                    │
│     → Password hashed and stored                                 │
│     → Status updated to 'verified'                               │
│     → JWT token generated                                        │
│     → Response: { accessToken, user }                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Login Flow (Two Options)

```
┌───────────────────────────────────────────────────────────────┐
│  OPTION 1: PASSWORD LOGIN                                      │
│  POST /auth/login  { email, password } → { accessToken, user } │
├───────────────────────────────────────────────────────────────┤
│  OPTION 2: OTP LOGIN (Passwordless)                            │
│  POST /auth/login/otp         { email } → "OTP sent"           │
│  POST /auth/login/otp/verify  { email, otp } → { accessToken } │
└───────────────────────────────────────────────────────────────┘
```

### Tournaments (`/tournament/`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | List all tournaments | Public |
| GET | `/:id` | Get tournament details | Public |
| GET | `/organizer/my-tournaments` | List my tournaments | Organizer |
| POST | `/` | Create tournament | Organizer |
| PUT | `/:id` | Update tournament | Organizer |
| DELETE | `/:id` | Delete tournament | Organizer |
| POST | `/:id/open-registration` | Open registration | Organizer |
| POST | `/:id/close-registration` | Close registration | Organizer |
| POST | `/:id/start-auction` | Start auction phase | Organizer |
| POST | `/:id/start` | Start tournament | Organizer |
| POST | `/:id/complete` | Complete tournament | Organizer |
| POST | `/:id/cancel` | Cancel tournament | Organizer |
| POST | `/:id/staff` | Add staff member | Organizer |
| DELETE | `/:id/staff/:staffId` | Remove staff | Organizer |

### Teams (``)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/tournaments/:tournamentId/teams` | List teams by tournament | Public |
| GET | `/teams/:id` | Get team details | Public |
| POST | `/tournaments/:tournamentId/teams` | Create team | Organizer |
| PUT | `/teams/:id` | Update team | Organizer |
| DELETE | `/teams/:id` | Delete team | Organizer |
| PUT | `/teams/:id/budget` | Update team budget | Organizer |
| POST | `/teams/:id/reset-budget` | Reset team budget | Organizer |

### Categories (``)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/tournaments/:tournamentId/categories` | List categories | Public |
| GET | `/categories/:id` | Get category details | Public |
| POST | `/tournaments/:tournamentId/categories` | Create category | Organizer |
| PUT | `/categories/:id` | Update category | Organizer |
| DELETE | `/categories/:id` | Delete category | Organizer |
| POST | `/categories/:id/open-registration` | Open registration | Organizer |
| POST | `/categories/:id/start-auction` | Start auction | Organizer |
| POST | `/categories/:id/configure-bracket` | Configure bracket | Organizer |
| POST | `/categories/:id/start` | Start category | Organizer |
| POST | `/categories/:id/complete` | Complete category | Organizer |

### Tournament Registration (`/registrations/`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/register` | Register for tournament category | Player |
| GET | `/my-registrations` | Get my registrations | Player |
| POST | `/:id/withdraw` | Withdraw registration | Player |
| GET | `/tournaments/:tournamentId` | Get registrations by tournament | Organizer |
| GET | `/categories/:categoryId` | Get registrations by category | Public |
| POST | `/:id/approve` | Approve registration | Organizer |
| POST | `/:id/reject` | Reject registration | Organizer |
| POST | `/bulk-approve` | Bulk approve registrations | Organizer |
| POST | `/:id/assign` | Assign player to team (auction) | Organizer |
| POST | `/:id/manual-assign` | Manual assign/reassign | Organizer |
| POST | `/:id/unassign` | Unassign player from team | Organizer |
| GET | `/teams/:teamId/roster` | Get team roster | Public |
| GET | `/categories/:categoryId/available` | Get available for auction | Organizer |
| POST | `/bulk-upload` | Bulk upload players via Excel | Public (no auth) |

### Auction (`/auction/`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/:tournamentId/:categoryId/status` | Get auction status (polling) | Public |
| GET | `/:tournamentId/:categoryId/sold-log` | Get sold log | Public |
| POST | `/start` | Start auction for category | Organizer |
| POST | `/sell` | Sell current player to team | Organizer |
| POST | `/next` | Move to next player | Organizer |
| POST | `/skip` | Skip current player (unsold) | Organizer |
| POST | `/undo` | Undo last action | Organizer |
| POST | `/pause` | Pause/Resume auction | Organizer |

### Sport Configuration (`/sports/`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | Get all sport configs | Public |
| GET | `/:sport` | Get config by sport name | Public |
| POST | `/seed` | Seed default sport configs | Organizer |
| POST | `/` | Create sport config | Organizer |
| PUT | `/:id` | Update sport config | Organizer |
| DELETE | `/:id` | Delete sport config | Organizer |

### Contact (`/contact/`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/` | Submit contact lead | Public |

### Health & Utility

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | Hello world | Public |
| GET | `/health` | Health check | Public |
| GET | `/country` | Get country by IP | Public |

---

## 6. Core Features Implementation

### 6.1 Tournament Lifecycle

```
┌─────────┐    ┌──────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│  DRAFT  │───▶│ REG_OPEN     │───▶│ REG_CLOSED       │───▶│ AUCTION_IN_PROGRESS │
└─────────┘    └──────────────┘    └──────────────────┘    └──────────┬──────────┘
                                                                       │
                                         ┌─────────┐    ┌─────────────▼──┐
                                         │COMPLETED│◀───│    ONGOING     │
                                         └─────────┘    └────────────────┘
                                                   ┌──────────┐
                              (any state) ────────▶│ CANCELLED│
                                                   └──────────┘
```

### 6.2 Auction System (Manual)

The auction operates with a **player queue model**:

1. **Start**: Organizer initiates auction for a category → approved registrations are loaded into `playerQueue`
2. **Present**: Current player (`currentRegistrationId`) is shown on the auction display
3. **Sell**: Organizer assigns current player to a team at a price → budget deducted, registration status updated, log recorded, `lastSoldResult` stored
4. **Next**: Moves to next player in queue (`currentPlayerIndex` incremented)
5. **Skip**: Skips a player (goes unsold)
6. **Undo**: Reverses the last sell action → restores budget, resets registration status
7. **Pause/Resume**: Pauses/resumes the auction
8. **Complete**: All players processed → auction status set to `completed`

### 6.3 Category Lifecycle

```
┌───────┐    ┌──────────────┐    ┌─────────┐    ┌─────────────────────┐    ┌─────────┐    ┌───────────┐
│ SETUP │───▶│ REGISTRATION │───▶│ AUCTION │───▶│ BRACKET_CONFIGURED  │───▶│ ONGOING │───▶│ COMPLETED │
└───────┘    └──────────────┘    └─────────┘    └─────────────────────┘    └─────────┘    └───────────┘
```

---

## 7. Real-time Features

> **Status: Planned** — Socket.IO infrastructure is not yet implemented. The auction display currently uses polling via `GET /auction/:tournamentId/:categoryId/status`.

### Planned Socket.IO Events

| Event | Direction | Room | Payload |
|-------|-----------|------|---------|
| `player_sold` | Server → Client | `auction:{categoryId}` | `{ player, team, finalPrice }` |
| `bidding_started` | Server → Client | `auction:{categoryId}` | `{ player, basePrice, countdown }` |
| `bid_placed` | Server → Client | `auction:{categoryId}` | `{ playerId, currentBid, teamId, countdown }` |
| `score_updated` | Server → Client | `match:{matchId}` | `{ matchId, scores }` |
| `match_completed` | Server → Client | `match:{matchId}` | `{ matchId, winner, result }` |

---

## 8. Performance & Optimization

### 8.1 Caching Strategy

JWT tokens are encrypted and cached in Redis for fast authentication validation:

```typescript
// Cache entities defined in services/cache/entities.ts
// playerJWTCacheManager — stores encrypted player JWTs
// organizerJWTCacheManager — stores encrypted organizer JWTs

// Cache key pattern: SERVER_NAME + prefix + sorted params
```

### 8.2 Database Indexing

All indexes are defined directly in model schemas:

```typescript
// tournament.model.ts
tournamentSchema.index({ status: 1, startDate: 1 });
tournamentSchema.index({ createdBy: 1 });
tournamentSchema.index({ 'venue.city': 1 });
tournamentSchema.index({ sport: 1, status: 1 });

// tournamentRegistration.model.ts
tournamentRegistrationSchema.index({ tournamentId: 1, categoryId: 1, status: 1 });
tournamentRegistrationSchema.index({ playerId: 1, tournamentId: 1, categoryId: 1 }, { unique: true });

// match.model.ts
matchSchema.index({ tournamentId: 1, categoryId: 1, status: 1 });
matchSchema.index({ categoryId: 1, bracketRound: 1, matchNumber: 1 }, { unique: true });

// auction.model.ts
auctionSchema.index({ tournamentId: 1, categoryId: 1 }, { unique: true });
```

### 8.3 Production Clustering

```typescript
// index.ts — uses Node.js cluster module
const numCPUs = process.env.NODE_ENV === 'production' ? os.cpus().length : 1;
// Master forks workers, auto-restarts on crash
```

---

## 9. Security Best Practices

### 9.1 Authentication & Authorization

**JWT Strategy:**
- Single `JWT_SECRET` for token signing
- `ACCESS_TOKEN_EXPIRY` from env (default 7d)
- Encrypted JWT caching in Redis (`playerJWTCacheManager`, `organizerJWTCacheManager`)
- Token payload: `{ _id, type: 'player'|'organizer', role? }`

**Custom Express Typings:**
```typescript
declare namespace Express {
  export interface Request {
    player: { _id: string };
    organizer: { _id: string; role: string };
    access_token: string | null;
  }
}
```

**Two separate auth middlewares:**
- `isPlayerLoggedIn` — validates player JWT, populates `req.player`
- `isOrganizerLoggedIn` — validates organizer JWT, populates `req.organizer` (includes role)

### 9.2 Input Validation & Sanitization

```typescript
// All inputs validated at route level using express-validator
// Pattern: validator middleware → validateRequest middleware → controller

// Example route
tournamentRouter.post('/',
  isOrganizerLoggedIn,
  createTournamentValidator,  // express-validator rules
  validateRequest,            // throws RequestValidationError if invalid
  asyncHandler(createTournament)
);
```

### 9.3 Security Middleware Stack

```typescript
// app.ts
app.use(express.json({ limit: '8mb' }));
app.use(cors());
app.use(xss());                          // Prevent XSS
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  frameguard: false,
}));
app.use(mongoSanitize());               // Prevent NoSQL injection
```

### 9.4 Error Handling

**Custom Error Classes:**

| Error Class | HTTP Status |
|-------------|-------------|
| `BadRequestError` | 400 |
| `UnauthorizedError` | 401 |
| `PaymentRequired` | 402 |
| `ForbiddenError` | 403 |
| `NotFoundError` | 404 |
| `NotAllowedError` | 405 |
| `ConflictErrorJSON` | 409 |
| `UnprocessableError` | 422 |
| `TooManyRequestsError` | 429 |
| `InternalServerError` | 500 |
| `RequestValidationError` | 400 (with field-level errors) |
| `ErrorButOkError` | 200 (error state but HTTP OK) |

**Error Flow:**
```
Service throws error → asyncHandler catches → globalHandler middleware formats response
```

---

## 10. Testing Strategy

> **Status: Not yet implemented.** Testing infrastructure is planned for a future phase.

---

## 11. Deployment & DevOps

### 11.1 Environment Configuration

```env
# Server
NODE_ENV=production
PORT=4010
SERVER_NAME=kria-sports

# Database
MONGO_URI=mongodb+srv://...
REDIS_HOST=...
REDIS_PORT=...
REDIS_USERNAME=...
REDIS_PASSWORD=...

# Auth
JWT_SECRET=...
ACCESS_TOKEN_EXPIRY=7d
JWT_CACHE_ENCRYPTION_KEY=...

# AWS
AWS_ACCESS_ID=...
AWS_SECRET=...
AWS_REGION=ap-south-1
S3_BUCKET_NAME=...

# CloudWatch Logging
CLOUDWATCH_LOG_GROUP_NAME=...
CLOUDWATCH_LOGS_ID=...
CLOUDWATCH_LOGS_SECRET=...
CLOUDWATCH_LOGS_REGION=...

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Email (Gmail SMTP)
GMAIL_USER=...
GMAIL_PASSWORD=...

# Notifications
NOTIFY_TO=...
```

### 11.2 Commit & Quality

- Husky enforced commit messages
- Pre-commit runs: `lint:fix`, `build`
- ESLint configured

---

## 12. Implementation Roadmap

### Phase 1: Foundation ✅

- [x] **Setup & Configuration**
  - [x] Initialize project with Express + TypeScript
  - [x] Configure MongoDB, Redis connections (with authentication)
  - [x] Setup authentication (JWT with Redis caching + encryption)
  - [ ] Setup Socket.IO infrastructure
  - [x] Configure logging (Winston + CloudWatch)
  - [x] Configure error handling (custom error classes + globalHandler)

- [x] **Core Models & Repositories**
  - [x] Player model + repository (authentication entity)
  - [x] Organizer model + repository (with role: organizer/staff)
  - [x] Tournament model + repository
  - [x] Team model + repository
  - [x] Category model + repository
  - [x] TournamentRegistration model + repository
  - [x] SportConfig model + repository
  - [x] ContactLead model + repository
  - [x] Impressions model + repository

### ✅ Auth Implementation Complete

**Player Authentication** (`player/auth/`):
- Models: `player.model.ts` (IPlayerStatus: pending → otp_verified → verified)
- Routes: `playerAuth.route.ts`
- Service: `playerAuth.service.ts` (3-step registration, dual login)
- Middleware: `isPlayerLoggedIn.middleware.ts` (JWT + Redis cache validation)
- Endpoints: register, verify-otp, set-password, login, login-with-otp, verify-login-otp, profile, update-profile, update-profile-image, forgot-password, reset-password, resend-otp, fcm-token, refresh-token, change-password

**Organizer Authentication** (`organizer/auth/`):
- Models: `organizer.model.ts` (IOrganizerRole: organizer/staff, IOrganizerStatus)
- Routes: `organizerAuth.route.ts`
- Service: `organizerAuth.service.ts` (3-step registration, dual login)
- Middleware: `isOrganizerLoggedIn.middleware.ts` (JWT + Redis cache validation + role check)
- Endpoints: Same as Player + organization update

**JWT Strategy**:
- Single `JWT_SECRET` for token signing
- `ACCESS_TOKEN_EXPIRY` from env (default 7d)
- Encrypted JWT caching in Redis (`playerJWTCacheManager`, `organizerJWTCacheManager`)
- Token payload: `{ _id, type: 'player'|'organizer', role? }`

### Phase 2: Tournament Setup ✅

- [x] **Tournament Management**
  - [x] Full CRUD for tournaments
  - [x] Staff management (add/remove)
  - [x] Status lifecycle (draft → registration_open → ... → completed/cancelled)
  - [x] Team creation and management (with budget management)
  - [x] Category configuration (with status lifecycle)
  - [x] Sport configuration (CRUD + seed endpoint)

- [x] **Player Registration**
  - [x] Player registration flow (register for tournament+category)
  - [x] Approval/rejection by organizer
  - [x] Bulk approval
  - [x] Manual player assignment and reassignment
  - [x] Withdrawal support
  - [x] Team roster view
  - [x] Bulk upload via Excel

### Phase 3: Auction System ✅

- [x] **Manual Auction**
  - [x] Auction state management (not_started → in_progress → paused → sold → completed)
  - [x] Player queue with sequential processing
  - [x] Player sell with budget deduction
  - [x] Auction logging
  - [x] Undo functionality
  - [x] Next/Skip player navigation
  - [x] Pause/Resume
  - [x] Public polling endpoint for auction display
  - [x] Sold log endpoint

- [ ] **Live Auction (Type 2)**
  - [ ] Real-time bidding via Socket.IO
  - [ ] Countdown timer
  - [ ] Automatic player assignment
  - [ ] Concurrency handling

### Phase 4: Match & Scoring *(Planned)*

- [ ] **Bracket Generation**
  - [ ] League (round-robin) generation
  - [ ] Knockout (single elimination) generation
  - [ ] Hybrid (league → knockout) support

- [ ] **Match Scoring**
  - [ ] Score updates with validation
  - [ ] Match completion and locking
  - [ ] Walkover handling
  - [ ] Real-time score broadcasting

### Phase 5: Leaderboards & Polish *(Planned)*

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

### A. Response Format

```typescript
// Standardized response type (types/response.type.ts)
export interface IResponseFormat {
    statusCode: number;
    data?: any;
    message: string;
    errors?: IErrorFormat[];  // Field-level validation errors
    success: boolean;
    error?: string;
}

// Success Response
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}

// Error Response
{
  "success": false,
  "error": "Error description",
  "message": "Something went wrong"
}

// Validation Error Response
{
  "success": false,
  "errors": [
    { "message": "Email is required", "field": "email" }
  ],
  "message": "Validation failed"
}
```

### B. File Upload Configuration

```typescript
// utils/multer.util.ts
// profileImageUpload — S3 upload for profile images
// excelUpload — Memory storage for Excel bulk uploads

// Supported: image/jpeg, image/png, image/webp (max 5MB)
// Excel: .xlsx files via memory storage for processing
```

---

> **Note**: This document reflects the current state of the implemented backend as of February 2026. All implementations follow the layered architecture (Controller → Service → Repository → Model) and coding standards defined in the project rules.
