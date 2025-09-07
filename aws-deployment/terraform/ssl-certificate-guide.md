# SSL Certificate Setup Guide

## Step 1: Request Certificate in AWS Certificate Manager

1. Go to AWS Certificate Manager in the **us-east-1** region
2. Click "Request a certificate"
3. Choose "Request a public certificate"
4. Add domain names:
   - `shoppers9.com`
   - `*.shoppers9.com`
5. Choose "DNS validation"
6. Click "Request"

## Step 2: Validate Domain Ownership

1. In the certificate details, find the CNAME records
2. Add these CNAME records to your domain's DNS settings:
   ```
   Name: _abc123def456.shoppers9.com
   Type: CNAME
   Value: _xyz789abc123.acm-validations.aws.
   ```
3. Wait for validation to complete (usually 5-30 minutes)

## Step 3: Update Terraform Configuration

1. Copy the certificate ARN from AWS Console
2. Update `aws-deployment/terraform/variables.tf`:
   ```hcl
   variable "certificate_arn" {
     description = "ARN of the SSL certificate"
     type        = string
     default     = "arn:aws:acm:us-east-1:YOUR_ACCOUNT:certificate/YOUR_CERT_ID"
   }
   ```

## Step 4: Deploy Infrastructure

Run the deployment script which will use the certificate for HTTPS.

## Verification

After deployment, verify HTTPS is working:
```bash
curl -I https://shoppers9.com
curl -I https://admin.shoppers9.com
curl -I https://api.shoppers9.com
```

All should return HTTP/2 200 with proper SSL certificates.
