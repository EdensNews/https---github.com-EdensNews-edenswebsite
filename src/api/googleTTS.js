/**
 * Google Cloud Text-to-Speech API Integration
 * Supports all Indian languages with high-quality voices
 */

const API_KEY = import.meta.env.VITE_GOOGLE_TTS_API_KEY;
const API_ENDPOINT = 'https://texttospeech.googleapis.com/v1/text:synthesize';

// Voice configuration for each language
const VOICE_CONFIG = {
    'kn': { languageCode: 'kn-IN', name: 'kn-IN-Standard-A', gender: 'FEMALE' },
    'en': { languageCode: 'en-IN', name: 'en-IN-Standard-D', gender: 'FEMALE' },
    'ta': { languageCode: 'ta-IN', name: 'ta-IN-Standard-A', gender: 'FEMALE' },
    'te': { languageCode: 'te-IN', name: 'te-IN-Standard-A', gender: 'FEMALE' },
    'hi': { languageCode: 'hi-IN', name: 'hi-IN-Standard-A', gender: 'FEMALE' },
    'ml': { languageCode: 'ml-IN', name: 'ml-IN-Standard-A', gender: 'FEMALE' }
};

/**
 * Convert text to speech using Google Cloud TTS
 * @param {string} text - Text to convert
 * @param {string} language - Language code (kn, en, ta, te, hi, ml)
 * @param {number} speakingRate - Speed (0.25 to 4.0, default 1.0)
 * @returns {Promise<string>} - Base64 encoded audio data
 */
export async function textToSpeech(text, language = 'en', speakingRate = 1.0) {
    if (!API_KEY || API_KEY === 'your_google_cloud_api_key_here') {
        throw new Error('Google TTS API key not configured');
    }

    const voiceConfig = VOICE_CONFIG[language] || VOICE_CONFIG['en'];

    const requestBody = {
        input: { text },
        voice: {
            languageCode: voiceConfig.languageCode,
            name: voiceConfig.name,
            ssmlGender: voiceConfig.gender
        },
        audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: speakingRate,
            pitch: 0,
            volumeGainDb: 0
        }
    };

    try {
        const response = await fetch(`${API_ENDPOINT}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'TTS API request failed');
        }

        const data = await response.json();
        return data.audioContent; // Base64 encoded MP3
    } catch (error) {
        console.error('Google TTS Error:', error);
        throw error;
    }
}

/**
 * Play audio from base64 encoded data
 * @param {string} base64Audio - Base64 encoded audio
 * @returns {HTMLAudioElement} - Audio element
 */
export function playAudio(base64Audio) {
    const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
    audio.play();
    return audio;
}

/**
 * Check if Google TTS is configured
 * @returns {boolean}
 */
export function isGoogleTTSAvailable() {
    return !!(API_KEY && API_KEY !== 'your_google_cloud_api_key_here');
}

/**
 * Get available voices for a language
 * @param {string} language - Language code
 * @returns {object} - Voice configuration
 */
export function getVoiceConfig(language) {
    return VOICE_CONFIG[language] || VOICE_CONFIG['en'];
}
