-- ==============================================================================
-- MatchScore: Complete Supabase PostgreSQL Database Schema
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. PROFILES TABLE (Linked to Supabase Auth)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- ==============================================================================
-- 3. DOCUMENTS TABLE (Resumes & Portfolios)
-- Stores extracted text preserving line breaks and sections
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    kind TEXT CHECK (kind IN ('RESUME', 'PORTFOLIO')) DEFAULT 'RESUME' NOT NULL,
    name TEXT NOT NULL,
    file_name TEXT,
    file_format TEXT, -- 'PDF', 'DOCX', 'TXT'
    file_url TEXT,
    raw_text TEXT NOT NULL,
    sections JSONB DEFAULT '{}'::JSONB,
    word_count INTEGER DEFAULT 0,
    char_count INTEGER DEFAULT 0,
    summary_preview TEXT,
    skills_preview TEXT,
    template_name TEXT DEFAULT 'Modern Layout — Single Column',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- ==============================================================================
-- 4. JOB POSTINGS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.job_postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    company TEXT DEFAULT 'Target Company',
    description TEXT NOT NULL,
    extracted_skills TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- ==============================================================================
-- 5. SCORE MATCHES TABLE (Scoring History, Similarity & AI Recommendations)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.score_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    job_posting_id UUID REFERENCES public.job_postings(id) ON DELETE SET NULL,
    
    role_title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    document_version_name TEXT NOT NULL,
    
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    score_label TEXT NOT NULL, -- e.g. '78%'
    color_status TEXT CHECK (color_status IN ('green', 'amber', 'rose')) DEFAULT 'green',
    cosine_similarity NUMERIC(6, 4) DEFAULT 0.0,
    skill_coverage NUMERIC(5, 2) DEFAULT 0.0,
    
    matched_terms TEXT[] DEFAULT '{}',
    missing_terms TEXT[] DEFAULT '{}',
    partial_terms TEXT[] DEFAULT '{}',
    
    explanation TEXT NOT NULL,
    recommendations JSONB DEFAULT '[]'::JSONB,
    breakdown JSONB DEFAULT '{}'::JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- ==============================================================================
-- 6. TEMPLATES TABLE (Recruiter-Approved Layouts)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('Resume', 'Portfolio')) DEFAULT 'Resume',
    detail TEXT,
    accent TEXT DEFAULT 'teal',
    is_default BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

INSERT INTO public.templates (name, type, detail, accent)
VALUES
    ('Modern', 'Resume', 'Single Column', 'teal'),
    ('Classic', 'Resume', 'Traditional Layout', 'blue'),
    ('Minimal', 'Resume', 'Clean & Compact', 'gray'),
    ('Creative', 'Portfolio', 'Dynamic Structure', 'violet'),
    ('Professional', 'Resume', 'Highly Structured', 'navy'),
    ('Two-Column', 'Resume', 'Side Navigation', 'mint'),
    ('Executive', 'Resume', 'Elegant Traditional', 'sand')
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 7. AUTH TRIGGER (Auto profile on user signup)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can view own documents"
    ON public.documents FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own documents"
    ON public.documents FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own documents"
    ON public.documents FOR UPDATE
    USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete own documents"
    ON public.documents FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own job postings"
    ON public.job_postings FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own job postings"
    ON public.job_postings FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view own score matches"
    ON public.score_matches FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own score matches"
    ON public.score_matches FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete own score matches"
    ON public.score_matches FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view templates"
    ON public.templates FOR SELECT
    TO public
    USING (true);

-- ==============================================================================
-- 9. SUPABASE STORAGE BUCKET FOR RESUMES
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can upload to resumes bucket"
    ON storage.objects FOR INSERT
    TO public
    WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Anyone can read from resumes bucket"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'resumes');
