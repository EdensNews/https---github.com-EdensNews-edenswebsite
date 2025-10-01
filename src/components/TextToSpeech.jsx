import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { textToSpeech, playAudio, isGoogleTTSAvailable } from '@/api/googleTTS';

export default function TextToSpeech({ text, title }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [rate, setRate] = useState(1.0);
    const [useGoogleTTS, setUseGoogleTTS] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const utteranceRef = useRef(null);
    const audioRef = useRef(null);
    const { language } = useLanguage();

    useEffect(() => {
        // Check if Google TTS is available
        const googleTTSAvailable = isGoogleTTSAvailable();
        setUseGoogleTTS(googleTTSAvailable);
        
        if (googleTTSAvailable) {
            console.log('✅ Google Cloud TTS is configured - All languages supported!');
            setIsSupported(true);
        } else {
            console.log('⚠️ Google Cloud TTS not configured - Using browser TTS (English/Hindi only)');
            // Check if browser supports speech synthesis
            setIsSupported('speechSynthesis' in window);
            
            // Load voices
            if ('speechSynthesis' in window) {
                const loadVoices = () => {
                    const availableVoices = window.speechSynthesis.getVoices();
                    console.log('Available browser TTS voices:', availableVoices.map(v => `${v.name} (${v.lang})`));
                };
                
                window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
                loadVoices();
                
                return () => {
                    window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
                    window.speechSynthesis.cancel();
                };
            }
        }
    }, []);

    // Stop and reset when language changes
    useEffect(() => {
        if (isPlaying) {
            stop();
        }
    }, [language, text, title]);

    const getVoiceForLanguage = () => {
        const voices = window.speechSynthesis.getVoices();
        
        if (voices.length === 0) {
            // Voices not loaded yet, trigger load
            window.speechSynthesis.getVoices();
            return null;
        }
        
        // Priority order: Indian voices first, then any language match, then English
        const langMap = {
            'kn': {
                primary: ['kn-IN', 'kn'],
                fallback: ['hi-IN', 'en-IN', 'en-US']
            },
            'en': {
                primary: ['en-IN', 'en-US', 'en-GB', 'en'],
                fallback: []
            },
            'ta': {
                primary: ['ta-IN', 'ta'],
                fallback: ['hi-IN', 'en-IN', 'en-US']
            },
            'te': {
                primary: ['te-IN', 'te'],
                fallback: ['hi-IN', 'en-IN', 'en-US']
            },
            'hi': {
                primary: ['hi-IN', 'hi'],
                fallback: ['en-IN', 'en-US']
            },
            'ml': {
                primary: ['ml-IN', 'ml'],
                fallback: ['hi-IN', 'en-IN', 'en-US']
            }
        };
        
        const config = langMap[language] || { primary: ['en-IN', 'en'], fallback: [] };
        const allLangs = [...config.primary, ...config.fallback];
        
        // Try each language variant in order
        for (const targetLang of allLangs) {
            // Try exact match
            let voice = voices.find(v => v.lang === targetLang);
            if (voice) {
                console.log(`✓ Found exact match: ${voice.name} (${voice.lang})`);
                return voice;
            }
            
            // Try starts with (e.g., 'en-IN' matches 'en-IN-x-abc')
            voice = voices.find(v => v.lang.startsWith(targetLang));
            if (voice) {
                console.log(`✓ Found partial match: ${voice.name} (${voice.lang})`);
                return voice;
            }
        }
        
        // Last resort: Find any Indian English voice
        const indianEnglish = voices.find(v => 
            v.lang.includes('en-IN') || 
            v.name.toLowerCase().includes('india') ||
            v.name.toLowerCase().includes('indian')
        );
        if (indianEnglish) {
            console.log(`✓ Found Indian English: ${indianEnglish.name} (${indianEnglish.lang})`);
            return indianEnglish;
        }
        
        // Absolute fallback: First English voice
        const anyEnglish = voices.find(v => v.lang.startsWith('en'));
        if (anyEnglish) {
            console.log(`⚠ Fallback to English: ${anyEnglish.name} (${anyEnglish.lang})`);
            return anyEnglish;
        }
        
        // Ultimate fallback: First available voice
        console.warn(`⚠ Using first available voice: ${voices[0]?.name} (${voices[0]?.lang})`);
        return voices[0];
    };

    const speak = async () => {
        if (!isSupported) return;

        // Use Google TTS if available
        if (useGoogleTTS) {
            setIsLoading(true);
            setIsPlaying(true);
            
            try {
                // Prepare text (remove HTML tags)
                const cleanText = text.replace(/<[^>]*>/g, '').trim();
                
                // Google TTS limit is 5000 bytes
                // For Indian languages (UTF-8), each character can be 3-4 bytes
                // Safe limit: ~1200 characters to stay under 5000 bytes
                let limitedText = cleanText;
                
                // Truncate if too long
                if (limitedText.length > 1200) {
                    // Cut at sentence boundary if possible
                    const truncated = limitedText.substring(0, 1200);
                    const lastPeriod = truncated.lastIndexOf('.');
                    const lastQuestion = truncated.lastIndexOf('?');
                    const lastExclaim = truncated.lastIndexOf('!');
                    const lastSentence = Math.max(lastPeriod, lastQuestion, lastExclaim);
                    
                    if (lastSentence > 800) {
                        // Cut at sentence if found
                        limitedText = truncated.substring(0, lastSentence + 1);
                    } else {
                        // Otherwise just truncate
                        limitedText = truncated + '...';
                    }
                }
                
                const fullText = `${title}. ${limitedText}`;
                
                console.log(`Google TTS: Speaking ${limitedText.split(' ').length} words (${fullText.length} chars) in ${language} at ${rate}x speed`);
                
                // Call Google TTS API with speed (API generates audio at specified speed)
                const audioBase64 = await textToSpeech(fullText, language, rate);
                
                // Play the audio (speed is already baked into the audio)
                const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
                audioRef.current = audio;
                
                audio.onplay = () => {
                    console.log('Google TTS: Started playing at ' + rate + 'x speed');
                    setIsLoading(false);
                    setIsPlaying(true);
                };
                
                audio.onended = () => {
                    console.log('Google TTS: Finished playing');
                    setIsPlaying(false);
                    setIsPaused(false);
                };
                
                audio.onerror = (e) => {
                    console.error('Google TTS: Audio playback error', e);
                    setIsPlaying(false);
                    setIsLoading(false);
                    alert('Failed to play audio. Please try again.');
                };
                
                await audio.play();
                
            } catch (error) {
                console.error('Google TTS Error:', error);
                setIsPlaying(false);
                setIsLoading(false);
                alert(`Text-to-speech error: ${error.message}`);
            }
            return;
        }

        // Fallback to browser TTS
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }
        
        // Small delay to prevent interruption
        setTimeout(() => {
            // Prepare text (remove HTML tags and limit length)
            const cleanText = text.replace(/<[^>]*>/g, '').trim();
            // Limit to first 500 words to avoid browser limits
            const words = cleanText.split(/\s+/).slice(0, 500).join(' ');
            const fullText = `${title}. ${words}`;

            console.log(`TTS: Preparing to speak ${words.split(' ').length} words`);

            // Get available voices
            const voices = window.speechSynthesis.getVoices();

            // Create utterance
            const utterance = new SpeechSynthesisUtterance(fullText);
            utterance.rate = rate;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            
            // Select appropriate voice
            let targetVoice;
            if (language === 'en') {
                // Use Indian English voice
                targetVoice = voices.find(v => v.lang === 'en-IN') || 
                             voices.find(v => v.lang.startsWith('en'));
                utterance.lang = 'en-IN';
            } else if (language === 'hi') {
                // Use Hindi voice
                targetVoice = voices.find(v => v.lang === 'hi-IN') || 
                             voices.find(v => v.lang.startsWith('hi'));
                utterance.lang = 'hi-IN';
                console.log(`✓ Using Hindi voice for Hindi content`);
            } else {
                // This shouldn't happen as we check isTTSAvailable above
                targetVoice = voices.find(v => v.lang === 'en-IN') || 
                             voices.find(v => v.lang.startsWith('en'));
                utterance.lang = 'en-IN';
            }
            
            if (targetVoice) {
                utterance.voice = targetVoice;
                console.log(`TTS: Using voice "${targetVoice.name}" (${targetVoice.lang}) for language "${language}"`);
            } else {
                console.warn(`TTS: No suitable voice found`);
            }

            // Event handlers
            utterance.onstart = () => {
                console.log('TTS: Started speaking');
                setIsPlaying(true);
                setIsPaused(false);
            };

            utterance.onend = () => {
                console.log('TTS: Finished speaking');
                setIsPlaying(false);
                setIsPaused(false);
            };

            utterance.onerror = (event) => {
                console.error('TTS Error:', event.error, event);
                if (event.error !== 'interrupted') {
                    alert(`Speech error: ${event.error}. Try a different browser or check your system volume.`);
                }
                setIsPlaying(false);
                setIsPaused(false);
            };

            utteranceRef.current = utterance;
            
            // Ensure speech synthesis is ready
            if (window.speechSynthesis.paused) {
                window.speechSynthesis.resume();
            }
            
            console.log('TTS: Calling speak()');
            window.speechSynthesis.speak(utterance);
            
            // Check if it actually started
            setTimeout(() => {
                if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
                    console.error('TTS: Failed to start speaking');
                    setIsPlaying(false);
                    alert('Text-to-speech failed to start. Please check your browser settings and system volume.');
                }
            }, 500);
        }, 150);
    };

    const pause = () => {
        if (useGoogleTTS && audioRef.current) {
            audioRef.current.pause();
            setIsPaused(true);
        } else if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
            window.speechSynthesis.pause();
            setIsPaused(true);
        }
    };

    const resume = () => {
        if (useGoogleTTS && audioRef.current) {
            audioRef.current.play();
            setIsPaused(false);
        } else if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
            setIsPaused(false);
        }
    };

    const stop = () => {
        if (useGoogleTTS && audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        } else {
            window.speechSynthesis.cancel();
        }
        setIsPlaying(false);
        setIsPaused(false);
        setIsLoading(false);
    };

    const changeRate = (newRate) => {
        const newRateNum = parseFloat(newRate);
        
        // Only change if rate is actually different
        if (newRateNum === rate) {
            return;
        }
        
        setRate(newRateNum);
        
        // For Google TTS, need to regenerate audio with new speed
        // (speed is baked into the audio file by the API)
        if (isPlaying) {
            const wasPlaying = !isPaused;
            stop();
            if (wasPlaying) {
                setTimeout(() => speak(), 200);
            }
        }
    };

    if (!isSupported) {
        return null;
    }

    // Check if TTS is available for current language
    // With Google TTS, all languages are supported
    const isTTSAvailable = useGoogleTTS || language === 'en' || language === 'hi';
    
    if (!isTTSAvailable) {
        return (
            <div className="my-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                    <Volume2 className="w-5 h-5 text-gray-400" />
                    <h3 className={`font-bold text-gray-600 dark:text-gray-400 ${language === 'kn' ? 'font-kannada' : ''}`}>
                        {language === 'kn' ? 'ಧ್ವನಿ ಓದುವಿಕೆ' : 'Listen to Article'}
                    </h3>
                </div>
                <p className={`text-sm text-gray-500 dark:text-gray-400 ${language === 'kn' ? 'font-kannada' : ''}`}>
                    {language === 'kn' && 'ಕ್ಷಮಿಸಿ, ಕನ್ನಡದಲ್ಲಿ ಧ್ವನಿ ಓದುವಿಕೆ ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಇಂಗ್ಲಿಷ್ ಭಾಷೆಗೆ ಬದಲಾಯಿಸಿ.'}
                    {language === 'ta' && 'மன்னிக்கவும், தமிழில் குரல் வாசிப்பு கிடைக்கவில்லை. தயவுசெய்து ஆங்கிலத்திற்கு மாறவும்.'}
                    {language === 'te' && 'క్షమించండి, తెలుగులో వాయిస్ రీడింగ్ అందుబాటులో లేదు. దయచేసి ఆంగ్లానికి మారండి.'}
                    {language === 'ml' && 'ക്ഷമിക്കണം, മലയാളത്തിൽ വോയ്‌സ് റീഡിംഗ് ലഭ്യമല്ല. ദയവായി ഇംഗ്ലീഷിലേക്ക് മാറുക.'}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                    Text-to-speech is currently available only in English and Hindi.
                </p>
            </div>
        );
    }

    return (
        <div className="my-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-red-600" />
                    <h3 className={`font-bold text-gray-900 dark:text-gray-100 ${language === 'kn' ? 'font-kannada' : ''}`}>
                        {language === 'kn' ? 'ಧ್ವನಿ ಓದುವಿಕೆ' : 'Listen to Article'}
                    </h3>
                </div>
                
                {/* Speed Control */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                        {language === 'kn' ? 'ವೇಗ:' : 'Speed:'}
                    </span>
                    <select
                        value={rate}
                        onChange={(e) => changeRate(parseFloat(e.target.value))}
                        className="text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
                    >
                        <option value="0.5">0.5x</option>
                        <option value="0.75">0.75x</option>
                        <option value="1.0">1.0x</option>
                        <option value="1.25">1.25x</option>
                        <option value="1.5">1.5x</option>
                        <option value="2.0">2.0x</option>
                    </select>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
                {isLoading ? (
                    <Button
                        disabled
                        className="flex items-center gap-2 bg-gray-400 cursor-not-allowed"
                    >
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className={language === 'kn' ? 'font-kannada' : ''}>
                            {language === 'kn' ? 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...' : 'Loading...'}
                        </span>
                    </Button>
                ) : !isPlaying ? (
                    <Button
                        onClick={speak}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
                    >
                        <Play className="w-4 h-4" />
                        <span className={language === 'kn' ? 'font-kannada' : ''}>
                            {language === 'kn' ? 'ಪ್ಲೇ ಮಾಡಿ' : 'Play'}
                        </span>
                    </Button>
                ) : (
                    <>
                        {isPaused ? (
                            <Button
                                onClick={resume}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                            >
                                <Play className="w-4 h-4" />
                                <span className={language === 'kn' ? 'font-kannada' : ''}>
                                    {language === 'kn' ? 'ಮುಂದುವರಿಸಿ' : 'Resume'}
                                </span>
                            </Button>
                        ) : (
                            <Button
                                onClick={pause}
                                className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700"
                            >
                                <Pause className="w-4 h-4" />
                                <span className={language === 'kn' ? 'font-kannada' : ''}>
                                    {language === 'kn' ? 'ವಿರಾಮ' : 'Pause'}
                                </span>
                            </Button>
                        )}
                        <Button
                            onClick={stop}
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            <VolumeX className="w-4 h-4" />
                            <span className={language === 'kn' ? 'font-kannada' : ''}>
                                {language === 'kn' ? 'ನಿಲ್ಲಿಸಿ' : 'Stop'}
                            </span>
                        </Button>
                    </>
                )}
            </div>

            {/* Info */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                {language === 'kn' 
                    ? 'ಈ ಲೇಖನವನ್ನು ಕೇಳಲು ಪ್ಲೇ ಬಟನ್ ಒತ್ತಿರಿ' 
                    : 'Click play to listen to this article'}
            </p>
        </div>
    );
}
