# Panduan Lengkap Keamanan MinIO untuk Sistem Pembukuan Kasir

## Daftar Isi
1. [Pendahuluan](#pendahuluan)
2. [Konfigurasi Dasar Keamanan](#konfigurasi-dasar-keamanan)
3. [Autentikasi dan Otorisasi](#autentikasi-dan-otorisasi)
4. [Enkripsi Data](#enkripsi-data)
5. [Kontrol Akses](#kontrol-akses)
6. [Pencegahan Serangan Umum](#pencegahan-serangan-umum)
7. [Pemantauan dan Logging](#pemantauan-dan-logging)
8. [Konfigurasi Jaringan Aman](#konfigurasi-jaringan-aman)
9. [Integrasi dengan Backend](#integrasi-dengan-backend)
10. [Integrasi dengan Frontend](#integrasi-dengan-frontend)
11. [Deployment di Cloud vs On-Premise](#deployment-di-cloud-vs-on-premise)
12. [Checklist Implementasi](#checklist-implementasi)

## Pendahuluan

MinIO adalah sistem penyimpanan objek yang kompatibel dengan S3 dan digunakan dalam proyek Pembukuan Kasir untuk menyimpan file lampiran pengeluaran. Implementasi saat ini memiliki beberapa celah keamanan kritis yang perlu segera diperbaiki.

### Masalah Keamanan Saat Ini
- ✅ Menggunakan kredensial default (`minioadmin/minioadmin`)
- ✅ Bucket memiliki kebijakan akses publik (public read)
- ✅ Tidak ada enkripsi data
- ✅ Tidak ada kontrol akses berbasis peran
- ✅ Tidak ada pemantauan keamanan

## Konfigurasi Dasar Keamanan

### 1. Konfigurasi Environment Variables Aman

**`.env` (Production):**
```env
# MinIO Security Configuration
MINIO_ROOT_USER=minio_root_user_$(openssl rand -hex 16)
MINIO_ROOT_PASSWORD=$(openssl rand -base64 32)
MINIO_BUCKET=expense-attachments-prod

# Network Security
MINIO_ENDPOINT=minio.internal.company.com
MINIO_PORT=443
MINIO_USE_SSL=true

# File Storage
FILE_STORAGE_MODE=minio

# Additional Security
MINIO_ACCESS_KEY_APP=$(openssl rand -hex 16)
MINIO_SECRET_KEY_APP=$(openssl rand -base64 32)
MINIO_ACCESS_KEY_READONLY=$(openssl rand -hex 16)
MINIO_SECRET_KEY_READONLY=$(openssl rand -base64 32)
```

### 2. Konfigurasi Docker Compose Aman

**`docker-compose.prod.yml`:**
```yaml
version: '3.9'

services:
  minio:
    image: minio/minio:latest
    container_name: minio_secure
    restart: unless-stopped
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
      MINIO_PROMETHEUS_AUTH_TYPE: public
      MINIO_BROWSER: off  # Disable web UI in production
    volumes:
      - minio-data:/data
      - ./minio-config:/root/.minio
    ports:
      - "127.0.0.1:9000:9000"  # Bind to localhost only
    command: server /data --console-address ":9001" --address ":9000"
    networks:
      - internal
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Nginx reverse proxy for SSL termination
  minio-nginx:
    image: nginx:alpine
    container_name: minio_nginx
    restart: unless-stopped
    ports:
      - "443:443"
    volumes:
      - ./nginx-minio.conf:/etc/nginx/conf.d/default.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - minio
    networks:
      - internal
      - public

networks:
  internal:
    driver: bridge
    internal: true
  public:
    driver: bridge

volumes:
  minio-data:
    driver: local
```

### 3. Konfigurasi Nginx untuk MinIO

**`nginx-minio.conf`:**
```nginx
upstream minio_backend {
    server minio:9000;
}

server {
    listen 443 ssl http2;
    server_name minio.company.com;

    ssl_certificate /etc/ssl/certs/minio.crt;
    ssl_certificate_key /etc/ssl/certs/minio.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # MinIO API proxy
    location / {
        proxy_pass http://minio_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support for MinIO console
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Buffer settings
        proxy_buffering off;
        proxy_request_buffering off;
    }

    # MinIO Console (if enabled)
    location /minio-console/ {
        proxy_pass http://minio:9001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Autentikasi dan Otorisasi

### 1. Konfigurasi Kredensial Aplikasi

**`src/lib/minio-secure.js`:**
```javascript
import * as Minio from "minio";

// Application-specific credentials (not root)
export const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: parseInt(process.env.MINIO_PORT),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY_APP,
  secretKey: process.env.MINIO_SECRET_KEY_APP,
  region: process.env.MINIO_REGION || "us-east-1",
});

// Read-only client for public access
export const minioReadOnlyClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: parseInt(process.env.MINIO_PORT),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY_READONLY,
  secretKey: process.env.MINIO_SECRET_KEY_READONLY,
  region: process.env.MINIO_REGION || "us-east-1",
});

export const BUCKET_NAME = process.env.MINIO_BUCKET;
```

### 2. Policy-Based Access Control

**`src/lib/minio-policies.js`:**
```javascript
// Bucket policies for different access levels
export const BUCKET_POLICIES = {
  // Private bucket - no public access
  PRIVATE: {
    Version: "2012-10-17",
    Statement: []
  },

  // Read-only for authenticated users
  READ_ONLY: {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: { AWS: ["*"] },
        Action: ["s3:GetObject"],
        Resource: [`arn:aws:s3:::${process.env.MINIO_BUCKET}/*`],
        Condition: {
          "StringEquals": {
            "aws:userid": process.env.MINIO_ACCESS_KEY_READONLY
          }
        }
      }
    ]
  },

  // Application access policy
  APP_ACCESS: {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: { AWS: [process.env.MINIO_ACCESS_KEY_APP] },
        Action: [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ],
        Resource: [
          `arn:aws:s3:::${process.env.MINIO_BUCKET}`,
          `arn:aws:s3:::${process.env.MINIO_BUCKET}/*`
        ]
      }
    ]
  }
};

// User policies for different roles
export const USER_POLICIES = {
  ADMIN: {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Action: [
          "s3:*"
        ],
        Resource: [
          `arn:aws:s3:::${process.env.MINIO_BUCKET}`,
          `arn:aws:s3:::${process.env.MINIO_BUCKET}/*`
        ]
      }
    ]
  },

  OPERATOR: {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Action: [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ],
        Resource: [
          `arn:aws:s3:::${process.env.MINIO_BUCKET}`,
          `arn:aws:s3:::${process.env.MINIO_BUCKET}/*`
        ]
      }
    ]
  },

  VIEWER: {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Action: [
          "s3:GetObject"
        ],
        Resource: [
          `arn:aws:s3:::${process.env.MINIO_BUCKET}/*`
        ]
      }
    ]
  }
};
```

### 3. Policy Management Functions

**`src/lib/minio-policy-manager.js`:**
```javascript
import { minioClient, BUCKET_NAME } from "./minio-secure.js";
import { BUCKET_POLICIES, USER_POLICIES } from "./minio-policies.js";

