/// <reference types="vite/client" />
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged,
  User,
  Auth
} from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
  doc, 
  getDoc, 
  getDocs, 
  collection, 
  setDoc, 
  addDoc,
  deleteDoc, 
  updateDoc, 
  onSnapshot,
  Timestamp,
  Firestore,
  query,
  orderBy,
  getDocFromServer,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

// Resolve Firebase Configuration: Prefer custom environment variables, fallback to sandbox config
const getEnvOverride = (val: any) => {
  return (typeof val === 'string' && val.trim() !== '') ? val : undefined;
};

const resolvedConfig = {
  apiKey: getEnvOverride(import.meta.env.VITE_FIREBASE_API_KEY) || firebaseConfig?.apiKey,
  authDomain: getEnvOverride(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) || firebaseConfig?.authDomain,
  projectId: getEnvOverride(import.meta.env.VITE_FIREBASE_PROJECT_ID) || firebaseConfig?.projectId,
  storageBucket: getEnvOverride(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) || firebaseConfig?.storageBucket,
  messagingSenderId: getEnvOverride(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID) || firebaseConfig?.messagingSenderId,
  appId: getEnvOverride(import.meta.env.VITE_FIREBASE_APP_ID) || firebaseConfig?.appId,
  firestoreDatabaseId: getEnvOverride(import.meta.env.VITE_FIREBASE_DATABASE_ID) || firebaseConfig?.firestoreDatabaseId
};

// Check if Firebase is using a configured token rather than a placeholder
export const isFirebaseConfigured = 
  resolvedConfig && 
  resolvedConfig.apiKey !== '' && 
  resolvedConfig.apiKey !== 'placeholder';

let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;

if (isFirebaseConfigured) {
  try {
    const app = getApps().length === 0 ? initializeApp(resolvedConfig) : getApp();
    dbInstance = getFirestore(app, resolvedConfig.firestoreDatabaseId);
    authInstance = getAuth(app);
  } catch (error) {
    console.error('Firebase initialization failed: ', error);
  }
}

export const db = dbInstance;
export const auth = authInstance;

async function testConnection() {
  if (isFirebaseConfigured && db) {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
      console.log('Firebase Firestore connection tested successfully.');
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        if (typeof window !== 'undefined' && 
            (window.location.hostname === 'localhost' || 
             window.location.hostname.includes('127.0.0.1') || 
             window.location.hostname.includes('ais-dev-') || 
             window.location.hostname.includes('.run.app'))) {
          console.warn("Please check your Firebase configuration (client offline in sandbox environment).");
        } else {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
  }
}
testConnection();

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentUser = auth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo: currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Security/Rule Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Registration Structure
export interface AttendeeRegistration {
  id: string;
  full_name: string;
  email: string;
  mobile: number;
  member: boolean;
  congregation: string;
  attendance_mode: string[];
  song_part: string[];
  notes?: string;
  createdAt: number; // local unix millis
  updatedAt: number; // local unix millis
  isSynced?: boolean;
}

export interface Inquiry {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  message: string;
  createdAt: number;
}

// High-level abstraction for saving registration directly to Firestore

export async function addRegistration(reg: Omit<AttendeeRegistration, 'id' | 'createdAt' | 'updatedAt'>): Promise<AttendeeRegistration> {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firebase is not properly configured or database instance is offline.");
  }
  
  const collectionPath = 'registrations';
  // Use a sanitized email (lowercase, safe characters) as the Firestore Document ID
  const customDocId = reg.email.trim().toLowerCase().replace(/[^a-zA-Z0-9@._-]/g, '');

  try {
    // 1. Try to fetch this specific document directly using getDoc (Allowed under 'get' rule)
    const docRef = doc(db, collectionPath, customDocId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      throw new Error("An attendee with this email has already been registered.");
    }

    // 2. Write straight to Firestore using setDoc with our explicit ID
    await setDoc(docRef, {
      ...reg,
      full_name: reg.full_name.trim(),
      email: reg.email.trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return {
      ...reg,
      id: customDocId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isSynced: true
    } as AttendeeRegistration;

  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("already been registered")) {
      throw error;
    }
    handleFirestoreError(error, OperationType.CREATE, collectionPath);
    throw error;
  }
}

// Fetch all registrations directly from Firestore
export async function getRegistrations(): Promise<AttendeeRegistration[]> {
  if (!isFirebaseConfigured || !db) {
    return [];
  }
  const path = 'registrations';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const items: AttendeeRegistration[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const createdMs = data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : (typeof data.createdAt === 'number' ? data.createdAt : Date.now());
      const updatedMs = data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : (typeof data.updatedAt === 'number' ? data.updatedAt : Date.now());
      items.push({
        id: docSnap.id,
        full_name: data.full_name || '',
        email: data.email || '',
        mobile: Number(data.mobile || 0),
        member: Boolean(data.member),
        congregation: data.congregation || '',
        attendance_mode: data.attendance_mode || [],
        song_part: data.song_part || [],
        notes: data.notes || '',
        createdAt: createdMs,
        updatedAt: updatedMs,
        isSynced: true,
       
        present: data.present === true,
        checked_in_at: data.checked_in_at || null,
      });
    });
    return items;
  } catch (error: any) {
    console.error('getRegistrations error:', error);
    return [];
  }
}

