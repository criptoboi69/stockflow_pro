# 📧 Resend Email Integration Setup

## Overview
This project uses Resend for transactional emails (user invitations, low-stock alerts, movement confirmations). Since Resend is a Node.js package, we implement it via Supabase Edge Functions.

## Setup Instructions

### 1. Get Resend API Key
1. Go to [resend.com](https://resend.com)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `re_`)

### 2. Configure Environment Variable
Add your Resend API key to `.env`:
```
VITE_RESEND_API_KEY=re_your_actual_api_key_here
```

### 3. Create Supabase Edge Function

Since this is a React app and Resend requires Node.js, you need to create a Supabase Edge Function:

#### Option A: Using Supabase CLI (Recommended)

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref your-project-ref
```

4. Create the Edge Function:
```bash
supabase functions new send-invitation
```

5. Replace the content of `supabase/functions/send-invitation/index.ts` with:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Resend } from 'npm:resend@2.0.0'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html } = await req.json()

    const data = await resend.emails.send({
      from: 'StockFlow Pro <onboarding@resend.dev>', // Replace with your verified domain
      to: [to],
      subject: subject,
      html: html,
    })

    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      },
    )
  }
})
```

6. Set the Resend API key as a secret:
```bash
supabase secrets set RESEND_API_KEY=re_your_actual_api_key_here
```

7. Deploy the function:
```bash
supabase functions deploy send-invitation
```

#### Option B: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions** in the sidebar
3. Click **Create a new function**
4. Name it `send-invitation`
5. Paste the TypeScript code from above
6. Go to **Project Settings** > **Edge Functions**
7. Add secret: `RESEND_API_KEY` with your Resend API key
8. Deploy the function

### 4. Update Application Code

Update `src/services/emailService.js` to use your Edge Function URL:

```javascript
const EDGE_FUNCTION_URL = 'https://your-project-ref.supabase.co/functions/v1/send-invitation'

const response = await fetch(EDGE_FUNCTION_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabase.auth.session()?.access_token}`
  },
  body: JSON.stringify(emailPayload)
});
```

### 5. Verify Domain (Production)

For production use:
1. Go to Resend dashboard
2. Navigate to **Domains**
3. Add your domain (e.g., `yourdomain.com`)
4. Add the provided DNS records to your domain
5. Wait for verification
6. Update the `from` field in Edge Function to use your domain:
   ```typescript
   from: 'StockFlow Pro <noreply@yourdomain.com>'
   ```

## Testing

### Test User Invitation
1. Log in as Administrator or Manager
2. Go to User Management
3. Click "Add User"
4. Enter email and select role
5. Check "Send invitation email"
6. Submit
7. Check the recipient's inbox

### Demo Credentials
Use these accounts to test:
- **Super Admin**: superadmin@stockflow.fr / SuperAdmin123!
- **Administrator**: admin@techcorp.fr / Admin123!
- **Manager**: manager@techcorp.fr / Manager123!
- **User**: user@techcorp.fr / User123!

## Troubleshooting

### Email not sending
1. Check Resend API key is correct
2. Verify Edge Function is deployed
3. Check Edge Function logs in Supabase dashboard
4. Ensure CORS headers are set correctly

### "From" address rejected
1. Use `onboarding@resend.dev` for testing
2. For production, verify your domain first
3. Update `from` field to use verified domain

### Rate limits
- Free tier: 100 emails/day
- Paid tier: Higher limits
- Consider implementing queue for bulk invitations

## Email Templates

The application includes pre-built HTML email templates for:
- ✉️ User invitations with role assignment
- ⚠️ Low stock alerts
- 📦 Movement confirmations

Templates are in `src/services/emailService.js` and can be customized.

## Security Notes

1. **Never expose Resend API key in frontend code**
2. Always use Edge Functions for email sending
3. Validate email addresses before sending
4. Implement rate limiting for invitation endpoints
5. Use RLS policies to restrict who can send invitations

## Support

- Resend Documentation: https://resend.com/docs
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Project Issues: Contact your development team