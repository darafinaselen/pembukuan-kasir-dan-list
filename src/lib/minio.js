import * as Minio from "minio";

// Initialize MinIO client
export const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: parseInt(process.env.MINIO_PORT || "9000"),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ROOT_USER || "minioadmin",
  secretKey: process.env.MINIO_ROOT_PASSWORD || "minioadminpassword",
});

export const BUCKET_NAME = process.env.MINIO_BUCKET || "my-bucket";

/**
 * Ensure bucket exists, create if not
 */
export async function ensureBucket() {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, "us-east-1");
      console.log(`Bucket ${BUCKET_NAME} created successfully`);
    }
  } catch (error) {
    console.error("Error ensuring bucket:", error);
    throw error;
  }
}

/**
 * Upload file to MinIO
 * @param {Buffer} buffer - File buffer
 * @param {string} fileName - File name with path
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} - File URL or path
 */
export async function uploadFile(buffer, fileName, contentType) {
  try {
    await ensureBucket();

    const metaData = {
      "Content-Type": contentType,
    };

    await minioClient.putObject(
      BUCKET_NAME,
      fileName,
      buffer,
      buffer.length,
      metaData
    );

    return fileName;
  } catch (error) {
    console.error("Error uploading file to MinIO:", error);
    throw error;
  }
}

/**
 * Get file from MinIO
 * @param {string} fileName - File name/path
 * @returns {Promise<Buffer>}
 */
export async function getFile(fileName) {
  try {
    const dataStream = await minioClient.getObject(BUCKET_NAME, fileName);
    const chunks = [];

    return new Promise((resolve, reject) => {
      dataStream.on("data", (chunk) => chunks.push(chunk));
      dataStream.on("end", () => resolve(Buffer.concat(chunks)));
      dataStream.on("error", reject);
    });
  } catch (error) {
    console.error("Error getting file from MinIO:", error);
    throw error;
  }
}

/**
 * Delete file from MinIO
 * @param {string} fileName - File name/path
 * @returns {Promise<void>}
 */
export async function deleteFile(fileName) {
  try {
    await minioClient.removeObject(BUCKET_NAME, fileName);
  } catch (error) {
    console.error("Error deleting file from MinIO:", error);
    throw error;
  }
}

/**
 * List files in a directory
 * @param {string} prefix - Directory prefix
 * @returns {Promise<Array>}
 */
export async function listFiles(prefix) {
  try {
    const objectsStream = minioClient.listObjects(BUCKET_NAME, prefix, true);
    const objects = [];

    return new Promise((resolve, reject) => {
      objectsStream.on("data", (obj) => objects.push(obj));
      objectsStream.on("end", () => resolve(objects));
      objectsStream.on("error", reject);
    });
  } catch (error) {
    console.error("Error listing files from MinIO:", error);
    throw error;
  }
}

/**
 * Generate presigned URL for downloading file
 * @param {string} fileName - File name/path
 * @param {number} expiry - Expiry time in seconds (default: 24 hours)
 * @returns {Promise<string>}
 */
export async function getPresignedUrl(fileName, expiry = 24 * 60 * 60) {
  try {
    const url = await minioClient.presignedGetObject(
      BUCKET_NAME,
      fileName,
      expiry
    );
    return url;
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    throw error;
  }
}
