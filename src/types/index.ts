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

export type ContactTag = 'all' | 'personal' | 'family' | 'work' | 'emergency';
export type SortOption = 'recent' | 'name' | 'added';
export type EmailTab = 'inbox' | 'sent' | 'starred';
