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
      console.log('Starting OCR processing...');
      
      // First pass with English
      const { data: englishData } = await Tesseract.recognize(imageFile, 'eng', {
        logger: (m) => console.log('ENG:', m),
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
      });

      // Second pass with Hindi
      const { data: hindiData } = await Tesseract.recognize(imageFile, 'hin', {
        logger: (m) => console.log('HIN:', m),
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
      });

      // Combine both results
      const combinedText = englishData.text + '\n' + hindiData.text;
      const combinedWords = [...(englishData.words || []), ...(hindiData.words || [])];
      const combinedLines = [...(englishData.lines || []), ...(hindiData.lines || [])];

      console.log('Combined OCR Text:', combinedText);
      console.log('Combined Words:', combinedWords.map(w => ({ text: w.text, confidence: w.confidence })));

      // Extract data using multiple approaches with better logic
      const extractedData = {
        name: this.extractName(combinedText, combinedWords, combinedLines),
        fatherName: this.extractFatherName(combinedText, combinedWords, combinedLines),
        dob: this.extractDOB(combinedText, combinedWords),
        gender: this.extractGender(combinedText, combinedWords),
        aadhaarNumber: this.extractAadhaarNumber(combinedText, combinedWords),
        address: this.extractAddress(combinedText, combinedWords)
      };

      console.log('Final Extracted Data:', extractedData);
      
      // Validate extracted data
      if (!extractedData.name || extractedData.name.length < 2) {
        console.warn('Name extraction failed, using fallback method');
        extractedData.name = this.fallbackNameExtraction(combinedText, combinedWords);
      }

      if (!extractedData.gender) {
        console.warn('Gender extraction failed, using fallback method');
        extractedData.gender = this.fallbackGenderExtraction(combinedText);
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
    
    // Strategy 1: Look for name patterns in structured format
    const namePatterns = [
      // English patterns
      /Name[:\s]*([A-Z][A-Za-z\s]{2,40})(?:\n|Father|DOB|Date|Gender|Male|Female|\d)/i,
      /^([A-Z][A-Za-z\s]{2,40})(?:\n|S\/O|D\/O|W\/O|Father)/im,
      // Hindi patterns
      /नाम[:\s]*([A-Za-z\s]{2,40})(?:\n|पिता|जन्म|लिंग|\d)/i,
      // Government of India header followed by name
      /Government\s+of\s+India[^]*?([A-Z][A-Za-z\s]{2,40})(?:\n|S\/O|Father)/i,
    ];

    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const cleanedName = this.cleanAndValidateName(match[1]);
        if (cleanedName && cleanedName.length > 2) {
          console.log('Name found via pattern:', cleanedName);
          return cleanedName;
        }
      }
    }

    // Strategy 2: Analyze text structure - name usually appears early and in caps
    const textLines = text.split('\n').filter(line => line.trim().length > 0);
    for (let i = 0; i < Math.min(textLines.length, 8); i++) {
      const line = textLines[i].trim();
      
      // Skip obvious non-name lines
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

    console.log('No name found using primary methods');
    return '';
  }

  /**
   * Fallback name extraction method
   */
  private fallbackNameExtraction(text: string, words: any[]): string {
    // Look for the first sequence of capitalized words
    const lines = text.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 2 && /^[A-Z][A-Za-z\s]+$/.test(trimmed) && 
          !/(GOVERNMENT|INDIA|AADHAAR|CARD|UNIQUE|IDENTIFICATION)/i.test(trimmed)) {
        const cleaned = this.cleanAndValidateName(trimmed);
        if (cleaned && cleaned.length > 2) {
          console.log('Fallback name found:', cleaned);
          return cleaned;
        }
      }
    }
    return 'Name Not Found';
  }

  /**
   * Extract name from word-level OCR data with improved logic
   */
  private extractNameFromWords(words: any[]): string {
    // Filter high-confidence words that could be names
    const nameWords = words.filter(word => 
      word.confidence > 50 && 
      /^[A-Za-z]+$/.test(word.text) &&
      word.text.length > 1 &&
      !this.isCommonNonNameWord(word.text) &&
      // Prefer words that start with capital letters
      /^[A-Z]/.test(word.text)
    );

    if (nameWords.length === 0) return '';

    // Sort by position (top to bottom, left to right)
    nameWords.sort((a, b) => {
      const aY = a.bbox?.y0 || 0;
      const bY = b.bbox?.y0 || 0;
      if (Math.abs(aY - bY) > 15) return aY - bY; // Different lines
      return (a.bbox?.x0 || 0) - (b.bbox?.x0 || 0); // Same line, left to right
    });

    // Find the best name sequence in the top portion of the card
    const topWords = nameWords.filter(word => (word.bbox?.y0 || 0) < 200); // Focus on top area
    
    let bestName = '';
    let currentSequence = '';
    let lastY = -1;
    let lastX = -1;

    for (const word of topWords) {
      const currentY = word.bbox?.y0 || 0;
      const currentX = word.bbox?.x0 || 0;
      
      // If we're on a new line or far from the last word, start a new sequence
      if (lastY === -1 || Math.abs(currentY - lastY) > 15 || 
          (Math.abs(currentY - lastY) < 15 && currentX - lastX > 200)) {
        if (currentSequence.length > bestName.length && this.isValidNameSequence(currentSequence)) {
          bestName = currentSequence;
        }
        currentSequence = word.text;
      } else {
        // Continue the sequence
        currentSequence += ' ' + word.text;
      }
      
      lastY = currentY;
      lastX = currentX;
    }

    // Check the final sequence
    if (currentSequence.length > bestName.length && this.isValidNameSequence(currentSequence)) {
      bestName = currentSequence;
    }

    return this.cleanAndValidateName(bestName);
  }

  /**
   * Extract gender with multiple language support and better patterns
   */
  private extractGender(text: string, words: any[]): string {
    console.log('Extracting gender...');
    
    // More comprehensive gender patterns
    const malePatterns = [
      /(?:Male|पुरुष|MALE|M(?:\s|$|\/|:))/i,
      /(?:Gender|Sex|लिंग)[:\s]*(?:Male|पुरुष|M)/i,
      /(?:पुरुष|Male)/i
    ];
    
    const femalePatterns = [
      /(?:Female|महिला|FEMALE|F(?:\s|$|\/|:))/i,
      /(?:Gender|Sex|लिंग)[:\s]*(?:Female|महिला|F)/i,
      /(?:महिला|Female)/i
    ];

    // Check each pattern
    for (const pattern of malePatterns) {
      if (pattern.test(text)) {
        console.log('Male gender detected');
        return 'Male';
      }
    }
    
    for (const pattern of femalePatterns) {
      if (pattern.test(text)) {
        console.log('Female gender detected');
        return 'Female';
      }
    }

    // Word-level analysis for gender
    if (words && words.length > 0) {
      for (const word of words) {
        const wordText = word.text.toLowerCase();
        if (['male', 'पुरुष', 'm'].includes(wordText)) {
          console.log('Male gender found in words');
          return 'Male';
        }
        if (['female', 'महिला', 'f'].includes(wordText)) {
          console.log('Female gender found in words');
          return 'Female';
        }
      }
    }

    console.log('Gender not found');
    return '';
  }

  /**
   * Fallback gender extraction
   */
  private fallbackGenderExtraction(text: string): string {
    // Simple character-by-character search
    const lowerText = text.toLowerCase();
    if (lowerText.includes('male') && !lowerText.includes('female')) {
      return 'Male';
    }
    if (lowerText.includes('female')) {
      return 'Female';
    }
    if (lowerText.includes('पुरुष')) {
      return 'Male';
    }
    if (lowerText.includes('महिला')) {
      return 'Female';
    }
    return 'Not Specified';
  }

  /**
   * Extract father's name with improved patterns
   */
  private extractFatherName(text: string, words: any[], lines: any[]): string {
    console.log('Extracting father name...');
    
    // Multiple patterns for father's name
    const patterns = [
      /(?:Father['\s]*s?\s*Name|Father|पिता|S\/O|Son\s+of)[:\s]*([A-Za-z\s]{2,40})(?:\n|DOB|Date|Gender|Male|Female|\d)/i,
      /(?:Guardian|अभिभावक)[:\s]*([A-Za-z\s]{2,40})(?:\n|DOB|Date|Gender)/i,
      /(?:Parent|माता-पिता)[:\s]*([A-Za-z\s]{2,40})(?:\n|DOB|Date|Gender)/i,
      /S\/O[:\s]*([A-Za-z\s]{2,40})(?:\n|DOB|Date|Gender|Male|Female|\d)/i,
      /पिता[:\s]*([A-Za-z\s]{2,40})(?:\n|जन्म|लिंग|\d)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const cleanedName = this.cleanAndValidateName(match[1]);
        if (cleanedName && cleanedName.length > 2) {
          console.log('Father name found:', cleanedName);
          return cleanedName;
        }
      }
    }

    console.log('Father name not found');
    return '';
  }

  /**
   * Extract date of birth with multiple formats
   */
  private extractDOB(text: string, words: any[]): string {
    console.log('Extracting DOB...');
    
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
            const normalized = this.normalizeDateFormat(dateStr);
            console.log('DOB found:', normalized);
            return normalized;
          }
        }
      }
    }

    console.log('DOB not found');
    return '';
  }

  /**
   * Extract Aadhaar number with validation
   */
  private extractAadhaarNumber(text: string, words: any[]): string {
    console.log('Extracting Aadhaar number...');
    
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
            console.log('Aadhaar number found:', cleaned);
            return cleaned;
          }
        }
      }
    }

    console.log('Aadhaar number not found');
    return '';
  }

  /**
   * Extract address information
   */
  private extractAddress(text: string, words: any[]): string {
    console.log('Extracting address...');
    
    // Look for address patterns after common keywords
    const addressMatch = text.match(/(?:Address|पता)[:\s]*([^]+?)(?:\n\n|\d{6}|PIN)/i);
    if (addressMatch && addressMatch[1]) {
      const address = addressMatch[1].trim().replace(/\n/g, ' ');
      console.log('Address found:', address);
      return address;
    }

    // Look for PIN code and extract text before it
    const pinMatch = text.match(/([^]+?)(\d{6})/);
    if (pinMatch && pinMatch[1]) {
      const addressPart = pinMatch[1].split('\n').slice(-3).join(' ').trim();
      if (addressPart.length > 10) {
        console.log('Address found via PIN:', addressPart);
        return addressPart;
      }
    }

    console.log('Address not found');
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
           !/(DOB|Gender|Male|Female|Address|Government|India|Aadhaar|Card|Unique|Identification)/i.test(cleaned) &&
           !this.isCommonNonNameWord(cleaned.toLowerCase()) &&
           // Prefer names that have proper capitalization
           /^[A-Z]/.test(cleaned);
  }

  private isCommonNonNameWord(word: string): boolean {
    const nonNameWords = [
      'government', 'india', 'aadhaar', 'aadhar', 'card', 'male', 'female', 
      'dob', 'address', 'pin', 'code', 'unique', 'identification',
      'authority', 'भारत', 'सरकार', 'आधार', 'of', 'the', 'and'
    ];
    return nonNameWords.includes(word.toLowerCase());
  }

  private isValidNameSequence(sequence: string): boolean {
    const words = sequence.trim().split(/\s+/);
    return words.length >= 1 && 
           words.length <= 4 && 
           words.every(word => /^[A-Za-z]+$/.test(word) && word.length > 1) &&
           // At least one word should be longer than 2 characters
           words.some(word => word.length > 2);
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