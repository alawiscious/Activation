// Lightweight PDF.js loader via CDN and text extraction helper
// No npm install required; runs entirely in the browser.

declare global {
  interface Window {
    pdfjsLib?: any
  }
}

const PDFJS_CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js'
const PDFJS_WORKER_CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js'

async function ensurePdfJsLoaded(): Promise<any> {
  if (window.pdfjsLib) return window.pdfjsLib
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = PDFJS_CDN
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load pdf.js'))
    document.head.appendChild(s)
  })
  if (!window.pdfjsLib) throw new Error('pdfjsLib not found on window after load')
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN
  return window.pdfjsLib
}

export async function extractPdfTextFromDataUrl(dataUrl: string): Promise<string> {
  const pdfjsLib = await ensurePdfJsLoaded()
  const res = await fetch(dataUrl)
  const buf = await res.arrayBuffer()
  const task = pdfjsLib.getDocument({ data: buf })
  const pdf = await task.promise
  const parts: string[] = []
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const content = await page.getTextContent()
    const strings = content.items.map((i: any) => i.str)
    parts.push(strings.join(' '))
  }
  return parts.join('\n\n')
}

