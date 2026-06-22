# CLAUDE.md — The Flying Bus

_Last updated: 2026-06-22. This file lives at `flyingbus-app/CLAUDE.md` and is auto-read by Claude Code every session. It is the single source of truth for project state and working rules. Keep it current; retire scattered copies._

---

## 0. What this project is

The Flying Bus is a safe, moderated, kids-helping-kids creator platform for ages 8–18, founded by two children. Kids create, compete, earn Kana Coins (recognition only), and their participation helps real kids — in the summer pilot, outfitting a local youth sports team with gear.

It is **not**: open social media, a follower/like app, an open-DM product, or a crypto-speculation product. Every public post is reviewed before it is seen.

It should feel: modern, safe, creative, mission-driven, slightly competitive, cool for older kids, safe for younger kids.

---

## 1. Tech stack & environment

- Next.js 15.3.6 (App Router), TypeScript
- Supabase (cloud, Postgres + RLS). Project URL `https://ujbgswsdepjqdttzoxiv.supabase.co`
- Auth: Supabase Auth + service-role server actions
- Email: Resend (domain verified, `noreply@mail.theflyingbus.org`)
- Deployed on Vercel at `flying-bus.vercel.app`
- Local path: `/Users/anand/Desktop/Claude Code/Flying Bus/flyingbus-app`
- GitHub: `github.com/alagannam/flying-bus`

Route groups: `app/(public)`, `app/(youth)`, `app/(parent)`, `app/(admin)`, `app/api`.

---

## 2. Working rules (non-negotiable)

### Two speeds
- **Slow mode** — anything touching writes, auth, approvals, moderation, audit, coins, scoring, notifications, account status, role changes, or a schema/migration. Small scope, verify-first, careful.
- **Fast mode** — static/read-only/display, page wiring, copy.

### Verify schema before writing any batch
Never guess at table or column names. Run `select column_name … from information_schema.columns` (or read the migration) first. Guessing has caused every broken build.

### Implementation confirmation format (before asking for testing)
1. implemented yes/no
2. exact files created/replaced
3. confirm each file exists at its exact path
4. confirm no unintended migrations/writes/deps (or list them)
5. one proof command
6. then manual test steps

If a file was not actually written: say **not implemented**.

### Ship discipline (every batch)
1. `npm run build` locally — the internal `tsc` is NOT a full production build; the real build has caught errors the type-check missed. Must end with the route table and no "Failed to compile."
2. `git add . && git commit && git push`. Confirm pushed — a frequent failure mode is a fix that was written but never committed, so the live site runs old code.
3. Wait for Vercel "Ready", then test on the LIVE site, not just locally.

### Do not overbuild
No new components, abstractions, routes, or DB fields unless the batch explicitly requires them. One clear objective per batch.

### Harmless build noise
`ECONNREFUSED 127.0.0.1:54321` / `supabaseUrl required` during build = build-time pre-render reaching for local Supabase. Harmless; the build completes past it and uses cloud Supabase at runtime.

---

## 3. Product north star — the youth journey

The product is organized around a six-stage youth journey. Build decisions serve the stage they belong to.

1. **Pick your vibe** — interest picker (Pinterest-style chips) seeds the new kid's feed.
2. **Your feed fills up** — a feed of published work, customized by interests; adapts new-kid vs returning-kid.
3. **Make your first thing** — first-post funnel. The single most important moment: a kid who creates in their first session stays. Every post carries the kid's own words (writing-first).
4. **Get seen, safely** — featuring (human-picked) + fixed positive reactions (Cheer, Learned something, Want more, Amazing). No view/like counts ever. Pride, not a scoreboard.
5. **Keep your streak** — the weekly fire; 5-week milestone earns a free pass; encouraging (never guilt-based) reminders.
6. **Your crew, the mission** — city crews compete; the impact bar fills toward real gear.

The weak stages we are actively fixing: arrival dead-time, the new-kid first session (stages 1–3), and the belonging/content-viewing surface (stage 4).

---

## 4. The three reward systems — keep them SEPARATE

1. **Kana Coins = recognition, never money.** Real crypto (Thirdweb), but in-product they behave like arcade tokens. Earned for approved posts, featured work, streak weeks. Spent on flair/cosmetics, later voting and sponsor-unlock. HARD RULE: never cash, never priced, never traded, never directly funds the donation. Pilot = display-only (no wallet wired).
2. **Dollars = real philanthropy, separate.** Donations route through the 501(c)(3), admin-entered, drive the impact journey bar. Kids never touch money. Effort can *unlock* a pre-committed sponsor dollar; a coin never *becomes* a dollar.
3. **Scores & leaderboards = competition.** Many ways to win (participation, creator, team, impact, leadership). Team-first: crew standings are the headline; individuals are ranked *within* their crew (LeBron-on-the-Lakers); streaks are personal, not ranked.

Coins copy must never use investment/speculation/price/market/pump/gambling language. Plain language only.

---

## 5. Safety model (foundational, not cosmetic)

