const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    setupNodeEvents(on, config) {
      on("task", {
        "db:reset": () => {
          // ... kode reset db Anda ...
          return null;
        },
      });
    },
  },
});
