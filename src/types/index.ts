export interface AadhaarData {
  name: string;
  fatherName?: string;
  dob: string;
  gender: string;
  aadhaarNumber: string;
  address?: string;
}

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'date' | 'select' | 'number';
  required: boolean;
  options?: string[];
  mappedFrom?: keyof AadhaarData;
  value?: string;
}

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  fields: FormField[];
}

export interface VoiceRecognitionResult {
  text: string;
  confidence: number;
}