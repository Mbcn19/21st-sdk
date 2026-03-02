import { readFileSync, writeFileSync, mkdirSync } from "fs"
import { join } from "path"
import { homedir } from "os"

const AN_DIR = join(homedir(), ".an")
const CREDENTIALS_PATH = join(AN_DIR, "credentials")

// --- Credentials (global, ~/.an/credentials) ---

export function getApiKey(): string | null {
  // Env var takes priority (CI mode)
  if (process.env.AN_API_KEY) return process.env.AN_API_KEY
  try {
    const data = JSON.parse(readFileSync(CREDENTIALS_PATH, "utf-8"))
    return data.apiKey || null
  } catch {
    return null
  }
}

export function saveApiKey(apiKey: string): void {
  mkdirSync(AN_DIR, { recursive: true })
  writeFileSync(CREDENTIALS_PATH, JSON.stringify({ apiKey }, null, 2))
}
