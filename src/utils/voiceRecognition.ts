import { VoiceRecognitionResult } from '../types';

export class VoiceRecognition {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private currentResolve: ((result: VoiceRecognitionResult) => void) | null = null;
  private currentReject: ((error: Error) => void) | null = null;

  constructor() {
    this.initializeRecognition();
  }

  private initializeRecognition() {
    // Check for speech recognition support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported');
      return;
    }

    this.recognition = new SpeechRecognition();
    
    if (this.recognition) {
      // Configure recognition settings
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 3;
      this.recognition.lang = 'hi-IN'; // Default to Hindi

      // Set up event handlers
      this.recognition.onstart = () => {
        console.log('Speech recognition started');
        this.isListening = true;
      };

      this.recognition.onresult = (event) => {
        console.log('Speech recognition result:', event);
        
        if (event.results && event.results.length > 0) {
          // Get the best result from all alternatives
          let bestResult = event.results[0][0];
          let bestConfidence = bestResult.confidence || 0;
          
          // Check all alternatives for better confidence
          for (let i = 0; i < event.results[0].length; i++) {
            const alternative = event.results[0][i];
            if ((alternative.confidence || 0) > bestConfidence) {
              bestResult = alternative;
              bestConfidence = alternative.confidence || 0;
            }
          }
          
          const transcript = bestResult.transcript.trim();
          
          console.log('Recognized text:', transcript);
          console.log('Confidence:', bestConfidence);
          
          if (this.currentResolve) {
            this.currentResolve({
              text: transcript,
              confidence: bestConfidence
            });
          }
        }
        
        this.cleanup();
      };

      this.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        
        let errorMessage = 'Speech recognition failed';
        
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected. Please try speaking again.';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone not accessible. Please check permissions.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone permission denied. Please allow microphone access.';
            break;
          case 'network':
            errorMessage = 'Network error. Please check your connection.';
            break;
          case 'aborted':
            errorMessage = 'Speech recognition was stopped.';
            break;
          default:
            errorMessage = `Speech recognition error: ${event.error}`;
        }
        
        if (this.currentReject) {
          this.currentReject(new Error(errorMessage));
        }
        
        this.cleanup();
      };

      this.recognition.onend = () => {
        console.log('Speech recognition ended');
        this.isListening = false;
        
        // If we ended without a result and haven't called resolve/reject yet
        if (this.currentReject && this.isListening) {
          this.currentReject(new Error('Speech recognition ended without result'));
        }
        
        this.cleanup();
      };
    }
  }

  setLanguage(lang: 'hi-IN' | 'en-IN' | 'bn-IN' | 'ta-IN' | 'te-IN' | 'mr-IN') {
    if (this.recognition) {
      this.recognition.lang = lang;
      console.log('Language set to:', lang);
    }
  }

  async startListening(): Promise<VoiceRecognitionResult> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not supported in this browser'));
        return;
      }

      if (this.isListening) {
        this.stopListening();
        // Wait a moment before starting again
        setTimeout(() => {
          this.startListening().then(resolve).catch(reject);
        }, 100);
        return;
      }

      // Store the resolve/reject functions
      this.currentResolve = resolve;
      this.currentReject = reject;

      try {
        // Request microphone permission first
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(() => {
            console.log('Microphone permission granted');
            
            // Add timeout to prevent hanging
            const timeout = setTimeout(() => {
              if (this.isListening) {
                this.stopListening();
                reject(new Error('Speech recognition timeout. Please try again.'));
              }
            }, 10000); // 10 second timeout

            // Clear timeout when recognition completes
            const originalResolve = this.currentResolve;
            const originalReject = this.currentReject;
            
            this.currentResolve = (result) => {
              clearTimeout(timeout);
              if (originalResolve) originalResolve(result);
            };
            
            this.currentReject = (error) => {
              clearTimeout(timeout);
              if (originalReject) originalReject(error);
            };

            // Start recognition
            this.recognition!.start();
          })
          .catch((error) => {
            console.error('Microphone permission denied:', error);
            reject(new Error('Microphone access denied. Please allow microphone permissions and try again.'));
          });
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        reject(new Error('Failed to start speech recognition'));
      }
    });
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      console.log('Stopping speech recognition');
      this.recognition.stop();
    }
  }

  private cleanup() {
    this.isListening = false;
    this.currentResolve = null;
    this.currentReject = null;
  }

  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  // Test microphone access
  async testMicrophone(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Clean up
      return true;
    } catch (error) {
      console.error('Microphone test failed:', error);
      return false;
    }
  }

  // Get available languages
  getAvailableLanguages(): string[] {
    return ['hi-IN', 'en-IN', 'bn-IN', 'ta-IN', 'te-IN', 'mr-IN'];
  }
}