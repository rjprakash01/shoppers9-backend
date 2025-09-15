// Test the regex patterns to see why they're matching incorrectly

function testRegexPatterns() {
  const testCases = [
    { name: 'jeans', expected: 'JEANS' },
    { name: 'shirts', expected: 'Shirts' },
    { name: 'shoes', expected: 'SHOES' },
    { name: 'sandals', expected: 'SANDALS' },
    { name: 't-shirt', expected: 'T-SHIRT' }
  ];
  
  const categories = [
    { name: 'T-SHIRT', slug: 'men-clothing-t-shirt' },
    { name: 'JEANS', slug: 'men-clothing-jeans' },
    { name: 'Shirts', slug: 'men-clothing-shirts' },
    { name: 'SHOES', slug: 'men-footwear-shoes' },
    { name: 'SANDALS', slug: 'men-footwear-sandals' }
  ];
  
  console.log('=== REGEX PATTERN TESTING ===\n');
  
  testCases.forEach(testCase => {
    console.log(`--- Testing: ${testCase.name} ---`);
    
    const subsubcategoryName = testCase.name;
    const searchVariations = [
      subsubcategoryName,
      subsubcategoryName.replace('-', ' '),
      subsubcategoryName.replace('-', ''),
      subsubcategoryName.toUpperCase(),
      subsubcategoryName.toLowerCase()
    ];
    
    console.log(`Search variations: [${searchVariations.join(', ')}]`);
    
    // Test the regex pattern
    const regexPattern = `^(${searchVariations.join('|')})$`;
    console.log(`Regex pattern: ${regexPattern}`);
    
    const regex = new RegExp(regexPattern, 'i');
    
    console.log('Category matches:');
    categories.forEach(cat => {
      const nameMatch = regex.test(cat.name);
      const slugMatch = searchVariations.includes(cat.slug);
      
      if (nameMatch || slugMatch) {
        console.log(`  ✅ ${cat.name} (name: ${nameMatch}, slug: ${slugMatch})`);
      } else {
        console.log(`  ❌ ${cat.name} (name: ${nameMatch}, slug: ${slugMatch})`);
      }
    });
    
    console.log('');
  });
}

testRegexPatterns();