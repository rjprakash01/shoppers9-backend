/**
 * Comprehensive Filter Options Verification Script
 * Run this in browser console on the admin panel to test filter options
 */

// Test 1: Check if we can access the filters page
console.log('=== Filter Options Verification Test ===');

// Function to test API endpoints directly
async function testFilterOptionsAPI() {
    try {
        console.log('Testing filter options API endpoints...');
        
        // Get auth token from localStorage
        const token = localStorage.getItem('adminToken');
        if (!token) {
            console.error('❌ No admin token found. Please login first.');
            return;
        }
        
        console.log('✅ Admin token found');
        
        // Test 1: Get all filters
        console.log('\n1. Testing GET /api/admin/filters');
        const filtersResponse = await fetch('/api/admin/filters', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (filtersResponse.ok) {
            const filtersData = await filtersResponse.json();
            console.log('✅ Filters API working:', filtersData);
            
            if (filtersData.data && filtersData.data.length > 0) {
                const firstFilter = filtersData.data[0];
                console.log('📋 First filter:', firstFilter);
                
                // Test 2: Get filter options for the first filter
                console.log(`\n2. Testing GET /api/admin/filter-options/filter/${firstFilter._id}`);
                const optionsResponse = await fetch(`/api/admin/filter-options/filter/${firstFilter._id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (optionsResponse.ok) {
                    const optionsData = await optionsResponse.json();
                    console.log('✅ Filter options API working:', optionsData);
                    
                    if (optionsData.success && optionsData.data && optionsData.data.options) {
                        console.log(`📊 Found ${optionsData.data.options.length} filter options`);
                        optionsData.data.options.forEach((option, index) => {
                            console.log(`   ${index + 1}. ${option.displayValue} (${option.value}) - Active: ${option.isActive}`);
                        });
                    } else if (Array.isArray(optionsData.data)) {
                        console.log(`📊 Found ${optionsData.data.length} filter options (array format)`);
                        optionsData.data.forEach((option, index) => {
                            console.log(`   ${index + 1}. ${option.displayValue} (${option.value}) - Active: ${option.isActive}`);
                        });
                    } else {
                        console.log('⚠️ No filter options found or unexpected format');
                    }
                } else {
                    console.error('❌ Filter options API failed:', optionsResponse.status, await optionsResponse.text());
                }
                
                // Test 3: Test creating a new filter option
                console.log('\n3. Testing POST /api/admin/filter-options (create new option)');
                const testOption = {
                    filter: firstFilter._id,
                    value: 'test-option-' + Date.now(),
                    displayValue: 'Test Option ' + new Date().toLocaleTimeString(),
                    colorCode: '#FF5733',
                    isActive: true,
                    sortOrder: 999
                };
                
                const createResponse = await fetch('/api/admin/filter-options', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(testOption)
                });
                
                if (createResponse.ok) {
                    const createData = await createResponse.json();
                    console.log('✅ Filter option created successfully:', createData);
                    
                    // Test 4: Verify the option appears in the list
                    console.log('\n4. Verifying new option appears in list');
                    const verifyResponse = await fetch(`/api/admin/filter-options/filter/${firstFilter._id}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (verifyResponse.ok) {
                        const verifyData = await verifyResponse.json();
                        const options = verifyData.success ? verifyData.data.options : verifyData.data;
                        const newOption = options.find(opt => opt.value === testOption.value);
                        
                        if (newOption) {
                            console.log('✅ New option found in list:', newOption);
                        } else {
                            console.log('❌ New option not found in list');
                        }
                    }
                } else {
                    console.error('❌ Failed to create filter option:', createResponse.status, await createResponse.text());
                }
            } else {
                console.log('⚠️ No filters found. Create some filters first.');
            }
        } else {
            console.error('❌ Filters API failed:', filtersResponse.status, await filtersResponse.text());
        }
        
    } catch (error) {
        console.error('❌ Test failed with error:', error);
    }
}

// Function to test UI navigation
function testUINavigation() {
    console.log('\n=== UI Navigation Test ===');
    
    // Check if we're on the admin panel
    if (!window.location.href.includes('localhost:5173')) {
        console.log('❌ Please run this test on http://localhost:5173');
        return;
    }
    
    // Check if filters page is accessible
    console.log('1. Testing navigation to filters page...');
    if (window.location.pathname !== '/filters') {
        console.log('   Navigating to /filters...');
        window.location.href = '/filters';
        return;
    }
    
    // Check if filter management component is loaded
    setTimeout(() => {
        const filterTable = document.querySelector('table');
        const manageButtons = document.querySelectorAll('button[title*="Manage"], button:contains("Manage")');
        
        if (filterTable) {
            console.log('✅ Filter table found');
        } else {
            console.log('❌ Filter table not found');
        }
        
        if (manageButtons.length > 0) {
            console.log(`✅ Found ${manageButtons.length} manage buttons`);
            console.log('   Click any "Manage" button to test filter options page');
        } else {
            console.log('❌ No manage buttons found');
        }
    }, 1000);
}

// Run the tests
console.log('Starting filter options verification...');
console.log('\nTo run API tests, execute: testFilterOptionsAPI()');
console.log('To run UI tests, execute: testUINavigation()');

// Auto-run API test if we have a token
if (typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('adminToken')) {
    testFilterOptionsAPI();
} else {
    console.log('\n⚠️ Please login to the admin panel first, then run: testFilterOptionsAPI()');
}

// Make functions available globally
if (typeof window !== 'undefined') {
    window.testFilterOptionsAPI = testFilterOptionsAPI;
    window.testUINavigation = testUINavigation;
}