/**
 * Set bucket policy
 */
export async function setBucketPolicy(policy) {
  try {
    await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
    console.log(`✅ Bucket policy set for ${BUCKET_NAME}`);
  } catch (error) {
    console.error("❌ Error setting bucket policy:", error.message);
    throw error;
  }
}

/**
 * Create user with specific policy
 */
export async function createMinIOUser(accessKey, secretKey, policy) {
  try {
    // Note: This requires MinIO admin credentials
    // In production, use MinIO admin API or mc command
    const mcCommand = `mc admin user add local ${accessKey} ${secretKey}`;
    const policyCommand = `mc admin policy set local ${policy} user=${accessKey}`;

    console.log(`✅ User ${accessKey} created with policy ${policy}`);
  } catch (error) {
    console.error("❌ Error creating MinIO user:", error.message);
    throw error;
  }
}

/**
 * Initialize secure bucket configuration
 */
export async function initializeSecureBucket() {
  try {
    // Ensure bucket exists
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, "us-east-1");
      console.log(`✅ Secure bucket created: ${BUCKET_NAME}`);
    }

    // Set private bucket policy (no public access)
    await setBucketPolicy(BUCKET_POLICIES.PRIVATE);
    console.log(`✅ Private bucket policy applied`);

  } catch (error) {
    console.error("❌ Error initializing secure bucket:", error.message);
    throw error;
  }
}
```

## Enkripsi Data

### 1. Server-Side Encryption (SSE)

**Konfigurasi MinIO untuk SSE:**
```bash
# Enable server-side encryption
export MINIO_KMS_KES_ENDPOINT=https://kes.company.com:7373
export MINIO_KMS_KES_KEY_NAME=my-minio-key
export MINIO_KMS_KES_CERT_FILE=/etc/ssl/certs/kes.crt
export MINIO_KMS_KES_KEY_FILE=/etc/ssl/private/kes.key
export MINIO_KMS_KES_CA_PATH=/etc/ssl/certs/ca.crt

