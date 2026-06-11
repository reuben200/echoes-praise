import { useState, useEffect, FormEvent } from 'react';
import { 
  subscribeToRegistrations, 
  deleteRegistration, 
  subscribeToInquiries,
  deleteInquiry,
  updateAttendance,
  auth, 
  isFirebaseConfigured 
} from '../firebase';
import { serverTimestamp } from 'firebase/firestore';
import { AttendeeRegistration, Inquiry, QUICK_TEMPLATES, EVENT_DETAILS } from '../types';
import { 
  signOut, 
  onAuthStateChanged,
  User,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { 
  Users, 
  Printer, 
  Mail, 
  Phone, 
  Trash2, 
  Search, 
  Filter, 
  LogIn, 
  LogOut, 
  FileSpreadsheet,
  Copy,
  Check,
  MessageSquare,
  ChevronRight,
  Send,
  AlertCircle,
  ClipboardCheck,
  UserCheck,
  UserX,
  ChevronUp,
  ChevronDown,
  Music,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ─── Attendance State Map (per-session, not persisted to Firebase) ────────────
type AttendanceMap = Record<string, boolean>;

export default function AdminPanel() {
  const darkMode = true;
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [registrations, setRegistrations] = useState<AttendeeRegistration[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [inquirySearchTerm, setInquirySearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'in-person' | 'online'>('all');
  const [filterMember, setFilterMember] = useState<'all' | 'member' | 'guest'>('all');
  const [filterSongPart, setFilterSongPart] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'attendees' | 'attendance' | 'broadcast' | 'inquiries'>('attendees');
  const [copiedType, setCopiedType] = useState<'emails' | 'phones' | 'template' | null>(null);
  
  // Sorting states
  const [sortField, setSortField] = useState<'full_name' | 'attendance_mode' | 'congregation' | 'createdAt'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Mail merge states
  const [selectedAttendeeNo, setSelectedAttendeeNo] = useState<number>(0);
  const [activeTemplateId, setActiveTemplateId] = useState('welcome');
  const [customTemplateBody, setCustomTemplateBody] = useState('');

  // Attendance tracking states
  const [attendance, setAttendance] = useState<AttendanceMap>({});
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'present' | 'absent'>('all');

  // Email & Password login states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Firestore Troubleshooting & Security Rules state
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [showRulesExplanation, setShowRulesExplanation] = useState(false);
  const [copiedRules, setCopiedRules] = useState(false);

  const toggleSort = (field: 'full_name' | 'attendance_mode' | 'congregation' | 'createdAt') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const isAuthorizedAdmin = !isFirebaseConfigured || !!adminUser;

  useEffect(() => {
    let unsubscribeAuth = () => {};
    if (isFirebaseConfigured && auth) {
      unsubscribeAuth = onAuthStateChanged(auth, (user) => {
        setAdminUser(user);
      });
    }
    return () => { unsubscribeAuth(); };
  }, []);

  useEffect(() => {
    if (!isAuthorizedAdmin) {
      setRegistrations([]);
      setInquiries([]);
      return;
    }

    const unsubscribeRegs = subscribeToRegistrations((data) => {
      setRegistrations(data);
    }, (error) => { console.error('Subscription error:', error); });

    const unsubscribeInquiries = subscribeToInquiries((data) => {
      setInquiries(data);
    }, (error) => { console.error('Inquiries subscription error:', error); });

    return () => {
      unsubscribeRegs();
      unsubscribeInquiries();
    };
  }, [isAuthorizedAdmin]);

  // Sync real-time registrations presence into the attendance state map
  useEffect(() => {
    const map: AttendanceMap = {};
    registrations.forEach(r => {
      map[r.id] = !!r.present;
    });
    setAttendance(map);
  }, [registrations]);

  useEffect(() => {
    const activeTpl = QUICK_TEMPLATES.find(t => t.id === activeTemplateId);
    if (activeTpl) setCustomTemplateBody(activeTpl.body);
  }, [activeTemplateId]);

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setLoginError('Please enter both email and password.');
      return;
    }
    setLoginError(null);
    setIsLoggingIn(true);
    if (isFirebaseConfigured && auth) {
      try {
        await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
        setLoginEmail('');
        setLoginPassword('');
      } catch (err: any) {
        // Use console.warn instead of console.error to prevent standard authentication failures from being flagged as application crashes
        console.warn('Firebase email auth prompt:', err?.code, err?.message);
        const errorCode = err?.code;
        if (errorCode === 'auth/wrong-password' || errorCode === 'auth/user-not-found' || errorCode === 'auth/invalid-credential') {
          setLoginError('Invalid email or password. Please verify your credentials.');
        } else if (errorCode === 'auth/invalid-email') {
          setLoginError('Please enter a valid email address.');
        } else if (errorCode === 'auth/operation-not-allowed') {
          setLoginError('Email/password sign-in is not enabled. Go to your Firebase Console under "Authentication" -> "Sign-in method" and enable "Email/Password".');
        } else {
          setLoginError(err?.message || 'Authentication failed. Please try again.');
        }
      } finally {
        setIsLoggingIn(false);
      }
    }
  };

  const handleLogout = async () => {
    if (isFirebaseConfigured && auth) await signOut(auth);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Remove registration for ${name}?`)) {
      try { await deleteRegistration(id); }
      catch { alert('Could not delete registration. Verify admin permissions.'); }
    }
  };

 
const handleToggleAttendance = async (id: string, currentPresent: boolean) => {
  const nextState = !currentPresent;

  // 1. Force the UI checkmark to change instantly on screen
  setAttendance(prev => ({ ...prev, [id]: nextState }));

  try {
    // 2. Pass the clean boolean directly to your actual firebase utility function
    await updateAttendance(id, nextState);
    
    // 3. Manually update your local data array so the real-time listener doesn't fight the UI
    setRegistrations(prev => 
      prev.map(reg => reg.id === id ? { ...reg, present: nextState } : reg)
    );
    
    setPermissionError(null);
  } catch (err: any) {
    console.error('Failed to update attendance status:', err);
    
    // Roll back visually if the network drops or an error occurs
    setAttendance(prev => ({ ...prev, [id]: currentPresent }));
    setRegistrations(prev => 
      prev.map(reg => reg.id === id ? { ...reg, present: currentPresent } : reg)
    );
  }
};

  // ─── Filtering & Sorting Logic ────────────────────────────────────────────
  const filteredRegs = registrations.filter(r => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = !q ||
      (r.full_name || '').toLowerCase().includes(q) ||
      (r.email || '').toLowerCase().includes(q) ||
      String(r.mobile || '').includes(q) ||
      (r.congregation || '').toLowerCase().includes(q) ||
      (r.notes || '').toLowerCase().includes(q);
    const matchesMode = filterType === 'all' || (r.attendance_mode || []).some(m => m.toLowerCase() === filterType);
    const matchesMember = filterMember === 'all' || (filterMember === 'member' ? r.member === true : r.member === false);
    const matchesSongPart = filterSongPart === 'all' || (r.song_part || []).map(p => p.toLowerCase()).includes(filterSongPart);
    return matchesSearch && matchesMode && matchesMember && matchesSongPart;
  });

  const sortedRegs = [...filteredRegs].sort((a, b) => {
    let fa: any = '', fb: any = '';
    if (sortField === 'full_name') { fa = (a.full_name || '').toLowerCase(); fb = (b.full_name || '').toLowerCase(); }
    else if (sortField === 'attendance_mode') { fa = (a.attendance_mode || []).join(', ').toLowerCase(); fb = (b.attendance_mode || []).join(', ').toLowerCase(); }
    else if (sortField === 'congregation') { fa = (a.congregation || '').toLowerCase(); fb = (b.congregation || '').toLowerCase(); }
    else if (sortField === 'createdAt') { fa = a.createdAt; fb = b.createdAt; }
    if (fa < fb) return sortDirection === 'asc' ? -1 : 1;
    if (fa > fb) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // ─── Derived Mail Merge Active Target Recipient ───────────────────────────
  const activeAttendee = sortedRegs[selectedAttendeeNo] || null;

  // ─── CSV Export (full fields) ─────────────────────────────────────────────
  const handleExportCSV = (rows: AttendeeRegistration[] = sortedRegs) => {
    if (rows.length === 0) return;
    let csv = "data:text/csv;charset=utf-8,";
    csv += "ID,Full Name,Email,Mobile,Member,Congregation,Attendance Mode,Song Part,Notes,Registered At\r\n";
    rows.forEach(r => {
      csv += [
        r.id,
        `"${(r.full_name || '').replace(/"/g, '""')}"`,
        `"${(r.email || '').replace(/"/g, '""')}"`,
        `"${String(r.mobile || '')}"`,
        r.member ? 'Yes' : 'No',
        `"${(r.congregation || '').replace(/"/g, '""')}"`,
        `"${(r.attendance_mode || []).join(', ')}"`,
        `"${(r.song_part || []).join(', ')}"`,
        `"${(r.notes || '').replace(/"/g, '""')}"`,
        new Date(r.createdAt || r.registered_at || new Date().toISOString()).toLocaleString()
      ].join(",") + "\r\n";
    });
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `attendees_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ─── Attendance CSV Export ────────────────────────────────────────────────
  const handleExportAttendanceCSV = (filterStatus?: 'present' | 'absent') => {
    let csv = "data:text/csv;charset=utf-8,";
    csv += "Full Name,Email,Mobile,Congregation,Attendance Mode,Song Part,Status\r\n";
    registrations
      .filter(r => {
        if (!filterStatus) return true;
        const isPresent = !!attendance[r.id];
        return filterStatus === 'present' ? isPresent : !isPresent;
      })
      .forEach(r => {
        csv += [
          `"${(r.full_name || '').replace(/"/g, '""')}"`,
          `"${(r.email || '').replace(/"/g, '""')}"`,
          `"${String(r.mobile || '')}"`,
          `"${(r.congregation || '').replace(/"/g, '""')}"`,
          `"${(r.attendance_mode || []).join(', ')}"`,
          `"${(r.song_part || []).join(', ')}"`,
          attendance[r.id] ? 'Present' : 'Absent'
        ].join(",") + "\r\n";
      });
    const label = filterStatus ? `_${filterStatus}` : '_all';
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `attendance${label}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => window.print();

  // ─── Attendance filtered list ─────────────────────────────────────────────
  const attendanceList = registrations.filter(r => {
    const q = attendanceSearch.toLowerCase();
    const matchesSearch = !q || (r.full_name || '').toLowerCase().includes(q) || (r.congregation || '').toLowerCase().includes(q);
    const isPresent = !!attendance[r.id];
    const matchesStatus = attendanceFilter === 'all' || (attendanceFilter === 'present' ? isPresent : !isPresent);
    return matchesSearch && matchesStatus;
  });

  const presentCount = Object.values(attendance).filter(Boolean).length;
  const absentCount = registrations.length - presentCount;

  // ─── Bulk copy helpers ────────────────────────────────────────────────────
  const copyAllEmails = () => {
    navigator.clipboard.writeText(sortedRegs.map(r => r.email).join(', '));
    setCopiedType('emails');
    setTimeout(() => setCopiedType(null), 2000);
  };
  const copyAllPhones = () => {
    navigator.clipboard.writeText(sortedRegs.map(r => String(r.mobile)).join(', '));
    setCopiedType('phones');
    setTimeout(() => setCopiedType(null), 2000);
  };

  // ─── Mail merge ───────────────────────────────────────────────────────────
  const generateMergedBody = (): string => {
    if (!activeAttendee) return customTemplateBody;
    return customTemplateBody
      .replace(/{name}/g, activeAttendee.full_name)
      .replace(/{attendanceType}/g, activeAttendee.attendance_mode?.join(' & ') || 'Attendee');
  };

  const shareMergedMessage = (channel: 'email' | 'whatsapp') => {
    if (!activeAttendee) return;
    
    const textMessage = generateMergedBody();
    
    if (channel === 'email') {
      const mailtoUrl = `mailto:${activeAttendee.email}?subject=${encodeURIComponent("Event Update")}&body=${encodeURIComponent(textMessage)}`;
      window.open(mailtoUrl, '_blank');
    } else {
      const cleanPhone = String(activeAttendee.mobile).replace(/[^0-9]/g, '');
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(textMessage)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const copyMergedText = () => {
    navigator.clipboard.writeText(generateMergedBody());
    alert('Personalized text copied to clipboard!');
  };

  // ─── Stats ────────────────────────────────────────────────────────────────
  const totalInPerson = registrations.filter(r => (r.attendance_mode || []).includes('In-Person')).length;
  const totalOnline = registrations.filter(r => (r.attendance_mode || []).includes('Online')).length;
  const totalMembers = registrations.filter(r => r.member).length;
  const totalGuests = registrations.filter(r => r.member === false).length;

  // ─── Sort icon helper ─────────────────────────────────────────────────────
  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 opacity-30" />;
    return sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-violet-400" /> : <ChevronDown className="w-3 h-3 text-violet-400" />;
  };

  // ─── Badge helpers ────────────────────────────────────────────────────────
  const modeBadge = (mode: string) => {
    const isOnline = mode.toLowerCase() === 'online';
    return (
      <span key={mode} className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${
        isOnline 
          ? darkMode ? 'bg-sky-950/60 border border-sky-800/60 text-sky-300' : 'bg-sky-50 border border-sky-200 text-sky-700'
          : darkMode ? 'bg-emerald-950/60 border border-emerald-800/60 text-emerald-300' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
      }`}>
        {mode}
      </span>
    );
  };

  const songBadge = (part: string) => {
    const darkColors: Record<string, string> = {
      treble: 'bg-pink-950/50 border-pink-800/50 text-pink-300',
      alto: 'bg-purple-950/50 border-purple-800/50 text-purple-300',
      tenor: 'bg-blue-950/50 border-blue-800/50 text-blue-300',
      baritone: 'bg-amber-950/50 border-amber-800/50 text-amber-300',
      bass: 'bg-red-950/50 border-red-800/50 text-red-300',
      free: 'bg-neutral-800/60 border-neutral-700/60 text-neutral-400',
    };
    const lightColors: Record<string, string> = {
      treble: 'bg-pink-50 border-pink-200 text-pink-700',
      alto: 'bg-purple-50 border-purple-200 text-purple-700',
      tenor: 'bg-blue-50 border-blue-200 text-blue-700',
      baritone: 'bg-amber-50 border-amber-200 text-amber-700',
      bass: 'bg-red-50 border-red-200 text-red-700',
      free: 'bg-neutral-100 border-neutral-300 text-neutral-600',
    };
    const colors = darkMode ? darkColors : lightColors;
    return (
      <span key={part} className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border capitalize ${colors[part.toLowerCase()] || colors.free}`}>
        <Music className="w-2.5 h-2.5" />{part}
      </span>
    );
  };

  const SONG_PARTS = ['treble', 'alto', 'tenor', 'baritone', 'bass', 'free'];

  return (
    <div className={`min-h-screen p-6 font-sans transition-colors duration-200 ${
      darkMode ? 'bg-neutral-950 text-white' : 'bg-neutral-50 text-neutral-900'
    }`}>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b no-print ${
          darkMode ? 'border-neutral-800' : 'border-neutral-200'
        }`}>
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2.5 tracking-tight">
              <span className={`p-1.5 rounded-lg ${darkMode ? 'bg-violet-500/15' : 'bg-violet-100'}`}>
                <Users className="w-4.5 h-4.5 text-violet-500" />
              </span>
              Admin Dashboard
            </h2>
            {!isFirebaseConfigured && (
              <p className={`text-xs mt-1 ml-0.5 ${darkMode ? 'text-neutral-500' : 'text-neutral-400'}`}>
                Sandbox mode — local client only.
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {isFirebaseConfigured ? (
              adminUser ? (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs font-medium leading-tight">{adminUser.displayName || 'Administrator'}</p>
                    <p className={`text-[10px] font-mono ${darkMode ? 'text-neutral-500' : 'text-neutral-400'}`}>{adminUser.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className={`flex items-center gap-1.5 border text-xs font-medium px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      darkMode 
                        ? 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-300' 
                        : 'bg-white border-neutral-200 hover:bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign out
                  </button>
                </div>
              ) : null
            ) : (
              <span className={`text-[10px] border font-mono font-medium px-3 py-1.5 rounded-lg ${
                darkMode ? 'bg-violet-950/50 border-violet-900/40 text-violet-300' : 'bg-violet-50 border-violet-200 text-violet-700'
              }`}>
                Demo mode — bypassed auth
              </span>
            )}
          </div>
        </div>

        {/* ── Auth gate ────────────────────────────────────────────────────────── */}
        {isFirebaseConfigured && !adminUser && (
          <div className={`no-print border rounded-2xl p-6 shadow-2xl max-w-sm mx-auto my-12 space-y-6 ${
            darkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200'
          }`}>
            <div className="flex flex-col items-center text-center space-y-2">
              <div className={`p-3.5 border rounded-xl ${darkMode ? 'bg-violet-600/10 border-violet-500/25 text-violet-400' : 'bg-violet-50 border-violet-200 text-violet-600'}`}>
                <LogIn className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold tracking-tight mt-1">
                Admin Portal Locked
              </h3>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-4">
              {loginError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl flex items-start gap-2 text-xs text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="space-y-1.5 text-left">
                <label className={`text-[10px] font-bold uppercase tracking-wider block ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="admin@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className={`w-full border focus:border-violet-500 placeholder-neutral-500 px-3 py-2.5 rounded-xl text-xs outline-none transition ${
                    darkMode ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
                  }`}
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className={`text-[10px] font-bold uppercase tracking-wider block ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className={`w-full border focus:border-violet-500 placeholder-neutral-500 px-3 py-2.5 rounded-xl text-xs outline-none transition ${
                    darkMode ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoggingIn ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5" />
                    Sign In
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ── Main content ─────────────────────────────────────────────────────── */}
        {isAuthorizedAdmin && (
          <div className="space-y-6">

            {/* ── Stats banner ──────────────────────────────────────────────────── */}
            <div className="no-print grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { label: 'Total RSVPs', value: registrations.length, color: darkMode ? 'text-violet-300' : 'text-violet-700', dot: 'bg-violet-500' },
                { label: 'In-person', value: totalInPerson, color: darkMode ? 'text-emerald-300' : 'text-emerald-700', dot: 'bg-emerald-500' },
                { label: 'Online', value: totalOnline, color: darkMode ? 'text-sky-300' : 'text-sky-700', dot: 'bg-sky-500' },
                { label: 'Members', value: totalMembers, color: darkMode ? 'text-amber-300' : 'text-amber-700', dot: 'bg-amber-500' },
                { label: 'Guests', value: totalGuests, color: darkMode ? 'text-pink-300' : 'text-pink-700', dot: 'bg-pink-500' },
              ].map(({ label, value, color, dot }) => (
                <div key={label} className={`border rounded-2xl px-4 py-3.5 ${
                  darkMode ? 'bg-neutral-950 border-neutral-800/70' : 'bg-white border-neutral-200 shadow-sm'
                }`}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                    <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase">{label}</span>
                  </div>
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={value}
                      initial={{ y: 12, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -12, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className={`text-2xl font-semibold block tracking-tight ${color}`}
                    >
                      {value}
                    </motion.span>
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* ── Tabs ──────────────────────────────────────────────────────────── */}
            <div className={`flex gap-1 no-print border-b ${darkMode ? 'border-neutral-800' : 'border-neutral-200'}`}>
              {([
                { id: 'attendees', label: 'Registrants', icon: Users, count: registrations.length },
                { id: 'attendance', label: 'Attendance', icon: ClipboardCheck, count: null },
                { id: 'broadcast', label: 'Broadcast', icon: Send, count: null },
                { id: 'inquiries', label: 'Inquiries', icon: MessageSquare, count: inquiries.length },
              ] as const).map(({ id, label, icon: Icon, count }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-medium tracking-wide border-b-2 transition cursor-pointer ${
                    activeTab === id
                      ? 'border-violet-500 text-violet-500 font-semibold'
                      : 'border-transparent text-neutral-400 hover:text-neutral-600'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                  {count !== null && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                      activeTab === id 
                        ? darkMode ? 'bg-violet-500/20 text-violet-300' : 'bg-violet-50 text-violet-700' 
                        : darkMode ? 'bg-neutral-800 text-neutral-500' : 'bg-neutral-200 text-neutral-500'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ════════════════════════════════════════════════════════════════════
                TAB 1: REGISTRANTS
            ════════════════════════════════════════════════════════════════════ */}
            {activeTab === 'attendees' && (
              <div className="space-y-4">

                {/* Operations bar */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 no-print">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search name, email, phone, congregation, notes…"
                      className={`w-full border pl-9 pr-4 py-2 rounded-xl text-xs outline-none focus:border-violet-500 transition placeholder-neutral-400 ${
                        darkMode ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
                      }`}
                    />
                  </div>

                  {/* Filters row */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Mode filter */}
                    <div className="relative">
                      <Filter className="absolute left-2.5 top-2.5 w-3 h-3 text-neutral-400 pointer-events-none" />
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as any)}
                        className={`border text-xs rounded-lg pl-7 pr-7 py-2 appearance-none outline-none focus:border-violet-500 cursor-pointer ${
                          darkMode ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
                        }`}
                      >
                        <option value="all">All modes</option>
                        <option value="in-person">In-Person</option>
                        <option value="online">Online</option>
                      </select>
                    </div>

                    {/* Member filter */}
                    <select
                      value={filterMember}
                      onChange={(e) => setFilterMember(e.target.value as any)}
                      className={`border text-xs rounded-lg px-3 py-2 appearance-none outline-none focus:border-violet-500 cursor-pointer ${
                        darkMode ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
                      }`}
                    >
                      <option value="all">Members & guests</option>
                      <option value="member">Members only</option>
                      <option value="guest">Guests only</option>
                    </select>

                    {/* Song part filter */}
                    <select
                      value={filterSongPart}
                      onChange={(e) => setFilterSongPart(e.target.value)}
                      className={`border text-xs rounded-lg px-3 py-2 appearance-none outline-none focus:border-violet-500 cursor-pointer ${
                        darkMode ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
                      }`}
                    >
                      <option value="all">All parts</option>
                      {SONG_PARTS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                    </select>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={copyAllEmails}
                      className={`flex items-center gap-1.5 border hover:opacity-90 text-xs font-medium px-3 py-2 rounded-lg transition cursor-pointer ${
                        darkMode ? 'bg-neutral-900 border-neutral-800 text-neutral-300' : 'bg-white border-neutral-200 text-neutral-700 shadow-sm'
                      }`}
                    >
                      {copiedType === 'emails' ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy emails</>}
                    </button>
                    <button
                      onClick={copyAllPhones}
                      className={`flex items-center gap-1.5 border hover:opacity-90 text-xs font-medium px-3 py-2 rounded-lg transition cursor-pointer ${
                        darkMode ? 'bg-neutral-900 border-neutral-800 text-neutral-300' : 'bg-white border-neutral-200 text-neutral-700 shadow-sm'
                      }`}
                    >
                      {copiedType === 'phones' ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy phones</>}
                    </button>
                    <button
                      onClick={() => handleExportCSV()}
                      disabled={sortedRegs.length === 0}
                      className={`flex items-center gap-1.5 border hover:opacity-90 disabled:opacity-40 text-xs font-medium px-3 py-2 rounded-lg transition cursor-pointer ${
                        darkMode ? 'bg-neutral-900 border-neutral-800 text-neutral-300' : 'bg-white border-neutral-200 text-neutral-700 shadow-sm'
                      }`}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
                    </button>
                    <button
                      onClick={handlePrintPDF}
                      disabled={sortedRegs.length === 0}
                      className={`flex items-center gap-1.5 border hover:opacity-90 disabled:opacity-40 text-xs font-medium px-3 py-2 rounded-lg transition cursor-pointer ${
                        darkMode ? 'bg-neutral-900 border-neutral-800 text-neutral-300' : 'bg-white border-neutral-200 text-neutral-700 shadow-sm'
                      }`}
                    >
                      <Printer className="w-3.5 h-3.5" /> Print
                    </button>
                  </div>
                </div>

                {/* Results count */}
                {searchTerm && (
                  <p className="text-xs text-neutral-400 no-print">
                    Showing {sortedRegs.length} of {registrations.length} registrants
                  </p>
                )}

                {/* Table */}
                <div className={`border rounded-2xl overflow-hidden no-print shadow-sm ${
                  darkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200'
                }`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className={`border-b text-[10px] font-mono tracking-widest uppercase select-none ${
                          darkMode ? 'border-neutral-800/80 bg-neutral-900/40 text-neutral-400' : 'border-neutral-200 bg-neutral-50 text-neutral-500'
                        }`}>
                          <th className="py-3 px-4 font-medium cursor-pointer hover:text-violet-500 transition" onClick={() => toggleSort('full_name')}>
                            <div className="flex items-center gap-1">Attendee <SortIcon field="full_name" /></div>
                          </th>
                          <th className="py-3 px-4 font-medium">Contact</th>
                          <th className="py-3 px-4 font-medium cursor-pointer hover:text-violet-500 transition" onClick={() => toggleSort('congregation')}>
                            <div className="flex items-center gap-1">Congregation <SortIcon field="congregation" /></div>
                          </th>
                          <th className="py-3 px-4 font-medium cursor-pointer hover:text-violet-500 transition" onClick={() => toggleSort('attendance_mode')}>
                            <div className="flex items-center gap-1">Mode & Part <SortIcon field="attendance_mode" /></div>
                          </th>
                          <th className="py-3 px-4 font-medium">Notes</th>
                          <th className="py-3 px-4 font-medium text-right cursor-pointer hover:text-violet-500 transition" onClick={() => toggleSort('createdAt')}>
                            <div className="flex items-center justify-end gap-1">Registered <SortIcon field="createdAt" /></div>
                          </th>
                          <th className="py-3 px-4 font-medium text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y text-xs ${darkMode ? 'divide-neutral-800/50' : 'divide-neutral-200'}`}>
                        {sortedRegs.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-16 text-center text-neutral-400">
                              <Users className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                              <p>No registrants match your search.</p>
                            </td>
                          </tr>
                        ) : (
                          sortedRegs.map((reg) => (
                            <tr key={reg.id} className={`transition group ${darkMode ? 'hover:bg-neutral-900/30' : 'hover:bg-neutral-50'}`}>
                              {/* Name + ID */}
                              <td className="py-3 px-4">
                                <p className={`font-semibold leading-tight ${darkMode ? 'text-white' : 'text-neutral-900'}`}>{reg.full_name}</p>
                                <p className={`text-[9px] font-mono mt-0.5 truncate max-w-[120px] ${darkMode ? 'text-neutral-500' : 'text-neutral-400'}`}>{reg.id}</p>
                                <span className={`inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                                  reg.member
                                    ? darkMode ? 'bg-amber-950/50 border border-amber-800/50 text-amber-400' : 'bg-amber-50 border border-amber-200 text-amber-700'
                                    : darkMode ? 'bg-neutral-800/60 border border-neutral-700/60 text-neutral-400' : 'bg-neutral-100 border border-neutral-200 text-neutral-600'
                                }`}>
                                  {reg.member ? 'Member' : 'Guest'}
                                </span>
                              </td>

                              {/* Contact */}
                              <td className="py-3 px-4 space-y-1">
                                <p className="flex items-center gap-1.5 font-mono text-[11px] text-neutral-600 dark:text-neutral-300">
                                  <Mail className="w-3 h-3 text-violet-500 shrink-0" />
                                  <span className="truncate max-w-[160px]">{reg.email}</span>
                                </p>
                                <p className="flex items-center gap-1.5 font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
                                  <Phone className="w-3 h-3 text-emerald-500 shrink-0" />{reg.mobile}
                                </p>
                              </td>

                              {/* Congregation */}
                              <td className="py-3 px-4">
                                {reg.congregation ? (
                                  <p className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-300">
                                    <Building2 className="w-3 h-3 text-neutral-400 shrink-0" />
                                    {reg.congregation}
                                  </p>
                                ) : (
                                  <span className="text-neutral-400 text-[10px] italic">—</span>
                                )}
                              </td>

                              {/* Mode & Part */}
                              <td className="py-3 px-4">
                                <div className="flex flex-col gap-1.5">
                                  <div className="flex flex-wrap gap-1">
                                    {(reg.attendance_mode || []).map(mode => modeBadge(mode))}
                                  </div>
                                  {(reg.song_part || []).length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {reg.song_part!.map(p => songBadge(p))}
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* Notes */}
                              <td className="py-3 px-4 max-w-[180px]">
                                {reg.notes ? (
                                  <p className="italic text-[11px] leading-relaxed line-clamp-2 text-neutral-500 dark:text-neutral-400" title={reg.notes}>
                                    "{reg.notes}"
                                  </p>
                                ) : (
                                  <span className="text-neutral-400 text-[10px]">—</span>
                                )}
                              </td>

                              {/* Date */}
                              <td className="py-3 px-4 text-right font-mono text-neutral-400 text-[10px] whitespace-nowrap">
                                {new Date(reg.createdAt || reg.registered_at || new Date().toISOString()).toLocaleDateString()}<br />
                                {new Date(reg.createdAt || reg.registered_at || new Date().toISOString()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>

                              {/* Delete */}
                              <td className="py-3 px-4 text-center">
                                <button
                                  onClick={() => handleDelete(reg.id, reg.full_name)}
                                  className="p-1.5 text-neutral-400 hover:text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg opacity-0 group-hover:opacity-100 cursor-pointer"
                                  title="Remove"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ─── TAB 2: ATTENDANCE ──────────────────────────────────────────── */}
            {activeTab === 'attendance' && (
              <div className="space-y-4">

                {/* Firestore Permission troubleshooting warning */}
                {permissionError && (
                  <div className="p-4 border border-rose-500/20 bg-rose-500/10 rounded-2xl space-y-3 shadow-md border-l-4 border-l-rose-500">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-1">
                        <h4 className="text-sm font-semibold text-rose-300">Firestore Rules Permission Alert</h4>
                        <p className="text-xs text-neutral-300 leading-relaxed">
                          {permissionError}
                        </p>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-rose-500/10 flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => setShowRulesExplanation(!showRulesExplanation)}
                        className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition underline cursor-pointer"
                      >
                        {showRulesExplanation ? 'Hide Setup Guide' : 'Show Setup Guide & Copy Rules'}
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showRulesExplanation ? 'rotate-180' : ''}`} />
                      </button>
                      
                      <button
                        onClick={() => setPermissionError(null)}
                        className="text-xs font-mono text-neutral-400 hover:text-neutral-200 transition px-2 py-0.5 border border-neutral-850 rounded bg-neutral-900 cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>

                    {showRulesExplanation && (
                      <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl space-y-3">
                        <p className="text-xs text-neutral-300 leading-relaxed">
                          To store your attendance permanently, you must update your security rules in your <strong>Firebase Console</strong>:
                        </p>
                        <ol className="text-xs text-neutral-400 list-decimal pl-4 space-y-1">
                          <li>Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">Firebase Console</a> and select your project.</li>
                          <li>Click on <strong>Firestore Database</strong> under Build, and select the <strong>Rules</strong> tab.</li>
                          <li>Replace the rules with the code block below, & click <strong>Publish</strong>.</li>
                        </ol>

                        <div className="relative">
                          <pre className="p-3 bg-neutral-950 rounded-lg text-[10px] font-mono text-neutral-300 overflow-x-auto shadow-inner select-all border border-neutral-850 max-h-60">
                    {`rules_version = '2';
                    service cloud.firestore {
                      match /databases/{database}/documents {
                        match /{document=**} {
                          allow read, write: if false;
                        }
                        function isSignedIn() { return request.auth != null; }
                        function isAdmin() { return isSignedIn() && request.auth.token.email != null; }
                        function isValidId(id) { return id is string && id.size() >= 1 && id.size() <= 128; }

                        function isValidRegistration(data) {
                          return data.keys().hasAll(['full_name', 'email', 'mobile', 'member', 'congregation', 'attendance_mode', 'song_part', 'registered_at']) &&
                            data.full_name is string && data.email is string && data.mobile is string && data.member is bool &&
                            data.congregation is string && data.attendance_mode is list && data.song_part is list && data.registered_at is string;
                        }

                        match /registrations/{registrationId} {
                          allow create: if isValidId(registrationId) && isValidRegistration(request.resource.data);
                          allow get: if isValidId(registrationId);
                          allow list: if isAdmin();
                          allow update: if (isAdmin() && isValidRegistration(request.resource.data)) ||
                                          (!isAdmin() && isValidId(registrationId) && isValidRegistration(request.resource.data));
                          allow delete: if isAdmin();
                        }

                        match /inquiries/{inquiryId} {
                          allow create: if isValidId(inquiryId);
                          allow get, list: if isAdmin();
                          allow update: if false;
                          allow delete: if isAdmin();
                        }
                      }
                    }`}
                          </pre>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if false;\n    }\n    function isSignedIn() { return request.auth != null; }\n    function isAdmin() { return isSignedIn() && request.auth.token.email != null; }\n    function isValidId(id) { return id is string && id.size() >= 1 && id.size() <= 128; }\n\n    function isValidRegistration(data) {\n      return data.keys().hasAll(['full_name', 'email', 'mobile', 'member', 'congregation', 'attendance_mode', 'song_part', 'registered_at']) &&\n        data.full_name is string && data.email is string && data.mobile is string && data.member is bool &&\n        data.congregation is string && data.attendance_mode is list && data.song_part is list && data.registered_at is string;\n    }\n\n    match /registrations/{registrationId} {\n      allow create: if isValidId(registrationId) && isValidRegistration(request.resource.data);\n      allow get: if isValidId(registrationId);\n      allow list: if isAdmin();\n      allow update: if (isAdmin() && isValidRegistration(request.resource.data)) ||\n                       (!isAdmin() && isValidId(registrationId) && isValidRegistration(request.resource.data));\n      allow delete: if isAdmin();\n    }\n\n    match /inquiries/{inquiryId} {\n      allow create: if isValidId(inquiryId);\n      allow get, list: if isAdmin();\n      allow update: if false;\n      allow delete: if isAdmin();\n    }\n  }\n}`);
                              setCopiedRules(true);
                              setTimeout(() => setCopiedRules(false), 2000);
                            }}
                            className="absolute right-2 top-2 p-1.5 rounded bg-neutral-805 hover:bg-neutral-800 text-neutral-300 text-[10px] flex items-center gap-1 transition cursor-pointer border border-neutral-750"
                          >
                            {copiedRules ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            {copiedRules ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Attendance stats */}
                <div className="grid grid-cols-3 gap-3 no-print">
                  {[
                    { label: 'Total expected', value: registrations.length, color: 'text-neutral-500' },
                    { label: 'Present', value: presentCount, color: darkMode ? 'text-emerald-300' : 'text-emerald-700' },
                    { label: 'Absent', value: absentCount, color: darkMode ? 'text-red-400' : 'text-red-600' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className={`border rounded-2xl px-4 py-3.5 ${
                      darkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200'
                    }`}>
                      <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase block mb-1.5">{label}</span>
                      <span className={`text-2xl font-semibold tracking-tight ${color}`}>{value}</span>
                    </div>
                  ))}
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 no-print">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
                    <input
                      type="text"
                      value={attendanceSearch}
                      onChange={(e) => setAttendanceSearch(e.target.value)}
                      placeholder="Search by name or congregation…"
                      className={`w-full border pl-9 pr-4 py-2 rounded-xl text-xs outline-none focus:border-violet-500 transition placeholder-neutral-400 ${
                        darkMode ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
                      }`}
                    />
                  </div>
                  <div className={`flex gap-1 border rounded-xl p-1 ${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                    {(['all', 'present', 'absent'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setAttendanceFilter(f)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition capitalize cursor-pointer ${
                          attendanceFilter === f
                            ? f === 'present' ? 'bg-emerald-500/20 text-emerald-600' 
                            : f === 'absent' ? 'bg-red-500/20 text-red-600' 
                            : 'bg-neutral-500 text-white'
                            : 'text-neutral-400 hover:text-neutral-600'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>

                  {/* Export buttons */}
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleExportAttendanceCSV('present')}
                      className={`flex items-center gap-1.5 border text-xs font-medium px-3 py-2 rounded-lg transition cursor-pointer ${
                        darkMode ? 'bg-emerald-950/50 border-emerald-900/50 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Export Present
                    </button>
                    <button
                      onClick={() => handleExportAttendanceCSV('absent')}
                      className={`flex items-center gap-1.5 border text-xs font-medium px-3 py-2 rounded-lg transition cursor-pointer ${
                        darkMode ? 'bg-red-950/30 border-red-900/30 text-red-400' : 'bg-red-50 border-red-200 text-red-700'
                      }`}
                    >
                      <UserX className="w-3.5 h-3.5" /> Export Absent
                    </button>
                    <button
                      onClick={() => handleExportAttendanceCSV()}
                      className={`flex items-center gap-1.5 border text-xs font-medium px-3 py-2 rounded-lg transition cursor-pointer ${
                        darkMode ? 'bg-neutral-900 border-neutral-800 text-neutral-300' : 'bg-white border-neutral-200 text-neutral-700 shadow-sm'
                      }`}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" /> Full CSV
                    </button>
                  </div>
                </div>

                {/* Tip */}
                <p className="text-[11px] text-neutral-500 no-print flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  Tap the checkbox beside each name on the day of the event to mark them present. This data is session-only and not saved to Firebase.
                </p>

                {/* Attendance table */}
                <div className={`border rounded-2xl overflow-hidden no-print shadow-sm ${
                  darkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200'
                }`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className={`border-b text-[10px] font-mono tracking-widest uppercase ${
                          darkMode ? 'border-neutral-800/80 bg-neutral-900/40 text-neutral-400' : 'border-neutral-200 bg-neutral-50 text-neutral-500'
                        }`}>
                          <th className="py-3 px-4 font-medium w-14 text-center">Present</th>
                          <th className="py-3 px-4 font-medium">Name</th>
                          <th className="py-3 px-4 font-medium">Congregation</th>
                          <th className="py-3 px-4 font-medium">Mode</th>
                          <th className="py-3 px-4 font-medium">Song Part</th>
                          <th className="py-3 px-4 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y text-xs ${darkMode ? 'divide-neutral-800/50' : 'divide-neutral-200'}`}>
                        {attendanceList.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-16 text-center text-neutral-400">
                              <ClipboardCheck className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                              No attendees match your filter.
                            </td>
                          </tr>
                        ) : (
                          attendanceList.map((reg) => {
                            const isPresent = !!attendance[reg.id];
                            return (
                              <tr
                                key={reg.id}
                                onClick={() => handleToggleAttendance(reg.id, isPresent)}
                                className={`transition cursor-pointer ${
                                  isPresent 
                                    ? darkMode ? 'bg-emerald-950/20 hover:bg-emerald-950/30' : 'bg-emerald-50/50 hover:bg-emerald-50' 
                                    : darkMode ? 'hover:bg-neutral-900/30' : 'hover:bg-neutral-50'
                                }`}
                              >
                                {/* Checkbox */}
                                <td className="py-3 px-4 text-center">
                                  <div className={`w-5 h-5 rounded-md border-2 mx-auto flex items-center justify-center transition ${
                                    isPresent 
                                      ? 'bg-emerald-500 border-emerald-500' 
                                      : 'border-neutral-400 hover:border-neutral-600'
                                  }`}>
                                    {isPresent && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <p className={`font-semibold leading-tight ${isPresent ? 'text-emerald-600 dark:text-emerald-200' : darkMode ? 'text-white' : 'text-neutral-900'}`}>{reg.full_name}</p>
                                  <p className="text-[10px] text-neutral-400 font-mono mt-0.5">{reg.email}</p>
                                </td>
                                <td className="py-3 px-4 text-neutral-500">
                                  {reg.congregation || <span className="text-neutral-400">—</span>}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex flex-wrap gap-1">
                                    {(reg.attendance_mode || []).map(m => modeBadge(m))}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex flex-wrap gap-1">
                                    {(reg.song_part || []).map(p => songBadge(p))}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full ${
                                    isPresent
                                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                                      : 'bg-neutral-100 dark:bg-neutral-800/60 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700/60'
                                  }`}>
                                    {isPresent ? <><UserCheck className="w-3 h-3" /> Present</> : <><UserX className="w-3 h-3" /> Absent</>}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ─── TAB 3: MESSAGING ASSISTANT ─────────────────────────────────── */}
            {activeTab === 'broadcast' && (
              <div className="space-y-5 no-print">
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Send className="w-4 h-4 text-violet-500" /> Individual Messaging Assistant
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Select a template, tweak the body text, and launch individual messages using your local Mail or WhatsApp app.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  
                  {/* Left Panel */}
                  <div className="lg:col-span-4 space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono tracking-widest text-neutral-400 uppercase font-semibold mb-2">
                        1. Template Selection
                      </label>
                      <div className="space-y-1.5">
                        {QUICK_TEMPLATES.map((tpl) => (
                          <button
                            key={tpl.id}
                            onClick={() => { setActiveTemplateId(tpl.id); setCustomTemplateBody(tpl.body); }}
                            className={`w-full text-left text-xs p-2.5 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                              activeTemplateId === tpl.id
                                ? darkMode ? 'bg-violet-950/40 border-violet-700/60 text-violet-200' : 'bg-violet-50 border-violet-200 text-violet-700 font-semibold'
                                : darkMode ? 'bg-neutral-900/60 border-neutral-800 text-neutral-400' : 'bg-white border-neutral-200 text-neutral-500 hover:border-neutral-300 shadow-sm'
                            }`}
                          >
                            <span className="font-medium">{tpl.name}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={`border-t pt-4 space-y-2 ${darkMode ? 'border-neutral-800' : 'border-neutral-200'}`}>
                      <label className="block text-[10px] font-mono tracking-widest text-neutral-400 uppercase font-semibold">
                        2. Target Recipient ({sortedRegs.length > 0 ? selectedAttendeeNo + 1 : 0} / {sortedRegs.length})
                      </label>
                      <input
                        type="range" 
                        min={0} 
                        max={Math.max(0, sortedRegs.length - 1)}
                        value={selectedAttendeeNo}
                        onChange={e => setSelectedAttendeeNo(Number(e.target.value))}
                        className="w-full accent-violet-500 cursor-pointer"
                      />
                      {activeAttendee && (
                        <div className={`border rounded-xl p-3 space-y-1 shadow-sm ${
                          darkMode ? 'bg-neutral-900/60 border-neutral-800' : 'bg-white border-neutral-200'
                        }`}>
                          <p className={`font-semibold text-xs ${darkMode ? 'text-white' : 'text-neutral-900'}`}>{activeAttendee.full_name}</p>
                          <p className="text-[11px] font-mono text-neutral-400">{activeAttendee.email}</p>
                          <p className="text-[11px] font-mono text-neutral-500">
                            {String(activeAttendee.mobile)} • {(activeAttendee.attendance_mode || []).join(' & ')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Panel */}
                  <div className="lg:col-span-8 space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono tracking-widest text-neutral-400 uppercase font-semibold mb-2">
                        Base Template Content <span className="normal-case text-neutral-500 font-sans">— dynamic fields fill live</span>
                      </label>
                      <textarea
                        value={customTemplateBody}
                        onChange={e => setCustomTemplateBody(e.target.value)}
                        rows={6}
                        className={`w-full border rounded-xl p-3 text-xs font-mono leading-relaxed outline-none focus:border-violet-500 resize-none transition ${
                          darkMode ? 'bg-neutral-900 border-neutral-800 text-neutral-200' : 'bg-white border-neutral-200 text-neutral-800'
                        }`}
                      />
                    </div>

                    {activeAttendee && (
                      <div className={`border rounded-xl p-3 space-y-1.5 ${
                        darkMode ? 'bg-neutral-900/40 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
                      }`}>
                        <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">Live Dynamic Preview</span>
                        <p className={`text-xs whitespace-pre-wrap leading-relaxed ${darkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>{generateMergedBody()}</p>
                      </div>
                    )}

                    {/* Messaging Triggers */}
                    <div className="flex flex-wrap gap-2 items-center pt-1">
                      <button 
                        onClick={() => shareMergedMessage('email')} 
                        disabled={!activeAttendee}
                        className={`flex items-center gap-1.5 border text-xs font-medium px-3.5 py-2 rounded-lg transition cursor-pointer ${
                          darkMode ? 'bg-sky-950/50 border-sky-900/50 text-sky-300' : 'bg-sky-50 border-sky-200 text-sky-700'
                        }`}
                      >
                        <Mail className="w-3.5 h-3.5" /> Open in Mail
                      </button>
                      <button 
                        onClick={() => shareMergedMessage('whatsapp')} 
                        disabled={!activeAttendee}
                        className={`flex items-center gap-1.5 border text-xs font-medium px-3.5 py-2 rounded-lg transition cursor-pointer ${
                          darkMode ? 'bg-emerald-950/50 border-emerald-900/50 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        }`}
                      >
                        <Phone className="w-3.5 h-3.5" /> Open in WhatsApp
                      </button>
                      <button 
                        onClick={copyMergedText} 
                        disabled={!activeAttendee}
                        className={`flex items-center gap-1.5 border text-xs font-medium px-3.5 py-2 rounded-lg transition cursor-pointer ${
                          darkMode ? 'bg-neutral-900 border-neutral-800 text-neutral-300' : 'bg-white border-neutral-200 text-neutral-700 shadow-sm'
                        }`}
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy Text Only
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* ─── TAB 4: INQUIRIES ───────────────────────────────────────────── */}
            {activeTab === 'inquiries' && (
              <div className="space-y-4">
                <div className="relative no-print">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
                  <input
                    type="text"
                    value={inquirySearchTerm}
                    onChange={(e) => setInquirySearchTerm(e.target.value)}
                    placeholder="Search inquiries by name, email, phone, or message…"
                    className={`w-full border pl-9 pr-4 py-2 rounded-xl text-xs outline-none focus:border-violet-500 transition placeholder-neutral-400 ${
                      darkMode ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
                    }`}
                  />
                </div>

                <div className={`border rounded-2xl overflow-hidden no-print shadow-sm ${
                  darkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200'
                }`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className={`border-b text-[10px] font-mono tracking-widest uppercase ${
                          darkMode ? 'border-neutral-800/80 bg-neutral-900/40 text-neutral-400' : 'border-neutral-200 bg-neutral-50 text-neutral-500'
                        }`}>
                          <th className="py-3 px-4 font-medium">From</th>
                          <th className="py-3 px-4 font-medium">Message</th>
                          <th className="py-3 px-4 font-medium text-right">Received</th>
                          <th className="py-3 px-4 font-medium text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y text-xs ${darkMode ? 'divide-neutral-800/50' : 'divide-neutral-200'}`}>
                        {inquiries.filter(i =>
                          !inquirySearchTerm ||
                          i.fullName.toLowerCase().includes(inquirySearchTerm.toLowerCase()) ||
                          i.email.toLowerCase().includes(inquirySearchTerm.toLowerCase()) ||
                          (i.phone || '').includes(inquirySearchTerm) ||
                          i.message.toLowerCase().includes(inquirySearchTerm.toLowerCase())
                        ).length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-16 text-center text-neutral-400">
                              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                              No helpline inquiries.
                            </td>
                          </tr>
                        ) : (
                          inquiries
                            .filter(i =>
                              !inquirySearchTerm ||
                              i.fullName.toLowerCase().includes(inquirySearchTerm.toLowerCase()) ||
                              i.email.toLowerCase().includes(inquirySearchTerm.toLowerCase()) ||
                              (i.phone || '').includes(inquirySearchTerm) ||
                              i.message.toLowerCase().includes(inquirySearchTerm.toLowerCase())
                            )
                            .map((inq) => (
                              <tr key={inq.id} className={`transition group ${darkMode ? 'hover:bg-neutral-900/30' : 'hover:bg-neutral-50'}`}>
                                <td className="py-3 px-4">
                                  <p className={`font-semibold ${darkMode ? 'text-white' : 'text-neutral-900'}`}>{inq.fullName}</p>
                                  <p className="text-[10px] font-mono text-neutral-400 flex items-center gap-1 mt-0.5">
                                    <Mail className="w-3 h-3 text-violet-500" /> {inq.email}
                                  </p>
                                  <p className="text-[10px] font-mono text-neutral-400 flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-emerald-500" /> {inq.phone || 'N/A'}
                                  </p>
                                </td>
                                <td className="py-3 px-4 max-w-md">
                                  <p className={`whitespace-pre-wrap leading-relaxed border p-2.5 rounded-lg text-[11px] ${
                                    darkMode ? 'text-neutral-300 bg-neutral-900/40 border-neutral-800/60' : 'text-neutral-700 bg-neutral-50 border-neutral-200'
                                  }`}>
                                    {inq.message}
                                  </p>
                                </td>
                                <td className="py-3 px-4 text-right font-mono text-neutral-400 text-[10px] whitespace-nowrap">
                                  {new Date(inq.createdAt || inq.submittedAt || new Date().toISOString()).toLocaleDateString()}<br />
                                  {new Date(inq.createdAt || inq.submittedAt || new Date().toISOString()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <button
                                    onClick={async () => {
                                      if (confirm(`Delete inquiry from ${inq.fullName}?`)) await deleteInquiry(inq.id);
                                    }}
                                    className="p-1.5 text-neutral-400 hover:text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg opacity-0 group-hover:opacity-100 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ── Printable View (Stays structured clean black/white) ─────────────── */}
        <div className="hidden print-only p-10 bg-white text-black space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold font-display uppercase tracking-wider text-neutral-900 border-b border-neutral-300 pb-2">
              ECHOES OF PRAISE — REGISTRATION LIST
            </h1>
            <p className="text-base font-serif font-medium tracking-wide text-neutral-700 italic">
              {EVENT_DETAILS.churchName}
            </p>
            <p className="text-xs font-sans text-neutral-500">
              {EVENT_DETAILS.dateStr} | {EVENT_DETAILS.timeStr}
            </p>
            <p className="text-[10px] font-mono tracking-wider uppercase text-neutral-400">
              {sortedRegs.length} registered attendees printed
            </p>
          </div>
          <table className="w-full text-xs text-left border border-collapse border-neutral-300 font-sans">
            <thead>
              <tr className="bg-neutral-100 uppercase font-mono tracking-wider font-semibold text-[9px] border-b border-neutral-300 text-neutral-800">
                <th className="p-2 border-r border-neutral-300 text-center">No.</th>
                <th className="p-2 border-r border-neutral-300">Full Name</th>
                <th className="p-2 border-r border-neutral-300">Email</th>
                <th className="p-2 border-r border-neutral-300">Mobile</th>
                <th className="p-2 border-r border-neutral-300">Congregation/Church</th>
                <th className="p-2 border-r border-neutral-300 text-center">Mode</th>
                <th className="p-2 border-r border-neutral-300 text-center">Song Part</th>
                <th className="p-2">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-300">
              {sortedRegs.map((reg, i) => (
                <tr key={reg.id} className="border-b border-neutral-300">
                  <td className="p-2 border-r border-neutral-300 text-center font-mono text-[10px]">{i + 1}</td>
                  <td className="p-2 border-r border-neutral-300 font-semibold text-neutral-900">{reg.full_name}</td>
                  <td className="p-2 border-r border-neutral-300 font-mono text-[10px] text-neutral-700">{reg.email}</td>
                  <td className="p-2 border-r border-neutral-300 font-mono text-[10px] text-neutral-700">{reg.mobile}</td>
                  <td className="p-2 border-r border-neutral-300 text-neutral-800">{reg.congregation || '—'}</td>
                  <td className="p-2 border-r border-neutral-300 text-center text-[10px]">
                    {(reg.attendance_mode || []).join(' & ')}
                    {reg.member ? <span className="block text-[8px] font-mono text-amber-700 uppercase mt-0.5">(Member)</span> : <span className="block text-[8px] font-mono text-neutral-500 uppercase mt-0.5">(Guest)</span>}
                  </td>
                  <td className="p-2 border-r border-neutral-300 text-center capitalize text-[10px] font-mono">
                    {(reg.song_part || []).join(', ') || '—'}
                  </td>
                  <td className="p-2 italic text-[11px] text-neutral-600 max-w-[150px] break-words">
                    {reg.notes ? `"${reg.notes}"` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pt-8 flex justify-between text-[10px] font-mono text-neutral-400">
            <span>Printed: {new Date().toLocaleString()}</span>
            <span>Church of Christ, Isolo, Lagos — Publicity & Protocol Portal</span>
          </div>
        </div>

      </div>
    </div>
  );
}