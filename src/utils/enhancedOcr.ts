import Tesseract from 'tesseract.js';
import { AadhaarData } from '../types';

interface OCRResult {
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

export class EnhancedOCR {
  /**
   * Process Aadhaar card with enhanced OCR and pattern recognition
   */
  async processAadhaarCard(imageFile: File): Promise<AadhaarData> {
    try {
      // Configure Tesseract for better accuracy with multiple passes
      const { data } = await Tesseract.recognize(imageFile, 'eng+hin', {
        logger: (m) => console.log(m),
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 /-:.',
      });

      const text = data.text;
      const words = data.words || [];
      const lines = data.lines || [];

      console.log('OCR Full Text:', text);
      console.log('OCR Words with confidence:', words.map(w => ({ text: w.text, confidence: w.confidence })));

      // Extract data using multiple approaches with better logic
      const extractedData = {
        name: this.extractName(text, words, lines),
        fatherName: this.extractFatherName(text, words, lines),
        dob: this.extractDOB(text, words),
        gender: this.extractGender(text, words),
        aadhaarNumber: this.extractAadhaarNumber(text, words),
        address: this.extractAddress(text, words)
      };

      console.log('Final Extracted Data:', extractedData);
      
      // Validate extracted data
      if (!extractedData.name || extractedData.name.length < 2) {
        throw new Error('Could not extract name from Aadhaar card. Please ensure the image is clear.');
      }

      return extractedData;
    } catch (error) {
      console.error('Enhanced OCR processing failed:', error);
      throw new Error('Failed to process Aadhaar card. Please ensure the image is clear and all text is visible.');
    }
  }

  /**
   * Extract name using improved logic and multiple strategies
   */
  private extractName(text: string, words: any[], lines: any[]): string {
    console.log('Extracting name from text...');
    
    // Strategy 1: Look for name after explicit keywords
    const nameKeywords = ['Name', 'नाम', 'NAME'];
    for (const keyword of nameKeywords) {
      const pattern = new RegExp(`${keyword}[:\\s]*([A-Za-z\\s]{2,40})`, 'i');
      const match = text.match(pattern);
      if (match && match[1]) {
        const cleanedName = this.cleanAndValidateName(match[1]);
        if (cleanedName && cleanedName.length > 2) {
          console.log('Name found via keyword:', cleanedName);
          return cleanedName;
        }
      }
    }

    // Strategy 2: Analyze text structure - name usually appears early
    const textLines = text.split('\n').filter(line => line.trim().length > 0);
    for (let i = 0; i < Math.min(textLines.length, 5); i++) {
      const line = textLines[i].trim();
      
      // Skip lines with obvious non-name content
      if (this.isLikelyName(line)) {
        const cleanedName = this.cleanAndValidateName(line);
        if (cleanedName && cleanedName.length > 2) {
          console.log('Name found via line analysis:', cleanedName);
          return cleanedName;
        }
      }
    }

    // Strategy 3: Use word-level analysis with position context
    if (words && words.length > 0) {
      const nameFromWords = this.extractNameFromWords(words);
      if (nameFromWords) {
        console.log('Name found via word analysis:', nameFromWords);
        return nameFromWords;
      }
    }

    // Strategy 4: Pattern matching for common Aadhaar layouts
    const patterns = [
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*(?:S\/O|D\/O|W\/O)/i,
      /Government\s+of\s+India[^]*?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*(?:Father|पिता)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const cleanedName = this.cleanAndValidateName(match[1]);
        if (cleanedName && cleanedName.length > 2) {
          console.log('Name found via pattern matching:', cleanedName);
          return cleanedName;
        }
      }
    }

    console.log('No name found, returning empty string');
    return '';
  }

