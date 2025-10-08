import JSZip from 'jszip'

export interface ZipFileEntry {
  name: string
  content: ArrayBuffer
  type: string
}

/**
 * Read ZIP file and return all entries
 */
export async function readZipFile(file: File): Promise<ZipFileEntry[]> {
  const arrayBuffer = await file.arrayBuffer()
  const zip = new JSZip()
  const contents = await zip.loadAsync(arrayBuffer)

  const entries: ZipFileEntry[] = []

  for (const [filename, zipEntry] of Object.entries(contents.files)) {
    if (!zipEntry.dir) {
      const content = await zipEntry.async('arraybuffer')
      const type = getFileType(filename)
      entries.push({
        name: filename,
        content,
        type,
      })
    }
  }

  return entries
}

/**
 * Create ZIP file from entries
 */
export async function createZipFile(entries: { name: string; content: Blob | ArrayBuffer | string }[]): Promise<Blob> {
  const zip = new JSZip()

  for (const entry of entries) {
    zip.file(entry.name, entry.content)
  }

  return await zip.generateAsync({ type: 'blob' })
}

/**
 * Download ZIP file
 */
export async function downloadZip(
  entries: { name: string; content: Blob | ArrayBuffer | string }[],
  filename: string = 'archive.zip'
): Promise<void> {
  const blob = await createZipFile(entries)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Get file type from filename extension
 */
function getFileType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const types: Record<string, string> = {
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel',
    csv: 'text/csv',
    txt: 'text/plain',
    json: 'application/json',
  }
  return types[ext || ''] || 'application/octet-stream'
}

/**
 * Convert ArrayBuffer to data URL
 */
export function arrayBufferToDataURL(buffer: ArrayBuffer, type: string): string {
  const blob = new Blob([buffer], { type })
  return URL.createObjectURL(blob)
}

/**
 * Extract images from ZIP
 */
export async function extractImagesFromZip(file: File): Promise<{ name: string; dataUrl: string }[]> {
  const entries = await readZipFile(file)
  const images = entries.filter((entry) => entry.type.startsWith('image/'))

  return images.map((image) => ({
    name: image.name,
    dataUrl: arrayBufferToDataURL(image.content, image.type),
  }))
}

/**
 * Extract PDFs from ZIP
 */
export async function extractPDFsFromZip(file: File): Promise<{ name: string; dataUrl: string }[]> {
  const entries = await readZipFile(file)
  const pdfs = entries.filter((entry) => entry.type === 'application/pdf')

  return pdfs.map((pdf) => ({
    name: pdf.name,
    dataUrl: arrayBufferToDataURL(pdf.content, pdf.type),
  }))
}
