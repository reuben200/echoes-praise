import { useState, useEffect } from 'react';
import { EVENT_DETAILS } from '../types';
import { Calendar, Clock, MapPin, Music, Heart, Church, BookOpen, Share2, Clipboard, Check } from 'lucide-react';
import { motion } from 'motion/react';

export function EventHero() {
  return (
    <div className="relative rounded-3xl overflow-hidden border border-gold-900/30 glow-heavy w-full min-h-[380px] sm:min-h-[440px] flex flex-col justify-end p-5 sm:p-7 md:p-8 group no-print">
      {/* Banner image background */}
      <motion.img
        src="/assets/images/hero-banner.png"
        alt="Echoes of Praise Worship"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-[1.02] transition duration-[1200ms] ease-out"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      />
      {/* Dark overlay layers for optimal visual contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/0 z-10 pointer-events-none"></div>
      <div className="absolute inset-0 bg-black/35 z-10 pointer-events-none"></div>

      {/* Content overlaid */}
      <div className="relative z-20 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 bg-gold-950/90 border border-gold-900 text-gold-400 font-mono tracking-widest text-[9px] sm:text-[10px] px-3 py-1 uppercase rounded-full">
            <Church className="w-3 h-3 text-gold-450" /> {EVENT_DETAILS.churchName}
          </span>
          <div className="inline-flex items-center gap-1.5 bg-neutral-950/90 border border-gold-900/50 text-gold-400 font-mono tracking-widest text-[9px] px-3 py-1 uppercase rounded-full">
            <Clock className="w-2.5 h-2.5 text-gold-500 animate-pulse" /> Live Event
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="font-display font-light tracking-tight leading-tight text-white text-3xl sm:text-4xl md:text-5xl">
            Echoes <span className="text-gold-400/95 font-serif italic text-shimmer">of Praise</span>
          </h1>
          <p className="font-serif italic text-gold-300/80 text-xs sm:text-sm md:text-base tracking-wide uppercase">
            {EVENT_DETAILS.theme}
          </p>
        </div>

        <p className="text-gray-300 text-xs sm:text-sm max-w-xl leading-relaxed font-sans">
          A glorious morning of absolute worship, unity, and gratitude. Join the brethren at Isolo as we lift our voices together in echoes of praise to the King of Kings.
        </p>

        <div className="pt-2">
          <button
            onClick={() => {
              const el = document.getElementById('registration-card');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-gold-950 font-bold uppercase tracking-wider text-[11px] py-2.5 px-6 rounded-xl transition shadow-xl duration-300 cursor-pointer select-none active:scale-95"
          >
            <Heart className="w-3.5 h-3.5 fill-current text-gold-950" /> Reserve a Seat
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EventDetails() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +EVENT_DETAILS.dateObj - +new Date();
      let timeLeftValues = { days: 0, hours: 0, minutes: 0, seconds: 0 };

      if (difference > 0) {
        timeLeftValues = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }
      return timeLeftValues;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const copyAddress = () => {
    navigator.clipboard.writeText(EVENT_DETAILS.location);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [shareUrl, setShareUrl] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    setShareUrl(window.location.origin + window.location.pathname);
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-8">

      {/* Real-time Countdown Timer */}
      <div className="bg-black/60 border border-gold-900/40 p-5 rounded-2xl glow-heavy backdrop-blur-md">
        <h3 className="text-gold-400 text-[11px] font-mono tracking-widest uppercase mb-3 flex items-center gap-1.5 justify-center md:justify-start">
          <Clock className="w-3.5 h-3.5" /> Countdown to Worship
        </h3>
        <div className="grid grid-cols-4 gap-3 text-center">
          {[
            { value: timeLeft.days, label: 'DAYS' },
            { value: timeLeft.hours, label: 'HRS' },
            { value: timeLeft.minutes, label: 'MINS' },
            { value: timeLeft.seconds, label: 'SECS' }
          ].map((item, idx) => (
            <div key={idx} className="bg-gold-950/20 border border-gold-900/20 p-2.5 rounded-xl">
              <span className="block text-2xl md:text-3xl font-display font-extrabold text-gold-300">
                {String(item.value).padStart(2, '0')}
              </span>
              <span className="text-[9px] font-mono tracking-wider text-gray-500 font-medium">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Date, Time & Venue Specs */}
      <div className="grid grid-cols-1 gap-6">
        <div className="flex gap-4 items-start bg-gray-950/50 border border-gold-900 p-4 rounded-xl relative group">
          <div className="p-3 bg-gold-950/80 border border-gold-900 text-gold-400 rounded-lg">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[11px] font-mono tracking-widest text-gold-500 uppercase flex items-center justify-between">
              Date
              <a 
                href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("Echoes of Praise - Isolo, Lagos")}&dates=20260919T090000Z/20260919T130000Z&details=${encodeURIComponent("A glorious morning of absolute worship, unity, and gratitude. Join the brethren at Isolo as we lift our voices together in echoes of praise to the King of Kings.")}&location=${encodeURIComponent(EVENT_DETAILS.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-gold-450 hover:text-white flex items-center gap-1.5 bg-gold-950 hover:bg-gold-900 border border-gold-900/60 transition px-2.5 py-0.5 rounded-md cursor-pointer font-sans font-medium"
                title="Add to Google Calendar"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Add to Calendar
              </a>
            </h4>
            <a 
              href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("Echoes of Praise - Isolo, Lagos")}&dates=20260919T090000Z/20260919T130000Z&details=${encodeURIComponent("A glorious morning of absolute worship, unity, and gratitude. Join the brethren at Isolo as we lift our voices together in echoes of praise to the King of Kings.")}&location=${encodeURIComponent(EVENT_DETAILS.location)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-white text-base font-semibold font-sans mt-0.5 hover:text-gold-450 transition cursor-pointer"
              title="Add to Google Calendar"
            >
              {EVENT_DETAILS.dateStr}
            </a>
            <p className="text-gray-400 text-xs font-mono">Saturday, Sept 19th, 2026</p>
          </div>
        </div>

        <div className="flex gap-4 items-start bg-gray-950/50 border border-gold-900 p-4 rounded-xl">
          <div className="p-3 bg-gold-950/80 border border-gold-900 text-gold-400 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[11px] font-mono tracking-widest text-gold-500 uppercase">Time</h4>
            <p className="text-white text-base font-semibold font-sans mt-0.5">{EVENT_DETAILS.timeStr}</p>
            <p className="text-gray-400 text-xs font-mono">10:00AM GMT+1 (Prompt)</p>
          </div>
        </div>

        <div className="flex gap-4 items-start bg-gray-950/50 border border-gold-900 p-4 rounded-xl relative group">
          <div className="p-3 bg-gold-950/80 border border-gold-900 text-gold-400 rounded-lg">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[11px] font-mono tracking-widest text-gold-500 uppercase flex items-center justify-between">
              Venue
              <button 
                onClick={copyAddress}
                className="text-[10px] hover:text-white flex items-center gap-1 bg-gold-950 hover:bg-gold-900 border border-gold-900/60 transition px-2 py-0.5 rounded ml-2"
                title="Copy Address"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Clipboard className="w-3 h-3" /> Copy
                  </>
                )}
              </button>
            </h4>
            <p className="text-white text-base font-semibold font-sans mt-0.5 truncate">{EVENT_DETAILS.churchName}</p>
            <p className="text-gray-400 text-xs leading-relaxed mt-0.5">{EVENT_DETAILS.location}, Nigeria.</p>
          </div>
        </div>
      </div>

      {/* Share Section & Scriptures Container Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Share Section - Beautiful invitation card with WhatsApp & Facebook options */}
        <div className="bg-gradient-to-br from-neutral-950 to-neutral-900 border border-gold-900/40 p-5 rounded-2xl glow-heavy backdrop-blur-md space-y-4 font-sans flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-gold-950/60 pb-3">
              <Share2 className="w-4 h-4 text-gold-450 animate-pulse" />
              <h4 className="text-xs font-mono tracking-widest text-gold-400 uppercase font-bold">
                Invite Brethren & Friends
              </h4>
            </div>

            <p className="text-gray-300 text-xs mt-3 leading-relaxed">
              Share the event link with your loved ones and invite them to experience a glorious morning of absolute worship.
            </p>

            {/* Link Copy Widget */}
            <div className="relative flex items-center bg-black/80 border border-neutral-800 rounded-xl p-1.5 mt-3 focus-within:border-gold-500/60 transition group">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="bg-transparent text-gray-400 font-mono text-[11px] sm:text-xs px-3 py-1.5 flex-1 outline-none pointer-events-none select-all overflow-ellipsis"
              />
              <button
                onClick={copyLink}
                className="flex items-center gap-1.5 bg-gold-950/80 hover:bg-gold-900 border border-gold-900/50 text-gold-400 hover:text-white transition px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer active:scale-95 shrink-0"
                title="Copy Invitation Link"
              >
                {linkCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                    <span className="text-emerald-400 font-mono">Copied!</span>
                  </>
                ) : (
                  <>
                    <Clipboard className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Instant Social Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-3">
            {/* WhatsApp Button */}
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                `Join me for *Echoes of Praise 2026* at the Church of Christ, Isolo, Lagos State! Come lift your voices in absolute grateful praise on Saturday, September 19th, 2026. Secure your seat/RSVP here: ${shareUrl}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-emerald-600/15 border border-emerald-500/20 hover:bg-emerald-600/35 hover:border-emerald-500/40 text-emerald-400 font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl transition cursor-pointer active:scale-95"
              title="Share via WhatsApp"
            >
              {/* Custom high-fidelity WhatsApp SVG */}
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.01.01a11.908 11.908 0 018.495 3.519 11.918 11.918 0 013.51 8.5c0 6.66-5.337 11.999-11.95 11.999-2.005-.002-3.974-.5-5.755-1.442L0 24zm6.59-4.846c1.785 1.058 3.549 1.621 5.361 1.622 5.405 0 9.805-4.4 9.808-9.812.003-2.618-1.01-5.08-2.859-6.931A9.539 9.539 0 0012.01 1.953c-5.41 0-9.814 4.403-9.817 9.814-.002 1.902.502 3.753 1.464 5.378l-.961 3.513 3.606-.946zm11.533-5.26c-.295-.147-1.745-.86-2.011-.958-.266-.098-.46-.147-.655.147-.195.295-.754.958-.925 1.154-.171.195-.341.219-.636.072-1.341-.67-2.181-1.083-3.033-2.541-.225-.388.225-.36.643-1.196.07-.147.035-.276-.018-.38-.053-.105-.46-1.109-.63-1.52-.167-.399-.351-.345-.482-.351-.125-.006-.268-.007-.411-.007-.143 0-.377.054-.574.271-.197.217-.751.734-.751 1.79s.767 2.078.873 2.22c.106.142 1.51 2.305 3.658 3.232.511.222.91.354 1.221.453.513.163.98.14 1.349.085.411-.061 1.745-.713 1.991-1.402.247-.689.247-1.28.173-1.402-.075-.121-.267-.195-.563-.343z" />
              </svg>
              <span>WhatsApp</span>
            </a>

            {/* Facebook Button */}
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-blue-600/15 border border-blue-500/20 hover:bg-blue-600/35 hover:border-blue-500/40 text-blue-400 font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl transition cursor-pointer active:scale-95"
              title="Share on Facebook"
            >
              {/* Custom high-fidelity Facebook SVG */}
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Facebook</span>
            </a>
          </div>
        </div>

        {/* Scripture Quotes featured in the flyer */}
        <div className="bg-neutral-900/10 border border-gold-900/15 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-mono tracking-widest text-gold-400 uppercase flex items-center gap-2 border-b border-gold-950 pb-2">
              <BookOpen className="w-4 h-4 text-gold-500" /> Inspired Scriptures
            </h4>
            <div className="grid grid-cols-1 gap-3 mt-4">
              {EVENT_DETAILS.scriptures.map((item, index) => (
                <div key={index} className="bg-black/40 border-l-2 border-l-gold-500 border-y border-r border-gold-950 p-4 rounded-r-xl">
                  <span className="font-mono text-gold-400 text-[10px] tracking-widest">{item.reference}</span>
                  <p className="font-serif italic text-gray-300 text-sm mt-1 leading-relaxed">
                    "{item.verse}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
