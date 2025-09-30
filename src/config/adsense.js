// AdSense Configuration
// Replace these placeholder slot IDs with your actual AdSense ad unit IDs
// You can find these in your Google AdSense dashboard under "Ads" > "By ad unit"

export const ADSENSE_CONFIG = {
    // Your AdSense Publisher ID
    PUBLISHER_ID: 'ca-pub-6371316656890571',

    // Ad Unit Slot IDs - Replace with your real ad unit IDs from AdSense dashboard
    SLOTS: {
        // Header banner ad (728x90 or similar)
        HEADER_BANNER: '1234567890', // ← Replace with your actual header banner ad unit ID

        // In-content rectangle ads (300x250)
        ARTICLE_CONTENT_1: '9876543210', // ← Replace with your actual in-content ad unit ID
        ARTICLE_CONTENT_2: '1357924680', // ← Replace with your actual in-content ad unit ID

        // Footer banner ad (728x90 or similar)
        FOOTER_BANNER: '2468135790', // ← Replace with your actual footer banner ad unit ID

        // Additional slots for future use
        SIDEBAR_AD: '555666777', // ← Replace when you create sidebar ads
        MOBILE_BANNER: '888999000', // ← Replace when you create mobile-specific ads
    },

    // Default ad settings
    DEFAULTS: {
        format: 'auto',
        responsive: 'true',
        style: { display: 'block' }
    }
};

// Helper function to get ad configuration
export const getAdConfig = (slotName) => {
    return {
        slot: ADSENSE_CONFIG.SLOTS[slotName],
        adClient: ADSENSE_CONFIG.PUBLISHER_ID,
        ...ADSENSE_CONFIG.DEFAULTS
    };
};
