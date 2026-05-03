# Fun Friday

A real-time multiplayer party game platform built for team fun. Hosts create game rooms and players join using a room code — no account needed to play.

## Games

| Game | Description | Timer |
|------|-------------|-------|
| **Trivia Quiz** | 4-option multiple choice questions | 15s per question |
| **Word Scramble** | Unscramble the letters to guess the word | 20–35s per word |
| **True or False** | Rapid-fire true/false statements | 10s per statement |

Scoring is speed-based — the faster you answer correctly, the more points you earn.

## Tech Stack

**Backend**
- Node.js + Express + TypeScript
- Socket.io (real-time game engine)
- Prisma ORM + PostgreSQL
- JWT authentication + bcrypt

**Frontend**
- React 18 + TypeScript
- Vite + Tailwind CSS
- Framer Motion (animations)
- Socket.io Client

## Project Structure

```
FunFriday/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # DB models (User, Room, Question, GameSession)
│   │   └── seed.ts             # Seeds 34 questions across all game types
│   └── src/
│       ├── lib/prisma.ts       # Prisma client singleton
│       ├── middleware/auth.ts  # JWT middleware
│       ├── routes/
│       │   ├── auth.ts         # POST /api/auth/login, /register
│       │   └── rooms.ts        # POST/GET /api/rooms
│       ├── sockets/index.ts    # Real-time game logic for all game types
│       └── server.ts           # Express + Socket.io entry point
└── frontend/
    └── src/
        ├── context/
        │   ├── AuthContext.tsx  # JWT auth state (localStorage)
        │   └── SocketContext.tsx
        ├── lib/api.ts           # Authenticated fetch utility
        └── pages/
            ├── Home.tsx         # Player join page
            ├── Login.tsx        # Host login
            ├── Register.tsx     # Host registration
            ├── HostDashboard.tsx# Room management + stats
            └── GameRoom.tsx     # All game UIs (trivia/scramble/t-f)
```

## Getting Started

### Prerequisites
- Node.js 18+
- Docker Desktop (for PostgreSQL)

### 1. Start the database

```bash
docker compose up -d
```

### 2. Set up the backend

```bash
cd backend
npm install
npx prisma db push
npm run seed
```

### 3. Start the backend server

```bash
npm run dev
```

### 4. Start the frontend (new terminal)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

## Environment Variables

**backend/.env**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/funfriday?schema=public"
JWT_SECRET="your-secret-key"
PORT=4000
FRONTEND_URL="http://localhost:5173"
```

**frontend/.env**
```env
VITE_BACKEND_URL=http://localhost:4000
```

## How to Play

### As a Host
1. Click **Host Login** → sign in (default: `admin@funfriday.com` / `admin123`)
2. Click **New Game Room** → select a game type
3. Share the 6-character room code with players
4. Click **Start Game** once players have joined

### As a Player
1. Open the home page
2. Enter your display name and the room code
3. Wait for the host to start — then answer as fast as you can!

## Game Flow

```
Host creates room → Players join with code → Host starts game
→ Questions sent via WebSocket → Players answer (speed-scored)
→ Leaderboard after each question → Winner announced at end
→ Session saved to database
```
