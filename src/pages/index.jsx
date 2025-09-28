import Layout from "./Layout.jsx";

import Home from "./Home";

import ArticleDetail from "./ArticleDetail";

import LiveTV from "./LiveTV";

import Search from "./Search";

import Admin from "./Admin";

import AdminWrite from "./AdminWrite";

import AdminStream from "./AdminStream";

import AdminSettings from "./AdminSettings";

import AdminManage from "./AdminManage";

import AdminAnalytics from "./AdminAnalytics";

import AdminMedia from "./AdminMedia";

import Bookmarks from "./Bookmarks";

import AdminCategories from "./AdminCategories";

import AdminRss from "./AdminRss";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Home: Home,
    
    ArticleDetail: ArticleDetail,
    
    LiveTV: LiveTV,
    
    Search: Search,
    
    Admin: Admin,
    
    AdminWrite: AdminWrite,
    
    AdminStream: AdminStream,
    
    AdminSettings: AdminSettings,
    
    AdminManage: AdminManage,
    
    AdminAnalytics: AdminAnalytics,
    
    AdminMedia: AdminMedia,
    
    Bookmarks: Bookmarks,
    
    AdminCategories: AdminCategories,
    
    AdminRss: AdminRss,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    // Convert to lowercase to match the routes
    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Home />} />
                
                
                <Route path="/home" element={<Home />} />
                
                <Route path="/articledetail" element={<ArticleDetail />} />
                
                <Route path="/livetv" element={<LiveTV />} />
                
                <Route path="/search" element={<Search />} />
                
                <Route path="/admin" element={<Admin />} />
                
                <Route path="/adminwrite" element={<AdminWrite />} />
                
                <Route path="/adminstream" element={<AdminStream />} />
                
                <Route path="/adminsettings" element={<AdminSettings />} />
                
                <Route path="/adminmanage" element={<AdminManage />} />
                
                <Route path="/adminanalytics" element={<AdminAnalytics />} />
                
                <Route path="/adminmedia" element={<AdminMedia />} />
                
                <Route path="/bookmarks" element={<Bookmarks />} />
                
                <Route path="/admincategories" element={<AdminCategories />} />
                
                <Route path="/adminrss" element={<AdminRss />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}