# zottie

A household application for coordinating grocery lists, managing kitchen inventory, and efficient meal prep.

## Project Structure

This is a monorepo containing:

- **[apps/mobile](./apps/mobile/README.md)** - Expo mobile application
- **[apps/api](./apps/api/README.md)** - Cloudflare Worker API

## Stack

- **Frontend**: Expo (React Native)
- **Backend**: Cloudflare Workers
- **Database**: Cloudflare D1 with Drizzle ORM
- **Auth**: Auth0

## Quick Links

### Development

- [Mobile Development Guide](./apps/mobile/README.md)
- [API Development Guide](./apps/api/README.md)

### Console & Dashboards

**Expo**

- [Project Dashboard](https://expo.dev/accounts/chestercarmer/projects/zottie)

**Cloudflare**

- [Worker Console](https://dash.cloudflare.com/a5d92c139e4973720d7a6eeda7a07e1f/workers/services/view/zottie-api/production)
- [API Endpoint](https://zottie-api.chestercarmer.workers.dev)

**Auth0**

- [Production App](https://manage.auth0.com/dashboard/us/dev-ib35s3efesgrnuob/applications/h3pZg51vB0ccr8J1VeAel0x9BUOx2XQE/settings)
- [Development App](https://manage.auth0.com/dashboard/us/dev-ib35s3efesgrnuob/applications/Fht75YKF31KDXFe8ak7TOjwKE8Cx9y9R/settings)

## Contributing

This project uses an AI-first development workflow based on the [ralph methodology](https://ghuntley.com/ralph/).

### How It Works

1. **PRDs drive development** - Features are defined as tightly-scoped PRDs in `.ralph/prds.json`. Each PRD should be small enough for an LLM to complete in a single session.

2. **Use the ralph prompt** - Paste the contents of `.ralph/ralph.md` into an interactive LLM session (like Claude Code). The prompt instructs the LLM to pick the highest priority PRD, implement it, verify the changes, document progress, and commit.

3. **Refine through AGENTS.md** - When the LLM makes choices you'd prefer to be different, add guidance to the `AGENTS.md` files throughout the repo. These files provide rails, guidelines, and documentation that shape LLM behavior.

### The Philosophy

The key insight is that corrections and taste compound over time. Instead of repeatedly giving the same feedback, we encode our preferences into documentation. This creates a multiplayer system where ideas propagate through shared `AGENTS.md` files, making the LLM better at matching expectations with each iteration.

### Verification

- **API changes**: Verified through e2e tests in `apps/api`
- **UI changes**: Currently rely on manual verification (UI tests are too brittle to maintain effectively right now)

### Quick Start

```bash
# 1. Add your feature as a PRD to .ralph/prds.json
# 2. Start an LLM session and paste the ralph prompt
cat .ralph/ralph.md
# 3. Let the LLM implement, verify, and commit
# 4. Review the changes and refine AGENTS.md as needed
```
