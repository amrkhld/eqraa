import { supabase } from '@/lib/supabase'
import type { QuestionSet, Question, QuestionAttempt, QuestionSetProgress } from '@/types'

// ==========================================
// Question Sets
// ==========================================

export async function createQuestionSet(data: {
  book_id: string
  creator_id: string
  name: string
  description?: string
  visibility?: 'public' | 'private'
}): Promise<QuestionSet> {
  const { data: result, error } = await supabase
    .from('question_sets')
    .insert({
      book_id: data.book_id,
      creator_id: data.creator_id,
      name: data.name,
      description: data.description || null,
      visibility: data.visibility || 'public',
      total_questions: 0,
    })
    .select()
    .single()

  if (error) throw error
  return result
}

export async function getQuestionSetsForBook(bookId: string): Promise<QuestionSet[]> {
  const { data, error } = await supabase
    .from('question_sets')
    .select('*, creator:profiles(username, avatar_url)')
    .eq('book_id', bookId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getQuestionSet(setId: string): Promise<QuestionSet> {
  const { data, error } = await supabase
    .from('question_sets')
    .select('*, creator:profiles(username, avatar_url)')
    .eq('id', setId)
    .single()

  if (error) throw error
  return data
}

export async function updateQuestionSet(setId: string, updates: Partial<QuestionSet>): Promise<void> {
  const { error } = await supabase
    .from('question_sets')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', setId)

  if (error) throw error
}

export async function deleteQuestionSet(setId: string): Promise<void> {
  const { error } = await supabase
    .from('question_sets')
    .delete()
    .eq('id', setId)

  if (error) throw error
}

// ==========================================
// Questions
// ==========================================

export async function createQuestion(data: {
  question_set_id: string
  book_node_id?: string
  type: string
  prompt: string
  options?: string[]
  correct_answer: string | string[]
  explanation?: string
  order_index: number
}): Promise<Question> {
  const { data: result, error } = await supabase
    .from('questions')
    .insert({
      question_set_id: data.question_set_id,
      book_node_id: data.book_node_id || null,
      type: data.type,
      prompt: data.prompt,
      options: data.options || null,
      correct_answer: data.correct_answer,
      explanation: data.explanation || null,
      order_index: data.order_index,
    })
    .select()
    .single()

  if (error) throw error

  // Update total_questions count
  try {
    await supabase.rpc('increment_total_questions', { set_id: data.question_set_id })
  } catch {
    // Fallback: update directly
    await supabase
      .from('question_sets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', data.question_set_id)
  }

  return result
}

export async function getQuestionsForSet(setId: string): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('question_set_id', setId)
    .order('order_index', { ascending: true })

  if (error) throw error
  return data || []
}

export async function updateQuestion(questionId: string, updates: Partial<Question>): Promise<void> {
  const { error } = await supabase
    .from('questions')
    .update(updates)
    .eq('id', questionId)

  if (error) throw error
}

export async function deleteQuestion(questionId: string): Promise<void> {
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', questionId)

  if (error) throw error
}

// ==========================================
// Attempts
// ==========================================

export async function submitAnswer(data: {
  question_id: string
  user_id: string
  answer: string | string[]
  is_correct: boolean
}): Promise<QuestionAttempt> {
  const { data: result, error } = await supabase
    .from('question_attempts')
    .upsert({
      question_id: data.question_id,
      user_id: data.user_id,
      answer: data.answer,
      is_correct: data.is_correct,
      attempt_count: 1,
      tested_at: new Date().toISOString(),
    }, { onConflict: 'question_id,user_id' })
    .select()
    .single()

  if (error) throw error
  return result
}

export async function getAttemptsForSet(setId: string, userId: string): Promise<QuestionAttempt[]> {
  const { data, error } = await supabase
    .from('question_attempts')
    .select('*, question:questions!inner(question_set_id)')
    .eq('user_id', userId)
    .eq('question.question_set_id', setId)

  if (error) throw error
  return data || []
}

// ==========================================
// Question Set Progress
// ==========================================

export async function getSetProgress(setId: string, userId: string): Promise<QuestionSetProgress | null> {
  const { data, error } = await supabase
    .from('question_set_progress')
    .select('*')
    .eq('question_set_id', setId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function upsertSetProgress(data: {
  question_set_id: string
  user_id: string
  current_question: number
  attempted_count: number
  correct_count: number
  status: string
}): Promise<QuestionSetProgress> {
  const { data: result, error } = await supabase
    .from('question_set_progress')
    .upsert({
      ...data,
      last_attempted_at: new Date().toISOString(),
    }, { onConflict: 'question_set_id,user_id' })
    .select()
    .single()

  if (error) throw error
  return result
}

// ==========================================
// Question Sets with Progress for Reader & Section View
// ==========================================

export interface QuestionSetWithProgress extends QuestionSet {
  progress?: QuestionSetProgress | null
  node_id?: string | null
  node_label?: string | null
  clean_description?: string | null
  questions_count?: number
}

/**
 * Parses section tag from description (e.g. "[قسم: آدم عليه السلام] تفاصيل إضافية...")
 */
export function parseQuestionSetDescription(rawDescription?: string | null): {
  cleanDescription: string
  nodeLabel: string | null
} {
  if (!rawDescription) return { cleanDescription: '', nodeLabel: null }

  // Check [قسم: ...] format
  const tagMatch = rawDescription.match(/^\[قسم:\s*(.*?)\]\s*(.*)$/s)
  if (tagMatch) {
    return {
      nodeLabel: tagMatch[1].trim() || null,
      cleanDescription: tagMatch[2].trim(),
    }
  }

  // Check JSON format
  if (rawDescription.startsWith('{') && rawDescription.includes('"node_label"')) {
    try {
      const parsed = JSON.parse(rawDescription)
      return {
        nodeLabel: parsed.node_label || null,
        cleanDescription: parsed.text || parsed.description || '',
      }
    } catch {}
  }

  return { cleanDescription: rawDescription, nodeLabel: null }
}

/**
 * Fetch user progress for multiple question sets in a single query
 */
export async function getUserProgressForSets(
  setIds: string[],
  userId: string
): Promise<Record<string, QuestionSetProgress>> {
  if (setIds.length === 0 || !userId) return {}
  const { data, error } = await supabase
    .from('question_set_progress')
    .select('*')
    .in('question_set_id', setIds)
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching progress for sets:', error)
    return {}
  }

  const map: Record<string, QuestionSetProgress> = {}
  data?.forEach((p) => {
    map[p.question_set_id] = p
  })
  return map
}

/**
 * Fetch all question sets for a book, along with user progress and section/node associations
 */
export async function getQuestionSetsWithProgress(
  bookId: string,
  userId?: string
): Promise<QuestionSetWithProgress[]> {
  const sets = await getQuestionSetsForBook(bookId)
  if (sets.length === 0) return []

  const setIds = sets.map((s) => s.id)

  // Fetch user progress for these sets
  let progressMap: Record<string, QuestionSetProgress> = {}
  if (userId) {
    progressMap = await getUserProgressForSets(setIds, userId)
  }

  // Fetch questions for node association and count
  const { data: questionsData, error: qErr } = await supabase
    .from('questions')
    .select('id, question_set_id, book_node_id')
    .in('question_set_id', setIds)

  if (qErr) {
    console.warn('Error fetching questions for node mapping:', qErr)
  }

  return sets.map((set) => {
    const setQuestions = questionsData?.filter((q) => q.question_set_id === set.id) || []
    const firstNodeId = setQuestions.find((q) => q.book_node_id)?.book_node_id || null

    const { cleanDescription, nodeLabel } = parseQuestionSetDescription(set.description)

    return {
      ...set,
      progress: progressMap[set.id] || null,
      node_id: firstNodeId,
      node_label: nodeLabel,
      clean_description: cleanDescription,
      questions_count: set.total_questions || setQuestions.length,
    }
  })
}

