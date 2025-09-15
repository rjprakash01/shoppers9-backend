const axios = require('axios');

// Test coupon application with proper authentication
async function testCouponWithAuth() {
  const baseURL = 'http://localhost:5002/api';
  
  console.log('🔐 TESTING COUPON APPLICATION WITH AUTHENTICATION');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Test login to get a valid token
    console.log('\n1. 📱 Testing user login...');
    try {
      // First, let's try to send OTP (this might fail but shows the flow)
      const phoneNumber = '1234567890';
      console.log(`Attempting to send OTP to ${phoneNumber}...`);
      
      try {
        const otpResponse = await axios.post(`${baseURL}/auth/send-otp`, {
          phone: phoneNumber
        });
        console.log('✅ OTP sent successfully');
        console.log('Response:', otpResponse.data.message);
      } catch (otpError) {
        console.log('⚠️  OTP sending failed (expected in test environment)');
        console.log('Error:', otpError.response?.data?.message || otpError.message);
      }
      
      // Try to verify with a test OTP
      console.log('\nTrying to verify with test OTP...');
      try {
        const verifyResponse = await axios.post(`${baseURL}/auth/verify-otp`, {
          phone: phoneNumber,
          otp: '123456' // Test OTP
        });
        
        if (verifyResponse.data.success) {
          const token = verifyResponse.data.data.token;
          console.log('✅ Login successful!');
          console.log('Token received:', token.substring(0, 20) + '...');
          
          // Step 2: Test coupon application with valid token
          console.log('\n2. 🎫 Testing coupon application with token...');
          try {
            const couponResponse = await axios.post(`${baseURL}/coupons/apply`, {
              code: 'SAVE20'
            }, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            console.log('✅ Coupon applied successfully!');
            console.log('Discount:', couponResponse.data.data.discount);
            console.log('Final Amount:', couponResponse.data.data.finalAmount);
            
          } catch (couponError) {
            console.log('❌ Coupon application failed');
            console.log('Status:', couponError.response?.status);
            console.log('Error:', couponError.response?.data?.message || couponError.message);
          }
          
        } else {
          console.log('❌ Login failed');
          console.log('Response:', verifyResponse.data.message);
        }
        
      } catch (verifyError) {
        console.log('❌ OTP verification failed');
        console.log('Status:', verifyError.response?.status);
        console.log('Error:', verifyError.response?.data?.message || verifyError.message);
      }
      
    } catch (loginError) {
      console.log('❌ Login process failed');
      console.log('Error:', loginError.message);
    }
    
    // Step 3: Test what happens without authentication
    console.log('\n3. 🚫 Testing coupon application without authentication...');
    try {
      const noAuthResponse = await axios.post(`${baseURL}/coupons/apply`, {
        code: 'SAVE20'
      });
      console.log('⚠️  Unexpected success without auth');
    } catch (noAuthError) {
      console.log('✅ Correctly rejected without authentication');
      console.log('Status:', noAuthError.response?.status);
      console.log('Message:', noAuthError.response?.data?.message);
    }
    
    // Step 4: Check if there are any existing users we can test with
    console.log('\n4. 👥 Checking user authentication endpoints...');
    const authEndpoints = [
      '/auth/me',
      '/auth/send-otp',
      '/auth/verify-otp'
    ];
    
    for (const endpoint of authEndpoints) {
      try {
        await axios.get(`${baseURL}${endpoint}`);
        console.log(`✅ ${endpoint} - Accessible`);
      } catch (error) {
        if (error.response?.status === 401) {
          console.log(`🔐 ${endpoint} - Requires authentication (normal)`);
        } else if (error.response?.status === 405) {
          console.log(`📝 ${endpoint} - Method not allowed (check if POST required)`);
        } else {
          console.log(`⚠️  ${endpoint} - Status: ${error.response?.status}`);
        }
      }
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎯 AUTHENTICATION ANALYSIS COMPLETE');
    console.log('\n📋 FINDINGS:');
    console.log('1. Coupon application requires valid authentication token');
    console.log('2. Frontend must ensure user is properly logged in');
    console.log('3. Token must be correctly sent in Authorization header');
    console.log('4. User authentication flow needs to be tested');
    
    console.log('\n🔧 RECOMMENDATIONS:');
    console.log('1. Verify user login state in frontend');
    console.log('2. Check if authentication token is being sent correctly');
    console.log('3. Test complete login flow from frontend');
    console.log('4. Ensure token storage and retrieval works properly');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

// Run the authentication test
testCouponWithAuth();