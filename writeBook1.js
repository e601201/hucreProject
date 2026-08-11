import { writeFile } from "node:fs/promises"
import { writeXlsx } from "hucre/xlsx"

const buffer = await writeXlsx({
  sheets: [
    {
      name: "Sheet1",
      columns: [
        { header: "日付", key: "date", width: 15, numFmt: "yyyy-mm-dd" },
        { header: "商品名", key: "name", width: 20 },
        { header: "単価", key: "price", width: 12, numFmt: "#,##0" },
        { header: "数量", key: "qty", width: 8 },
        { header: "金額", key: "total", width: 14, numFmt: "#,##0" },
      ],
      data: [
        { date: new Date("2026-08-01"), name: "りんご", price: 150, qty: 10, total: 1500 },
        { date: new Date("2026-08-02"), name: "みかん", price: 80, qty: 24, total: 1920 },
        { date: new Date("2026-08-03"), name: "ぶどう", price: 480, qty: 5, total: 2400 },
        { date: new Date("2026-08-04"), name: "バナナ", price: 120, qty: 15, total: 1800 },
        { date: new Date("2026-08-05"), name: "オレンジ", price: 100, qty: 20, total: 2000 },
      ],
      freezePane: { rows: 1 },
    },
  ],
})

await writeFile("Book1.xlsx", buffer)
console.log("Book1.xlsx に書き込みました")
