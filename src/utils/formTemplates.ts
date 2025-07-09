import { FormTemplate } from '../types';
import { NLPFieldMatcher } from './nlpMatcher';

const nlpMatcher = new NLPFieldMatcher();

/**
 * Enhanced form templates with better field mapping
 */

export const formTemplates: FormTemplate[] = [
  {
    id: 'jan-dhan',
    name: 'Jan Dhan Yojana Account Opening',
    description: 'Open a bank account under Pradhan Mantri Jan Dhan Yojana',
    fields: [
      {
        id: 'applicantName',
        label: 'Applicant Name',
        type: 'text',
        required: true,
        mappedFrom: 'name'
      },
      {
        id: 'fatherName',
        label: 'Father\'s Name',
        type: 'text',
        required: true,
        mappedFrom: 'fatherName'
      },
      {
        id: 'dob',
        label: 'Date of Birth',
        type: 'date',
        required: true,
        mappedFrom: 'dob'
      },
      {
        id: 'gender',
        label: 'Gender',
        type: 'select',
        required: true,
        options: ['Male', 'Female', 'Other'],
        mappedFrom: 'gender'
      },
      {
        id: 'aadhaarNumber',
        label: 'Aadhaar Number',
        type: 'text',
        required: true,
        mappedFrom: 'aadhaarNumber'
      },
      {
        id: 'mobileNumber',
        label: 'Mobile Number',
        type: 'text',
        required: true
      },
      {
        id: 'occupation',
        label: 'Occupation',
        type: 'select',
        required: true,
        options: ['Agriculture', 'Business', 'Service', 'Self-Employed', 'Housewife', 'Student', 'Other']
      },
      {
        id: 'monthlyIncome',
        label: 'Monthly Income (₹)',
        type: 'number',
        required: true
      }
    ]
  },
  {
    id: 'pm-kisan',
    name: 'PM-Kisan Scheme Registration',
    description: 'Register for Pradhan Mantri Kisan Samman Nidhi Yojana',
    fields: [
      {
        id: 'farmerName',
        label: 'Farmer Name',
        type: 'text',
        required: true,
        mappedFrom: 'name'
      },
      {
        id: 'fatherName',
        label: 'Father\'s Name',
        type: 'text',
        required: true,
        mappedFrom: 'fatherName'
      },
      {
        id: 'dob',
        label: 'Date of Birth',
        type: 'date',
        required: true,
        mappedFrom: 'dob'
      },
      {
        id: 'gender',
        label: 'Gender',
        type: 'select',
        required: true,
        options: ['Male', 'Female', 'Other'],
        mappedFrom: 'gender'
      },
      {
        id: 'aadhaarNumber',
        label: 'Aadhaar Number',
        type: 'text',
        required: true,
        mappedFrom: 'aadhaarNumber'
      },
      {
        id: 'mobileNumber',
        label: 'Mobile Number',
        type: 'text',
        required: true
      },
      {
        id: 'bankAccountNumber',
        label: 'Bank Account Number',
        type: 'text',
        required: true
      },
      {
        id: 'ifscCode',
        label: 'IFSC Code',
        type: 'text',
        required: true
      },
      {
        id: 'landArea',
        label: 'Total Land Area (in hectares)',
        type: 'number',
        required: true
      },
      {
        id: 'landType',
        label: 'Land Type',
        type: 'select',
        required: true,
        options: ['Irrigated', 'Un-irrigated', 'Mixed']
      }
    ]
  }
];