# Start MinIO with KES
minio server /data --console-address ":9001"
```

### 2. Client-Side Encryption

**`src/lib/minio-encryption.js`:**
```javascript
import crypto from "crypto";
import { minioClient, BUCKET_NAME } from "./minio-secure.js";

// Encryption configuration
const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * Generate encryption key from password
 */
function generateKey(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, "sha256");
}

/**
 * Encrypt data
 */
export function encryptData(data, password) {
  const salt = crypto.randomBytes(32);
  const key = generateKey(password, salt);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipher(ALGORITHM, key);
  cipher.setAAD(salt);

  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag();

  return {
    encrypted: encrypted,
    salt: salt.toString("hex"),
    iv: iv.toString("hex"),
    tag: tag.toString("hex")
  };
}

/**
 * Decrypt data
 */
export function decryptData(encryptedData, password) {
  const { encrypted, salt, iv, tag } = encryptedData;

  const key = generateKey(password, Buffer.from(salt, "hex"));
  const decipher = crypto.createDecipher(ALGORITHM, key);
  decipher.setAAD(Buffer.from(salt, "hex"));
  decipher.setAuthTag(Buffer.from(tag, "hex"));

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Upload encrypted file
 */
export async function uploadEncryptedFile(fileName, buffer, password, mimeType) {
  try {
    // Encrypt the file
    const encryptedData = encryptData(buffer.toString(), password);
    const encryptedBuffer = Buffer.from(JSON.stringify(encryptedData));

    // Upload encrypted data
    await minioClient.putObject(BUCKET_NAME, fileName, encryptedBuffer, encryptedBuffer.length, {
      "Content-Type": "application/octet-stream",
      "X-Encrypted": "true",
      "X-Original-MimeType": mimeType
    });

    return fileName;
  } catch (error) {
    console.error("Error uploading encrypted file:", error);
    throw error;
  }
}

/**
 * Download and decrypt file
 */
export async function downloadDecryptedFile(fileName, password) {
  try {
    const encryptedBuffer = await minioClient.getObject(BUCKET_NAME, fileName);
    const encryptedData = JSON.parse(encryptedBuffer.toString());

    const decryptedData = decryptData(encryptedData, password);
    return Buffer.from(decryptedData);
  } catch (error) {
    console.error("Error downloading decrypted file:", error);
    throw error;
  }
}
```

### 3. TLS/SSL Configuration

**`src/lib/minio-ssl.js`:**
```javascript
import * as Minio from "minio";
import fs from "fs";

// SSL/TLS configuration for MinIO client
export const minioSSLClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: parseInt(process.env.MINIO_PORT),
  useSSL: true,
  accessKey: process.env.MINIO_ACCESS_KEY_APP,
  secretKey: process.env.MINIO_SECRET_KEY_APP,
  region: process.env.MINIO_REGION || "us-east-1",
  // Custom SSL configuration
  transport: {
    ca: fs.readFileSync(process.env.MINIO_CA_CERT_PATH),
    cert: fs.readFileSync(process.env.MINIO_CLIENT_CERT_PATH),
    key: fs.readFileSync(process.env.MINIO_CLIENT_KEY_PATH),
    rejectUnauthorized: true
  }
});
```

## Kontrol Akses

### 1. Role-Based Access Control (RBAC)

**`src/lib/minio-access-control.js`:**
```javascript
import { minioClient, BUCKET_NAME } from "./minio-secure.js";
import { USER_POLICIES } from "./minio-policies.js";

