#!/bin/bash

# MongoDB Atlas IP Whitelist Configuration
# Run this script after getting production server IPs

echo "MongoDB Atlas Security Configuration"
echo "===================================="
echo
echo "1. Log in to MongoDB Atlas: https://cloud.mongodb.com"
echo "2. Navigate to your cluster > Network Access"
echo "3. Remove all existing IP addresses (especially 0.0.0.0/0)"
echo "4. Add the following production server IPs:"
echo

if [ -f "production-ips.txt" ]; then
    while read -r ip; do
        echo "   - $ip/32"
    done < production-ips.txt
else
    echo "   (Run get_production_ips first to get the IPs)"
fi

echo
echo "5. Ensure no development IPs are whitelisted"
echo "6. Create a database user 'shoppers9_prod' with readWrite permissions"
echo "7. Update MONGODB_URI in .env.production with the new credentials"
echo
echo "Security Checklist:"
echo "- [ ] Only production server IPs are whitelisted"
echo "- [ ] No 0.0.0.0/0 entries exist"
echo "- [ ] Database user has minimal required permissions"
echo "- [ ] Connection string uses strong password"
