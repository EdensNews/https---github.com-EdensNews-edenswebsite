

import { useEffect } from "react";
import PropTypes from 'prop-types';
import { LanguageProvider } from "../components/LanguageContext";
import Header from "../components/news/Header";
import BreakingMarquee from "../components/news/BreakingMarquee";
import Footer from "../components/news/Footer";
import { Toaster } from "@/components/ui/toaster";

export default function Layout({ children }) {
  // Set dark theme by default
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    const unlisten = (() => {
      // Fallback approach: observe URL changes
      let last = window.location.href;
      const interval = setInterval(() => {
        if (window.location.href !== last) {
          last = window.location.href;
          window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        }
      }, 150);
      return () => clearInterval(interval);
    })();
    return () => {
      if (typeof unlisten === 'function') unlisten();
    };
  }, []);

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 font-sans transition-all duration-500">
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Kannada:wght@400;500;700&display=swap');
            
            :root {
              --background: 222.2 84% 4.9%;
              --foreground: 210 40% 98%;
              --card: 222.2 84% 4.9%;
              --card-foreground: 210 40% 98%;
              --popover: 222.2 84% 4.9%;
              --popover-foreground: 210 40% 98%;
              --primary: 0 84% 60%;
              --primary-foreground: 222.2 47.4% 11.2%;
              --secondary: 217.2 32.6% 17.5%;
              --secondary-foreground: 210 40% 98%;
              --muted: 217.2 32.6% 17.5%;
              --muted-foreground: 215 20.2% 65.1%;
              --accent: 45 93% 58%;
              --accent-foreground: 210 40% 98%;
              --destructive: 0 62.8% 30.6%;
              --destructive-foreground: 210 40% 98%;
              --border: 217.2 32.6% 17.5%;
              --input: 217.2 32.6% 17.5%;
              --ring: 0 84% 60%;
              --radius: 0.5rem;
            }

            body {
              font-family: 'Inter', sans-serif;
              background-color: hsl(var(--background));
              color: hsl(var(--foreground));
            }
            
            .font-kannada {
              font-family: 'Noto Sans Kannada', sans-serif;
            }

            /* Line clamp utilities for consistent text truncation */
            .line-clamp-1 {
              overflow: hidden;
              display: -webkit-box;
              -webkit-box-orient: vertical;
              -webkit-line-clamp: 1;
            }

            .line-clamp-2 {
              overflow: hidden;
              display: -webkit-box;
              -webkit-box-orient: vertical;
              -webkit-line-clamp: 2;
            }

            .line-clamp-3 {
              overflow: hidden;
              display: -webkit-box;
              -webkit-box-orient: vertical;
              -webkit-line-clamp: 3;
            }

            @keyframes marquee {
              0% { transform: translateX(100%); }
              100% { transform: translateX(-100%); }
            }

            .animate-marquee {
              animation: marquee 30s linear infinite;
            }

            .animate-marquee:hover {
              animation-play-state: paused;
            }

            @keyframes gradient {
              0%, 100% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
            }

            .animate-gradient {
              background-size: 200% 200%;
              animation: gradient 3s ease infinite;
            }

            @keyframes float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-10px); }
            }

            .animate-float {
              animation: float 3s ease-in-out infinite;
            }

            @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }

            .animate-shimmer {
              animation: shimmer 2s ease-in-out infinite;
            }

            /* Smooth scrolling */
            html {
              scroll-behavior: smooth;
            }

            /* Custom scrollbar */
            ::-webkit-scrollbar {
              width: 8px;
            }

            ::-webkit-scrollbar-track {
              background: #374151;
            }

            ::-webkit-scrollbar-thumb {
              background: linear-gradient(45deg, #dc2626, #fbbf24);
              border-radius: 4px;
            }

            ::-webkit-scrollbar-thumb:hover {
              background: linear-gradient(45deg, #b91c1c, #f59e0b);
            }

            /* Mobile touch improvements */
            @media (max-width: 768px) {
              /* Ensure touch targets are at least 44px and properly aligned */
              .mobile-header-button {
                min-height: 44px;
                min-width: 44px;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
              }

              /* Fix header positioning */
              header {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                z-index: 50 !important;
              }

              /* Ensure logo and buttons are properly aligned */
              .header-logo-link, .header-nav-link {
                display: flex;
                align-items: center;
                position: relative;
              }

              /* Improve touch feedback */
              button:active, [role="button"]:active, a:active {
                transform: scale(0.98);
                transition: transform 0.1s ease;
              }

              /* Remove tap highlight on mobile */
              * {
                -webkit-tap-highlight-color: transparent;
              }
            }

            /* Loading animations */
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }

            .animate-pulse {
              animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
          `}
        </style>
        <Header />
        <BreakingMarquee />
        <main className="pt-24 sm:pt-28 lg:pt-32 min-h-screen">
          <div className="bg-slate-900 text-slate-50 animate-in fade-in duration-700">
            {children}
          </div>
        </main>
        <Footer />
        <Toaster />
      </div>
    </LanguageProvider>
  );
}

Layout.propTypes = {
  children: PropTypes.node.isRequired
};

