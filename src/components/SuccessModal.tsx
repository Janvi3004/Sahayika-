import React, { useEffect, useState } from 'react';
import { CheckCircle, Download, Printer, X, Sparkles, Trophy, Star } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  formName: string;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, formName }) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      // Auto-hide confetti after animation
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 relative overflow-hidden">
        {/* Confetti Animation */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random()}s`
                }}
              >
                <Star className="h-4 w-4 text-yellow-400" />
              </div>
            ))}
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        {/* Modal content */}
        <div className="p-8 text-center">
          {/* Success icon with animation */}
          <div className="relative mb-6">
            <div className="mx-auto w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center animate-pulse">
              <CheckCircle className="h-12 w-12 text-white animate-bounce" />
            </div>
            <div className="absolute -top-2 -right-2">
              <Trophy className="h-8 w-8 text-yellow-500 animate-spin" />
            </div>
            <div className="absolute -bottom-2 -left-2">
              <Sparkles className="h-6 w-6 text-purple-500 animate-pulse" />
            </div>
          </div>

          {/* Success message */}
          <div className="mb-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">
              🎉 बधाई हो! 🎉
            </h2>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Form Approved!
            </h3>
            <p className="text-lg text-gray-600 mb-2">
              आपका <span className="font-semibold text-green-600">{formName}</span> सफलतापूर्वक पूरा हो गया है!
            </p>
            <p className="text-gray-500">
              Your form has been successfully completed and is ready for submission.
            </p>
          </div>

          {/* Status indicators */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl mb-6 border-2 border-green-200">
            <div className="flex items-center justify-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-700 font-medium">सत्यापित | Verified</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-blue-700 font-medium">तैयार | Ready</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="text-purple-700 font-medium">अनुमोदित | Approved</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={() => {
                // Trigger download
                const event = new CustomEvent('downloadPDF');
                window.dispatchEvent(event);
              }}
              className="w-full flex items-center justify-center space-x-3 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transform hover:scale-105 transition-all duration-200 shadow-lg font-medium"
            >
              <Download className="h-5 w-5" />
              <span>डाउनलोड करें | Download PDF</span>
            </button>

            <button
              onClick={() => {
                window.print();
              }}
              className="w-full flex items-center justify-center space-x-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transform hover:scale-105 transition-all duration-200 shadow-lg font-medium"
            >
              <Printer className="h-5 w-5" />
              <span>प्रिंट करें | Print Form</span>
            </button>

            <button
              onClick={onClose}
              className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 font-medium"
            >
              बंद करें | Close
            </button>
          </div>

          {/* Additional info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-sm text-blue-800 font-medium mb-1">
              📋 अगले चरण | Next Steps:
            </p>
            <ul className="text-xs text-blue-700 space-y-1 text-left">
              <li>• फॉर्म को प्रिंट करें या PDF के रूप में सेव करें</li>
              <li>• आवश्यक दस्तावेजों के साथ संबंधित कार्यालय में जमा करें</li>
              <li>• Print the form or save as PDF</li>
              <li>• Submit to the relevant office with required documents</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};