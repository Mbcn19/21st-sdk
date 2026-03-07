# 21st SDK — Internal Dev Guide

This directory contains the 21st SDK packages. Source of truth lives here in the monorepo. The public open-source repo is at [github.com/21st-dev/21st-sdk](https://github.com/21st-dev/21st-sdk).

## Packages

| Directory | npm package | What it does |
|---|---|---|
| `agent/` | `@21st-sdk/agent` | Agent + tool definition (types only) |
| `react/` | `@21st-sdk/react` | React chat UI components |
| `node/` | `@21st-sdk/node` | Node.js API client |
| `nextjs/` | `@21st-sdk/nextjs` | Next.js integration (server + client) |
| `cli/` | `@21st-sdk/cli` | `an login` + `an deploy` CLI |
| `docs/` | — | Documentation (bundled into each package on publish) |

> **Note:** `agent-runtime` used to be here but was moved to `packages/agent-runtime/` — it's private and should never be in the public repo.

## Day-to-day development

Just work in the monorepo as normal. Edit files, run builds, test locally.

```bash
# Build all SDK packages
pnpm --filter "@21st-sdk/*" build

# Build a specific package
pnpm --filter @21st-sdk/react build
```

## Publishing to the open-source repo

When you're ready to push changes to the public [github.com/21st-dev/21st-sdk](https://github.com/21st-dev/21st-sdk):

### Prerequisites (one-time setup)

Clone the public repo as a sibling of the monorepo:

```bash
cd /Users/sergeybunas/Develop/21/
git clone git@github.com:21st-dev/21st-sdk.git
```

So your directory structure looks like:

```
Develop/21/
├── 21st/       ← monorepo (this repo)
└── an-sdk/       ← public repo
```

### Releasing

From the monorepo root:

```bash
# Option 1: Auto-generate commit message from recent monorepo commits
./scripts/release-sdk.sh

# Option 2: Custom commit message
./scripts/release-sdk.sh -m "feat: add theme customization API to @21st-sdk/react"

# Option 3: Tagged release (creates a git tag)
./scripts/release-sdk.sh -t v0.2.0 -m "v0.2.0 — streaming improvements and new tool renderers"
```

Then push:

```bash
cd ../an-sdk && git push        # regular release
cd ../an-sdk && git push --tags # if you created a tag
```

### What the script does

1. Copies `agent/`, `react/`, `node/`, `nextjs/`, `cli/`, `docs/` to the public repo
2. Excludes `node_modules/`, `dist/`, `.turbo/`, `CLAUDE.md` (private dev notes)
3. If no `-m` flag, pulls recent commit messages from the monorepo that touched `packages/an-sdk/` and uses them as the commit message
4. Creates a commit in the public repo (skips if nothing changed)
5. Optionally tags the commit with `-t`

### What NOT to do

- Don't develop directly in the public repo — always work in the monorepo
- Don't manually copy files — always use the release script
- Don't include `agent-runtime` — the script only copies the 6 listed packages

## Publishing to npm

npm publishing still happens from the monorepo, not the public repo:

```bash
pnpm --filter @21st-sdk/agent build && npm publish --access public
```

See the [NPM Publishing notes](../../.claude/projects/-Users-sergeybunas-Develop-21-21st/memory/MEMORY.md) for auth details.
