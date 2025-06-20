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

vi.mock('../../../controllers/auth.refresh.controller.js', () => ({
  default: vi.fn((req, res) => res.status(200).json({ success: true })),
}));

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

  test('POST /auth/register should call register controller', async () => {
    const registerController = await import('../../../controllers/auth.register.controller.js');

    const requestData = {
      username: chance.word(),
      email: chance.email(),
      password: chance.string(),
    };

    const response = await request(app)
      .post('/auth/register')
      .send(requestData)
      .expect(200);

    expect(registerController.default).toHaveBeenCalled();
    expect(response.body).toEqual({ success: true });
  });

  test('POST /auth/login should call login controller', async () => {
    const loginController = await import('../../../controllers/auth.login.controller.js');

    const requestData = {
      username: chance.word(),
      password: chance.string(),
    };

    const response = await request(app)
      .post('/auth/login')
      .send(requestData)
      .expect(200);

    expect(loginController.default).toHaveBeenCalled();
    expect(response.body).toEqual({ success: true });
  });

  test('POST /auth/forgot-username should call forgot username controller', async () => {
    const forgotUsernameController = await import('../../../controllers/auth.forgotusername.controller.js');

    const requestData = {
      email: chance.email(),
    };

    const response = await request(app)
      .post('/auth/forgot-username')
      .send(requestData)
      .expect(200);

    expect(forgotUsernameController.default).toHaveBeenCalled();
    expect(response.body).toEqual({ success: true });
  });

  test('POST /auth/forgot-password should call forgot password controller', async () => {
    const forgotPasswordController = await import('../../../controllers/auth.forgotpassword.controller.js');

    const requestData = {
      username: chance.word(),
    };

    const response = await request(app)
      .post('/auth/forgot-password')
      .send(requestData)
      .expect(200);

    expect(forgotPasswordController.default).toHaveBeenCalled();
    expect(response.body).toEqual({ success: true });
  });

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

  test('POST /auth/refresh should call refresh controller', async () => {
    const refreshController = await import('../../../controllers/auth.refresh.controller.js');

    const requestData = {
      refreshToken: chance.string(),
    };

    const response = await request(app)
      .post('/auth/refresh')
      .send(requestData)
      .expect(200);

    expect(refreshController.default).toHaveBeenCalled();
    expect(response.body).toEqual({ success: true });
  });
});
