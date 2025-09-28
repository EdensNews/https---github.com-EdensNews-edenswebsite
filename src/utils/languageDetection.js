/**
 * Language detection utility for Kannada and English text
 */

/**
 * Detects if text is primarily in Kannada script
 * @param {string} text - The text to analyze
 * @returns {boolean} - true if text is primarily Kannada
 */
export function isKannadaText(text) {
    if (!text || typeof text !== 'string') return false;
    
    // Remove HTML tags and extra whitespace
    const cleanText = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    if (!cleanText) return false;
    
    // Count Kannada characters (Unicode range: U+0C80-U+0CFF)
    const kannadaRegex = /[\u0C80-\u0CFF]/g;
    const kannadaMatches = cleanText.match(kannadaRegex) || [];
    
    // Count total characters (excluding spaces and punctuation)
    const totalChars = cleanText.replace(/[\s\p{P}]/gu, '').length;
    
    if (totalChars === 0) return false;
    
    // If more than 30% of characters are Kannada, consider it Kannada text
    const kannadaRatio = kannadaMatches.length / totalChars;
    return kannadaRatio > 0.3;
}

/**
 * Detects if text is primarily in English (Latin script)
 * @param {string} text - The text to analyze
 * @returns {boolean} - true if text is primarily English
 */
export function isEnglishText(text) {
    if (!text || typeof text !== 'string') return false;
    
    // Remove HTML tags and extra whitespace
    const cleanText = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    if (!cleanText) return false;
    
    // Count English characters (basic Latin: A-Z, a-z)
    const englishRegex = /[A-Za-z]/g;
    const englishMatches = cleanText.match(englishRegex) || [];
    
    // Count total characters (excluding spaces and punctuation)
    const totalChars = cleanText.replace(/[\s\p{P}]/gu, '').length;
    
    if (totalChars === 0) return false;
    
    // If more than 70% of characters are English, consider it English text
    const englishRatio = englishMatches.length / totalChars;
    return englishRatio > 0.7;
}

/**
 * Detects the primary language of text (Kannada or English)
 * @param {string} text - The text to analyze
 * @returns {'kn'|'en'|'unknown'} - The detected language
 */
export function detectLanguage(text) {
    if (!text || typeof text !== 'string') return 'unknown';
    
    const cleanText = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    if (!cleanText) return 'unknown';
    
    if (isKannadaText(cleanText)) {
        return 'kn';
    } else if (isEnglishText(cleanText)) {
        return 'en';
    }
    
    return 'unknown';
}

/**
 * Determines translation direction based on detected language
 * @param {string} text - The text to analyze
 * @returns {object} - Translation direction info
 */
export function getTranslationDirection(text) {
    const detectedLang = detectLanguage(text);
    
    return {
        sourceLanguage: detectedLang,
        targetLanguage: detectedLang === 'kn' ? 'en' : 'kn',
        direction: detectedLang === 'kn' ? 'KN → EN' : 'EN → KN',
        needsTranslation: detectedLang !== 'unknown'
    };
}
