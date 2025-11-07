#!/usr/bin/env node

/**
 * Script untuk menguji integrasi MinIO
 * Jalankan dengan: node scripts/test-minio.js
 */

import dotenv from "dotenv";
import { testMinIOIntegration } from "../src/lib/minio.js";

// Load environment variables
dotenv.config();

async function main() {
  console.log("🚀 MinIO Integration Test");
  console.log("=".repeat(50));

  const success = await testMinIOIntegration();

  if (success) {
    console.log("\n✅ All tests completed successfully!");
    process.exit(0);
  } else {
    console.log("\n❌ Some tests failed!");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Test script failed:", error);
  process.exit(1);
});
