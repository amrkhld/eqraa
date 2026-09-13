import { supabase } from '@/lib/supabase'
import type { Book, BookNode } from '@/types'

export async function uploadBook(
  file: File,
  userId: string,
  metadata: { title: string; author?: string; description?: string }
): Promise<Book> {
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'epub'
  const filePath = `${userId}/${Date.now()}.${fileExt}`

  // Upload file to storage
  const { error: uploadError } = await supabase.storage
    .from('books')
    .upload(filePath, file)

  if (uploadError) throw uploadError

  // Create book record
  const { data, error } = await supabase
    .from('books')
    .insert({
      owner_id: userId,
      title: metadata.title,
      author: metadata.author || null,
      description: metadata.description || null,
      file_path: filePath,
      file_type: fileExt,
      status: 'processing',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getMyBooks(userId: string): Promise<Book[]> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getBook(bookId: string): Promise<Book> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', bookId)
    .single()

  if (error) throw error
  return data
}

export async function getAllBooks(): Promise<Book[]> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('status', 'ready')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function updateBookStatus(bookId: string, status: Book['status']): Promise<void> {
  const { error } = await supabase
    .from('books')
    .update({ status })
    .eq('id', bookId)

  if (error) throw error
}

export async function updateBookCover(bookId: string, coverUrl: string): Promise<void> {
  const { error } = await supabase
    .from('books')
    .update({ cover_url: coverUrl })
    .eq('id', bookId)

  if (error) throw error
}

export async function deleteBook(bookId: string): Promise<void> {
  const { error } = await supabase
    .from('books')
    .delete()
    .eq('id', bookId)

  if (error) throw error
}

export async function getBookNodes(bookId: string): Promise<BookNode[]> {
  const { data, error } = await supabase
    .from('book_nodes')
    .select('*')
    .eq('book_id', bookId)
    .order('order_index', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createBookNodes(nodes: Omit<BookNode, 'id' | 'created_at'>[]): Promise<BookNode[]> {
  const { data, error } = await supabase
    .from('book_nodes')
    .insert(nodes)
    .select()

  if (error) throw error
  return data || []
}

export async function deleteBookNodes(bookId: string): Promise<void> {
  const { error } = await supabase
    .from('book_nodes')
    .delete()
    .eq('book_id', bookId)

  if (error) throw error
}

export function getBookFileUrl(filePath: string): string {
  const { data } = supabase.storage.from('books').getPublicUrl(filePath)
  return data.publicUrl
}

export async function getBookFileSignedUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('books')
    .createSignedUrl(filePath, 3600) // 1 hour

  if (error) throw error
  return data.signedUrl
}
