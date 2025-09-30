import React, { useEffect, useRef } from 'react';

const AdSenseAd = ({
    slot,
    style = { display: 'block' },
    format = 'auto',
    responsive = 'true',
    className = ''
}) => {
    const adRef = useRef(null);

    useEffect(() => {
        // Load AdSense script if not already loaded
        if (!window.adsbygoogle) {
            const script = document.createElement('script');
            script.async = true;
            script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6371316656890571';
            script.crossOrigin = 'anonymous';
            document.head.appendChild(script);
        }

        // Initialize ad after script loads
        const initializeAd = () => {
            if (window.adsbygoogle && adRef.current) {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
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
    }, [slot]);

    return (
        <div className={`adsense-ad ${className}`}>
            <ins
                ref={adRef}
                className="adsbygoogle"
                style={style}
                data-ad-client="ca-pub-6371316656890571"
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive={responsive}
            />
        </div>
    );
};

export default AdSenseAd;
