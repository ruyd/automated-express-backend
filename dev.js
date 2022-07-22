//NPM RUN DEV wrapper for lazy prebuilding before dev
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
const fs = require('fs')
const { exec } = require('child_process');
const options = { env: { FORCE_COLOR: true } }

const heroku = process.env._ && process.env._.indexOf("heroku") !== -1

async function run() {
  if (heroku) {
    console.error('Dev script - not for heroku..', process.env)
    return
  }
  const tsc = exec('npx tsc --watch')
  tsc.stdout.pipe(process.stdout)
  tsc.stderr.pipe(process.stdout)
  const job = exec('nodemon -q dist/src/index.js')
  job.stdout.pipe(process.stdout)
  job.stderr.pipe(process.stdout)
}

async function init() {
  console.warn('Warming up node_modules and dist, will take a few...')
  const npm = exec('npm i', options)
  npm.stdout.pipe(process.stdout)
  console.log('node_modules: ✔')
  const tsc = exec('tsc', options)
  tsc.stdout.pipe(process.stdout)

  if (fs.existsSync('dist')) {
    console.log('dist: ✔')
    run()
  } else {
    console.error('something went wrong, dist not generated, aborting...')
    return
  }
}

//RUN

if (!fs.existsSync('.env') && !heroku) {
  if (fs.existsSync('setup/sample.env')) {
    console.warn('.env needs setup, creating... 👀')
    const cfg = fs.readFileSync("setup/sample.env")
    fs.writeFileSync('.env', cfg)
  }
}

if (!fs.existsSync('node_modules')) {
  init()
  return
} else {
  console.info('node_modules: ✔')
}

if (!fs.existsSync('dist')) {
  init()
  return
} else {
  console.info('dist: ✔')
}

run()