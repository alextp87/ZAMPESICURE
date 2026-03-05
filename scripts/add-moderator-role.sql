-- Add is_moderator column to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_moderator boolean NOT NULL DEFAULT false;

-- RLS: allow admins to read is_moderator (already covered by existing SELECT policy)
-- RLS: moderators can read their own profile (already covered by existing SELECT policy)

-- Add RLS policy so admins can update is_moderator on any profile via service role
-- (The actual update goes through the API route with service client, no extra policy needed)

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS profiles_is_moderator_idx ON public.profiles (is_moderator);
