
import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/components/LanguageContext';
import { siteSettingsRepo } from '@/api/repos/siteSettingsRepo';
import { Mail, Phone, MapPin, Facebook, Twitter, Youtube, Instagram } from 'lucide-react';

const navigationLinks = [
    { name: 'Home', page: 'Home', kn_name: 'ಮುಖಪುಟ' },
    { name: 'Live TV', page: 'LiveTV', kn_name: 'ಲೈವ್ ಟಿವಿ' },
    { name: 'Search', page: 'Search', kn_name: 'ಹುಡುಕಿ' },
    { name: 'Admin', page: 'Admin', kn_name: 'ಆಡ್ಮಿನ್' }
];

export default function Footer() {
    const { language } = useLanguage();
    const [settings, setSettings] = React.useState({
        site_name_kn: 'ಈಡೆನ್ಸ್ ಟಿವಿ',
        site_name_en: 'Edens TV',
        description_kn: 'ಕರ್ನಾಟಕದ ಪ್ರಮುಖ ಸುದ್ದಿ ಚಾನೆಲ್. ನಿಮಗೆ ವಿಶ್ವಾಸಾರ್ಹ ಮತ್ತು ತ್ವರಿತ ಸುದ್ದಿ ತಲುಪಿಸುತ್ತದೆ.',
        description_en: 'Karnataka\'s leading news channel bringing you reliable and timely news coverage.',
        contact_email: 'info@edenstv.com',
        contact_phone: '+91 80 1234 5678',
        contact_address_kn: 'ಬೆಂಗಳೂರು, ಕರ್ನಾಟಕ, ಭಾರತ',
        contact_address_en: 'Bangalore, Karnataka, India',
        copyright_text_kn: '© 2025 ಈಡೆನ್ಸ್ ಟಿವಿ. ಎಲ್ಲ ಹಕ್ಕುಗಳೂ ಕಾಯ್ದಿರಿದೆ.',
        copyright_text_en: '© 2025 Edens TV. All rights reserved.',
        social_facebook: '',
        social_twitter: '',
        social_youtube: '',
        social_instagram: '',
        ai_app_url: ''
    });

    React.useEffect(() => {
        const fetchSettings = async () => {
            try {
                // Check cache first
                const cachedSettings = localStorage.getItem('cached_site_settings');
                if (cachedSettings) {
                    setSettings(prev => ({ ...prev, ...JSON.parse(cachedSettings) }));
                }

                const latest = await siteSettingsRepo.getLatest();
                if (latest) {
                    setSettings(prev => ({ ...prev, ...latest }));
                    localStorage.setItem('cached_site_settings', JSON.stringify(latest));
                }
            } catch (error) {
                console.error("Failed to fetch site settings", error);
            }
        };
        fetchSettings();
    }, []);

    const text = {
        navigation: language === 'kn' ? 'ನ್ಯಾವಿಗೇಷನ್' : 'Navigation',
        contact: language === 'kn' ? 'ಸಂಪರ್ಕ' : 'Contact',
        followUs: language === 'kn' ? 'ನಮ್ಮನ್ನು ಅನುಸರಿಸಿ' : 'Follow Us'
    };

    const socialLinks = [
        { 
            icon: Facebook, 
            url: settings.social_facebook, 
            name: 'Facebook',
            hoverColor: 'hover:bg-blue-600' 
        },
        { 
            icon: Twitter, 
            url: settings.social_twitter, 
            name: 'Twitter',
            hoverColor: 'hover:bg-sky-500' 
        },
        { 
            icon: Youtube, 
            url: settings.social_youtube, 
            name: 'YouTube',
            hoverColor: 'hover:bg-red-600' 
        },
        { 
            icon: Instagram, 
            url: settings.social_instagram, 
            name: 'Instagram',
            hoverColor: 'hover:bg-pink-600' 
        }
    ].filter(link => link.url && link.url.trim() !== '');

    return (
        <footer className="bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* Brand Section */}
                    <div className="col-span-1">
                        <p className={`text-gray-400 text-sm leading-relaxed ${language === 'kn' ? 'font-kannada' : ''}`}>
                            {language === 'kn' ? settings.description_kn : settings.description_en}
                        </p>
                    </div>

                    {/* Navigation Links */}
                    <div className="col-span-1">
                        <h4 className={`text-lg font-semibold mb-4 ${language === 'kn' ? 'font-kannada' : ''}`}>
                            {text.navigation}
                        </h4>
                        <ul className="space-y-2">
                            {navigationLinks.map(link => (
                                <li key={link.name}>
                                    <Link 
                                        to={createPageUrl(link.page)}
                                        className={`text-gray-400 hover:text-white transition-colors text-sm ${language === 'kn' ? 'font-kannada' : ''}`}
                                    >
                                        {language === 'kn' ? link.kn_name : link.name}
                                    </Link>
                                </li>
                            ))}
                            {settings.ai_app_url && (
                                <li>
                                    <a 
                                        href={settings.ai_app_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`text-gray-400 hover:text-white transition-colors text-sm ${language === 'kn' ? 'font-kannada' : ''}`}
                                    >
                                        PM
                                    </a>
                                </li>
                            )}
                        </ul>
                    </div>

                    {/* Contact & Social */}
                    <div className="col-span-1">
                        <h4 className={`text-lg font-semibold mb-4 ${language === 'kn' ? 'font-kannada' : ''}`}>
                            {text.contact}
                        </h4>
                        <div className="space-y-3 mb-6">
                            <div className="flex items-start gap-2 text-gray-400">
                                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <span className={`text-sm ${language === 'kn' ? 'font-kannada' : ''}`}>
                                    {language === 'kn' ? settings.contact_address_kn : settings.contact_address_en}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                                <Mail className="w-4 h-4 flex-shrink-0" />
                                <a 
                                    href={`mailto:${settings.contact_email}`}
                                    className="text-sm hover:text-white transition-colors"
                                >
                                    {settings.contact_email}
                                </a>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                                <Phone className="w-4 h-4 flex-shrink-0" />
                                <a 
                                    href={`tel:${settings.contact_phone}`}
                                    className="text-sm hover:text-white transition-colors"
                                >
                                    {settings.contact_phone}
                                </a>
                            </div>
                        </div>
                        
                        {socialLinks.length > 0 && (
                            <>
                                <h5 className={`text-sm font-semibold mb-3 ${language === 'kn' ? 'font-kannada' : ''}`}>
                                    {text.followUs}
                                </h5>
                                <div className="flex gap-3 flex-wrap">
                                    {socialLinks.map((social, index) => (
                                        <a
                                            key={index}
                                            href={social.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center ${social.hoverColor} transition-colors`}
                                            aria-label={social.name}
                                        >
                                            <social.icon className="w-4 h-4" />
                                        </a>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-6 lg:pt-8 mt-6 lg:mt-8">
                    <p className={`text-center text-gray-400 text-sm ${language === 'kn' ? 'font-kannada' : ''}`}>
                        {language === 'kn' ? settings.copyright_text_kn : settings.copyright_text_en}
                    </p>
                </div>
            </div>
        </footer>
    );
}
