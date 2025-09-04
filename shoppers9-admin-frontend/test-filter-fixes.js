// Test script to verify filter fixes
// Run this in browser console on the product management page

console.log('🧪 Testing Filter Fixes');

// Test 1: Check if level 3 categories show filters
function testLevel3CategoryFilters() {
  console.log('\n🧪 Test 1: Level 3 Category Filters');
  
  // Look for level 3 categories in the dropdown
  const subSubCategorySelect = document.querySelector('select[value*="subSubCategory"]');
  if (subSubCategorySelect) {
    const options = subSubCategorySelect.querySelectorAll('option[value!=""]');
    console.log(`Found ${options.length} level 3 categories`);
    
    if (options.length > 0) {
      // Select the first level 3 category
      const firstOption = options[0];
      console.log(`Selecting level 3 category: ${firstOption.textContent}`);
      subSubCategorySelect.value = firstOption.value;
      subSubCategorySelect.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Wait and check for filters
      setTimeout(() => {
        const filterSection = document.querySelector('[class*="filter"]');
        const filterElements = document.querySelectorAll('[class*="filter"] input[type="checkbox"], [class*="filter"] select');
        console.log(`Filters found after selecting level 3 category: ${filterElements.length}`);
        
        if (filterElements.length === 0) {
          console.error('❌ No filters found for level 3 category');
        } else {
          console.log('✅ Filters found for level 3 category');
        }
      }, 1000);
    }
  } else {
    console.log('No level 3 category dropdown found');
  }
}

// Test 2: Check checkbox auto-selection issue
function testCheckboxAutoSelection() {
  console.log('\n🧪 Test 2: Checkbox Auto-Selection');
  
  setTimeout(() => {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    console.log(`Found ${checkboxes.length} checkboxes`);
    
    if (checkboxes.length > 0) {
      // Find checkboxes in the same filter group
      const firstCheckbox = checkboxes[0];
      const filterId = firstCheckbox.id ? firstCheckbox.id.split('-')[0] : null;
      
      if (filterId) {
        const sameFilterCheckboxes = Array.from(checkboxes).filter(cb => 
          cb.id && cb.id.startsWith(filterId + '-')
        );
        
        console.log(`Found ${sameFilterCheckboxes.length} checkboxes in same filter group`);
        
        if (sameFilterCheckboxes.length > 1) {
          // Count initially checked
          const initiallyChecked = sameFilterCheckboxes.filter(cb => cb.checked).length;
          console.log(`Initially checked: ${initiallyChecked}`);
          
          // Click the first unchecked checkbox
          const uncheckedBox = sameFilterCheckboxes.find(cb => !cb.checked);
          if (uncheckedBox) {
            console.log('Clicking checkbox:', uncheckedBox.id);
            uncheckedBox.click();
            
            setTimeout(() => {
              const nowChecked = sameFilterCheckboxes.filter(cb => cb.checked).length;
              console.log(`After click, checked: ${nowChecked}`);
              
              if (nowChecked === sameFilterCheckboxes.length) {
                console.error('❌ All checkboxes got selected (auto-selection bug)');
              } else {
                console.log('✅ Only selected checkbox is checked (bug fixed)');
              }
            }, 500);
          }
        }
      }
    }
  }, 2000);
}

// Run tests
testLevel3CategoryFilters();
testCheckboxAutoSelection();

console.log('\n🧪 Tests initiated. Check console for results.');