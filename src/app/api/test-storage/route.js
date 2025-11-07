/**
 * API endpoint untuk cek status storage
 */
import { getStorageMode } from "@/lib/file-storage";
import { testMinIOIntegration } from "@/lib/minio";

export async function GET() {
  try {
    const storageMode = getStorageMode();

    let minioStatus = null;
    if (storageMode === "minio") {
      minioStatus = await testMinIOIntegration();
    }

    return Response.json({
      success: true,
      data: {
        storageMode,
        minioStatus,
        environment: {
          MINIO_ENDPOINT: process.env.MINIO_ENDPOINT,
          MINIO_PORT: process.env.MINIO_PORT,
          MINIO_BUCKET: process.env.MINIO_BUCKET,
          FILE_STORAGE_MODE: process.env.FILE_STORAGE_MODE,
        },
      },
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
