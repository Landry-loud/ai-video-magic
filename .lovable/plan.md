# Phase 5 — Marketplace, Collaboration, Admin, Polish

All four pillars in one phase. Backend stays adapter-clean; frontend extends existing workspace shell. No breaking changes.

## 1. Template marketplace + sharing

**Schema** (`templates`, `project_shares`):
- `templates(id, project_id, title, summary, hero_url, tags[], category, remix_count, like_count, author_id, is_featured, created_at)` — public read.
- `project_shares(id, project_id, slug unique, og_title, og_description, og_image, allow_remix, view_count, expires_at)` — anon read on active rows only.
- RPC `remix_template(_template_id)` clones project row + linked video pointer for the caller, returns new project id, increments remix_count.

**UI**:
- `/dashboard/templates` → real grid: featured row, category filters, search, "Remix" CTA → opens new project workspace.
- "Publish as template" dialog inside workspace (Plan tab footer).
- "Share" button in workspace header → modal with slug, OG fields, copy link, toggle remix.
- Public routes:
  - `/t/$slug` — read-only project preview (no auth) with OG `head()`.
  - `/p/$shareId` — same shape, signed video URL via public server fn.

## 2. Collaboration + team seats

**Schema** (`teams`, `team_members`, `team_invitations`, `project_comments`, `projects.team_id`):
- `teams(id, name, slug, owner_id, plan, seats_limit)`.
- `team_members(team_id, user_id, role enum owner/admin/editor/viewer, joined_at)`.
- `team_invitations(id, team_id, email, role, token, invited_by, accepted_at, expires_at)`.
- `project_comments(id, project_id, user_id, body, time_sec nullable, resolved, created_at)`.
- `projects.team_id uuid nullable` → if set, RLS allows team members.
- Security-definer `is_team_member(_team_id, _user_id)` to avoid recursive RLS.

**UI**:
- `/dashboard/team` — members table, role editor (owner/admin only), seat usage, pending invites.
- `/invite/$token` public accept page → after sign-in, joins team.
- Workspace TopBar: avatars stack (realtime presence via Supabase channel `project:{id}`).
- Timeline: comment markers at `time_sec`, side drawer to add/resolve.

## 3. Admin back-office

**Schema**:
- `support_tickets(id, user_id, subject, body, status enum open/pending/closed, priority, created_at)`.
- `admin_audit_log(id, actor_id, action, target, payload, created_at)`.

**Layout**:
- `src/routes/_authenticated/_admin/route.tsx` — `beforeLoad` checks `has_role(uid,'admin')` server fn, else redirect `/dashboard`.
- Pages:
  - `/admin` — KPIs (users, MRR proxy, active subs, jobs by status). Charts via recharts.
  - `/admin/users` — search, filter by plan/role, grant credits, change role, suspend.
  - `/admin/revenue` — subscriptions + invoices table, monthly chart.
  - `/admin/jobs` — processing_jobs feed with retry/cancel actions.
  - `/admin/support` — inbox of tickets, reply (writes to `admin_audit_log`).
- Server fns gated by `has_role` check; all admin actions logged.

## 4. Growth + polish

- **Onboarding modal**: first-login wizard (display name, use-case, first project CTA). Stored on `profiles.onboarded_at`.
- **Command palette** (`cmdk`): ⌘K opens jump-to-project / action launcher (new project, billing, templates, admin if role).
- **Keyboard shortcuts**: workspace bindings (space play, J/K nudge, B split, ⌘E export, ⌘/ help sheet).
- **Notifications**: `notifications(user_id, kind, title, body, ref, read_at)` table + bell dropdown (already in TopBar) wired to realtime. Triggers from render-completed and team-invite events.
- **Empty states**: rich illustrations on Projects/Templates/Renders empty.

## Architecture rules respected

- Service layer untouched for render/billing; new `src/services/social.ts` (templates/shares) + `src/services/team.ts` adapter so future provider swap is trivial.
- All multi-step writes via server fns (`requireSupabaseAuth`) or RPCs.
- RLS + GRANTs on every new public table; admin checks via `has_role`.
- Routes split: public template/share + invite vs `_authenticated/*` vs `_authenticated/_admin/*`.

## Build order (single phase, sequential migrations)

1. Migration A — templates, shares, comments, notifications, support, audit, teams.
2. Generate types, then ship: services → server fns → UI screens → polish (cmdk, shortcuts, onboarding).
3. Wire realtime channels last to avoid noisy reloads during build.

End state: AI Edit Studio has a public discovery surface, collaborative editing, an admin command center, and the small-but-real polish users feel.
