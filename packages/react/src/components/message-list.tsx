import React, { memo, useRef, useEffect, useCallback, useState, useMemo, Fragment } from "react"
import type { UIMessage, ChatStatus } from "ai"
import { cn } from "../utils/cn"
import { useThemeConfig } from "../theme-config"
import { UserMessage } from "./user-message"
import { StreamingMarkdown } from "./streaming-markdown"
import { MessageActions } from "./message-actions"
import { DateDivider } from "./date-divider"
import type { CustomToolRendererProps } from "../types"
import type { TimelineStep, StepState } from "../types/timeline"
import { mapToolInvocationToStep, mapToolStateToStepState } from "../utils/tool-adapters"
import { routeToolCall, resolveToolSize } from "../tools/tool-router"
import { SearchGroupRich, SearchGroupMinimal } from "../tools/search-tool"
import { ToolTimer } from "../tools/tool-timer"
import { ToolRowBase } from "../tools/tool-row-base"
import { SpinnerIcon16 } from "../icons/tool-icons"

interface MessageListProps {
  messages: UIMessage[]
  status: ChatStatus
  className?: string
  slots?: {
    UserMessage?: React.ComponentType<any>
    ToolRenderer?: React.ComponentType<any>
    MessageActions?: React.ComponentType<any>
  }
  classNames?: {
    userMessage?: string
    assistantMessage?: string
  }
  toolRenderers?: Record<string, React.ComponentType<CustomToolRendererProps>>
}

const SCROLL_THRESHOLD = 80
const PLANNING_LABELS = ["Brewing...", "Crafting...", "Working...", "Preparing..."]
const noop = () => {}

function densityClass(density: string): string {
  switch (density) {
    case "dense": return "space-y-0"
    case "compact": return "space-y-1"
    case "relaxed":
    default: return "space-y-3"
  }
}

function isSearchTool(toolName: string): boolean {
  const lower = toolName.toLowerCase()
  return lower === "websearch" || lower === "web_search" || lower === "grep" || lower === "glob" || lower === "webfetch" || lower === "web_fetch"
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="flex items-center h-6 px-0.5 mt-1">
      <button type="button" tabIndex={-1} onClick={handleCopy}
        className="p-1.5 rounded-md transition-[background-color,transform] duration-150 ease-out hover:bg-accent active:scale-[0.97]">
        <div className="relative w-3.5 h-3.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
            className={`absolute inset-0 w-3.5 h-3.5 text-muted-foreground transition-[opacity,transform] duration-200 ease-out ${copied ? "opacity-0 scale-50" : "opacity-100 scale-100"}`}>
            <g transform="scale(1.15) translate(-1.8, -1.8)">
              <path d="M15 9V5.25C15 4.00736 13.9926 3 12.75 3H5.25C4.00736 3 3 4.00736 3 5.25V12.75C3 13.9926 4.00736 15 5.25 15H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M18.75 9H11.25C10.0074 9 9 10.0074 9 11.25V18.75C9 19.9926 10.0074 21 11.25 21H18.75C19.9926 21 21 19.9926 21 18.75V11.25C21 10.0074 19.9926 9 18.75 9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            className={`absolute inset-0 w-3.5 h-3.5 text-muted-foreground transition-[opacity,transform] duration-200 ease-out ${copied ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}>
            <path d="M5 12.75L10 19L19 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>
    </div>
  )
}

export const MessageList = memo(function MessageList({
  messages,
  status,
  className,
  slots,
  classNames,
  toolRenderers,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)
  const config = useThemeConfig()
  const CustomUserMessage = slots?.UserMessage || UserMessage

  const isStreaming = status === "streaming" || status === "submitted"
  const toolSize = resolveToolSize(config)
  const isSticky = config.stickyUserMessages && config.messageStyle === "full-width"

  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant")
  const lastAssistantHasContent = lastAssistantMsg && (lastAssistantMsg.parts ?? []).some(
    (p: any) => (p.type === "text" && p.text?.trim()) || p.type === "tool-invocation",
  )
  const showPlanning = isStreaming && !lastAssistantHasContent

  const [planningLabel, setPlanningLabel] = useState(
    () => PLANNING_LABELS[Math.floor(Math.random() * PLANNING_LABELS.length)]!,
  )
  useEffect(() => {
    if (!showPlanning) return
    setPlanningLabel(PLANNING_LABELS[Math.floor(Math.random() * PLANNING_LABELS.length)]!)
    const id = setInterval(() => {
      setPlanningLabel((prev) => {
        let next: string
        do { next = PLANNING_LABELS[Math.floor(Math.random() * PLANNING_LABELS.length)]! } while (next === prev && PLANNING_LABELS.length > 1)
        return next
      })
    }, 4000)
    return () => clearInterval(id)
  }, [showPlanning])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_THRESHOLD
  }, [])

  useEffect(() => {
    if (scrollRef.current && isAtBottomRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages.length, status])

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className={cn("an-message-list flex-1 overflow-y-auto", className)}
    >
      <div
        className="mx-auto px-4 py-6"
        style={{ maxWidth: "var(--an-max-width, 420px)" }}
      >
        {messages.length === 0 && (
          <p className="an-empty-state text-center text-sm py-16" style={{ color: "var(--an-foreground-subtle, #a3a3a3)" }}>
            Send a message to start the conversation.
          </p>
        )}

        {config.showDateDivider && messages.length > 0 && <DateDivider />}

        <div className={densityClass(config.messageDensity)}>
          {messages.map((msg, msgIndex) => {
            const isLast = msgIndex === messages.length - 1

            if (msg.role === "user") {
              const text = (msg.parts ?? []).filter((p: any) => p.type === "text").map((p: any) => p.text).join("")
              if (!text) return null
              return (
                <div key={msg.id} className={isSticky ? "sticky top-0 z-10 pb-3" : undefined}>
                  <CustomUserMessage message={msg} className={classNames?.userMessage} />
                </div>
              )
            }

            if (msg.role === "assistant") {
              return (
                <AssistantParts
                  key={msg.id}
                  msg={msg}
                  isLast={isLast}
                  isStreaming={isStreaming}
                  config={config}
                  toolSize={toolSize}
                  toolRenderers={toolRenderers}
                />
              )
            }

            return null
          })}

          {showPlanning && (
            <ToolRowBase
              size={toolSize}
              icon={config.showToolIcons ? <SpinnerIcon16 className="w-full h-full shrink-0 animate-spin text-muted-foreground" /> : undefined}
              shimmerLabel={planningLabel}
              completeLabel="Done"
              isAnimating={true}
            />
          )}
        </div>
      </div>
    </div>
  )
})

