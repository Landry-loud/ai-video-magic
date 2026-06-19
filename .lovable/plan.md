# AI Edit Studio — Phase 1

A production-grade SaaS frontend with a clean abstraction layer ready to plug into an external video rendering backend. Built in TanStack Start + Supabase (Lovable Cloud) with a Linear-inspired dark premium aesthetic.

## Design system

- **Palette**: bg `#0b0b0e`, surface `#111114`, elevated `#16161b`, border `#1f1f26`, text `#e5e5e7`, muted `#8a8a93`, accent `#5b8def`, accent-glow `#7aa2ff`, success `#4ade80`, warn `#f5a524`, danger `#f87171`.
- **Type**: Inter Tight (display) + Inter (body) via `@fontsource`.
- **Motion**: Framer Motion, restrained — short cubic eases, subtle blur-up and 8px translate-in. No bouncy springs.
- **UI**: shadcn cards/buttons/dialog/sheet with custom variants (`hero`, `glass`, `ghost-accent`). Soft 1px borders, glassmorphism only on top-bar & modals, `radius: 14px`.

## Routes

```text
src/routes/
  __root.tsx              shell + onAuthStateChange
  index.tsx               landing (hero, features, workflow, pricing, FAQ, footer)
  auth.tsx                sign in / sign up / forgot password (Google + email)
  reset-password.tsx
  _authenticated/
    route.tsx             integration-managed gate (already shipped on auth enable)
    dashboard.tsx         layout w/ sidebar + topbar (Outlet)
    dashboard.index.tsx   home (stats, recent projects, jobs, quick actions)
    dashboard.projects.tsx
    dashboard.projects.$projectId.tsx   project workspace
    dashboard.agent.tsx   prompt-only AI agent page
    dashboard.templates.tsx
    dashboard.library.tsx
    dashboard.billing.tsx
    dashboard.settings.tsx
```

## Phase 1 features (built now)

1. **Landing**: hero w/ animated grid + gradient, feature grid, "How it works" 3 steps, pricing (Free/Pro/Agency), testimonials, FAQ, footer.
2. **Auth**: email/password + Google OAuth via Lovable broker, forgot/reset password, protected routes.
3. **Dashboard shell**: collapsible sidebar (shadcn), top-bar with search, credits chip, notifications popover, avatar menu.
4. **Dashboard home**: 4 analytics cards, recent projects table, processing jobs feed, quick actions.
5. **Upload + new project**: drag-drop (mp4/mov/avi/mkv), auto-extract duration/resolution/fps/size via HTMLVideoElement, store file in Supabase Storage `videos` bucket, create `project` row.
6. **Project page**: video preview, AI prompt textarea, transcription panel (request → poll job → editable subtitle list on timeline), subtitle style picker (TikTok / Minimal / Gaming / Podcast), export panel (720/1080, burn subtitles toggle), job status pills.
7. **Library**: grid of past projects with status, thumbnail, duration.
8. **Templates**: 10 preset prompt+style cards (MrBeast, L2B, TikTok Viral, Podcast, Gaming, Anime, Football, Cinematic, Motivation, Luxury) — clicking one creates a new project skeleton with that prompt prefilled.
9. **Billing**: 3 plan cards with feature lists, "Current plan" badge, no Stripe call yet (structure prepared).
10. **Settings**: profile (name/avatar), language select, theme (locked dark for v1), delete account.

## Technical architecture

### Service abstraction layer — `src/services/videoProcessing.ts`

Interface-only module. Every function returns a typed promise and a job-shaped object. **Mock implementation today**, real API tomorrow with zero refactor:

```ts
uploadVideo(file): Promise<{ videoId, url, meta }>
createProject({ videoId, name, prompt }): Promise<Project>
generateSubtitles(projectId): Promise<{ jobId }>
requestEditRender(projectId, settings): Promise<{ jobId }>
getRenderStatus(jobId): Promise<{ status, progress, resultUrl? }>
downloadExport(jobId): Promise<string>
```

Mock = fake delays (2–10s), fake jobIds (`job_${nanoid}`), realistic progress curves, persisted in `processing_jobs` table so polling survives reloads.

### Jobs

`processing_jobs` table: `id, project_id, kind (transcribe|render|thumbnail), status (queued|processing|completed|failed), progress, result_url, error, created_at`. Frontend uses TanStack Query with 2s polling while status ∈ {queued, processing}.

### Database (Lovable Cloud / Supabase)

Tables (all RLS-scoped to `auth.uid()`):
- `profiles(id pk → auth.users, display_name, avatar_url, language, created_at)` + trigger on signup
- `credits(user_id pk, balance int, plan text)` (seed 100 on signup)
- `projects(id, user_id, name, prompt, status, thumbnail_url, video_id, created_at)`
- `videos(id, user_id, storage_path, duration, width, height, fps, size_bytes, created_at)`
- `subtitles(id, project_id, start_ms, end_ms, text, order_index)`
- `processing_jobs(...)` as above
- `exports(id, project_id, format, resolution, burn_subs, url, created_at)`
- `user_roles(user_id, role app_role)` + `has_role()` security-definer fn

All tables get GRANTs to `authenticated` + `service_role`. Storage bucket `videos` (private, RLS = owner read/write).

### Folders

```text
src/
  components/
    landing/         (Hero, Features, Pricing, FAQ, Footer)
    dashboard/       (AppSidebar, TopBar, StatCard, ProjectCard, JobItem, UploadDropzone, SubtitleTrack, ExportPanel)
    ui/              (shadcn)
  services/
    videoProcessing.ts        (interface + mock impl behind one feature flag)
    types.ts
  hooks/             (use-projects, use-jobs, use-upload, use-credits)
  lib/
    projects.functions.ts     (createServerFn for CRUD)
    auth.ts
```

## Not built in Phase 1 (architecture-ready)

Silence removal, beat sync, highlight detection, motion tracking, AI effect picking, thumbnail generation, voice cloning, translation, 4K/60fps export, real Stripe checkout, admin panel. All have placeholder UI states ("Coming soon" with reserved space) only where it improves the dashboard's perceived completeness.

## Build sequence

1. Enable Lovable Cloud + Google OAuth + storage bucket.
2. Migrations: enum, tables, RLS, GRANTs, trigger.
3. Design tokens in `src/styles.css` + font install.
4. Landing page (single edit).
5. Auth pages.
6. Dashboard shell + sidebar + topbar.
7. Service layer + mock + jobs hook.
8. Dashboard home + projects/library/templates/billing/settings.
9. Upload flow + project workspace + subtitles + export.
10. Polish pass, empty states, skeletons, mobile responsive check.

This is a large build (≈30 files). I'll execute it end-to-end, committing in logical chunks.