import React, { useEffect, useRef } from 'react';

const AdSenseAd = ({
    slot,
    style = { display: 'block' },
    format = 'auto',
    responsive = 'true',
    className = '',
    adClient = 'ca-pub-6371316656890571' // Your AdSense publisher ID
}) => {
    const adRef = useRef(null);

    // Don't render if no valid slot ID provided
    if (!slot || slot === '1234567890' || slot === '9876543210' || slot === '1357924680' || slot === '2468135790') {
        return <div style={{ minHeight: format === 'horizontal' ? '90px' : '250px' }} className={className}></div>;
    }

    useEffect(() => {
        // Load AdSense script if not already loaded
        if (!window.adsbygoogle) {
            const script = document.createElement('script');
            script.async = true;
            script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`;
            script.crossOrigin = 'anonymous';
            document.head.appendChild(script);
        }

        // Initialize ad after script loads
        const initializeAd = () => {
            if (window.adsbygoogle && adRef.current && slot) {
                try {
                    (window.adsbygoogle = window.adsbygoogle || []).push({});
                } catch (error) {
                    console.warn('AdSense ad initialization failed:', error);
                }
            }
        };

        // Check if script is already loaded
        if (window.adsbygoogle) {
            initializeAd();
        } else {
            // Wait for script to load
            const checkAdSense = setInterval(() => {
                if (window.adsbygoogle) {
                    clearInterval(checkAdSense);
                    initializeAd();
                }
            }, 100);

            // Cleanup interval after 10 seconds
            setTimeout(() => clearInterval(checkAdSense), 10000);
        }
    }, [slot, adClient]);

    return (
        <div className={`adsense-ad ${className} w-full overflow-hidden`}>
            <ins
                ref={adRef}
                className="adsbygoogle block w-full"
                style={{
                    ...style,
                    width: '100%',
                    minHeight: format === 'horizontal' ? '90px' : '250px',
                    maxWidth: '100%'
                }}
                data-ad-client={adClient}
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive={responsive}
            />
        </div>
    );
};

export default AdSenseAd;
