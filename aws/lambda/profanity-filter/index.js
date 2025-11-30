/**
 * Profanity Filter Lambda Function
 * Multi-layer filtering for Hindi & English bad words
 * Uses: Custom word list + Amazon Comprehend
 */

const { ComprehendClient, DetectSentimentCommand, DetectToxicContentCommand } = require('@aws-sdk/client-comprehend');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const comprehend = new ComprehendClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = process.env.TABLE_NAME || 'ConfessionsTable';

// Comprehensive Hindi & English bad words list (obfuscated patterns)
const HINDI_BAD_WORDS = [
  // Common Hindi profanity patterns
  'बहनचोद', 'भोसडी', 'मादरचोद', 'चूतिया', 'गांड', 'लौड़ा', 'लंड', 'भड़वा', 
  'रंडी', 'हरामी', 'कमीना', 'कुत्ता', 'सूअर', 'उल्लू', 'गधा', 'बकचोद',
  'चूस', 'लौड़े', 'भोसड़ी', 'झाटू', 'टट्टी', 'मूत', 'हग', 'फुद्दी',
  'बेवकूफ', 'नालायक', 'निकम्मा', 'बदतमीज़', 'बदमाश',
  // Transliterated Hindi (Roman script)
  'bhenchod', 'bhosdike', 'madarchod', 'chutiya', 'gaand', 'lauda', 'lund',
  'bhadwa', 'randi', 'harami', 'kamina', 'kutta', 'suar', 'bakchod',
  'choos', 'jhatu', 'tatti', 'moot', 'fuddi', 'bc', 'mc', 'bsdk'
];

const ENGLISH_BAD_WORDS = [
  'fuck', 'shit', 'ass', 'bitch', 'bastard', 'damn', 'crap', 'dick', 'cock',
  'pussy', 'whore', 'slut', 'cunt', 'nigger', 'fag', 'retard', 'idiot',
  'stupid', 'dumb', 'hate', 'kill', 'die', 'suicide', 'murder', 'rape',
  'porn', 'sex', 'nude', 'naked', 'xxx', 'wtf', 'stfu', 'gtfo', 'lmao',
  'asshole', 'motherfucker', 'fucker', 'bullshit', 'piss', 'wanker'
];

// Leetspeak mappings
const LEETSPEAK_MAP = {
  '4': 'a', '@': 'a', '3': 'e', '1': 'i', '!': 'i', 
  '0': 'o', '5': 's', '$': 's', '7': 't', '+': 't'
};

/**
 * Normalize text - convert leetspeak, remove special chars
 */
function normalizeText(text) {
  let normalized = text.toLowerCase();
  
  // Convert leetspeak
  for (const [leet, char] of Object.entries(LEETSPEAK_MAP)) {
    normalized = normalized.split(leet).join(char);
  }
  
  // Remove repeated characters (e.g., "fuuuuck" -> "fuck")
  normalized = normalized.replace(/(.)\1{2,}/g, '$1$1');
  
  // Remove spaces between letters (e.g., "f u c k" -> "fuck")  
  const noSpaces = normalized.replace(/\s+/g, '');
  
  return { withSpaces: normalized, noSpaces };
}

/**
 * Check for bad words using pattern matching
 */
function containsBadWords(text) {
  const { withSpaces, noSpaces } = normalizeText(text);
  const allBadWords = [...HINDI_BAD_WORDS, ...ENGLISH_BAD_WORDS];
  
  for (const badWord of allBadWords) {
    const normalizedBad = badWord.toLowerCase();
    
    // Check in both versions
    if (withSpaces.includes(normalizedBad) || noSpaces.includes(normalizedBad)) {
      return { hasBadWords: true, detectedWord: badWord };
    }
    
    // Check with word boundaries
    const regex = new RegExp(`\\b${normalizedBad}\\b`, 'gi');
    if (regex.test(text)) {
      return { hasBadWords: true, detectedWord: badWord };
    }
  }
  
  return { hasBadWords: false };
}

