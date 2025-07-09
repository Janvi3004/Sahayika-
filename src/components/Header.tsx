import React from 'react';
import { Mic, FileText, Shield, Heart } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 animate-pulse">
              <div className="relative">
                <Mic className="h-10 w-10 text-yellow-300 animate-bounce" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
              </div>
              <FileText className="h-10 w-10 text-blue-200 transform hover:scale-110 transition-transform" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                सहायिका (Sahayika)
              </h1>
              <p className="text-sm text-emerald-100 font-medium">
                आवाज़ से फॉर्म भरने वाली सहायक | Voice-Powered Form Assistant
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-sm bg-white/10 px-3 py-2 rounded-full backdrop-blur-sm">
              <Shield className="h-5 w-5 text-green-300" />
              <span className="text-green-100 font-medium">सुरक्षित और निजी</span>
            </div>
            <div className="flex items-center space-x-1 text-xs bg-pink-500/20 px-2 py-1 rounded-full">
              <Heart className="h-4 w-4 text-pink-300 animate-pulse" />
              <span className="text-pink-200">महिलाओं के लिए</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};