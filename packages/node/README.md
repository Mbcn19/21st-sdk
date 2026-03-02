# @an-sdk/node

Server-side Node.js SDK for [AN](https://an.dev). Manage sandboxes, threads, and tokens programmatically.

## Install

```bash
npm install @an-sdk/node
```

## Quick Start

```ts
import { AnClient } from "@an-sdk/node"

const an = new AnClient({
  apiKey: process.env.AN_API_KEY!, // an_sk_...
})

// Create a sandbox for your agent
const sandbox = await an.sandboxes.create({ agent: "my-agent" })

// Create a thread
const thread = await an.threads.create({
  sandboxId: sandbox.sandboxId,
  name: "Review PR #42",
})

// Generate a short-lived token for browser clients
const { token, expiresAt } = await an.tokens.create({
  agent: "my-agent",
  expiresIn: "1h",
})
```

## API

### `new AnClient(config)`

```ts
new AnClient({
  apiKey: string     // Your an_sk_ API key
  baseUrl?: string   // Default: "https://relay.an.dev"
})
```

### `client.sandboxes`

| Method | Description |
|--------|-------------|
| `create({ agent })` | Create a new sandbox for an agent |
| `get(sandboxId)` | Get sandbox details (status, threads, agent info) |
| `delete(sandboxId)` | Delete a sandbox |

### `client.threads`

| Method | Description |
|--------|-------------|
| `list({ sandboxId })` | List all threads in a sandbox |
| `create({ sandboxId, name? })` | Create a new thread |
| `get({ sandboxId, threadId })` | Get thread with messages |
| `delete({ sandboxId, threadId })` | Delete a thread |

### `client.tokens`

| Method | Description |
|--------|-------------|
| `create({ agent?, userId?, expiresIn? })` | Create a short-lived JWT (default: 1h) |

## License

MIT
