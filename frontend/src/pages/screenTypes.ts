export type ScreenKey =
  | 'home'
  | 'login'
  | 'dashboard'
  | 'templates'
  | 'jobMatches'
  | 'matchResults'
  | 'recommendations'
  | 'scoreHistory'
  | 'resumeEditor'

export type Recommendation = {
  section: string
  title: string
  impact: string
  confidence: string
  reason: string
  suggestion: string
}

export type ScoreResult = {
  id: string
  date: string
  timestamp: string
  job_title: string
  company: string
  job_description?: string
  role: string
  score: string
  overall_score: number
  color: 'green' | 'amber' | 'rose'
  version: string
  explanation: string
  matched_terms: string[]
  missing_terms: string[]
  partial_terms: string[]
  recommendations: Recommendation[]
  ai_guidance_used?: boolean
  breakdown?: {
    total_job_terms?: number
    matched_count?: number
    partial_count?: number
    missing_count?: number
    cosine_score_raw?: number
  }
}

export type UploadedDocument = {
  id?: string
  sourceFile?: File
  file_url?: string | null
  filename: string
  format: string
  text: string
  html?: string
  page_style?: Record<string, string>
  sections: Record<string, string>
  word_count: number
  char_count: number
  summary_preview: string
  skills_preview: string
}

export type SavedDocument = UploadedDocument & {
  id: string
  name: string
  updated_at: string
}
