# WhatsApp Cloud API Invoice Integration — Complete Developer Guide

## Table of Contents

1. [What We Built](#1-what-we-built)
2. [How WhatsApp Cloud API Works (End-to-End)](#2-how-whatsapp-cloud-api-works-end-to-end)
3. [Prerequisites — Meta Dashboard Setup](#3-prerequisites--meta-dashboard-setup)
4. [NPM Packages Added](#4-npm-packages-added)
5. [File-by-File Changes with Full Code](#5-file-by-file-changes-with-full-code)
6. [The Complete Flow — What Happens When You Press SHIFT](#6-the-complete-flow--what-happens-when-you-press-shift)
7. [Errors We Hit and How We Fixed Them](#7-errors-we-hit-and-how-we-fixed-them)
8. [Next Steps to Go to Production](#8-next-steps-to-go-to-production)
9. [Reference Links](#9-reference-links)

---

## 1. What We Built

**Before:** Shopkeeper fills items → presses SHIFT → browser prints invoice → transaction saved to MongoDB. No digital copy sent to customer.

**After:** Shopkeeper enters **phone number** + **customer name** → fills items → presses SHIFT → browser prints invoice → transaction saved to MongoDB → **PDF invoice generated on server** → **PDF sent to customer's WhatsApp**.

If the shopkeeper types "NA" in the phone field, WhatsApp is skipped and it works exactly like before.

---

## 2. How WhatsApp Cloud API Works (End-to-End)

WhatsApp Cloud API is Meta's official API for sending WhatsApp messages programmatically. Here's the complete flow:

### 2.1 — The Big Picture

```
Your Node.js Server
 |
 | HTTPS requests (using axios)
 ↓
Meta Graph API (https://graph.facebook.com/v25.0/...)
 |
 | Meta's internal systems
 ↓
WhatsApp's Servers
 |
 | WhatsApp protocol
 ↓
Customer's WhatsApp App (phone)
```

Your code never talks to WhatsApp directly. You talk to **Meta's Graph API** (a REST API), and Meta routes the message to WhatsApp.

### 2.2 — Authentication

Every API call needs a **Bearer token** in the HTTP header:
```
Authorization: Bearer EAATDQj22ZCs...
```
This token is linked to your WhatsApp Business Account. There are two types:
- **Temporary token** (from API Setup page) — expires in ~24 hours. Good for testing.
- **System User token** (from Business Settings) — never expires. Required for production.

### 2.3 — Sending a PDF (Two-Step Process)

You can't attach a file directly in a message. It's a 2-step process:

**Step 1: Upload the PDF to Meta's servers**
```
POST https://graph.facebook.com/v25.0/{PHONE_NUMBER_ID}/media
Content-Type: multipart/form-data

Fields:
 - messaging_product: "whatsapp"
 - file: <the PDF bytes>
 - type: "application/pdf"

Response: { "id": "1234567890" } ← this is the media_id
```

**Step 2: Send a template message with the uploaded PDF**
```
POST https://graph.facebook.com/v25.0/{PHONE_NUMBER_ID}/messages
Content-Type: application/json

Body: {
 messaging_product: "whatsapp",
 to: "919899258797",
 type: "template",
 template: {
 name: "perfectcollection_invoice",
 language: { code: "en_US" },
 components: [
 { type: "header", parameters: [{ type: "document", document: { id: "1234567890", filename: "Invoice.pdf" }}]},
 { type: "body", parameters: [{ type: "text", text: "John" }, { type: "text", text: "#42" }]}
 ]
 }
}
```

### 2.4 — Why Templates?

WhatsApp doesn't let businesses send any random message to customers. To prevent spam, Meta requires you to use **pre-approved message templates** for outbound messages. You create a template in WhatsApp Manager, Meta reviews it (usually minutes), and once approved, you can use it.

Our template `perfectcollection_invoice`:
- **Header:** Document (the PDF attachment)
- **Body:** `Hello {{1}}, Your invoice for order {{2}} is attached. Thank you for shopping with us!`
 - `{{1}}` = Customer name
 - `{{2}}` = Invoice number

### 2.5 — Phone Number Format

The API expects international format **without the `+` sign**:
- India: `91` + 10-digit number → e.g. `919899258797`
- Our code auto-prepends `91` if you enter a 10-digit number

---

## 3. Prerequisites — Meta Dashboard Setup

Before any code can send messages, you need these set up in Meta's dashboards:

### 3.1 — Create a Meta Developer App

1. Go to https://developers.facebook.com
2. Click **My Apps** → **Create App**
3. Choose **"Business"** type
4. Name it (e.g. "PerfectCollection")
5. In the app dashboard, click **Add Product** → find **WhatsApp** → **Set Up**

### 3.2 — WhatsApp API Setup

1. Go to https://developers.facebook.com/apps/{YOUR_APP_ID}/use_cases/customize/wa-dev-console/
2. You'll see:
 - **Access Token** — click "Generate access token" (this is the temporary one)
 - **Phone Number ID** — e.g. `1091008534093606` (Meta gives you a test number)
 - **WhatsApp Business Account ID** — shown on the same page
3. Under **"To"**, add the phone numbers you want to test with (during development, you can only send to pre-approved numbers)

### 3.3 — Create the Message Template

1. Go to https://business.facebook.com → **WhatsApp Manager** → **Message templates**
2. Click **Create Template**
3. Settings:
 - **Category:** Utility
 - **Name:** `perfectcollection_invoice`
 - **Language:** English (US)
4. Content:
 - **Header:** Select "Document" (this is where the PDF will go)
 - **Body:** `Hello {{1}}, Your invoice for order {{2}} is attached. Thank you for shopping with us!`
 - **No buttons** (keep it simple)
5. Click **Submit for Review** — usually approved in minutes

### 3.4 — Values You Need

After setup, you'll have these 3 values:
```
WHATSAPP_TOKEN=EAATDQj22ZCs... # Access token (temporary or permanent)
WHATSAPP_PHONE_NUMBER_ID=1091008534093606 # Your sending phone number's ID
GRAPH_API_VERSION=v25.0 # API version (check your dashboard URL)
```

---

## 4. NPM Packages Added

Run this in the project root:
```bash
npm install axios dotenv form-data pdfkit --save
```

| Package | Version | What It Does |
|---------|---------|-------------|
| **axios** | ^1.15.0 | HTTP client — makes API calls to Meta's Graph API (upload PDF, send message) |
| **dotenv** | ^17.4.2 | Reads `.env` file at startup and puts values into `process.env` — keeps secrets out of code |
| **form-data** | ^4.0.5 | Builds `multipart/form-data` requests — needed to upload the PDF file to Meta's media endpoint |
| **pdfkit** | ^0.18.0 | Generates PDF files from code (no browser needed) — creates the invoice PDF on the server |

### Why these specific packages?

- **axios** over `node-fetch`: axios handles `multipart/form-data` with form-data package seamlessly, auto-parses JSON responses, and the WhatsApp reference repos from Meta use it.
- **pdfkit** over `html2pdf` or `puppeteer`: pdfkit is lightweight (~2MB), doesn't need a browser/headless Chrome, and runs fast on any machine. The PDF is generated from data, not from HTML.
- **dotenv**: Industry standard for managing environment variables in Node.js. Never hardcode tokens in source code.

---

## 5. File-by-File Changes with Full Code

### Overview

| # | File | Action | Purpose |
|---|------|--------|---------|
| 1 | `.env` | **CREATE** | Store secrets (tokens, DB connection) |
| 2 | `.gitignore` | **MODIFY** | Prevent `.env` from being committed |
| 3 | `services/pdfGenerator.js` | **CREATE** | Generate invoice PDFs from transaction data |
| 4 | `services/whatsapp.js` | **CREATE** | Upload PDF to Meta + send WhatsApp template message |
| 5 | `package.json` | **MODIFY** | Add 4 new dependencies |
| 6 | `index.js` | **MODIFY** | Load `.env` at startup |
| 7 | `config/mongoose.js` | **MODIFY** | Use env var for DB connection |
| 8 | `models/transaction.js` | **MODIFY** | Add `customerName` and `phoneNumber` fields |
| 9 | `controllers/transaction_controller.js` | **MODIFY** | Add PDF generation + WhatsApp sending after saving |
| 10 | `views/home.ejs` | **MODIFY** | Add phone input + rename remarks to Customer Name |
| 11 | `assets/js/pdf.js` | **MODIFY** | Wire up phone/name fields + validation |

---

### FILE 1: `.env` (CREATE — project root)

**Why:** Secrets like API tokens should NEVER be in source code. The `.env` file holds them locally and `dotenv` loads them into `process.env` at runtime.

**Full content:**
```env
# MongoDB Atlas
MONGO_URI=mongodb+srv://paraskaushik12:databasepassword@cluster0.omsux.mongodb.net/perfectCollectionDb?retryWrites=true&w=majority&appName=Cluster0

# WhatsApp Cloud API
WHATSAPP_TOKEN=EAATDQJ22ZCsMBRLJF1NOP1fsaXBkDZBmqWwJndBiMpnQTmycayEgj7yQ3dQnlPZAxABHaxq6Q0VO2sSPOm93CAZAW3THhnZBTX5Q4U44iRk2hz0qjulzg3dFNw8V9rIZCPZB17lA1ZBLV4BnT2YLxgYXPZBksQx2VBlxYeqHiXOE6tZAGofArESHDCCDGySBmpRQZDZD
WHATSAPP_PHONE_NUMBER_ID=1091008534093606
GRAPH_API_VERSION=v25.0

# Server
PORT=8000


```

**Replace `YOUR_DB_PASSWORD_HERE`** with the password for Atlas database user `paraskaushik12`.
**Replace `YOUR_ACCESS_TOKEN_HERE`** with your actual token from the Meta dashboard.

> **How to find/reset your Atlas DB password:**
> 1. Go to https://cloud.mongodb.com → sign in
> 2. Left sidebar → **Database Access** (under "Security")
> 3. Find user `paraskaushik12` → click **Edit** (pencil icon)
> 4. Click **Edit Password** → set a new one or auto-generate → copy it
> 5. Click **Update User**
> 6. Paste it into `.env` replacing `YOUR_DB_PASSWORD_HERE`
>
> **Tip:** Avoid special characters (`@`, `#`, `%`, `/`) in the password — they need URL-encoding. Stick to letters and numbers.

> **CRITICAL: This file must NEVER be committed to git.** That's what `.gitignore` is for.

---

### FILE 2: `.gitignore` (MODIFY — project root)

**Why:** Prevents sensitive files and bulky folders from being committed.

**Full content:**
```gitignore
node_modules/
.env
```

**What changed:** Added `.env` line. The `node_modules/` format was normalized (was `/node_modules` before).

---

### FILE 3: `services/pdfGenerator.js` (CREATE — new folder `services/`)

**Why:** The WhatsApp API needs an actual PDF file to send. We can't use the browser's print dialog output. This file generates a PDF from the transaction data using `pdfkit`.

**How pdfkit works:**
1. Create a `PDFDocument` object (think of it as a blank page)
2. Add text, lines, tables to it using method calls
3. When you call `doc.end()`, it outputs the PDF bytes
4. We collect those bytes into a `Buffer` (a chunk of binary data in Node.js)

**Full content:**
```js
const PDFDocument = require("pdfkit");

/**
 * Generates a PDF buffer from transaction data.
 * Returns a Promise that resolves to a Buffer containing the PDF bytes.
 */
function generateInvoicePdf(transaction) {
 return new Promise((resolve, reject) => {
 const doc = new PDFDocument({ margin: 40, size: "A4" });
 const chunks = [];

 doc.on("data", (chunk) => chunks.push(chunk));
 doc.on("end", () => resolve(Buffer.concat(chunks)));
 doc.on("error", reject);

 // --- Header ---
 doc.fontSize(20).font("Helvetica-Bold").text("Perfect Collection", { align: "center" });
 doc.fontSize(10).font("Helvetica").text("(9899258797)", { align: "center" });
 doc.fontSize(9).text("SC-190, Jaipuria Sunrise Plaza, Indirapuram, GIZB, UP", { align: "center" });
 doc.moveDown();

 // --- Invoice info ---
 doc.fontSize(11).font("Helvetica-Bold").text(`Estimate No: ${transaction.transactionNumber}`);
 doc.font("Helvetica").text(`Date: ${transaction.createdAt}`);
 doc.text(`Payment: ${transaction.transactionType}`);
 if (transaction.customerName) {
 doc.text(`Customer: ${transaction.customerName}`);
 }
 doc.moveDown();

 // --- Items table ---
 doc.font("Helvetica-Bold");
 const tableTop = doc.y;
 doc.text("Item", 40, tableTop, { width: 150 });
 doc.text("Price", 190, tableTop, { width: 80, align: "right" });
 doc.text("Qty", 270, tableTop, { width: 60, align: "right" });
 doc.text("Total", 330, tableTop, { width: 80, align: "right" });
 doc.moveTo(40, doc.y + 2).lineTo(410, doc.y + 2).stroke();
 doc.moveDown(0.5);

 doc.font("Helvetica");
 for (const item of transaction.purchases) {
 const y = doc.y;
 doc.text(item.itemName, 40, y, { width: 150 });
 doc.text(String(item.itemPrice), 190, y, { width: 80, align: "right" });
 doc.text(String(item.itemQuantity), 270, y, { width: 60, align: "right" });
 doc.text(String(item.itemTotalPrice), 330, y, { width: 80, align: "right" });
 doc.moveDown(0.3);
 }

 doc.moveTo(40, doc.y + 2).lineTo(410, doc.y + 2).stroke();
 doc.moveDown();

 // --- Totals ---
 doc.font("Helvetica-Bold").fontSize(12);
 doc.text(`Total Items: ${transaction.totalItems}`, { align: "right" });
 doc.text(`Net Total: Rs.${transaction.netPrice}`, { align: "right" });
 doc.moveDown(2);

 // --- Footer ---
 doc.fontSize(10).font("Helvetica").text("FIXED PRICE SHOP", { align: "center" });
 doc.text("Thank you for your purchase!", { align: "center" });

 doc.end();
 });
}

module.exports = { generateInvoicePdf };
```

**Key design choices:**
- Uses `Helvetica` (built into pdfkit, no font files needed)
- Returns a `Buffer` (not a file) — we keep it in memory, upload it to Meta, then discard it. No temp files on disk.
- The layout matches the printed invoice: shop header → estimate info → items table → totals → footer

---

### FILE 4: `services/whatsapp.js` (CREATE)

**Why:** Handles all communication with Meta's WhatsApp Cloud API. Two main functions:
1. `uploadPdf()` — uploads the PDF to Meta's media storage
2. `sendInvoice()` — sends a template message with the uploaded PDF to the customer

**Full content:**
```js
const axios = require("axios");
const FormData = require("form-data");

const GRAPH_API_URL = "https://graph.facebook.com";

/**
 * Formats a phone number for WhatsApp API.
 * - If 10 digits, prepends India country code 91
 * - Strips any leading + or spaces
 */
function formatPhoneNumber(phone) {
 var cleaned = phone.replace(/[\s\-\+]/g, "");
 if (cleaned.length === 10) {
 cleaned = "91" + cleaned;
 }
 return cleaned;
}

/**
 * Uploads a PDF buffer to Meta's media API and returns the media ID.
 */
async function uploadPdf(pdfBuffer, filename) {
 var version = process.env.GRAPH_API_VERSION || "v25.0";
 var phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
 var token = process.env.WHATSAPP_TOKEN;

 var form = new FormData();
 form.append("messaging_product", "whatsapp");
 form.append("file", pdfBuffer, {
 filename: filename,
 contentType: "application/pdf",
 });
 form.append("type", "application/pdf");

 var response = await axios.post(
 `${GRAPH_API_URL}/${version}/${phoneNumberId}/media`,
 form,
 {
 headers: {
 Authorization: `Bearer ${token}`,
 ...form.getHeaders(),
 },
 }
 );

 return response.data.id;
}

/**
 * Sends a PDF invoice to a WhatsApp number using the
 * "perfectcollection_invoice" approved template.
 *
 * Template structure (Utility, en_US):
 * Header: document (the PDF invoice)
 * Body: "Hello {{1}}, Your invoice for order..."
 * {{1}} = customer name
 *
 * phoneNumber can be 10 digits (auto-prepends 91) or full international format.
 */
async function sendInvoice(phoneNumber, pdfBuffer, filename, customerName, invoiceNumber) {
 var formattedPhone = formatPhoneNumber(phoneNumber);
 var mediaId = await uploadPdf(pdfBuffer, filename);

 var version = process.env.GRAPH_API_VERSION || "v25.0";
 var phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
 var token = process.env.WHATSAPP_TOKEN;

 var response = await axios.post(
 `${GRAPH_API_URL}/${version}/${phoneNumberId}/messages`,
 {
 messaging_product: "whatsapp",
 to: formattedPhone,
 type: "template",
 template: {
 name: "perfectcollection_invoice",
 language: { code: "en_US" },
 components: [
 {
 type: "header",
 parameters: [
 {
 type: "document",
 document: {
 id: mediaId,
 filename: filename,
 },
 },
 ],
 },
 {
 type: "body",
 parameters: [
 {
 type: "text",
 text: customerName || "Customer",
 },
 {
 type: "text",
 text: String(invoiceNumber || "N/A"),
 },
 ],
 },
 ],
 },
 },
 {
 headers: {
 Authorization: `Bearer ${token}`,
 "Content-Type": "application/json",
 },
 }
 );

 return response.data;
}

module.exports = { sendInvoice, formatPhoneNumber };
```

**Key design choices:**
- `formatPhoneNumber()` auto-prepends `91` for 10-digit Indian numbers — shopkeeper doesn't need to type country code
- Upload and send are two separate API calls (that's how Meta's API works — you can't inline a file)
- The `components` array must exactly match the template structure. If your template has a header + body, you send header + body. If it also has a button, you must send button params too.
- Template name must match EXACTLY what's in WhatsApp Manager (case-sensitive)

> **IMPORTANT:** If you change the template name in WhatsApp Manager, you must update the `name: "perfectcollection_invoice"` string in this file to match.

---

### FILE 5: `package.json` (MODIFY)

**What changed:** Added 4 new dependencies.

**The `dependencies` section should look like:**
```json
"dependencies": {
 "axios": "^1.15.0",
 "chart.js": "^3.7.1",
 "dotenv": "^17.4.2",
 "ejs": "^2.6.1",
 "express": "^4.16.4",
 "express-ejs-layouts": "^2.5.0",
 "form-data": "^4.0.5",
 "moment": "^2.29.1",
 "mongodb": "^7.1.1",
 "mongoose": "^5.4.6",
 "nodemon": "^3.1.7",
 "pdfkit": "^0.18.0"
}
```

After editing, run `npm install` to actually download the packages.

---

### FILE 6: `index.js` (MODIFY)

**What changed:** Added 1 line at the very top.

**Why:** `dotenv` must be loaded before anything else tries to read `process.env`. If you load it after `config/mongoose.js`, the DB connection string won't be available yet.

**The change:**
```diff
+ require("dotenv").config();
 const express = require("express");
 const app = express();
 const port = process.env.PORT || 8000;
```

**Full file (for reference):**
```js
require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 8000;

app.use(express.json());
const db = require("./config/mongoose");

app.use(express.static("./assets"));
app.use(express.static("./"));

// extract style and scripts from sub pages into the layout
app.set("layout extractStyles", true);
app.set("layout extractScripts", true);

//app.use(express.urlencoded());
app.use(express.urlencoded({ extended: false }));
// use express router
app.use("/", require("./routes"));

// set up the view engine
app.set("view engine", "ejs");
app.set("views", "./views");

app.listen(port, function (err) {
 if (err) {
 console.log(`Error in running the server: ${err}`);
 }

 console.log(`Server is running on port: ${port}`);
});
```

---

### FILE 7: `config/mongoose.js` (MODIFY)

**What changed:** Replaced hardcoded MongoDB connection string with an environment variable (with fallback).

**The change:**
```diff
 const mongoose = require("mongoose");
- // mongoose.connect(
- // "mongodb+srv://paras:paras@cluster0.nqjsv.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
- // );
- mongoose.connect("mongodb://localhost/perfectCollectionDb");
+ mongoose.connect(process.env.MONGO_URI || "mongodb://localhost/perfectCollectionDb");
```

**Why:** The old code had hardcoded credentials in a comment (username `paras`, password `paras`). Using `process.env.MONGO_URI` lets you switch between local and Atlas without editing code. The `|| "mongodb://localhost/..."` is a fallback so it still works even without a `.env` file.

> **We are using MongoDB Atlas** (cloud-hosted) with connection string:
> `mongodb+srv://paraskaushik12:<db_password>@cluster0.omsux.mongodb.net/perfectCollectionDb?retryWrites=true&w=majority&appName=Cluster0`
> This is set in `.env` — the code itself just reads `process.env.MONGO_URI`.
>
> **IMPORTANT:** The `/perfectCollectionDb` database name in the URL is critical. Without it, Mongoose defaults to the `admin` database and you'll get "not authorized on admin" errors.

**Full file:**
```js
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost/perfectCollectionDb");
const db = mongoose.connection;
db.on("error", console.error.bind(console, "Error connecting to MongoDB"));
db.once("open", function () {
 console.log("Connected to Database :: MongoDB");
});
module.exports = db;
```

---

### FILE 8: `models/transaction.js` (MODIFY)

**What changed:** Added `customerName` and `phoneNumber` fields to the schema.

**The change (add these two fields after `transactionName`):**
```diff
 transactionName: {
 // customer name if possible
 type: String,
 },
+ customerName: {
+ type: String,
+ },
+ phoneNumber: {
+ type: String,
+ },
 transactionType: {
 type: String,
 },
```

**Why:** We need to store the customer's name and phone number with each transaction so we can:
1. Track who was sent a WhatsApp invoice
2. Show customer info in the profile/month views later
3. The existing `transactionName` field was never properly used — we keep it for backward compatibility but also add the properly named `customerName`

**Full file:**
```js
const mongoose = require("mongoose");
//import { Purchase } from "./purchase";
const transactionSchema = new mongoose.Schema(
 {
 transactionNumber: {
 // starts from 1 !
 type: Number,
 required: true,
 },
 transactionName: {
 // customer name if possible
 type: String,
 },
 customerName: {
 type: String,
 },
 phoneNumber: {
 type: String,
 },
 transactionType: {
 type: String,
 },
 remarks: {
 type: String,
 },
 shopname:{
 type:String,
 },
 purchases: [
 {
 itemNumber: {
 type: String,
 required: true,
 },
 itemName: {
 type: String,
 required: true,
 },
 itemPrice: {
 type: Number,
 required: true,
 },
 itemQuantity: {
 type: Number,
 required: true,
 },
 itemTotalPrice: {
 type: Number,
 required: true,
 },
 },
 ],
 totalItems: {
 type: Number,
 required: true,
 },
 totalPrice: {
 type: Number,
 required: true,
 },
 gstAsPerfive: {
 type: Number,
 },
 gstAsPertwel: {
 type: Number,
 },
 netPrice: {
 type: Number,
 required: true,
 },
 },
 {
 timestamps: true,
 }
);

const Transaction = mongoose.model("Transaction", transactionSchema);
module.exports = Transaction;
```

---

### FILE 9: `controllers/transaction_controller.js` (MODIFY — biggest change)

**What changed:** Complete rewrite. The old version used callbacks. The new version:
1. Uses `async/await` (cleaner, easier to read)
2. After saving the transaction, generates a PDF and sends it via WhatsApp
3. Returns proper JSON responses (not `res.redirect("back")`)
4. WhatsApp failure does NOT block the transaction — it's a best-effort add-on

**Full file:**
```js
const { json } = require("express");
const Transaction = require("../models/transaction");
const { generateInvoicePdf } = require("../services/pdfGenerator");
const { sendInvoice } = require("../services/whatsapp");
var moment = require("moment");

module.exports.create = async function (req, res) {
 var x = req.body;
 var myPurchases = [];
 for (var i = 0; i < x.purchases.length; i++) {
 var ob = {};
 ob["itemNumber"] = x.purchases[i].itemNumber;
 ob["itemName"] = x.purchases[i].itemName;
 ob["itemPrice"] = x.purchases[i].itemPrice;
 ob["itemQuantity"] = x.purchases[i].itemQuantity;
 ob["itemTotalPrice"] = x.purchases[i].itemTotalPrice;
 myPurchases.push(ob);
 }

 try {
 var transaction = await Transaction.create({
 transactionNumber: parseInt(x.transactionNumber),
 transactionName: x.customerName || "TBD",
 customerName: x.customerName || "",
 phoneNumber: x.phoneNumber || "",
 transactionType: x.transactionType,
 remarks: x.remarks,
 shopname: x.shopname,
 purchases: myPurchases,
 totalItems: parseInt(x.totalItems),
 totalPrice: parseInt(x.totalPrice),
 netPrice: parseInt(x.netPrice),
 gstAsPerfive: x.gstAsPerfive ? parseFloat(x.gstAsPerfive) : 0,
 gstAsPertwel: x.gstAsPertwel ? parseFloat(x.gstAsPertwel) : 0,
 createdAt: moment(x.createdAt),
 });

 console.log("Transaction saved:", transaction.transactionNumber);

 // --- WhatsApp Invoice Sending ---
 var phoneNumber = x.phoneNumber;
 var skipWhatsApp =
 !phoneNumber || phoneNumber.toUpperCase() === "NA" || phoneNumber.trim() === "";

 var whatsappStatus = "skipped";

 if (!skipWhatsApp) {
 try {
 var pdfBuffer = await generateInvoicePdf({
 transactionNumber: transaction.transactionNumber,
 createdAt: x.createdAt,
 transactionType: x.transactionType,
 customerName: x.customerName,
 purchases: myPurchases,
 totalItems: transaction.totalItems,
 netPrice: transaction.netPrice,
 });

 var filename = "PerfectCollection_Invoice_" + transaction.transactionNumber + ".pdf";

 await sendInvoice(phoneNumber, pdfBuffer, filename, x.customerName || "Customer", transaction.transactionNumber);
 whatsappStatus = "sent";
 console.log("WhatsApp invoice sent to " + phoneNumber);
 } catch (waError) {
 whatsappStatus = "failed";
 console.error("WhatsApp send failed:", waError.response ? waError.response.data : waError.message);
 // Don't fail the whole transaction — invoice was still saved
 }
 }

 return res.json({
 success: true,
 transactionId: transaction._id,
 whatsappStatus: whatsappStatus,
 });
 } catch (err) {
 console.log("Error in creating a transaction:", err);
 return res.status(500).json({ success: false, error: err.message });
 }
};
```

**Key design decisions explained:**

1. **`async/await` instead of callbacks:** The old code used `Transaction.create({}, function(err, post) {...})`. The new code uses `await Transaction.create({})`. This is simpler and lets us chain async operations (save → generate PDF → upload → send).

2. **Nested try/catch for WhatsApp:** The inner `try/catch` around WhatsApp means if the API call fails (bad token, network error, etc.), we catch it, log it, and continue. The transaction was already saved. The shopkeeper's print already happened. WhatsApp is "nice to have" — it should never break billing.

3. **`whatsappStatus` in the response:** The browser gets back `{ success: true, whatsappStatus: "sent" | "failed" | "skipped" }`. This lets the frontend show a message if needed.

4. **Phone number "NA" check:** If the shopkeeper typed "NA" or left it empty, we skip WhatsApp entirely. No API calls, no errors.

---

### FILE 10: `views/home.ejs` (MODIFY)

**What changed:**
1. Added a **phone number input** (green, at the top, autofocused)
2. Changed the old "Phone Number / remark" field to **"Customer Name"** (purple)
3. Removed `autofocus` from item number input (moved to phone input)

**The changed section (the input area, around line 55-70):**

**BEFORE:**
```html
 <input type="number" id="new-item-number" class="input-pair" name="itemNumber" placeholder="Enter Item Number"
 autofocus required style="height: 5 rem; margin: 1rem" onkeyup="additemNumberToListOnEnter(event)" />
 <input type="number" id="new-item-price-input" class="input-pair" name="new-item-price-input"
 placeholder="Enter Item Price" required style="height: 5 rem; margin: 1rem"
 onkeyup="additemNumberToListOnEnter(event)" />
 <input type="number" id="new-item-quantity-input" class="input-pair" name="new-item-quantity-input"
 placeholder="Enter Item Quantity" required style="height: 5 rem; margin: 1rem"
 onkeyup="additemNumberToListOnEnter(event)" />
 <input type="string" id="wild-input" class="wild" name="wild-input"
 style="height: 5 rem; margin: 1rem; color: white;" placeholder="Fill Phone Number /remark" />
```

**AFTER:**
```html
 <input type="tel" id="phone-input" class="phone-field" name="phone-input"
 placeholder="Customer Phone (or NA to skip WhatsApp)"
 autofocus required
 style="height: 5rem; margin: 1rem; font-size: 1.5rem; border: 3px solid green; background: #e8f5e9;"
 onkeyup="phoneFieldEnter(event)" />
 <input type="text" id="wild-input" class="wild" name="wild-input"
 style="height: 5rem; margin: 1rem; font-size: 1.3rem; border: 2px solid purple; background: #f3e5f5; color: black;"
 placeholder="Customer Name" />
 <input type="number" id="new-item-number" class="input-pair" name="itemNumber" placeholder="Enter Item Number"
 required style="height: 5 rem; margin: 1rem" onkeyup="additemNumberToListOnEnter(event)" />
 <input type="number" id="new-item-price-input" class="input-pair" name="new-item-price-input"
 placeholder="Enter Item Price" required style="height: 5 rem; margin: 1rem"
 onkeyup="additemNumberToListOnEnter(event)" />
 <input type="number" id="new-item-quantity-input" class="input-pair" name="new-item-quantity-input"
 placeholder="Enter Item Quantity" required style="height: 5 rem; margin: 1rem"
 onkeyup="additemNumberToListOnEnter(event)" />
```

**What changed and why:**
- **Phone input** (`phone-field` class, NOT `input-pair`) — has its own class so it doesn't interfere with the Enter-key item navigation. Green border/background to make it visually obvious.
- **Customer Name** replaces the old "Phone Number / remark" field. Purple styling. Uses `type="text"` instead of `type="string"`.
- **Item number** loses `autofocus` (phone input gets it instead).
- The old `wild-input` at the bottom is removed (replaced by the Customer Name field above item inputs).

**Input flow order:** Phone → Enter → Customer Name → Enter → Item Number → Price → Quantity → (repeat items) → SHIFT = Bill

---

### FILE 11: `assets/js/pdf.js` (MODIFY)

**This is the client-side JavaScript that controls the entire billing flow. Multiple changes:**

#### Change 1: Replace wild-input styling with phone focus

**BEFORE (inside `window.onload`, around line 62):**
```js
 document.getElementById("wild-input").style.background = "deeppink";
 document.getElementById("wild-input").style.color = "white";
```

**AFTER:**
```js
 document.getElementById("phone-input").focus();
```

**Why:** The old code styled the wild-input pink. Now we focus on the phone input instead (it's the first field the shopkeeper fills).

---

#### Change 2: Phone validation + customer name in BILL handler

**BEFORE (inside the `download` click handler, around line 195):**
```js
 completeTransactionJson["remarks"] =
 document.getElementById("wild-input").value;
 completeTransactionJson["shopname"] = localStorage.getItem("shopname");
 completeTransactionJson["createdAt"] =
 document.getElementById("page-date").value;
```

**AFTER:**
```js
 // Phone number — mandatory check
 var phoneNumber = document.getElementById("phone-input").value.trim();
 if (!phoneNumber) {
 alert("Phone number is required. Enter a number or type NA to skip WhatsApp.");
 window.location.reload();
 return;
 }

 // Must have at least one item
 if (!completeTransactionJson["purchases"] || completeTransactionJson["purchases"].length === 0) {
 alert("Add at least one item before billing.");
 window.location.reload();
 return;
 }

 completeTransactionJson["phoneNumber"] = phoneNumber;
 completeTransactionJson["customerName"] =
 document.getElementById("wild-input").value.trim();
 completeTransactionJson["remarks"] =
 document.getElementById("wild-input").value.trim();
 completeTransactionJson["shopname"] = localStorage.getItem("shopname");
 completeTransactionJson["createdAt"] =
 document.getElementById("page-date").value;
```

**Why:**
- Validates phone is not empty before billing
- Validates at least one item exists (prevents NaN errors in the database)
- Adds `phoneNumber` and `customerName` to the JSON that gets POSTed to the server
- `remarks` is set to customer name (for backward compatibility with existing views that read `remarks`)

---

#### Change 3: WhatsApp status in fetch response

**BEFORE:**
```js
 .then((data) => {
 console.log("Success:", data);
 // window.location.reload(); // Reload the page on success
 })
```

**AFTER:**
```js
 .then((data) => {
 console.log("Success:", data);
 if (data.whatsappStatus === "sent") {
 console.log("Invoice sent to WhatsApp!");
 } else if (data.whatsappStatus === "failed") {
 console.log("WhatsApp sending failed — invoice was saved though.");
 }
 })
```

**Why:** The server now returns `whatsappStatus` in the response. We log it so you can see in the browser console whether it worked.

---

#### Change 4: Add `phoneFieldEnter()` function

**Add this at the end of the file (after the `window.onload` block closes):**

```js
// When user presses Enter on the phone field, move focus to customer name
function phoneFieldEnter(event) {
 if (event.key === "Enter") {
 var phoneVal = document.getElementById("phone-input").value.trim();
 if (!phoneVal) {
 alert("Phone number is required. Enter a number or type NA to skip WhatsApp.");
 return;
 }
 document.getElementById("wild-input").focus();
 }
}
```

**Why:** When the shopkeeper presses Enter after typing the phone number, cursor moves to the Customer Name field. This is referenced by `onkeyup="phoneFieldEnter(event)"` in the HTML.

---

#### Change 5: Update wild-input Enter handler

**BEFORE:**
```js
document.getElementById("wild-input").addEventListener("keyup", (e) => {
 console.log("hi");
 e.preventDefault();
 var inputPair = document.querySelectorAll(".input-pair");
 if (e.key === "Enter") {
 document.getElementById("wild-input").disabled = true;
 inputPair[0].focus();
 }
});
```

**AFTER:**
```js
document.getElementById("wild-input").addEventListener("keyup", (e) => {
 e.preventDefault();
 if (e.key === "Enter") {
 document.getElementById("wild-input").disabled = true;
 document.getElementById("new-item-number").focus();
 }
});
```

**Why:** Removed `console.log("hi")` debug statement. Changed from `inputPair[0].focus()` to explicit `document.getElementById("new-item-number").focus()` — because the phone input is NOT in the `input-pair` class, so `inputPair[0]` correctly points to item number. But being explicit is safer.

---

## 6. The Complete Flow — What Happens When You Press SHIFT

Here's the exact sequence of events, step by step:

```
1. Shopkeeper opens http://localhost:8000
2. Phone input is autofocused (green field)
3. Types "9971313547" → presses Enter
4. Cursor moves to Customer Name (purple field)
5. Types "Rahul" → presses Enter
6. Customer Name locks, cursor moves to Item Number
7. Types item number, price, quantity → items appear in invoice
8. Presses SHIFT key
 │
 ├── 8a. JavaScript validates: phone not empty? items exist? ✓
 ├── 8b. Builds completeTransactionJson with all data + phoneNumber + customerName
 ├── 8c. Removes input panel from DOM
 ├── 8d. window.print() → browser print dialog opens
 ├── 8e. window.location.reload() starts (page will reload)
 ├── 8f. fetch("/transaction/create") fires with JSON body
 │ │
 │ └── SERVER RECEIVES THE REQUEST:
 │ │
 │ ├── 8f-i. Parse purchases array
 │ ├── 8f-ii. Save transaction to MongoDB (with customerName, phoneNumber)
 │ ├── 8f-iii. Check if phoneNumber is "NA" or empty → if yes, skip WhatsApp
 │ ├── 8f-iv. Generate PDF using pdfkit (services/pdfGenerator.js)
 │ │ → returns a Buffer of ~2KB
 │ ├── 8f-v. Upload PDF to Meta's media API
 │ │ POST https://graph.facebook.com/v25.0/{ID}/media
 │ │ → returns media_id
 │ ├── 8f-vi. Send template message with PDF to customer's WhatsApp
 │ │ POST https://graph.facebook.com/v25.0/{ID}/messages
 │ │ → template "perfectcollection_invoice" with:
 │ │ - Header: document (media_id)
 │ │ - Body: "Hello Rahul, Your invoice for order #5..."
 │ ├── 8f-vii. Return JSON: { success: true, whatsappStatus: "sent" }
 │ │
 │ └── If WhatsApp fails at any step (iv, v, or vi):
 │ → Log error, return { success: true, whatsappStatus: "failed" }
 │ → Transaction was already saved. Print already happened.
 │
 └── 8g. Page reloads → ready for next customer
```

---

## 7. Errors We Hit and How We Fixed Them

These are real errors from our testing session — documented here so you know what to expect:

### Error 1: `Number of parameters does not match (1 vs 2)`
```
code: 132000
details: "body: number of localizable_params (1) does not match the expected number of params (2)"
```
**Cause:** Template body has `{{1}}` and `{{2}}`, but we were only sending 1 parameter (customer name).
**Fix:** Added second parameter (invoice number) to the `body.parameters` array.

### Error 2: `Button at index 0 of type Url requires a parameter`
```
code: 131008
details: "buttons: Button at index 0 of type Url requires a parameter"
```
**Cause:** Template had a URL button with a dynamic parameter `{{1}}`, but we weren't sending a `button` component.
**Fix:** Either add a button component to the API call, OR remove the button from the template (we chose to remove it — simpler).

### Error 3: `Template name does not exist in the translation`
```
code: 132001
details: "template name (perfectcollection_invoice) does not exist in en_US"
```
**Cause:** After editing a template in WhatsApp Manager, Meta re-reviews it. During review, it's temporarily unavailable.
**Fix:** Wait for Meta to re-approve (minutes to hours). Don't edit approved templates unless necessary — create a new one instead.

### Error 4: `Authentication Error` (code 190)
**Cause:** The temporary access token expired (~24 hours).
**Fix:** Generate a new token from the Meta dashboard, or switch to a permanent System User token (see Next Steps).

### Error 5: `totalItems: NaN, totalPrice: NaN`
**Cause:** Billing triggered with no items in the table.
**Fix:** Added validation in pdf.js: check `completeTransactionJson["purchases"].length > 0` before proceeding.

### Error 6: `not authorized on admin to execute command { insert: "transactions" }`
```
code: 8000
codeName: 'AtlasError'
```
**Cause:** The Atlas connection string was missing the database name (`/perfectCollectionDb`). Without it, Mongoose defaults to the `admin` database, which your user doesn't have write access to.
**Fix:** Add `/perfectCollectionDb` between the hostname and `?` in the `MONGO_URI`:
```
BEFORE: mongodb+srv://user:pass@cluster0.omsux.mongodb.net/?appName=Cluster0
AFTER: mongodb+srv://user:pass@cluster0.omsux.mongodb.net/perfectCollectionDb?retryWrites=true&w=majority&appName=Cluster0
```

---

## 8. Next Steps to Go to Production

### 8.1 — Get a Permanent Access Token (CRITICAL)

The temporary token expires in ~24 hours. For production:

1. Go to https://business.facebook.com/settings
2. Left sidebar → **Users** → **System Users**
3. Click **Add** → name: "PerfectCollectionBot" → role: **Admin**
4. Click the system user → **Add Assets** → select your App → **Full Control** → Save
5. Click **Generate New Token** → select your app
6. Check permissions:
 - `whatsapp_business_messaging`
 - `whatsapp_business_management`
7. Click **Generate Token** → copy it (shown only once!)
8. Paste in `.env` as `WHATSAPP_TOKEN`

This token **never expires** unless you revoke it.

> **Docs:** https://developers.facebook.com/docs/whatsapp/business-management-api/get-started#system-user-access-tokens

### 8.2 — Register Your Real Phone Number

Currently using Meta's test number (+1 555 638 3018). For production:

1. Create a **real WhatsApp Business Account** (not test) at https://business.facebook.com
2. Complete **Business Verification** (Settings → Security Center → Start Verification)
 - Needs: GST certificate, utility bill, or other business docs
 - Takes: 1-3 business days
3. Once verified: WhatsApp Manager → Phone Numbers → **Add Phone Number**
4. Add your shop number (e.g., 9899258797)
5. Verify via SMS or voice call
6. Update `.env` with the new `WHATSAPP_PHONE_NUMBER_ID` (it will be different from the test one)

> **Docs:** https://developers.facebook.com/docs/whatsapp/cloud-api/get-started#add-a-phone-number

### 8.3 — Template Status

Ensure your `perfectcollection_invoice` template shows **"Active"** in WhatsApp Manager. If you edited it, it may be in review. Once active, it works.

### 8.4 — Remove Test-Mode Restrictions

With the test account, you can only send to manually pre-approved numbers. With a real business account + verified number, you can send to **any customer's WhatsApp** — no pre-approval needed.

### 8.5 — Messaging Limits

New WhatsApp Business numbers start with a limit of **1,000 messages/day**. As you send quality messages and maintain a good quality rating, Meta automatically increases this to 10K → 100K → unlimited.

> **Docs:** https://developers.facebook.com/docs/whatsapp/messaging-limits

### 8.6 — Pricing

WhatsApp Cloud API is **not free** in production:
- **Utility messages** (like invoices): ~₹0.35 per message in India
- First 1,000 conversations/month are free
- Billing through Meta's payment system

> **Pricing:** https://developers.facebook.com/docs/whatsapp/pricing

---

## 9. Reference Links

| Topic | URL |
|-------|-----|
| WhatsApp Cloud API — Getting Started | https://developers.facebook.com/docs/whatsapp/cloud-api/get-started |
| Send Template Messages | https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-message-templates |
| Media Upload API | https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media |
| Template Components (header, body, buttons) | https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages#template-object |
| Business Verification | https://developers.facebook.com/docs/development/release/business-verification |
| System User Access Tokens | https://developers.facebook.com/docs/whatsapp/business-management-api/get-started#system-user-access-tokens |
| Messaging Limits | https://developers.facebook.com/docs/whatsapp/messaging-limits |
| Pricing | https://developers.facebook.com/docs/whatsapp/pricing |
| Meta App Dashboard | https://developers.facebook.com/apps/ |
| WhatsApp Manager (Templates) | https://business.facebook.com/latest/whatsapp_manager/ |
| pdfkit Documentation | https://pdfkit.org/ |
| axios Documentation | https://axios-http.com/docs/intro |
| dotenv Documentation | https://github.com/motdotla/dotenv |

---

*Document generated on 19 April 2026. Covers all changes made to integrate WhatsApp Cloud API invoice sending into the PerfectCollection billing app.*

