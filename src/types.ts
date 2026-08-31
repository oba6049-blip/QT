export interface ContributorSocialLinks {
  linkedin?: string;
  twitter?: string;
  website?: string;
  github?: string;
}

export interface Contributor {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  profileImage: string;
  avatar?: string;
  title: string;
  contributorType?: 'staff' | 'guest'; // 'staff' (Staff Contributor / Editorial Staff) or 'guest' (Guest Contributor)
  bio: string;
  longBio?: string;
  email?: string;
  showEmail?: boolean;
  socialLinks?: ContributorSocialLinks;
  expertise?: string[];
  status: 'active' | 'inactive';
  joinedAt?: string;
  totalArticles?: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface Article {
  id: string;
  _id?: string;
  title: string;
  slug?: string;
  excerpt: string;
  content?: string;
  category: string;
  author: string;
  authorDesignation?: string;
  authorImage?: string;
  contributorId?: string;
  contributor?: Contributor;
  postedBy?: string; // User/Editor ID who created/posted the entry
  postedByName?: string; // Display name / email of the editor who published
  date: string;
  publishedAt?: string;
  readTime: string;
  image: string;
  featured: boolean;
  trending?: boolean;
  tags?: string[];
  status?: 'published' | 'draft' | 'archived';
  createdAt?: any;
  updatedAt?: any;
}

export interface NewsEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  image: string;
  type?: string;
  registrationLink?: string;
  createdAt?: any;
}

export interface Expert {
  id: string;
  name: string;
  title: string;
  bio: string;
  image: string;
  twitter?: string;
  linkedin?: string;
  website?: string;
  contributionsCount?: number;
  createdAt?: any;
}

export interface SpotlightStory {
  id: string;
  _id?: string;
  founderName: string;
  companyName: string;
  title: string;
  story: string;
  image: string;
  link?: string;
  author?: string;
  authorDesignation?: string;
  authorImage?: string;
  contributorId?: string;
  contributor?: Contributor;
  postedBy?: string; // User ID who submitted/created
  postedByName?: string; // Display name or email of publisher
  publishedAt?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  role: 'reader' | 'contributor' | 'editor';
}

export type UserRole = 'superadmin' | 'editor' | 'author' | 'event_manager' | 'custom';

export type DashboardTab = 
  | 'create' 
  | 'manage' 
  | 'create-contributor'
  | 'manage-contributors'
  | 'create-event' 
  | 'manage-events' 
  | 'create-expert' 
  | 'manage-experts' 
  | 'create-spotlight' 
  | 'manage-spotlight' 
  | 'storage' 
  | 'team';

export interface DashboardTabOption {
  id: DashboardTab;
  label: string;
  category: 'Editorial' | 'Contributors' | 'Events' | 'Experts' | 'Spotlights' | 'System';
  description: string;
}

export interface DashboardUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  allowedTabs: DashboardTab[];
  designation?: string;
  status: 'active' | 'suspended';
  mustChangePassword?: boolean;
  createdAt: string;
  lastLoginAt?: string;
  createdBy?: string;
}

