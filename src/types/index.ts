// src/types/index.ts

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  tag: 'personal' | 'family' | 'work' | 'emergency';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  tasks?: Task[];
}

export interface Task {
  id: string;
  title: string;
  priority: 'high' | 'med' | 'low';
  due?: string;
  dueTime?: string;    // HH:MM 24h — triggers email reminder 15 min before
  done: boolean;
  notified: boolean;   // whether reminder email has been sent
  createdAt: string;
  contactId?: string;
  contact?: Pick<Contact, 'id' | 'name'>;
  userId: string;
}

export interface Email {
  id: string;
  sender: string;
  senderEmail: string;
  subject: string;
  body: string;
  preview?: string;
  tab: 'inbox' | 'sent' | 'starred';
  unread: boolean;
  starred: boolean;
  sentAt?: string;
  createdAt: string;
  userId: string;
}

export interface VaultEntry {
  id: string;
  name: string;
  userId_field?: string;
  password: string;
  registrationNumber?: string;
  link?: string;
  notes?: string;
  createdAt: string;
  userId: string;
}

export interface EducationRecord {
  id: string;
  personName: string;
  level: string;
  institution?: string;
  board?: string;
  year?: string;
  percentage?: string;
  rollNumber?: string;
  notes?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  createdAt: string;
  userId: string;
}

export interface PersonalDocument {
  id: string;
  personName: string;
  docType: string;
  docNumber?: string;
  issuedBy?: string;
  issuedDate?: string;
  expiryDate?: string;
  notes?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  createdAt: string;
  userId: string;
}

export interface DocumentVault {
  id: string;
  name: string;
  tag?: string;
  idType?: string;
  description?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  createdAt: string;
  userId: string;
}

export interface UserSettings {
  theme: 'dark' | 'light' | 'system';
  accentColor: string;
  compactMode: boolean;
  defaultLanding: 'contacts' | 'tasks' | 'email' | 'private';
  defaultView: 'cards' | 'table';
  sessionTimeout: 0 | 5 | 15 | 30 | 60;
  defaultSenderName: string;
  defaultFromEmail: string;
  emailSignature: string;
  bccSelf: boolean;
  quickRecipients: string[];
  defaultContactSort: 'name' | 'recent' | 'added';
  contactSearchFields: ('name' | 'phone' | 'email' | 'tags' | 'notes')[];
  importDuplicateHandling: 'skip' | 'overwrite' | 'merge';
}

export type ContactTag  = 'all' | 'personal' | 'family' | 'work' | 'emergency';
export type SortOption  = 'recent' | 'name' | 'added';
export type EmailTab    = 'inbox' | 'sent' | 'starred';