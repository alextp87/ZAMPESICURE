-- Create reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('smarrito', 'avvistato')),
  animal_type TEXT NOT NULL CHECK (animal_type IN ('cane', 'gatto', 'volatile')),
  animal_name TEXT,
  description TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_phone TEXT,
  contact_email TEXT NOT NULL,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create messages table for private messaging
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "reports_select_all" ON public.reports;
DROP POLICY IF EXISTS "reports_insert_authenticated" ON public.reports;
DROP POLICY IF EXISTS "reports_update_own" ON public.reports;
DROP POLICY IF EXISTS "reports_delete_own" ON public.reports;
DROP POLICY IF EXISTS "messages_insert_all" ON public.messages;
DROP POLICY IF EXISTS "messages_select_report_owner" ON public.messages;
DROP POLICY IF EXISTS "messages_update_report_owner" ON public.messages;

-- Reports policies: everyone can read active reports
CREATE POLICY "reports_select_all" ON public.reports 
  FOR SELECT USING (true);

-- Anyone can insert reports (will be associated with user if logged in)
CREATE POLICY "reports_insert_authenticated" ON public.reports 
  FOR INSERT WITH CHECK (true);

-- Users can update their own reports
CREATE POLICY "reports_update_own" ON public.reports 
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own reports
CREATE POLICY "reports_delete_own" ON public.reports 
  FOR DELETE USING (auth.uid() = user_id);

-- Messages: anyone can insert messages for a report
CREATE POLICY "messages_insert_all" ON public.messages 
  FOR INSERT WITH CHECK (true);

-- Report owners can read messages for their reports
CREATE POLICY "messages_select_report_owner" ON public.messages 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.reports 
      WHERE reports.id = messages.report_id 
      AND reports.user_id = auth.uid()
    )
  );

-- Report owners can update (mark as read) messages for their reports
CREATE POLICY "messages_update_report_owner" ON public.messages 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.reports 
      WHERE reports.id = messages.report_id 
      AND reports.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_city ON public.reports(city);
CREATE INDEX IF NOT EXISTS idx_reports_animal_type ON public.reports(animal_type);
CREATE INDEX IF NOT EXISTS idx_reports_report_type ON public.reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_report_id ON public.messages(report_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read);
