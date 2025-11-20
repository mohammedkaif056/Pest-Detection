// Quick test to verify detection endpoint works locally
import axios from "axios";

async function testDetection() {
  try {
    console.log("Testing local detection endpoint...");
    
    // Create a small test image (1x1 pixel red PNG as base64)
    const testImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";
    
    const response = await axios.post(
      "http://localhost:5000/api/detect",
      { image: testImage },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 30000
      }
    );
    
    console.log("\n✅ Detection successful!");
    console.log("Response:", JSON.stringify(response.data, null, 2));
    
    // Check key fields
    if (response.data.pestName) {
      console.log("\n✅ pestName:", response.data.pestName);
    }
    if (response.data.confidence !== undefined) {
      console.log("✅ confidence:", response.data.confidence);
    }
    if (response.data.symptoms) {
      console.log("✅ symptoms:", response.data.symptoms.length, "items");
    }
    
  } catch (error: any) {
    console.error("\n❌ Detection failed!");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error("Error:", error.message);
    }
  }
}

testDetection();
