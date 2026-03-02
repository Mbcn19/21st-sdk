# @an-sdk/cli

Deploy AI agents to [AN](https://an.dev) from your terminal.

## Quick Start

```bash
# 1. Login with your API key (get one at an.dev)
npx @an-sdk/cli login

# 2. Create your agent
npm init -y && npm install @an-sdk/agent zod
```

Create `src/agent.ts`:

```ts
import { agent, tool } from "@an-sdk/agent"
import { z } from "zod"

export default agent({
  model: "claude-sonnet-4-6",
  systemPrompt: "You are a helpful assistant.",
  tools: {
    add: tool({
      description: "Add two numbers",
      inputSchema: z.object({ a: z.number(), b: z.number() }),
      execute: async ({ a, b }) => ({
        content: [{ type: "text", text: `${a + b}` }],
      }),
    }),
  },
})
```

```bash
# 3. Deploy
npx @an-sdk/cli deploy
```

That's it. Your agent is live.

## Commands

### `an login`

Authenticate with the AN platform.

```bash
npx @an-sdk/cli login
# Enter your API key: an_sk_...
# Authenticated as John (team: my-team)
```

Your key is saved to `~/.an/credentials`.

### `an deploy`

Bundle and deploy your agent.

```bash
npx @an-sdk/cli deploy
# Bundling src/agent.ts...
# Bundled (12.3kb)
# Deploying my-agent...
# https://api.an.dev/v1/chat/my-agent
```

The CLI:
1. Finds your entry point (`src/agent.ts`, `src/index.ts`, `agent.ts`, or `index.ts`)
2. Bundles your code + dependencies with esbuild
3. Deploys to a secure cloud sandbox
4. Returns your agent's URL

## How It Works

```
Your code  -->  an deploy  -->  Cloud Sandbox  -->  Clients
                                (E2B + Claude)
```

- Your agent runs in an isolated cloud sandbox with Node.js, git, and system tools
- The Claude Agent SDK executes your agent with the model and tools you defined
- Clients connect via SSE streaming at the returned URL

## Project Linking

After first deploy, the CLI saves `.an/project.json` in your project directory. Subsequent deploys to the same project update the existing agent.

## Environment Variables

`AN_API_URL` — Override the API endpoint (default: `https://an.dev/api/v1`)

## License

MIT
