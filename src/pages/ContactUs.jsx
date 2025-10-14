import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/components/LanguageContext';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function ContactUs() {
    const { language } = useLanguage();

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 py-12">
            <Helmet>
                <title>{language === 'kn' ? 'ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ' : 'Contact Us'} | Edens News</title>
                <meta name="description" content="Get in touch with Edens News team" />
            </Helmet>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className={`text-4xl font-bold mb-8 text-gray-900 dark:text-gray-100 ${language === 'kn' ? 'font-kannada' : ''}`}>
                    {language === 'kn' ? 'ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ' : 'Contact Us'}
                </h1>

                <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <h2 className={`text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100 ${language === 'kn' ? 'font-kannada' : ''}`}>
                            {language === 'kn' ? 'ಸಂಪರ್ಕ ಮಾಹಿತಿ' : 'Contact Information'}
                        </h2>
                        
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Mail className="w-6 h-6 text-red-600 mt-1" />
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                        {language === 'kn' ? 'ಇಮೇಲ್' : 'Email'}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400">info.edensnews@gmail.com</p>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                                        {language === 'kn' ? 'ಸುದ್ದಿ ಸಲಹೆಗಳು:' : 'News Tips:'} info.edensnews@gmail.com
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <MapPin className="w-6 h-6 text-red-600 mt-1" />
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                        {language === 'kn' ? 'ವಿಳಾಸ' : 'Address'}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        <strong>Edens News</strong><br />
                                        5th Cross, Paduvana Road<br />
                                        TK Layout, Kuvempu Nagara<br />
                                        Mysuru, Karnataka 570023<br />
                                        India
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h2 className={`text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100 ${language === 'kn' ? 'font-kannada' : ''}`}>
                            {language === 'kn' ? 'ಸಂದೇಶ ಕಳುಹಿಸಿ' : 'Send us a Message'}
                        </h2>
                        
                        <form className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {language === 'kn' ? 'ಹೆಸರು' : 'Name'}
                                </label>
                                <input 
                                    type="text" 
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-600 dark:bg-gray-800 dark:text-white"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {language === 'kn' ? 'ಇಮೇಲ್' : 'Email'}
                                </label>
                                <input 
                                    type="email" 
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-600 dark:bg-gray-800 dark:text-white"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {language === 'kn' ? 'ಸಂದೇಶ' : 'Message'}
                                </label>
                                <textarea 
                                    rows="4"
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-600 dark:bg-gray-800 dark:text-white"
                                    required
                                ></textarea>
                            </div>

                            <button 
                                type="submit"
                                className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-semibold"
                            >
                                {language === 'kn' ? 'ಕಳುಹಿಸಿ' : 'Send Message'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
