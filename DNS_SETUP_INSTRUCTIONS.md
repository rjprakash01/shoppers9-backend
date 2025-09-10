# DNS Setup Instructions for GoDaddy

## Current Status (Updated)
- **shoppers9.com** - ⚠️ DNS updated but returning HTTP 503 (Service Unavailable)
- **admin.shoppers9.com** - ✅ WORKING (HTTPS accessible, DNS configured correctly)
- **api.shoppers9.com** - ✅ WORKING (HTTPS accessible, DNS configured correctly)
- **www.shoppers9.com** - ✅ WORKING (HTTPS accessible, DNS configured correctly)

## Load Balancer Information
- **ALB DNS Name**: `shoppers9-alb-1665716955.us-east-1.elb.amazonaws.com`
- **ALB IP Addresses**: `18.205.202.188`, `52.5.105.176`

## Required DNS Records in GoDaddy

### Main Domain Issue Resolution

**STATUS**: DNS A records have been updated successfully. shoppers9.com now resolves to the correct load balancer IPs (18.205.202.188 and 52.5.105.176).

**CURRENT ISSUE**: shoppers9.com returns HTTP 503 (Service Unavailable) while www.shoppers9.com works perfectly.

**ANALYSIS**:
- ✅ DNS resolution: shoppers9.com → correct load balancer IPs
- ✅ SSL certificate: includes shoppers9.com
- ✅ Load balancer: healthy and accessible
- ❌ Routing: bare domain (shoppers9.com) not properly configured

**NEXT STEPS**:
1. Check load balancer listener rules for bare domain routing
2. Verify frontend service can handle requests to shoppers9.com
3. Consider adding redirect from shoppers9.com to www.shoppers9.com

**Current A Records (CORRECTLY CONFIGURED):**
```
Type: A
Name: @
Value: 18.205.202.188
TTL: 600
```
```
Type: A
Name: @
Value: 52.5.105.176
TTL: 600
```

### CNAME Records for Subdomains

You need to add these CNAME records in your GoDaddy DNS management:

### 1. Admin Subdomain
```
Type: CNAME
Name: admin
Value: shoppers9-alb-1665716955.us-east-1.elb.amazonaws.com
TTL: 600 (or default)
```

### 2. API Subdomain
```
Type: CNAME
Name: api
Value: shoppers9-alb-1665716955.us-east-1.elb.amazonaws.com
TTL: 600 (or default)
```

### 3. WWW Subdomain (Optional but recommended)
```
Type: CNAME
Name: www
Value: shoppers9-alb-1665716955.us-east-1.elb.amazonaws.com
TTL: 600 (or default)
```

## Steps to Add in GoDaddy:

1. **Login to GoDaddy** and go to your domain management
2. **Find DNS Management** for shoppers9.com
3. **Click "Add Record"** or similar button
4. **Select "CNAME"** as record type
5. **Enter the Name and Value** as shown above
6. **Save each record**

## Verification Commands

After adding the records, wait 5-60 minutes for DNS propagation, then test:

```bash
# Test admin subdomain
nslookup admin.shoppers9.com

# Test API subdomain
nslookup api.shoppers9.com

# Test HTTPS access (after DNS propagates)
curl -I https://shoppers9.com
curl -I https://admin.shoppers9.com
curl -I https://api.shoppers9.com
```

## Expected Results

Once configured correctly, all domains should resolve to the same load balancer IPs:
- `18.205.202.188`
- `52.5.105.176`

## SSL Certificate Coverage

Your SSL certificate covers:
- ✅ shoppers9.com
- ✅ www.shoppers9.com
- ✅ admin.shoppers9.com
- ✅ api.shoppers9.com

So HTTPS will work automatically once DNS is configured!

## Troubleshooting

- **DNS not propagating?** Wait up to 24 hours, but usually takes 5-60 minutes
- **Still getting NXDOMAIN?** Double-check the CNAME record values
- **SSL errors?** Make sure you're using the exact domain names covered by the certificate