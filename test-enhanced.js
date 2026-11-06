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

async function runEnhancedTests() {
  console.log('=== STARTING ENHANCED TASKFLOW VERIFICATION ===\n');
  const testEmail = `enhanced_user_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  let token = '';
  let taskIdOverdue = '';
  let taskIdToEdit = '';
  let taskIdCompleted = '';

  // 1. Health check
  console.log('1. Checking Backend Health Check (GET /api/health)...');
  const health = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/health',
    method: 'GET',
  });
  console.log(`   Status: ${health.statusCode}, OK: ${health.body.status === 'ok'}`);
  if (health.statusCode !== 200) throw new Error('Health check failed');

  // 2. Register
  console.log('\n2. Registering User with Full Name (POST /api/auth/register)...');
  const reg = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { name: 'Sarah Connor', email: testEmail, password: testPassword }
  );
  console.log(`   Status: ${reg.statusCode}, Registered Name: "${reg.body.user?.name}"`);
  if (reg.statusCode !== 201 || !reg.body.token) throw new Error('Register failed');
  token = reg.body.token;

  // 3. Create Overdue Task with High Priority
  console.log('\n3. Creating Overdue Task with High Priority (POST /api/tasks)...');
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const task1 = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/tasks',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
    {
      title: 'Fix critical database indexing bottleneck',
      description: 'Analyze slow query logs and add compound indexes',
      status: 'pending',
      priority: 'high',
      dueDate: yesterday,
    }
  );
  console.log(
    `   Status: ${task1.statusCode}, Priority: "${task1.body.priority}", DueDate: "${task1.body.dueDate}"`
  );
  if (task1.statusCode !== 201 || task1.body.priority !== 'high' || !task1.body.dueDate) {
    throw new Error('Task 1 with priority & dueDate failed');
  }
  taskIdOverdue = task1.body._id;

  // 4. Create Second Task with Low Priority and Future Due Date
  console.log('\n4. Creating Future Task with Low Priority (POST /api/tasks)...');
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const task2 = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/tasks',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
    {
      title: 'Update branding guidelines and typography',
      description: 'Review dark/light color tokens and button radiuses',
      status: 'in-progress',
      priority: 'low',
      dueDate: nextWeek,
    }
  );
  console.log(
    `   Status: ${task2.statusCode}, Priority: "${task2.body.priority}", DueDate: "${task2.body.dueDate}"`
  );
  if (task2.statusCode !== 201 || task2.body.priority !== 'low') {
    throw new Error('Task 2 creation failed');
  }
  taskIdToEdit = task2.body._id;

  // 5. Create Third Task (Completed, Medium Priority)
  console.log('\n5. Creating Completed Task (POST /api/tasks)...');
  const task3 = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/tasks',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
    {
      title: 'Setup Vite React App with Recharts and DnD',
      description: 'Installed dependencies and configured bundler',
      status: 'completed',
      priority: 'medium',
    }
  );
  console.log(`   Status: ${task3.statusCode}, Status: "${task3.body.status}"`);
  if (task3.statusCode !== 201) throw new Error('Task 3 creation failed');
  taskIdCompleted = task3.body._id;

  // 6. Fetch All Tasks & Check Counts
  console.log('\n6. Fetching Tasks List for Dashboard & Recharts Donut (GET /api/tasks)...');
  const list = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/tasks',
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log(`   Status: ${list.statusCode}, Total tasks retrieved: ${list.body.length}`);
  const completedCount = list.body.filter((t) => t.status === 'completed').length;
  const inProgressCount = list.body.filter((t) => t.status === 'in-progress').length;
  const pendingCount = list.body.filter((t) => t.status === 'pending').length;
  console.log(
    `   Counts -> Completed: ${completedCount}, In-Progress: ${inProgressCount}, Pending: ${pendingCount}`
  );
  if (list.body.length !== 3 || completedCount !== 1 || inProgressCount !== 1 || pendingCount !== 1) {
    throw new Error('Task list counts mismatch');
  }

  // 7. Test Edit Task (PUT /api/tasks/:id)
  console.log('\n7. Testing Edit Task Option (PUT /api/tasks/:id)...');
  const editRes = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/tasks/${taskIdToEdit}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
    {
      title: 'Update branding guidelines (Revised Edition)',
      description: 'Added high-contrast dark theme mode tokens',
      priority: 'high',
      status: 'in-progress',
    }
  );
  console.log(
    `   Status: ${editRes.statusCode}, New Title: "${editRes.body.title}", Priority: "${editRes.body.priority}"`
  );
  if (
    editRes.statusCode !== 200 ||
    editRes.body.title !== 'Update branding guidelines (Revised Edition)' ||
    editRes.body.priority !== 'high'
  ) {
    throw new Error('Edit task failed');
  }

  // 8. Test Drag & Drop move to 'completed'
  console.log('\n8. Simulating Drag-and-Drop Column Move (PUT /api/tasks/:id)...');
  const moveRes = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/tasks/${taskIdToEdit}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
    { status: 'completed' }
  );
  console.log(`   Status: ${moveRes.statusCode}, New Status: "${moveRes.body.status}"`);
  if (moveRes.statusCode !== 200 || moveRes.body.status !== 'completed') {
    throw new Error('Move task failed');
  }

  // 9. Delete Task
  console.log('\n9. Testing Task Deletion (DELETE /api/tasks/:id)...');
  const delRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: `/api/tasks/${taskIdCompleted}`,
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log(`   Status: ${delRes.statusCode}, Deleted ID: ${delRes.body.id}`);
  if (delRes.statusCode !== 200) throw new Error('Delete task failed');

  // 10. Check Frontend Dev Server
  console.log('\n10. Checking Frontend Client Server (GET http://127.0.0.1:5173/)...');
  const clientCheck = await request({
    hostname: '127.0.0.1',
    port: 5173,
    path: '/',
    method: 'GET',
  });
  console.log(`    Status: ${clientCheck.statusCode}, Client is serving properly`);
  if (clientCheck.statusCode !== 200) throw new Error('Frontend client check failed');

  console.log('\n=============================================================');
  console.log(' ALL ENHANCED FEATURES TESTED AND VERIFIED SUCCESSFULLY! ');
  console.log('=============================================================\n');
}

runEnhancedTests().catch((err) => {
  console.error('\n❌ Enhanced verification failed:', err);
  process.exit(1);
});
