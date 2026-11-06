const http = require('http');

async function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(body);
        } catch (e) {
          json = body;
        }
        resolve({ statusCode: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== STARTING FULL STACK MERN VERIFICATION ===\n');
  const testEmail = `tester_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  let authToken = '';
  let taskId1 = '';
  let taskId2 = '';

  // 1. Backend Health Check
  console.log('1. Testing Backend Health Check (GET /api/health)...');
  const healthRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/health',
    method: 'GET',
  });
  console.log(`   Status: ${healthRes.statusCode}, Response:`, healthRes.body);
  if (healthRes.statusCode !== 200) throw new Error('Health check failed');

  // 2. Register New User
  console.log('\n2. Testing User Registration (POST /api/auth/register)...');
  const registerRes = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { name: 'Alex Johnson', email: testEmail, password: testPassword }
  );
  console.log(`   Status: ${registerRes.statusCode}, User: ${registerRes.body.user?.email}`);
  if (registerRes.statusCode !== 201 || !registerRes.body.token) {
    throw new Error('Registration failed');
  }
  authToken = registerRes.body.token;

  // 3. User Login
  console.log('\n3. Testing User Login (POST /api/auth/login)...');
  const loginRes = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: testEmail, password: testPassword }
  );
  console.log(`   Status: ${loginRes.statusCode}, Token received: ${!!loginRes.body.token}`);
  if (loginRes.statusCode !== 200 || !loginRes.body.token) {
    throw new Error('Login failed');
  }

  // 4. Get Current User Profile
  console.log('\n4. Testing Protected Profile (GET /api/auth/me)...');
  const meRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/me',
    method: 'GET',
    headers: { Authorization: `Bearer ${authToken}` },
  });
  console.log(`   Status: ${meRes.statusCode}, Name: ${meRes.body.user?.name}`);
  if (meRes.statusCode !== 200) throw new Error('Auth me failed');

  // 5. Create Task 1 (Pending)
  console.log('\n5. Testing Task Creation (POST /api/tasks)...');
  const task1Res = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/tasks',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    },
    {
      title: 'Design high-converting landing page',
      description: 'Draft Figma components, color schemes, and responsive layout',
      status: 'pending',
    }
  );
  console.log(`   Status: ${task1Res.statusCode}, Created: "${task1Res.body.title}" (${task1Res.body.status})`);
  if (task1Res.statusCode !== 201) throw new Error('Task 1 creation failed');
  taskId1 = task1Res.body._id;

  // 6. Create Task 2 (In-Progress)
  console.log('\n6. Testing Second Task Creation (POST /api/tasks)...');
  const task2Res = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/tasks',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    },
    {
      title: 'Implement JWT authentication & bcrypt hashing',
      description: 'Add token issuance, route guards, and secure password checks',
      status: 'in-progress',
    }
  );
  console.log(`   Status: ${task2Res.statusCode}, Created: "${task2Res.body.title}" (${task2Res.body.status})`);
  if (task2Res.statusCode !== 201) throw new Error('Task 2 creation failed');
  taskId2 = task2Res.body._id;

  // 7. Get All Tasks
  console.log('\n7. Testing Fetch Tasks (GET /api/tasks)...');
  const listRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/tasks',
    method: 'GET',
    headers: { Authorization: `Bearer ${authToken}` },
  });
  console.log(`   Status: ${listRes.statusCode}, Retrieved count: ${listRes.body.length}`);
  if (listRes.statusCode !== 200 || listRes.body.length !== 2) throw new Error('Fetch tasks failed');

  // 8. Update Task Status (Simulating Drag & Drop to 'completed')
  console.log('\n8. Testing Drag-and-Drop Status Update (PUT /api/tasks/:id)...');
  const updateRes = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/tasks/${taskId1}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    },
    { status: 'completed' }
  );
  console.log(`   Status: ${updateRes.statusCode}, Updated status: ${updateRes.body.status}`);
  if (updateRes.statusCode !== 200 || updateRes.body.status !== 'completed') {
    throw new Error('Task update failed');
  }

  // 9. Delete Task
  console.log('\n9. Testing Task Deletion (DELETE /api/tasks/:id)...');
  const deleteRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: `/api/tasks/${taskId2}`,
    method: 'DELETE',
    headers: { Authorization: `Bearer ${authToken}` },
  });
  console.log(`   Status: ${deleteRes.statusCode}, Message: ${deleteRes.body.message}`);
  if (deleteRes.statusCode !== 200) throw new Error('Delete task failed');

  // 10. Verify remaining tasks count
  console.log('\n10. Verifying task count after deletion...');
  const afterDeleteRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/tasks',
    method: 'GET',
    headers: { Authorization: `Bearer ${authToken}` },
  });
  console.log(`    Status: ${afterDeleteRes.statusCode}, Remaining tasks: ${afterDeleteRes.body.length}`);
  if (afterDeleteRes.body.length !== 1) throw new Error('Remaining task count mismatch');

  // 11. Test Frontend Client Server
  console.log('\n11. Testing Frontend Client Server (GET http://127.0.0.1:5173/)...');
  const clientRes = await request({
    hostname: '127.0.0.1',
    port: 5173,
    path: '/',
    method: 'GET',
  });
  console.log(`    Status: ${clientRes.statusCode}, Content-Type: ${clientRes.headers['content-type']}`);
  const hasViteApp = typeof clientRes.body === 'string' && clientRes.body.includes('TaskFlow');
  console.log(`    Vite HTML contains "TaskFlow": ${hasViteApp}`);
  if (clientRes.statusCode !== 200 || !hasViteApp) {
    throw new Error('Frontend client HTML verification failed');
  }

  console.log('\n======================================================');
  console.log(' ALL END-TO-END TESTS PASSED SUCCESSFULLY! ');
  console.log('======================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
