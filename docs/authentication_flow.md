# Kria Sports - Authentication Flow Documentation

## Architecture Overview

The authentication system is split into **two separate flows**:

```
┌──────────────────────────┐     ┌──────────────────────────┐
│     PLAYER AUTH          │     │   ORGANIZER AUTH         │
│  /api/v1/player/auth/*   │     │  /api/v1/organizer/auth/*│
├──────────────────────────┤     ├──────────────────────────┤
│  Model: Player           │     │  Model: Organizer        │
│  Middleware: isPlayerLoggedIn  │  Middleware: isOrganizerLoggedIn
│  Token type: player      │     │  Token type: organizer   │
│                          │     │  Role: organizer | staff │
└──────────────────────────┘     └──────────────────────────┘
```

**Key Decision**: Players and Organizers have **separate accounts**. Someone who is both must register separately for each.

---

## 1. Player Authentication

Base URL: `/api/v1/player/auth`

### 1.1 Registration Flow (3 Steps)

```
Step 1: POST /register
────────────────────
Body: { firstName, lastName, email, phone }
Response: { status: "pending" }
→ OTP sent to email

Step 2: POST /verify-otp
───────────────────────
Body: { email, otp }
Response: { status: "otp_verified" }

Step 3: POST /set-password
─────────────────────────
Body: { email, password }
Response: { accessToken, refreshToken, player }
→ Registration complete
```

### 1.2 Login Options

| Method | Endpoint | Body |
|--------|----------|------|
| Password | `POST /login` | `{ email, password }` |
| OTP | `POST /login/otp` then `POST /login/otp/verify` | `{ email }` then `{ email, otp }` |

### 1.3 Password Management

| Action | Endpoint | Body |
|--------|----------|------|
| Forgot | `POST /forgot-password` | `{ email }` |
| Reset | `POST /reset-password` | `{ email, otp, newPassword }` |
| Change | `POST /change-password` (auth) | `{ currentPassword, newPassword }` |

### 1.4 Profile (Authenticated)

| Action | Endpoint | Body |
|--------|----------|------|
| Get | `GET /profile` | - |
| Update | `PATCH /profile` | `{ firstName?, lastName?, phone? }` |
| Image | `PUT /profile-image` | multipart: `image` |

---

## 2. Organizer Authentication

Base URL: `/api/v1/organizer/auth`

Same endpoints as Player, plus:

| Action | Endpoint | Body |
|--------|----------|------|
| Update Org | `PATCH /organization` | `{ name?, logo?, description? }` |

**Role**: Set during registration (`organizer` or `staff`)

---

## 3. Token Structure

```json
// Player token
{ "id": "player_id", "type": "player" }

// Organizer token
{ "id": "organizer_id", "type": "organizer", "role": "organizer|staff" }
```

- **Access Token**: 15 min expiry
- **Refresh Token**: 7 days expiry

---

## 4. FCM Token Management

Both Player and Organizer:
- `POST /fcm-token` - Add token `{ token }`
- `DELETE /fcm-token` - Remove token `{ token }`

---

## 5. Status Flow

```
PENDING → OTP_VERIFIED → VERIFIED
                           ↓
                       SUSPENDED
```

---

## 6. Required Environment Variables

```
GMAIL_USER=your-email@gmail.com
GMAIL_PASSWORD=your-app-password
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
```

---

## 7. File Structure

```
src/
├── models/
│   ├── player.model.ts         # Player auth
│   ├── organizer.model.ts      # Organizer/Staff auth  
│   └── tournamentRegistration.model.ts  # Player joins tournament
├── repository/
│   ├── player.repository.ts
│   └── organizer.repository.ts
├── services/
│   ├── playerAuth.service.ts
│   ├── organizerAuth.service.ts
│   └── mail.service.ts
├── controllers/
│   ├── playerAuth.controller.ts
│   └── organizerAuth.controller.ts
├── middlewares/
│   ├── isPlayerLoggedIn.middleware.ts
│   └── isOrganizerLoggedIn.middleware.ts
└── routes/
    ├── playerAuth.route.ts
    ├── organizerAuth.route.ts
    └── v1.route.ts
```
