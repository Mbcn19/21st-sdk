import { getApiBaseUrl, getApiKey } from "./config.js"
import * as p from "@clack/prompts"

const API_BASE = getApiBaseUrl()

function maskValue(value: string): string {
  if (value.length <= 4) return "\u2022".repeat(value.length)
  return value.slice(0, 2) + "\u2022".repeat(Math.min(value.length - 4, 12)) + value.slice(-2)
}

function requireAuth(): string {
  const apiKey = getApiKey()
  if (!apiKey) {
    p.log.error("Not logged in. Run `npx @21st-sdk/cli login` first, or set API_KEY_21ST.")
    process.exit(1)
  }
  return apiKey
}

function requireAgentSlug(args: string[]): string {
  const slug = args[0]
  if (!slug || slug.startsWith("-")) {
    p.log.error("Agent slug is required. Usage: npx @21st-sdk/cli env list <agent-slug>")
    process.exit(1)
  }
  return slug
}

async function fetchEnvVars(apiKey: string, agentSlug: string): Promise<Record<string, string>> {
  const res = await fetch(`${API_BASE}/agents/${agentSlug}/env`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).message || `Failed to fetch env vars (${res.status})`)
  }
  const data = await res.json()
  return data.envVars ?? {}
}

async function putEnvVars(apiKey: string, agentSlug: string, envVars: Record<string, string> | null): Promise<void> {
  const res = await fetch(`${API_BASE}/agents/${agentSlug}/env`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ envVars }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).message || `Failed to update env vars (${res.status})`)
  }
}

export async function envList(args: string[]) {
  const apiKey = requireAuth()
  const agentSlug = requireAgentSlug(args)
  const showValues = args.includes("--show-values")

  try {
    const vars = await fetchEnvVars(apiKey, agentSlug)
    const keys = Object.keys(vars)

    if (keys.length === 0) {
      p.log.info("No environment variables set.")
      return
    }

    console.log()
    for (const key of keys) {
      const display = showValues ? vars[key] : maskValue(vars[key]!)
      console.log(`  ${key}=${display}`)
    }
    console.log()
    p.log.info(`${keys.length} variable${keys.length !== 1 ? "s" : ""}`)
  } catch (err: any) {
    p.log.error(err.message)
    process.exit(1)
  }
}

export async function envSet(args: string[]) {
  const apiKey = requireAuth()
  const agentSlug = requireAgentSlug(args)

  const key = args[1]
  const value = args.slice(2).join(" ")

  if (!key || !value) {
    p.log.error("Usage: npx @21st-sdk/cli env set <agent-slug> KEY VALUE")
    process.exit(1)
  }

  if (!/^[A-Z0-9_]+$/.test(key)) {
    p.log.error("Invalid key. Use uppercase letters, numbers, and underscores only.")
    process.exit(1)
  }

  try {
    const vars = await fetchEnvVars(apiKey, agentSlug)
    const existed = key in vars
    vars[key] = value
    await putEnvVars(apiKey, agentSlug, vars)
    p.log.success(existed ? `Updated ${key}` : `Set ${key}`)
  } catch (err: any) {
    p.log.error(err.message)
    process.exit(1)
  }
}

export async function envRemove(args: string[]) {
  const apiKey = requireAuth()
  const agentSlug = requireAgentSlug(args)

  const key = args[1]
  if (!key) {
    p.log.error("Usage: npx @21st-sdk/cli env remove <agent-slug> KEY")
    process.exit(1)
  }

  try {
    const vars = await fetchEnvVars(apiKey, agentSlug)
    if (!(key in vars)) {
      p.log.info(`${key} not found`)
      return
    }
    delete vars[key]
    const envVars = Object.keys(vars).length > 0 ? vars : null
    await putEnvVars(apiKey, agentSlug, envVars)
    p.log.success(`Removed ${key}`)
  } catch (err: any) {
    p.log.error(err.message)
    process.exit(1)
  }
}