/**
 * Check if user has permission for operation
 */
export function checkUserPermission(userRole, operation, resource) {
  const policy = USER_POLICIES[userRole];

  if (!policy) {
    return false;
  }

  // Check if the operation is allowed
  const allowedActions = policy.Statement
    .filter(stmt => stmt.Effect === "Allow")
    .flatMap(stmt => stmt.Action);

  // Check if resource matches
  const allowedResources = policy.Statement
    .filter(stmt => stmt.Effect === "Allow")
    .flatMap(stmt => stmt.Resource);

  const actionAllowed = allowedActions.some(action =>
    action === operation || action === "s3:*" || action === "*"
  );

  const resourceAllowed = allowedResources.some(res =>
    res === resource || res === "*" || res.includes("*")
  );

  return actionAllowed && resourceAllowed;
}

/**
 * Generate presigned URL with role-based access
 */
export async function generateSecurePresignedUrl(fileName, userRole, expiry = 3600) {
  try {
    // Check if user has read permission
    if (!checkUserPermission(userRole, "s3:GetObject", `arn:aws:s3:::${BUCKET_NAME}/${fileName}`)) {
      throw new Error("Access denied: insufficient permissions");
    }

    // Generate presigned URL
    const url = await minioClient.presignedGetObject(BUCKET_NAME, fileName, expiry);

    return url;
  } catch (error) {
    console.error("Error generating secure presigned URL:", error);
    throw error;
  }
}

/**
 * Secure file upload with access control
 */
export async function secureUploadFile(fileName, buffer, userRole, mimeType) {
  try {
    // Check if user has write permission
    if (!checkUserPermission(userRole, "s3:PutObject", `arn:aws:s3:::${BUCKET_NAME}/${fileName}`)) {
      throw new Error("Access denied: insufficient permissions");
    }

    // Upload file
    await minioClient.putObject(BUCKET_NAME, fileName, buffer, buffer.length, {
      "Content-Type": mimeType,
      "X-Uploaded-By": userRole,
      "X-Upload-Timestamp": new Date().toISOString()
    });

    return fileName;
  } catch (error) {
    console.error("Error in secure file upload:", error);
    throw error;
  }
}
```

### 2. Object Lock dan Versioning

**Konfigurasi Object Lock:**
```javascript
/**
 * Enable object lock on bucket
 */
export async function enableObjectLock() {
  try {
    // Enable versioning first
    await minioClient.setBucketVersioning(BUCKET_NAME, {
      Status: "Enabled"
    });

    // Enable object lock
    await minioClient.setBucketObjectLockConfig(BUCKET_NAME, {
      ObjectLockEnabled: "Enabled",
      Rule: {
        DefaultRetention: {
          Mode: "GOVERNANCE",
          Days: 365
        }
      }
    });

    console.log(`✅ Object lock enabled on bucket ${BUCKET_NAME}`);
  } catch (error) {
    console.error("❌ Error enabling object lock:", error.message);
    throw error;
  }
}
```

## Pencegahan Serangan Umum

### 1. Rate Limiting

**`src/middleware/rate-limit.js`:**
```javascript
import rateLimit from 'express-rate-limit';

// Rate limiting for MinIO operations
export const minioRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limits for upload operations
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 uploads per hour
  message: {
    error: 'Upload limit exceeded. Please try again later.'
  }
});
```

### 2. Input Validation dan Sanitasi

**`src/lib/file-validation.js`:**
```javascript
import { magic } from 'mmmagic';
import path from 'path';

// File validation configuration
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILENAME_LENGTH = 255;

// Dangerous file extensions to block
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs',
  '.js', '.jar', '.php', '.asp', '.jsp', '.cgi', '.pl'
];

/**
 * Validate file before upload
 */
