# Kria Sports – React Native Frontend Architecture

> **Mission**: Build a blazing-fast, premium mobile experience for sports tournament management.

---

## 1. Technology Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| **Framework** | React Native 0.73+ | Cross-platform mobile |
| **Language** | TypeScript | Type safety |
| **Navigation** | React Navigation 6 | Screen routing |
| **State** | Zustand + React Query | Global state + server cache |
| **Styling** | NativeWind (Tailwind) | Utility-first styling |
| **Forms** | React Hook Form + Zod | Form handling + validation |
| **Real-time** | Socket.IO Client | Live auction, scores |
| **HTTP** | Axios | API requests |
| **Storage** | MMKV | Secure local storage |
| **Animations** | Reanimated 3 + Moti | Fluid animations |
| **Push** | Firebase Messaging | Notifications |

---

## 2. Project Structure

```
src/
├── app/                    # App entry, providers
├── screens/                # Screen components
│   ├── auth/
│   ├── tournament/
│   ├── team/
│   ├── auction/
│   ├── match/
│   └── profile/
├── components/
│   ├── ui/                 # Primitives (Button, Card, Input)
│   ├── tournament/         # Tournament-specific
│   ├── auction/            # Auction-specific
│   └── match/              # Match-specific
├── navigation/             # Navigation config
├── services/               # API services
├── stores/                 # Zustand stores
├── hooks/                  # Custom hooks
├── utils/                  # Helpers
├── types/                  # TypeScript types
├── constants/              # App constants
└── assets/                 # Images, fonts
```

---

## 3. Core Screens

### Authentication
| Screen | Description |
|--------|-------------|
| `LoginScreen` | Email/password + Google OAuth |
| `RegisterScreen` | New user registration |
| `ForgotPasswordScreen` | Password reset flow |

### Player Flow
| Screen | Description |
|--------|-------------|
| `TournamentListScreen` | Browse available tournaments |
| `TournamentDetailScreen` | View tournament info, categories |
| `RegisterPlayerScreen` | Register for a category |
| `MyTeamScreen` | View assigned team, teammates |
| `MatchScheduleScreen` | Upcoming matches |
| `LeaderboardScreen` | Team & player rankings |
| `LiveScoreScreen` | Real-time match scores |

### Staff/Organizer Flow
| Screen | Description |
|--------|-------------|
| `ManageTournamentScreen` | Tournament CRUD |
| `ManageTeamsScreen` | Team management |
| `PlayerApprovalScreen` | Approve/reject registrations |
| `AuctionControlScreen` | Run manual/live auction |
| `ScoreEntryScreen` | Enter match scores |
| `BracketConfigScreen` | Configure match brackets |

---

## 4. State Management

### Zustand Store Example

```typescript
// stores/authStore.ts
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      login: async (email, password) => {
        set({ isLoading: true });
        const response = await authService.login(email, password);
        set({ user: response.user, token: response.token, isLoading: false });
      },
      logout: () => set({ user: null, token: null }),
    }),
    { name: 'auth-storage', storage: createMMKVStorage() }
  )
);
```

### React Query for Server State

```typescript
// hooks/useTournaments.ts
export const useTournaments = (filters?: TournamentFilters) => {
  return useQuery({
    queryKey: ['tournaments', filters],
    queryFn: () => tournamentService.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useTournamentDetail = (id: string) => {
  return useQuery({
    queryKey: ['tournament', id],
    queryFn: () => tournamentService.getById(id),
    enabled: !!id,
  });
};
```

---

## 5. Real-time Features

### Socket.IO Hook

```typescript
// hooks/useSocket.ts
export const useSocket = () => {
  const { token } = useAuthStore();
  const socket = useMemo(() => io(API_URL, {
    auth: { token },
    transports: ['websocket'],
  }), [token]);

  useEffect(() => {
    socket.connect();
    return () => { socket.disconnect(); };
  }, [socket]);

  return socket;
};

// Usage in Auction Screen
const AuctionScreen = ({ categoryId }) => {
  const socket = useSocket();
  const [currentBid, setCurrentBid] = useState(null);

  useEffect(() => {
    socket.emit('join:auction', categoryId);
    
    socket.on('bid_placed', (data) => setCurrentBid(data));
    socket.on('player_sold', (data) => showSoldAnimation(data));
    
    return () => {
      socket.emit('leave:room', `auction:${categoryId}`);
    };
  }, [categoryId]);
};
```

---

## 6. UI Components

### Design System Tokens

```typescript
// constants/theme.ts
export const colors = {
  primary: { 50: '#eff6ff', 500: '#3b82f6', 900: '#1e3a8a' },
  success: { 500: '#22c55e' },
  warning: { 500: '#f59e0b' },
  error: { 500: '#ef4444' },
  gray: { 50: '#f9fafb', 900: '#111827' },
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const borderRadius = { sm: 4, md: 8, lg: 16, full: 9999 };
```

