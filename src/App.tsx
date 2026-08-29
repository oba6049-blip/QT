/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import FeaturedNews from "./components/FeaturedNews";
import Categories from "./components/Categories";
import WhyChooseUs from "./components/WhyChooseUs";
import Spotlight from "./components/Spotlight";
import Authors from "./components/Authors";
import Events from "./components/Events";
import Newsletter from "./components/Newsletter";
import Footer from "./components/Footer";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import { useEffect } from "react";
import { seedDatabase } from "./services/articleService";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLoginPage from "./pages/AdminLoginPage";
import CategoryPage from "./pages/CategoryPage";
import EventsPage from "./pages/EventsPage";
import TrendingPage from "./pages/TrendingPage";
import ArticlePage from "./pages/ArticlePage";
import SpotlightPage from "./pages/SpotlightPage";
import ContributorProfilePage from "./pages/ContributorProfilePage";
import ContributorsPage from "./pages/ContributorsPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import PartnershipsPage from "./pages/PartnershipsPage";

function AppContent() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      seedDatabase(user.uid);
    }
  }, [user]);

  const websiteSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://techquonews.com/#organization",
        "name": "TechQuo News",
        "url": "https://techquonews.com",
        "logo": {
          "@type": "ImageObject",
          "@id": "https://techquonews.com/#logo",
          "url": "https://techquonews.com/logo.png",
          "caption": "TechQuo News"
        },
        "sameAs": [
          "https://twitter.com/techquonews",
          "https://linkedin.com/company/techquonews"
        ]
      },
      {
        "@type": "WebSite",
        "@id": "https://techquonews.com/#website",
        "url": "https://techquonews.com",
        "name": "TechQuo News",
        "description": "A premium digital media and news publishing platform for African tech, fintech, venture capital, and startup insights.",
        "publisher": {
          "@id": "https://techquonews.com/#organization"
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/login" element={<AdminLoginPage />} />
        <Route path="/trending" element={<TrendingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/partnerships" element={<PartnershipsPage />} />
        <Route path="/category/:category" element={<CategoryPage />} />
        <Route path="/technology" element={<CategoryPage />} />
        <Route path="/fintech" element={<CategoryPage />} />
        <Route path="/business" element={<CategoryPage />} />
        <Route path="/startups" element={<CategoryPage />} />
        <Route path="/career" element={<CategoryPage />} />
        <Route path="/contributors/:slug" element={<ContributorProfilePage />} />
        <Route path="/contributor/:slug" element={<ContributorProfilePage />} />
        <Route path="/contributors" element={<ContributorsPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/article/:id" element={<ArticlePage />} />
        <Route path="/spotlight/:id" element={<SpotlightPage />} />
        {/* Canonical SEO article route: /:category/:slug */}
        <Route path="/:category/:slug" element={<ArticlePage />} />
        <Route path="/" element={
          <>
            <Helmet>
              <title>TechQuo News | African Tech, FinTech & Startup Insights</title>
              <meta name="description" content="A premium digital media and news publishing platform for tech, business, and startup insights." />
              <link rel="canonical" href="https://techquonews.com/" />
              <meta name="robots" content="index, follow" />
              <meta property="og:title" content="TechQuo News | African Tech, FinTech & Startup Insights" />
              <meta property="og:description" content="A premium digital media and news publishing platform for tech, business, and startup insights." />
              <meta property="og:url" content="https://techquonews.com/" />
              <meta property="og:type" content="website" />
              <meta property="og:site_name" content="TechQuo News" />
              <meta name="twitter:card" content="summary_large_image" />
              <meta name="twitter:title" content="TechQuo News | African Tech, FinTech & Startup Insights" />
              <meta name="twitter:description" content="A premium digital media and news publishing platform for tech, business, and startup insights." />
            </Helmet>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
            />
            <Navbar />
            <main className="flex-1">
              <Hero />
              <FeaturedNews />
              <Categories />
              <WhyChooseUs />
              <Spotlight />
              <Authors />
              <Events />
              <Newsletter />
            </main>
            <Footer />
          </>
        } />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}
