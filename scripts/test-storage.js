#!/usr/bin/env node

/**
 * Script untuk menguji file storage integration
 * Jalankan dengan: node scripts/test-storage.js
 */

import dotenv from "dotenv";
import {
  initStorage,
  uploadFile,
  getFileStream,
  deleteFile,
  getStorageMode,
} from "../src/lib/file-storage.js";

// Load environment variables
dotenv.config();

async function main() {
  console.log("🚀 File Storage Integration Test");
  console.log("=".repeat(50));

  try {
    // Show storage mode
    console.log(`📋 Storage Mode: ${getStorageMode().toUpperCase()}`);

    // Initialize storage
    console.log("🔧 Initializing storage...");
    await initStorage();

    // Test file upload
    console.log("📤 Testing file upload...");
    const testFileName = `test-storage-${Date.now()}.txt`;
    const testContent = Buffer.from("Hello from file storage test!");
    const filePath = await uploadFile(testFileName, testContent, "text/plain");
    console.log(`✅ File uploaded: ${filePath}`);

    // Test file download using stream
    console.log("📥 Testing file download...");
    const downloadStream = await getFileStream(filePath);
    const chunks = [];

    // Collect stream data
    await new Promise((resolve, reject) => {
      downloadStream.on("data", (chunk) => chunks.push(chunk));
      downloadStream.on("end", resolve);
      downloadStream.on("error", reject);
    });

    const downloadedContent = Buffer.concat(chunks);
    if (downloadedContent.toString() === testContent.toString()) {
      console.log("✅ File download: Content matches");
    } else {
      console.log("❌ File download: Content mismatch");
    }

    // Test file deletion
    console.log("🗑️  Testing file deletion...");
    await deleteFile(filePath);
    console.log("✅ File deleted successfully");

    console.log("\n🎉 File Storage Integration: All tests passed!");
  } catch (error) {
    console.error("❌ Storage test failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Test script failed:", error);
  process.exit(1);
});
