import { readFile } from "node:fs/promises"
import { readXlsx } from "hucre/xlsx"

const buffer = await readFile("Book1.xlsx")
const workbook = await readXlsx(new Uint8Array(buffer))

for (const sheet of workbook.sheets) {
  console.log(`=== シート: ${sheet.name} (${sheet.rows.length}行) ===`)

  const [header, ...rows] = sheet.rows
  if (!header) continue

  for (const row of rows) {
    const record = Object.fromEntries(
      header.map((h, i) => {
        let value = row[i]
        if (value instanceof Date) value = value.toISOString().slice(0, 10)
        return [h, value]
      }),
    )
    console.log(record)
  }
}
