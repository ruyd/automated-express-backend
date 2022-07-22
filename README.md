# Automated TypeScript Express Backend

[![Demo](https://img.shields.io/badge/Click%20for%20Demo-HEROKU-GREEN.svg)](https://drawspace-api.herokuapp.com/docs)

NodeJS Express Starter for backends and microservices

Just define your sequelize models and get a full CRUD API with SwaggerUI at runtime

Automate the boilerplate stuff

[Click to see sample app using it](https://github.com/ruyd/fullstack-monorepo)

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

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
