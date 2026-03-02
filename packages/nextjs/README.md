# @an-sdk/nextjs

Next.js integration for [AN](https://an.dev) AI agent chat. Provides a server-side token handler so your API key never reaches the client.

## Install

```bash
npm install @an-sdk/nextjs @an-sdk/react ai @ai-sdk/react
```

## Quick Start

### 1. Set your API key

```env
# .env.local
AN_API_KEY=an_sk_your_key_here
```

Get your API key from [an.dev/agents/dashboard/api](https://an.dev/agents/dashboard/api).

### 2. Create the token route (one line)

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

That's it. Your `an_sk_` API key stays on the server. The client only receives short-lived JWTs.

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

## License

MIT
