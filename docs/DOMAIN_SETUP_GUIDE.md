# Domain Setup Guide for shoppers9.com

## Step 1: SSL Certificate Validation (REQUIRED FIRST)

Before the domain can work with HTTPS, you need to validate the SSL certificate by adding these DNS records to your GoDaddy domain:

### DNS Validation Records to Add in GoDaddy:

1. **For shoppers9.com:**
   - Type: `CNAME`
   - Name: `_c4c7c0e6e8b4f4c4c4c4c4c4c4c4c4c4.shoppers9.com`
   - Value: `_3a1f4e792c671b003413b4619d15cb38.xlfgrmvvlj.acm-validations.aws.`
   - TTL: `600`

2. **For www.shoppers9.com:**
   - Type: `CNAME`
   - Name: `_29af7727db749e77709d6b251812998b.www.shoppers9.com`
   - Value: `_d9aab72d6e7e93a9cd514e8feeb36aa5.xlfgrmvvlj.acm-validations.aws.`
   - TTL: `600`

3. **For admin.shoppers9.com:**
   - Type: `CNAME`
   - Name: `_916715318f3af13bf19070399cc4e481.admin.shoppers9.com`
   - Value: `_2f4f093597ec578249606ed35ce5b0ab.xlfgrmvvlj.acm-validations.aws.`
   - TTL: `600`

4. **For api.shoppers9.com:**
   - Type: `CNAME`
   - Name: `_6e43f07ea171d793ea24dfc08ca4f566.api.shoppers9.com`
   - Value: `_3a1f4e792c671b003413b4619d15cb38.xlfgrmvvlj.acm-validations.aws.`
   - TTL: `600`

## Step 2: Domain Routing Records (ADD AFTER CERTIFICATE IS VALIDATED)

Once the SSL certificate is validated (usually takes 5-30 minutes after adding the validation records), add these records:

### Main Domain Records:

1. **Root domain (shoppers9.com):**
   - Type: `CNAME`
   - Name: `@` (or leave blank)
   - Value: `shoppers9-alb-268030346.us-east-1.elb.amazonaws.com`
   - TTL: `600`

2. **WWW subdomain (www.shoppers9.com):**
   - Type: `CNAME`
   - Name: `www`
   - Value: `shoppers9-alb-268030346.us-east-1.elb.amazonaws.com`
   - TTL: `600`

3. **Admin subdomain (admin.shoppers9.com):**
   - Type: `CNAME`
   - Name: `admin`
   - Value: `shoppers9-alb-268030346.us-east-1.elb.amazonaws.com`
   - TTL: `600`

4. **API subdomain (api.shoppers9.com):**
   - Type: `CNAME`
   - Name: `api`
   - Value: `shoppers9-alb-268030346.us-east-1.elb.amazonaws.com`
   - TTL: `600`

## Step 3: How to Add DNS Records in GoDaddy

1. Login to your GoDaddy account
2. Go to "My Products" → "All Products and Services" → "Domains"
3. Click "Manage" next to shoppers9.com
4. Click on the "DNS" tab
5. Scroll down to "Records" section
6. Click "Add" to add each record
7. Select the record type (CNAME)
8. Enter the Name and Value as specified above
9. Set TTL to 600 seconds
10. Click "Save"

## Step 4: Verification

After adding the validation records, you can check the certificate status with:
```bash
aws acm describe-certificate --certificate-arn arn:aws:acm:us-east-1:414691912398:certificate/bcbe5a67-3eb4-4d50-b783-f429b277dc89 --region us-east-1
```

Once the certificate shows "ISSUED" status, run:
```bash
cd aws-deployment/terraform
terraform apply -auto-approve
```

## Step 5: Final URLs

Once everything is set up, your application will be available at:
- **Frontend**: https://shoppers9.com or https://www.shoppers9.com
- **Admin Panel**: https://admin.shoppers9.com or https://shoppers9.com/admin
- **API**: https://api.shoppers9.com or https://shoppers9.com/api

## Important Notes:

- **DNS Propagation**: Changes may take 24-48 hours to fully propagate worldwide
- **Certificate Validation**: Usually takes 5-30 minutes after adding validation records
- **Order Matters**: Add validation records first, wait for certificate validation, then add domain routing records
- **HTTPS Only**: The application will automatically redirect HTTP to HTTPS

## Troubleshooting:

If you encounter issues:
1. Verify all DNS records are added correctly
2. Wait for DNS propagation (up to 48 hours)
3. Check certificate status in AWS Console
4. Ensure there are no conflicting DNS records

## Certificate ARN:
`arn:aws:acm:us-east-1:414691912398:certificate/bcbe5a67-3eb4-4d50-b783-f429b277dc89`

## Load Balancer DNS:
`shoppers9-alb-268030346.us-east-1.elb.amazonaws.com`