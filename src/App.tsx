import { useState, useEffect } from 'react';
import EventDetails, { EventHero } from './components/EventDetails';
import RegistrationForm from './components/RegistrationForm';
import AdminPanel from './components/AdminPanel';
import InquirySection from './components/InquirySection';
import { ToastProvider } from './components/Toast';
import { Heart, FileText, LayoutGrid, Award, ShieldAlert, Church, Calendar, BookKey } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'rsvp' | 'admin'>('rsvp');

  useEffect(() => {
    const checkHashAndQuery = () => {
      const isSearchAdmin = window.location.search.includes('admin') || window.location.hash === '#admin';
      if (isSearchAdmin) {
        setActiveTab('admin');
      } else {
        setActiveTab('rsvp');
      }
    };
    checkHashAndQuery();
    window.addEventListener('hashchange', checkHashAndQuery);
    return () => {
      window.removeEventListener('hashchange', checkHashAndQuery);
    };
  }, []);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-950 text-gray-50 font-sans relative overflow-x-hidden selection:bg-gold-500 selection:text-gold-950">
        {/* Main Layout Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-4 md:py-12">
          <AnimatePresence mode="wait">
            {activeTab === 'rsvp' ? (
              <motion.div
                key="rsvp-portal"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-12"
              >
                {/* Full-width Hero Section only */}
                <div className="w-full">
                  <EventHero />
                </div>

                {/* 12-column grid layout below it */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">
                  {/* Event Details and Scriptural contexts */}
                  <div className="lg:col-span-7">
                    <EventDetails />
                  </div>

                  {/* RSVP Interactive Registration Card */}
                  <div id="registration-card" className="lg:col-span-5 lg:sticky lg:top-8 lg:self-start">
                    <RegistrationForm />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="admin-dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="bg-neutral-950/30 border border-neutral-900/60 p-6 rounded-3xl"
              >
                <AdminPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Inquiry Form Helpline section (just before footer on guest portal view) */}
        {activeTab === 'rsvp' && <InquirySection />}

        {/* Footer Branding Acknowledgments */}
        <footer className="no-print border-t border-neutral-900 bg-black/95 py-10 text-xs text-gray-500 mt-16 relative z-10 font-sans">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-2 sm:gap-3">
              <span className="text-gold-500 font-serif italic tracking-wide text-[13.5px]">"Praise Unites. Songs Lift. Come Feel It."</span>
              <span className="text-neutral-800 hidden sm:inline">|</span>
              <span className="text-gray-500 font-medium">&copy; 2026 Church of Christ, Isolo, Lagos State</span>
            </div>
            
            <div className="flex items-center gap-2 text-[11px] text-gray-500">
              <span>Publicity Portal</span>
              <span className="text-neutral-800">•</span>
              <button 
                onClick={() => {
                  setActiveTab(activeTab === 'rsvp' ? 'admin' : 'rsvp');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-gray-500 hover:text-gold-450 font-mono transition text-[10px] cursor-pointer underline decoration-dotted underline-offset-4"
              >
                [{activeTab === 'rsvp' ? 'Admin Gateway' : 'Return to RSVP'}]
              </button>
            </div>
          </div>
        </footer>
      </div>
    </ToastProvider>
  );
}