  /**
   * Extract name from word-level OCR data
   */
  private extractNameFromWords(words: any[]): string {
    // Filter high-confidence words that could be names
    const nameWords = words.filter(word => 
      word.confidence > 60 && 
      /^[A-Za-z]+$/.test(word.text) &&
      word.text.length > 1 &&
      !this.isCommonNonNameWord(word.text)
    );

    if (nameWords.length === 0) return '';

    // Sort by position (top to bottom, left to right)
    nameWords.sort((a, b) => {
      const aY = a.bbox?.y0 || 0;
      const bY = b.bbox?.y0 || 0;
      if (Math.abs(aY - bY) > 10) return aY - bY; // Different lines
      return (a.bbox?.x0 || 0) - (b.bbox?.x0 || 0); // Same line, left to right
    });

    // Find the best name sequence
    let bestName = '';
    let currentSequence = '';
    let lastY = -1;

    for (const word of nameWords) {
      const currentY = word.bbox?.y0 || 0;
      
      // If we're on a new line or far from the last word, start a new sequence
      if (lastY === -1 || Math.abs(currentY - lastY) > 10) {
        if (currentSequence.length > bestName.length && this.isValidNameSequence(currentSequence)) {
          bestName = currentSequence;
        }
        currentSequence = word.text;
      } else {
        // Continue the sequence
        currentSequence += ' ' + word.text;
      }
      
      lastY = currentY;
    }

    // Check the final sequence
    if (currentSequence.length > bestName.length && this.isValidNameSequence(currentSequence)) {
      bestName = currentSequence;
    }

    return this.cleanAndValidateName(bestName);
  }

  /**
   * Check if a word is commonly found in Aadhaar cards but not part of names
   */
  private isCommonNonNameWord(word: string): boolean {
    const nonNameWords = [
      'government', 'india', 'aadhaar', 'card', 'male', 'female', 
      'dob', 'address', 'pin', 'code', 'unique', 'identification',
      'authority', 'भारत', 'सरकार', 'आधार'
    ];
    return nonNameWords.includes(word.toLowerCase());
  }

  /**
   * Validate if a sequence of words forms a valid name
   */
  private isValidNameSequence(sequence: string): boolean {
    const words = sequence.trim().split(/\s+/);
    return words.length >= 1 && 
           words.length <= 4 && 
           words.every(word => /^[A-Za-z]+$/.test(word) && word.length > 1);
  }

