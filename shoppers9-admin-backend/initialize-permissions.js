const axios = require('axios');

async function initializePermissions() {
  try {
    console.log('🚀 Initializing Permissions System...');
    
    // First, get demo credentials and login as super admin
    console.log('\n1. Getting demo credentials...');
    const demoResponse = await axios.get('http://localhost:5003/api/auth/demo-credentials');
    const { email, password } = demoResponse.data.data.superAdmin;
    
    console.log('\n2. Logging in as Super Admin...');
    const loginResponse = await axios.post('http://localhost:5003/api/auth/login', {
      email: email,
      password: password
    });
    
    const token = loginResponse.data.data.accessToken;
    console.log('✅ Login successful');
    console.log('User ID:', loginResponse.data.data.user.id);
    console.log('User Role:', loginResponse.data.data.user.primaryRole);
    
    // Initialize permissions
    console.log('\n3. Initializing permissions...');
    try {
      const initPermResponse = await axios.post('http://localhost:5003/api/admin/permissions/initialize', {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Permissions initialized successfully');
      console.log('Response:', initPermResponse.data);
      
    } catch (permError) {
      console.error('❌ Permission initialization error:');
      if (permError.response) {
        console.error('Status:', permError.response.status);
        console.error('Data:', permError.response.data);
      } else {
        console.error('Error:', permError.message);
      }
    }
    
    // Initialize roles
    console.log('\n4. Initializing roles...');
    try {
      const initRolesResponse = await axios.post('http://localhost:5003/api/admin/roles/initialize', {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Roles initialized successfully');
      console.log('Response:', initRolesResponse.data);
      
    } catch (rolesError) {
      console.error('❌ Roles initialization error:');
      if (rolesError.response) {
        console.error('Status:', rolesError.response.status);
        console.error('Data:', rolesError.response.data);
      } else {
        console.error('Error:', rolesError.message);
      }
    }
    
    // Get all roles to find admin role ID
    console.log('\n5. Getting all roles...');
    try {
      const rolesResponse = await axios.get('http://localhost:5003/api/admin/roles', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Roles fetched successfully');
      const roles = rolesResponse.data.data;
      console.log('Available roles:', roles.map(r => ({ id: r._id, name: r.name, displayName: r.displayName })));
      
      // Find admin role
      const adminRole = roles.find(r => r.name === 'admin' || r.name === 'Admin');
      if (adminRole) {
        console.log('\n📋 Found admin role:', adminRole.name, 'ID:', adminRole._id);
        
        // Get all permissions
        const permissionsResponse = await axios.get('http://localhost:5003/api/admin/permissions', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const permissions = permissionsResponse.data.data;
        console.log('\n📊 Total permissions available:', permissions.length);
        
        // Filter permissions for admin role (exclude super admin only modules)
        const adminPermissions = permissions.filter(p => {
          // Give admin access to most modules except super admin specific ones
          const superAdminOnlyModules = ['admin_management', 'settings'];
          return !superAdminOnlyModules.includes(p.module);
        });
        
        console.log('📊 Permissions for admin role:', adminPermissions.length);
        
        // Assign permissions to admin role
        console.log('\n6. Assigning permissions to admin role...');
        const updateRoleResponse = await axios.put(`http://localhost:5003/api/admin/roles/${adminRole._id}/permissions`, {
          permissions: adminPermissions.map(p => p._id)
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ Admin role permissions updated successfully');
        console.log('Response:', updateRoleResponse.data);
        
      } else {
        console.log('❌ Admin role not found');
      }
      
    } catch (rolesError) {
      console.error('❌ Error working with roles:');
      if (rolesError.response) {
        console.error('Status:', rolesError.response.status);
        console.error('Data:', rolesError.response.data);
      } else {
        console.error('Error:', rolesError.message);
      }
    }
    
    // Test user permissions after initialization
    console.log('\n7. Testing user permissions after initialization...');
    
    // Login as regular admin to test
    const adminLoginResponse = await axios.post('http://localhost:5003/api/auth/login', {
      email: 'admin@shoppers9.com',
      password: 'Admin@123'
    });
    
    const adminToken = adminLoginResponse.data.data.accessToken;
    
    const userPermissionsResponse = await axios.get('http://localhost:5003/api/admin/user-permissions', {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Admin user permissions after initialization:');
    console.log('Permissions count:', userPermissionsResponse.data.data.length);
    if (userPermissionsResponse.data.data.length > 0) {
      console.log('Sample permissions:', userPermissionsResponse.data.data.slice(0, 5));
    }
    
  } catch (error) {
    console.error('❌ Error initializing permissions:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

initializePermissions();