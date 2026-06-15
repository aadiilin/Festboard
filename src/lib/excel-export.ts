import * as XLSX from "xlsx"

export function downloadExcel(rows: Record<string, unknown>[], filename: string, sheetName = "Data") {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)

  const colWidths = Object.keys(rows[0] || {}).map((k) => ({
    wch: Math.max(k.length, 12),
  }))
  ws["!cols"] = colWidths

  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, `${filename}.xlsx`)
}
