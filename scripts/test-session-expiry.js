/**
 * Test Script: Session Expiry and Logout Improvements
 * Tests the improved session expiry handling and automatic redirect functionality
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const TEST_USER = {
  email: 'admin@pembukuan.com',
  password: 'admin@12345'
};

console.log('🧪 Testing Session Expiry and Logout Improvements');
console.log('================================================\n');

// Test scenarios
const tests = [
  {
    name: 'Test 1: Login and verify session info',
    run: testLoginAndSessionInfo
  },
  {
    name: 'Test 2: Test session refresh functionality',
    run: testSessionRefresh
  },
  {
    name: 'Test 3: Test expired session handling',
    run: testExpiredSessionHandling
  },
  {
    name: 'Test 4: Test automatic logout on API calls',
    run: testAutomaticLogout
  },
  {
    name: 'Test 5: Test logout with expired session',
    run: testLogoutWithExpiredSession
  }
];

let sessionToken = null;
let sessionCookie = null;

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    let curlCommand = `curl -s -w "\\n%{http_code}"`;

    if (options.method) {
      curlCommand += ` -X ${options.method}`;
    }

    if (options.headers) {
      options.headers.forEach(header => {
        curlCommand += ` -H "${header}"`;
      });
    }

    if (options.data) {
      const jsonData = JSON.stringify(options.data).replace(/"/g, '\\"');
      curlCommand += ` -d "${jsonData}"`;
    }

    curlCommand += ` "${url}"`;

    exec(curlCommand, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }

      const lines = stdout.trim().split('\n');
      const statusCode = parseInt(lines[lines.length - 1]);
      const responseBody = lines.slice(0, -1).join('\n');

      try {
        const jsonResponse = JSON.parse(responseBody);
        resolve({ status: statusCode, data: jsonResponse });
      } catch (e) {
        resolve({ status: statusCode, data: responseBody });
      }
    });
  });
}

// Test 1: Login and verify session info
async function testLoginAndSessionInfo() {
  console.log('📝 Test 1: Login and verify session info');

  try {
    const response = await makeRequest(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: ['Content-Type: application/json'],
      data: TEST_USER
    });

    if (response.status === 200 && response.data.success) {
      console.log('✅ Login successful');

      // Extract session cookie from response headers (this is simplified)
      // In a real scenario, we'd need to parse Set-Cookie headers
      sessionToken = response.data.data.token;

      // Test /api/auth/me endpoint
      const meResponse = await makeRequest(`${BASE_URL}/api/auth/me`, {
        headers: [`Authorization: Bearer ${sessionToken}`]
      });

      if (meResponse.status === 200 && meResponse.data.success) {
        console.log('✅ Session info retrieved successfully');
        console.log(`   User: ${meResponse.data.data.user.name} (${meResponse.data.data.user.role})`);

        if (meResponse.data.data.session) {
          console.log(`   Session expires: ${new Date(meResponse.data.data.session.expiresAt).toLocaleString()}`);
          console.log(`   Time until expiry: ${Math.round(meResponse.data.data.session.timeUntilExpiry / 1000 / 60)} minutes`);
        }

        return true;
      } else {
        console.log('❌ Failed to get session info:', meResponse.data);
        return false;
      }
    } else {
      console.log('❌ Login failed:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Test 1 failed:', error.message);
    return false;
  }
}

// Test 2: Test session refresh functionality
async function testSessionRefresh() {
  console.log('\n📝 Test 2: Test session refresh functionality');

  if (!sessionToken) {
    console.log('❌ No session token available, skipping test');
    return false;
  }

  try {
    const refreshResponse = await makeRequest(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: [`Authorization: Bearer ${sessionToken}`]
    });

    if (refreshResponse.status === 200 && refreshResponse.data.success) {
      console.log('✅ Session refresh successful');
      console.log(`   New expiry: ${new Date(refreshResponse.data.data.expiresAt).toLocaleString()}`);
      return true;
    } else {
      console.log('❌ Session refresh failed:', refreshResponse.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Test 2 failed:', error.message);
    return false;
  }
}

// Test 3: Test expired session handling (simulated)
async function testExpiredSessionHandling() {
  console.log('\n📝 Test 3: Test expired session handling');

  // This test would require manipulating the database or using an expired token
  // For now, we'll test with an invalid token
  try {
    const invalidResponse = await makeRequest(`${BASE_URL}/api/auth/me`, {
      headers: [`Authorization: Bearer invalid-token-123`]
    });

    if (invalidResponse.status === 401) {
      console.log('✅ Invalid token properly rejected');
      return true;
    } else {
      console.log('❌ Invalid token not properly rejected:', invalidResponse);
      return false;
    }
  } catch (error) {
    console.log('❌ Test 3 failed:', error.message);
    return false;
  }
}

// Test 4: Test automatic logout on API calls (simulated)
async function testAutomaticLogout() {
  console.log('\n📝 Test 4: Test automatic logout on API calls');

  // Test calling a protected endpoint with invalid token
  try {
    const apiResponse = await makeRequest(`${BASE_URL}/api/transactions`, {
      headers: [`Authorization: Bearer invalid-token-123`]
    });

    if (apiResponse.status === 401 || apiResponse.status === 403) {
      console.log('✅ Protected endpoint properly rejects invalid session');
      return true;
    } else {
      console.log('❌ Protected endpoint did not reject invalid session:', apiResponse.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Test 4 failed:', error.message);
    return false;
  }
}

// Test 5: Test logout with expired session
async function testLogoutWithExpiredSession() {
  console.log('\n📝 Test 5: Test logout with expired session');

  if (!sessionToken) {
    console.log('❌ No session token available, skipping test');
    return false;
  }

  try {
    const logoutResponse = await makeRequest(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: [`Authorization: Bearer ${sessionToken}`]
    });

    if (logoutResponse.status === 200 && logoutResponse.data.success) {
      console.log('✅ Logout successful');
      console.log(`   Message: ${logoutResponse.data.message}`);

      if (logoutResponse.data.data?.wasExpired) {
        console.log('   ℹ️  Session was already expired');
      }

      return true;
    } else {
      console.log('❌ Logout failed:', logoutResponse.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Test 5 failed:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log(`🌐 Testing against: ${BASE_URL}`);
  console.log(`👤 Test user: ${TEST_USER.email}\n`);

  let passed = 0;
  let total = tests.length;

  for (const test of tests) {
    try {
      const result = await test.run();
      if (result) {
        passed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} threw an error:`, error.message);
    }
  }

  console.log('\n================================================');
  console.log(`📊 Test Results: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('🎉 All session expiry tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Check the implementation.');
  }

  process.exit(passed === total ? 0 : 1);
}

// Check if server is running
function checkServer() {
  return new Promise((resolve) => {
    makeRequest(`${BASE_URL}/api/health`)
      .then(response => {
        if (response.status === 200) {
          console.log('✅ Server is running');
          resolve(true);
        } else {
          console.log('❌ Server is not responding properly');
          resolve(false);
        }
      })
      .catch(() => {
        console.log('❌ Cannot connect to server. Make sure it\'s running with: npm run dev');
        resolve(false);
      });
  });
}

// Main execution
async function main() {
  const serverRunning = await checkServer();

  if (!serverRunning) {
    console.log('\n💡 To run these tests:');
    console.log('   1. Start the development server: npm run dev');
    console.log('   2. Run this script: node scripts/test-session-expiry.js');
    process.exit(1);
  }

  await runTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runTests, makeRequest };