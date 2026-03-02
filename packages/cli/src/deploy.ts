import { getApiKey } from "./config.js"
import { findAgentEntryPoints, bundleAgent, extractSandboxConfig, extractAgentMetadata } from "./bundler.js"
import { existsSync } from "fs"
import { join } from "path"
import * as p from "@clack/prompts"

const API_BASE = process.env.AN_API_URL || "https://an.dev/api/v1"
const AN_BASE = process.env.AN_URL || "https://an.dev"

export async function deploy() {
  p.intro("an deploy")

  // 1. Check auth
  const apiKey = getApiKey()
  if (!apiKey) {
    p.log.error("Not logged in. Run `an login` first, or set AN_API_KEY env var.")
    process.exit(1)
  }

  // Deprecation notice for old project config
  if (existsSync(join(process.cwd(), ".an", "project.json"))) {
    p.log.warn(".an/project.json is no longer used and can be removed.")
  }

  // 2. Find agent entry points
  let agents
  try {
    agents = await findAgentEntryPoints()
  } catch (err: any) {
    p.log.error(err.message)
    process.exit(1)
  }
  p.log.info(`Found ${agents.length} agent${agents.length > 1 ? "s" : ""}`)

  // 3. Deploy each agent
  const deployed: { slug: string }[] = []

  for (const agent of agents) {
    const s = p.spinner()
    s.start(`Bundling ${agent.slug}...`)
    const bundle = await bundleAgent(agent.entryPoint)
    const sandboxConfig = await extractSandboxConfig(bundle)
    const metadata = await extractAgentMetadata(bundle)
    s.stop(`Bundled ${agent.slug} (${(bundle.length / 1024).toFixed(1)}kb)`)

    const s2 = p.spinner()
    s2.start(`Deploying ${agent.slug}...`)
    const res = await fetch(`${API_BASE}/agents/deploy`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        slug: agent.slug,
        bundle: bundle.toString("base64"),
        ...(sandboxConfig && { sandboxConfig }),
        ...(metadata && { metadata }),
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      s2.stop(`Failed to deploy ${agent.slug}`)
      p.log.error((err as any).message || "Deploy failed")

      if (deployed.length > 0) {
        p.log.info(`\nDeployed before failure:`)
        for (const a of deployed) {
          p.log.info(`  ${a.slug}  →  ${AN_BASE}/agents`)
        }
      }
      process.exit(1)
    }

    const result = await res.json()
    deployed.push({ slug: agent.slug })
    const versionTag = result.version ? ` (v${result.version})` : ""
    s2.stop(`${agent.slug} deployed${versionTag}`)
  }

  // 4. Output
  p.log.success(`Deployed ${deployed.length} agent${deployed.length > 1 ? "s" : ""}`)
  console.log()
  for (const agent of deployed) {
    console.log(`  ${agent.slug}  →  ${AN_BASE}/agents`)
  }
  console.log()
  p.log.info("Next steps:")
  console.log("  · Open the link above to test your agent")
  console.log("  · Run `an deploy` again after changes")
  console.log(`  · View all deployments: ${AN_BASE}/agents`)

  p.outro("Done")
}