  /**
   * Extract father's name with improved patterns
   */
  private extractFatherName(text: string, words: any[], lines: any[]): string {
    // Multiple patterns for father's name
    const patterns = [
      /(?:Father['\s]*s?\s*Name|Father|पिता|S\/O|Son\s+of)[:\s]*([A-Za-z\s]+?)(?:\n|DOB|Date|Gender|Male|Female|\d)/i,
      /(?:Guardian|अभिभावक)[:\s]*([A-Za-z\s]+?)(?:\n|DOB|Date|Gender)/i,
      /(?:Parent|माता-पिता)[:\s]*([A-Za-z\s]+?)(?:\n|DOB|Date|Gender)/i,
      /S\/O[:\s]*([A-Za-z\s]+?)(?:\n|DOB|Date|Gender|Male|Female|\d)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const cleanedName = this.cleanAndValidateName(match[1]);
        if (cleanedName && cleanedName.length > 2) {
          return cleanedName;
        }
      }
    }

    return '';
  }

  /**
   * Extract date of birth with multiple formats
   */
  private extractDOB(text: string, words: any[]): string {
    // Multiple date patterns
    const patterns = [
      /(?:DOB|Date\s+of\s+Birth|Birth|जन्म)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
      /(?:DOB|Date\s+of\s+Birth|Birth|जन्म)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2})/i,
      /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/g,
      /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2})/g
    ];

    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          const dateStr = Array.isArray(matches) ? match : matches[1];
          if (dateStr && this.isValidDate(dateStr)) {
            return this.normalizeDateFormat(dateStr);
          }
        }
      }
    }

    return '';
  }

  /**
   * Extract gender with multiple language support
   */
  private extractGender(text: string, words: any[]): string {
    const malePatterns = /(?:Male|पुरुष|MALE|M(?:\s|$|\/|:))/i;
    const femalePatterns = /(?:Female|महिला|FEMALE|F(?:\s|$|\/|:))/i;

    if (malePatterns.test(text)) {
      return 'Male';
    }
    if (femalePatterns.test(text)) {
      return 'Female';
    }

    return '';
  }

  /**
   * Extract Aadhaar number with validation
   */
  private extractAadhaarNumber(text: string, words: any[]): string {
    // Look for 12-digit number patterns
    const patterns = [
      /\b(\d{4}\s?\d{4}\s?\d{4})\b/g,
      /\b(\d{12})\b/g
    ];

    for (const pattern of patterns) {
      const matches = [...text.matchAll(pattern)];
      if (matches) {
        for (const match of matches) {
          const cleaned = match[1].replace(/\s/g, '');
          if (this.isValidAadhaarNumber(cleaned)) {
            return cleaned;
          }
        }
      }
    }

    return '';
  }

  /**
   * Extract address information
   */
  private extractAddress(text: string, words: any[]): string {
    // Look for address patterns after common keywords
    const addressMatch = text.match(/(?:Address|पता)[:\s]*([^]+?)(?:\n\n|\d{6}|PIN)/i);
    if (addressMatch && addressMatch[1]) {
      return addressMatch[1].trim().replace(/\n/g, ' ');
    }

    // Look for PIN code and extract text before it
    const pinMatch = text.match(/([^]+?)(\d{6})/);
    if (pinMatch && pinMatch[1]) {
      const addressPart = pinMatch[1].split('\n').slice(-3).join(' ').trim();
      if (addressPart.length > 10) {
        return addressPart;
      }
    }

    return '';
  }

  /**
   * Helper methods
   */
  private cleanAndValidateName(name: string): string {
    if (!name) return '';
    
    const cleaned = name
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter(word => word.length > 1 && /^[A-Za-z]+$/.test(word))
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    // Validate the cleaned name
    if (cleaned.length < 2 || cleaned.length > 50) return '';
    if (!/^[A-Za-z\s]+$/.test(cleaned)) return '';
    
    return cleaned;
  }

  private isLikelyName(text: string): boolean {
    // Check if text looks like a name
    const cleaned = text.trim();
    return /^[A-Za-z\s]+$/.test(cleaned) && 
           cleaned.length > 2 && 
           cleaned.length < 50 &&
           !/\d/.test(cleaned) &&
           !/(DOB|Gender|Male|Female|Address|Government|India|Aadhaar|Card)/i.test(cleaned) &&
           !this.isCommonNonNameWord(cleaned.toLowerCase());
  }

  private isValidDate(dateStr: string): boolean {
    const cleaned = dateStr.replace(/[-\.]/g, '/');
    const parts = cleaned.split('/');
    
    if (parts.length !== 3) return false;
    
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    let year = parseInt(parts[2]);
    
    // Handle 2-digit years
    if (year < 100) {
      year += year > 50 ? 1900 : 2000;
    }
    
    return day >= 1 && day <= 31 && 
           month >= 1 && month <= 12 && 
           year >= 1900 && year <= new Date().getFullYear();
  }

  private normalizeDateFormat(date: string): string {
    // Convert various date formats to DD/MM/YYYY
    const cleaned = date.replace(/[-\.]/g, '/');
    const parts = cleaned.split('/');
    
    if (parts.length === 3) {
      let [day, month, year] = parts;
      
      // Handle 2-digit years
      if (year.length === 2) {
        const yearNum = parseInt(year);
        year = (yearNum > 50 ? 1900 + yearNum : 2000 + yearNum).toString();
      }
      
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
    
    return date;
  }

  private isValidAadhaarNumber(number: string): boolean {
    // Basic Aadhaar validation
    return /^\d{12}$/.test(number) && 
           !['000000000000', '111111111111', '222222222222'].includes(number) &&
           number !== '123456789012';
  }
}