import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

Given('que existe um sorteio {string} com {int} cotas', (nomeSorteio: string, totalCotas: number) => {
  cy.request('POST', '/api/test-fixtures/sorteios', { nome: nomeSorteio, quantidadeCotas: totalCotas });
});

Given('a cota número {int} está disponível', (numero: number) => {
  cy.get(`[data-testid="cota-${numero}"]`).should('have.attr', 'data-status', 'disponivel');
});

Given('o comprador {string} preencheu seus dados de cadastro', (nomeComprador: string) => {
  cy.loginComoComprador(nomeComprador); // comando customizado, definido em cypress/support/commands.ts
});

When('{string} escolhe a cota número {int}', (nomeComprador: string, numero: number) => {
  cy.get(`[data-testid="cota-${numero}"]`).click();
  cy.get('[data-testid="confirmar-reserva"]').click();
});

Then('a cota número {int} fica com status {string} para {string}', (numero: number, status: string, nomeComprador: string) => {
  cy.get(`[data-testid="cota-${numero}"]`).should('have.attr', 'data-status', status.toLowerCase());
});

Then('um cronômetro de {int} minutos é iniciado para essa reserva', (minutos: number) => {
  cy.get('[data-testid="cronometro-reserva"]').should('be.visible');
});

Then('{string} é redirecionada para a tela de pagamento', (nomeComprador: string) => {
  cy.url().should('include', '/pagamento');
});
