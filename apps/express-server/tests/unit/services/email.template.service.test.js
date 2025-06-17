import {
  describe, test, expect, vi,
} from 'vitest';
import Chance from 'chance';

const chance = new Chance();

// Mock the template file
vi.mock('../../../services/email/templates/forgotusername.js', () => ({
  default: {
    subject: 'Test Subject {{username}}',
    html: '<p>Hello {{username}}, you baboon!</p>',
  },
}));

vi.mock('../../../services/email/templates/nonexistent.js', () => {
  throw new Error('Module not found');
});

// Import the service after mocking
const { getTemplate } = await import('../../../services/email/email.template.service.js');

describe('EmailTemplateService', () => {
  test('should export getTemplate function', () => {
    expect(typeof getTemplate).toBe('function');
  });

  test('should load template and replace variables', async () => {
    const username = chance.word();
    const variables = { username };

    const result = await getTemplate('forgotusername', variables);

    expect(result.subject).toBe(`Test Subject ${username}`);
    expect(result.html).toBe(`<p>Hello ${username}, you baboon!</p>`);
  });

  test('should load template without variables', async () => {
    const result = await getTemplate('forgotusername');

    expect(result.subject).toBe('Test Subject {{username}}');
    expect(result.html).toBe('<p>Hello {{username}}, you baboon!</p>');
  });

  test('should throw error for non-existent template', async () => {
    await expect(
      getTemplate('nonexistent'),
    ).rejects.toThrow("Template 'nonexistent' not found");
  });

  test('should handle template with no variables to replace', async () => {
    const result = await getTemplate('forgotusername', {
      someOtherVar: chance.word(),
    });

    expect(result.subject).toBe('Test Subject {{username}}');
    expect(result.html).toBe('<p>Hello {{username}}, you baboon!</p>');
  });

  test('should handle empty variables object', async () => {
    const result = await getTemplate('forgotusername', {});

    expect(result.subject).toBe('Test Subject {{username}}');
    expect(result.html).toBe('<p>Hello {{username}}, you baboon!</p>');
  });
});
