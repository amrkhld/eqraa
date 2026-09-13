import * as pdfjsLib from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker
}

export function getPdfJsDocumentParams(source: { url?: string; data?: Uint8Array }) {
  const origin = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : ''

  const cMapUrl = origin
    ? `${origin}/pdfjs/cmaps/`
    : 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.3.289/cmaps/'
  const standardFontDataUrl = origin
    ? `${origin}/pdfjs/standard_fonts/`
    : 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.3.289/standard_fonts/'
  const wasmUrl = origin
    ? `${origin}/pdfjs/wasm/`
    : 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.3.289/wasm/'

  return {
    ...source,
    cMapUrl,
    cMapPacked: true,
    standardFontDataUrl,
    wasmUrl,
    useWorkerFetch: true,
    useWasm: true,
  }
}

export { pdfjsLib }
