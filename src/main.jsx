import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from '@/App.jsx'
import '@/index.css'
import React from 'react'

ReactDOM.createRoot(document.getElementById('root')).render(
    <HelmetProvider>
        <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=G-M8C1T8ZMN7`}></script>
            <script dangerouslySetInnerHTML={{ __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-M8C1T8ZMN7');
            `}} />
            <App />
        </>
    </HelmetProvider>
)