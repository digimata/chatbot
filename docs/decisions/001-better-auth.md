---
path: docs/decisions/001-better-auth.md
outline: |
  • ADR-001 :: Migrate from NextAuth to BetterAuth               L18
    ◦ 1. Context                                                 L31
    ◦ 2. Problem                                                 L39
    ◦ 3. Options considered                                      L55
      ▪ A. Stay on NextAuth v5 beta                              L57
      ▪ B. Migrate to BetterAuth                                 L62
      ▪ C. Roll our own auth                                     L67
      ▪ D. Use a managed auth service (Clerk, Auth0, etc.)       L72
    ◦ 4. Decision                                                L79
    ◦ 5. Risks and tradeoffs                                     L95
    ◦ 6. Migration feasibility                                  L107
    ◦ 7. When to revisit                                        L128
---

# ADR-001 :: Migrate from NextAuth to BetterAuth

Last updated: `2026.03.20`

| Field | Value |
|---|---|
| Status | proposed |
| Affects | `src/app/(auth)/`, `src/proxy.ts`, `src/lib/db/schema.ts`, `src/lib/db/queries.ts`, all API routes under `src/app/(chat)/api/` |
| Supersedes | — |
| Related | T-0001 |

---

## 1. Context

The chatbot uses NextAuth v5 (`next-auth@5.0.0-beta.25`) for authentication. The auth surface is small: email/password credentials, auto-created guest sessions, JWT-based stateless sessions verified at the edge, and ~12 API route call sites that read `session.user.id`.

This has worked fine. The question is whether to stay on NextAuth or move before we invest further in auth-adjacent features (OAuth providers, session management, entitlements).

---

## 2. Problem

**NextAuth v5 is abandoned software.** It has been in beta since 2023 — over three years without a stable release. In September 2025, the Auth.js project was formally absorbed into BetterAuth. The BetterAuth team now maintains security patches for Auth.js but has stated that new feature development happens in BetterAuth only.

This creates three concrete risks for us:

1. **Dependency rot.** We're pinned to a beta that will receive diminishing maintenance. Every Next.js major version is a potential breakage point with no guarantee of a timely fix upstream.

2. **Workarounds accumulate.** NextAuth v5's credential provider support has always been second-class — it was designed around OAuth. Our auth config already has workarounds: a dummy password comparison for timing-attack safety, custom JWT/session type augmentations to thread `UserType` through, and a separate guest credential provider that abuses the credentials flow. These aren't bugs, but they're friction that compounds as we build on top.

3. **Future features require more hacking.** If we add OAuth providers, account linking, or more granular session management, we'd be building on a frozen beta. BetterAuth has these as first-class features with active development.

The cost of migrating increases over time as more code depends on NextAuth's session shape. The auth surface is small right now. It won't stay that way.

---

## 3. Options considered

### A. Stay on NextAuth v5 beta

- **For:** Zero effort. It works today. "If it ain't broke."
- **Against:** It is broke — it's a beta of a project that no longer exists independently. We'd be choosing to accumulate tech debt on a dead dependency. Every month we wait, the migration cost grows as more code touches `auth()`.

### B. Migrate to BetterAuth

- **For:** Active maintenance, TypeScript-first, first-class support for everything we use (email/password, anonymous users, Drizzle, stateless sessions). The anonymous plugin even uses the same `isAnonymous` field we already have. The migration is lossless — every feature maps 1:1 with no behavior change.
- **Against:** Migration effort (~1 day of work). One-time session invalidation on deploy (all users re-authenticate — guests auto-recreate, regular users log in again).

### C. Roll our own auth

- **For:** Full control, no external dependency.
- **Against:** Massive scope increase for a chatbot. Session management, CSRF, cookie security, password hashing — all solved problems we'd be re-solving. Not where we should spend time.

### D. Use a managed auth service (Clerk, Auth0, etc.)

- **For:** Zero maintenance.
- **Against:** External dependency on a paid service, vendor lock-in, latency on every auth check, overkill for our use case. We don't need multi-tenant, RBAC, or a pre-built login UI. We need email/password and guest sessions.

---

## 4. Decision

**Option B — migrate to BetterAuth.** The migration is bounded, lossless, and eliminates a dead dependency before it becomes load-bearing.

Key choices within the migration:

- **Stateless cookie-cached sessions** (`cookieCache` with `refreshCache: true`, `strategy: "jwe"`). This preserves the current zero-DB-hit, edge-compatible auth model. The server decrypts the cookie locally — no database query on `getSession()`, no TCP from the edge. Functionally identical to the current NextAuth JWT setup.

- **Anonymous plugin** for guest flow. Replaces the custom guest credential provider. Uses the same `isAnonymous` field we already have on the user table.

- **Custom bcrypt-ts hash/verify** via BetterAuth's `password.hash`/`password.verify` options. Existing password hashes work without modification. No rehashing, no user disruption.

- **Derive guest/regular from `isAnonymous`** instead of threading a custom `UserType` claim through JWT → session. Simplifies the session shape — only two consumers need updating.

---

## 5. Risks and tradeoffs

**Session invalidation on deploy.** Cookie format changes from NextAuth JWT to BetterAuth JWE. All existing sessions are invalidated. Guest users auto-recreate transparently. Regular users must log in again. This is a one-time event and is acceptable.

**No per-session revocation.** Same tradeoff as today's JWT setup — we can version-bump cookies to invalidate all sessions, but can't revoke a specific session. Acceptable for a chatbot with anonymous guests. If this changes, BetterAuth supports a hybrid mode (cookie cache + Redis secondary storage) that adds per-session revocation without switching to full database sessions.

**BetterAuth is younger software.** It's been around since mid-2024 and is moving fast. There's a risk of API churn. Mitigated by: our auth surface is small, the library has strong adoption momentum (absorbed Auth.js), and we're using stable core features (email/password, sessions) not bleeding-edge plugins.

**Schema additions.** BetterAuth's core schema expects `session`, `account`, and `verification` tables alongside `user`. With stateless sessions the `session` table is lightly used (written on sign-in/sign-out, not queried per request). The `account` table positions us for OAuth later. The `verification` table supports email verification if we add it. These are forward-looking additions, not dead weight.

---

## 6. Migration feasibility

The migration is lossless. Every current feature maps 1:1:

| Current (NextAuth) | BetterAuth equivalent |
|---|---|
| JWT sessions, no DB hit | Cookie cache with `refreshCache: true` |
| Edge middleware `getToken()` | Local cookie decryption via `getSession()` |
| Email/password (bcrypt-ts) | Built-in + custom `password.hash`/`password.verify` |
| Guest auto-creation | `anonymous` plugin (same `isAnonymous` field) |
| `session.user.id` | Same shape out of the box |
| `session.user.type` | Derived from `user.isAnonymous` — minor refactor |
| Existing password hashes | Kept, bcrypt-ts plugs in directly |
| No per-session revocation | Same tradeoff |

The auth surface is bounded: one middleware file, two auth config files, one route handler, and ~12 call sites. No incremental migration needed — small enough to swap in one pass.

Implementation details are in [T-0001](../../.tasks/T-0001.md).

---

## 7. When to revisit

- If BetterAuth's stateless cookie cache proves unreliable at the edge — fall back to database sessions with a non-edge middleware runtime.
- If per-session revocation becomes necessary — add Redis secondary storage alongside cookie cache.
- If BetterAuth's development stalls or takes a direction incompatible with our needs — re-evaluate, but the same would have been true of NextAuth.
