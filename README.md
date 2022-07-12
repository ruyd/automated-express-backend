# Automated TypeScript Express Backend

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Modern template for NodeJS Express backends and microservices

Just define your sequelize models and you get a fully documented CRUD API with SwaggerUI

That's it, focus on functionality, automate the boilerplate stuff

## Developer Experience

- Sequelize
- Async Errors
- Auto CRUD API Routes for Models
- Auto SwaggerUI Admin
- JWT Security RS256
- Auth0 Authentication

## Setup

### .env

PORT=3001
DB_SSL=false
DB_URL=postgres://postgres:pass@localhost:5432/xyz
DB_SCHEMA=public
TOKEN_SECRET=
AUTH_BASE_URL=https://xzy.auth0.com
AUTH_CLIENT_SECRET=
AUTH_CLIENT_ID=

### Auth0

1. Set Authentication > Database to: Username-Password-Authentication
2. Create accessToken rule with code from \setup\auth0.js
3. Set Applications > App > Advanced > Grant Types check: Password
