// Shared Types and Data Configurations

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
  createdAt: number;
  updatedAt: number;
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

export interface ScriptureConfig {
  reference: string;
  verse: string;
}

export interface EventDetailsConfig {
  title: string;
  theme: string;
  slogan: string;
  churchName: string;
  location: string;
  dateStr: string;
  dateObj: Date;
  timeStr: string;
  venueDetails: string;
  scriptures: ScriptureConfig[];
}

export const EVENT_DETAILS: EventDetailsConfig = {
  title: "ECHOES OF PRAISE",
  theme: "ONE VOICE. ONE FAITH. ONE JOY.",
  slogan: "Praise Unites. Songs Lift. Come Feel It, in the Echoes of Praise",
  churchName: "CHURCH OF CHRIST, ISOLO, LAGOS",
  location: "27, Primate Ayodele Crescent, Oke-Afa, Isolo, Lagos",
  dateStr: "Saturday, 19th September, 2026",
  dateObj: new Date("2026-09-19T10:00:00"),
  timeStr: "10:00 AM Prompt",
  venueDetails: "Church Auditoriun, 27, Primate Ayodele Crescent, Oke-Afa, Isolo, Lagos",
  scriptures: [
    {
      reference: "PSALM 150:6",
      verse: "Let everything that has breath praise the Lord!"
    },
    {
      reference: "PSALM 96:1",
      verse: "Sing to the Lord a new song; sing to the Lord, all the earth."
    }
  ]
};

export const QUICK_TEMPLATES = [
  {
    id: 'welcome',
    name: 'Standard Thank You',
    subject: 'Thank you for registering for Echoes of Praise!',
    body: 'Dear {name},\n\nThank you for choosing to be a part of "Echoes of Praise"! We are thrilled that you will be joining us {attendanceType}.\n\n📅 Date: Saturday, 19th Sept, 2026\n🕙 Time: 10:00 AM Prompt\n📍 Venue: Church of Christ, Isolo (27, Primate Ayodele Crescent, Oke-Afa, Isolo)\n\nWe trust it will be an unforgettable atmosphere of praise, worship, and lift. Please save this date in your calendar. We look forward to praising with you!\n\nIn Christ,\nPublicity & Organizing Team\nChurch of Christ, Isolo, Lagos'
  },
  {
    id: 'reminder',
    name: 'Event Reminder',
    subject: 'Reminder: Echoes of Praise is this Saturday!',
    body: 'Hi {name},\n\nThis is a quick reminder that "Echoes of Praise" is happening this Saturday at 10:00 AM Prompt!\n\nWhether you are joining us in-person or online, get ready for an extraordinary encounter. Let us come together in songs of praise and thanksgiving to our God.\n\nSee you there!\n\nWarm regards,\nChurch of Christ, Isolo'
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Invitation',
    subject: 'WhatsApp Invite Text',
    body: '*ECHOES OF PRAISE 2026* \n\nHello {name}, thank you for registering! \n\n"Let everything that has breath praise the Lord!" (Psalm 150:6)\n\nJoin us this Saturday, *19th September 2026* at *10:00AM Prompt* at Church of Christ, Isolo.\n\nIt is going to be a morning of absolute praise, unity, and joy! See you there! 🙌✨'
  }
];
