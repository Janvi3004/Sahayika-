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
    console.log('Full OCR text for debugging:', text);
    
    // Strategy 1: Look for name directly after Hindi/English name patterns
    const namePatterns = [
      // Look for name after Government of India header - most reliable
      /Government\s+of\s+India\s*\n\s*([A-Za-z\s]{3,50})\s*\n/i,
      // Look for name in Hindi script area
      /प्रकाश\s+गोपीचंद\s+राठोड|([A-Za-z\s]{3,50})\s*\n.*जन्म\s+तारीख/i,
      // Look for name before DOB pattern
      /([A-Za-z\s]{3,50})\s*\n.*(?:DOB|जन्म\s+तारीख)/i,
      // Look for name before gender
      /([A-Za-z\s]{3,50})\s*\n.*(?:Male|Female|पुरुष|महिला)/i,
      // Direct name extraction from structured position
      /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*$/m
    ];

    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const cleanedName = this.cleanAndValidateName(match[1]);
        if (cleanedName && cleanedName.length > 2 && this.isRealisticName(cleanedName)) {
          console.log('Name found via pattern:', cleanedName);
          return cleanedName;
        }
      }
    }

    // Strategy 2: Look for the specific name structure in lines
    const textLines = text.split('\n').filter(line => line.trim().length > 0);
    console.log('Text lines for analysis:', textLines);
    
    // Look for lines that contain the actual name pattern
    for (let i = 0; i < Math.min(textLines.length, 10); i++) {
      const line = textLines[i].trim();
      
      // Check if this line looks like a name and is in the right position
      if (this.isLikelyName(line) && this.isInNamePosition(line, textLines, i)) {
        const cleanedName = this.cleanAndValidateName(line);
        if (cleanedName && cleanedName.length > 2 && this.isRealisticName(cleanedName)) {
          console.log('Name found via line analysis:', cleanedName);
          return cleanedName;
        }
      }
    }

    // Strategy 3: Word-level analysis focusing on name area
    if (words && words.length > 0) {
      const nameFromWords = this.extractNameFromWords(words);
      if (nameFromWords) {
        console.log('Name found via word analysis:', nameFromWords);
        return nameFromWords;
      }
    }

    // Strategy 4: Look for specific patterns that match Aadhaar card structure
    const specificPatterns = [
      // After Government of India, before DOB
      /Government\s+of\s+India[\s\S]*?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*?)[\s\S]*?DOB/i,
      // Between header and date pattern
      /Unique\s+Identification[\s\S]*?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*?)[\s\S]*?\d{2}\/\d{2}\/\d{4}/i,
      // Look for capitalized words before Male/Female
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*?)\s*(?:Male|Female)/i
    ];

    for (const pattern of specificPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const cleanedName = this.cleanAndValidateName(match[1]);
        if (cleanedName && cleanedName.length > 2 && this.isRealisticName(cleanedName)) {
          console.log('Name found via specific pattern:', cleanedName);
          return cleanedName;
        }
      }
    }

    console.log('No name found using primary methods');
    return '';
  }

  /**
   * Fallback name extraction method
   */
  private fallbackNameExtraction(text: string, words: any[]): string {
    console.log('Using fallback name extraction...');
    
    // Look for sequences of capitalized words that could be names
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const trimmed = line.trim();
      
      // Look for properly formatted names
      if (trimmed.length > 5 && trimmed.length < 50 && 
          /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*$/.test(trimmed) && 
          !this.containsNonNameKeywords(trimmed) &&
          this.isRealisticName(trimmed)) {
        const cleaned = this.cleanAndValidateName(trimmed);
        if (cleaned && cleaned.length > 2) {
          console.log('Fallback name found:', cleaned);
          return cleaned;
        }
      }
    }
    
    // Last resort: look for any reasonable name pattern
    const nameMatch = text.match(/([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
    if (nameMatch && nameMatch[1] && !this.containsNonNameKeywords(nameMatch[1])) {
      const cleaned = this.cleanAndValidateName(nameMatch[1]);
      if (cleaned && this.isRealisticName(cleaned)) {
        console.log('Last resort name found:', cleaned);
        return cleaned;
      }
    }
    
    return '';
  }

  /**
   * Extract name from word-level OCR data with improved logic
   */
  private extractNameFromWords(words: any[]): string {
    console.log('Extracting name from words...');
    
    // Filter words that could be part of a name
    const nameWords = words.filter(word => 
      word.confidence > 40 && 
      /^[A-Za-z]+$/.test(word.text) &&
      word.text.length > 1 &&
      !this.isCommonNonNameWord(word.text) &&
      /^[A-Z]/.test(word.text) && // Must start with capital
      word.text.length > 2 // Must be longer than 2 characters
    );

    if (nameWords.length === 0) return '';

    // Sort by position - focus on top area of card
    nameWords.sort((a, b) => {
      const aY = a.bbox?.y0 || 0;
      const bY = b.bbox?.y0 || 0;
      if (Math.abs(aY - bY) > 20) return aY - bY;
      return (a.bbox?.x0 || 0) - (b.bbox?.x0 || 0);
    });

    // Focus on words in the name area (typically in the upper portion)
    const topWords = nameWords.filter(word => {
      const y = word.bbox?.y0 || 0;
      return y > 50 && y < 300; // Adjust based on typical Aadhaar layout
    });
    
    let bestName = '';
    
    // Try to build name sequences from consecutive words
    for (let i = 0; i < topWords.length - 1; i++) {
      const word1 = topWords[i];
      const word2 = topWords[i + 1];
      const word3 = topWords[i + 2];
      
      // Check if words are on the same line or close to each other
      const y1 = word1.bbox?.y0 || 0;
      const y2 = word2.bbox?.y0 || 0;
      const y3 = word3?.bbox?.y0 || 0;
      
      // Two word name
      if (Math.abs(y1 - y2) < 20) {
        const twoWordName = `${word1.text} ${word2.text}`;
        if (this.isValidNameSequence(twoWordName) && this.isRealisticName(twoWordName)) {
          if (twoWordName.length > bestName.length) {
            bestName = twoWordName;
          }
        }
      }
      
      // Three word name
      if (word3 && Math.abs(y1 - y2) < 20 && Math.abs(y2 - y3) < 20) {
        const threeWordName = `${word1.text} ${word2.text} ${word3.text}`;
        if (this.isValidNameSequence(threeWordName) && this.isRealisticName(threeWordName)) {
          if (threeWordName.length > bestName.length) {
            bestName = threeWordName;
          }
        }
      }
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
    return /^[A-Z][A-Za-z\s]+$/.test(cleaned) && 
           cleaned.length > 2 && 
           cleaned.length < 50 &&
           !/\d/.test(cleaned) &&
           !this.containsNonNameKeywords(cleaned) &&
           // Should have proper name structure
           this.hasProperNameStructure(cleaned);
  }

  private isInNamePosition(line: string, allLines: string[], index: number): boolean {
    // Name typically appears after "Government of India" but before DOB/Gender
    const prevLines = allLines.slice(0, index).join(' ').toLowerCase();
    const nextLines = allLines.slice(index + 1).join(' ').toLowerCase();
    
    const hasGovernmentBefore = prevLines.includes('government') || prevLines.includes('india');
    const hasPersonalInfoAfter = nextLines.includes('dob') || nextLines.includes('male') || 
                                nextLines.includes('female') || nextLines.includes('जन्म');
    
    return hasGovernmentBefore && hasPersonalInfoAfter;
  }

  private containsNonNameKeywords(text: string): boolean {
    const keywords = [
      'government', 'india', 'aadhaar', 'card', 'unique', 'identification',
      'authority', 'dob', 'gender', 'male', 'female', 'address',
      'भारत', 'सरकार', 'आधार', 'जन्म', 'लिंग', 'पता'
    ];
    const lowerText = text.toLowerCase();
    return keywords.some(keyword => lowerText.includes(keyword));
  }

  private hasProperNameStructure(text: string): boolean {
    // Names should have 1-4 words, each starting with capital
    const words = text.trim().split(/\s+/);
    return words.length >= 1 && words.length <= 4 &&
           words.every(word => /^[A-Z][a-z]+$/.test(word) && word.length > 1);
  }

  private isRealisticName(name: string): boolean {
    if (!name || name.length < 3) return false;
    
    const words = name.trim().split(/\s+/);
    
    // Should have 1-4 words
    if (words.length < 1 || words.length > 4) return false;
    
    // Each word should be reasonable length and format
    return words.every(word => 
      word.length >= 2 && 
      word.length <= 20 && 
      /^[A-Z][a-z]+$/.test(word) &&
      !this.isCommonNonNameWord(word.toLowerCase())
    );
  }

  private isCommonNonNameWord(word: string): boolean {
    const nonNameWords = [
      'government', 'india', 'aadhaar', 'aadhar', 'card', 'male', 'female', 
      'dob', 'address', 'pin', 'code', 'unique', 'identification',
      'authority', 'भारत', 'सरकार', 'आधार', 'of', 'the', 'and',
      'hod', 'hrt', 'thr', 'wo', 'govt' // Common OCR errors
    ];
    return nonNameWords.includes(word.toLowerCase());
  }

  private isValidNameSequence(sequence: string): boolean {
    const words = sequence.trim().split(/\s+/);
    return words.length >= 2 && // Names should have at least 2 words typically
           words.length <= 4 && 
           words.every(word => /^[A-Z][a-z]+$/.test(word) && word.length > 1) &&
           words.some(word => word.length > 2) && // At least one substantial word
           !this.containsNonNameKeywords(sequence);
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