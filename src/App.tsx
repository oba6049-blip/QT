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
import AdminDashboard from "./pages/AdminDashboard";
import AdminLoginPage from "./pages/AdminLoginPage";
import CategoryPage from "./pages/CategoryPage";
import EventsPage from "./pages/EventsPage";
import TrendingPage from "./pages/TrendingPage";
import ArticlePage from "./pages/ArticlePage";
import SpotlightPage from "./pages/SpotlightPage";

function AppContent() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      seedDatabase(user.uid);
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/login" element={<AdminLoginPage />} />
        <Route path="/trending" element={<TrendingPage />} />
        <Route path="/category/:category" element={<CategoryPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/article/:id" element={<ArticlePage />} />
        <Route path="/spotlight/:id" element={<SpotlightPage />} />
        <Route path="/" element={
          <>
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
