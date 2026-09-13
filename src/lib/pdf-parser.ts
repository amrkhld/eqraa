import { pdfjsLib, getPdfJsDocumentParams } from './pdf-config'
import { supabase } from '@/lib/supabase'
import type { BookNode } from '@/types'

export interface ParsedPdfBook {
  title: string
  author: string | null
  description: string | null
  coverUrl: string | null
  numPages: number
  nodes: Omit<BookNode, 'id' | 'created_at'>[]
}

function cleanString(str: any): string {
  if (typeof str !== 'string') return ''
  return str.replace(/\0/g, '').replace(/[\x00-\x09\x0B-\x1F\x7F]/g, '').trim()
}

async function resolvePageNumber(pdfDoc: any, dest: any): Promise<number> {
  try {
    let targetDest = dest
    if (typeof dest === 'string') {
      targetDest = await pdfDoc.getDestination(dest)
    }
    if (Array.isArray(targetDest) && targetDest.length > 0) {
      const ref = targetDest[0]
      if (typeof ref === 'object' && ref !== null) {
        const pageIndex = await pdfDoc.getPageIndex(ref)
        return pageIndex + 1
      } else if (typeof ref === 'number') {
        return ref + 1
      }
    }
  } catch (err) {
    console.warn('Failed to resolve outline destination:', err)
  }
  return 1
}

async function extractOutlineRecursive(
  pdfDoc: any,
  items: any[],
  bookId: string,
  numPages: number,
  depth = 0,
  nodes: Omit<BookNode, 'id' | 'created_at'>[] = []
): Promise<Omit<BookNode, 'id' | 'created_at'>[]> {
  if (!items || !Array.isArray(items)) return nodes

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const rawTitle = cleanString(item.title)
    const label = rawTitle || (depth === 0 ? `الفصل ${nodes.length + 1}` : `القسم ${nodes.length + 1}`)
    const resolvedPage = await resolvePageNumber(pdfDoc, item.dest)
    const pageNum = Math.max(1, Math.min(resolvedPage, numPages))

    // Treat top level or second level (if root was a single book container) as chapter
    const type: 'chapter' | 'section' = depth <= 1 ? 'chapter' : 'section'

    nodes.push({
      book_id: bookId,
      parent_id: null,
      type,
      label,
      order_index: nodes.length,
      content: JSON.stringify({ depth }),
      href: `#page=${pageNum}`,
      start_position: pageNum,
      end_position: null,
    })

    if (item.items && Array.isArray(item.items) && item.items.length > 0) {
      await extractOutlineRecursive(pdfDoc, item.items, bookId, numPages, depth + 1, nodes)
    }
  }

  return nodes
}

export async function parsePdf(
  fileOrUrl: File | string,
  bookId: string,
  userId: string
): Promise<ParsedPdfBook> {
  const parsePromise = (async (): Promise<ParsedPdfBook> => {
    let loadingTask: any

    if (typeof fileOrUrl === 'string') {
      loadingTask = pdfjsLib.getDocument(getPdfJsDocumentParams({ url: fileOrUrl }))
    } else {
      const arrayBuffer = await fileOrUrl.arrayBuffer()
      loadingTask = pdfjsLib.getDocument(
        getPdfJsDocumentParams({ data: new Uint8Array(arrayBuffer) })
      )
    }

    const pdfDoc = await loadingTask.promise
    const numPages = pdfDoc.numPages || 1

    // 1. Metadata
    let title = typeof fileOrUrl === 'object'
      ? cleanString(fileOrUrl.name.replace(/\.pdf$/i, '').replace(/[_-]/g, ' '))
      : 'كتاب PDF'
    let author: string | null = null
    let description: string | null = null

    try {
      const metadata = await pdfDoc.getMetadata()
      const info = metadata?.info as Record<string, any> | undefined
      if (info?.Title) {
        const cleanT = cleanString(info.Title)
        if (cleanT.length > 1) title = cleanT
      }
      if (info?.Author) {
        const cleanA = cleanString(info.Author)
        if (cleanA.length > 1) author = cleanA
      }
      if (info?.Subject) {
        const cleanS = cleanString(info.Subject)
        if (cleanS.length > 1) description = cleanS
      }
    } catch {
      // Ignore metadata read errors
    }

    // 2. Generate Cover from Page 1
    let coverUrl: string | null = null
    try {
      const page1 = await pdfDoc.getPage(1)
      const viewport = page1.getViewport({ scale: 1.0 })
      const scale = Math.min(2.0, 600 / viewport.width)
      const scaledViewport = page1.getViewport({ scale })

      const canvas = document.createElement('canvas')
      canvas.width = scaledViewport.width
      canvas.height = scaledViewport.height
      const ctx = canvas.getContext('2d')

      if (ctx) {
        // Protect cover generation with a 10s timeout
        await Promise.race([
          page1.render({ canvasContext: ctx, viewport: scaledViewport }).promise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Cover render timeout')), 10000))
        ])
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, 'image/jpeg', 0.85)
        })

        if (blob) {
          const coverPath = `${userId}/${bookId}-cover-${Date.now()}.jpg`
          const { error: coverUploadError } = await supabase.storage
            .from('covers')
            .upload(coverPath, blob, { contentType: 'image/jpeg', upsert: true })

          if (!coverUploadError) {
            const { data: publicData } = supabase.storage
              .from('covers')
              .getPublicUrl(coverPath)
            coverUrl = publicData.publicUrl
          }
        }
      }
    } catch (coverErr) {
      console.warn('Could not extract PDF cover:', coverErr)
    }

    // 3. Extract Outline / TOC Bookmarks recursively
    let nodes: Omit<BookNode, 'id' | 'created_at'>[] = []
    try {
      const outline = await pdfDoc.getOutline()
      if (outline && Array.isArray(outline) && outline.length > 0) {
        nodes = await extractOutlineRecursive(pdfDoc, outline, bookId, numPages, 0, [])
      }
    } catch (outlineErr) {
      console.warn('Failed to parse PDF outline:', outlineErr)
    }

    // If no outline was found, create chapters based on page chunks
    if (nodes.length === 0) {
      if (numPages <= 25) {
        nodes.push({
          book_id: bookId,
          parent_id: null,
          type: 'chapter',
          label: `المحتوى الكامل (${numPages} صفحة)`,
          order_index: 0,
          content: JSON.stringify({ depth: 0 }),
          href: '#page=1',
          start_position: 1,
          end_position: numPages,
        })
      } else {
        const chunkSize = Math.min(50, Math.max(10, Math.ceil(numPages / 10)))
        let order = 0
        for (let p = 1; p <= numPages; p += chunkSize) {
          const endP = Math.min(p + chunkSize - 1, numPages)
          nodes.push({
            book_id: bookId,
            parent_id: null,
            type: 'chapter',
            label: `الصفحات ${p} - ${endP}`,
            order_index: order++,
            content: JSON.stringify({ depth: 0 }),
            href: `#page=${p}`,
            start_position: p,
            end_position: endP,
          })
        }
      }
    }

    return {
      title,
      author,
      description,
      coverUrl,
      numPages,
      nodes,
    }
  })()

  // 60-second timeout to guarantee never hanging indefinitely on large files
  const timeoutPromise = new Promise<ParsedPdfBook>((_, reject) => {
    setTimeout(() => reject(new Error('PDF parsing timed out')), 60000)
  })

  return Promise.race([parsePromise, timeoutPromise])
}
