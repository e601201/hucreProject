import { readFile, writeFile } from "node:fs/promises"
import { detectDelimiter, parseCsvObjects, writeCsvObjects } from "hucre/csv"

// パスはスクリプトの場所基準で解決する(どのディレクトリから起動しても動く)
const inputUrl = new URL("Book1.csv", import.meta.url)
const outputUrl = new URL("Book1.sorted.csv", import.meta.url)

// UTF-8 として厳格にデコードし、失敗したら Shift_JIS(日本語 Excel の従来形式)として読み直す。
// "utf8" 指定の readFile は不正バイトを黙って置換文字にしてしまい、文字化けに気づけない。
const bytes = await readFile(inputUrl)
const hasBom = bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf
let csv
let isShiftJis = false
try {
  csv = new TextDecoder("utf-8", { fatal: true }).decode(bytes)
} catch {
  csv = new TextDecoder("shift_jis", { fatal: true }).decode(bytes)
  isShiftJis = true
}

// 入力の区切り文字と改行コードを検出し、出力にも同じものを使う
const delimiter = detectDelimiter(csv)
const lineSeparator = csv.includes("\r\n") ? "\r\n" : "\n"

const { data, headers } = parseCsvObjects(csv, {
  header: true,
  delimiter,
  skipEmptyRows: true,
})
if (headers.length === 0) throw new Error("Book1.csv が空です(ヘッダー行がありません)")
if (!headers.includes("単価")) {
  throw new Error(`「単価」列が見つかりません(検出したヘッダー: ${headers.join(", ")})`)
}

// 「1,500」「¥480」「480円」「４８０」のような表記も数値として解釈する
const parsePrice = (value) => {
  const normalized = String(value ?? "")
    .replace(/[０-９．]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/[\s¥￥$,]/g, "")
    .replace(/円$/, "")
  if (normalized === "") return NaN
  const num = Number(normalized)
  return Number.isFinite(num) ? num : NaN
}

// ソートキーは行ごとに1回だけ計算し、単価を読めない行は -Infinity として末尾に集める
const keyed = data.map((record, i) => {
  const raw = String(record["単価"] ?? "")
  const price = parsePrice(raw)
  if (Number.isNaN(price) && raw.trim() !== "") {
    console.warn(`警告: データ${i + 1}行目の単価「${raw}」を数値として解釈できないため末尾に配置します`)
  }
  return { record, key: Number.isNaN(price) ? -Infinity : price }
})
keyed.sort((a, b) => (b.key < a.key ? -1 : b.key > a.key ? 1 : 0))

// BOM は入力に合わせて引き継ぐ。Shift_JIS 入力は UTF-8 に変換して出力するため、
// Excel が UTF-8 と認識できるよう BOM を付ける。
const output = writeCsvObjects(
  keyed.map(({ record }) => record),
  { headers, delimiter, lineSeparator, bom: hasBom || isShiftJis },
)
await writeFile(outputUrl, output)
console.log("Book1.sorted.csv を作成しました")
