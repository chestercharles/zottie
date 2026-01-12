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
