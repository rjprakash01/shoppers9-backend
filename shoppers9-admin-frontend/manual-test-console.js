// Manual test script for Filter Management debugging
// Copy and paste this into the browser console on the Filter Management page

console.log('🧪 Manual Filter Management Test Started');
console.log('📍 Current URL:', window.location.href);

// Check if we're on the right page
if (!window.location.pathname.includes('/filters')) {
  console.log('❌ Please navigate to the Filter Management page (/filters) first');
} else {
  console.log('✅ On Filter Management page');
  
  // Find the category dropdown
  const categorySelect = document.querySelector('select');
  if (categorySelect) {
    console.log('✅ Found category dropdown');
    
    // List all available options
    const options = Array.from(categorySelect.options);
    console.log('📋 Available category options:');
    options.forEach((option, index) => {
      console.log(`  ${index}: value="${option.value}" text="${option.text}"`);
    });
    
    // Find the first valid option (not empty, not "Select a category")
    const validOptions = options.filter(opt => 
      opt.value && 
      opt.value !== '' && 
      opt.value !== 'Select a category' &&
      !opt.text.includes('Select')
    );
    
    if (validOptions.length > 0) {
      console.log('🎯 Valid options found:', validOptions.length);
      console.log('🎯 Will select:', validOptions[0].value, '-', validOptions[0].text);
      
      // Function to select category and trigger change
      window.testCategorySelection = function(optionIndex = 0) {
        if (optionIndex >= validOptions.length) {
          console.log('❌ Invalid option index');
          return;
        }
        
        const option = validOptions[optionIndex];
        console.log(`🎯 Selecting category: ${option.value} - ${option.text}`);
        
        categorySelect.value = option.value;
        
        // Trigger change event
        const changeEvent = new Event('change', { bubbles: true });
        categorySelect.dispatchEvent(changeEvent);
        
        console.log('✅ Change event dispatched');
        console.log('⏳ Watch for debug messages with emojis: 🚀, 🔄, ✅, ❌, 🔍, 📊, 🎨');
        
        // Set up a timer to check results
        setTimeout(() => {
          console.log('🔍 Checking results after 3 seconds...');
          
          // Check for available filters in the DOM
          const availableFiltersSection = document.querySelector('h3');
          if (availableFiltersSection && availableFiltersSection.textContent.includes('Available Filters')) {
            console.log('✅ Found Available Filters section');
            
            // Look for filter items
            const filterItems = document.querySelectorAll('.flex.items-center.justify-between.p-3');
            console.log('📊 Filter items found in DOM:', filterItems.length);
            
            if (filterItems.length > 0) {
              console.log('🎉 SUCCESS: Filters are being displayed!');
              filterItems.forEach((item, index) => {
                const filterName = item.querySelector('.font-medium')?.textContent;
                console.log(`  Filter ${index + 1}: ${filterName}`);
              });
            } else {
              console.log('❌ No filter items found in DOM');
              
              // Check if it's showing the "all assigned" message
              const noFiltersMessage = document.querySelector('.text-center.py-8');
              if (noFiltersMessage) {
                console.log('ℹ️ Showing message:', noFiltersMessage.textContent.trim());
              }
            }
          } else {
            console.log('❌ Available Filters section not found');
          }
        }, 3000);
      };
      
      console.log('💡 To test, run: testCategorySelection()');
      console.log('💡 Or test different categories: testCategorySelection(1), testCategorySelection(2), etc.');
      
    } else {
      console.log('❌ No valid category options found');
    }
    
  } else {
    console.log('❌ Category dropdown not found');
  }
}

console.log('🏁 Manual test setup complete');