import React from 'react';
import { Download, Printer as Print, ArrowLeft, Home } from 'lucide-react';
import { FormTemplate, AadhaarData } from '../types';
import { generateFormPDF } from '../utils/pdfGenerator';

interface FormPreviewProps {
  template: FormTemplate;
  formData: Record<string, string>;
  aadhaarData: AadhaarData;
  onBack: () => void;
  onBackToHome: () => void;
}

export const FormPreview: React.FC<FormPreviewProps> = ({ 
  template, 
  formData, 
  aadhaarData,
  onBack,
  onBackToHome
}) => {
  const handleDownloadPDF = async () => {
    try {
      await generateFormPDF(template, formData, aadhaarData);
    } catch (error) {
      console.error('PDF generation failed:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Form Preview</h2>
              <p className="text-gray-600">{template.name}</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onBackToHome}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Home className="h-4 w-4" />
                <span>होम | Home</span>
              </button>
              <button
                onClick={onBack}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>संपादित करें | Edit</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                <Print className="h-4 w-4" />
                <span>प्रिंट | Print</span>
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                <Download className="h-4 w-4" />
                <span>डाउनलोड | Download</span>
              </button>
            </div>
          </div>
        </div>

        {/* Form content */}
        <div className="p-8" id="form-content">
          <div className="max-w-2xl mx-auto">
            {/* Official header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Government of India</h1>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">{template.name}</h2>
              <div className="border-b-2 border-gray-300 w-full" />
            </div>

            {/* Form fields */}
            <div className="space-y-6">
              {template.fields.map((field) => (
                <div key={field.id} className="flex items-start space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <div className="min-h-[2rem] p-3 border-b border-gray-300 bg-gray-50">
                      <span className="text-gray-900">
                        {formData[field.id] || ''}
                      </span>
                    </div>
                  </div>
                  
                  {field.mappedFrom && (
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        स्वतः भरा गया
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-12 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center text-sm text-gray-600">
                <div>
                  <p>निर्मित दिनांक | Generated on: {new Date().toLocaleString()}</p>
                  <p>आवेदन संख्या | Application ID: {Date.now()}</p>
                </div>
                <div className="text-right">
                  <p>सहायिका द्वारा निर्मित</p>
                  <p>आवाज़ फॉर्म सहायक</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};