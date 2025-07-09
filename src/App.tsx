import React, { useState } from 'react';
import { Header } from './components/Header';
import { StepIndicator } from './components/StepIndicator';
import { AadhaarUpload } from './components/AadhaarUpload';
import { FormSelector } from './components/FormSelector';
import { FormFiller } from './components/FormFiller';
import { FormPreview } from './components/FormPreview';
import { AadhaarData, FormTemplate } from './types';

type Step = 'upload' | 'select' | 'fill' | 'preview';

const steps = ['Upload Aadhaar', 'Select Form', 'Fill Details', 'Preview & Download'];

function App() {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [aadhaarData, setAadhaarData] = useState<AadhaarData | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleAadhaarProcessed = (data: AadhaarData) => {
    setAadhaarData(data);
    setCurrentStep('select');
  };

  const handleFormSelected = (template: FormTemplate) => {
    setSelectedTemplate(template);
    setCurrentStep('fill');
  };

  const handleFormCompleted = (data: Record<string, string>) => {
    setFormData(data);
    setCurrentStep('preview');
  };

  const handleBackToEdit = () => {
    setCurrentStep('fill');
  };

  const getCurrentStepIndex = () => {
    const stepMap = { upload: 0, select: 1, fill: 2, preview: 3 };
    return stepMap[currentStep];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="pb-12">
        <StepIndicator currentStep={getCurrentStepIndex()} steps={steps} />
        
        {currentStep === 'upload' && (
          <AadhaarUpload onAadhaarProcessed={handleAadhaarProcessed} />
        )}
        
        {currentStep === 'select' && (
          <FormSelector onFormSelected={handleFormSelected} />
        )}
        
        {currentStep === 'fill' && aadhaarData && selectedTemplate && (
          <FormFiller
            template={selectedTemplate}
            aadhaarData={aadhaarData}
            onFormCompleted={handleFormCompleted}
          />
        )}
        
        {currentStep === 'preview' && aadhaarData && selectedTemplate && (
          <FormPreview
            template={selectedTemplate}
            formData={formData}
            aadhaarData={aadhaarData}
            onBack={handleBackToEdit}
          />
        )}
      </main>
    </div>
  );
}

export default App;