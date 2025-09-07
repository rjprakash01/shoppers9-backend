# Step-by-Step GoDaddy DNS Setup Guide

## What You Need to Do

Your website isn't working because you need to add special DNS records to your GoDaddy account. Think of DNS records like a phone book that tells the internet where to find your website.

## STEP 1: Login to GoDaddy

1. Open your web browser (Chrome, Safari, Firefox, etc.)
2. Go to **www.godaddy.com**
3. Click the **"Sign In"** button (usually in the top right corner)
4. Enter your GoDaddy username and password
5. Click **"Sign In"**

## STEP 2: Find Your Domain

1. After logging in, look for **"My Products"** (usually at the top of the page)
2. Click on **"My Products"**
3. Look for a section called **"Domains"** or **"All Products and Services"**
4. Find **shoppers9.com** in the list
5. Click the **"Manage"** button next to shoppers9.com

## STEP 3: Go to DNS Settings

1. You should now see your domain management page
2. Look for a tab or button that says **"DNS"** or **"DNS Management"**
3. Click on **"DNS"**
4. You'll see a page with different types of records

## STEP 4: Add SSL Validation Records (VERY IMPORTANT - DO THIS FIRST)

You need to add 4 special records to prove you own the domain. These are called CNAME records.

### Record #1 - Main Domain Validation
1. Click **"Add"** or **"Add Record"**
2. Select **"CNAME"** from the dropdown
3. In the **"Name"** field, copy and paste exactly:
   ```
   _c4c7c0e6e8b4f4c4c4c4c4c4c4c4c4c4
   ```
4. In the **"Value"** field, copy and paste exactly:
   ```
   _3a1f4e792c671b003413b4619d15cb38.xlfgrmvvlj.acm-validations.aws.
   ```
5. Set **"TTL"** to **600**
6. Click **"Save"**

### Record #2 - WWW Subdomain Validation
1. Click **"Add"** again
2. Select **"CNAME"**
3. In the **"Name"** field, copy and paste exactly:
   ```
   _29af7727db749e77709d6b251812998b.www
   ```
4. In the **"Value"** field, copy and paste exactly:
   ```
   _d9aab72d6e7e93a9cd514e8feeb36aa5.xlfgrmvvlj.acm-validations.aws.
   ```
5. Set **"TTL"** to **600**
6. Click **"Save"**

### Record #3 - Admin Subdomain Validation
1. Click **"Add"** again
2. Select **"CNAME"**
3. In the **"Name"** field, copy and paste exactly:
   ```
   _916715318f3af13bf19070399cc4e481.admin
   ```
4. In the **"Value"** field, copy and paste exactly:
   ```
   _2f4f093597ec578249606ed35ce5b0ab.xlfgrmvvlj.acm-validations.aws.
   ```
5. Set **"TTL"** to **600**
6. Click **"Save"**

### Record #4 - API Subdomain Validation
1. Click **"Add"** again
2. Select **"CNAME"**
3. In the **"Name"** field, copy and paste exactly:
   ```
   _6e43f07ea171d793ea24dfc08ca4f566.api
   ```
4. In the **"Value"** field, copy and paste exactly:
   ```
   _3a1f4e792c671b003413b4619d15cb38.xlfgrmvvlj.acm-validations.aws.
   ```
5. Set **"TTL"** to **600**
6. Click **"Save"**

## STEP 5: Wait for SSL Certificate Validation

1. After adding all 4 validation records, **WAIT 15-30 minutes**
2. The SSL certificate needs to be validated before your website will work
3. **DO NOT** add the website records yet - wait for this step to complete

## STEP 6: Add Website Records (ONLY AFTER STEP 5 IS COMPLETE)

After waiting 30 minutes, add these records to make your website accessible:

### Record #5 - Main Website (shoppers9.com)
1. Click **"Add"**
2. Select **"CNAME"**
3. In the **"Name"** field, type: **@** (just the @ symbol)
4. In the **"Value"** field, copy and paste exactly:
   ```
   shoppers9-alb-268030346.us-east-1.elb.amazonaws.com
   ```
5. Set **"TTL"** to **600**
6. Click **"Save"**

### Record #6 - WWW Website (www.shoppers9.com)
1. Click **"Add"**
2. Select **"CNAME"**
3. In the **"Name"** field, type: **www**
4. In the **"Value"** field, copy and paste exactly:
   ```
   shoppers9-alb-268030346.us-east-1.elb.amazonaws.com
   ```
5. Set **"TTL"** to **600**
6. Click **"Save"**

### Record #7 - Admin Panel (admin.shoppers9.com)
1. Click **"Add"**
2. Select **"CNAME"**
3. In the **"Name"** field, type: **admin**
4. In the **"Value"** field, copy and paste exactly:
   ```
   shoppers9-alb-268030346.us-east-1.elb.amazonaws.com
   ```
5. Set **"TTL"** to **600**
6. Click **"Save"**

### Record #8 - API (api.shoppers9.com)
1. Click **"Add"**
2. Select **"CNAME"**
3. In the **"Name"** field, type: **api**
4. In the **"Value"** field, copy and paste exactly:
   ```
   shoppers9-alb-268030346.us-east-1.elb.amazonaws.com
   ```
5. Set **"TTL"** to **600**
6. Click **"Save"**

## STEP 7: Final Wait

1. After adding all records, wait **2-4 hours** for everything to work
2. Sometimes it can take up to 24 hours for changes to spread worldwide
3. Your website should then be accessible at:
   - **https://shoppers9.com**
   - **https://www.shoppers9.com**
   - **https://admin.shoppers9.com**
   - **https://api.shoppers9.com**

## Important Notes:

- **Copy and paste exactly** - don't type the long codes manually
- **Do the validation records first** (Steps 4) before the website records (Step 6)
- **Be patient** - DNS changes take time to work
- **Use HTTPS** - your website will only work with https://, not http://

## If You Get Stuck:

1. Make sure you copied all the codes exactly
2. Check that TTL is set to 600 for all records
3. Wait longer - sometimes it takes up to 24 hours
4. Contact GoDaddy support if you can't find the DNS settings

## What Each Record Does:

- **Validation records** (Records 1-4): Prove you own the domain so SSL works
- **Website records** (Records 5-8): Tell the internet where your website is hosted

That's it! Follow these steps carefully and your website will be working soon.