function AssistantParts({
  msg,
  isLast,
  isStreaming,
  config,
  toolSize,
  toolRenderers,
}: {
  msg: any
  isLast: boolean
  isStreaming: boolean
  config: ReturnType<typeof useThemeConfig>
  toolSize: "normal" | "compact"
  toolRenderers?: Record<string, React.ComponentType<CustomToolRendererProps>>
}) {
  const parts = msg.parts ?? []

  const { elements } = useMemo(() => {
    const elems: React.ReactNode[] = []
    let actionIndex = 0
    let i = 0

    while (i < parts.length) {
      const part = parts[i]!

      if (part.type === "text") {
        const text = part.text as string
        if (text) {
          const isCurrentlyStreaming = isLast && isStreaming
          elems.push(
            <div key={`${msg.id}-text-${i}`} className="px-0.5 py-1" style={{ fontSize: "var(--an-text-size, 14px)" }}>
              <StreamingMarkdown
                content={text}
                className={`leading-relaxed [&_p]:leading-relaxed ${config.textContrast === "high" ? "text-foreground/90" : "text-foreground/60"}`}
              />
              {config.showCopyButton && !isCurrentlyStreaming && text.trim() && <CopyButton text={text} />}
            </div>,
          )
        }
        i++
        continue
      }

      if (part.type === "tool-invocation") {
        const inv = part.toolInvocation
        if (!inv) { i++; continue }

        const step = mapToolInvocationToStep(inv.toolCallId || `${msg.id}-tool-${i}`, inv)
        const state = mapToolStateToStepState(inv.state)

        if (step.toolVariant === "search") {
          if (config.searchDisplay === "hidden") {
            elems.push(<ToolTimer key={step.id} step={step} state={state} onComplete={noop} />)
            i++
            continue
          }

          const searchGroup: Extract<TimelineStep, { type: "tool-call" }>[] = [step]
          const searchStates: Record<string, StepState> = { [step.id]: state }

          let j = i + 1
          while (j < parts.length) {
            const nextPart = parts[j]
            if (nextPart?.type !== "tool-invocation") break
            const nextInv = nextPart.toolInvocation
            if (!nextInv || !isSearchTool(nextInv.toolName)) break
            const nextStep = mapToolInvocationToStep(nextInv.toolCallId || `${msg.id}-tool-${j}`, nextInv)
            const nextState = mapToolStateToStepState(nextInv.state)
            searchGroup.push(nextStep)
            searchStates[nextStep.id] = nextState
            j++
          }

          if (config.searchDisplay === "rich-group") {
            elems.push(<SearchGroupRich key={`search-${msg.id}-${step.id}`} toolSteps={searchGroup} stepStates={searchStates} onStepComplete={noop} showIcon={config.showToolIcons} size={toolSize} />)
          } else {
            elems.push(<SearchGroupMinimal key={`search-${msg.id}-${step.id}`} toolSteps={searchGroup} stepStates={searchStates} onStepComplete={noop} showIcon={config.showToolIcons} size={toolSize} />)
          }

          i = j
          continue
        }

        const currentActionIndex = actionIndex++
        elems.push(
          <Fragment key={step.id}>
            {routeToolCall(step, state, noop, config, currentActionIndex)}
          </Fragment>,
        )
        i++
        continue
      }

      i++
    }

    return { elements: elems }
  }, [parts, msg.id, isLast, isStreaming, config, toolSize])

  return <>{elements}</>
}
