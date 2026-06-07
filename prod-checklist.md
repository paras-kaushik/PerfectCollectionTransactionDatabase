# WhatsApp Cloud API — Production Checklist

Everything you need to do (in order) before the WhatsApp invoice feature works for **any customer**, from **your real business number**.

Right now you're in **test mode** — which means:
- You're sending from Meta's test number (+1 555 638 3018), not your shop number
- You can only send to numbers you've manually added to a test list
- Your access token expires every ~24 hours

Here's how to fix all of that:

---

## Step 1: Complete Business Verification

**What:** Prove to Meta that "Perfect Collection" is a real business.

**Why:** Without this, you can't register your own phone number, and you're stuck in test mode forever.

**What you need (any ONE of these):**
- GST registration certificate
- Utility bill (electricity/phone) in the business name
- Bank statement showing business name
- Business registration certificate

**How:**
1. Go to **[Meta Business Settings → Security Center](https://business.facebook.com/settings/security)**
2. Click **"Start Verification"**
3. Enter your business details (name, address, phone, website if any)
4. Upload one of the documents above
5. Meta may call/text your business phone to verify
6. Wait **1–3 business days** for approval

**Official docs:** https://developers.facebook.com/docs/development/release/business-verification

---

## Step 2: Get a Permanent Access Token

**What:** Replace the temporary token (expires in ~24 hours) with one that **never expires**.

**Why:** Right now, every day the token expires and WhatsApp sending silently stops. A permanent token fixes this.

**How:**
1. Go to **[Meta Business Settings → System Users](https://business.facebook.com/settings/system-users)**
2. Click **"Add"** → name it `PerfectCollectionBot` → role: **Admin**
3. Click on the new system user → click **"Add Assets"**
4. Select your App (e.g., "PerfectCollection") → give **Full Control** → Save
5. Click **"Generate New Token"** → select your app
6. Check these two permissions:
   - ✅ `whatsapp_business_messaging`
   - ✅ `whatsapp_business_management`
7. Click **"Generate Token"** → **copy it immediately** (shown only once!)
8. Paste it into your `.env` file as `WHATSAPP_TOKEN`

**Official docs:** https://developers.facebook.com/docs/whatsapp/business-management-api/get-started#system-user-access-tokens

---

## Step 3: Register Your Real Business Phone Number

**What:** Use your shop's actual number (e.g., 9899258797) instead of Meta's test number.

**Why:** Customers will see the message coming from your real number, with your business name and profile picture.

**Prerequisites:** Step 1 (Business Verification) must be completed first.

**How:**
1. Go to **[WhatsApp Manager → Phone Numbers](https://business.facebook.com/latest/whatsapp_manager/phone_numbers)**
2. Click **"Add Phone Number"**
3. Enter the phone number: `+91 9899258797` (or whichever shop number)
4. Choose verification method: **SMS** or **Voice call**
5. Enter the code you receive
6. Once verified, you'll get a new **Phone Number ID** (a long number like `1091008534093606`)
7. Update your `.env` file: replace the old `WHATSAPP_PHONE_NUMBER_ID` with the new one

**Important:** The number you register here **cannot have WhatsApp installed on it** (regular WhatsApp or WhatsApp Business app). If it does, you'll need to delete that WhatsApp account first, or use a different number.

**Official docs:** https://developers.facebook.com/docs/whatsapp/cloud-api/get-started/add-a-phone-number

---

## Step 4: Set Up Your Business Profile

**What:** Add your shop name, logo, address, and description so customers see a professional profile.

**Why:** When customers receive the invoice, they'll see "Perfect Collection" with your logo instead of a random number.

**How:**
1. Go to **[WhatsApp Manager → Phone Numbers](https://business.facebook.com/latest/whatsapp_manager/phone_numbers)**
2. Click on your registered number
3. Click **"Profile"** tab
4. Fill in:
   - **Display name:** Perfect Collection
   - **About:** Men's Clothing — Fixed Price Shop
   - **Address:** SC-190, Jaipuria Sunrise Plaza, Indirapuram, Ghaziabad
   - **Profile picture:** Upload your shop logo
5. Save → Meta reviews the display name (usually quick)

**Official docs:** https://developers.facebook.com/docs/whatsapp/cloud-api/reference/business-profiles

---

## Step 5: Verify Your Message Template is Active

**What:** Make sure the `perfectcollection_invoice` template is approved and active.

**Why:** If the template is rejected or in review, WhatsApp sending will fail with error 132001.

**How:**
1. Go to **[WhatsApp Manager → Message Templates](https://business.facebook.com/latest/whatsapp_manager/message_templates)**
2. Find `perfectcollection_invoice`
3. Status should show **"Active"** (green)
4. If it says "Rejected" — check the rejection reason, fix it, and resubmit
5. If it says "In Review" — wait (usually minutes, sometimes hours)

**Official docs:** https://developers.facebook.com/docs/whatsapp/message-templates

---

## Step 6: Set Up a Payment Method

**What:** Add a credit/debit card or payment method for WhatsApp API usage charges.

**Why:** WhatsApp Cloud API is **not free** in production. Without a payment method, messages will stop once you exceed the free tier.

**Pricing (India, as of 2026):**
| Message Type | Cost per message |
|---|---|
| Utility (invoices, receipts) | ~₹0.35 |
| Marketing (promos) | ~₹0.75 |
| First 1,000 conversations/month | **Free** |

For a shop sending ~30 invoices/day, that's ~900/month = well within the free tier.

**How:**
1. Go to **[WhatsApp Manager → Overview](https://business.facebook.com/latest/whatsapp_manager/overview)**
2. Click on **"Payment Settings"** or go to **[Meta Business Settings → Payments](https://business.facebook.com/settings/payment-methods)**
3. Add a payment method (credit card, debit card, or UPI in India)

**Official docs:** https://developers.facebook.com/docs/whatsapp/pricing

---

## Step 7: Remove Test Mode Restrictions (Automatic)

**What:** Once Steps 1–3 are done, the "allowed list" restriction goes away.

**Why:** Right now you see error `131030 — Recipient phone number not in allowed list`. After registering your real number on a verified business account, you can send to **any customer's WhatsApp** without pre-approving their number.

**Nothing to do here** — this happens automatically when you switch from the test number to your registered business number.

**Official docs:** https://developers.facebook.com/docs/whatsapp/cloud-api/get-started#testing

---

## Step 8: Understand Messaging Limits

**What:** New WhatsApp Business numbers have a daily sending limit that increases over time.

| Tier | Daily limit | How to reach |
|---|---|---|
| Starting | 250 messages/day | New number |
| Tier 1 | 1,000/day | After good quality rating |
| Tier 2 | 10,000/day | Sustained quality |
| Tier 3 | 100,000/day | Sustained quality |
| Unlimited | No limit | Sustained quality |

**Quality rating** depends on:
- How many customers **block** your number (bad)
- How many customers **report** your messages as spam (very bad)
- Since you're sending invoices to people who just bought something, your quality should be excellent

**Official docs:** https://developers.facebook.com/docs/whatsapp/messaging-limits

---

## Step 9: Update `.env` for Production

After completing steps above, your `.env` should look like:

```env
# MongoDB Atlas (no change)
MONGO_URI=mongodb+srv://paraskaushik12:<password>@cluster0.omsux.mongodb.net/perfectCollectionDb?retryWrites=true&w=majority&appName=Cluster0

# WhatsApp Cloud API — PRODUCTION VALUES
WHATSAPP_TOKEN=<permanent_system_user_token_from_step_2>
WHATSAPP_PHONE_NUMBER_ID=<new_phone_number_id_from_step_3>
GRAPH_API_VERSION=v25.0

# Server
PORT=8000
```

---

## Quick Summary

| # | Step | Time | Blocking? |
|---|------|------|-----------|
| 1 | Business Verification | 1–3 days | Yes — blocks steps 3, 4, 7 |
| 2 | Permanent Access Token | 10 minutes | No — can do anytime |
| 3 | Register Real Phone Number | 10 minutes | Yes — needs step 1 |
| 4 | Business Profile Setup | 5 minutes | No |
| 5 | Template Active Check | 2 minutes | No |
| 6 | Payment Method | 5 minutes | No — free tier covers ~1000/month |
| 7 | Test Restrictions Removed | Automatic | Needs steps 1 + 3 |
| 8 | Messaging Limits Awareness | Read only | No |
| 9 | Update .env | 2 minutes | Needs steps 2 + 3 |

**Critical path:** Step 1 (Business Verification) → Step 3 (Register Number) → Step 9 (Update .env) → Done!

Steps 2, 4, 5, 6 can be done in parallel while waiting for business verification.

---

## All Official Links in One Place

| Resource | URL |
|----------|-----|
| Meta Business Settings | https://business.facebook.com/settings |
| Business Verification | https://developers.facebook.com/docs/development/release/business-verification |
| System User Tokens | https://developers.facebook.com/docs/whatsapp/business-management-api/get-started#system-user-access-tokens |
| Add Phone Number | https://developers.facebook.com/docs/whatsapp/cloud-api/get-started/add-a-phone-number |
| Business Profiles | https://developers.facebook.com/docs/whatsapp/cloud-api/reference/business-profiles |
| Message Templates | https://developers.facebook.com/docs/whatsapp/message-templates |
| Pricing | https://developers.facebook.com/docs/whatsapp/pricing |
| Messaging Limits | https://developers.facebook.com/docs/whatsapp/messaging-limits |
| WhatsApp Manager | https://business.facebook.com/latest/whatsapp_manager/ |
| Meta App Dashboard | https://developers.facebook.com/apps/ |
