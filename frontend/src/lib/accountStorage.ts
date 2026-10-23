import { supabase } from '../supabaseClient'
import type { ScoreResult, SavedDocument, UploadedDocument } from '../pages/screenTypes'

type DocumentRow = {
  id: string
  name: string
  file_name: string | null
  file_format: string | null
  file_url: string | null
  raw_text: string
  sections: Record<string, string> | null
  word_count: number | null
  char_count: number | null
  summary_preview: string | null
  skills_preview: string | null
  updated_at: string
}

type ScoreRow = {
  id: string
  role_title: string
  company_name: string
  document_version_name: string
  overall_score: number
  score_label: string
  color_status: ScoreResult['color']
  matched_terms: string[] | null
  missing_terms: string[] | null
  partial_terms: string[] | null
  explanation: string
  recommendations: ScoreResult['recommendations'] | null
  breakdown: ScoreResult['breakdown'] | null
  created_at: string
  job_postings?: { description: string } | null
}

const toUploadedDocument = (row: DocumentRow): SavedDocument => ({
  id: row.id,
  filename: row.file_name || row.name,
  file_url: row.file_url,
  format: row.file_format || 'TXT',
  text: row.raw_text,
  sections: row.sections || {},
  word_count: row.word_count || 0,
  char_count: row.char_count || row.raw_text.length,
  summary_preview: row.summary_preview || '',
  skills_preview: row.skills_preview || '',
  name: row.name,
  updated_at: row.updated_at,
})

const toScoreResult = (row: ScoreRow): ScoreResult => {
  const created = new Date(row.created_at)
  return {
    id: row.id,
    date: created.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    timestamp: created.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    job_title: row.role_title,
    company: row.company_name,
    job_description: row.job_postings?.description,
    role: `${row.role_title} at ${row.company_name}`,
    score: row.score_label,
    overall_score: row.overall_score,
    color: row.color_status,
    version: row.document_version_name,
    explanation: row.explanation,
    matched_terms: row.matched_terms || [],
    missing_terms: row.missing_terms || [],
    partial_terms: row.partial_terms || [],
    recommendations: row.recommendations || [],
    breakdown: row.breakdown || {},
  }
}

export async function loadAccountData(): Promise<{ documents: SavedDocument[]; scores: ScoreResult[] }> {
  const [{ data: documents, error: documentsError }, { data: scores, error: scoresError }] = await Promise.all([
    supabase.from('documents').select('*').order('updated_at', { ascending: false }),
    supabase.from('score_matches').select('*, job_postings(description)').order('created_at', { ascending: false }),
  ])

  if (documentsError) throw documentsError
  if (scoresError) throw scoresError

  return {
    documents: (documents || []).map((row) => toUploadedDocument(row as DocumentRow)),
    scores: (scores || []).map((row) => toScoreResult(row as ScoreRow)),
  }
}

export async function saveAccountDocument(
  document: UploadedDocument,
  name: string,
  id?: string,
): Promise<SavedDocument> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!userData.user) throw new Error('You must be signed in to save a document.')

  const payload = {
    ...(id ? { id } : {}),
    kind: 'RESUME',
    user_id: userData.user.id,
    name: name.trim() || document.filename || 'Untitled document',
    file_name: document.filename || null,
    file_format: document.format || null,
    raw_text: document.text,
    sections: document.sections || {},
    word_count: document.word_count || document.text.split(/\s+/).filter(Boolean).length,
    char_count: document.char_count || document.text.length,
    summary_preview: document.summary_preview || document.text.slice(0, 150),
    skills_preview: document.skills_preview || '',
    updated_at: new Date().toISOString(),
  }

  const query = id
    ? supabase.from('documents').update(payload).eq('id', id).select('*').single()
    : supabase.from('documents').insert(payload).select('*').single()
  const { data, error } = await query
  if (error) throw error

  let savedRow = data as DocumentRow
  if (document.sourceFile) {
    const safeFilename = document.sourceFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${userData.user.id}/${savedRow.id}/${safeFilename}`
    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(storagePath, document.sourceFile, {
        upsert: true,
        contentType: document.sourceFile.type || 'application/octet-stream',
      })
    if (uploadError) throw uploadError

    const { data: publicUrl } = supabase.storage.from('resumes').getPublicUrl(storagePath)
    const { data: updatedRow, error: urlError } = await supabase
      .from('documents')
      .update({ file_url: publicUrl.publicUrl, updated_at: new Date().toISOString() })
      .eq('id', savedRow.id)
      .select('*')
      .single()
    if (urlError) throw urlError
    savedRow = updatedRow as DocumentRow
  }

  return toUploadedDocument(savedRow)
}

export async function saveAccountScore(result: ScoreResult, documentId?: string): Promise<ScoreResult> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!userData.user) throw new Error('You must be signed in to save a score.')

  let jobPostingId: string | undefined
  if (result.job_description?.trim()) {
    const { data: jobPosting, error: jobError } = await supabase.from('job_postings').insert({
      user_id: userData.user.id,
      title: result.job_title,
      company: result.company,
      description: result.job_description,
    }).select('id').single()
    if (jobError) throw jobError
    jobPostingId = jobPosting.id
  }

  const { data, error } = await supabase.from('score_matches').insert({
    user_id: userData.user.id,
    ...(documentId ? { document_id: documentId } : {}),
    ...(jobPostingId ? { job_posting_id: jobPostingId } : {}),
    role_title: result.job_title,
    company_name: result.company,
    document_version_name: result.version,
    overall_score: result.overall_score,
    score_label: result.score,
    color_status: result.color,
    cosine_similarity: result.breakdown?.cosine_score_raw || 0,
    matched_terms: result.matched_terms,
    missing_terms: result.missing_terms,
    partial_terms: result.partial_terms,
    explanation: result.explanation,
    recommendations: result.recommendations,
    breakdown: result.breakdown || {},
  }).select('*').single()

  if (error) throw error
  return toScoreResult(data as ScoreRow)
}

export async function deleteAccountDocument(document: SavedDocument): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!userData.user) throw new Error('You must be signed in to delete a document.')

  if (document.filename) {
    const safeFilename = document.filename.replace(/[^a-zA-Z0-9._-]/g, '_')
    const { error: storageError } = await supabase.storage
      .from('resumes')
      .remove([`${userData.user.id}/${document.id}/${safeFilename}`])
    if (storageError) throw storageError
  }

  const { error } = await supabase.from('documents').delete().eq('id', document.id)
  if (error) throw error
}
