import { useState, FormEvent } from 'react';
import { Mail, Phone, User, Send, CheckCircle, MessageSquare } from 'lucide-react';
import { addInquiry } from '../firebase';
import { useToast } from './Toast';

export default function InquirySection() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.fullName.trim().length < 2) {
      setError('Please provide your name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setError('Please provide a valid email.');
      return;
    }
    if (formData.phone.trim().length < 7) {
      setError('Please enter your contact phone number.');
      return;
    }
    if (formData.message.trim().length < 5) {
      setError('Your inquiry message must be at least 5 characters.');
      return;
    }

    setLoading(true);
    try {
      await addInquiry({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        message: formData.message.trim()
      });

      setSuccess(true);
      toastSuccess('Your inquiry has been submitted and securely recorded in our database!');
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        message: ''
      });
    } catch (err: any) {
      console.error(err);
      let errMsg = 'Failed to submit message. Please try again.';
      try {
        if (err.message) {
          const parsed = JSON.parse(err.message);
          if (parsed && parsed.error) {
            errMsg = `Inquiry database write rejected: ${parsed.error}`;
          }
        }
      } catch (e) {
        if (err.message) {
          errMsg = err.message;
        }
      }
      setError(errMsg);
      toastError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="no-print mt-6 sm:mt-16 max-w-5xl mx-auto px-4 sm:px-6 relative z-10 font-sans" id="inquiry-section">
      <div className="bg-neutral-950/60 border border-neutral-900 rounded-3xl p-6 md:p-10 relative overflow-hidden backdrop-blur-md shadow-2xl">
        {/* Ambient Glow Orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold-950/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
          
          {/* Left Column: Context, Helpline Phones and WhatsApp Button */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="text-[10px] font-mono tracking-widest text-gold-400 font-bold uppercase block mb-1">
                CONTACT HELPLINE
              </span>
              <h3 className="text-xl md:text-2xl font-display font-semibold text-white tracking-tight">
                HAVE ANY INQUIRY?
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed mt-2">
                Do you have questions regarding the event, schedule, logistics or streaming links? Feel free to contact the organizing committee directly.
              </p>
            </div>

            {/* Helpline Numbers list */}
            <div className="space-y-3">
              <span className="text-[9px] font-mono tracking-wider text-gray-500 uppercase font-semibold">
                Helpline Phone Contacts
              </span>
              <div className="divide-y divide-neutral-900 bg-neutral-900/20 rounded-2xl border border-neutral-900 p-3 space-y-2.5">
                <a 
                  href="tel:+2348039778795" 
                  className="flex items-center gap-3 text-xs text-gray-300 hover:text-gold-400 transition pt-1.5 first:pt-0"
                >
                  <div className="w-7 h-7 rounded-xl bg-gold-950/50 border border-gold-900/30 flex items-center justify-center text-gold-450 shrink-0">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <div className="font-mono">
                    <p className="text-[10px] text-gray-500 font-sans leading-none mb-0.5">Programme Contact</p>
                    +234 803 977 8795
                  </div>
                </a>

                <a 
                  href="tel:+2347067974559" 
                  className="flex items-center gap-3 text-xs text-gray-300 hover:text-gold-400 transition pt-2.5"
                >
                  <div className="w-7 h-7 rounded-xl bg-gold-950/50 border border-gold-900/30 flex items-center justify-center text-gold-450 shrink-0">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <div className="font-mono">
                    <p className="text-[10px] text-gray-500 font-sans leading-none mb-0.5">Protocol & RSVPs</p>
                    +234 706 797 4559
                  </div>
                </a>

                <a 
                  href="tel:+2349039499694" 
                  className="flex items-center gap-3 text-xs text-gray-300 hover:text-gold-400 transition pt-2.5 pb-0.5"
                >
                  <div className="w-7 h-7 rounded-xl bg-gold-950/50 border border-gold-900/30 flex items-center justify-center text-gold-450 shrink-0">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <div className="font-mono">
                    <p className="text-[10px] text-gray-500 font-sans leading-none mb-0.5">Media & Logistics</p>
                    +234 903 949 9694
                  </div>
                </a>
                <a 
                  href="tel:+2347052238301" 
                  className="flex items-center gap-3 text-xs text-gray-300 hover:text-gold-400 transition pt-2.5 pb-0.5"
                >
                  <div className="w-7 h-7 rounded-xl bg-gold-950/50 border border-gold-900/30 flex items-center justify-center text-gold-450 shrink-0">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <div className="font-mono">
                    <p className="text-[10px] text-gray-500 font-sans leading-none mb-0.5">Preacher</p>
                    +234 705 223 8301
                  </div>
                </a>
              </div>
            </div>

            {/* WhatsApp direct chat link button styling */}
            <div className="pt-2">
              <a
                href="https://chat.whatsapp.com/DIIAAcfAu4LLOQ72VL16Td"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider py-3 px-5 rounded-2xl transition shadow-lg hover:shadow-emerald-950/50 active:scale-95"
              >
                <div className="w-4 h-4 rounded-full border border-white/40 flex items-center justify-center bg-emerald-700/80 shrink-0">
                  <MessageSquare className="w-2.5 h-2.5" />
                </div>
                <span>Join WhatsApp Group</span>
              </a>
            </div>
          </div>

          {/* Right Column: Inquiry Submission form */}
          <div className="lg:col-span-7 bg-neutral-900/35 border border-neutral-900 rounded-3xl p-5 md:p-6 space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-white tracking-widest font-display uppercase">
                SEND DIRECT INQUIRY
              </h4>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Fill the fields below to dispatch a message directly to our admin panel logs.
              </p>
            </div>

            {success ? (
              <div className="bg-emerald-950/30 border border-emerald-900/60 rounded-2xl p-6 text-center space-y-3">
                <div className="inline-flex p-2.5 bg-emerald-950/50 border border-emerald-900 text-emerald-400 rounded-full animate-bounce">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h4 className="text-white text-sm font-semibold">Message Dispatched Seamlessly</h4>
                <p className="text-[11px] text-gray-400 leading-relaxed max-w-sm mx-auto">
                  Your inquiry has been stored securely in the administrators' log database file. We shall reach out shortly to resolve your concerns.
                </p>
                <button
                  type="button"
                  onClick={() => setSuccess(false)}
                  className="text-[10px] text-gold-400 hover:text-gold-300 font-mono underline cursor-pointer"
                >
                  Send another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-950/40 border border-red-900 text-red-300 rounded-xl p-3 text-[11px] font-sans">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name field */}
                  <div className="relative">
                    <label className="block text-[10px] font-mono tracking-wider text-gray-400 uppercase mb-1 font-medium">
                      Your Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <User className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="John Doe"
                        className="w-full bg-neutral-900 border border-neutral-850 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 text-white pl-9 pr-3 py-2 rounded-xl text-xs transition outline-none"
                      />
                    </div>
                  </div>

                  {/* Phone field */}
                  <div className="relative">
                    <label className="block text-[10px] font-mono tracking-wider text-gray-400 uppercase mb-1 font-medium">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Phone className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="e.g. +234..."
                        className="w-full bg-neutral-900 border border-neutral-850 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 text-white pl-9 pr-3 py-2 rounded-xl text-xs transition outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Email field */}
                <div className="relative">
                  <label className="block text-[10px] font-mono tracking-wider text-gray-400 uppercase mb-1 font-medium">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="w-3.5 h-3.5 text-gray-500" />
                    </div>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@example.com"
                      className="w-full bg-neutral-900 border border-neutral-850 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 text-white pl-9 pr-3 py-2 rounded-xl text-xs transition outline-none"
                    />
                  </div>
                </div>

                {/* Message Field */}
                <div>
                  <label className="block text-[10px] font-mono tracking-wider text-gray-400 uppercase mb-1 font-medium">
                    Your Message
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Write details of your concerns or requests here..."
                    className="w-full bg-neutral-900 border border-neutral-850 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 text-white p-3 rounded-xl text-xs transition outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gold-600 hover:bg-gold-500 disabled:opacity-50 text-gold-950 font-bold uppercase tracking-wider text-[11px] py-2.5 rounded-xl transition shadow-xl font-mono flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" /> {loading ? 'SENDING...' : 'DISPATCH MESSAGE'}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}