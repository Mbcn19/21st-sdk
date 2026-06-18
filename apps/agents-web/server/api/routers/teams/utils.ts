import { prisma } from "@/lib/prisma"
import { GitHubIntegration } from "@/lib/github"
import { TRPCError } from "@trpc/server"
import { randomUUID } from "node:crypto"
import { customAlphabet, nanoid } from "nanoid"

/** Fixed-length lowercase tail for slug collision fallback. */
const slugTail = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 6)

// Same slugify pattern the other routers keep file-local.
function slugifyTeamHandle(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

/**
 * Picks a globally unique team slug: tries the slugified base, then
 * `base-NNN` with random 3-digit suffixes, then random 6-char tails
 * (degenerate bases like "personal-projects" have most numeric suffixes
 * taken by the 2026-04-30 backfill). The partial unique index
 * `teams_slug_unique` is the backstop for the tiny check-to-insert race.
 */
export async function generateUniqueTeamSlug(text: string): Promise<string> {
  const base = slugifyTeamHandle(text) || "team"
  let candidate = base
  for (let attempt = 0; attempt < 6; attempt++) {
    const taken = await prisma.team.findFirst({
      where: { slug: candidate },
      select: { id: true },
    })
    if (!taken) return candidate
    candidate =
      attempt < 3
        ? `${base}-${Math.floor(100 + Math.random() * 900)}`
        : `${base}-${slugTail()}`
  }
  // All checked candidates taken (astronomically unlikely) — fall back to a
  // UUID tail: an ugly slug beats a failed team creation.
  return `${base}-${randomUUID()}`
}

/**
 * Verifies team exists and user is the owner. Throws if not found or unauthorized.
 */
export async function requireTeamOwnership(teamId: string, userId: string) {
  const team = await prisma.team.findUnique({ where: { id: teamId } })

  if (!team) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Team not found" })
  }

  if (team.user_id !== userId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" })
  }

  return team
}

/**
 * Checks if user has access to team (owner or member). Returns access info.
 * Also returns whether user is the one who connected GitHub integration.
 * Admins have access to ALL teams for testing/debugging purposes.
 */
export async function checkTeamAccess(teamId: string, userId: string) {
  const [team, user] = await Promise.all([
    prisma.team.findUnique({ where: { id: teamId } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { is_admin: true, email: true },
    }),
  ])

  if (!team) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Team not found" })
  }

  // Enterprise GitHub: org-level installation takes priority over team-level
  if (user?.email) {
    const domain = user.email.split("@")[1]
    if (domain) {
      const enterpriseTeam = await prisma.team.findFirst({
        where: { enterprise_domain: domain },
        select: { github_integration: true },
      })
      if (enterpriseTeam?.github_integration) {
        const enterpriseIntegration =
          enterpriseTeam.github_integration as unknown as GitHubIntegration
        if (enterpriseIntegration?.installations?.length) {
          // Merge: enterprise installations first, then team's own
          const teamIntegration =
            team.github_integration as unknown as GitHubIntegration | null
          const teamInstallations = teamIntegration?.installations || []
          const enterpriseIds = new Set(enterpriseIntegration.installations.map(i => i.installation_id))
          const teamOnly = teamInstallations.filter(i => !enterpriseIds.has(i.installation_id))
          ;(team as any).github_integration = {
            ...teamIntegration,
            ...enterpriseIntegration,
            installations: [...enterpriseIntegration.installations, ...teamOnly],
          }
        }
      }
    }
  }

  // Check if user is the one who connected GitHub
  const resolvedIntegration =
    team.github_integration as unknown as GitHubIntegration | null
  const isGitHubConnector = resolvedIntegration?.connected_by_user_id === userId

  // Admins have access to any team
  if (user?.is_admin) {
    return {
      team,
      isOwner: false,
      isMember: false,
      isAdmin: true,
      isGitHubConnector,
    }
  }

  const isOwner = team.user_id === userId
  const isMember = await prisma.teamMember.findUnique({
    where: { team_id_user_id: { team_id: teamId, user_id: userId } },
  })

  if (!isOwner && !isMember) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" })
  }

  return { team, isOwner, isMember: !!isMember, isAdmin: false, isGitHubConnector }
}

/**
 * Gets or creates an invite link for a team. Optionally regenerates the token.
 */
export async function getOrCreateInviteLink(
  teamId: string,
  userId: string,
  regenerate = false,
) {
  if (regenerate) {
    return prisma.teamInviteLink.upsert({
      where: { team_id: teamId },
      update: { token: nanoid(10), is_active: true },
      create: { team_id: teamId, token: nanoid(10), created_by: userId },
    })
  }

  const existing = await prisma.teamInviteLink.findUnique({
    where: { team_id: teamId },
  })

  if (existing) return existing

  return prisma.teamInviteLink.create({
    data: { team_id: teamId, token: nanoid(10), created_by: userId },
  })
}
