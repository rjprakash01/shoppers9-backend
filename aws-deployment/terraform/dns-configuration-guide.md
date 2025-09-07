# DNS Configuration Guide

## After Infrastructure Deployment

1. Get the Application Load Balancer DNS name:
   ```bash
   cd aws-deployment/terraform
   terraform output alb_dns_name
   ```

2. In your domain registrar's DNS settings, create these records:

   **For Root Domain:**
   ```
   Type: A
   Name: @
   Value: [Use ALIAS/ANAME to ALB DNS name, or get ALB IP]
   ```

   **For Subdomains:**
   ```
   Type: CNAME
   Name: admin
   Value: your-alb-dns-name.us-east-1.elb.amazonaws.com
   
   Type: CNAME
   Name: api
   Value: your-alb-dns-name.us-east-1.elb.amazonaws.com
   ```

## Alternative: Using Route53 (Recommended)

If you transfer DNS to Route53:

1. Create a hosted zone for shoppers9.com
2. Update nameservers at your registrar
3. Create A records with ALIAS to the ALB:
   - shoppers9.com → ALB
   - admin.shoppers9.com → ALB
   - api.shoppers9.com → ALB

## Verification

After DNS propagation (5-60 minutes):
```bash
nslookup shoppers9.com
nslookup admin.shoppers9.com
nslookup api.shoppers9.com
```

All should resolve to the same IP address(es).
