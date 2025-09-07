# GoDaddy DNS Setup for shoppers9.com - Step by Step

## What You Need to Do in GoDaddy (After Deleting DNS Settings)

### Step 1: Access Your Domain Settings
1. Go to [GoDaddy.com](https://godaddy.com)
2. Sign in to your account
3. Click on "My Products" or "Domains"
4. Find "shoppers9.com" and click "Manage" or "DNS"
5. Look for "DNS Records" or "Manage DNS"

### Step 2: Add SSL Certificate Validation Records
**CRITICAL: Do this FIRST - Your website won't work without SSL validation**

Click "Add Record" and add these 4 CNAME records exactly:

**Record 1 (Main Domain):**
- Type: CNAME
- Name: `_6e43f07ea171d793ea24dfc08ca4f566`
- Value: `_3a1f4e792c671b003413b4619d15cb38.xlfgrmvvlj.acm-validations.aws`
- TTL: 600 (or leave default)

**Record 2 (API Subdomain):**
- Type: CNAME
- Name: `_6e43f07ea171d793ea24dfc08ca4f566.api`
- Value: `_3a1f4e792c671b003413b4619d15cb38.xlfgrmvvlj.acm-validations.aws`
- TTL: 600

**Record 3 (WWW Subdomain):**
- Type: CNAME
- Name: `_29af7727db749e77709d6b251812998b.www`
- Value: `_d9aab72d6e7e93a9cd514e8feeb36aa5.xlfgrmvvlj.acm-validations.aws`
- TTL: 600

**Record 4 (Admin Subdomain):**
- Type: CNAME
- Name: `_916715318f3af13bf19070399cc4e481.admin`
- Value: `_2f4f093597ec578249606ed35ce5b0ab.xlfgrmvvlj.acm-validations.aws`
- TTL: 600

**Important Notes for Step 2:**
- Copy and paste these values EXACTLY - one wrong character will break SSL
- Don't add ".shoppers9.com" to the end of the Name field - GoDaddy adds it automatically
- Click "Save" after each record
- **WAIT 30-60 minutes** before proceeding to Step 3

### Step 3: Add Website Routing Records
**Only do this AFTER Step 2 is complete and you've waited**

Add these 4 CNAME records to point your domains to AWS:

**Record 1 (Main Website):**
- Type: CNAME
- Name: `@` (or leave blank for root domain)
- Value: `shoppers9-alb-268030346.us-east-1.elb.amazonaws.com`
- TTL: 600

**Record 2 (WWW):**
- Type: CNAME
- Name: `www`
- Value: `shoppers9-alb-268030346.us-east-1.elb.amazonaws.com`
- TTL: 600

**Record 3 (API):**
- Type: CNAME
- Name: `api`
- Value: `shoppers9-alb-268030346.us-east-1.elb.amazonaws.com`
- TTL: 600

**Record 4 (Admin Panel):**
- Type: CNAME
- Name: `admin`
- Value: `shoppers9-alb-268030346.us-east-1.elb.amazonaws.com`
- TTL: 600

**Important Notes for Step 3:**
- Some GoDaddy interfaces use "@" symbol for the root domain, others let you leave it blank
- If you see an error about CNAME for root domain, try using "A" record instead with IP address
- Click "Save" after each record
- **WAIT 2-24 hours** for full propagation

## Summary of What You're Adding

**Total Records: 8 CNAME records**
- 4 for SSL certificate validation (weird long names)
- 4 for website routing (simple names like www, api, admin)

## Troubleshooting Tips

**If you can't find "Add Record" button:**
- Look for "DNS", "DNS Management", or "Advanced DNS"
- Some accounts show "DNS Records" under domain settings

**If CNAME for root domain doesn't work:**
- Try using "A" record instead
- Contact GoDaddy support for help

**If records aren't saving:**
- Make sure you're not adding ".shoppers9.com" to the end of names
- Check for extra spaces in the values
- Try refreshing the page and adding again

## After Setup Complete

Once all 8 records are added and propagated:
- Main website: https://shoppers9.com
- With www: https://www.shoppers9.com
- Admin panel: https://admin.shoppers9.com
- API: https://api.shoppers9.com

## Need Help?

1. Contact GoDaddy support and show them this guide
2. Tell them: "I need to add CNAME records for AWS hosting and SSL validation"
3. They can help you navigate their interface

**Remember: Step 2 MUST be done first, then wait, then Step 3!**