// Server-side API Route - Credentials NEVER exposed to client
// This is the ONLY way to interact with the database

import { NextRequest, NextResponse } from 'next/server';

// These are SERVER-SIDE ONLY - never sent to browser
// Must be set in environment variables (Amplify)
const APPSYNC_ENDPOINT = process.env.APPSYNC_ENDPOINT!;
const APPSYNC_API_KEY = process.env.APPSYNC_API_KEY!;

// Rate limiting map (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // 10 requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return false;
  }
  
  if (record.count >= RATE_LIMIT) {
    return true;
  }
  
  record.count++;
  return false;
}

// GET - Fetch confessions
export async function GET() {
  try {
    // Try with imageUrl first, fallback to without if schema not updated
    const queryWithImage = `
      query ListConfessions {
        listConfessions(limit: 100) {
          items {
            id
            message
            imageUrl
            createdAt
          }
          nextToken
        }
      }
    `;
    
    const queryWithoutImage = `
      query ListConfessions {
        listConfessions(limit: 100) {
          items {
            id
            message
            createdAt
          }
          nextToken
        }
      }
    `;

    let response = await fetch(APPSYNC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': APPSYNC_API_KEY,
      },
      body: JSON.stringify({ query: queryWithImage }),
      cache: 'no-store',
    });

    let data = await response.json();
    
    // If imageUrl field doesn't exist, retry without it
    if (data.errors && data.errors[0]?.message?.includes('imageUrl')) {
      response = await fetch(APPSYNC_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': APPSYNC_API_KEY,
        },
        body: JSON.stringify({ query: queryWithoutImage }),
        cache: 'no-store',
      });
      data = await response.json();
    }
    
    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }

    // Only return safe data - no internal fields
    const items = data.data?.listConfessions?.items || [];
    const safeItems = items.map((item: { id: string; message: string; imageUrl?: string; createdAt: string }) => ({
      id: item.id,
      message: item.message,
      imageUrl: item.imageUrl || null,
      createdAt: item.createdAt,
    }));

    return NextResponse.json({ items: safeItems });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST - Create confession (with server-side validation)
export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a minute.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { message } = body;

    // Validation
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const trimmedMessage = message.trim();

    if (trimmedMessage.length < 1) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    if (trimmedMessage.length > 500) {
      return NextResponse.json({ error: 'Message too long (max 500)' }, { status: 400 });
    }

    // Server-side profanity check (backup - AppSync also checks)
    // This list is hidden from client
    const badWords = [
      'fuck', 'shit', 'ass', 'bitch', 'bastard', 'dick', 'cock', 'pussy', 'whore',
      'slut', 'cunt', 'damn', 'crap', 'asshole', 'motherfucker', 'nigger', 'faggot',
      'bhenchod', 'bhosdike', 'madarchod', 'chutiya', 'gaand', 'lauda', 'lund',
      'bhadwa', 'randi', 'harami', 'kamina', 'gandu', 'chod', 'bsdk', 'mc', 'bc',
      'lavde', 'behenchod', 'madarjaat', 'jhant', 'tatte', 'chut'
    ];

    const lowerMessage = trimmedMessage.toLowerCase();
    const hasBadWord = badWords.some(word => lowerMessage.includes(word));

    if (hasBadWord) {
      return NextResponse.json(
        { error: 'अच्छा लिखो 🙏', code: 'PROFANITY' },
        { status: 400 }
      );
    }

    // Get imageUrl from request body
    const imageUrl = body.imageUrl || null;

    // Send to AppSync - try with imageUrl first, fallback without
    const mutationWithImage = `
      mutation CreateConfession($message: String!, $imageUrl: String) {
        createConfession(message: $message, imageUrl: $imageUrl) {
          id
          message
          imageUrl
          createdAt
        }
      }
    `;
    
    const mutationWithoutImage = `
      mutation CreateConfession($message: String!) {
        createConfession(message: $message) {
          id
          message
          createdAt
        }
      }
    `;

    let response = await fetch(APPSYNC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': APPSYNC_API_KEY,
      },
      body: JSON.stringify({
        query: mutationWithImage,
        variables: { message: trimmedMessage, imageUrl },
      }),
    });

    let data = await response.json();
    
    // If imageUrl field doesn't exist in schema, retry without it
    if (data.errors && data.errors[0]?.message?.includes('imageUrl')) {
      response = await fetch(APPSYNC_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': APPSYNC_API_KEY,
        },
        body: JSON.stringify({
          query: mutationWithoutImage,
          variables: { message: trimmedMessage },
        }),
      });
      data = await response.json();
    }

    if (data.errors) {
      // Check if it's profanity error from AppSync
      const errorMessage = data.errors[0]?.message || '';
      if (errorMessage.includes('PROFANITY') || data.errors[0]?.errorType === 'PROFANITY_DETECTED') {
        return NextResponse.json(
          { error: 'अच्छा लिखो 🙏', code: 'PROFANITY' },
          { status: 400 }
        );
      }
      console.error('GraphQL errors:', data.errors);
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }

    // Return only safe data
    const confession = data.data?.createConfession;
    return NextResponse.json({
      success: true,
      confession: {
        id: confession.id,
        message: confession.message,
        imageUrl: confession.imageUrl || null,
        createdAt: confession.createdAt,
      },
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