// Subscription handler for real-time lists (If admin is logged in)
export function subscribeToRegistrations(onUpdate: (items: AttendeeRegistration[]) => void, onError?: (err: Error) => void) {
  if (isFirebaseConfigured && db && auth?.currentUser) {
    const path = 'registrations';
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const items: AttendeeRegistration[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const createdMs = data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : (typeof data.createdAt === 'number' ? data.createdAt : Date.now());
        const updatedMs = data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : (typeof data.updatedAt === 'number' ? data.updatedAt : Date.now());
        items.push({
          id: docSnap.id,
          full_name: data.full_name || '',
          email: data.email || '',
          mobile: Number(data.mobile || 0),
          member: Boolean(data.member),
          congregation: data.congregation || '',
          attendance_mode: data.attendance_mode || [],
          song_part: data.song_part || [],
          notes: data.notes || '',
          createdAt: createdMs,
          updatedAt: updatedMs,
          isSynced: true,
          
          present: data.present === true,
          checked_in_at: data.checked_in_at || null,
        });
      });
      onUpdate(items);
    }, (error) => {
      // Error handling...
    });
  } else {
    onUpdate([]);
    return () => {};
  }
}

// Delete registration directly from Firestore
export async function deleteRegistration(id: string): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Database is not configured.');
  }
  const path = `registrations/${id}`;
  try {
    await deleteDoc(doc(db, 'registrations', id));
  } catch (error) {
    console.error('deleteRegistration error:', error);
    try {
      handleFirestoreError(error, OperationType.DELETE, path);
    } catch {
      throw error;
    }
    throw error;
  }
}

// Save inquiry directly to Firestore
export async function addInquiry(inquiry: Omit<Inquiry, 'id' | 'createdAt'>): Promise<Inquiry> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Database is not configured.');
  }
  const path = 'inquiries';
  const id = 'inq_' + Math.random().toString(36).substring(2, 11);
  try {
    const docRef = doc(db, path, id);
    const payload = {
      fullName: inquiry.fullName,
      email: inquiry.email,
      phone: inquiry.phone || '',
      message: inquiry.message,
      createdAt: serverTimestamp()
    };
    await setDoc(docRef, payload);
    return {
      ...payload,
      id,
      createdAt: Date.now()
    };
  } catch (error: any) {
    console.error('addInquiry error:', error);
    try {
      handleFirestoreError(error, OperationType.WRITE, path);
    } catch {
      throw error;
    }
    throw error;
  }
}

// Fetch all inquiries directly from Firestore
export async function getInquiries(): Promise<Inquiry[]> {
  if (!isFirebaseConfigured || !db) {
    return [];
  }
  const path = 'inquiries';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const items: Inquiry[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const createdMs = data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : (typeof data.createdAt === 'number' ? data.createdAt : Date.now());
      items.push({
        id: docSnap.id,
        fullName: data.fullName || '',
        email: data.email || '',
        phone: data.phone || '',
        message: data.message || '',
        createdAt: createdMs
      });
    });
    return items;
  } catch (error: any) {
    console.error('getInquiries error:', error);
    try {
      handleFirestoreError(error, OperationType.LIST, path);
    } catch {
      throw error;
    }
    return [];
  }
}

