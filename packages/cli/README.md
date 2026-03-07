# @21st-sdk/cli

Deploy AI agents to [21st Agents](https://21st.dev/agents) from your terminal.

## Quick Start

```bash
# 1. Login with your API key (get one at https://21st.dev/agents/api-keys)
npx @21st-sdk/cli login

# 2. Create your agent
npm init -y && npm install @21st-sdk/agent zod
```

Create `src/agent.ts`:

```ts
import { agent, tool } from "@21st-sdk/agent"
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
npx @21st-sdk/cli deploy
```

That's it. Your agent is live.

## Commands

### `an login`

Authenticate with your API key.

```bash
npx @21st-sdk/cli login
# Enter your API key: an_sk_...
# Authenticated as John (team: my-team)
```

Your key is saved to `~/.an/credentials`.

### `an deploy`

Bundle and deploy your agent.

```bash
npx @21st-sdk/cli deploy
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

`API_URL_21ST` — Override the API endpoint (default: `https://an.dev/api/v1`)

## License

MIT