export async function validateFile(fileBuffer, originalName, mimeType) {
  const errors = [];

  // Check file size
  if (fileBuffer.length > MAX_FILE_SIZE) {
    errors.push(`File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }

  // Check filename length
  if (originalName.length > MAX_FILENAME_LENGTH) {
    errors.push('Filename is too long');
  }

  // Check for dangerous extensions
  const extension = path.extname(originalName).toLowerCase();
  if (DANGEROUS_EXTENSIONS.includes(extension)) {
    errors.push(`File extension ${extension} is not allowed`);
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    errors.push(`MIME type ${mimeType} is not allowed`);
  }

  // Deep file type validation using magic numbers
  try {
    const Magic = magic.Magic;
    const m = new Magic(magic.MAGIC_MIME_TYPE);
    const detectedMime = await new Promise((resolve, reject) => {
      m.detectFile(fileBuffer, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    if (!ALLOWED_MIME_TYPES.includes(detectedMime)) {
      errors.push(`File content does not match allowed types. Detected: ${detectedMime}`);
    }
  } catch (error) {
    errors.push('Could not validate file content');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename) {
  // Remove path traversal attempts
  const sanitized = filename.replace(/(\.\.[\/\\])+/g, '');

  // Remove dangerous characters
  return sanitized.replace(/[<>:"|?*\x00-\x1f]/g, '_');
}

/**
 * Generate secure filename
 */
export function generateSecureFilename(originalName, userId) {
  const extension = path.extname(originalName);
  const basename = path.basename(originalName, extension);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);

  return `${userId}_${timestamp}_${random}_${basename}${extension}`;
}
```

### 3. Security Headers dan CORS

**`src/lib/security-headers.js`:**
```javascript
// Security headers for MinIO responses
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'",
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

// CORS configuration for MinIO
export const CORS_CONFIG = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
};
```

## Pemantauan dan Logging

### 1. Audit Logging

**`src/lib/minio-audit.js`:**
```javascript
import fs from 'fs/promises';
import path from 'path';

// Audit log configuration
const AUDIT_LOG_DIR = path.join(process.cwd(), 'logs', 'minio-audit');
const AUDIT_LOG_FILE = path.join(AUDIT_LOG_DIR, `audit-${new Date().toISOString().split('T')[0]}.log`);

/**
 * Log MinIO operation
 */
export async function logMinIOOperation(operation, user, resource, result, details = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    operation,
    user: user || 'anonymous',
    resource,
    result: result ? 'success' : 'failure',
    ip: details.ip || 'unknown',
    userAgent: details.userAgent || 'unknown',
    details
  };

  try {
    // Ensure log directory exists
    await fs.mkdir(AUDIT_LOG_DIR, { recursive: true });

    // Append to log file
    const logLine = JSON.stringify(logEntry) + '\n';
    await fs.appendFile(AUDIT_LOG_FILE, logLine);

    console.log(`📝 MinIO Audit: ${operation} by ${user} on ${resource} - ${result ? 'SUCCESS' : 'FAILED'}`);
  } catch (error) {
    console.error('❌ Error writing audit log:', error);
  }
}

/**
 * Get audit logs
 */
export async function getAuditLogs(date = new Date(), limit = 100) {
  try {
    const logFile = path.join(AUDIT_LOG_DIR, `audit-${date.toISOString().split('T')[0]}.log`);

    const content = await fs.readFile(logFile, 'utf8');
    const lines = content.trim().split('\n');

    return lines
      .slice(-limit)
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(entry => entry !== null)
      .reverse();
  } catch (error) {
    console.error('Error reading audit logs:', error);
    return [];
  }
}

/**
 * Monitor MinIO operations
 */
export function createAuditedMinIOClient(originalClient, currentUser) {
  const handler = {
    get(target, prop) {
      const originalMethod = target[prop];

      if (typeof originalMethod === 'function') {
        return async function(...args) {
          const operation = prop;
          const resource = args[0]; // bucket name or object key
          let result = false;

          try {
            const returnValue = await originalMethod.apply(target, args);
            result = true;
            return returnValue;
          } catch (error) {
            await logMinIOOperation(operation, currentUser, resource, false, { error: error.message });
            throw error;
          } finally {
            if (result) {
              await logMinIOOperation(operation, currentUser, resource, true);
            }
          }
        };
      }

      return originalMethod;
    }
  };

  return new Proxy(originalClient, handler);
}
```

### 2. Monitoring dengan Prometheus

**`docker-compose.monitoring.yml`:**
```yaml
version: '3.9'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    restart: unless-stopped
    ports:
      - "3001:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_ADMIN_PASSWORD}
    volumes:
      - grafana-data:/var/lib/grafana
    networks:
      - monitoring

  minio-exporter:
    image: digitalocean/minio-exporter:latest
    container_name: minio_exporter
    restart: unless-stopped
    environment:
      MINIO_ENDPOINT: ${MINIO_ENDPOINT}
      MINIO_ACCESS_KEY: ${MINIO_ACCESS_KEY_APP}
      MINIO_SECRET_KEY: ${MINIO_SECRET_KEY_APP}
      MINIO_SECURE: "true"
    ports:
      - "9290:9290"
    networks:
      - monitoring
      - internal

networks:
  monitoring:
    driver: bridge
  internal:
    external: true

volumes:
  prometheus-data:
  grafana-data:
```

**`prometheus.yml`:**
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'minio'
    static_configs:
      - targets: ['minio-exporter:9290']
    metrics_path: '/minio/v2/metrics/cluster'
    params:
      format: ['prometheus']

  - job_name: 'node'
    static_configs:
      - targets: ['minio:9000']
```

## Konfigurasi Jaringan Aman

### 1. Network Segmentation

**`docker-compose.secure.yml`:**
```yaml
version: '3.9'

services:
  minio:
    # ... existing config
    networks:
      - storage
    # No external ports exposed

  app:
    # ... existing config
    networks:
      - app
      - storage
    depends_on:
      - minio

  nginx:
    # ... existing config
    networks:
      - public
      - app
    ports:
      - "443:443"

networks:
  public:
    driver: bridge
  app:
    driver: bridge
    internal: true
  storage:
    driver: bridge
    internal: true
```

### 2. Firewall Rules

**iptables rules untuk MinIO:**
```bash
# Allow only from application server
iptables -A INPUT -p tcp -s 10.0.0.100 --dport 9000 -j ACCEPT
iptables -A INPUT -p tcp --dport 9000 -j DROP

# Allow MinIO console only from admin IPs
iptables -A INPUT -p tcp -s 203.0.113.1 --dport 9001 -j ACCEPT
iptables -A INPUT -p tcp --dport 9001 -j DROP
```

### 3. VPN dan Zero Trust

**WireGuard configuration:**
```ini
[Interface]
Address = 10.0.0.1/24
PrivateKey = <server-private-key>
ListenPort = 51820

[Peer]
PublicKey = <app-server-public-key>
AllowedIPs = 10.0.0.2/32
Endpoint = <app-server-ip>:51820

[Peer]
PublicKey = <admin-public-key>
AllowedIPs = 10.0.0.3/32
Endpoint = <admin-ip>:51820
```

## Integrasi dengan Backend

### 1. Secure API Routes

**`src/app/api/files/upload/route.js`:**
```javascript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { secureUploadFile } from '@/lib/minio-secure';
import { validateFile, sanitizeFilename, generateSecureFilename } from '@/lib/file-validation';
import { logMinIOOperation } from '@/lib/minio-audit';
import { uploadRateLimit } from '@/middleware/rate-limit';

export async function POST(request) {
  try {
    // Rate limiting
    await uploadRateLimit(request);

    // Authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file
    const buffer = Buffer.from(await file.arrayBuffer());
    const validation = await validateFile(buffer, file.name, file.type);

    if (!validation.isValid) {
      await logMinIOOperation('upload', session.user.id, file.name, false, {
        errors: validation.errors
      });
      return NextResponse.json({ error: validation.errors }, { status: 400 });
    }

    // Generate secure filename
    const secureFilename = generateSecureFilename(file.name, session.user.id);

    // Upload with access control
    const fileUrl = await secureUploadFile(
      secureFilename,
      buffer,
      session.user.role,
      file.type
    );

    // Log successful upload
    await logMinIOOperation('upload', session.user.id, secureFilename, true, {
      originalName: file.name,
      size: buffer.length,
      mimeType: file.type
    });

    return NextResponse.json({
      success: true,
      fileName: secureFilename,
      url: fileUrl
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
```

### 2. Secure File Access API

**`src/app/api/files/[fileName]/route.js`:**
```javascript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { generateSecurePresignedUrl } from '@/lib/minio-access-control';
import { logMinIOOperation } from '@/lib/minio-audit';
import { minioRateLimit } from '@/middleware/rate-limit';

export async function GET(request, { params }) {
  try {
    // Rate limiting
    await minioRateLimit(request);

    // Authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileName } = params;

    // Generate secure presigned URL
    const presignedUrl = await generateSecurePresignedUrl(
      fileName,
      session.user.role
    );

    // Log access
    await logMinIOOperation('access', session.user.id, fileName, true);

    return NextResponse.json({ url: presignedUrl });

  } catch (error) {
    console.error('File access error:', error);
    await logMinIOOperation('access', session?.user?.id || 'anonymous', params.fileName, false, {
      error: error.message
    });
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }
}
```

## Integrasi dengan Frontend

### 1. Secure File Upload Component

**`src/components/secure-file-upload.jsx`:**
```jsx
import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { uploadFile } from '@/lib/api/files';

export function SecureFileUpload({ onUploadSuccess, onUploadError }) {
  const { data: session } = useSession();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelect = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Client-side validation
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];

    if (file.size > maxSize) {
      onUploadError('File size exceeds 10MB limit');
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      onUploadError('Only JPG, PNG, and PDF files are allowed');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress (in real implementation, use XMLHttpRequest for progress)
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await uploadFile(formData);

      clearInterval(progressInterval);
      setProgress(100);

      onUploadSuccess(response);
    } catch (error) {
      onUploadError(error.message);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [onUploadSuccess, onUploadError]);

  if (!session) {
    return <div>Please log in to upload files</div>;
  }

  return (
    <div className="secure-file-upload">
      <input
        type="file"
        onChange={handleFileSelect}
        accept=".jpg,.jpeg,.png,.pdf"
        disabled={uploading}
      />

      {uploading && (
        <div className="upload-progress">
          <progress value={progress} max={100} />
          <span>{progress}%</span>
        </div>
      )}
    </div>
  );
}
```

### 2. Secure File Viewer Component

**`src/components/secure-file-viewer.jsx`:**
```jsx
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function SecureFileViewer({ fileName, fileType }) {
  const { data: session } = useSession();
  const [fileUrl, setFileUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadFile = async () => {
      try {
        const response = await fetch(`/api/files/${fileName}`);
        if (!response.ok) {
          throw new Error('Failed to get file access');
        }

        const data = await response.json();
        setFileUrl(data.url);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (session && fileName) {
      loadFile();
    }
  }, [session, fileName]);

  if (!session) {
    return <div>Authentication required</div>;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!fileUrl) {
    return <div>File not found</div>;
  }

  // Render based on file type
  if (fileType.startsWith('image/')) {
    return <img src={fileUrl} alt="Secure file" style={{ maxWidth: '100%' }} />;
  }

  if (fileType === 'application/pdf') {
    return <iframe src={fileUrl} width="100%" height="600px" />;
  }

  return <a href={fileUrl} target="_blank" rel="noopener noreferrer">Download File</a>;
}
```

## Deployment di Cloud vs On-Premise

### 1. AWS S3 (Cloud)

**Konfigurasi untuk AWS S3:**
```javascript
import * as AWS from 'aws-sdk';

// AWS S3 client with security best practices
export const s3Client = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  // Use VPC endpoint for enhanced security
  endpoint: process.env.AWS_S3_ENDPOINT,
  // Enable encryption
  serverSideEncryption: 'AES256',
  // Signature version 4
  signatureVersion: 'v4'
});

// Bucket policy for private access
export const S3_BUCKET_POLICY = {
  Version: "2012-10-17",
  Statement: [
    {
      Effect: "Deny",
      Principal: "*",
      Action: "s3:*",
      Resource: [
        `arn:aws:s3:::${process.env.S3_BUCKET}`,
        `arn:aws:s3:::${process.env.S3_BUCKET}/*`
      ],
      Condition: {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    }
  ]
};
```

### 2. MinIO di Kubernetes (On-Premise)

**`minio-deployment.yaml`:**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: minio-secret
type: Opaque
data:
  accesskey: <base64-encoded-access-key>
  secretkey: <base64-encoded-secret-key>

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: minio-config
data:
  MINIO_PROMETHEUS_AUTH_TYPE: "public"

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: minio
spec:
  replicas: 3
  selector:
    matchLabels:
      app: minio
  template:
    metadata:
      labels:
        app: minio
    spec:
      containers:
      - name: minio
        image: minio/minio:latest
        ports:
        - containerPort: 9000
        env:
        - name: MINIO_ACCESS_KEY
          valueFrom:
            secretKeyRef:
              name: minio-secret
              key: accesskey
        - name: MINIO_SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: minio-secret
              key: secretkey
        volumeMounts:
        - name: minio-storage
          mountPath: /data
        - name: minio-config
          mountPath: /root/.minio
        securityContext:
          runAsUser: 1000
          runAsGroup: 1000
      volumes:
      - name: minio-storage
        persistentVolumeClaim:
          claimName: minio-pvc
      - name: minio-config
        configMap:
          name: minio-config

---
apiVersion: v1
kind: Service
metadata:
  name: minio-service
spec:
  selector:
    app: minio
  ports:
  - port: 9000
    targetPort: 9000
  type: ClusterIP  # No external access

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: minio-ingress
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - minio.company.internal
    secretName: minio-tls
  rules:
  - host: minio.company.internal
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: minio-service
            port:
              number: 9000
```

### 3. MinIO dengan Docker Swarm

**`docker-compose.swarm.yml`:**
```yaml
version: '3.8'

services:
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ACCESS_KEY: ${MINIO_ACCESS_KEY}
      MINIO_SECRET_KEY: ${MINIO_SECRET_KEY}
    volumes:
      - minio-data:/data
    networks:
      - minio-net
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
      placement:
        constraints:
          - node.role == worker
      labels:
        - "traefik.enable=true"
        - "traefik.http.routers.minio.rule=Host(`minio.company.internal`)"
        - "traefik.http.routers.minio.tls.certresolver=letsencrypt"
        - "traefik.http.services.minio.loadbalancer.server.port=9000"
        - "traefik.http.middlewares.minio-auth.basicauth.users=${MINIO_BASIC_AUTH}"
        - "traefik.http.routers.minio.middlewares=minio-auth"

  traefik:
    image: traefik:v2.5
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--providers.docker.swarmMode=true"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
      - "--certificatesresolvers.letsencrypt.acme.email=admin@company.com"
    ports:
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - traefik-certificates:/certificates
    networks:
      - minio-net
    deploy:
      placement:
        constraints:
          - node.role == manager

networks:
  minio-net:
    driver: overlay
    attachable: true

volumes:
  minio-data:
    driver: local
  traefik-certificates:
    driver: local
```

## Checklist Implementasi

### Fase 1: Konfigurasi Dasar (1-2 hari)
- [ ] ✅ Ganti kredensial default MinIO
- [ ] ✅ Konfigurasi SSL/TLS
- [ ] ✅ Hapus kebijakan akses publik
- [ ] ✅ Setup environment variables yang aman
- [ ] ✅ Konfigurasi Docker dengan network segmentation

### Fase 2: Autentikasi dan Otorisasi (2-3 hari)
- [ ] ✅ Implementasi policy-based access control
- [ ] ✅ Setup role-based permissions (Admin/Operator/Viewer)
- [ ] ✅ Konfigurasi presigned URLs dengan kontrol akses
- [ ] ✅ Implementasi audit logging untuk akses file

### Fase 3: Enkripsi dan Keamanan Data (2-3 hari)
- [ ] ✅ Setup server