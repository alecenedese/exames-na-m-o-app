-- Add column for medical prescription requirement
ALTER TABLE public.clinic_exam_prices 
ADD COLUMN IF NOT EXISTS requires_prescription boolean NOT NULL DEFAULT false;