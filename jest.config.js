/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx)?$': 'ts-jest',
    "^.+\\.(js|jsx)$":  [
      'babel-jest',
      { configFile: './babel.config.test.js' }]
  },
  roots: ['<rootDir>/src/tests/']
};
