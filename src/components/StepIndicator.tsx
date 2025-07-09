import React from 'react';
import { Check, Upload, FileSearch, Edit, Eye } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
  steps: string[];
}

const stepIcons = [Upload, FileSearch, Edit, Eye];
const hindiSteps = [
  'आधार अपलोड करें',
  'फॉर्म चुनें',
  'विवरण भरें',
  'देखें और डाउनलोड करें',
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  steps,
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-center text-2xl font-bold text-gray-800 mb-8">
          प्रक्रिया के चरण | Process Steps
        </h2>
        <div className="flex items-center justify-between relative">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const StepIcon = stepIcons[index];

            return (
              <div
                key={index}
                className="flex flex-col items-center text-center w-1/4 relative"
              >
                <div
                  className={`
                    relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-3 text-sm font-bold transition-all duration-500 transform
                    ${
                      isCompleted
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 border-green-400 text-white shadow-lg scale-110'
                        : isCurrent
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 border-blue-400 text-white shadow-xl scale-125 animate-pulse'
                        : 'bg-white border-gray-300 text-gray-400 hover:border-gray-400'
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="h-6 w-6 animate-bounce" />
                  ) : isCurrent ? (
                    <StepIcon className="h-6 w-6 animate-pulse" />
                  ) : (
                    <StepIcon className="h-5 w-5" />
                  )}

                  {isCurrent && (
                    <div className="absolute -inset-2 bg-blue-400 rounded-full animate-ping opacity-30" />
                  )}
                </div>

                <div className="mt-3">
                  <div
                    className={`text-sm font-bold ${
                      isCurrent
                        ? 'text-blue-600'
                        : isCompleted
                        ? 'text-green-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {hindiSteps[index]}
                  </div>
                  <div
                    className={`text-xs mt-1 ${
                      isCurrent
                        ? 'text-blue-500'
                        : isCompleted
                        ? 'text-green-500'
                        : 'text-gray-400'
                    }`}
                  >
                    {step}
                  </div>
                </div>

                {/* Horizontal connector */}
                {index < steps.length - 1 && (
                  <div
                    className={`hidden md:block absolute top-8 left-1/2 w-full h-1 -z-10 ${
                      isCompleted
                        ? 'bg-gradient-to-r from-green-400 to-emerald-400'
                        : 'bg-gray-200'
                    }`}
                    style={{ width: '100%', height: '3px', left: '50%', transform: 'translateX(50%)' }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
