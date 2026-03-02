# React UI

`@an-sdk/react` provides a full chat UI for AN agents. Built on [Vercel AI SDK v5](https://sdk.vercel.ai) — uses standard `useChat()` from `@ai-sdk/react`.

## Install

```bash
npm install @an-sdk/react ai @ai-sdk/react
```

## Basic Usage

```tsx
"use client"

import { useChat } from "@ai-sdk/react"
import { AnAgentChat, createAnChat } from "@an-sdk/react"
import "@an-sdk/react/styles.css"
import { useMemo } from "react"

export default function Chat() {
  const chat = useMemo(
    () => createAnChat({
      agent: "your-agent-slug",
      getToken: async () => "your_an_sk_token",
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

## `createAnChat(options)`

Creates an AI SDK `Chat` instance pointed at the AN Relay.

```ts
createAnChat({
  agent: string              // Agent slug from dashboard
  getToken: () => Promise<string>  // Returns an_sk_ key or JWT
  apiUrl?: string            // Default: "https://relay.an.dev"
  projectId?: string         // Session persistence key
  onFinish?: () => void
  onError?: (error: Error) => void
})
```

For Next.js apps, use `tokenUrl` instead of `getToken` — see [Next.js Integration](./05-nextjs.md).

## `<AnAgentChat />` Props

| Prop | Type | Description |
|------|------|-------------|
| `messages` | `UIMessage[]` | From `useChat()` |
| `onSend` | `(msg) => void` | Send handler |
| `status` | `ChatStatus` | `"ready" \| "submitted" \| "streaming" \| "error"` |
| `onStop` | `() => void` | Stop generation |
| `error` | `Error` | Error to display |
| `theme` | `AnTheme` | Theme from playground |
| `colorMode` | `"light" \| "dark" \| "auto"` | Color mode |
| `classNames` | `Partial<AnClassNames>` | Per-element CSS overrides |
| `slots` | `Partial<AnSlots>` | Component swapping |
| `className` | `string` | Root element class |
| `style` | `CSSProperties` | Root element style |

## Customization

Four levels, from simple to full control:

### 1. Theme tokens

Apply a theme JSON from the [AN Playground](https://an.dev/an/playground):

```tsx
<AnAgentChat theme={playgroundTheme} colorMode="dark" />
```

### 2. Class overrides

```tsx
<AnAgentChat
  classNames={{
    root: "rounded-2xl border",
    messageList: "px-8",
    inputBar: "bg-gray-50",
    userMessage: "bg-blue-100",
  }}
/>
```

### 3. Slot components

Swap sub-components:

```tsx
<AnAgentChat
  slots={{
    InputBar: MyCustomInput,
    UserMessage: MyUserBubble,
    ToolRenderer: MyToolRenderer,
  }}
/>
```

### 4. Individual component imports

```tsx
import { MessageList, InputBar, ToolRenderer } from "@an-sdk/react"
```

## CSS

Import once in your app:

```tsx
import "@an-sdk/react/styles.css"
```

No Tailwind peer dependency — CSS is pre-compiled. All elements have stable `an-*` class names:

```css
.an-root { }
.an-message-list { }
.an-user-message { }
.an-assistant-message { }
.an-input-bar { }
.an-send-button { }
.an-tool-bash { }
.an-tool-edit { }
```

## Theme Type

```ts
interface AnTheme {
  theme: Record<string, string>  // Shared: font, spacing, accent
  light: Record<string, string>  // Light mode CSS vars
  dark: Record<string, string>   // Dark mode CSS vars
}
```

## `applyTheme(element, theme, colorMode?)`

Manually inject CSS variables from a theme JSON onto a DOM element.

## Components

| Component | Description |
|-----------|-------------|
| `MessageList` | Auto-scrolling message container with grouping |
| `UserMessage` | User message bubble |
| `AssistantMessage` | Assistant response with parts routing |
| `StreamingMarkdown` | Markdown renderer with syntax highlighting |
| `InputBar` | Text input with send/stop buttons |
| `MessageActions` | Copy button |
| `ToolRenderer` | Routes tool parts to the correct component |

## Built-in Tool Renderers

| Component | Renders |
|-----------|---------|
| `BashTool` | Terminal commands with output |
| `EditTool` | File edits with diff display |
| `WriteTool` | File creation |
| `SearchTool` | Web search results |
| `TodoTool` | Task checklists |
| `PlanTool` | Step-by-step plans |
| `TaskTool` | Sub-agent tasks |
| `McpTool` | MCP protocol calls |
| `ThinkingTool` | Reasoning/thinking indicator |
| `GenericTool` | Fallback for unknown tools |

See [Custom Tools](./08-custom-tools.md) for building your own tool renderers.
