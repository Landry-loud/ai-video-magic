
-- 1) Extend job_status enum with full lifecycle states
DO $$ BEGIN
  ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'uploading';
  ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'preparing';
  ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'cancelled';
  ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'retrying';
EXCEPTION WHEN others THEN NULL; END $$;

-- 2) Extend processing_jobs with stage + logs + settings + cost
ALTER TABLE public.processing_jobs
  ADD COLUMN IF NOT EXISTS stage text,
  ADD COLUMN IF NOT EXISTS stage_progress integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS attempt integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_attempts integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS worker text,
  ADD COLUMN IF NOT EXISTS logs jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS render_settings jsonb,
  ADD COLUMN IF NOT EXISTS estimated_credits integer,
  ADD COLUMN IF NOT EXISTS credits_charged integer,
  ADD COLUMN IF NOT EXISTS duration_ms integer,
  ADD COLUMN IF NOT EXISTS eta_seconds integer,
  ADD COLUMN IF NOT EXISTS export_id uuid;

-- 3) Extend exports with full output metadata + signed-url tracking
ALTER TABLE public.exports
  ADD COLUMN IF NOT EXISTS job_id uuid REFERENCES public.processing_jobs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS storage_path text,
  ADD COLUMN IF NOT EXISTS fps integer,
  ADD COLUMN IF NOT EXISTS codec text DEFAULT 'h264',
  ADD COLUMN IF NOT EXISTS bitrate_kbps integer,
  ADD COLUMN IF NOT EXISTS aspect_ratio text,
  ADD COLUMN IF NOT EXISTS audio_kbps integer,
  ADD COLUMN IF NOT EXISTS duration_ms integer,
  ADD COLUMN IF NOT EXISTS render_ms integer,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ready',
  ADD COLUMN IF NOT EXISTS watermark boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS thumbnail_url text;

CREATE INDEX IF NOT EXISTS exports_user_created_idx ON public.exports(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS exports_project_idx ON public.exports(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS jobs_user_created_idx ON public.processing_jobs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS jobs_status_idx ON public.processing_jobs(status, created_at DESC);

-- 4) AI analyses cache (one row per project per analysis kind)
CREATE TABLE IF NOT EXISTS public.ai_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  kind text NOT NULL,
  payload jsonb NOT NULL,
  score numeric,
  source_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, kind)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_analyses TO authenticated;
GRANT ALL ON public.ai_analyses TO service_role;
ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own ai_analyses" ON public.ai_analyses
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER ai_analyses_updated_at
  BEFORE UPDATE ON public.ai_analyses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS ai_analyses_project_idx ON public.ai_analyses(project_id, kind);

-- 5) Append-log RPC: lets the owner append a structured log entry to a job
CREATE OR REPLACE FUNCTION public.append_job_log(
  _job_id uuid,
  _level text,
  _message text,
  _stage text DEFAULT NULL,
  _data jsonb DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  entry jsonb;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  entry := jsonb_build_object(
    'ts', extract(epoch from now()),
    'level', COALESCE(_level, 'info'),
    'stage', _stage,
    'message', _message,
    'data', _data
  );
  UPDATE public.processing_jobs
     SET logs = COALESCE(logs, '[]'::jsonb) || jsonb_build_array(entry),
         updated_at = now()
   WHERE id = _job_id AND user_id = uid;
END $$;

-- 6) Cancel job RPC (owner-only)
CREATE OR REPLACE FUNCTION public.cancel_job(_job_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); updated int;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  UPDATE public.processing_jobs
     SET status = 'cancelled', finished_at = now(), updated_at = now()
   WHERE id = _job_id AND user_id = uid AND status IN ('queued','uploading','preparing','processing','retrying');
  GET DIAGNOSTICS updated = ROW_COUNT;
  RETURN updated > 0;
END $$;
