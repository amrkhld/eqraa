import { supabase } from '@/lib/supabase'
import type { ReadingProgress } from '@/types'

export async function getReadingProgress(bookId: string, userId: string): Promise<ReadingProgress | null> {
  const { data, error } = await supabase
    .from('reading_progress')
    .select('*')
    .eq('book_id', bookId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function upsertReadingProgress(data: {
  book_id: string
  user_id: string
  current_node_id?: string | null
  position?: number
  percent?: number
  completed?: boolean
}): Promise<ReadingProgress> {
  const now = new Date().toISOString()
  const { data: result, error } = await supabase
    .from('reading_progress')
    .upsert({
      book_id: data.book_id,
      user_id: data.user_id,
      current_node_id: data.current_node_id ?? null,
      position: data.position ?? 0,
      percent: data.percent ?? 0,
      completed: data.completed ?? false,
      last_read_at: now,
      completed_at: data.completed ? now : null,
    }, { onConflict: 'book_id,user_id' })
    .select()
    .single()

  if (error) throw error
  return result
}

export async function markBookComplete(bookId: string, userId: string): Promise<void> {
  const now = new Date().toISOString()
  const { error } = await supabase
    .from('reading_progress')
    .upsert({
      book_id: bookId,
      user_id: userId,
      percent: 100,
      completed: true,
      last_read_at: now,
      completed_at: now,
    }, { onConflict: 'book_id,user_id' })

  if (error) throw error
}
