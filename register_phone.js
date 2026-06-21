require('dotenv').config();
const axios = require('axios');

async function registerNumber() {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const version = process.env.GRAPH_API_VERSION || 'v20.0';
  
  // Set the 6-digit PIN via environment variable WHATSAPP_PIN or CLI arg
  const pin = process.env.WHATSAPP_PIN || process.argv[2];

  if (!token || !phoneId) {
    console.error("Error: WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID is missing from .env");
    process.exit(1);
  }

  if (!pin || pin.length !== 6 || !/^\d+$/.test(pin)) {
    console.error("Error: Please provide a valid 6-digit numerical PIN. E.g., WHATSAPP_PIN=123456 node register_phone.js");
    process.exit(1);
  }

  const url = `https://graph.facebook.com/${version}/${phoneId}/register`;

  console.log(`Sending POST request to: ${url}`);
  console.log(`Using PIN: ******`);

  try {
    const response = await axios.post(url, {
      messaging_product: "whatsapp",
      pin: pin
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log("Success! Response data:", response.data);
  } catch (error) {
    console.error("Registration failed.");
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error("Details:", error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

registerNumber();
