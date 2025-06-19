import {
  describe, test, expect, beforeEach, vi,
} from 'vitest';
import express from 'express';
import request from 'supertest';
import Chance from 'chance';

const chance = new Chance();

// Mock all controllers
vi.mock('../../../controllers/auth.register.controller.js', () => ({
  default: vi.fn((req, res) => res.status(200).json({ success: true })),
}));

vi.mock('../../../controllers/auth.login.controller.js', () => ({
  default: vi.fn((req, res) => res.status(200).json({ success: true })),
}));

vi.mock('../../../controllers/auth.forgotusername.controller.js', () => ({
  default: vi.fn((req, res) => res.status(200).json({ success: true })),
}));

vi.mock('../../../controllers/auth.forgotpassword.controller.js', () => ({
  default: vi.fn((req, res) => res.status(200).json({ success: true })),
}));

vi.mock('../../../controllers/auth.changepassword.controller.js', () => ({
  default: vi.fn((req, res) => res.status(200).json({ success: true })),
}));

// Dynamic import inside describe block
describe('Auth Routes', () => {
  let app;
  let authRoutes;

  beforeEach(async () => {
    const { default: routes } = await import('../../../routes/auth.routes.js');
    authRoutes = routes;

    app = express();
    app.use(express.json());
    app.use('/auth', authRoutes);

    vi.clearAllMocks();
  });

  // ... existing tests ...

  test('POST /auth/change-password should call change password controller', async () => {
    const changePasswordController = await import('../../../controllers/auth.changepassword.controller.js');

    const requestData = {
      resetCode: chance.string(),
      newPassword: chance.string(),
      username: chance.word(),
    };

    const response = await request(app)
      .post('/auth/change-password')
      .send(requestData)
      .expect(200);

    expect(changePasswordController.default).toHaveBeenCalled();
    expect(response.body).toEqual({ success: true });
  });
});
