import type { z } from "zod"
import type { CallToolResult, ToolDefinition } from "./types"

export function tool<TInput extends z.ZodObject<z.ZodRawShape>>(config: {
  description: string
  inputSchema: TInput
  execute: (args: z.infer<TInput>) => Promise<CallToolResult>
}): ToolDefinition<TInput> {
  return { _type: "tool" as const, ...config }
}
