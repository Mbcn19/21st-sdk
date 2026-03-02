# Next.js Integration

`@an-sdk/nextjs` provides a server-side token handler so your `an_sk_` API key never reaches the browser. It also re-exports everything from `@an-sdk/react` for convenience.

## Install

```bash
npm install @an-sdk/nextjs @an-sdk/react ai @ai-sdk/react
```

## Setup

### 1. Set your API key

```env
# .env.local
AN_API_KEY=an_sk_your_key_here
```

Get your API key from [an.dev/agents/dashboard/api](https://an.dev/agents/dashboard/api).

### 2. Create the token route

```ts
// app/api/an/token/route.ts
import { createAnTokenHandler } from "@an-sdk/nextjs/server"

export const POST = createAnTokenHandler({
  apiKey: process.env.AN_API_KEY!,
})
```

### 3. Use in your page

```tsx
// app/page.tsx
"use client"

import { useChat } from "@ai-sdk/react"
import { AnAgentChat, createAnChat } from "@an-sdk/nextjs"
import "@an-sdk/react/styles.css"
import { useMemo } from "react"

export default function Chat() {
  const chat = useMemo(
    () => createAnChat({
      agent: "your-agent-slug",
      tokenUrl: "/api/an/token",
    }),
    [],
  )

  const { messages, sendMessage, status, stop, error } = useChat({ chat })

  return (
    <AnAgentChat
      messages={messages}
      onSend={(msg) =>
        sendMessage({ parts: [{ type: "text", text: msg.content }] })
      }
      status={status}
      onStop={stop}
      error={error}
    />
  )
}
```

## How It Works

```
Browser                     Your Next.js Server              AN Relay
  |                                |                            |
  |-- POST /api/an/token --------->|                            |
  |                                |-- POST /v1/tokens -------->|
  |                                |   (with an_sk_ key)        |
  |                                |<-- { token, expiresAt } ---|
  |<-- { token, expiresAt } ------|                            |
  |                                                             |
  |-- POST /v1/chat/:agent ------(with short-lived JWT)------->|
  |<-- streaming response -----(SSE)---------------------------|
```

The client only receives short-lived JWTs. Your API key stays on the server.

## API

### `createAnTokenHandler(options)`

Returns a Next.js `POST` route handler.

```ts
createAnTokenHandler({
  apiKey: string       // Your an_sk_ API key
  relayUrl?: string    // Default: "https://relay.an.dev"
  expiresIn?: string   // Default: "1h"
})
```

### `exchangeToken(options)`

Lower-level function for custom token exchange logic.

```ts
import { exchangeToken } from "@an-sdk/nextjs/server"

const { token, expiresAt } = await exchangeToken({
  apiKey: process.env.AN_API_KEY!,
  relayUrl: "https://relay.an.dev",
  expiresIn: "1h",
})
```

## Entry Points

- `@an-sdk/nextjs` — Re-exports everything from `@an-sdk/react` (components, types, `createAnChat`)
- `@an-sdk/nextjs/server` — Server-only: `createAnTokenHandler`, `exchangeToken`
