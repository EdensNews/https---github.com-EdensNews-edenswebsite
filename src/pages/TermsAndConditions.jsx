import { useLanguage } from '@/components/LanguageContext';
import { Helmet } from 'react-helmet-async';
import { FileText, Scale, AlertCircle } from 'lucide-react';

export default function TermsAndConditions() {
    const { language } = useLanguage();

    const content = {
        en: {
            title: 'Terms and Conditions',
            lastUpdated: 'Last Updated: October 4, 2025',
            sections: [
                {
                    title: '1. Acceptance of Terms',
                    content: 'By accessing and using Edens News website, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.'
                },
                {
                    title: '2. Use License',
                    content: 'Permission is granted to temporarily download one copy of the materials (information or software) on Edens News website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not: modify or copy the materials; use the materials for any commercial purpose, or for any public display (commercial or non-commercial); attempt to decompile or reverse engineer any software contained on Edens News website; remove any copyright or other proprietary notations from the materials; or transfer the materials to another person or "mirror" the materials on any other server.'
                },
                {
                    title: '3. Disclaimer',
                    content: 'The materials on Edens News website are provided on an "as is" basis. Edens News makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights. Further, Edens News does not warrant or make any representations concerning the accuracy, likely results, or reliability of the use of the materials on its website or otherwise relating to such materials or on any sites linked to this site.'
                },
                {
                    title: '4. Content Accuracy',
                    content: 'While we strive to provide accurate and up-to-date news content, Edens News does not guarantee the accuracy, completeness, or timeliness of any news articles, information, or content published on our website. News content is provided for informational purposes only and should not be relied upon for making decisions without independent verification.'
                },
                {
                    title: '5. User Comments and Contributions',
                    content: 'Users may post comments, reactions, and other content on our website. You are responsible for your own communications and are responsible for the consequences of their posting. You must not do the following things: post material that is copyrighted, unless you are the copyright owner or have the permission of the copyright owner to post it; post material that reveals trade secrets, unless you own them or have the permission of the owner; post material that infringes on any other intellectual property rights of others or on the privacy or publicity rights of others; post material that is obscene, defamatory, threatening, harassing, abusive, hateful, or embarrassing to another user or any other person or entity.'
                },
                {
                    title: '6. Limitations',
                    content: 'In no event shall Edens News or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Edens News website, even if Edens News or an Edens News authorized representative has been notified orally or in writing of the possibility of such damage.'
                },
                {
                    title: '7. Accuracy of Materials',
                    content: 'The materials appearing on Edens News website could include technical, typographical, or photographic errors. Edens News does not warrant that any of the materials on its website are accurate, complete or current. Edens News may make changes to the materials contained on its website at any time without notice.'
                },
                {
                    title: '8. Links',
                    content: 'Edens News has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Edens News of the site. Use of any such linked website is at the user\'s own risk.'
                },
                {
                    title: '9. Modifications',
                    content: 'Edens News may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.'
                },
                {
                    title: '10. Governing Law',
                    content: 'These terms and conditions are governed by and construed in accordance with the laws of India and you irrevocably submit to the exclusive jurisdiction of the courts in that location.'
                },
                {
                    title: '11. Advertising',
                    content: 'Edens News displays third-party advertisements through Google AdSense and other advertising partners. We are not responsible for the content of these advertisements. Clicking on advertisements is at your own risk.'
                },
                {
                    title: '12. Intellectual Property',
                    content: 'All content on Edens News, including but not limited to text, graphics, logos, images, audio clips, video clips, and software, is the property of Edens News or its content suppliers and is protected by Indian and international copyright laws.'
                }
            ]
        },
        kn: {
            title: 'ನಿಯಮಗಳು ಮತ್ತು ಷರತ್ತುಗಳು',
            lastUpdated: 'ಕೊನೆಯ ನವೀಕರಣ: ಅಕ್ಟೋಬರ್ 4, 2025',
            sections: [
                {
                    title: '1. ನಿಯಮಗಳ ಸ್ವೀಕಾರ',
                    content: 'ಈಡನ್ಸ್ ನ್ಯೂಸ್ ವೆಬ್‌ಸೈಟ್ ಅನ್ನು ಪ್ರವೇಶಿಸುವ ಮತ್ತು ಬಳಸುವ ಮೂಲಕ, ನೀವು ಈ ಒಪ್ಪಂದದ ನಿಯಮಗಳು ಮತ್ತು ನಿಬಂಧನೆಗಳಿಗೆ ಬದ್ಧರಾಗಿರಲು ಒಪ್ಪುತ್ತೀರಿ. ನೀವು ಮೇಲಿನವುಗಳನ್ನು ಪಾಲಿಸಲು ಒಪ್ಪದಿದ್ದರೆ, ದಯವಿಟ್ಟು ಈ ಸೇವೆಯನ್ನು ಬಳಸಬೇಡಿ.'
                },
                {
                    title: '2. ಬಳಕೆ ಪರವಾನಗಿ',
                    content: 'ವೈಯಕ್ತಿಕ, ವಾಣಿಜ್ಯೇತರ ತಾತ್ಕಾಲಿಕ ವೀಕ್ಷಣೆಗಾಗಿ ಮಾತ್ರ ಈಡನ್ಸ್ ನ್ಯೂಸ್ ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿನ ವಸ್ತುಗಳ (ಮಾಹಿತಿ ಅಥವಾ ಸಾಫ್ಟ್‌ವೇರ್) ಒಂದು ಪ್ರತಿಯನ್ನು ತಾತ್ಕಾಲಿಕವಾಗಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಲು ಅನುಮತಿ ನೀಡಲಾಗಿದೆ.'
                },
                {
                    title: '3. ನಿರಾಕರಣೆ',
                    content: 'ಈಡನ್ಸ್ ನ್ಯೂಸ್ ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿನ ವಸ್ತುಗಳನ್ನು "ಇರುವಂತೆ" ಆಧಾರದ ಮೇಲೆ ಒದಗಿಸಲಾಗಿದೆ. ಈಡನ್ಸ್ ನ್ಯೂಸ್ ಯಾವುದೇ ವಾರಂಟಿಗಳನ್ನು ನೀಡುವುದಿಲ್ಲ.'
                },
                {
                    title: '4. ವಿಷಯ ನಿಖರತೆ',
                    content: 'ನಾವು ನಿಖರ ಮತ್ತು ನವೀಕೃತ ಸುದ್ದಿ ವಿಷಯವನ್ನು ಒದಗಿಸಲು ಪ್ರಯತ್ನಿಸುತ್ತಿರುವಾಗ, ಈಡನ್ಸ್ ನ್ಯೂಸ್ ನಮ್ಮ ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ಪ್ರಕಟವಾದ ಯಾವುದೇ ಸುದ್ದಿ ಲೇಖನಗಳು, ಮಾಹಿತಿ ಅಥವಾ ವಿಷಯದ ನಿಖರತೆ, ಸಂಪೂರ್ಣತೆ ಅಥವಾ ಸಮಯಪಾಲನೆಯನ್ನು ಖಾತರಿಪಡಿಸುವುದಿಲ್ಲ.'
                },
                {
                    title: '5. ಬಳಕೆದಾರ ಕಾಮೆಂಟ್‌ಗಳು',
                    content: 'ಬಳಕೆದಾರರು ನಮ್ಮ ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ಕಾಮೆಂಟ್‌ಗಳು, ಪ್ರತಿಕ್ರಿಯೆಗಳು ಮತ್ತು ಇತರ ವಿಷಯವನ್ನು ಪೋಸ್ಟ್ ಮಾಡಬಹುದು. ನಿಮ್ಮ ಸ್ವಂತ ಸಂವಹನಗಳಿಗೆ ನೀವು ಜವಾಬ್ದಾರರಾಗಿರುತ್ತೀರಿ.'
                },
                {
                    title: '6. ಮಿತಿಗಳು',
                    content: 'ಈಡನ್ಸ್ ನ್ಯೂಸ್ ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿನ ವಸ್ತುಗಳ ಬಳಕೆ ಅಥವಾ ಬಳಸಲು ಅಸಮರ್ಥತೆಯಿಂದ ಉಂಟಾಗುವ ಯಾವುದೇ ಹಾನಿಗಳಿಗೆ ಈಡನ್ಸ್ ನ್ಯೂಸ್ ಜವಾಬ್ದಾರರಾಗಿರುವುದಿಲ್ಲ.'
                },
                {
                    title: '7. ವಸ್ತುಗಳ ನಿಖರತೆ',
                    content: 'ಈಡನ್ಸ್ ನ್ಯೂಸ್ ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ಕಾಣಿಸಿಕೊಳ್ಳುವ ವಸ್ತುಗಳು ತಾಂತ್ರಿಕ, ಮುದ್ರಣ ಅಥವಾ ಛಾಯಾಚಿತ್ರ ದೋಷಗಳನ್ನು ಒಳಗೊಂಡಿರಬಹುದು.'
                },
                {
                    title: '8. ಲಿಂಕ್‌ಗಳು',
                    content: 'ಈಡನ್ಸ್ ನ್ಯೂಸ್ ತನ್ನ ವೆಬ್‌ಸೈಟ್‌ಗೆ ಲಿಂಕ್ ಮಾಡಲಾದ ಎಲ್ಲಾ ಸೈಟ್‌ಗಳನ್ನು ಪರಿಶೀಲಿಸಿಲ್ಲ ಮತ್ತು ಅಂತಹ ಯಾವುದೇ ಲಿಂಕ್ ಮಾಡಿದ ಸೈಟ್‌ನ ವಿಷಯಗಳಿಗೆ ಜವಾಬ್ದಾರರಾಗಿರುವುದಿಲ್ಲ.'
                },
                {
                    title: '9. ಮಾರ್ಪಾಡುಗಳು',
                    content: 'ಈಡನ್ಸ್ ನ್ಯೂಸ್ ತನ್ನ ವೆಬ್‌ಸೈಟ್‌ಗಾಗಿ ಈ ಸೇವಾ ನಿಯಮಗಳನ್ನು ಯಾವುದೇ ಸಮಯದಲ್ಲಿ ಸೂಚನೆಯಿಲ್ಲದೆ ಪರಿಷ್ಕರಿಸಬಹುದು.'
                },
                {
                    title: '10. ಆಡಳಿತ ಕಾನೂನು',
                    content: 'ಈ ನಿಯಮಗಳು ಮತ್ತು ಷರತ್ತುಗಳನ್ನು ಭಾರತದ ಕಾನೂನುಗಳ ಪ್ರಕಾರ ನಿಯಂತ್ರಿಸಲಾಗುತ್ತದೆ ಮತ್ತು ಅರ್ಥೈಸಲಾಗುತ್ತದೆ.'
                },
                {
                    title: '11. ಜಾಹೀರಾತು',
                    content: 'ಈಡನ್ಸ್ ನ್ಯೂಸ್ Google AdSense ಮತ್ತು ಇತರ ಜಾಹೀರಾತು ಪಾಲುದಾರರ ಮೂಲಕ ಮೂರನೇ ವ್ಯಕ್ತಿಯ ಜಾಹೀರಾತುಗಳನ್ನು ಪ್ರದರ್ಶಿಸುತ್ತದೆ.'
                },
                {
                    title: '12. ಬೌದ್ಧಿಕ ಆಸ್ತಿ',
                    content: 'ಈಡನ್ಸ್ ನ್ಯೂಸ್‌ನಲ್ಲಿನ ಎಲ್ಲಾ ವಿಷಯಗಳು ಈಡನ್ಸ್ ನ್ಯೂಸ್ ಅಥವಾ ಅದರ ವಿಷಯ ಪೂರೈಕೆದಾರರ ಆಸ್ತಿಯಾಗಿದೆ ಮತ್ತು ಭಾರತೀಯ ಮತ್ತು ಅಂತರರಾಷ್ಟ್ರೀಯ ಹಕ್ಕುಸ್ವಾಮ್ಯ ಕಾನೂನುಗಳಿಂದ ರಕ್ಷಿಸಲ್ಪಟ್ಟಿದೆ.'
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
                        <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full">
                            <Scale className="w-12 h-12 text-red-600 dark:text-red-400" />
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
                    {currentContent.sections.map((section, index) => (
                        <div key={index} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 pb-6 last:pb-0">
                            <h2 className={`text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-start gap-3 ${language === 'kn' ? 'font-kannada' : ''}`}>
                                <FileText className="w-6 h-6 text-red-600 dark:text-red-400 mt-1 flex-shrink-0" />
                                <span>{section.title}</span>
                            </h2>
                            <p className={`text-gray-700 dark:text-gray-300 leading-relaxed pl-9 ${language === 'kn' ? 'font-kannada' : ''}`}>
                                {section.content}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Contact Info */}
                <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                    <p className={`text-gray-700 dark:text-gray-300 text-center ${language === 'kn' ? 'font-kannada' : ''}`}>
                        {language === 'kn' 
                            ? 'ಈ ನಿಯಮಗಳ ಬಗ್ಗೆ ಯಾವುದೇ ಪ್ರಶ್ನೆಗಳಿದ್ದರೆ, ದಯವಿಟ್ಟು ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ.' 
                            : 'If you have any questions about these Terms and Conditions, please contact us.'}
                    </p>
                </div>
            </div>
        </div>
    );
}
