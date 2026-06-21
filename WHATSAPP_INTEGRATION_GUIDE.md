# WhatsApp Cloud API Integration & 2FA Bypass Guide

This document serves as an educational guide explaining the issues faced during the WhatsApp Business API setup and the direct API bypasses used to resolve them.

---

## 1. The Meta UI 2FA Loop Roadblock

### **The Problem**
During the production setup of the WhatsApp Business Platform, the Meta Business Portal UI frequently suffers from an infinite two-factor authentication (2FA) loop, crashing at `auth.meta.com` with a *"Something went wrong"* error when attempting to register the phone number and configure the 6-digit Two-Step Verification PIN. This leaves the registered phone number stuck in a "Pending" status in the UI.

### **The Solution (Direct Registration Bypass)**
Since the Meta frontend dashboard was broken, we bypassed the browser interface and triggered the registration backend directly via Meta’s Graph API. 

We made a `POST` request to:
`https://graph.facebook.com/{GRAPH_API_VERSION}/{PHONE_NUMBER_ID}/register`

This endpoint registers the phone number, assigns the 6-digit Two-Step Verification PIN, and transitions the phone number state from "Pending" to **"Connected"** (Active) without needing to use the Meta Business Portal UI.

We created a reusable helper script in the repository root: `register_phone.js`.

---

## 2. Configuration & Credentials Setup

To authenticate requests to the Meta Graph API, the application relies on variables stored in the local `.env` file (which is git-ignored for security):

```env
# MongoDB Database
MONGO_URI=mongodb+srv://...

# WhatsApp Cloud API Credentials
WHATSAPP_TOKEN=EAATDQJ22...
WHATSAPP_PHONE_NUMBER_ID=1073274819212907
GRAPH_API_VERSION=v25.0

# Local Server Configuration
PORT=8000
```

### **Where to find these values in the Meta Portal:**
1. **`WHATSAPP_TOKEN` (Permanent System User Token)**:
   * Go to **Meta Business Settings** -> **Users** -> **System Users**.
   * Select/create your system user (e.g., `perfectcollectionbot`).
   * Click **Assign Assets** and grant full control permissions to your WhatsApp Business Account.
   * Click **Generate Token**, select the app, ensure `whatsapp_business_messaging` and `whatsapp_business_management` are checked, and copy the token.
2. **`WHATSAPP_PHONE_NUMBER_ID`**:
   * Go to **App Dashboard** -> **Use cases** -> **Connect on WhatsApp** -> **API Setup**.
   * Under the registered phone number, copy the **Phone number ID**.

---

## 3. Template Creation and Mismatches

WhatsApp requires that all business-initiated conversations outside the 24-hour customer reply window use pre-approved **Message Templates**.

### **Creating the Invoice Template**
In your [WhatsApp Manager (Templates Section)](https://business.facebook.com/wa/manage/templates/?waba_id=1458751829326034), we created the utility template `perfectcollection_invoice`:
* **Category**: Utility
* **Header**: Media -> Document (this carries the PDF file)
* **Body**: `Dear {{1}}, thank you for shopping at Perfect Collection. Please find attached your bill (Estimate No: {{2}}).`
* **Language**: English (Generic)

### **Key Gotcha: Language Code Mismatch**
* **The Error**: Hitting the `/messages` endpoint returned error `(#132001) Template name does not exist in the translation`.
* **The Cause**: The template was created under the language name **"English"** (which resolves to code **`en`**), but the codebase was hardcoded to send **`en_US`** (English US).
* **The Fix**: We updated `/services/whatsapp.js` to send `language: { code: 'en' }` to perfectly match the registered template language on Meta.

---

## 4. How the Message Sending Code Works

The Node.js codebase implements the sending flow in `services/whatsapp.js` via a **two-step API process**:

### **Step 1: Upload the PDF Binary to Meta's Servers**
First, we POST the PDF file buffer to the Media Upload endpoint to host it on Meta's servers. This returns a unique `media_id`.
```javascript
async function uploadPdf(pdfBuffer, filename) {
  const form = new FormData();
  form.append("messaging_product", "whatsapp");
  form.append("file", pdfBuffer, { filename, contentType: "application/pdf" });
  form.append("type", "application/pdf");

  const response = await axios.post(
    `https://graph.facebook.com/${version}/${phoneNumberId}/media`,
    form,
    { headers: { Authorization: `Bearer ${token}`, ...form.getHeaders() } }
  );
  return response.data.id; // Returns media ID
}
```

### **Step 2: Dispatch the Template Message**
Next, we send a JSON request containing the recipient's phone number, the template name, the `media_id` (under the header component parameters), and the customer's name and invoice number (under body parameters).
```javascript
async function sendInvoice(phoneNumber, pdfBuffer, filename, customerName, invoiceNumber) {
  const mediaId = await uploadPdf(pdfBuffer, filename);
  
  await axios.post(
    `https://graph.facebook.com/${version}/${phoneNumberId}/messages`,
    {
      messaging_product: "whatsapp",
      to: formatPhoneNumber(phoneNumber),
      type: "template",
      template: {
        name: "perfectcollection_invoice",
        language: { code: "en" },
        components: [
          {
            type: "header",
            parameters: [{ type: "document", document: { id: mediaId, filename } }]
          },
          {
            type: "body",
            parameters: [
              { type: "text", text: customerName || "Customer" },
              { type: "text", text: String(invoiceNumber) }
            ]
          }
        ]
      }
    },
    { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
  );
}
```

---

## 5. Verification Commands

To verify and test your integration locally without running the full user interface:

1. **Start the Express Server**:
   ```bash
   npm start
   ```
   *(Runs on `http://localhost:8000/` based on your `.env` setting).*

2. **Run a Test Dispatch**:
   We created a temporary testing script that constructs a mock transaction, generates the PDF, and calls `sendInvoice`:
   ```bash
   NODE_PATH=./node_modules node /Users/paraskaushik/.gemini/antigravity-ide/scratch/test_whatsapp_send.js <10_DIGIT_PHONE_NUMBER>
   ```
