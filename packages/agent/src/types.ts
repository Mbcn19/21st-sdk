import type { z } from "zod"

// --- Permission & Runtime ---

export type PermissionMode =
  | "default"
  | "acceptEdits"
  | "bypassPermissions"
  | "plan"
  | "dontAsk"

export type Runtime = "claude-code" | "codex"

// --- Tool Types ---

export type ToolResultContent =
  | { type: "text"; text: string }
  | { type: "image"; data: string; mimeType: string }

export type CallToolResult = {
  content: ToolResultContent[]
  isError?: boolean
}

export interface ToolDefinition<
  TInput extends z.ZodObject<z.ZodRawShape> = z.ZodObject<z.ZodRawShape>,
> {
  readonly _type: "tool"
  description: string
  inputSchema: TInput
  execute: (args: z.infer<TInput>) => Promise<CallToolResult>
}

export type ToolSet = Record<string, ToolDefinition<any>>

// --- Hook Payload Types ---

export interface OnStartPayload {
  sessionId: string
  model: string
  tools: string[]
}

export interface OnToolCallPayload {
  toolName: string
  input: Record<string, unknown>
}

export interface OnToolResultPayload {
  toolName: string
  input: Record<string, unknown>
  output: unknown
}

export interface OnStepFinishPayload {
  message: unknown
  cost: number
}

export interface OnFinishPayload {
  result: { text: string; subtype: string }
  cost: number
  duration: number
  turns: number
  usage: { inputTokens: number; outputTokens: number }
}

export interface OnErrorPayload {
  error: Error
}

// --- Sandbox Config ---

export interface SandboxOptions {
  /** System packages to install via apt-get */
  apt?: string[]
  /** Commands to run on sandbox creation (after apt install) */
  setup?: string[]
  /** Files to write to sandbox (path → content) */
  files?: Record<string, string>
  /** Working directory for Claude Code (default: /home/user/repo) */
  cwd?: string
}

export interface SandboxConfig extends SandboxOptions {
  readonly _type: "sandbox"
}

// --- Agent Config ---

export interface AgentConfig<TOOLS extends ToolSet = ToolSet> {
  readonly _type: "agent"
  runtime: Runtime
  model: string
  systemPrompt?: string | { type: "preset"; preset: "claude_code"; append?: string }
  permissionMode: PermissionMode
  maxTurns: number
  maxBudgetUsd?: number
  sandbox?: SandboxConfig
  tools: TOOLS
  onStart?: (payload: OnStartPayload) => void | Promise<void>
  onToolCall?: (
    payload: OnToolCallPayload,
  ) => void | boolean | Promise<void | boolean>
  onToolResult?: (payload: OnToolResultPayload) => void | Promise<void>
  onStepFinish?: (payload: OnStepFinishPayload) => void | Promise<void>
  onFinish?: (payload: OnFinishPayload) => void | Promise<void>
  onError?: (payload: OnErrorPayload) => void | Promise<void>
}

export interface AgentOptions<TOOLS extends ToolSet = ToolSet> {
  runtime?: Runtime
  model?: string
  systemPrompt?:
    | string
    | { type: "preset"; preset: "claude_code"; append?: string }
  permissionMode?: PermissionMode
  maxTurns?: number
  maxBudgetUsd?: number
  sandbox?: SandboxConfig
  tools?: TOOLS
  onStart?: (payload: OnStartPayload) => void | Promise<void>
  onToolCall?: (
    payload: OnToolCallPayload,
  ) => void | boolean | Promise<void | boolean>
  onToolResult?: (payload: OnToolResultPayload) => void | Promise<void>
  onStepFinish?: (payload: OnStepFinishPayload) => void | Promise<void>
  onFinish?: (payload: OnFinishPayload) => void | Promise<void>
  onError?: (payload: OnErrorPayload) => void | Promise<void>
}
