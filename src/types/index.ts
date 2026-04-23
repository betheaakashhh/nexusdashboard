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
  done: boolean;
  createdAt: string;
  contactId?: string;
  contact?: Contact;
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

// ── Private Vault ────────────────────────────────────────────────────────────
export interface VaultEntry {
  id: string;
  name: string;
  userId_field?: string;
  password?: string;
  registrationNumber?: string;
  link?: string;
  category: 'general' | 'educational' | 'bank' | 'social' | 'work';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

// ── Education Certificates ───────────────────────────────────────────────────
export interface EducationCert {
  id: string;
  ownerName: string;
  examName: string;
  institution?: string;
  year?: string;
  grade?: string;
  rollNumber?: string;
  fileData?: string;
  fileType?: string;
  fileName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

// ── Personal Documents ───────────────────────────────────────────────────────
export type PersonalDocType =
  | 'pan_card'
  | 'aadhar'
  | 'aapar_id'
  | 'passport'
  | 'voter_id'
  | 'driving_license'
  | 'custom';

export interface PersonalDoc {
  id: string;
  ownerName: string;
  docType: PersonalDocType;
  customLabel?: string;
  docNumber?: string;
  fileData?: string;
  fileType?: string;
  fileName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

// ── Document Vault ───────────────────────────────────────────────────────────
export interface DocumentVaultItem {
  id: string;
  name: string;
  tag?: string;
  idType?: string;
  fileData: string;
  fileType: string;
  fileName: string;
  fileSize?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export type ContactTag = 'all' | 'personal' | 'family' | 'work' | 'emergency';
export type SortOption = 'recent' | 'name' | 'added';
export type EmailTab = 'inbox' | 'sent' | 'starred';
export type VaultCategory = 'all' | 'general' | 'educational' | 'bank' | 'social' | 'work';
