import { useLanguage } from '@/components/LanguageContext';
import { Helmet } from 'react-helmet-async';
import { Shield, Lock, Eye, Cookie, Mail, AlertCircle } from 'lucide-react';

export default function PrivacyPolicy() {
    const { language } = useLanguage();

    const content = {
        en: {
            title: 'Privacy Policy',
            lastUpdated: 'Last Updated: October 4, 2025',
            sections: [
                {
                    icon: Shield,
                    title: '1. Information We Collect',
                    content: 'We collect information that you provide directly to us when you create an account, subscribe to our newsletter, post comments, or interact with our website. This may include your name, email address, and any other information you choose to provide. We also automatically collect certain information about your device when you use our website, including your IP address, browser type, operating system, and browsing behavior.'
                },
                {
                    icon: Eye,
                    title: '2. How We Use Your Information',
                    content: 'We use the information we collect to: provide, maintain, and improve our services; send you news updates and newsletters (if you have subscribed); respond to your comments and questions; monitor and analyze trends, usage, and activities; detect, prevent, and address technical issues; personalize your experience on our website; and comply with legal obligations.'
                },
                {
                    icon: Cookie,
                    title: '3. Cookies and Tracking Technologies',
                    content: 'We use cookies and similar tracking technologies to track activity on our website and hold certain information. Cookies are files with a small amount of data which may include an anonymous unique identifier. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our website.'
                },
                {
                    icon: Lock,
                    title: '4. Third-Party Services',
                    content: 'We use third-party services including Google Analytics for website analytics, Google AdSense for advertising, and Supabase for data storage. These services may collect information sent by your browser as part of a web page request, such as cookies or your IP address. We also embed YouTube videos which may set cookies and collect data according to YouTube\'s privacy policy.'
                },
                {
                    icon: Shield,
                    title: '5. Google AdSense',
                    content: 'We use Google AdSense to display advertisements on our website. Google uses cookies to serve ads based on your prior visits to our website or other websites. You may opt out of personalized advertising by visiting Google\'s Ads Settings. Third-party vendors, including Google, use cookies to serve ads based on your past visits to our website.'
                },
                {
                    icon: Lock,
                    title: '6. Data Security',
                    content: 'We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.'
                },
                {
                    icon: Eye,
                    title: '7. Your Data Rights',
                    content: 'You have the right to: access the personal information we hold about you; request correction of inaccurate information; request deletion of your personal information; object to processing of your personal information; request restriction of processing your personal information; request transfer of your personal information; and withdraw consent at any time where we rely on consent to process your personal information.'
                },
                {
                    icon: Shield,
                    title: '8. Children\'s Privacy',
                    content: 'Our website is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact us so that we can take necessary actions.'
                },
                {
                    icon: Cookie,
                    title: '9. Analytics and Performance',
                    content: 'We use Google Analytics to understand how visitors use our website. Google Analytics collects information such as how often users visit our site, what pages they visit, and what other sites they used prior to coming to our site. We use the information we get from Google Analytics to improve our website and services.'
                },
                {
                    icon: Mail,
                    title: '10. Email Communications',
                    content: 'If you subscribe to our newsletter or create an account, we may send you emails about news updates, new features, or other information we think you might find interesting. You can unsubscribe from these communications at any time by clicking the unsubscribe link in the email or by contacting us.'
                },
                {
                    icon: Lock,
                    title: '11. Data Retention',
                    content: 'We retain your personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When we no longer need your personal information, we will securely delete or anonymize it.'
                },
                {
                    icon: Shield,
                    title: '12. International Data Transfers',
                    content: 'Your information may be transferred to and maintained on computers located outside of your state, province, country, or other governmental jurisdiction where data protection laws may differ. We will take all steps reasonably necessary to ensure that your data is treated securely.'
                },
                {
                    icon: AlertCircle,
                    title: '13. Changes to This Privacy Policy',
                    content: 'We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.'
                },
                {
                    icon: Mail,
                    title: '14. Contact Us',
                    content: 'If you have any questions about this Privacy Policy, please contact us through our website contact form or email us. We will respond to your inquiry as soon as possible.'
                }
            ]
        },
        kn: {
            title: 'ಗೋಪ್ಯತಾ ನೀತಿ',
            lastUpdated: 'ಕೊನೆಯ ನವೀಕರಣ: ಅಕ್ಟೋಬರ್ 4, 2025',
            sections: [
                {
                    icon: Shield,
                    title: '1. ನಾವು ಸಂಗ್ರಹಿಸುವ ಮಾಹಿತಿ',
                    content: 'ನೀವು ಖಾತೆಯನ್ನು ರಚಿಸಿದಾಗ, ನಮ್ಮ ಸುದ್ದಿಪತ್ರಕ್ಕೆ ಚಂದಾದಾರರಾದಾಗ, ಕಾಮೆಂಟ್‌ಗಳನ್ನು ಪೋಸ್ಟ್ ಮಾಡಿದಾಗ ಅಥವಾ ನಮ್ಮ ವೆಬ್‌ಸೈಟ್‌ನೊಂದಿಗೆ ಸಂವಹನ ನಡೆಸಿದಾಗ ನೀವು ನೇರವಾಗಿ ನಮಗೆ ಒದಗಿಸುವ ಮಾಹಿತಿಯನ್ನು ನಾವು ಸಂಗ್ರಹಿಸುತ್ತೇವೆ. ಇದು ನಿಮ್ಮ ಹೆಸರು, ಇಮೇಲ್ ವಿಳಾಸ ಮತ್ತು ನೀವು ಒದಗಿಸಲು ಆಯ್ಕೆ ಮಾಡುವ ಯಾವುದೇ ಇತರ ಮಾಹಿತಿಯನ್ನು ಒಳಗೊಂಡಿರಬಹುದು.'
                },
                {
                    icon: Eye,
                    title: '2. ನಾವು ನಿಮ್ಮ ಮಾಹಿತಿಯನ್ನು ಹೇಗೆ ಬಳಸುತ್ತೇವೆ',
                    content: 'ನಮ್ಮ ಸೇವೆಗಳನ್ನು ಒದಗಿಸಲು, ನಿರ್ವಹಿಸಲು ಮತ್ತು ಸುಧಾರಿಸಲು; ಸುದ್ದಿ ನವೀಕರಣಗಳು ಮತ್ತು ಸುದ್ದಿಪತ್ರಗಳನ್ನು ಕಳುಹಿಸಲು; ನಿಮ್ಮ ಕಾಮೆಂಟ್‌ಗಳು ಮತ್ತು ಪ್ರಶ್ನೆಗಳಿಗೆ ಪ್ರತಿಕ್ರಿಯಿಸಲು; ಪ್ರವೃತ್ತಿಗಳು, ಬಳಕೆ ಮತ್ತು ಚಟುವಟಿಕೆಗಳನ್ನು ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಲು ಮತ್ತು ವಿಶ್ಲೇಷಿಸಲು ನಾವು ಸಂಗ್ರಹಿಸುವ ಮಾಹಿತಿಯನ್ನು ಬಳಸುತ್ತೇವೆ.'
                },
                {
                    icon: Cookie,
                    title: '3. ಕುಕೀಗಳು ಮತ್ತು ಟ್ರ್ಯಾಕಿಂಗ್ ತಂತ್ರಜ್ಞಾನಗಳು',
                    content: 'ನಮ್ಮ ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿನ ಚಟುವಟಿಕೆಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಲು ಮತ್ತು ಕೆಲವು ಮಾಹಿತಿಯನ್ನು ಹಿಡಿದಿಡಲು ನಾವು ಕುಕೀಗಳು ಮತ್ತು ಇದೇ ರೀತಿಯ ಟ್ರ್ಯಾಕಿಂಗ್ ತಂತ್ರಜ್ಞಾನಗಳನ್ನು ಬಳಸುತ್ತೇವೆ.'
                },
                {
                    icon: Lock,
                    title: '4. ಮೂರನೇ ವ್ಯಕ್ತಿಯ ಸೇವೆಗಳು',
                    content: 'ವೆಬ್‌ಸೈಟ್ ವಿಶ್ಲೇಷಣೆಗಾಗಿ Google Analytics, ಜಾಹೀರಾತಿಗಾಗಿ Google AdSense ಮತ್ತು ಡೇಟಾ ಸಂಗ್ರಹಣೆಗಾಗಿ Supabase ಸೇರಿದಂತೆ ಮೂರನೇ ವ್ಯಕ್ತಿಯ ಸೇವೆಗಳನ್ನು ನಾವು ಬಳಸುತ್ತೇವೆ.'
                },
                {
                    icon: Shield,
                    title: '5. Google AdSense',
                    content: 'ನಮ್ಮ ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ಜಾಹೀರಾತುಗಳನ್ನು ಪ್ರದರ್ಶಿಸಲು ನಾವು Google AdSense ಅನ್ನು ಬಳಸುತ್ತೇವೆ. ನಮ್ಮ ವೆಬ್‌ಸೈಟ್ ಅಥವಾ ಇತರ ವೆಬ್‌ಸೈಟ್‌ಗಳಿಗೆ ನಿಮ್ಮ ಹಿಂದಿನ ಭೇಟಿಗಳ ಆಧಾರದ ಮೇಲೆ ಜಾಹೀರಾತುಗಳನ್ನು ನೀಡಲು Google ಕುಕೀಗಳನ್ನು ಬಳಸುತ್ತದೆ.'
                },
                {
                    icon: Lock,
                    title: '6. ಡೇಟಾ ಸುರಕ್ಷತೆ',
                    content: 'ಅನಧಿಕೃತ ಪ್ರವೇಶ, ಬದಲಾವಣೆ, ಬಹಿರಂಗಪಡಿಸುವಿಕೆ ಅಥವಾ ನಾಶದ ವಿರುದ್ಧ ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಮಾಹಿತಿಯನ್ನು ರಕ್ಷಿಸಲು ನಾವು ಸೂಕ್ತ ತಾಂತ್ರಿಕ ಮತ್ತು ಸಾಂಸ್ಥಿಕ ಭದ್ರತಾ ಕ್ರಮಗಳನ್ನು ಅನುಷ್ಠಾನಗೊಳಿಸುತ್ತೇವೆ.'
                },
                {
                    icon: Eye,
                    title: '7. ನಿಮ್ಮ ಡೇಟಾ ಹಕ್ಕುಗಳು',
                    content: 'ನಾವು ನಿಮ್ಮ ಬಗ್ಗೆ ಹೊಂದಿರುವ ವೈಯಕ್ತಿಕ ಮಾಹಿತಿಯನ್ನು ಪ್ರವೇಶಿಸುವ; ತಪ್ಪು ಮಾಹಿತಿಯ ತಿದ್ದುಪಡಿಯನ್ನು ವಿನಂತಿಸುವ; ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಮಾಹಿತಿಯ ಅಳಿಸುವಿಕೆಯನ್ನು ವಿನಂತಿಸುವ ಹಕ್ಕನ್ನು ನೀವು ಹೊಂದಿರುತ್ತೀರಿ.'
                },
                {
                    icon: Shield,
                    title: '8. ಮಕ್ಕಳ ಗೋಪ್ಯತೆ',
                    content: 'ನಮ್ಮ ವೆಬ್‌ಸೈಟ್ 13 ವರ್ಷಕ್ಕಿಂತ ಕಡಿಮೆ ವಯಸ್ಸಿನ ಮಕ್ಕಳಿಗೆ ಉದ್ದೇಶಿಸಿಲ್ಲ. 13 ವರ್ಷಕ್ಕಿಂತ ಕಡಿಮೆ ವಯಸ್ಸಿನ ಮಕ್ಕಳಿಂದ ನಾವು ಉದ್ದೇಶಪೂರ್ವಕವಾಗಿ ವೈಯಕ್ತಿಕ ಮಾಹಿತಿಯನ್ನು ಸಂಗ್ರಹಿಸುವುದಿಲ್ಲ.'
                },
                {
                    icon: Cookie,
                    title: '9. ವಿಶ್ಲೇಷಣೆ ಮತ್ತು ಕಾರ್ಯಕ್ಷಮತೆ',
                    content: 'ಸಂದರ್ಶಕರು ನಮ್ಮ ವೆಬ್‌ಸೈಟ್ ಅನ್ನು ಹೇಗೆ ಬಳಸುತ್ತಾರೆ ಎಂಬುದನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ನಾವು Google Analytics ಅನ್ನು ಬಳಸುತ್ತೇವೆ.'
                },
                {
                    icon: Mail,
                    title: '10. ಇಮೇಲ್ ಸಂವಹನಗಳು',
                    content: 'ನೀವು ನಮ್ಮ ಸುದ್ದಿಪತ್ರಕ್ಕೆ ಚಂದಾದಾರರಾದರೆ ಅಥವಾ ಖಾತೆಯನ್ನು ರಚಿಸಿದರೆ, ಸುದ್ದಿ ನವೀಕರಣಗಳು, ಹೊಸ ವೈಶಿಷ್ಟ್ಯಗಳು ಅಥವಾ ಇತರ ಮಾಹಿತಿಯ ಬಗ್ಗೆ ನಾವು ನಿಮಗೆ ಇಮೇಲ್‌ಗಳನ್ನು ಕಳುಹಿಸಬಹುದು.'
                },
                {
                    icon: Lock,
                    title: '11. ಡೇಟಾ ಧಾರಣ',
                    content: 'ಈ ಗೋಪ್ಯತಾ ನೀತಿಯಲ್ಲಿ ವಿವರಿಸಿದ ಉದ್ದೇಶಗಳನ್ನು ಪೂರೈಸಲು ಅಗತ್ಯವಿರುವವರೆಗೆ ಮಾತ್ರ ನಾವು ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಮಾಹಿತಿಯನ್ನು ಉಳಿಸಿಕೊಳ್ಳುತ್ತೇವೆ.'
                },
                {
                    icon: Shield,
                    title: '12. ಅಂತರರಾಷ್ಟ್ರೀಯ ಡೇಟಾ ವರ್ಗಾವಣೆಗಳು',
                    content: 'ನಿಮ್ಮ ಮಾಹಿತಿಯನ್ನು ನಿಮ್ಮ ರಾಜ್ಯ, ಪ್ರಾಂತ್ಯ, ದೇಶ ಅಥವಾ ಇತರ ಸರ್ಕಾರಿ ನ್ಯಾಯವ್ಯಾಪ್ತಿಯ ಹೊರಗೆ ಇರುವ ಕಂಪ್ಯೂಟರ್‌ಗಳಿಗೆ ವರ್ಗಾಯಿಸಬಹುದು ಮತ್ತು ನಿರ್ವಹಿಸಬಹುದು.'
                },
                {
                    icon: AlertCircle,
                    title: '13. ಈ ಗೋಪ್ಯತಾ ನೀತಿಗೆ ಬದಲಾವಣೆಗಳು',
                    content: 'ನಾವು ಕಾಲಕಾಲಕ್ಕೆ ನಮ್ಮ ಗೋಪ್ಯತಾ ನೀತಿಯನ್ನು ನವೀಕರಿಸಬಹುದು. ಈ ಪುಟದಲ್ಲಿ ಹೊಸ ಗೋಪ್ಯತಾ ನೀತಿಯನ್ನು ಪೋಸ್ಟ್ ಮಾಡುವ ಮೂಲಕ ಮತ್ತು "ಕೊನೆಯ ನವೀಕರಣ" ದಿನಾಂಕವನ್ನು ನವೀಕರಿಸುವ ಮೂಲಕ ಯಾವುದೇ ಬದಲಾವಣೆಗಳನ್ನು ನಾವು ನಿಮಗೆ ತಿಳಿಸುತ್ತೇವೆ.'
                },
                {
                    icon: Mail,
                    title: '14. ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ',
                    content: 'ಈ ಗೋಪ್ಯತಾ ನೀತಿಯ ಬಗ್ಗೆ ನಿಮಗೆ ಯಾವುದೇ ಪ್ರಶ್ನೆಗಳಿದ್ದರೆ, ದಯವಿಟ್ಟು ನಮ್ಮ ವೆಬ್‌ಸೈಟ್ ಸಂಪರ್ಕ ಫಾರ್ಮ್ ಮೂಲಕ ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ ಅಥವಾ ನಮಗೆ ಇಮೇಲ್ ಮಾಡಿ.'
                }
            ]
        }
    };

    const currentContent = content[language] || content.en;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Helmet>
                <title>{currentContent.title} | Edens News</title>
                <meta name="description" content={`${currentContent.title} for Edens News - Multilingual News Portal`} />
            </Helmet>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex justify-center mb-4">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full">
                            <Shield className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                    <h1 className={`text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-4 ${language === 'kn' ? 'font-kannada' : ''}`}>
                        {currentContent.title}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 flex items-center justify-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {currentContent.lastUpdated}
                    </p>
                </div>

                {/* Content */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 space-y-8">
                    {currentContent.sections.map((section, index) => {
                        const IconComponent = section.icon;
                        return (
                            <div key={index} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 pb-6 last:pb-0">
                                <h2 className={`text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-start gap-3 ${language === 'kn' ? 'font-kannada' : ''}`}>
                                    <IconComponent className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                                    <span>{section.title}</span>
                                </h2>
                                <p className={`text-gray-700 dark:text-gray-300 leading-relaxed pl-9 ${language === 'kn' ? 'font-kannada' : ''}`}>
                                    {section.content}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Important Notice */}
                <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" />
                        <div>
                            <h3 className={`font-bold text-gray-900 dark:text-gray-100 mb-2 ${language === 'kn' ? 'font-kannada' : ''}`}>
                                {language === 'kn' ? 'ಮುಖ್ಯ ಸೂಚನೆ' : 'Important Notice'}
                            </h3>
                            <p className={`text-gray-700 dark:text-gray-300 ${language === 'kn' ? 'font-kannada' : ''}`}>
                                {language === 'kn' 
                                    ? 'ಈ ಗೋಪ್ಯತಾ ನೀತಿಯನ್ನು ನಿಯಮಿತವಾಗಿ ಪರಿಶೀಲಿಸಿ. ಯಾವುದೇ ಬದಲಾವಣೆಗಳ ಬಗ್ಗೆ ತಿಳಿದಿರಲು ನೀವು ಜವಾಬ್ದಾರರಾಗಿರುತ್ತೀರಿ.' 
                                    : 'Please review this Privacy Policy periodically. You are responsible for staying informed about any changes.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                    <p className={`text-gray-700 dark:text-gray-300 text-center ${language === 'kn' ? 'font-kannada' : ''}`}>
                        {language === 'kn' 
                            ? 'ಈ ಗೋಪ್ಯತಾ ನೀತಿಯ ಬಗ್ಗೆ ಯಾವುದೇ ಪ್ರಶ್ನೆಗಳಿದ್ದರೆ, ದಯವಿಟ್ಟು ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ.' 
                            : 'If you have any questions about this Privacy Policy, please contact us.'}
                    </p>
                </div>
            </div>
        </div>
    );
}
