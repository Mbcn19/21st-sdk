import type { TimelineStep, StepState } from "../types/timeline"

export function mapToolStateToStepState(
  aiState: "partial-call" | "call" | "result",
): StepState {
  return aiState === "result" ? "complete" : "animating"
}

export function mapToolNameToVariant(
  toolName: string,
): "thinking" | "action" | "search" | undefined {
  const lower = toolName.toLowerCase()
  if (lower === "thinking" || lower === "reasoning") return "thinking"
  if (
    lower === "websearch" ||
    lower === "web_search" ||
    lower === "grep" ||
    lower === "glob" ||
    lower === "webfetch" ||
    lower === "web_fetch"
  )
    return "search"
  return undefined
}

function extractToolDetail(toolName: string, args: Record<string, any>): string {
  switch (toolName) {
    case "Bash":
      return args?.command
        ? String(args.command).slice(0, 80)
        : ""
    case "Edit":
    case "Write":
    case "Read":
      return args?.file_path
        ? String(args.file_path).split("/").pop() ?? ""
        : ""
    case "Grep":
      return args?.pattern ? String(args.pattern) : ""
    case "Glob":
      return args?.pattern ? String(args.pattern) : ""
    case "WebSearch":
    case "web_search":
      return args?.query ? String(args.query) : ""
    case "WebFetch":
    case "web_fetch":
      return args?.url ? String(args.url).slice(0, 60) : ""
    default:
      return ""
  }
}

export function mapToolInvocationToStep(
  toolCallId: string,
  toolInvocation: {
    toolName: string
    args?: Record<string, any>
    state: "partial-call" | "call" | "result"
    result?: any
  },
): Extract<TimelineStep, { type: "tool-call" }> {
  const { toolName, args = {}, result } = toolInvocation
  const detail = extractToolDetail(toolName, args)

  const step: Extract<TimelineStep, { type: "tool-call" }> = {
    id: toolCallId,
    type: "tool-call",
    toolName,
    toolDetail: detail,
    duration: Number.MAX_SAFE_INTEGER,
    toolVariant: mapToolNameToVariant(toolName),
  }

  if (toolName === "Bash") {
    step.bashCommand = args?.command ? String(args.command) : undefined
    if (toolInvocation.state === "result" && result) {
      step.bashOutput = typeof result === "string" ? result : JSON.stringify(result)
      step.bashSuccess = true
    }
  }

  if (toolName === "Edit" || toolName === "Write" || toolName === "Read") {
    step.filePath = args?.file_path ? String(args.file_path) : undefined
  }

  if (
    toolName === "WebSearch" ||
    toolName === "web_search" ||
    toolName === "Grep" ||
    toolName === "Glob"
  ) {
    step.searchQuery =
      args?.query ?? args?.pattern ? String(args?.query ?? args?.pattern) : undefined
    step.searchSource = toolName === "WebSearch" || toolName === "web_search" ? "web" : "code"
  }

  if (toolName.toLowerCase() === "thinking" || toolName.toLowerCase() === "reasoning") {
    step.thoughtContent =
      typeof args?.thought === "string"
        ? args.thought
        : typeof result === "string"
          ? result
          : undefined
  }

  return step
}
