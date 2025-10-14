import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/components/LanguageContext';

export default function AboutUs() {
    const { language } = useLanguage();

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 py-12">
            <Helmet>
                <title>{language === 'kn' ? 'ನಮ್ಮ ಬಗ್ಗೆ' : 'About Us'} | Edens News</title>
                <meta name="description" content="Learn about Edens News - Your trusted multilingual news source" />
            </Helmet>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className={`text-4xl font-bold mb-8 text-gray-900 dark:text-gray-100 ${language === 'kn' ? 'font-kannada' : ''}`}>
                    {language === 'kn' ? 'ನಮ್ಮ ಬಗ್ಗೆ' : 'About Edens News'}
                </h1>

                <div className={`prose prose-lg dark:prose-invert max-w-none ${language === 'kn' ? 'font-kannada' : ''}`}>
                    {language === 'kn' ? (
                        <>
                            <p className="text-lg leading-relaxed mb-6 font-semibold text-red-600">
                                ತನಿಖಾ ಪತ್ರಿಕೋದ್ಯಮ ಮತ್ತು ಹೈಪರ್-ಲೋಕಲ್ ಸುದ್ದಿ ವರದಿಯನ್ನು ಆಧರಿಸಿದ ಕರ್ನಾಟಕದ ಏಕೈಕ ಸುದ್ದಿ ಚಾನೆಲ್
                            </p>
                            
                            <p className="text-lg leading-relaxed mb-6">
                                ಈಡನ್ಸ್ ನ್ಯೂಸ್ ಕರ್ನಾಟಕದ ಪ್ರಮುಖ ತನಿಖಾ ಪತ್ರಿಕೋದ್ಯಮ ವೇದಿಕೆಯಾಗಿದ್ದು, ರಾಜ್ಯದಾದ್ಯಂತ ಹೈಪರ್-ಲೋಕಲ್ ಸುದ್ದಿ ವರದಿಯಲ್ಲಿ ಪರಿಣತಿ ಹೊಂದಿದೆ. ಆಳವಾದ ತನಿಖಾ ವರದಿ ಮತ್ತು ತಳಮಟ್ಟದ ಪತ್ರಿಕೋದ್ಯಮಕ್ಕೆ ಮೀಸಲಾದ ಕರ್ನಾಟಕದ ಏಕೈಕ ಸುದ್ದಿ ಚಾನೆಲ್ ನಾವು.
                            </p>
                            
                            <h2>ನಮ್ಮ ವಿಶಿಷ್ಟತೆ</h2>
                            <p>
                                <strong>ತನಿಖಾ ಪತ್ರಿಕೋದ್ಯಮ:</strong> ನಾವು ಕೇವಲ ಸುದ್ದಿಯನ್ನು ವರದಿ ಮಾಡುವುದಿಲ್ಲ - ನಾವು ಅದನ್ನು ತನಿಖೆ ಮಾಡುತ್ತೇವೆ. ಭ್ರಷ್ಟಾಚಾರವನ್ನು ಬಹಿರಂಗಪಡಿಸುವುದು, ಅಧಿಕಾರವನ್ನು ಜವಾಬ್ದಾರರನ್ನಾಗಿ ಮಾಡುವುದು ನಮ್ಮ ಗುರಿ.
                            </p>
                            <p>
                                <strong>ಹೈಪರ್-ಲೋಕಲ್ ವರದಿ:</strong> ಇತರ ಸುದ್ದಿ ಚಾನೆಲ್‌ಗಳು ಪ್ರಮುಖ ನಗರಗಳ ಮೇಲೆ ಕೇಂದ್ರೀಕರಿಸಿದಾಗ, ನಾವು ಕರ್ನಾಟಕದ ಪ್ರತಿಯೊಂದು ತಾಲೂಕು, ಗ್ರಾಮ ಮತ್ತು ಸಮುದಾಯದಿಂದ ಸುದ್ದಿಗಳನ್ನು ತರುತ್ತೇವೆ.
                            </p>

                            <h2>ನಮ್ಮ ಉದ್ದೇಶ</h2>
                            <p>
                                ನಿರ್ಭೀತ, ಸತ್ಯಾಧಾರಿತ ತನಿಖಾ ಪತ್ರಿಕೋದ್ಯಮವನ್ನು ತಲುಪಿಸುವುದು ಮತ್ತು ಸಾಮಾನ್ಯ ನಾಗರಿಕರ ಧ್ವನಿಯನ್ನು ವರ್ಧಿಸುವುದು.
                            </p>

                            <h2>ಬಹುಭಾಷಾ ವರದಿ</h2>
                            <p>
                                ನಾವು ಆರು ಭಾಷೆಗಳಲ್ಲಿ ವರದಿ ಮಾಡುತ್ತೇವೆ - ಕನ್ನಡ, ಇಂಗ್ಲಿಷ್, ತಮಿಳು, ತೆಲುಗು, ಹಿಂದಿ ಮತ್ತು ಮಲಯಾಳಂ.
                            </p>

                            <h2>ಸಂಪರ್ಕಿಸಿ</h2>
                            <p>
                                <strong>ಇಮೇಲ್:</strong> info.edensnews@gmail.com<br />
                                <strong>ವಿಳಾಸ:</strong> ಈಡನ್ಸ್ ನ್ಯೂಸ್<br />
                                5ನೇ ಕ್ರಾಸ್, ಪದುವನ ರಸ್ತೆ, ಟಿ.ಕೆ ಲೇಔಟ್<br />
                                ಕುವೆಂಪು ನಗರ, ಮೈಸೂರು, ಕರ್ನಾಟಕ 570023<br />
                                ಭಾರತ
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="text-lg leading-relaxed mb-6 font-semibold text-red-600">
                                Karnataka's Only News Channel Based on Investigation Journalism and Hyper-Local News Coverage
                            </p>
                            
                            <p className="text-lg leading-relaxed mb-6">
                                Edens News is Karnataka's premier investigative journalism platform, specializing in hyper-local news coverage across the state. We are the only news channel in Karnataka dedicated to in-depth investigative reporting and grassroots journalism, bringing untold stories from every corner of the state to light.
                            </p>
                            
                            <h2>What Makes Us Unique</h2>
                            <p>
                                <strong>Investigation Journalism:</strong> We don't just report the news – we investigate it. Our team of dedicated journalists digs deep to uncover the truth behind every story, exposing corruption, holding power accountable, and giving voice to the voiceless.
                            </p>
                            <p>
                                <strong>Hyper-Local Coverage:</strong> While other news channels focus on major cities, we bring you news from every taluk, village, and community in Karnataka. From Mysuru to Mangaluru, from Hubballi to Ballari – we cover stories that matter to local communities.
                            </p>

                            <h2>Our Mission</h2>
                            <p>
                                To deliver fearless, fact-based investigative journalism that holds the powerful accountable and amplifies the voices of ordinary citizens. We believe in journalism that makes a difference – stories that lead to change, expose wrongdoing, and serve the public interest.
                            </p>

                            <h2>Multilingual Coverage</h2>
                            <p>
                                We report in six languages – Kannada, English, Tamil, Telugu, Hindi, and Malayalam – ensuring that every citizen of Karnataka can access quality investigative journalism in their preferred language.
                            </p>

                            <h2>What We Cover</h2>
                            <ul>
                                <li><strong>Investigative Reports:</strong> In-depth investigations into corruption, scams, and public interest issues</li>
                                <li><strong>Hyper-Local News:</strong> Stories from villages, taluks, and small towns across Karnataka</li>
                                <li><strong>Politics:</strong> Ground-level political coverage and analysis</li>
                                <li><strong>Social Issues:</strong> Stories on education, healthcare, infrastructure, and civic issues</li>
                                <li><strong>Karnataka News:</strong> Comprehensive state-wide coverage</li>
                                <li><strong>Sports:</strong> Local sports and athletes from across Karnataka</li>
                                <li><strong>Business:</strong> Local businesses, startups, and economic developments</li>
                                <li><strong>Culture:</strong> Karnataka's rich cultural heritage and traditions</li>
                            </ul>

                            <h2>Our Commitment</h2>
                            <p>
                                We are committed to:
                            </p>
                            <ul>
                                <li>Fearless and independent journalism</li>
                                <li>Fact-checking and verification of all stories</li>
                                <li>Giving voice to marginalized communities</li>
                                <li>Exposing corruption and wrongdoing</li>
                                <li>Serving the public interest above all else</li>
                                <li>Maintaining the highest ethical standards</li>
                            </ul>

                            <h2>Our Team</h2>
                            <p>
                                Our team consists of experienced investigative journalists, field reporters, and content creators spread across Karnataka. We have correspondents in every district, ensuring comprehensive coverage of the entire state.
                            </p>

                            <h2>Contact Us</h2>
                            <p>
                                <strong>Email:</strong> info.edensnews@gmail.com<br />
                                <strong>Address:</strong> Edens News<br />
                                5th Cross, Paduvana Road, TK Layout<br />
                                Kuvempu Nagara, Mysuru, Karnataka 570023<br />
                                India
                            </p>

                            <h2>News Tips</h2>
                            <p>
                                Have a story tip? We want to hear from you. Contact us at <strong>info.edensnews@gmail.com</strong> with your information. We protect our sources and maintain strict confidentiality.
                            </p>

                            <h2>Advertising</h2>
                            <p>
                                For advertising inquiries, please contact us at: info.edensnews@gmail.com
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
