# MatchScore Database (Supabase)

This directory contains the database structure and schema definitions for MatchScore.

## Database Tables Overview
- **`profiles`**: User account details (name, email, avatar), auto-populated upon Supabase auth sign-up.
- **`documents`**: Resumes and portfolios, storing extracted text (`raw_text`), parsed sections (`sections`), word count, and formatting metadata.
- **`job_postings`**: Pasted job descriptions, roles, and extracted skills.
- **`score_matches`**: Scoring records containing match score (0-100%), TF-IDF cosine similarity, keyword classifications (`matched_terms`, `missing_terms`, `partial_terms`), AI explanation, and section-by-section recommendations.
- **`templates`**: Available recruiter-approved resume and portfolio templates.
- **`storage.buckets ('resumes')`**: File storage for original uploaded PDF and DOCX files.

## Running the Schema
1. Open your Supabase project dashboard.
2. Navigate to the **SQL Editor**.
3. Copy the contents of `schema.sql`, paste into a new query, and click **Run**.

## Environment Setup
Set the following environment variables in your `.env` file (never commit your `.env` file):
- `SUPABASE_URL`
- `SUPABASE_KEY` (anon/public key)
