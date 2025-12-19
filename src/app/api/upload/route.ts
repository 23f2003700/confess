// Server-side API Route for Image Upload - Optimized for Speed
import { NextRequest, NextResponse } from 'next/server';

// Rate limiting
const uploadRateLimitMap = new Map<string, { count: number; resetTime: number }>();
const UPLOAD_RATE_LIMIT = 10; // 10 uploads per minute
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
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB (reduced for faster uploads)

// Multiple upload services for redundancy and speed
const UPLOAD_SERVICES = [
  {
    name: 'imgbb',
    upload: async (file: File): Promise<string | null> => {
      try {
        const formData = new FormData();
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        formData.append('image', base64);
        
        // Free API key for imgbb (you can get one at imgbb.com)
        const response = await fetch('https://api.imgbb.com/1/upload?key=7a9e4c8b2f1d3e5a6b7c8d9e0f1a2b3c', {
          method: 'POST',
          body: formData,
          signal: AbortSignal.timeout(15000), // 15 second timeout
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.data?.url || null;
        }
        return null;
      } catch {
        return null;
      }
    }
  },
  {
    name: 'catbox',
    upload: async (file: File): Promise<string | null> => {
      try {
        const catboxFormData = new FormData();
        catboxFormData.append('reqtype', 'fileupload');
        catboxFormData.append('fileToUpload', file, file.name);

        const response = await fetch('https://catbox.moe/user/api.php', {
          method: 'POST',
          body: catboxFormData,
          signal: AbortSignal.timeout(20000), // 20 second timeout
        });

        if (response.ok) {
          const imageUrl = await response.text();
          if (imageUrl.startsWith('https://')) {
            return imageUrl.trim();
          }
        }
        return null;
      } catch {
        return null;
      }
    }
  },
  {
    name: 'litterbox',
    upload: async (file: File): Promise<string | null> => {
      try {
        const formData = new FormData();
        formData.append('reqtype', 'fileupload');
        formData.append('time', '72h'); // 72 hours retention
        formData.append('fileToUpload', file, file.name);

        const response = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', {
          method: 'POST',
          body: formData,
          signal: AbortSignal.timeout(20000),
        });

        if (response.ok) {
          const imageUrl = await response.text();
          if (imageUrl.startsWith('https://')) {
            return imageUrl.trim();
          }
        }
        return null;
      } catch {
        return null;
      }
    }
  }
];

// Try upload with race condition - first successful wins
async function uploadWithRace(file: File): Promise<string | null> {
  // Try catbox first as primary (most reliable for permanent storage)
  const primaryResult = await UPLOAD_SERVICES[1].upload(file);
  if (primaryResult) return primaryResult;
  
  // If primary fails, try others in parallel
  const results = await Promise.allSettled(
    UPLOAD_SERVICES.filter((_, i) => i !== 1).map(service => service.upload(file))
  );
  
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      return result.value;
    }
  }
  
  return null;
}

// Sequential fallback upload
async function uploadWithFallback(file: File): Promise<string | null> {
  for (const service of UPLOAD_SERVICES) {
    console.log(`Trying ${service.name}...`);
    const result = await service.upload(file);
    if (result) {
      console.log(`Success with ${service.name}`);
      return result;
    }
    console.log(`${service.name} failed, trying next...`);
  }
  return null;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
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
        { error: 'File too large. Max 10MB allowed. Try compressing the image.' },
        { status: 400 }
      );
    }

    // For small files, try race condition (faster)
    // For larger files, use sequential fallback (more reliable)
    let imageUrl: string | null;
    
    if (file.size < 2 * 1024 * 1024) {
      // Less than 2MB - use race
      imageUrl = await uploadWithRace(file);
    } else {
      // Larger files - use fallback
      imageUrl = await uploadWithFallback(file);
    }

    if (!imageUrl) {
      console.error('All upload services failed');
      return NextResponse.json(
        { error: 'Upload failed. Please try again with a smaller image.' },
        { status: 500 }
      );
    }

    const uploadTime = Date.now() - startTime;
    console.log(`Upload completed in ${uploadTime}ms`);

    return NextResponse.json({
      success: true,
      imageUrl: imageUrl,
      uploadTime: uploadTime,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image. Please try again.' },
      { status: 500 }
    );
  }
}
