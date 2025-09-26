// Comprehensive debug test for Filter Management
// Run this in the browser console on the Filter Management page

console.log('🧪 Starting comprehensive debug test...');

// Function to wait for a condition
function waitFor(condition, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const check = () => {
      if (condition()) {
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for condition'));
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });
}

// Function to simulate category selection
function selectCategory() {
  console.log('🎯 Looking for category dropdown...');
  const categorySelect = document.querySelector('select');
  
  if (!categorySelect) {
    console.log('❌ Category dropdown not found');
    return false;
  }
  
  console.log('✅ Found category dropdown');
  const options = Array.from(categorySelect.options);
  console.log('📋 Available options:', options.map(opt => ({ value: opt.value, text: opt.text })));
  
  // Find a category with an ID (not empty)
  const validOption = options.find(opt => opt.value && opt.value !== '' && opt.value !== 'Select a category');
  
  if (!validOption) {
    console.log('❌ No valid category options found');
    return false;
  }
  
  console.log('🎯 Selecting category:', validOption.value, validOption.text);
  categorySelect.value = validOption.value;
  
  // Trigger change event
  const changeEvent = new Event('change', { bubbles: true });
  categorySelect.dispatchEvent(changeEvent);
  
  console.log('✅ Category selection triggered');
  return true;
}

// Function to check React state
function checkReactState() {
  console.log('🔍 Checking React component state...');
  
  // Try to find React fiber node
  const filterManagementElement = document.querySelector('[data-testid="filter-management"]') || 
                                  document.querySelector('.filter-management') ||
                                  document.querySelector('div');
  
  if (filterManagementElement && filterManagementElement._reactInternalFiber) {
    console.log('✅ Found React fiber');
  } else if (filterManagementElement && filterManagementElement._reactInternals) {
    console.log('✅ Found React internals');
  } else {
    console.log('❌ Could not access React state directly');
  }
}

// Main test function
async function runTest() {
  try {
    console.log('🚀 Starting test sequence...');
    
    // Check if we're on the right page
    if (!window.location.pathname.includes('/filters')) {
      console.log('❌ Not on filter management page. Navigate to /filters first.');
      return;
    }
    
    console.log('✅ On filter management page');
    
    // Wait for page to load
    await waitFor(() => document.querySelector('select'), 3000);
    
    // Check React state
    checkReactState();
    
    // Select a category
    const categorySelected = selectCategory();
    
    if (categorySelected) {
      console.log('⏳ Waiting for API call and state update...');
      
      // Wait a bit for the API call to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check for available filters section
      const availableFiltersSection = document.querySelector('h3');
      if (availableFiltersSection && availableFiltersSection.textContent.includes('Available Filters')) {
        console.log('✅ Found Available Filters section');
        
        // Check for filter items
        const filterItems = document.querySelectorAll('[data-testid="filter-item"], .filter-item, .bg-gray-50');
        console.log('📊 Found filter items:', filterItems.length);
        
        if (filterItems.length > 0) {
          console.log('✅ Filters are being displayed!');
        } else {
          console.log('❌ No filter items found in the DOM');
        }
      } else {
        console.log('❌ Available Filters section not found');
      }
    }
    
    console.log('🏁 Test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
runTest();

// Also set up a listener for manual testing
console.log('💡 You can also manually select a category and watch the console for debug messages');
console.log('🔍 Look for messages starting with: 🚀, 🔄, ✅, ❌, 🔍, 📊, 🎨');