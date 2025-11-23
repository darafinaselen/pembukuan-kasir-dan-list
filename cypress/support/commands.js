// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

// Login Command
Cypress.Commands.add("loginAs", (role) => {
  const email =
    role === "ADMIN" ? "admin@pembukuan.com" : "operator@example.com";
  const password = role === "ADMIN" ? "admin@12345" : "operator123";

  cy.clearCookies();
  cy.clearLocalStorage();
  cy.visit("/");
  cy.wait(1000);

  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should("include", "/dashboard");
  cy.contains("Dashboard", { timeout: 10000 }).should("be.visible");
});
