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
 *   Header: document (the PDF invoice)
 *   Body:   "Hello {{1}}, Your invoice for order..."
 *           {{1}} = customer name
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
        language: { code: "en" },
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
