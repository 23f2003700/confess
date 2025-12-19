// Server-side API Route for Image Upload - Credentials NEVER exposed to client
import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

// S3 Configuration - SERVER-SIDE ONLY
const S3_BUCKET = process.env.S3_BUCKET || 'mymbm-confessions-images';
const S3_REGION = process.env.AWS_REGION || 'ap-south-1';

// Initialize S3 Client (uses IAM role in production, or env vars locally)
const s3Client = new S3Client({
  region: S3_REGION,
  credentials: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  } : undefined, // Use IAM role in Amplify
});

// Rate limiting
const uploadRateLimitMap = new Map<string, { count: number; resetTime: number }>();
const UPLOAD_RATE_LIMIT = 5; // 5 uploads per minute
const RATE_WINDOW = 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = uploadRateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    uploadRateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return false;
  }
  
  if (record.count >= UPLOAD_RATE_LIMIT) {
    return true;
  }
  
  record.count++;
  return false;
}

// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many uploads. Please wait a minute.' },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, WebP allowed.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Max 5MB allowed.' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `confessions/${uuidv4()}.${fileExtension}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
      // Make publicly readable
      ACL: 'public-read',
    });

    await s3Client.send(uploadCommand);

    // Return the public URL
    const imageUrl = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${fileName}`;

    return NextResponse.json({
      success: true,
      imageUrl,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