// Subscribe to inquiries in real-time
export function subscribeToInquiries(onUpdate: (items: Inquiry[]) => void, onError?: (err: Error) => void) {
  if (isFirebaseConfigured && db && auth?.currentUser) {
    const path = 'inquiries';
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const items: Inquiry[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const createdMs = data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : (typeof data.createdAt === 'number' ? data.createdAt : Date.now());
        items.push({
          id: docSnap.id,
          fullName: data.fullName || '',
          email: data.email || '',
          phone: data.phone || '',
          message: data.message || '',
          createdAt: createdMs
        });
      });
      onUpdate(items);
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (err) {
        if (onError && err instanceof Error) onError(err);
      }
    });
  } else {
    onUpdate([]);
    return () => {};
  }
}

// Delete inquiry directly from Firestore
export async function deleteInquiry(id: string): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Database is not configured.');
  }
  const path = `inquiries/${id}`;
  try {
    await deleteDoc(doc(db, 'inquiries', id));
  } catch (error) {
    console.error('deleteInquiry error:', error);
    try {
      handleFirestoreError(error, OperationType.DELETE, path);
    } catch {
      throw error;
    }
    throw error;
  }
}

// Send EmailJS confirmation email directly via REST API from client Side
export async function sendConfirmationEmail(params: {
  fullName: string;
  email: string;
  phone: string;
  attendanceType: string;
  notes: string;
  ticketId: string;
}) {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  const isConfiguredVal = (val?: string) => {
    if (!val) return false;
    const v = val.toLowerCase().trim();
    return v !== "" && 
           !v.includes("your_") && 
           !v.includes("placeholder") && 
           !v.includes("service_id") && 
           !v.includes("template_id") && 
           !v.includes("public_key") &&
           !v.includes("my_service_id");
  };

  if (isConfiguredVal(serviceId) && isConfiguredVal(templateId) && isConfiguredVal(publicKey)) {
    console.log("Using client-side EmailJS REST API for confirmation email...");
    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          service_id: serviceId,
          template_id: templateId,
          user_id: publicKey,
          template_params: {
            to_name: params.fullName,
            to_email: params.email,
            fullName: params.fullName,
            email: params.email,
            phone: params.phone || 'N/A',
            attendanceType: params.attendanceType,
            notes: params.notes || '',
            ticketId: params.ticketId,
            event_date: "Saturday, 19th Sept, 2026",
            event_time: "10:00 AM Prompt",
            event_venue: "Church Auditorium, 27, Primate Ayodele Crescent, Oke-Afa, Isolo, Lagos"
          }
        })
      });

      if (!response.ok) {
        const text = await response.text();
        console.warn(`EmailJS API returned non-OK code: ${response.status} - ${text}`);
        return { success: false, error: text };
      }
      return { success: true, message: "Confirmation email sent." };
    } catch (e) {
      console.warn("Client-side EmailJS dispatch failed gracefully:", e);
      return { success: false, error: e };
    }
  } else {
    console.info("EmailJS is not configured or contains placeholder keys. Skipping email confirmation dispatch.");
    return { success: false, error: "Not configured" };
  }
}

export async function updateAttendance(id: string, present: boolean): Promise<void> {
  if (isFirebaseConfigured && db) {
    const docRef = doc(db, 'registrations', id);
    await updateDoc(docRef, {
      present: present,
      checked_in_at: present ? new Date().toISOString() : null
    });
  } else {
    const cached = localStorage.getItem('eop_registrations');
    if (cached) {
      const list: AttendeeRegistration[] = JSON.parse(cached);
      const idx = list.findIndex(r => r.id === id);
      if (idx !== -1) {
        list[idx].present = present;
        list[idx].checked_in_at = present ? new Date().toISOString() : undefined;
        localStorage.setItem('eop_registrations', JSON.stringify(list));
        window.dispatchEvent(new Event('storage'));
      }
    }
  }
}
