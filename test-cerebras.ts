/**
 * Test script for Cerebras Qwen 3 235B API
 * Run with: npx tsx test-cerebras.ts
 */

import { testCerebrasConnection, generateDiseaseInfoWithCerebras } from "./server/cerebras";

async function runTests() {
  console.log("=".repeat(60));
  console.log("CEREBRAS QWEN 3 235B API TEST");
  console.log("=".repeat(60));
  console.log();

  // Test 1: Basic connection
  console.log("TEST 1: API Connection Test");
  console.log("-".repeat(60));
  const connectionSuccess = await testCerebrasConnection();
  console.log();

  if (!connectionSuccess) {
    console.error("❌ API connection failed. Stopping tests.");
    process.exit(1);
  }

  // Test 2: Generate disease info
  console.log("TEST 2: Disease Information Generation");
  console.log("-".repeat(60));
  try {
    const diseaseInfo = await generateDiseaseInfoWithCerebras("Tomato Late Blight", 0.92);
    console.log("✅ Disease info generated successfully:");
    console.log(JSON.stringify(diseaseInfo, null, 2));
    console.log();
  } catch (error) {
    console.error("❌ Disease info generation failed:", error);
  }

  // Test 3: Generate info for another disease
  console.log("TEST 3: Another Disease Test");
  console.log("-".repeat(60));
  try {
    const diseaseInfo2 = await generateDiseaseInfoWithCerebras("Powdery Mildew", 0.88);
    console.log("✅ Disease info generated successfully:");
    console.log(JSON.stringify(diseaseInfo2, null, 2));
    console.log();
  } catch (error) {
    console.error("❌ Disease info generation failed:", error);
  }

  console.log("=".repeat(60));
  console.log("✅ ALL TESTS COMPLETED");
  console.log("=".repeat(60));
}

runTests().catch(console.error);
