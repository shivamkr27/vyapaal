# EmailJS Setup Guide for Vyapaal

## ✅ YOUR CREDENTIALS (Already Configured)
- **Public Key**: `uHVREo5DFJpl6aFBJ` ✅
- **Private Key**: `OjeSaD1GxcevL9Rf6TOHf` ✅  
- **Service Name**: `vyapaal` ✅

## 🚀 FINAL SETUP STEPS (Required)

### Step 1: Login to EmailJS Dashboard
1. Go to [EmailJS.com](https://www.emailjs.com/)
2. Login with your account

### Step 2: Create Email Service (If Not Done)
1. Go to **Email Services** in your dashboard
2. Click **Add New Service**
3. Choose **Gmail** 
4. **Service ID should be**: `vyapaal` (to match your code)
5. Connect your Gmail account (infovyapaal@gmail.com)

### Step 3: Create Email Templates

#### Template 1: Contact Form
1. Go to **Email Templates**
2. Click **Create New Template**
3. **Template ID**: `template_vyapaal` (IMPORTANT - must match code)
4. **Subject**: `New Contact from Vyapaal Website`
5. **Template Content**:
```
Hello,

You have received a new message from your Vyapaal website:

Name: {{from_name}}
Email: {{from_email}}
Reply To: {{reply_to}}

Message:
{{message}}

---
Sent from Vyapaal Contact Form
```

#### Template 2: Feedback Form  
1. Create another template
2. **Template ID**: `template_feedback` (IMPORTANT - must match code)
3. **Subject**: `New Feedback - Vyapaal`
4. **Template Content**:
```
Hello,

You have received new feedback from Vyapaal:

Rating: {{rating}}/5 stars
Email: {{from_email}}

Feedback:
{{message}}

---
Sent from Vyapaal Feedback System
```

### Step 4: Test Your Setup
1. Your code is already configured with your credentials
2. Run `npm run dev`
3. Fill out the contact form
4. Check your email (infovyapaal@gmail.com)

## 🔧 CURRENT CONFIGURATION (Already in Code):
```javascript
// Contact Form
emailjs.send(
  'vyapaal',              // Your service name ✅
  'template_vyapaal',     // Template ID you need to create
  {
    from_name: 'John Doe',
    from_email: 'john@example.com', 
    message: 'Hello...',
    reply_to: 'john@example.com'
  },
  'uHVREo5DFJpl6aFBJ'    // Your public key ✅
);

// Feedback Form  
emailjs.send(
  'vyapaal',              // Your service name ✅
  'template_feedback',    // Template ID you need to create
  {
    rating: 5,
    message: 'Great app!',
    from_email: 'user@example.com'
  },
  'uHVREo5DFJpl6aFBJ'    // Your public key ✅
);
```

## ⚠️ IMPORTANT NOTES:
1. **Service ID must be**: `vyapaal` (not `service_vyapaal`)
2. **Template IDs must be**: `template_vyapaal` and `template_feedback`
3. **Make sure Gmail is connected** to receive emails
4. **Test with a simple message** first

## 🎯 Free Plan Limits:
- 200 emails/month
- Perfect for getting started

## 🛠️ If Emails Don't Work:
1. Check browser console for errors
2. Verify service and template IDs match exactly
3. Make sure Gmail service is connected
4. The fallback will open email client automatically

## ✅ WHAT'S ALREADY WORKING:
- ✅ No page reload on form submission
- ✅ Form validation and error handling  
- ✅ Success animations and confirmations
- ✅ Fallback to email client if EmailJS fails
- ✅ Your credentials are configured
- ✅ Integration section removed
- ✅ Feedback system working

**Just create the templates in EmailJS dashboard and you're done!**