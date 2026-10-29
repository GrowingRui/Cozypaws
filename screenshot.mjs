// Usage: node screenshot.mjs <url> [label] [--width=1280] [--height=900] [--full]
// Saves to "./temporary screenshots/screenshot-N[-label].png", auto-incremented, never overwritten.
import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import puppeteer from 'puppeteer-core'

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean)

const args = process.argv.slice(2)
const flags = Object.fromEntries(
  args.filter((a) => a.startsWith('--')).map((a) => {
    const [k, v] = a.slice(2).split('=')
    return [k, v ?? true]
  }),
)
const [url = 'http://localhost:3001', label] = args.filter((a) => !a.startsWith('--'))
const width = Number(flags.width ?? 1280)
const height = Number(flags.height ?? 900)

const executablePath = CHROME_CANDIDATES.find((p) => existsSync(p))
if (!executablePath) throw new Error('No Chrome or Edge found. Set CHROME_PATH.')

const dir = join(process.cwd(), 'temporary screenshots')
mkdirSync(dir, { recursive: true })
const next =
  readdirSync(dir)
    .map((f) => /^screenshot-(\d+)/.exec(f)?.[1])
    .filter(Boolean)
    .reduce((max, n) => Math.max(max, Number(n)), 0) + 1
const file = join(dir, `screenshot-${next}${label ? `-${label}` : ''}.png`)

const browser = await puppeteer.launch({ executablePath, headless: true })
try {
  const page = await browser.newPage()
  await page.setViewport({ width, height, deviceScaleFactor: width < 600 ? 2 : 1 })
  await page.goto(url, { waitUntil: 'networkidle0' })
  await page.evaluate(() => document.fonts.ready)
  await new Promise((r) => setTimeout(r, 700))
  await page.screenshot({ path: file, fullPage: Boolean(flags.full) })
  console.log(file)
} finally {
  await browser.close()
}
