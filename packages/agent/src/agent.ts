import type { AgentConfig, AgentOptions, ToolSet } from "./types"

export function agent<TOOLS extends ToolSet = ToolSet>(
  config: AgentOptions<TOOLS>,
): AgentConfig<TOOLS> {
  return {
    _type: "agent" as const,
    runtime: config.runtime ?? "claude-code",
    model: config.model ?? "claude-sonnet-4-6",
    permissionMode: config.permissionMode ?? "bypassPermissions",
    maxTurns: config.maxTurns ?? 50,
    tools: (config.tools ?? {}) as TOOLS,
    ...config,
  }
}
