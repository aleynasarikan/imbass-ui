const axios = require('axios');

const API_URL = 'http://localhost:5002/api';

async function runTest() {
  console.log('🚀 Starting Smoke Test...');
  
  try {
    // 1. Health Check
    const health = await axios.get('http://localhost:5002/');
    console.log('✅ Health Check:', health.data);

    // 2. Login as Agency
    console.log('Attempting login as brand@agency.com...');
    const login = await axios.post(`${API_URL}/auth/login`, {
      email: 'brand@agency.com',
      password: 'password123'
    });
    console.log('✅ Agency Login successful');
    const token = login.data.accessToken;

    // 3. Get Roster
    console.log('Fetching roster...');
    const roster = await axios.get(`${API_URL}/agency/roster`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Get Roster successful, count:', roster.data.length);

    // 4. Create a Task
    console.log('Creating a task...');
    const task = await axios.post(`${API_URL}/agency/tasks`, {
      title: 'Smoke Test Task',
      description: 'Verifying Sprint 2 Task functionality'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Create Task successful:', task.data.title);

    console.log('🎉 Smoke Test Completed Successfully!');
  } catch (error) {
    console.error('❌ Smoke Test Failed:');
    if (error.response) {
      console.error(error.response.status, error.response.data);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

runTest();
