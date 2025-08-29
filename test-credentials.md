# Test Credentials for Shoppers9 Backend

## Mobile OTP Authentication Test Credentials

### Test Phone Number: `1234567890`
### Test OTP: `1234`

## How to Test

### 1. Send OTP Request
```bash
curl -X POST http://localhost:5001/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "1234567890"}'
```

### 2. Verify OTP and Login/Register
```bash
curl -X POST http://localhost:5001/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "1234567890",
    "otp": "1234",
    "name": "Test User",
    "email": "test@example.com"
  }'
```

## Notes

- The test phone number `1234567890` will always generate OTP `1234`
- The test OTP `1234` will always be valid for the test phone number
- This bypasses SMS sending and provides a consistent testing experience
- For production, use real phone numbers that follow the Indian mobile format: `[6-9]xxxxxxxxx`

## Response Format

Successful OTP verification will return:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "name": "Test User",
      "email": "test@example.com",
      "phone": "1234567890",
      "isVerified": true
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```