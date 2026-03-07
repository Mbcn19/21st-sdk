import esbuild from "esbuild"

export type AgentEntryPoint = { slug: string; entryPoint: string }

export async function findAgentEntryPoints(): Promise<AgentEntryPoint[]> {
  const { existsSync, readdirSync, statSync } = await import("fs")
  const { join, basename, extname } = await import("path")

  if (!existsSync("agents") || !statSync("agents").isDirectory()) {
    throw new Error("No agents/ directory found. See https://21st.dev/agents/docs to get started.")
  }

  const entries: AgentEntryPoint[] = []
  const items = readdirSync("agents")

  for (const item of items) {
    const fullPath = join("agents", item)
    const stat = statSync(fullPath)

    if (stat.isDirectory()) {
      for (const indexFile of ["index.ts", "index.js"]) {
        const indexPath = join(fullPath, indexFile)
        if (existsSync(indexPath)) {
          entries.push({ slug: item, entryPoint: indexPath })
          break
        }
      }
    } else if (stat.isFile()) {
      const ext = extname(item)
      if (ext === ".ts" || ext === ".js") {
        entries.push({ slug: basename(item, ext), entryPoint: fullPath })
      }
    }
  }

  if (entries.length === 0) {
    throw new Error("No agents found in agents/ directory. See https://21st.dev/agents/docs to get started.")
  }

  return entries
}

export async function bundleAgent(entryPoint: string): Promise<Buffer> {
  const result = await esbuild.build({
    entryPoints: [entryPoint],
    bundle: true,
    platform: "node",
    target: "node22",
    format: "esm",
    write: false,
    external: ["@21st-sdk/agent"],
    minify: true,
    sourcemap: false,
  })

  if (result.errors.length > 0) {
    throw new Error(
      `Bundle failed:\n${result.errors.map((e) => e.text).join("\n")}`,
    )
  }

  return Buffer.from(result.outputFiles[0].contents)
}

async function importBundle(bundle: Buffer): Promise<Record<string, unknown> | null> {
  const { writeFileSync, unlinkSync, mkdirSync } = await import("fs")
  const { join } = await import("path")

  // Write to .an-tmp/ in cwd so ESM can resolve @21st-sdk/agent from node_modules
  const tmpDir = join(process.cwd(), ".an-tmp")
  mkdirSync(tmpDir, { recursive: true })
  const tmpPath = join(tmpDir, `an-bundle-${Date.now()}.mjs`)
  try {
    writeFileSync(tmpPath, bundle)
    const mod = await import(tmpPath)
    const config = mod.default
    if (config?._type === "agent") return config
    return null
  } catch {
    return null
  } finally {
    try { unlinkSync(tmpPath) } catch {}
    try { const { rmdirSync } = await import("fs"); rmdirSync(tmpDir) } catch {}
  }
}

export async function extractSandboxConfig(
  bundle: Buffer,
): Promise<Record<string, unknown> | null> {
  const config = await importBundle(bundle)
  if (!config) return null
  const sandbox = config.sandbox as Record<string, unknown> | undefined
  if (sandbox && (sandbox as any)._type === "sandbox") {
    const { _type, ...sandboxConfig } = sandbox
    return sandboxConfig
  }
  return null
}

export type AgentMetadata = {
  model: string
  systemPrompt?: string | { type: string; preset: string; append?: string }
  permissionMode: string
  maxTurns: number
  maxBudgetUsd?: number
  tools: { name: string; description: string }[]
  hooks: string[]
  sandbox?: { apt?: string[]; setup?: string[]; cwd?: string }
}

const HOOK_NAMES = ["onStart", "onToolCall", "onToolResult", "onStepFinish", "onFinish", "onError"]

export async function extractAgentMetadata(
  bundle: Buffer,
): Promise<AgentMetadata | null> {
  try {
    const config = await importBundle(bundle)
    if (!config) return null

    const tools: { name: string; description: string }[] = []
    if (config.tools && typeof config.tools === "object") {
      for (const [name, def] of Object.entries(config.tools as Record<string, any>)) {
        tools.push({ name, description: def?.description ?? "" })
      }
    }

    const hooks = HOOK_NAMES.filter((h) => typeof (config as any)[h] === "function")

    const metadata: AgentMetadata = {
      model: (config.model as string) ?? "unknown",
      permissionMode: (config.permissionMode as string) ?? "default",
      maxTurns: (config.maxTurns as number) ?? 50,
      tools,
      hooks,
    }

    if (config.systemPrompt !== undefined) {
      metadata.systemPrompt = config.systemPrompt as AgentMetadata["systemPrompt"]
    }
    if (config.maxBudgetUsd !== undefined) {
      metadata.maxBudgetUsd = config.maxBudgetUsd as number
    }

    const sandbox = config.sandbox as Record<string, unknown> | undefined
    if (sandbox && (sandbox as any)._type === "sandbox") {
      metadata.sandbox = {}
      if (sandbox.apt) metadata.sandbox.apt = sandbox.apt as string[]
      if (sandbox.setup) metadata.sandbox.setup = sandbox.setup as string[]
      if (sandbox.cwd) metadata.sandbox.cwd = sandbox.cwd as string
    }

    return metadata
  } catch {
    return null
  }
}
