module.exports = {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.js"],
  transform: {
    "^.+\\.jsx?$": ["babel-jest", { configFile: "./babel.config.test.js" }],
  },
  collectCoverageFrom: [
    "src/lib/**/*.js",
    "!src/lib/**/*.test.js",
    "!src/lib/__tests__/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  verbose: true,
};
