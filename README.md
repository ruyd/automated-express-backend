# Automated TypeScript Express Backend

[![Demo](https://img.shields.io/badge/Click%20for%20Demo-HEROKU-GREEN.svg)](https://drawspace-api.herokuapp.com/docs)

[![Tests](https://github.com/ruyd/automated-express-backend/actions/workflows/tests.yml/badge.svg)](https://github.com/ruyd/automated-express-backend/actions/workflows/tests.yml)

NodeJS Express Starter for backends and microservices

Easier than GraphQL, customizable and concise, Model-API generic functions for sequelize

Automate the boilerplate stuff

[Click to see sample app using it](https://github.com/ruyd/fullstack-monorepo)

## Developer Experience

- Sequelize
- Auto CRUD API Routes for Models
- Auto SwaggerUI Admin
- Non-invasive, allows regular/custom backend work
- JWT Security RS256
- Auth0 Authentication
- Database Migrations with umzug
- Auto Tests with jest and Docker
- VSCode launchers, debugging server and tests


## Setup
- if docker is available go with: `yarn start`
- Modify setup/db.json if not and `yarn dev`

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
