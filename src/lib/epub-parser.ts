import ePub from 'epubjs'
import type { BookNode } from '@/types'

interface ParsedBook {
  title: string
  author: string | null
  description: string | null
  coverUrl: string | null
  nodes: Omit<BookNode, 'id' | 'created_at'>[]
}

export async function parseEpub(fileOrUrl: File | string, bookId: string): Promise<ParsedBook> {
  let book: ReturnType<typeof ePub>

  if (typeof fileOrUrl === 'string') {
    book = ePub(fileOrUrl)
  } else {
    const arrayBuffer = await fileOrUrl.arrayBuffer()
    book = ePub(arrayBuffer)
  }

  await book.ready

  // Extract metadata
  const metadata = book.packaging?.metadata
  const title = metadata?.title || 'كتاب بدون عنوان'
  const author = metadata?.creator || null
  const description = metadata?.description || null

  // Extract cover
  let coverUrl: string | null = null
  try {
    coverUrl = await book.coverUrl() || null
  } catch {
    // No cover available
  }

  // Extract chapters/sections from navigation
  const navigation = await book.loaded.navigation
  const nodes: Omit<BookNode, 'id' | 'created_at'>[] = []

  if (navigation?.toc) {
    navigation.toc.forEach((item: any, index: number) => {
      const chapterNode: Omit<BookNode, 'id' | 'created_at'> = {
        book_id: bookId,
        parent_id: null,
        type: 'chapter',
        label: item.label?.trim() || `الفصل ${index + 1}`,
        order_index: index,
        content: null,
        href: item.href || null,
        start_position: null,
        end_position: null,
      }
      nodes.push(chapterNode)

      // Sub-items become sections
      if (item.subitems && item.subitems.length > 0) {
        item.subitems.forEach((sub: any, subIndex: number) => {
          nodes.push({
            book_id: bookId,
            parent_id: null, // Will be linked after insert by ID
            type: 'section',
            label: sub.label?.trim() || `القسم ${subIndex + 1}`,
            order_index: subIndex,
            content: null,
            href: sub.href || null,
            start_position: null,
            end_position: null,
          })
        })
      }
    })
  }

  // If no TOC found, create a single chapter
  if (nodes.length === 0) {
    nodes.push({
      book_id: bookId,
      parent_id: null,
      type: 'chapter',
      label: 'المحتوى',
      order_index: 0,
      content: null,
      href: null,
      start_position: null,
      end_position: null,
    })
  }

  book.destroy()

  return { title, author, description, coverUrl, nodes }
}
