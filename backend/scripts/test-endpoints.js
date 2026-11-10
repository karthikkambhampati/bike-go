import { protect } from '../src/middleware/authMiddleware.js';
import { register, login, verifyOtp } from '../src/controllers/authController.js';
import jwt from 'jsonwebtoken';

/**
 * Direct handler and middleware unit tester for Karthik-BikeGo
 * Tests handlers, input validation, authentication, and error handling in-process
 */
const mockRes = () => {
  const res = {};
  res.statusCode = 200;
  res.headers = {};
  res.status = function(code) {
    this.statusCode = code;
    return this;
  };
  res.json = function(data) {
    this.body = data;
    return this;
  };
  res.setHeader = function(key, val) {
    this.headers[key] = val;
    return this;
  };
  return res;
};

const runTests = async () => {
  console.log('🧪 Running Karthik-BikeGo In-Process Security & Logic Verification...\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, name, details = '') => {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name} ${details}`);
      failed++;
    }
  };

  // Test 1: Auth protect middleware rejects request when token is missing
  console.log('[Test 1] Auth Middleware - Missing token rejection:');
  const req1 = { headers: {} };
  const res1 = mockRes();
  let nextCalled1 = false;
  await protect(req1, res1, () => { nextCalled1 = true; });
  assert(res1.statusCode === 401, 'Returns 401 Unauthorized');
  assert(!nextCalled1, 'Blocks execution and does not call next()');
  assert(res1.body.message.includes('no token provided'), 'Informative error message');
  console.log();

  // Test 2: Auth protect middleware rejects malformed token
  console.log('[Test 2] Auth Middleware - Malformed token rejection:');
  process.env.JWT_SECRET = 'test_secret_key_12345';
  const req2 = { headers: { authorization: 'Bearer invalid.token.value' } };
  const res2 = mockRes();
  let nextCalled2 = false;
  await protect(req2, res2, () => { nextCalled2 = true; });
  assert(res2.statusCode === 401, 'Returns 401 for invalid signature');
  assert(!nextCalled2, 'Blocks execution on failed signature');
  console.log();

  // Test 3: Auth protect middleware rejects expired token
  console.log('[Test 3] Auth Middleware - Expired token rejection:');
  const expiredToken = jwt.sign({ userId: 'mockUserId123' }, process.env.JWT_SECRET, { expiresIn: '-1s' });
  const req3 = { headers: { authorization: `Bearer ${expiredToken}` } };
  const res3 = mockRes();
  await protect(req3, res3, () => {});
  assert(res3.statusCode === 401, 'Returns 401 for expired token');
  assert(res3.body.message.includes('Session expired'), 'Identifies session expiration');
  console.log();

  // Test 4: Register validation rejects empty input
  console.log('[Test 4] Auth Controller - Register validation:');
  const req4 = { body: { username: '', email: '', password: '', phone: '' } };
  const res4 = mockRes();
  await register(req4, res4);
  assert(res4.statusCode === 400, 'Returns 400 when fields are missing');
  console.log();

  // Test 5: Login validation rejects missing credentials
  console.log('[Test 5] Auth Controller - Login validation:');
  const req5 = { body: { username: 'testuser' } }; // missing password
  const res5 = mockRes();
  await login(req5, res5);
  assert(res5.statusCode === 400, 'Returns 400 when password omitted');
  console.log();

  // Test 6: Verify OTP rejects missing OTP
  console.log('[Test 6] Auth Controller - Verify OTP validation:');
  const req6 = { body: { email: 'test@example.com' } }; // missing otp
  const res6 = mockRes();
  await verifyOtp(req6, res6);
  assert(res6.statusCode === 400, 'Returns 400 when OTP omitted');
  console.log();

  console.log('----------------------------------------------------');
  console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('----------------------------------------------------');

  process.exit(failed > 0 ? 1 : 0);
};

runTests();
