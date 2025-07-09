import Fuse from 'fuse.js';

interface FieldMapping {
  formField: string;
  aadhaarField: keyof import('../types').AadhaarData;
  aliases: string[];
  confidence: number;
}

// Enhanced field mappings with aliases and variations
const fieldMappings: FieldMapping[] = [
  {
    formField: 'name',
    aadhaarField: 'name',
    aliases: ['applicant name', 'full name', 'candidate name', 'person name', 'नाम', 'आवेदक का नाम'],
    confidence: 0.9
  },
  {
    formField: 'father',
    aadhaarField: 'fatherName',
    aliases: ['father name', 'fathers name', 'guardian name', 'parent name', 'पिता का नाम', 'अभिभावक का नाम', 's/o', 'son of'],
    confidence: 0.85
  },
  {
    formField: 'dob',
    aadhaarField: 'dob',
    aliases: ['date of birth', 'birth date', 'dob', 'जन्म तिथि', 'जन्मदिन'],
    confidence: 0.9
  },
  {
    formField: 'gender',
    aadhaarField: 'gender',
    aliases: ['sex', 'gender', 'लिंग', 'male/female'],
    confidence: 0.9
  },
  {
    formField: 'aadhaar',
    aadhaarField: 'aadhaarNumber',
    aliases: ['aadhaar number', 'aadhar number', 'uid', 'unique id', 'आधार संख्या', 'आधार नंबर'],
    confidence: 0.95
  },
  {
    formField: 'address',
    aadhaarField: 'address',
    aliases: ['address', 'permanent address', 'residential address', 'पता', 'स्थायी पता'],
    confidence: 0.8
  }
];

export class NLPFieldMatcher {
  private fuse: Fuse<FieldMapping>;

  constructor() {
    // Configure Fuse.js for fuzzy string matching
    this.fuse = new Fuse(fieldMappings, {
      keys: ['formField', 'aliases'],
      threshold: 0.4, // Lower threshold = more strict matching
      includeScore: true,
      minMatchCharLength: 2
    });
  }

  /**
   * Match form field labels to Aadhaar data fields using NLP
   */
  matchField(fieldLabel: string): { 
    aadhaarField: keyof import('../types').AadhaarData | null; 
    confidence: number;
    matchedText: string;
  } {
    const cleanLabel = this.cleanFieldLabel(fieldLabel);
    const results = this.fuse.search(cleanLabel);

    if (results.length > 0) {
      const bestMatch = results[0];
      const confidence = 1 - (bestMatch.score || 0); // Convert Fuse score to confidence
      
      return {
        aadhaarField: bestMatch.item.aadhaarField,
        confidence: confidence * bestMatch.item.confidence,
        matchedText: bestMatch.item.formField
      };
    }

    // Fallback: try direct string similarity
    const directMatch = this.findDirectMatch(cleanLabel);
    if (directMatch) {
      return directMatch;
    }

    return {
      aadhaarField: null,
      confidence: 0,
      matchedText: ''
    };
  }

  /**
   * Clean and normalize field labels for better matching
   */
  private cleanFieldLabel(label: string): string {
    return label
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Direct pattern matching for common variations
   */
  private findDirectMatch(cleanLabel: string): {
    aadhaarField: keyof import('../types').AadhaarData;
    confidence: number;
    matchedText: string;
  } | null {
    // Name patterns
    if (cleanLabel.includes('name') && !cleanLabel.includes('father') && !cleanLabel.includes('guardian')) {
      return { aadhaarField: 'name', confidence: 0.8, matchedText: 'name' };
    }

    // Father/Guardian patterns
    if (cleanLabel.includes('father') || cleanLabel.includes('guardian') || cleanLabel.includes('parent')) {
      return { aadhaarField: 'fatherName', confidence: 0.8, matchedText: 'father' };
    }

    // Date patterns
    if (cleanLabel.includes('date') && cleanLabel.includes('birth')) {
      return { aadhaarField: 'dob', confidence: 0.8, matchedText: 'dob' };
    }

    // Gender patterns
    if (cleanLabel.includes('gender') || cleanLabel.includes('sex')) {
      return { aadhaarField: 'gender', confidence: 0.8, matchedText: 'gender' };
    }

    // Aadhaar patterns
    if (cleanLabel.includes('aadhaar') || cleanLabel.includes('aadhar') || cleanLabel.includes('uid')) {
      return { aadhaarField: 'aadhaarNumber', confidence: 0.9, matchedText: 'aadhaar' };
    }

    // Address patterns
    if (cleanLabel.includes('address') || cleanLabel.includes('residence')) {
      return { aadhaarField: 'address', confidence: 0.7, matchedText: 'address' };
    }

    return null;
  }

  /**
   * Get all possible matches for a field with confidence scores
   */
  getAllMatches(fieldLabel: string): Array<{
    aadhaarField: keyof import('../types').AadhaarData;
    confidence: number;
    matchedText: string;
  }> {
    const cleanLabel = this.cleanFieldLabel(fieldLabel);
    const results = this.fuse.search(cleanLabel);

    return results.map(result => ({
      aadhaarField: result.item.aadhaarField,
      confidence: (1 - (result.score || 0)) * result.item.confidence,
      matchedText: result.item.formField
    }));
  }
}