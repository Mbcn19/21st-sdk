import { login } from "./login.js"
import { deploy } from "./deploy.js"
import { envList, envSet, envRemove } from "./env.js"
import { createRequire } from "module"

const require = createRequire(import.meta.url)
const { version } = require("../package.json")

const command = process.argv[2]
const args = process.argv.slice(3)
const hasFlag = (flag: string) => args.includes(flag)
function getFlagValue(flag: string): string | undefined {
  const idx = args.indexOf(flag)
  if (idx === -1 || idx + 1 >= args.length) return undefined
  return args[idx + 1]
}

function showHelp() {
  console.log(`AN CLI v${version} — deploy AI agents\n`)
  console.log("Usage: an <command>\n")
  console.log("Commands:")
  console.log("  an login                  Authenticate with AN platform")
  console.log("  an deploy                 Bundle and deploy your agent")
  console.log("  an env list <agent>       List environment variables")
  console.log("  an env set <agent> K V    Set an environment variable")
  console.log("  an env remove <agent> K   Remove an environment variable")
  console.log("\nOptions:")
  console.log("  --help, -h              Show help")
  console.log("  --version, -v           Show version")
  console.log("\nEnvironment variables:")
  console.log("  AN_API_KEY              API key (skips login prompt)")
  console.log("  AN_API_URL              API base URL override")
  console.log("\nGet started: an login")
  console.log("Docs: https://an.dev/docs")
}

function showLoginHelp() {
  console.log("Usage: an login [options]\n")
  console.log("Authenticate with the AN platform using an API key.\n")
  console.log("Options:")
  console.log("  --api-key KEY    Pass API key directly (non-interactive)")
  console.log("\nGet your API key at https://an.dev/api-keys")
}

function showDeployHelp() {
  console.log("Usage: an deploy\n")
  console.log("Bundle and deploy agents from the ./agents/ directory.\n")
  console.log("Agent structure:")
  console.log("  agents/")
  console.log("    my-agent/")
  console.log("      index.ts       agent entry point")
  console.log("    another.ts       single-file agent")
  console.log("\nDocs: https://an.dev/docs")
}

function showEnvHelp() {
  console.log("Usage: an env <subcommand> <agent-slug>\n")
  console.log("Manage environment variables for an agent.\n")
  console.log("Subcommands:")
  console.log("  an env list <agent>              List all env vars (masked)")
  console.log("  an env list <agent> --show-values List all env vars (plain text)")
  console.log("  an env set <agent> KEY VALUE     Set or update an env var")
  console.log("  an env remove <agent> KEY        Remove an env var")
}

if (command === "login") {
  if (hasFlag("--help") || hasFlag("-h")) {
    showLoginHelp()
  } else {
    await login({ apiKey: getFlagValue("--api-key") })
  }
} else if (command === "deploy") {
  if (hasFlag("--help") || hasFlag("-h")) {
    showDeployHelp()
  } else {
    if (hasFlag("--project")) {
      console.log("Warning: --project flag is no longer used and will be ignored.")
    }
    await deploy()
  }
} else if (command === "env") {
  const subcommand = args[0]
  const subArgs = args.slice(1)
  if (!subcommand || subcommand === "--help" || subcommand === "-h") {
    showEnvHelp()
  } else if (subcommand === "list") {
    await envList(subArgs)
  } else if (subcommand === "set") {
    await envSet(subArgs)
  } else if (subcommand === "remove") {
    await envRemove(subArgs)
  } else {
    console.log(`Unknown env subcommand: ${subcommand}`)
    showEnvHelp()
  }
} else if (command === "--version" || command === "-v") {
  console.log(version)
} else {
  showHelp()
}
