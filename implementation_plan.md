# Technical Implementation Plan - Fix WhatsApp Language Code Mismatch

This plan details the fix for the WhatsApp API `132001` error (`Template name does not exist in the translation`) by aligning the language locale parameter in our request payload.

---

## 1. Goal
Correct the language code in the WhatsApp message payload inside `services/whatsapp.js` from `en_US` to `en` to match the registered template localization on Meta's WhatsApp Manager console.

---

## 2. Affected Files
* [whatsapp.js](file:///Users/paraskaushik/Developer/PerfectCollectionTransactionDatabase/services/whatsapp.js)

---

## 3. Technical Education: WhatsApp Template Locales & Error 132001

### A. The Localization Concept
When you submit a message template (e.g., `perfectcollection_invoice`) to Meta, you must specify a language locale. 
* Common English locales:
  * `en` (Generic English)
  * `en_US` (English - United States)
  * `en_GB` (English - United Kingdom)
* **Crucial Match**: If your template is registered under `en`, the API request payload must request `en` exactly. Requesting `en_US` will cause the server to fail with error `132001` because Meta treats these as separate translations.

### B. Understanding Error 132001
The raw API response we received was:
```json
{
  "error": {
    "message": "(#132001) Template name does not exist in the translation",
    "code": 132001,
    "error_data": {
      "messaging_product": "whatsapp",
      "details": "template name (perfectcollection_invoice) does not exist in en_US"
    }
  }
}
```
This confirms that the template `perfectcollection_invoice` exists under your Meta WhatsApp Account, but it is registered under the `en` locale, not `en_US`. Returning the payload query parameter to `en` will resolve this.

---

## 4. Proposed Concrete Code Changes

### [whatsapp.js](file:///Users/paraskaushik/Developer/PerfectCollectionTransactionDatabase/services/whatsapp.js)

We will modify line 77 to revert the language code from `"en_US"` to `"en"`.

```diff
       template: {
         name: "perfectcollection_invoice",
-        language: { code: "en_US" },
+        language: { code: "en" },
         components: [
```

---

## 5. Verification Plan

1. Save the changes and run the test POST script:
   ```bash
   node send-test-invoice.js
   ```
2. Verify that the response returns `whatsappStatus: 'sent'` instead of `'failed'`.
