import React, { useState, useEffect } from 'react';
import { FormTemplate, AadhaarData } from '../types';
import { VoiceInput } from './VoiceInput';
import { NLPFieldMatcher } from '../utils/nlpMatcher';
import { Check, Edit3, Save, Sparkles, ArrowRight, ArrowLeft, Target } from 'lucide-react';

interface FormFillerProps {
  template: FormTemplate;
  aadhaarData: AadhaarData;
  onFormCompleted: (formData: Record<string, string>) => void;
  onBack: () => void;
}

export const FormFiller: React.FC<FormFillerProps> = ({ 
  template, 
  aadhaarData, 
  onFormCompleted,
  onBack
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [nlpMatcher] = useState(() => new NLPFieldMatcher());
  const [fieldMappings, setFieldMappings] = useState<Record<string, { confidence: number; source: string }>>({});
  const [tempInputValue, setTempInputValue] = useState<string>('');

  useEffect(() => {
    const initialData: Record<string, string> = {};
    const mappings: Record<string, { confidence: number; source: string }> = {};
    
    template.fields.forEach(field => {
      if (field.mappedFrom && aadhaarData[field.mappedFrom]) {
        initialData[field.id] = aadhaarData[field.mappedFrom] as string;
        mappings[field.id] = { confidence: 1.0, source: 'explicit' };
      } else {
        const match = nlpMatcher.matchField(field.label);
        if (match.aadhaarField && match.confidence > 0.6 && aadhaarData[match.aadhaarField]) {
          initialData[field.id] = aadhaarData[match.aadhaarField] as string;
          mappings[field.id] = { confidence: match.confidence, source: 'nlp' };
        }
      }
    });
    
    setFormData(initialData);
    setFieldMappings(mappings);
    
    console.log('Auto-filled fields:', initialData);
    console.log('Field mappings:', mappings);
  }, [template, aadhaarData, nlpMatcher]);

  const currentField = template.fields[currentFieldIndex];
  const isFieldFilled = formData[currentField?.id] !== undefined && formData[currentField?.id] !== '' && isEditing !== currentField?.id;

  const handleVoiceInput = (fieldId: string, text: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: text
    }));
  };

  const handleTextInputChange = (fieldId: string, value: string) => {
    setTempInputValue(value);
  };

  const saveTextInput = (fieldId: string) => {
    if (tempInputValue.trim()) {
      setFormData(prev => ({
        ...prev,
        [fieldId]: tempInputValue.trim()
      }));
    }
    setIsEditing(null);
    setTempInputValue('');
  };

  const startEditing = (fieldId: string) => {
    setIsEditing(fieldId);
    setTempInputValue(formData[fieldId] || '');
  };

  const cancelEditing = () => {
    setIsEditing(null);
    setTempInputValue('');
  };

  const nextField = () => {
    if (currentFieldIndex < template.fields.length - 1) {
      setCurrentFieldIndex(currentFieldIndex + 1);
      setIsEditing(null);
    }
  };

  const prevField = () => {
    if (currentFieldIndex > 0) {
      setCurrentFieldIndex(currentFieldIndex - 1);
      setIsEditing(null);
    }
  };

  const completeForm = () => {
    setIsEditing(null);
    onFormCompleted(formData);
  };

  const allFieldsFilled = template.fields.every(field => 
    !field.required || (formData[field.id] && formData[field.id].trim() !== '')
  );

  if (!currentField) return null;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>वापस जाएं | Go Back</span>
        </button>
      </div>
      
      <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Sparkles className="h-8 w-8 text-yellow-500 animate-spin" />
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              फॉर्म भरें | Fill Form
            </h2>
            <Sparkles className="h-8 w-8 text-yellow-500 animate-spin" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">{template.name}</h3>
          <div className="flex items-center justify-center space-x-2 text-lg">
            <Target className="h-5 w-5 text-blue-500" />
            <span className="text-blue-600 font-medium">
              फील्ड {currentFieldIndex + 1} / {template.fields.length}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-10">
          <div className="flex justify-between text-sm font-medium text-gray-700 mb-3">
            <span>प्रगति | Progress</span>
            <span className="bg-blue-100 px-3 py-1 rounded-full text-blue-700">
              {Math.round(((currentFieldIndex + 1) / template.fields.length) * 100)}% पूर्ण
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
            <div 
              className="bg-gradient-to-r from-green-400 to-emerald-500 h-3 rounded-full transition-all duration-500 shadow-lg"
              style={{ width: `${((currentFieldIndex + 1) / template.fields.length) * 100}%` }}
            >
              <div className="h-full bg-white/30 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Current field */}
        <div className="mb-10 bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-2xl border-2 border-blue-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                {currentFieldIndex + 1}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{currentField.label}</h3>
                <p className="text-gray-600">कृपया यह जानकारी भरें | Please fill this information</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {currentField.required && <span className="text-red-500">*</span>}
              {isFieldFilled && (
                <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
                  <Check className="h-5 w-5 text-green-500 animate-bounce" />
                  <span className="text-green-700 font-medium text-sm">पूर्ण</span>
                </div>
              )}
            </div>
          </div>

          {formData[currentField.id] && isEditing !== currentField.id ? (
            <div className="space-y-6">
              <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
                <div className="flex items-center space-x-3 mb-2">
                  <Check className="h-6 w-6 text-green-500" />
                  <span className="text-green-800 font-bold text-lg">वर्तमान मान | Current Value:</span>
                </div>
                <p className="text-green-800 text-xl font-semibold bg-white/50 p-3 rounded-lg">
                  {formData[currentField.id]}
                  {fieldMappings[currentField.id] && (
                    <span className="text-green-600 text-sm ml-3 bg-green-100 px-2 py-1 rounded-full">
                      आधार से भरा गया - {Math.round(fieldMappings[currentField.id].confidence * 100)}% सटीकता
                    </span>
                  )}
                </p>
              </div>
              
              <button
                onClick={() => startEditing(currentField.id)}
                className="flex items-center space-x-3 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                <Edit3 className="h-5 w-5" />
                <span className="font-medium">इसे संपादित करें | Edit this field</span>
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {currentField.type === 'select' ? (
                <div>
                  <label className="block text-lg font-bold text-gray-800 mb-3">
                    {currentField.label} चुनें | Select {currentField.label}
                  </label>
                  <select
                    value={isEditing === currentField.id ? tempInputValue : (formData[currentField.id] || '')}
                    onChange={(e) => {
                      if (isEditing === currentField.id) {
                        handleTextInputChange(currentField.id, e.target.value);
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          [currentField.id]: e.target.value
                        }));
                      }
                    }}
                    className="w-full p-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-300 focus:border-blue-500 text-lg font-medium bg-white shadow-inner"
                  >
                    <option value="">{currentField.label} चुनें | Select {currentField.label}</option>
                    {currentField.options?.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label htmlFor={`input-${currentField.id}`} className="block text-lg font-bold text-gray-800 mb-3">
                    {isEditing === currentField.id ? 'संपादित करें | Edit ' : 'भरें | Enter '}{currentField.label}
                  </label>
                  <input
                    id={`input-${currentField.id}`}
                    type={currentField.type}
                    value={isEditing === currentField.id ? tempInputValue : (formData[currentField.id] || '')}
                    onChange={(e) => handleTextInputChange(currentField.id, e.target.value)}
                    placeholder={`${currentField.label} भरें | Enter ${currentField.label}`}
                    className="w-full p-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-300 focus:border-blue-500 text-lg font-medium bg-white shadow-inner transition-all duration-200"
                    autoComplete="off"
                    spellCheck="false"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        saveTextInput(currentField.id);
                      } else if (e.key === 'Escape') {
                        cancelEditing();
                      }
                    }}
                    onFocus={() => {
                      if (isEditing !== currentField.id) {
                        startEditing(currentField.id);
                      }
                    }}
                    key={`${currentField.id}-${isEditing}`}
                  />
                </div>
              )}

              {isEditing !== currentField.id && (
                <div className="border-t-2 border-dashed border-gray-300 pt-6">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-200">
                    <h4 className="text-lg font-bold text-purple-800 mb-4 flex items-center">
                      <span className="mr-2">🎤</span>
                      या आवाज़ का उपयोग करें | Or use voice input:
                    </h4>
                    <VoiceInput
                      onVoiceResult={(text) => {
                        handleVoiceInput(currentField.id, text);
                      }}
                      fieldLabel={currentField.label}
                      disabled={isEditing === currentField.id}
                    />
                  </div>
                </div>
              )}

              {isEditing && (
                <div className="flex flex-wrap gap-4 justify-center">
                  <button
                    onClick={() => saveTextInput(currentField.id)}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transform hover:scale-105 transition-all duration-200 shadow-lg font-medium"
                  >
                    <Save className="h-5 w-5" />
                    <span>सेव करें | Save Changes</span>
                  </button>
                  <button
                    onClick={() => {
                      setTempInputValue('');
                    }}
                    className="flex items-center space-x-2 px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 font-medium"
                  >
                    <span>साफ़ करें | Clear Field</span>
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="flex items-center space-x-2 px-6 py-3 border-2 border-red-300 text-red-600 rounded-xl hover:bg-red-50 transform hover:scale-105 transition-all duration-200 font-medium"
                  >
                    <span>रद्द करें | Cancel</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between items-center bg-gray-50 p-6 rounded-xl">
          <button
            onClick={prevField}
            disabled={currentFieldIndex === 0 || isEditing}
            className="flex items-center space-x-2 px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 font-medium"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>पिछला | Previous</span>
          </button>

          <div className="flex space-x-4">
            {currentFieldIndex < template.fields.length - 1 ? (
              <button
                onClick={nextField}
                disabled={!isFieldFilled || isEditing}
                className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 shadow-lg font-medium"
              >
                <span>अगला फील्ड | Next Field</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={completeForm}
                disabled={!allFieldsFilled || isEditing}
                className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 shadow-lg font-medium"
              >
                <Check className="h-5 w-5" />
                <span>फॉर्म पूरा करें | Complete Form</span>
              </button>
            )}
          </div>
        </div>

        {/* Form preview sidebar */}
        <div className="mt-10 bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-xl border-2 border-gray-200">
          <h4 className="font-bold text-gray-900 mb-4 text-lg flex items-center">
            <span className="mr-2">👁️</span>
            फॉर्म पूर्वावलोकन | Form Preview
          </h4>
          <div className="grid gap-3">
            {template.fields.map((field, index) => (
              <div
                key={field.id}
                className={`flex justify-between items-center text-sm p-3 rounded-lg transition-all duration-200 ${
                  index === currentFieldIndex 
                    ? 'bg-blue-100 border-2 border-blue-300 transform scale-105' 
                    : 'bg-white border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span className="font-semibold text-gray-700">{field.label}:</span>
                <span className={`font-medium ${formData[field.id] ? 'text-green-600' : 'text-gray-400'}`}>
                  {formData[field.id] || 'अभी तक नहीं भरा'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