- Every public youth submission is reviewed before publishing (submit → review → approve → publish). **This content-review gate is untouchable.**
- No open kid-to-kid DMs. No open comments at launch. No public follower/like counts.
- Usernames/display names, not real names. No posting of contact info, outside links, or risky location detail.
- Reactions are a fixed positive set, counts only, never expose who reacted.
- **PILOT DECISION (2026-06): the parent ACCOUNT-activation gate (Gate 1) is removed for the trusted ~20-family pilot, to kill new-kid dead-time. Content review (Gate 2) is unchanged. MUST be restored before any launch beyond the trusted pilot group** — a verified-adult link is core to the trust model.

---

## 6. Current build state (verified)

Recent commits (newest first): weekly participation streak · exclude rejected from participation count · weekly drop polish (countdown + count) · impact journey bar · multi-child parent linking · youth accounts email-confirmed.

### Built & shipped
- Core loop verified live: youth creates → parent approves (if age-gated) → admin approves → published → coins awarded → leaderboard/profile update.
- Public: home, how-it-works, parents-safety, kana-coins, impact (+ detail with journey bar), clubs (+ detail), challenges (+ detail), leaderboards, public profiles, public submissions, join (youth/parent), login, password reset.
- Youth: dashboard (active challenge + countdown + participation count + weekly streak with at-risk nudge), my-clubs, studio (+ new), my-submissions, profile (+ edit), coins, shop, notifications, settings. kana-channel = Coming Soon stub.
- Parent: dashboard, children, approvals, notifications, settings.
- Admin: dashboard, users, submissions (approve/reject), flags, clubs, challenges, settings, roles, impact (admin updates `raised_cents`), audit-log, coins.
- Impact journey bar: shipped, on impact page + youth dashboard; admin-driven.
- Streak: WEEKLY participation streak, derived read-only from submissions (`lib/streak.ts`, `computeWeeklyStreak`). Buckets by `submitted_at`, Mon–Sun America/Los_Angeles; past weeks require `published`; current week counts on any acted (non-draft/non-rejected) submission; at-risk nudge tied to mission deadline.

### Corrections to old handoff docs (these were WRONG)
- Featuring / `/admin/featured` is NOT built — only a label exists in `admin/page.tsx` + `seed.sql`. No `is_featured` column, no route.
- No `reactions` table exists.
- Streak is WEEKLY now, not the old daily `bump_streak`. `bump_streak` is dormant but still called in `app/(youth)/studio/actions.ts` (leave it; removal is later hygiene).

### Not built yet
- Featuring + safe reactions (the recognition surface) — next.
- Interest tag layer (decided, about to build — see §7).
- Crew season-long combined standings (batch 1.5).
- Flight reskin (UI copy only).
- Thirdweb wallet (coins display-only for pilot).
- Kana Channel video content.

---

## 7. Decisions locked this session (2026-06)

- **Interest tag layer:** clubs organize/moderate content (the home shelf); a single GLOBAL interest list layers across all clubs (the sticker labels). A kid picks 1–3 interest tags per post; a moderator can override on review. Starter interest set (lock before migration): sports, stories & writing, art, video, music, science & tech, food, world & cultures, games, animals & nature, comics, photography.
- **New-kid first session is the active build target.** Order: (A) interest-tag migration → interest picker screen → seeded feed (with empty-feed fallback to featured/recent so it's never empty) → first-post funnel.
- **Reskin is UI-copy only**, done in one pass AFTER mechanics. NEVER rename DB tables/columns/functions/routes. `challenges` stays `challenges` (reads "missions"); `clubs` stays `clubs` (reads "crews"); badges read "wings".

---

## 8. Build queue (resume here)

**Now — Batch A (slow mode, schema):** interest-tag migration — a global interests list, interest tags on submissions (kid picks 1–3, mod override), kid's chosen interests on profile. Verify submissions/profile schema first.
**Then:** interest picker screen → seeded feed + empty-feed fallback → first-post funnel polish.
**Then:** featuring (`is_featured` + admin action + surface) + safe reactions (new table, write action, fixed 4 types, published-only, counts-not-names).
**Then:** crew season-long combined standings (1.5).
**Then:** flight reskin (UI copy pass).

### Phase 0 launch blockers (before recruiting real families)
- Existing-parent invite UX (show "welcome back / log in to add this child", not create-account).
- Stale-session shows wrong account (sign out before signup).
- Connect `theflyingbus.org` to Vercel + update Supabase Site URL/redirect URLs + `NEXT_PUBLIC_APP_URL`.
- Surface silent email-send failures (`sendParentInviteEmail` only logs — add warning + resend).
- Rotate Supabase service-role key (was pasted in chat).
- Clean up test accounts (both `public.users` and Supabase Auth, cascade-aware).
- Restore parent account-activation gate before any launch beyond the trusted ~20.

### Later hygiene
- Remove dormant `bump_streak` call + daily streak columns once weekly streak is fully trusted.
- Build-time `supabaseUrl required` noise cleanup.
- "Enter this challenge" dashboard button passes no challenge_id (cosmetic; challenge-page path works).
