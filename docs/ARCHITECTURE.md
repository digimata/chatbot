---
path: ARCHITECTURE.md
outline: |
  • Architecture                               L17
    ◦ Directory Structure                      L25
    ◦ Core Systems                             L50
      ▪ AI Layer (src/lib/ai/)                 L52
      ▪ Artifacts (src/artifacts/)             L63
      ▪ Database (src/lib/db/)                 L71
      ▪ Authentication (src/app/(auth)/)       L87
      ▪ Middleware (src/proxy.ts)              L95
    ◦ Data Flow                               L107
    ◦ Key Dependencies                        L114
    ◦ Infrastructure                          L126
---

# Architecture

Last updated: `2026.03.20`

> Next.js 16 chatbot with multi-model AI support, artifact generation, and real-time streaming.

---

## Directory Structure

```
src/
├── app/              # Next.js App Router (routes, layouts, API handlers)
│   ├── (auth)/       # Login, register, guest auth, NextAuth config
│   └── (chat)/       # Chat UI, API routes (chat, history, models, vote, documents)
├── artifacts/        # Artifact type handlers (text, code, sheet, image)
├── components/
│   ├── ai-elements/  # Model selector, prompt input, slash commands
│   ├── chat/         # Shell, sidebar, messages, editors, toolbar
│   └── ui/           # Radix-based primitives (shadcn)
├── hooks/            # React hooks (chat state, artifacts, auto-resume, scroll)
└── lib/
    ├── ai/           # Model registry, providers, prompts, tools
    │   └── tools/    # getWeather, createDocument, editDocument, updateDocument, requestSuggestions
    ├── db/           # Drizzle schema, queries, migrations
    ├── artifacts/    # Artifact utilities
    └── editor/       # Prosemirror editor config
tests/                # Playwright e2e tests
public/               # Static assets
```

---

## Core Systems

### AI Layer (`src/lib/ai/`)

Models are routed through the **Vercel AI Gateway** (`gateway.languageModel()`), which handles provider fallback chains. The default model is `moonshotai/kimi-k2-0905`. Each model declares capabilities — tools, vision, reasoning — which gate what features the UI exposes.

Chat completions use the AI SDK's `streamText()`. The system prompt is request-aware (injects geolocation) and varies by context: regular chat, artifact creation, code generation, or spreadsheet generation.

**Tools** follow the AI SDK tool pattern with Zod schemas:
- `createDocument` / `updateDocument` / `editDocument` — artifact CRUD via document handlers
- `requestSuggestions` — generates writing improvements via structured output
- `getWeather` — geocodes cities and fetches Open-Meteo data

### Artifacts (`src/artifacts/`)

Four artifact types: **text**, **code**, **sheet**, **image**. Each type has:
- `server.ts` — document handler that streams creation/update via `dataStream`
- `client.tsx` — editor component (Prosemirror for text, CodeMirror for code, React Data Grid for sheets)

Streaming uses typed delta parts (`textDelta`, `codeDelta`, `sheetDelta`) pushed through the AI SDK's data stream protocol. Documents are versioned — each save creates a new row keyed by `(id, createdAt)`, enabling version navigation.

### Database (`src/lib/db/`)

**Drizzle ORM** with PostgreSQL. Key tables:

| Table | Purpose |
|---|---|
| `user` | Accounts (regular + guest) with bcrypt passwords |
| `chat` | Conversations with title, visibility (public/private) |
| `message_v2` | Messages with role, parts (JSON), attachments |
| `document` | Artifact content, versioned by `(id, createdAt)` |
| `vote_v2` | Per-message thumbs up/down |
| `suggestion` | Writing suggestions linked to documents |
| `stream` | Resumable stream metadata (Redis-backed) |

History uses cursor-based pagination (`startingAfter`/`endingBefore`).

### Authentication (`src/app/(auth)/`)

**NextAuth.js v5** with two credential providers:
1. **Email/password** — bcrypt hashing, timing-attack-safe comparison
2. **Guest** — auto-created anonymous users (`guest-{timestamp}`)

Sessions are JWT-based. The middleware (`src/proxy.ts`) validates tokens on every request and redirects unauthenticated users to the guest flow.

### Middleware (`src/proxy.ts`)

Edge middleware that runs on all non-static routes:
- `/ping` → health check
- `/api/auth/*` → passthrough
- No token → redirect to `/api/auth/guest`
- Authenticated non-guests → blocked from `/login`, `/register`

Base-path aware for multi-tenant deployment (`IS_DEMO` env).

---

## Data Flow

1. **User sends message** → `POST /api/chat` → `saveChat()` + `saveMessages()` → `streamText()` streams response
2. **Model calls tool** → tool handler executes (e.g., `createDocument`) → document handler streams deltas → `Document` row saved
3. **Stream interrupted** → `resumable-stream` persists to Redis → client reconnects via `/api/chat/[id]/stream` → resumes from last position
4. **Artifact editing** → `editDocument` tool does find-and-replace → diff view shown → new version saved

## Key Dependencies

| Category | Libraries |
|---|---|
| AI | `ai`, `@ai-sdk/react` (Vercel AI SDK) |
| Database | `drizzle-orm`, `postgres` |
| Auth | `next-auth` v5 beta, `bcrypt-ts` |
| Editors | `prosemirror-*`, `codemirror`, `react-data-grid` |
| Rendering | `streamdown`, `shiki`, `katex` |
| UI | `radix-ui`, `lucide-react`, `tailwindcss` v4 |
| Infra | `@vercel/blob`, `@vercel/otel`, `redis` |

## Infrastructure

- **Rate limiting** — Redis-based, 10 messages/IP/hour (production only)
- **Error handling** — Typed `ChatbotError` with codes, surfaces, and visibility rules
- **Observability** — OpenTelemetry via `@vercel/otel`
- **Bot protection** — `botid` integration on `/api/chat`
- **Deployment** — Vercel with optional `IS_DEMO` base path config
