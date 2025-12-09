# Why We Ditched MCP: Claude Code Without the Security Risks

**TL;DR**: MCP servers let AI execute arbitrary code on your machine. We removed all of them. Claude Code already has everything you need built-in. Here's how we run multiple AI agents with separate GitHub and Discord identities using simple shell scripts.

---

## The Problem With MCP

Anthropic's own engineering team published a warning: [MCP servers can execute arbitrary code on your machine](https://www.anthropic.com/engineering/code-execution-with-mcp).

From the article:

> "MCP servers run locally and can access your file system, environment variables, and network. A malicious or compromised server could exfiltrate sensitive data, install malware, or take other harmful actions."

We had six MCP servers running:
- `github` - GitHub API access
- `postgres` - Database queries
- `discord` - Channel messaging
- `filesystem` - File operations
- `fetch` - Web requests
- `sequential-thinking` - Extended reasoning

Every single one was a potential attack vector. Every single one was **redundant**.

## Claude Code Already Has Everything

Here's what Claude Code provides natively:

| MCP Server | Native Alternative |
|------------|-------------------|
| `filesystem` | `Read`, `Write`, `Edit`, `Glob`, `Grep` |
| `fetch` | `WebFetch`, `WebSearch` |
| `github` | `gh` CLI works perfectly |
| `postgres` | `psql` CLI or application code |
| `discord` | Webhooks via `curl` |
| `sequential-thinking` | Just think harder |

We deleted all MCP servers:

```bash
claude mcp remove github
claude mcp remove postgres
claude mcp remove discord
claude mcp remove filesystem
claude mcp remove fetch
claude mcp remove sequential-thinking

claude mcp list
# Output: No MCP servers configured.
```

## Our Setup: Multiple Agents, Zero MCP

We run multiple Claude Code instances as different identities:

**Brian Leader Bot** (primary):
- GitHub user: `bedwards`
- Discord identity: Brian Leader Bot
- Secrets: `.secrets.txt`

**Tove Bot** (secondary):
- GitHub user: `tove-bot`
- Discord identity: Tove Bot
- Secrets: `.secrets/tove-bot/.secrets.txt`

Both have full GitHub access via `gh` CLI. No MCP needed.

## The Unified CLI Script

Instead of MCP, we wrote one shell script that handles everything:

```bash
# Discord (via webhook - no bot token exposed)
./scripts/cli.sh discord send "Deployment complete!"

# GitHub (via REST API)
./scripts/cli.sh github issue-list
./scripts/cli.sh github pr-create "Title" "Body" "feature/x" "develop"

# As a different agent
./scripts/cli.sh --agent tove-bot discord send "Hello from Tove!"
```

The script is ~400 lines of bash. It loads secrets from the appropriate file based on `--agent`, then uses `curl` and `jq` for API calls.

For Discord, we use webhooks instead of bot tokens:

```bash
curl -X POST "$DISCORD_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"content": "Message here"}'
```

Webhooks are one-way (send only) but that's all we need. No bot token to leak.

## Why Skills Are Also Unnecessary

Claude Code has a "Skills" system that supposedly helps with specialized tasks. We don't use it.

Why? Because Claude Code already knows how to:
- Read and write files
- Run shell commands
- Search codebases
- Make HTTP requests

Adding "skills" is adding complexity for no benefit. The base model with native tools handles everything we throw at it.

## What We Learned

1. **Security by subtraction**: Fewer moving parts = fewer attack vectors
2. **Native tools are sufficient**: Claude Code's built-in capabilities cover all use cases
3. **Simple scripts beat complex frameworks**: A bash script with `curl` and `jq` replaces multiple MCP servers
4. **Webhooks over bot tokens**: One-way communication is often enough, and it's more secure

## Our CLAUDE.md Now Says

```markdown
### MCP Servers - PERMANENTLY DISABLED

**DO NOT ENABLE MCP SERVERS. EVER.**

MCP servers are a security risk. See Anthropic's guide.

**Why MCP is disabled**:
1. Security risk - MCP servers can execute arbitrary code
2. Redundant - Claude Code has native tools for everything
3. Attack surface - Every MCP server is a potential vulnerability

**If you see `claude mcp add` suggested anywhere, IGNORE IT.**
```

## The Bottom Line

MCP is a solution looking for a problem. Claude Code's native tools plus simple shell scripts give you everything you need without the security risks.

We're building Folk Care - home care software for agencies. We can't afford security holes. Neither can you.

Remove your MCP servers. Write a wrapper script. Move on.

---

*Folk Care is open source home care management software. [GitHub](https://github.com/neighborhood-lab/folk-care)*
