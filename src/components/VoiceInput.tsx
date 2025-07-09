import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { VoiceRecognition } from '../utils/voiceRecognition';

interface VoiceInputProps {
  onVoiceResult: (text: string) => void;
  placeholder?: string;
  fieldLabel?: string;
  disabled?: boolean;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onVoiceResult,
  placeholder = "Speak your answer...",
  fieldLabel = "field",
  disabled = false
}) => {
  const [isListening, setIsListening] = useState(false);
  const [voiceRecognition] = useState(() => new VoiceRecognition());
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string>('');
  const [microphoneStatus, setMicrophoneStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [selectedLanguage, setSelectedLanguage] = useState<'hi-IN' | 'en-IN'>('hi-IN');

  useEffect(() => {
    const testMic = async () => {
      const hasAccess = await voiceRecognition.testMicrophone();
      setMicrophoneStatus(hasAccess ? 'granted' : 'denied');
    };
    testMic();
  }, [voiceRecognition]);

  const startListening = async () => {
    try {
      setIsListening(true);
      setError(null);
      setLastResult('');

      voiceRecognition.setLanguage(selectedLanguage);

      // 👇 Speak prompt and wait for it to finish
      await new Promise<void>((resolve) => {
        if ('speechSynthesis' in window) {
          speechSynthesis.cancel();

          const utterance = new SpeechSynthesisUtterance();
          utterance.lang = selectedLanguage;
          utterance.rate = 0.8;
          utterance.volume = 0.8;
          utterance.text =
            selectedLanguage === 'hi-IN'
              ? `कृपया ${fieldLabel} के लिए अपना उत्तर बताएं`
              : `Please speak your answer for ${fieldLabel}`;

          utterance.onend = () => resolve();
          speechSynthesis.speak(utterance);
        } else {
          resolve();
        }
      });

      console.log('Starting voice recognition...');
      const result = await voiceRecognition.startListening();

      if (result.text && result.text.trim().length > 0) {
        setLastResult(result.text);
        onVoiceResult(result.text);

        if ('speechSynthesis' in window) {
          const confirmText =
            selectedLanguage === 'hi-IN'
              ? `आपका उत्तर: ${result.text}`
              : `Your answer: ${result.text}`;

          const utterance = new SpeechSynthesisUtterance(confirmText);
          utterance.lang = selectedLanguage;
          utterance.rate = 0.8;
          speechSynthesis.speak(utterance);
        }
      } else {
        throw new Error('No speech detected. Please try again.');
      }
    } catch (err) {
      console.error('Voice recognition error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Voice recognition failed';
      setError(errorMessage);

      if (errorMessage.includes('permission') || errorMessage.includes('not allowed')) {
        setMicrophoneStatus('denied');
      }
    } finally {
      setIsListening(false);
    }
  };

  const stopListening = () => {
    voiceRecognition.stopListening();
    setIsListening(false);
    speechSynthesis.cancel();
  };

  const handleLanguageChange = (lang: 'hi-IN' | 'en-IN') => {
    setSelectedLanguage(lang);
    voiceRecognition.setLanguage(lang);
  };

  return (
    <div className="space-y-4">
      {/* Language Selection */}
      <div className="flex items-center justify-center space-x-4 bg-white p-4 rounded-xl border-2 border-purple-200">
        <span className="text-lg font-bold text-purple-700">भाषा चुनें | Language:</span>
        <div className="flex space-x-3">
          <button
            onClick={() => handleLanguageChange('hi-IN')}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 transform hover:scale-105 ${
              selectedLanguage === 'hi-IN'
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-orange-100'
            }`}
          >
            🇮🇳 हिंदी
          </button>
          <button
            onClick={() => handleLanguageChange('en-IN')}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 transform hover:scale-105 ${
              selectedLanguage === 'en-IN'
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-blue-100'
            }`}
          >
            🇬🇧 English
          </button>
        </div>
      </div>

      {/* Microphone Status */}
      {microphoneStatus === 'denied' && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl animate-shake">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <div>
              <p className="text-red-800 font-bold">माइक्रोफोन की अनुमति नहीं मिली</p>
              <p className="text-red-700 text-sm">
                Microphone access denied. Please allow microphone permissions in your browser settings.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Voice Input Controls */}
      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={microphoneStatus === 'denied' || disabled}
          className={`
            flex items-center space-x-3 px-6 py-4 rounded-xl font-bold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg
            ${isListening 
              ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white animate-pulse' 
              : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
            }
          `}
        >
          {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          {isListening ? 'बोलना बंद करें | Stop Speaking' : 'जवाब बोलें | Speak Answer'}
        </button>

        <button
          onClick={() => {
            if ('speechSynthesis' in window) {
              speechSynthesis.cancel();
              const utterance = new SpeechSynthesisUtterance(
                selectedLanguage === 'hi-IN'
                  ? `कृपया ${fieldLabel} के लिए अपना उत्तर बताएं`
                  : `Please speak your answer for ${fieldLabel}`
              );
              utterance.lang = selectedLanguage;
              utterance.rate = 0.8;
              speechSynthesis.speak(utterance);
            }
          }}
          disabled={isListening || disabled}
          className="flex items-center space-x-2 px-4 py-3 rounded-xl border-2 border-purple-300 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 font-medium"
        >
          <Volume2 className="h-5 w-5" />
          <span>दोहराएं | Repeat</span>
        </button>
      </div>

      {isListening && (
        <div className="flex items-center justify-center space-x-4 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-300 animate-pulse">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" />
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
          <div className="text-center">
            <p className="text-blue-800 font-bold text-lg">
              {selectedLanguage === 'hi-IN' ? '🎤 सुन रहा हूँ...' : '🎤 Listening...'}
            </p>
            <p className="text-blue-600 text-sm">
              {selectedLanguage === 'hi-IN' ? 'कृपया स्पष्ट रूप से बोलें' : 'Please speak clearly'}
            </p>
          </div>
          <Sparkles className="h-6 w-6 text-yellow-500 animate-spin" />
        </div>
      )}

      {lastResult && !isListening && (
        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-6 w-6 text-green-500 animate-bounce" />
            <div>
              <p className="text-green-800 font-bold">पहचाना गया | Recognized:</p>
              <p className="text-green-700 text-lg font-semibold bg-white/50 p-2 rounded-lg mt-1">
                {lastResult}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl animate-shake">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <div>
              <p className="text-red-800 font-bold">त्रुटि | Error</p>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
