import React, { memo, useState, useEffect, useRef } from "react"
import { ChevronRight } from "lucide-react"
import { toolRegistry } from "./tool-registry"
import { GenericTool } from "./generic-tool"
import { getToolStatus } from "../utils/format-tool"
import { cn } from "../utils/cn"

interface TaskToolProps {
  part: any
  nestedTools?: any[]
  chatStatus?: string
}

const MAX_VISIBLE_TOOLS = 5
const TOOL_HEIGHT_PX = 24

export const TaskTool = memo(function TaskTool({ part, nestedTools = [], chatStatus }: TaskToolProps) {
  const { isPending, isInterrupted } = getToolStatus(part, chatStatus)
  const [isExpanded, setIsExpanded] = useState(isPending)
  const scrollRef = useRef<HTMLDivElement>(null)
  const wasStreamingRef = useRef(isPending)

  const subagentType = part.input?.subagent_type
  const description = part.input?.description || ""

  useEffect(() => {
    if (wasStreamingRef.current && !isPending) {
      setIsExpanded(false)
    }
    wasStreamingRef.current = isPending
  }, [isPending])

  useEffect(() => {
    if (isPending && isExpanded && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [nestedTools.length, isPending, isExpanded])

  const hasNestedTools = nestedTools.length > 0

  const getSubtitle = () => {
    if (description) {
      return description.length > 60 ? description.slice(0, 57) + "..." : description
    }
    return ""
  }

  const subtitle = getSubtitle()

  const getTitle = () => {
    if (!subagentType) return isPending ? "Starting agent" : "Agent"
    return subagentType
  }

  if (isInterrupted && !part.output) {
    return (
      <div className="an-tool-task flex items-center gap-1.5 px-2 py-0.5">
        <span className="text-xs" style={{ color: "var(--an-tool-color-muted)" }}>Task interrupted</span>
      </div>
    )
  }

  return (
    <div className="an-tool-task">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="group flex items-start gap-1.5 py-0.5 px-2 cursor-pointer"
      >
        <div className="flex-1 min-w-0 flex items-center gap-1">
          <div className="text-xs flex items-center gap-1.5 min-w-0" style={{ color: "var(--an-tool-color-muted)" }}>
            <span className="font-medium whitespace-nowrap flex-shrink-0">{getTitle()}</span>
            {subtitle && (
              <span className="truncate" style={{ opacity: 0.6 }}>{subtitle}</span>
            )}
            <ChevronRight
              className={cn(
                "w-3.5 h-3.5 transition-transform duration-200 ease-out flex-shrink-0",
                isExpanded && "rotate-90",
                !isExpanded && "opacity-0 group-hover:opacity-100",
              )}
              style={{ color: "var(--an-tool-color-muted)", opacity: isExpanded ? 1 : undefined }}
            />
          </div>
        </div>
      </div>

      {hasNestedTools && isExpanded && (
        <div className="relative">
          {isPending && nestedTools.length > MAX_VISIBLE_TOOLS && (
            <div className="absolute inset-x-0 top-0 h-8 z-10 pointer-events-none" style={{ background: "linear-gradient(to bottom, var(--an-background), transparent)" }} />
          )}
          <div
            ref={scrollRef}
            className={cn(isPending && nestedTools.length > MAX_VISIBLE_TOOLS && "overflow-y-auto")}
            style={isPending && nestedTools.length > MAX_VISIBLE_TOOLS ? { maxHeight: `${MAX_VISIBLE_TOOLS * TOOL_HEIGHT_PX}px` } : undefined}
          >
            {nestedTools.map((nestedPart, idx) => {
              const nestedMeta = toolRegistry[nestedPart.type]
              if (!nestedMeta) {
                return (
                  <div key={idx} className="text-xs py-0.5 px-2" style={{ color: "var(--an-tool-color-muted)" }}>
                    {nestedPart.type?.replace("tool-", "")}
                  </div>
                )
              }
              const { isPending: nestedIsPending, isError: nestedIsError } = getToolStatus(nestedPart, chatStatus)
              return (
                <GenericTool
                  key={idx}
                  icon={nestedMeta.icon}
                  title={nestedMeta.title(nestedPart)}
                  subtitle={nestedMeta.subtitle?.(nestedPart)}
                  isPending={nestedIsPending}
                  isError={nestedIsError}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
})
