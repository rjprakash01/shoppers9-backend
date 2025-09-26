const axios = require('axios');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your-super-secret-jwt-key-for-admin-backend';

async function checkAssignmentStatus() {
  try {
    console.log('🔍 Checking Filter Assignment Status...');
    
    // Create JWT token
    const token = jwt.sign(
      { 
        id: '68ca49d2922b49ad4f20395e',
        email: 'superadmin@shoppers9.com',
        primaryRole: 'super_admin'
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Fetch categories first
    const categoriesResponse = await axios.get('http://localhost:5001/api/admin/categories', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const menCategory = categoriesResponse.data.data.categories.find(cat => cat.name === 'Men');
    if (!menCategory) {
      console.log('❌ Men category not found');
      return;
    }

    const categoryId = menCategory._id || menCategory.id;
    console.log(`📂 Found Men category: ${categoryId}`);

    // Fetch filter assignments with status parameter
    console.log('\n🔍 Checking ALL assignments (including inactive):');
    const allAssignmentsResponse = await axios.get(
      `http://localhost:5001/api/admin/categories/${categoryId}/filter-assignments`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('All assignments count:', allAssignmentsResponse.data.data.assignments.length);
    allAssignmentsResponse.data.data.assignments.forEach((assignment, index) => {
      console.log(`${index + 1}. ${assignment.filter.displayName || assignment.filter.name}`);
      console.log(`   Assignment Active: ${assignment.isActive}`);
      console.log(`   Filter Active: ${assignment.filter.isActive}`);
      console.log(`   Assignment ID: ${assignment._id}`);
      console.log('');
    });

    // Fetch only active assignments
    console.log('\n🔍 Checking ACTIVE assignments only:');
    const activeAssignmentsResponse = await axios.get(
      `http://localhost:5001/api/admin/categories/${categoryId}/filter-assignments?status=active`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('Active assignments count:', activeAssignmentsResponse.data.data.assignments.length);
    activeAssignmentsResponse.data.data.assignments.forEach((assignment, index) => {
      console.log(`${index + 1}. ${assignment.filter.displayName || assignment.filter.name}`);
      console.log(`   Assignment Active: ${assignment.isActive}`);
      console.log(`   Filter Active: ${assignment.filter.isActive}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

checkAssignmentStatus();