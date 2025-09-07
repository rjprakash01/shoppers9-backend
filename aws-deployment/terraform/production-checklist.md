# Production Deployment Checklist

## Pre-Deployment

- [ ] AWS CLI configured with production account
- [ ] Domain ownership verified (shoppers9.com)
- [ ] SSL certificate requested and validated
- [ ] MongoDB Atlas cluster created
- [ ] Razorpay production account setup
- [ ] Twilio production account setup (optional)
- [ ] SMTP service configured (optional)

## Security Configuration

- [ ] All placeholder values replaced in .env.production files
- [ ] JWT secrets generated (64+ characters)
- [ ] Session secrets generated (32+ characters)
- [ ] Encryption keys generated (32+ characters)
- [ ] USE_MOCK_SERVICES=false in all production configs
- [ ] CORS origins set to production domains only
- [ ] MongoDB Atlas IP whitelist configured (production IPs only)
- [ ] Database user has minimal required permissions

## Infrastructure Deployment

- [ ] Terraform configuration validated
- [ ] Infrastructure deployed successfully
- [ ] ECR repositories created
- [ ] ECS cluster running
- [ ] Application Load Balancer configured
- [ ] Security groups properly configured

## Application Deployment

- [ ] All Docker images built and pushed
- [ ] ECS services updated and stable
- [ ] Health checks passing
- [ ] Logs showing no errors

## DNS and SSL

- [ ] DNS records pointing to load balancer
- [ ] HTTPS working for all domains
- [ ] SSL certificates valid and trusted
- [ ] HTTP redirects to HTTPS

## Functional Testing

- [ ] Homepage loads correctly
- [ ] User registration works
- [ ] User login works
- [ ] Product browsing works
- [ ] Search functionality works
- [ ] Cart operations work
- [ ] Order placement works (test mode)
- [ ] Admin panel accessible
- [ ] Admin login works
- [ ] Product management works
- [ ] Order management works

## Performance and Monitoring

- [ ] CloudWatch logs configured
- [ ] Performance monitoring setup
- [ ] Error alerting configured
- [ ] Backup strategy implemented
- [ ] Disaster recovery plan documented

## Security Verification

- [ ] No development endpoints accessible
- [ ] Rate limiting working
- [ ] CORS headers correct
- [ ] Security headers present
- [ ] No sensitive data in logs
- [ ] Database access restricted

## Go-Live

- [ ] Payment gateway switched to live mode
- [ ] Analytics tracking enabled
- [ ] SEO configurations applied
- [ ] Social media integrations tested
- [ ] Customer support channels ready

## Post-Deployment

- [ ] Monitor application for 24 hours
- [ ] Verify all integrations working
- [ ] Check performance metrics
- [ ] Review security logs
- [ ] Document any issues and resolutions
