# AN SDK

The open-source SDK for building, deploying, and embedding AI coding agents.

**AN** is the "Vercel for agents" — a framework + hosting platform for AI agents. Define agents in code, deploy with one command, embed anywhere.

## Packages

| Package | Description | npm |
|---|---|---|
| [`@an-sdk/agent`](./packages/agent) | Define agents with full type safety | [![npm](https://img.shields.io/npm/v/@an-sdk/agent)](https://www.npmjs.com/package/@an-sdk/agent) |
| [`@an-sdk/react`](./packages/react) | Drop-in React chat UI for agents | [![npm](https://img.shields.io/npm/v/@an-sdk/react)](https://www.npmjs.com/package/@an-sdk/react) |
| [`@an-sdk/node`](./packages/node) | Node.js client for the AN API | [![npm](https://img.shields.io/npm/v/@an-sdk/node)](https://www.npmjs.com/package/@an-sdk/node) |
| [`@an-sdk/nextjs`](./packages/nextjs) | Next.js integration (server + client) | [![npm](https://img.shields.io/npm/v/@an-sdk/nextjs)](https://www.npmjs.com/package/@an-sdk/nextjs) |
| [`@an-sdk/cli`](./packages/cli) | CLI for deploying agents | [![npm](https://img.shields.io/npm/v/@an-sdk/cli)](https://www.npmjs.com/package/@an-sdk/cli) |

## Quickstart

### 1. Define an agent

```ts
// agents/my-agent.ts
import { agent, tool } from "@an-sdk/agent"
import { z } from "zod"

export default agent({
  model: "claude-sonnet-4-6",
  systemPrompt: "You are a helpful coding assistant.",
  tools: {
    greet: tool({
      description: "Greet the user",
      inputSchema: z.object({ name: z.string() }),
      execute: async ({ name }) => ({
        content: [{ type: "text", text: `Hello, ${name}!` }],
      }),
    }),
  },
})
```

### 2. Deploy

```bash
npx @an-sdk/cli login
npx @an-sdk/cli deploy
```

### 3. Embed in your app

```tsx
import { AnAgentChat } from "@an-sdk/react"

export default function Page() {
  return <AnAgentChat agent="your-agent-slug" />
}
```

## Architecture

```
Developer → CLI → AN Platform → E2B Sandbox (agent runs here)
                                     ↕
Client → @an-sdk/react → AN Relay → SSE Streaming
```

- **SDK packages** (this repo): Open-source. Define agents, build UIs, deploy.
- **AN Platform**: Managed infrastructure. Runs agents in sandboxes, handles billing, auth, scaling.

Same model as Next.js (open-source) + Vercel (managed platform).

## Documentation

See the [`docs/`](./packages/docs) directory or visit [an.dev/docs](https://an.dev/docs).

## Examples

- [`examples/basic-agent`](./examples/basic-agent) — Minimal agent with a custom tool

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT — see [LICENSE](./LICENSE).
