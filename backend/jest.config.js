module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  setupFiles: ['dotenv/config'],
  collectCoverageFrom: ['src/**/*.js', '!src/app.js'],
  coverageDirectory: 'coverage',
}
