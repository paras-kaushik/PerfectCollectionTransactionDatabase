const axios = require('axios');

const verifyNoNameFlow = async () => {
  console.log("Starting verification of Customer Name removal from POS flow...");
  try {
    // 1. Fetch home.ejs HTML
    const homeRes = await axios.get('http://localhost:8000/');
    const homeHtml = homeRes.data;

    // Check that wild-input is removed
    if (!homeHtml.includes('id="wild-input"')) {
      console.log("✅ Customer Name input (wild-input) is successfully removed from HTML.");
    } else {
      console.error("❌ Customer Name input (wild-input) is still present in HTML!");
      process.exit(1);
    }

    // 2. Fetch pdf.js content
    const jsRes = await axios.get('http://localhost:8000/js/pdf.js');
    const jsContent = jsRes.data;

    // Check that phoneFieldEnter targets new-item-number
    if (jsContent.includes('document.getElementById("new-item-number").focus()') &&
        jsContent.includes('phoneFieldEnter')) {
      console.log("✅ Enter on phone-input successfully targets new-item-number directly.");
    } else {
      console.error("❌ Enter on phone-input does not target new-item-number!");
      process.exit(1);
    }

    // Check that wild-input key listener is removed
    if (!jsContent.includes('document.getElementById("wild-input").addEventListener')) {
      console.log("✅ Customer Name key listener has been removed from JS.");
    } else {
      console.error("❌ Customer Name key listener is still present in JS!");
      process.exit(1);
    }

    // Check that default values are set
    if (jsContent.includes('completeTransactionJson["customerName"] = "Customer"') &&
        jsContent.includes('completeTransactionJson["remarks"] = "Customer"')) {
      console.log("✅ Transaction payload correctly defaults customerName and remarks to 'Customer'.");
    } else {
      console.error("❌ Default values for customerName/remarks are incorrect!");
      process.exit(1);
    }

    console.log("🎉 All checks for Customer Name removal passed successfully!");
  } catch (err) {
    console.error("❌ Verification failed with error:", err.message);
    process.exit(1);
  }
};

verifyNoNameFlow();
