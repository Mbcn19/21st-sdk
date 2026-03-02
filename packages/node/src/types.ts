// ─── Client config ──────────────────────────────────────────

export interface AnClientConfig {
  apiKey: string
  baseUrl?: string
}

// ─── Sandbox types ──────────────────────────────────────────

export interface CreateSandboxParams {
  agent: string
  files?: Record<string, string>
  envs?: Record<string, string>
  setup?: string[]
}

export interface Sandbox {
  id: string
  sandboxId: string
  status: string
  createdAt: string
}

export interface SandboxDetail {
  id: string
  sandboxId: string
  status: string
  error?: string | null
  agent: { slug: string; name: string }
  threads: ThreadSummary[]
  createdAt: string
  updatedAt: string
}

// ─── Thread types ───────────────────────────────────────────

export interface ThreadSummary {
  id: string
  name?: string | null
  status: string
  createdAt: string
}

export interface CreateThreadParams {
  sandboxId: string
  name?: string
}

export interface ListThreadsParams {
  sandboxId: string
}

export interface GetThreadParams {
  sandboxId: string
  threadId: string
}

export interface DeleteThreadParams {
  sandboxId: string
  threadId: string
}

export interface Thread {
  id: string
  name?: string | null
  status: string
  messages?: unknown
  createdAt: string
  updatedAt: string
}

// ─── Token types ────────────────────────────────────────────

export interface CreateTokenParams {
  agent?: string
  userId?: string
  expiresIn?: string
}

export interface Token {
  token: string
  expiresAt: string
}

// ─── Files types ───────────────────────────────────────────

export interface WriteFilesParams {
  sandboxId: string
  files: Record<string, string>
}

export interface ReadFileParams {
  sandboxId: string
  path: string
}

export interface FileContent {
  path: string
  content: string
}

// ─── Exec types ────────────────────────────────────────────

export interface ExecParams {
  sandboxId: string
  command: string
  cwd?: string
  envs?: Record<string, string>
  timeoutMs?: number
}

export interface ExecResult {
  exitCode: number
  stdout: string
  stderr: string
}

// ─── Git types ─────────────────────────────────────────────

export interface GitCloneParams {
  sandboxId: string
  url: string
  path?: string
  token?: string
  depth?: number
}

export interface GitCloneResult {
  path: string
}

// ─── Error types ────────────────────────────────────────────

export interface AnApiError {
  code: string
  message: string
}
