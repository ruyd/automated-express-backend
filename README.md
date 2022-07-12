# Automated TypeScript Express Backend

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Modern template for NodeJS Express backends and microservices

Just define your sequelize models and get a full CRUD API with SwaggerUI

Automate the boilerplate stuff

## Developer Experience

- Sequelize
- Async Errors
- Auto CRUD API Routes for Models
- Auto SwaggerUI Admin
- JWT Security RS256
- Auth0 Authentication

## Setup

### .env

> PORT=3001<br>
> DB_SSL=false<br>
> DB_URL=postgres://postgres:pass@localhost:5432/xyz<br>
> DB_SCHEMA=public<br>
> TOKEN_SECRET=<br>
> AUTH_BASE_URL=https://xzy.auth0.com<br>
> AUTH_CLIENT_SECRET=<br>
> AUTH_CLIENT_ID=<br>

### Auth0

1. Set Authentication > Database to: Username-Password-Authentication
2. Create enrichAccessToken rule with code from \setup\auth0.js
3. Set Applications > App > Advanced > Grant Types check: Password
