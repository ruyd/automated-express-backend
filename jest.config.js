const { pathsToModuleNameMapper } = require('ts-jest')
const { compilerOptions } = require('./tsconfig.json')
const paths = compilerOptions.paths || {}
const rootPath = compilerOptions.baseUrl || '.'
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  displayName: 'server',
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/build/', '<rootDir>/dist/'],
  roots: ['<rootDir>'],
  testMatch: ['<rootDir>/tests/**/*tests.ts'],
  modulePaths: [rootPath],
  moduleNameMapper: pathsToModuleNameMapper(paths, { prefix: '<rootDir>/' }),
}
