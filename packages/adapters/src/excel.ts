import * as XLSX from 'xlsx'

export interface WorkbookData {
  sheets: Record<string, any[][]>
  sheetNames: string[]
}

/**
 * Read Excel file and return workbook data
 */
export async function readExcelFile(file: File): Promise<WorkbookData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'array' })

        const sheets: Record<string, any[][]> = {}
        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName]
          sheets[sheetName] = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        })

        resolve({
          sheets,
          sheetNames: workbook.SheetNames,
        })
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Read Excel file as JSON (first sheet)
 */
export async function readExcelAsJSON(file: File, sheetIndex: number = 0): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[sheetIndex]
        const worksheet = workbook.Sheets[sheetName]
        const json = XLSX.utils.sheet_to_json(worksheet)
        resolve(json)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Convert array of objects to Excel workbook
 */
export function createWorkbook(data: any[], sheetName: string = 'Sheet1'): XLSX.WorkBook {
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  return workbook
}

/**
 * Create Excel file data URL from array of objects
 */
export function createExcelDataURL(data: any[], sheetName: string = 'Sheet1'): string {
  const workbook = createWorkbook(data, sheetName)
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  return URL.createObjectURL(blob)
}

/**
 * Download data as Excel file
 */
export function downloadExcel(data: any[], filename: string = 'export.xlsx', sheetName: string = 'Sheet1'): void {
  const workbook = createWorkbook(data, sheetName)
  XLSX.writeFile(workbook, filename)
}

/**
 * Read Excel from data URL
 */
export async function readExcelDataURL(dataUrl: string): Promise<WorkbookData> {
  const response = await fetch(dataUrl)
  const arrayBuffer = await response.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })

  const sheets: Record<string, any[][]> = {}
  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName]
    sheets[sheetName] = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
  })

  return {
    sheets,
    sheetNames: workbook.SheetNames,
  }
}
