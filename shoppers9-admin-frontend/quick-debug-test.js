// Quick debug test - paste this in browser console
console.log('🧪 Quick Debug Test Started');

// Check current page
if (!window.location.pathname.includes('/filters')) {
  console.log('❌ Navigate to /filters page first');
} else {
  console.log('✅ On filters page');
  
  // Find and trigger category selection
  const select = document.querySelector('select');
  if (select) {
    console.log('✅ Found select element');
    console.log('📋 Current value:', select.value);
    console.log('📋 Available options:', Array.from(select.options).map(o => ({value: o.value, text: o.text})));
    
    // If no category is selected, select the first valid one
    if (!select.value || select.value === '') {
      const validOption = Array.from(select.options).find(o => o.value && o.value !== '' && !o.text.includes('Select'));
      if (validOption) {
        console.log('🎯 Auto-selecting:', validOption.value, validOption.text);
        select.value = validOption.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } else {
      console.log('ℹ️ Category already selected, triggering change event');
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    // Wait and check results
    setTimeout(() => {
      console.log('🔍 Checking results after 2 seconds...');
      const availableSection = document.querySelector('h3');
      if (availableSection && availableSection.textContent.includes('Available Filters')) {
        const parent = availableSection.closest('div');
        const message = parent.querySelector('.text-center');
        if (message) {
          console.log('📝 Message shown:', message.textContent.trim());
        }
        const filterItems = parent.querySelectorAll('.flex.items-center.justify-between');
        console.log('📊 Filter items found:', filterItems.length);
      }
    }, 2000);
    
  } else {
    console.log('❌ Select element not found');
  }
}

console.log('👀 Watch for debug messages with emojis: 🚀, 🔄, ✅, ❌, 🔍, 📊, 🎨');