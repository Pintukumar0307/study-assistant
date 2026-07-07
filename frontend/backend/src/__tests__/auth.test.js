const request = require('supertest')
const mongoose = require('mongoose')
const app = require('../src/app')

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/study_test')
})

afterAll(async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.connection.close()
})

describe('Auth Routes', () => {
  const testUser = {
    name: 'Test User',
    email: `test_${Date.now()}@example.com`,
    password: 'password123',
  }

  let accessToken, refreshToken

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(testUser)
      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.user.email).toBe(testUser.email)
      expect(res.body.data.accessToken).toBeDefined()
      accessToken = res.body.data.accessToken
      refreshToken = res.body.data.refreshToken
    })

    it('should reject duplicate email', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(testUser)
      expect(res.status).toBe(409)
    })

    it('should reject invalid email', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({ ...testUser, email: 'bademail' })
      expect(res.status).toBe(400)
    })

    it('should reject short password', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({ ...testUser, email: 'new@test.com', password: '123' })
      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      })
      expect(res.status).toBe(200)
      expect(res.body.data.accessToken).toBeDefined()
    })

    it('should reject wrong password', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: testUser.email,
        password: 'wrongpassword',
      })
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/v1/auth/me', () => {
    it('should return current user with valid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
      expect(res.status).toBe(200)
      expect(res.body.data.user.email).toBe(testUser.email)
    })

    it('should reject without token', async () => {
      const res = await request(app).get('/api/v1/auth/me')
      expect(res.status).toBe(401)
    })
  })

  describe('POST /api/v1/auth/refresh', () => {
    it('should return new tokens', async () => {
      const res = await request(app).post('/api/v1/auth/refresh').send({ refreshToken })
      expect(res.status).toBe(200)
      expect(res.body.data.accessToken).toBeDefined()
    })
  })
})
