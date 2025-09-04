// Check authentication status
console.log('Auth token:', localStorage.getItem('authToken'));
console.log('User data:', localStorage.getItem('user'));
console.log('Cart data:', localStorage.getItem('cart'));

// Test API call
fetch('http://localhost:3000/api/cart', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('Cart API response status:', response.status);
  return response.json();
})
.then(data => {
  console.log('Cart API response data:', data);
})
.catch(error => {
  console.error('Cart API error:', error);
});