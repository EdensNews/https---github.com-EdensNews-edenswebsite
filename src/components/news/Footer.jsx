
import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/components/LanguageContext';
import { siteSettingsRepo } from '@/api/repos/siteSettingsRepo';
import { SiteSettings } from '@/api/entities';
import { Mail, Phone, MapPin, Facebook, Twitter, Youtube, Instagram } from 'lucide-react';
import AdSenseAd from '@/components/AdSenseAd';

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
        contact_phone: '7975898255',
        contact_address_kn: '5ನೆ ಕ್ರಾಸ್, ಪದುವನ ರಸ್ತೆ, ಟಿ.ಕೆ ಲೇಔಟ್, ಕುವೆಂಪು ನಗರ, ಮೈಸೂರು, ಕರ್ನಾಟಕ 570023',
        contact_address_en: '5th Cross, Paduvana Road, TK Layout, Kuvempu Nagara, Mysuru, Karnataka 570023',
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

                // Try Base44 entity source (AdminSettings uses this)
                try {
                    const list = await SiteSettings.list('-created_date', 1);
                    if (Array.isArray(list) && list.length) {
                        const latestEntity = list[0];
                        setSettings(prev => ({ ...prev, ...latestEntity }));
                        localStorage.setItem('cached_site_settings', JSON.stringify(latestEntity));
                        return; // prefer this source
                    }
                } catch {}

                // Fallback to Supabase table if entity not available
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

    const normalizeUrl = (u) => {
        if (!u || typeof u !== 'string') return '';
        const trimmed = u.trim();
        if (!trimmed) return '';
        if (/^https?:\/\//i.test(trimmed)) return trimmed;
        return `https://${trimmed}`;
    };

    const socialLinks = [
        {
            icon: Facebook,
            url: normalizeUrl(settings.social_facebook),
            name: 'Facebook',
            hoverColor: 'hover:bg-blue-600'
        },
        {
            icon: Youtube,
            url: normalizeUrl(settings.social_youtube),
            name: 'YouTube',
            hoverColor: 'hover:bg-red-600'
        },
        {
            icon: Twitter,
            url: normalizeUrl(settings.social_twitter),
            name: 'Twitter',
            hoverColor: 'hover:bg-sky-500'
        },
        {
            icon: Instagram,
            url: normalizeUrl(settings.social_instagram),
            name: 'Instagram',
            hoverColor: 'hover:bg-pink-600'
        }
    ].filter(link => !!link.url);

    return (
        <footer className="bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
                    {/* Brand / Description */}
                    <div className="col-span-1">
                        <h3 className="text-xl font-bold mb-3 bg-gradient-to-r from-red-500 to-yellow-500 bg-clip-text text-transparent">
                            {language === 'kn' ? settings.site_name_kn || 'ಈಡೆನ್ಸ್ ಟಿವಿ' : settings.site_name_en || 'Edens TV'}
                        </h3>
                        <p className={`text-gray-400 text-sm leading-relaxed ${language === 'kn' ? 'font-kannada' : ''}`}>
                            {language === 'kn' ? settings.description_kn : settings.description_en}
                        </p>
                    </div>

                    {/* Navigation */}
                    <div className="col-span-1">
                        <h4 className={`text-lg font-semibold mb-4 ${language === 'kn' ? 'font-kannada' : ''}`}>{text.navigation}</h4>
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
                                        href={normalizeUrl(settings.ai_app_url)}
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

                    {/* Contact */}
                    <div className="col-span-1">
                        <h4 className={`text-lg font-semibold mb-4 ${language === 'kn' ? 'font-kannada' : ''}`}>{text.contact}</h4>
                        <div className="space-y-3">
                            {(settings.contact_address_kn || settings.contact_address_en) && (
                                <div className="flex items-start gap-3 text-gray-400">
                                    <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <span className={`text-sm leading-6 ${language === 'kn' ? 'font-kannada' : ''}`}>
                                        {language === 'kn' ? settings.contact_address_kn : settings.contact_address_en}
                                    </span>
                                </div>
                            )}
                            {settings.contact_email && (
                                <div className="flex items-center gap-3 text-gray-400">
                                    <Mail className="w-5 h-5 flex-shrink-0" />
                                    <a href={`mailto:${settings.contact_email}`} className="text-sm hover:text-white transition-colors">
                                        {settings.contact_email}
                                    </a>
                                </div>
                            )}
                            {settings.contact_phone && (
                                <div className="flex items-center gap-3 text-gray-400">
                                    <Phone className="w-5 h-5 flex-shrink-0" />
                                    <a href={`tel:${settings.contact_phone}`} className="text-sm hover:text-white transition-colors">
                                        {settings.contact_phone}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Social */}
                    <div className="col-span-1">
                        <h4 className={`text-lg font-semibold mb-4 ${language === 'kn' ? 'font-kannada' : ''}`}>{text.followUs}</h4>
                        {socialLinks.length > 0 ? (
                            <div className="flex gap-3 flex-wrap">
                                {socialLinks.map((social, index) => (
                                    <a
                                        key={index}
                                        href={social.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center ${social.hoverColor} transition-colors`}
                                        aria-label={social.name}
                                    >
                                        <social.icon className="w-5 h-5" />
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">Links not set in Admin → Settings → Social</p>
                        )}
                    </div>
                </div>

                {/* Footer AdSense Banner */}
                <div className="mb-6">
                  <AdSenseAd
                    slot="2468135790"
                    format="horizontal"
                    style={{ display: 'block', margin: '0 auto', minHeight: '90px' }}
                    className="text-center"
                  />
                </div>

                <div className="border-t border-gray-800 pt-6 lg:pt-8 mt-8">
                    <p className={`text-center text-gray-400 text-sm ${language === 'kn' ? 'font-kannada' : ''}`}>
                        {language === 'kn' ? settings.copyright_text_kn : settings.copyright_text_en}
                    </p>
                </div>
            </div>
        </footer>
    );
}
