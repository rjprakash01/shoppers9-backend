// Test login with phone 1234567890
fetch('http://localhost:3000/api/auth/verify-otp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    phone: '1234567890',
    otp: '1234',
    name: 'Test User'
  })
})
.then(response => response.json())
.then(data => {
  console.log('Login response:', data);
  if (data.success && data.data.accessToken) {
    console.log('Setting auth token:', data.data.accessToken);
    localStorage.setItem('authToken', data.data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    console.log('Login successful! Now testing cart...');
    
    // Test cart API
    return fetch('http://localhost:3000/api/cart', {
      headers: {
        'Authorization': `Bearer ${data.data.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  }
})
.then(response => {
  if (response) {
    console.log('Cart API response status:', response.status);
    return response.json();
  }
})
.then(cartData => {
  if (cartData) {
    console.log('Cart data:', cartData);
  }
})
.catch(error => {
  console.error('Error:', error);
});