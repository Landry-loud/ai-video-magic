
-- Extend credits
ALTER TABLE public.credits
  ADD COLUMN IF NOT EXISTS monthly_credits integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS period_end timestamptz NOT NULL DEFAULT (now() + interval '30 days');

-- Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  plan plan_tier NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'active', -- active | trialing | past_due | canceled | incomplete
  provider text NOT NULL DEFAULT 'mock', -- mock | stripe
  provider_customer_id text,
  provider_subscription_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own subscription read" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
-- Writes go through SECURITY DEFINER functions; deny direct writes via no policy (RLS denies by default).

CREATE TRIGGER subscriptions_set_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Credit transactions ledger
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  delta integer NOT NULL, -- positive = grant, negative = debit
  reason text NOT NULL, -- 'ai_plan', 'ai_analysis', 'ai_copilot', 'render_export', 'monthly_grant', 'topup', 'plan_upgrade'
  ref_id text,
  balance_after integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.credit_transactions TO authenticated;
GRANT ALL ON public.credit_transactions TO service_role;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own transactions read" ON public.credit_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS credit_transactions_user_created_idx ON public.credit_transactions(user_id, created_at DESC);

-- Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL DEFAULT 'mock',
  provider_invoice_id text,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL DEFAULT 'paid', -- paid | open | void | failed
  description text,
  hosted_url text,
  pdf_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own invoices read" ON public.invoices FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS invoices_user_created_idx ON public.invoices(user_id, created_at DESC);

-- Safe credit debit (returns new balance or NULL when insufficient)
CREATE OR REPLACE FUNCTION public.deduct_credits(_amount integer, _reason text, _ref text DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  new_balance integer;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;

  UPDATE public.credits
     SET balance = balance - _amount, updated_at = now()
   WHERE user_id = uid AND balance >= _amount
   RETURNING balance INTO new_balance;

  IF new_balance IS NULL THEN
    RETURN NULL; -- insufficient
  END IF;

  INSERT INTO public.credit_transactions (user_id, delta, reason, ref_id, balance_after)
  VALUES (uid, -_amount, _reason, _ref, new_balance);

  RETURN new_balance;
END $$;

REVOKE ALL ON FUNCTION public.deduct_credits(integer, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.deduct_credits(integer, text, text) TO authenticated;

-- Grant credits (used by topup/renewal/upgrade — caller is server fn with service role OR signed-in user for self-topup mock)
CREATE OR REPLACE FUNCTION public.grant_credits(_user_id uuid, _amount integer, _reason text, _ref text DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_balance integer;
BEGIN
  IF _amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;
  UPDATE public.credits SET balance = balance + _amount, updated_at = now()
   WHERE user_id = _user_id
   RETURNING balance INTO new_balance;
  IF new_balance IS NULL THEN RAISE EXCEPTION 'Credits row not found'; END IF;
  INSERT INTO public.credit_transactions (user_id, delta, reason, ref_id, balance_after)
  VALUES (_user_id, _amount, _reason, _ref, new_balance);
  RETURN new_balance;
END $$;

REVOKE ALL ON FUNCTION public.grant_credits(uuid, integer, text, text) FROM PUBLIC;
-- only callable via service role (server-side trusted functions)

-- Backfill subscription rows for existing users
INSERT INTO public.subscriptions (user_id, plan)
SELECT user_id, plan FROM public.credits
ON CONFLICT (user_id) DO NOTHING;

-- Update handle_new_user to also create a subscription row
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), NEW.raw_user_meta_data->>'avatar_url');
  INSERT INTO public.credits (user_id, balance, plan, monthly_credits) VALUES (NEW.id, 100, 'free', 100);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  INSERT INTO public.subscriptions (user_id, plan) VALUES (NEW.id, 'free');
  RETURN NEW;
END $$;
