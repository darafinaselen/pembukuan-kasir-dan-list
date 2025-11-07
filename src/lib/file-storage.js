import fs from "fs/promises";
import path from "path";
import { minioClient, BUCKET_NAME, ensureBucket } from "./minio.js";

// Storage mode: 'local' or 'minio'
const STORAGE_MODE = process.env.FILE_STORAGE_MODE || "local";
const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

console.log(`🗄️  File Storage Mode: ${STORAGE_MODE.toUpperCase()}`);

/**
 * Initialize storage (create directories or buckets as needed)
 */
export async function initStorage() {
  if (STORAGE_MODE === "local") {
    try {
      await fs.mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
      console.log(`✅ Local upload directory ready: ${LOCAL_UPLOAD_DIR}`);
    } catch (error) {
      console.error("❌ Error creating local upload directory:", error.message);
      throw error;
    }
  } else if (STORAGE_MODE === "minio") {
    try {
      await ensureBucket();
      console.log(`✅ MinIO storage initialized with bucket: ${BUCKET_NAME}`);
    } catch (error) {
      console.error("❌ Error initializing MinIO storage:", error.message);
      throw error;
    }
  }
}

/**
 * Upload a file buffer to storage
 * @param {string} fileName - Name to save the file as
 * @param {Buffer} buffer - File buffer
 * @param {string} mimeType - File MIME type
 * @returns {Promise<string>} File path or URL
 */
export async function uploadFile(fileName, buffer, mimeType) {
  if (STORAGE_MODE === "local") {
    const filePath = path.join(LOCAL_UPLOAD_DIR, fileName);
    await fs.writeFile(filePath, buffer);
    return `/uploads/${fileName}`; // Return relative URL path
  } else if (STORAGE_MODE === "minio") {
    await minioClient.putObject(BUCKET_NAME, fileName, buffer, buffer.length, {
      "Content-Type": mimeType,
    });
    return fileName; // Return object key
  }
  throw new Error(`Unknown storage mode: ${STORAGE_MODE}`);
}

/**
 * Get file URL or path
 * @param {string} fileKey - File key/path
 * @returns {Promise<string>} Accessible URL
 */
export async function getFileUrl(fileKey) {
  if (STORAGE_MODE === "local") {
    return fileKey; // Already a relative URL path like /uploads/xxx
  } else if (STORAGE_MODE === "minio") {
    // Generate presigned URL valid for 24 hours
    return await minioClient.presignedGetObject(
      BUCKET_NAME,
      fileKey,
      24 * 60 * 60
    );
  }
  throw new Error(`Unknown storage mode: ${STORAGE_MODE}`);
}

/**
 * Delete a file from storage
 * @param {string} fileKey - File key/path
 */
export async function deleteFile(fileKey) {
  if (STORAGE_MODE === "local") {
    const filePath = path.join(process.cwd(), "public", fileKey);
    await fs.unlink(filePath);
  } else if (STORAGE_MODE === "minio") {
    await minioClient.removeObject(BUCKET_NAME, fileKey);
  }
}

/**
 * Get file stream for download
 * @param {string} fileKey - File key/path
 * @returns {Promise<ReadableStream>}
 */
export async function getFileStream(fileKey) {
  if (STORAGE_MODE === "local") {
    const filePath = path.join(process.cwd(), "public", fileKey);
    return await fs.readFile(filePath);
  } else if (STORAGE_MODE === "minio") {
    return await minioClient.getObject(BUCKET_NAME, fileKey);
  }
  throw new Error(`Unknown storage mode: ${STORAGE_MODE}`);
}

/**
 * Get current storage mode
 */
export function getStorageMode() {
  return STORAGE_MODE;
}
