import { useState, FormEvent } from 'react';
import { addRegistration, sendConfirmationEmail } from '../firebase';
import { Mail, User, Phone, CheckCircle, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from './Toast';

export default function RegistrationForm() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    mobile: '',
    member: null as boolean | null,
    congregation: '',
    attendance_mode: [] as string[],
    song_part: [] as string[],
    notes: '',
    interestConfirmed: true
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [registeredUser, setRegisteredUser] = useState<any>(null);

  const toggleAttendanceMode = (mode: string) => {
    setFormData(prev => {
      const current = prev.attendance_mode;
      if (current.includes(mode)) {
        return { ...prev, attendance_mode: current.filter(m => m !== mode) };
      } else {
        return { ...prev, attendance_mode: [...current, mode] };
      }
    });
  };

  const toggleSongPart = (part: string) => {
    setFormData(prev => {
      const current = prev.song_part;
      if (current.includes(part)) {
        return { ...prev, song_part: current.filter(p => p !== part) };
      } else {
        return { ...prev, song_part: [...current, part] };
      }
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic Validations
    if (formData.full_name.trim().length < 2) {
      setError('Please provide your genuine Full Name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setError('Please provide a valid email address.');
      return;
    }
    const cleanMobileStr = formData.mobile.replace(/[^0-9]/g, '');
    if (cleanMobileStr.length < 7) {
      setError('Please enter a valid mobile number.');
      return;
    }
    const numericMobile = Number(cleanMobileStr);
    if (isNaN(numericMobile) || numericMobile <= 0) {
      setError('Please enter a valid mobile number.');
      return;
    }
    if (formData.member === null) {
      setError('Please indicate if you are a member of the congregation.');
      return;
    }
    if (formData.congregation.trim().length < 1) {
      setError('Please enter your congregation name.');
      return;
    }
    if (formData.attendance_mode.length === 0) {
      setError('Please select at least one Attendance Mode.');
      return;
    }
    if (formData.song_part.length === 0) {
      setError('Please select at least one Song Part preference.');
      return;
    }
    if (!formData.interestConfirmed) {
      setError('Please confirm your interest in attending by checking the declaration box.');
      return;
    }

    setLoading(true);
    try {
      const regObj = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        mobile: numericMobile,
        member: formData.member,
        congregation: formData.congregation.trim(),
        attendance_mode: formData.attendance_mode,
        song_part: formData.song_part,
        notes: formData.notes.trim()
      };

      const response = await addRegistration(regObj);
      setRegisteredUser(response);
      setSuccess(true);
      toastSuccess(`Congratulations! Seat reserved successfully for ${response.full_name}`);

      // Fire and forget send automated confirmation email request
      sendConfirmationEmail({
        fullName: response.full_name,
        email: response.email,
        phone: String(response.mobile),
        attendanceType: response.attendance_mode.join(', '),
        notes: response.notes || '',
        ticketId: response.id
      }).then(res => {
        if (res.success) {
          console.log('%c[Confirmation Email Dispatch]', 'color: #d4af37; font-weight: bold;', 'Email dispatched successfully via client-side EmailJS.');
        }
      }).catch(emailErr => {
        console.error('Failed to trigger confirmation email service dispatcher:', emailErr);
      });

      // Reset form
      setFormData({
        full_name: '',
        email: '',
        mobile: '',
        member: null,
        congregation: '',
        attendance_mode: [],
        song_part: [],
        notes: '',
        interestConfirmed: true
      });
    } catch (err: any) {
      console.error(err);
      let errMsg = 'System update encountered a challenge. Please check values or retry.';
      try {
        if (err.message) {
          const parsed = JSON.parse(err.message);
          if (parsed && parsed.error) {
            errMsg = `Database write rejected: ${parsed.error}`;
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
    <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 border border-gold-900/30 p-6 sm:p-8 rounded-3xl glow-heavy backdrop-blur-lg">
      <AnimatePresence mode="wait">
        {!success ? (
          <motion.div
            key="form-container"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center md:text-left mb-6">
              <span className="text-[10px] font-mono tracking-widest text-gold-500 uppercase font-bold bg-gold-950/40 border border-gold-900/30 px-2.5 py-0.5 rounded">
                Indicate Your Interest
              </span>
              <h2 className="text-2xl font-display font-medium text-white mt-2">
                RESERVE YOUR <span className="text-gold-400">RSVP SEAT</span>
              </h2>
              <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                Fill this simple form to indicate interest. It helps us adequately prepare for you; our in-person guests as well as livestream invites.
              </p>
            </div>

            {error && (
              <div className="mb-4 bg-red-950/60 border border-red-900/60 p-3 rounded-xl text-xs text-red-200">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono tracking-wider text-gray-400 uppercase mb-1.5 font-medium">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Enter your name"
                    className="w-full bg-neutral-900/80 border border-neutral-800 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 text-white pl-10 pr-4 py-2.5 rounded-xl text-sm transition outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono tracking-wider text-gray-400 uppercase mb-1.5 font-medium">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@example.com"
                    className="w-full bg-neutral-900/80 border border-neutral-800 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 text-white pl-10 pr-4 py-2.5 rounded-xl text-sm transition outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono tracking-wider text-gray-400 uppercase mb-1.5 font-medium">
                  WhatsApp / Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="e.g. 08034567890 or +234..."
                    className="w-full bg-neutral-900/80 border border-neutral-800 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 text-white pl-10 pr-4 py-2.5 rounded-xl text-sm transition outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono tracking-wider text-gray-400 uppercase mb-1.5 font-medium">
                    Are you a member?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, member: true })}
                      className={`py-2 rounded-xl text-xs font-bold uppercase transition ${
                        formData.member === true
                          ? 'border border-gold-500 bg-gold-950/30 text-gold-300'
                          : 'border border-neutral-800 hover:border-neutral-700 bg-neutral-900/40 text-gray-400'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, member: false })}
                      className={`py-2 rounded-xl text-xs font-bold uppercase transition ${
                        formData.member === false
                          ? 'border border-gold-500 bg-gold-950/30 text-gold-300'
                          : 'border border-neutral-800 hover:border-neutral-700 bg-neutral-900/40 text-gray-400'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono tracking-wider text-gray-400 uppercase mb-1.5 font-medium">
                    Congregation/Church
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.congregation}
                    onChange={(e) => setFormData({ ...formData, congregation: e.target.value })}
                    placeholder="e.g. Isolo, Lagos"
                    className="w-full bg-neutral-900/80 border border-neutral-800 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 text-white px-3 py-2 rounded-xl text-sm transition outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono tracking-wider text-gray-400 uppercase mb-1 mt-1 font-medium">
                  Attendance Mode <span className="text-[10px] text-gray-500 font-normal lowercase">(select one or both)</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => toggleAttendanceMode('In-Person')}
                    className={`py-2.5 border rounded-xl text-xs font-bold text-center uppercase tracking-wider transition cursor-pointer ${
                      formData.attendance_mode.includes('In-Person')
                        ? 'border-gold-500 bg-gold-950/30 text-gold-300'
                        : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/40 text-gray-400'
                    }`}
                  >
                    ⛪ In-Person {formData.attendance_mode.includes('In-Person') && '✓'}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleAttendanceMode('Online')}
                    className={`py-2.5 border rounded-xl text-xs font-bold text-center uppercase tracking-wider transition cursor-pointer ${
                      formData.attendance_mode.includes('Online')
                        ? 'border-gold-500 bg-gold-950/30 text-gold-300'
                        : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/40 text-gray-400'
                    }`}
                  >
                    🖥️ Online {formData.attendance_mode.includes('Online') && '✓'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono tracking-wider text-gray-400 uppercase mb-1.5 font-medium">
                  Voice / Song Part Preference <span className="text-[10px] text-gray-500 font-normal lowercase">(select all that apply)</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['soprano', 'treble', 'alto', 'tenor', 'bass', 'not sure'].map((part) => (
                    <button
                      key={part}
                      type="button"
                      onClick={() => toggleSongPart(part)}
                      className={`py-2 border rounded-lg text-[11px] font-semibold text-center capitalize transition cursor-pointer ${
                        formData.song_part.includes(part)
                          ? 'border-gold-500 bg-gold-950/30 text-gold-300'
                          : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/30 text-gray-400'
                      }`}
                    >
                      {part} {formData.song_part.includes(part) && '✓'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono tracking-wider text-gray-400 uppercase mb-1.5 font-medium flex items-center justify-between">
                  <span>Additional Notes</span>
                  <span className="text-[9px] text-gray-400 lowercase">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Share any special notes, prayer requests, or questions here..."
                  className="w-full bg-neutral-900/80 border border-neutral-800 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 text-white px-3 py-2 rounded-xl text-sm transition outline-none resize-none"
                />
              </div>

              <div className="flex items-start gap-2.5 pt-1">
                <input
                  id="interest-confirmed"
                  type="checkbox"
                  checked={formData.interestConfirmed}
                  onChange={(e) => setFormData({ ...formData, interestConfirmed: e.target.checked })}
                  className="mt-1 rounded border-neutral-800 bg-neutral-900 text-gold-600 focus:ring-1 focus:ring-gold-500 h-5 w-5 outline-none cursor-pointer accent-gold-500"
                />
                <label htmlFor="interest-confirmed" className="text-gray-400 text-xs leading-normal select-none cursor-pointer">
                  I confirm my interest in attending <span className="text-gold-400 font-medium font-display uppercase tracking-wider text-[11px]">Echoes of Praise</span>. Please register my seat.
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-gold-950 font-bold uppercase tracking-widest text-xs py-3 px-4 rounded-xl transition glow-btn active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-2 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-gold-950" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    RECORDING RSVP...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> SECURE MY RESERVATION
                  </>
                )}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="success-container"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="text-center py-6"
          >
            <div className="inline-flex items-center justify-center p-4 bg-emerald-950/60 border border-emerald-800/80 rounded-full text-emerald-400 mb-4 animate-bounce">
              <CheckCircle className="w-12 h-12" />
            </div>
            
            <h2 className="text-2xl font-display font-medium text-white mb-2">
              YOU ARE <span className="text-emerald-400">REGISTERED!</span>
            </h2>
            <p className="text-gray-300 text-sm max-w-sm mx-auto leading-relaxed font-sans mb-6">
              Welcome, <span className="font-semibold text-white">{registeredUser?.full_name}</span>! Your RSVP has been entered successfully.
            </p>

            {/* Receipt/Ticket Summary */}
            <div className="bg-black/60 border border-gold-900/30 rounded-2xl p-5 mb-6 text-left max-w-sm mx-auto shadow-inner relative overflow-hidden backdrop-blur-md">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gold-500/5 rounded-full blur-xl"></div>
              
              <div className="flex justify-between border-b border-neutral-900 pb-3 mb-3">
                <span className="text-[10px] font-mono tracking-wider text-gray-500 uppercase">TICKET ID</span>
                <span className="text-[10px] font-mono tracking-wider text-gold-400 uppercase font-semibold">
                  {registeredUser?.id}
                </span>
              </div>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Attendee:</span>
                  <span className="text-gray-200 font-medium truncate max-w-[200px]">{registeredUser?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Attendance:</span>
                  <span className="text-gold-300 font-semibold uppercase">{registeredUser?.attendance_mode?.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Song Part:</span>
                  <span className="text-gray-200 capitalize truncate max-w-[200px]">{registeredUser?.song_part?.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone:</span>
                  <span className="text-gray-200">{registeredUser?.mobile}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 max-w-xs mx-auto">
              <button
                onClick={() => setSuccess(false)}
                className="w-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-gray-300 text-xs uppercase tracking-wider py-2.5 rounded-xl transition"
              >
                Register Another Person
              </button>
              
              <p className="text-[11px] text-gray-400 leading-normal">
                ✉️ An automated confirmation email pass has been dispatched to <span className="text-gold-400 font-mono font-medium">{registeredUser?.email}</span>. We look forward to fellowshiping with you!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}