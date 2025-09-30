import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from '@/App.jsx'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <HelmetProvider>
        <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=G-M8C1T8ZMN7`}></script>
            <meta name="google-adsense-account" content="ca-pub-6371316656890571"></meta>
            <script dangerouslySetInnerHTML={{ __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-M8C1T8ZMN7', {
                    'page_title': document.title,
                    'page_location': window.location.href,
                    'anonymize_ip': true,
                    'allow_ad_features': false,
                    'custom_map': {'dimension1': 'language'},
                    'send_page_view': true
                });
            `}} />
            <App />
        </>
    </HelmetProvider>
)