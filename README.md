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
- Auth0 Automatic Configuration (even Clients)
- Database Migrations with umzug
- Auto Tests with jest and Docker
- VSCode launchers, debugging server and tests
- Webpack with Hot Reload and Cache
- Git Pre-Commit Hook that run tests and block bad commits


## QuickStart
- if docker is available go with: `yarn start`
- Modify setup/db.json if not and `yarn dev`

### Auth0

- For Auth0 Automated Setup, copy sample.env to workspaces/server/.env and populate with:
  - [Create auth0 account](https://auth0.com/signup)
  - Go to Dashboard > Applications > API Explorer Application > Settings and copy settins into .env:
  - AUTH_TENANT=`tenant` domain without `tenant`.auth0.com
  - AUTH_EXPLORER_ID=`Client ID`
  - AUTH_EXPLORER_SECRET=`Client Secret`
