import React from 'react';
import { ArrowRight, Users, Sprout } from 'lucide-react';
import { FormTemplate } from '../types';
import { formTemplates } from '../utils/formTemplates';

interface FormSelectorProps {
  onFormSelected: (template: FormTemplate) => void;
}

export const FormSelector: React.FC<FormSelectorProps> = ({ onFormSelected }) => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose a Government Form</h2>
        <p className="text-gray-600">
          Select the form you want to fill using your Aadhaar information
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {formTemplates.map((template) => (
          <div
            key={template.id}
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-green-200"
            onClick={() => onFormSelected(template)}
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {template.id === 'jan-dhan' ? (
                  <Users className="h-12 w-12 text-blue-500" />
                ) : (
                  <Sprout className="h-12 w-12 text-green-500" />
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {template.name}
                </h3>
                <p className="text-gray-600 mb-4">
                  {template.description}
                </p>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    Required fields: {template.fields.length}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {template.fields.slice(0, 3).map((field) => (
                      <span
                        key={field.id}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {field.label}
                      </span>
                    ))}
                    {template.fields.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        +{template.fields.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <ArrowRight className="h-6 w-6 text-gray-400 flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-blue-50 p-6 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">What happens next?</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• We'll automatically fill fields using your Aadhaar data</li>
          <li>• For missing information, you can type or speak the answers</li>
          <li>• Review the completed form before saving</li>
          <li>• Download as PDF or print directly</li>
        </ul>
      </div>
    </div>
  );
};