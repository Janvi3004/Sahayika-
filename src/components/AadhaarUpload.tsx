import React, { useState } from 'react';
import { Upload, Camera, FileText, Loader2, Sparkles, CheckCircle } from 'lucide-react';
import { processAadhaarCard } from '../utils/ocr';
import { AadhaarData } from '../types';

interface AadhaarUploadProps {
  onAadhaarProcessed: (data: AadhaarData) => void;
}

export const AadhaarUpload: React.FC<AadhaarUploadProps> = ({ onAadhaarProcessed }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<string>('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setProcessingStep('Preparing image...');

    try {
      setProcessingStep('Processing with OCR engine...');
      const aadhaarData = await processAadhaarCard(file);
      setProcessingStep('Extracting information...');
      
      // Log the extracted data for debugging
      console.log('Extracted Aadhaar Data:', aadhaarData);
      
      setProcessingStep('Validating data...');
      onAadhaarProcessed(aadhaarData);
    } catch (err) {
      console.error('Aadhaar processing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process Aadhaar card');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8 animate-fade-in">
        <div className="relative inline-block">
          <FileText className="h-20 w-20 mx-auto text-emerald-500 mb-4 animate-bounce" />
          <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-yellow-400 animate-spin" />
        </div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-3">
          अपना आधार कार्ड अपलोड करें
        </h2>
        <h3 className="text-2xl font-semibold text-gray-700 mb-2">Upload Your Aadhaar Card</h3>
        <p className="text-lg text-gray-600 leading-relaxed">
          आधार कार्ड की स्पष्ट तस्वीर लें ताकि फॉर्म अपने आप भर जाए
        </p>
        <p className="text-gray-500 mt-1">
          Take a clear photo of your Aadhaar card to automatically fill form details
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
        <div className={`border-3 border-dashed rounded-2xl p-12 text-center transition-all duration-300 transform hover:scale-105 ${
          isProcessing 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-50'
        }`}>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            id="aadhaar-upload"
            disabled={isProcessing}
          />
          
          <label 
            htmlFor="aadhaar-upload" 
            className="cursor-pointer flex flex-col items-center space-y-6"
          >
            {isProcessing ? (
              <div className="relative">
                <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
                <div className="absolute inset-0 h-16 w-16 border-4 border-blue-200 rounded-full animate-pulse"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <Camera className="h-16 w-16 text-emerald-500 animate-pulse" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">📸</span>
                  </div>
                </div>
                <div>
                  <p className="text-xl font-bold text-emerald-700 mb-2">
                    आधार कार्ड अपलोड करने के लिए क्लिक करें
                  </p>
                  <p className="text-lg font-medium text-gray-700 mb-1">
                    Click to upload Aadhaar card
                  </p>
                  <p className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full inline-block">
                    PNG, JPG up to 10MB
                  </p>
                </div>
              </div>
            )}
          </label>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg animate-shake">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">❌</span>
              <div>
                <p className="text-red-800 font-semibold">त्रुटि | Error</p>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl">
            <div className="flex items-center space-x-3">
              <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
              <div>
                <p className="text-blue-800 font-bold text-lg">
                  आपका आधार कार्ड प्रोसेस हो रहा है...
                </p>
                <p className="text-blue-700">
                  {processingStep || 'Processing your Aadhaar card with enhanced OCR...'}
                </p>
              </div>
            </div>
            <div className="mt-4 w-full bg-blue-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full animate-pulse transition-all duration-500" style={{width: processingStep.includes('Preparing') ? '25%' : processingStep.includes('Processing') ? '50%' : processingStep.includes('Extracting') ? '75%' : '90%'}}></div>
            </div>
          </div>
        )}

        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-center space-x-3 text-sm bg-green-50 p-3 rounded-full">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-green-700 font-medium">
              आपका डेटा स्थानीय रूप से प्रोसेस होता है, कहीं अपलोड नहीं होता
            </span>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border-l-4 border-green-400">
            <h3 className="font-bold text-green-800 mb-3 text-lg flex items-center">
              <span className="mr-2">💡</span>
              बेहतर परिणाम के लिए सुझाव | Tips for best results:
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              <ul className="text-sm text-green-700 space-y-2">
                <li className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span>फोटो लेते समय अच्छी रोशनी सुनिश्चित करें</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span>आधार कार्ड को सपाट और पूरी तरह दिखाएं</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span>कार्ड पर छाया या चमक से बचें</span>
                </li>
              </ul>
              <ul className="text-sm text-green-600 space-y-2">
                <li>• Ensure good lighting when taking the photo</li>
                <li>• Keep the Aadhaar card flat and fully visible</li>
                <li>• Avoid shadows or glare on the card</li>
            </ul>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border-l-4 border-blue-400">
            <h3 className="font-bold text-blue-800 mb-3 text-lg flex items-center">
              <span className="mr-2">🤖</span>
              उन्नत प्रसंस्करण | Enhanced Processing:
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              <ul className="text-sm text-blue-700 space-y-2">
                <li className="flex items-center space-x-2">
                  <span className="text-blue-500">⚡</span>
                  <span>हिंदी और अंग्रेजी समर्थन के साथ उन्नत OCR</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-blue-500">🧠</span>
                  <span>AI का उपयोग करके स्मार्ट फील्ड मैचिंग</span>
                </li>
              </ul>
              <ul className="text-sm text-blue-600 space-y-2">
                <li>• Advanced OCR with Hindi and English support</li>
                <li>• Smart field matching using AI</li>
            </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};