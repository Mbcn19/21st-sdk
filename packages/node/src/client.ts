import type {
  AnClientConfig,
  AnApiError,
  CreateSandboxParams,
  Sandbox,
  SandboxDetail,
  CreateThreadParams,
  ListThreadsParams,
  GetThreadParams,
  DeleteThreadParams,
  Thread,
  ThreadSummary,
  CreateTokenParams,
  Token,
  WriteFilesParams,
  ReadFileParams,
  FileContent,
  ExecParams,
  ExecResult,
  GitCloneParams,
  GitCloneResult,
} from "./types"

const DEFAULT_BASE_URL = "https://relay.an.dev"

export class AnClient {
  private readonly apiKey: string
  private readonly baseUrl: string

  readonly sandboxes: SandboxesResource
  readonly threads: ThreadsResource
  readonly tokens: TokensResource

  constructor(config: AnClientConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "")
    this.sandboxes = new SandboxesResource(this)
    this.threads = new ThreadsResource(this)
    this.tokens = new TokensResource(this)
  }

  /** @internal */
  async _fetch<T>(path: string, init?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const res = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        ...init?.headers,
      },
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: AnApiError }
      const msg = body.error?.message ?? `Request failed: ${res.status}`
      throw new Error(msg)
    }

    if (res.status === 204) return undefined as T
    return res.json() as Promise<T>
  }
}

class FilesResource {
  constructor(private client: AnClient) {}

  async write(params: WriteFilesParams): Promise<void> {
    return this.client._fetch<void>(`/v1/sandboxes/${params.sandboxId}/files`, {
      method: "POST",
      body: JSON.stringify({ files: params.files }),
    })
  }

  async read(params: ReadFileParams): Promise<FileContent> {
    const encodedPath = encodeURIComponent(params.path)
    return this.client._fetch<FileContent>(
      `/v1/sandboxes/${params.sandboxId}/files?path=${encodedPath}`,
    )
  }
}

class GitResource {
  constructor(private client: AnClient) {}

  async clone(params: GitCloneParams): Promise<GitCloneResult> {
    return this.client._fetch<GitCloneResult>(`/v1/sandboxes/${params.sandboxId}/git/clone`, {
      method: "POST",
      body: JSON.stringify({
        url: params.url,
        ...(params.path && { path: params.path }),
        ...(params.token && { token: params.token }),
        ...(params.depth && { depth: params.depth }),
      }),
    })
  }
}

class SandboxesResource {
  readonly files: FilesResource
  readonly git: GitResource

  constructor(private client: AnClient) {
    this.files = new FilesResource(client)
    this.git = new GitResource(client)
  }

  async create(params: CreateSandboxParams): Promise<Sandbox> {
    return this.client._fetch<Sandbox>("/v1/sandboxes", {
      method: "POST",
      body: JSON.stringify({
        agent: params.agent,
        ...(params.files && { files: params.files }),
        ...(params.envs && { envs: params.envs }),
        ...(params.setup && { setup: params.setup }),
      }),
    })
  }

  async get(sandboxId: string): Promise<SandboxDetail> {
    return this.client._fetch<SandboxDetail>(`/v1/sandboxes/${sandboxId}`)
  }

  async delete(sandboxId: string): Promise<void> {
    return this.client._fetch<void>(`/v1/sandboxes/${sandboxId}`, {
      method: "DELETE",
    })
  }

  async exec(params: ExecParams): Promise<ExecResult> {
    return this.client._fetch<ExecResult>(`/v1/sandboxes/${params.sandboxId}/exec`, {
      method: "POST",
      body: JSON.stringify({
        command: params.command,
        ...(params.cwd && { cwd: params.cwd }),
        ...(params.envs && { envs: params.envs }),
        ...(params.timeoutMs && { timeoutMs: params.timeoutMs }),
      }),
    })
  }
}

class ThreadsResource {
  constructor(private client: AnClient) {}

  async list(params: ListThreadsParams): Promise<ThreadSummary[]> {
    return this.client._fetch<ThreadSummary[]>(
      `/v1/sandboxes/${params.sandboxId}/threads`,
    )
  }

  async create(params: CreateThreadParams): Promise<ThreadSummary> {
    return this.client._fetch<ThreadSummary>(
      `/v1/sandboxes/${params.sandboxId}/threads`,
      {
        method: "POST",
        body: JSON.stringify({ name: params.name }),
      },
    )
  }

  async get(params: GetThreadParams): Promise<Thread> {
    return this.client._fetch<Thread>(
      `/v1/sandboxes/${params.sandboxId}/threads/${params.threadId}`,
    )
  }

  async delete(params: DeleteThreadParams): Promise<void> {
    return this.client._fetch<void>(
      `/v1/sandboxes/${params.sandboxId}/threads/${params.threadId}`,
      { method: "DELETE" },
    )
  }
}

class TokensResource {
  constructor(private client: AnClient) {}

  async create(params: CreateTokenParams = {}): Promise<Token> {
    return this.client._fetch<Token>("/v1/tokens", {
      method: "POST",
      body: JSON.stringify({
        agents: params.agent ? [params.agent] : undefined,
        userId: params.userId,
        expiresIn: params.expiresIn ?? "1h",
      }),
    })
  }
}