### Core Components

```typescript
// components/ui/Button.tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
  onPress: () => void;
}

// components/ui/Card.tsx
// components/ui/Input.tsx
// components/ui/Badge.tsx
// components/ui/Avatar.tsx
// components/ui/Skeleton.tsx
```

---

## 7. Performance Optimization

### Best Practices

```typescript
// 1. Memoization
const TeamCard = memo(({ team }) => <Card>...</Card>);

// 2. FlashList for large lists
import { FlashList } from '@shopify/flash-list';
<FlashList data={players} estimatedItemSize={80} renderItem={...} />

// 3. Image optimization
import FastImage from 'react-native-fast-image';
<FastImage source={{ uri, priority: 'high' }} resizeMode="cover" />

// 4. Lazy loading screens
const AuctionScreen = lazy(() => import('./screens/AuctionScreen'));
```

### Bundle Optimization
- Enable Hermes engine
- Use Proguard for Android
- Tree-shake unused imports
- Asset optimization (WebP images)

---

## 8. Offline Support

```typescript
// React Query offline config
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'offlineFirst',
      staleTime: 5 * 60 * 1000,
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
});

// Persist cache
const persister = createAsyncStoragePersister({ storage: AsyncStorage });
```

---

## 9. Testing Strategy

| Type | Tools | Coverage |
|------|-------|----------|
| Unit | Jest | Utilities, hooks |
| Component | React Testing Library | UI components |
| Integration | Detox | User flows |
| E2E | Maestro | Critical paths |

---

## 10. Security

- Secure token storage (MMKV encrypted)
- Certificate pinning
- Biometric authentication
- Input sanitization
- No sensitive data in logs

---

## 11. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Project setup (React Native + TypeScript)
- [ ] Navigation structure
- [ ] Auth flow (login, register, OAuth)
- [ ] Design system & UI components

### Phase 2: Core Features (Week 3-4)
- [ ] Tournament browsing & details
- [ ] Player registration
- [ ] Team view & roster

### Phase 3: Live Features (Week 5-6)
- [ ] Manual auction (staff view)
- [ ] Live auction (bidding UI)
- [ ] Real-time score updates

### Phase 4: Advanced (Week 7-8)
- [ ] Match brackets visualization
- [ ] Leaderboards & rankings
- [ ] Push notifications
- [ ] Offline support

### Phase 5: Polish (Week 9-10)
- [ ] Animations & micro-interactions
- [ ] Performance optimization
- [ ] Testing & bug fixes
- [ ] App store preparation

---

## 12. Key Screen Wireframes

### Tournament List
```
┌─────────────────────────────┐
│  🏸 Kria Sports             │
├─────────────────────────────┤
│ [Search tournaments...]     │
│                             │
│ ┌─────────────────────────┐ │
│ │ 🏆 City Badminton Open  │ │
│ │ 📍 Mumbai | Jan 15-20   │ │
│ │ [Registration Open]     │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ 🏆 State Championship   │ │
│ │ 📍 Delhi | Feb 1-5      │ │
│ │ [Coming Soon]           │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### Live Auction
```
┌─────────────────────────────┐
│  ← Back     LIVE AUCTION    │
├─────────────────────────────┤
│      ┌───────────────┐      │
│      │   [Photo]     │      │
│      │  Rahul Sharma │      │
│      │  ⭐ Advanced  │      │
│      └───────────────┘      │
│                             │
│   Current Bid: ₹15,000      │
│   Team Alpha ✓              │
│                             │
│      ⏱️ 00:12               │
│                             │
│  ┌─────────┐ ┌─────────┐   │
│  │ +1000   │ │ +5000   │   │
│  └─────────┘ └─────────┘   │
│                             │
│  [    PLACE BID: ₹16,000   ]│
└─────────────────────────────┘
```

### Match Score Entry (Staff)
```
┌─────────────────────────────┐
│  ← Back    SCORE ENTRY      │
├─────────────────────────────┤
│  Team Alpha  vs  Team Beta  │
│                             │
│  Game 1:  21 - 18  ✓        │
│  Game 2:  [15] - [21]       │
│  Game 3:  [ ] - [ ]         │
│                             │
│  Match Status: In Progress  │
│                             │
│  [    UPDATE SCORE    ]     │
│  [  COMPLETE MATCH    ]     │
└─────────────────────────────┘
```

---

> **Coding Standards**: Follow React Native best practices, TypeScript strict mode, ESLint + Prettier formatting, and comprehensive error handling.
