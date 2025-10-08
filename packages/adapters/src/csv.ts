import Papa from 'papaparse'

export interface CSVParseOptions {
  header?: boolean
  dynamicTyping?: boolean
  skipEmptyLines?: boolean
}

export interface CSVData {
  data: any[]
  errors: any[]
  meta: {
    fields?: string[]
    delimiter: string
  }
}

/**
 * Parse CSV content from string
 */
export function parseCSV(content: string, options: CSVParseOptions = {}): Promise<CSVData> {
  return new Promise((resolve, reject) => {
    Papa.parse(content, {
      header: options.header ?? true,
      dynamicTyping: options.dynamicTyping ?? true,
      skipEmptyLines: options.skipEmptyLines ?? true,
      complete: (results) => {
        resolve(results as CSVData)
      },
      error: (error: Error) => {
        reject(error)
      },
    })
  })
}

/**
 * Parse CSV from File object
 */
export function parseCSVFile(file: File, options: CSVParseOptions = {}): Promise<CSVData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: options.header ?? true,
      dynamicTyping: options.dynamicTyping ?? true,
      skipEmptyLines: options.skipEmptyLines ?? true,
      complete: (results) => {
        resolve(results as CSVData)
      },
      error: (error: Error) => {
        reject(error)
      },
    })
  })
}

/**
 * Convert array of objects to CSV string
 */
export function toCSV(data: any[], options: { header?: boolean } = {}): string {
  return Papa.unparse(data, {
    header: options.header ?? true,
  })
}

/**
 * Download data as CSV file
 */
export function downloadCSV(data: any[], filename: string = 'export.csv'): void {
  const csv = toCSV(data)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
