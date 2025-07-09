import React, { useState } from 'react';
import { Header } from './components/Header';
import { StepIndicator } from './components/StepIndicator';
import { AadhaarUpload } from './components/AadhaarUpload';
import { FormSelector } from './components/FormSelector';
import { FormFiller } from './components/FormFiller';
import { FormPreview } from './components/FormPreview';
import { SuccessModal } from './components/SuccessModal';
import { AadhaarData, FormTemplate } from './types';

type Step = 'upload' | 'select' | 'fill' | 'preview';

const steps = ['Upload Aadhaar', 'Select Form', 'Fill Details', 'Preview & Download'];

function App() {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [aadhaarData, setAadhaarData] = useState<AadhaarData | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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
    setShowSuccessModal(true);
  };

  const handleBackToEdit = () => {
    setCurrentStep('fill');
  };

  const handleBackToHome = () => {
    setCurrentStep('upload');
    setAadhaarData(null);
    setSelectedTemplate(null);
    setFormData({});
    setShowSuccessModal(false);
  };

  const handleBackToSelect = () => {
    setCurrentStep('select');
    setSelectedTemplate(null);
    setFormData({});
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
  };
  const getCurrentStepIndex = () => {
    const stepMap = { upload: 0, select: 1, fill: 2, preview: 3 };
    return stepMap[currentStep];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onBackToHome={handleBackToHome} showBackButton={currentStep !== 'upload'} />
      
      <main className="pb-12">
        <StepIndicator currentStep={getCurrentStepIndex()} steps={steps} />
        
        {currentStep === 'upload' && (
          <AadhaarUpload onAadhaarProcessed={handleAadhaarProcessed} />
        )}
        
        {currentStep === 'select' && (
          <FormSelector onFormSelected={handleFormSelected} onBack={handleBackToHome} />
        )}
        
        {currentStep === 'fill' && aadhaarData && selectedTemplate && (
          <FormFiller
            template={selectedTemplate}
            aadhaarData={aadhaarData}
            onFormCompleted={handleFormCompleted}
            onBack={handleBackToSelect}
          />
        )}
        
        {currentStep === 'preview' && aadhaarData && selectedTemplate && (
          <FormPreview
            template={selectedTemplate}
            formData={formData}
            aadhaarData={aadhaarData}
            onBack={handleBackToEdit}
            onBackToHome={handleBackToHome}
          />
        )}
      </main>

      {showSuccessModal && (
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={handleCloseSuccessModal}
          formName={selectedTemplate?.name || 'Form'}
        />
      )}
    </div>
  );
}

export default App;