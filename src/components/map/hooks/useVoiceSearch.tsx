// Hook pour la recherche vocale avec Web Speech API
import React, { useState, useCallback, useEffect, useRef } from 'react';

interface UseVoiceSearchResult {
  isListening: boolean;
  transcript: string;
  isSupported: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

// Vérifier si l'API est supportée
function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  );
}

// Obtenir le constructeur de SpeechRecognition
function getSpeechRecognition(): (new () => SpeechRecognition) | null {
  if (typeof window === 'undefined') return null;
  return (
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition ||
    null
  );
}

export function useVoiceSearch(): UseVoiceSearchResult {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isSupported = isSpeechRecognitionSupported();

  // Initialiser SpeechRecognition
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'fr-FR'; // Français par défaut

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      switch (event.error) {
        case 'no-speech':
          setError('Aucune voix détectée. Réessayez.');
          break;
        case 'audio-capture':
          setError('Microphone non disponible.');
          break;
        case 'not-allowed':
          setError('Accès au microphone refusé.');
          break;
        case 'network':
          setError('Erreur réseau. Vérifiez votre connexion.');
          break;
        default:
          setError('Erreur de reconnaissance vocale.');
      }
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptText = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptText;
        } else {
          interimTranscript += transcriptText;
        }
      }

      // Utiliser le transcript final si disponible, sinon l'interim
      setTranscript(finalTranscript || interimTranscript);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isSupported]);

  // Démarrer l'écoute
  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError('Reconnaissance vocale non disponible.');
      return;
    }

    setTranscript('');
    setError(null);

    try {
      recognitionRef.current.start();
    } catch (err) {
      // Peut se produire si déjà en écoute
      if ((err as Error).message.includes('already started')) {
        recognitionRef.current.stop();
        setTimeout(() => {
          recognitionRef.current?.start();
        }, 100);
      }
    }
  }, []);

  // Arrêter l'écoute
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  // Réinitialiser le transcript
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}

// Composant bouton de recherche vocale avec animation
export const VoiceSearchButton: React.FC<{
  onResult: (text: string) => void;
  className?: string;
}> = ({ onResult, className = '' }) => {
  const {
    isListening,
    transcript,
    isSupported,
    error,
    startListening,
    stopListening,
  } = useVoiceSearch();

  // Envoyer le résultat quand l'écoute s'arrête
  useEffect(() => {
    if (!isListening && transcript) {
      onResult(transcript);
    }
  }, [isListening, transcript, onResult]);

  if (!isSupported) {
    return null; // Ne pas afficher si non supporté
  }

  return (
    <button
      onClick={isListening ? stopListening : startListening}
      className={`
        relative flex items-center justify-center
        w-10 h-10 rounded-full transition-all duration-300
        ${isListening 
          ? 'bg-red-500 text-white scale-110 shadow-lg shadow-red-500/30' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }
        ${className}
      `}
      title={isListening ? 'Arrêter' : 'Recherche vocale'}
      aria-label={isListening ? 'Arrêter la recherche vocale' : 'Démarrer la recherche vocale'}
    >
      {/* Icône microphone */}
      <svg
        className={`w-5 h-5 transition-transform ${isListening ? 'animate-pulse' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
        />
      </svg>

      {/* Cercle d'animation pendant l'écoute */}
      {isListening && (
        <>
          <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-25" />
          <span className="absolute inset-0 rounded-full bg-red-500 animate-pulse opacity-50" />
        </>
      )}

      {/* Tooltip d'erreur */}
      {error && (
        <span className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg">
          {error}
        </span>
      )}
    </button>
  );
};

