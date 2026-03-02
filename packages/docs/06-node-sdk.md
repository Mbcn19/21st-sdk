# Node SDK

`@an-sdk/node` is a server-side client for the AN API. Use it to manage sandboxes, threads, and tokens programmatically.

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

## `AnClient`

```ts
new AnClient({
  apiKey: string     // Your an_sk_ API key
  baseUrl?: string   // Default: "https://relay.an.dev"
})
```

## Resources

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
| `create({ agent?, userId?, expiresIn? })` | Create a short-lived JWT |

Default `expiresIn` is `"1h"`.

## Types

```ts
interface Sandbox {
  id: string
  sandboxId: string
  status: string
  createdAt: string
}

interface SandboxDetail {
  id: string
  sandboxId: string
  status: string
  error?: string | null
  agent: { slug: string; name: string }
  threads: ThreadSummary[]
  createdAt: string
  updatedAt: string
}

interface ThreadSummary {
  id: string
  name?: string | null
  status: string
  createdAt: string
}

interface Thread {
  id: string
  name?: string | null
  status: string
  messages?: unknown
  createdAt: string
  updatedAt: string
}

interface Token {
  token: string
  expiresAt: string
}
```

## Error Handling

All methods throw on non-2xx responses. The error message comes from the API response body when available.

```ts
try {
  const sandbox = await an.sandboxes.get("nonexistent")
} catch (err) {
  console.error(err.message) // "Sandbox not found" or similar
}
```