/**
 * Use Amazon Comprehend for toxicity detection (English)
 */
async function checkToxicityWithComprehend(text) {
  try {
    // Detect sentiment first
    const sentimentCommand = new DetectSentimentCommand({
      Text: text,
      LanguageCode: 'en'
    });
    
    const sentimentResult = await comprehend.send(sentimentCommand);
    
    // If strongly negative, flag for review
    if (sentimentResult.Sentiment === 'NEGATIVE' && 
        sentimentResult.SentimentScore.Negative > 0.8) {
      return { 
        isToxic: true, 
        reason: 'High negative sentiment detected',
        score: sentimentResult.SentimentScore.Negative 
      };
    }
    
    return { isToxic: false };
  } catch (error) {
    console.error('Comprehend error:', error);
    // On error, allow but log
    return { isToxic: false, error: error.message };
  }
}

/**
 * Main handler - Create confession with filtering
 */
exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  const { operation, message, limit = 50 } = typeof event.arguments === 'object' 
    ? event.arguments 
    : event;
  
  try {
    switch (operation || event.info?.fieldName) {
      case 'createConfession':
      case 'create':
        return await createConfession(message || event.arguments?.message);
      
      case 'listConfessions':
      case 'list':
        return await listConfessions(limit);
      
      default:
        // For AppSync resolver
        if (event.info?.fieldName === 'createConfession') {
          return await createConfession(event.arguments.message);
        }
        if (event.info?.fieldName === 'listConfessions') {
          return await listConfessions(event.arguments?.limit || 50);
        }
        throw new Error(`Unknown operation: ${operation || event.info?.fieldName}`);
    }
  } catch (error) {
    console.error('Handler error:', error);
    throw error;
  }
};

async function createConfession(message) {
  if (!message || message.trim().length === 0) {
    return {
      success: false,
      error: 'Message is required',
      notification: 'कुछ तो लिखो! 📝'
    };
  }
  
  if (message.length > 500) {
    return {
      success: false,
      error: 'Message too long',
      notification: 'थोड़ा छोटा लिखो! Max 500 characters 📏'
    };
  }
  
  // Layer 1: Custom bad word filter
  const badWordCheck = containsBadWords(message);
  if (badWordCheck.hasBadWords) {
    console.log('Bad word detected:', badWordCheck.detectedWord);
    return {
      success: false,
      error: 'Inappropriate content detected',
      notification: 'अच्छा लिखो! 🙏 No bad words please.'
    };
  }
  
  // Layer 2: Amazon Comprehend toxicity check
  const toxicityCheck = await checkToxicityWithComprehend(message);
  if (toxicityCheck.isToxic) {
    console.log('Toxicity detected:', toxicityCheck.reason);
    return {
      success: false,
      error: 'Content flagged as potentially harmful',
      notification: 'अच्छा लिखो! 🙏 Keep it positive.'
    };
  }
  
  // All checks passed - save to DynamoDB
  const confession = {
    id: uuidv4(),
    message: message.trim(),
    createdAt: new Date().toISOString(),
    status: 'approved',
    sentiment: toxicityCheck.sentiment || 'NEUTRAL'
  };
  
  const putCommand = new PutCommand({
    TableName: TABLE_NAME,
    Item: confession
  });
  
  await docClient.send(putCommand);
  
  console.log('Confession saved:', confession.id);
  
  return {
    success: true,
    confession,
    notification: 'Confession posted! 💜'
  };
}

async function listConfessions(limit = 50) {
  const queryCommand = new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: 'status-createdAt-index',
    KeyConditionExpression: '#status = :status',
    ExpressionAttributeNames: {
      '#status': 'status'
    },
    ExpressionAttributeValues: {
      ':status': 'approved'
    },
    ScanIndexForward: false, // Latest first
    Limit: limit
  });
  
  const result = await docClient.send(queryCommand);
  
  return {
    confessions: result.Items || [],
    count: result.Count || 0
  };
}
