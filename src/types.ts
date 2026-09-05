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
  views?: number;
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
  slug?: string;
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
  views?: number;
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
  | 'analytics'
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
  category: 'Analytics' | 'Editorial' | 'Contributors' | 'Events' | 'Experts' | 'Spotlights' | 'System';
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

// ---------------- ANALYTICS INTERFACES ----------------
export interface DailyAnalyticsData {
  id?: string;
  date: string;
  dayName?: string;
  formattedDate?: string;
  totalViews: number;
  uniqueVisitors: number;
  articleViews: number;
  spotlightViews: number;
  otherViews: number;
  topCategory?: string;
  updatedAt?: string;
}

export interface ArticleReadershipItem {
  id: string;
  title: string;
  slug?: string;
  category: string;
  author: string;
  authorDesignation?: string;
  authorImage?: string;
  date?: string;
  publishedAt?: string;
  readTime?: string;
  image?: string;
  featured?: boolean;
  trending?: boolean;
  views: number;
  shareOfCategory: number;
}

export interface SectionAnalytics {
  category: string;
  totalArticles: number;
  totalViews: number;
  averageViewsPerArticle: number;
  sharePercentage: number;
  topArticle?: ArticleReadershipItem;
  articles: ArticleReadershipItem[];
}

export interface SpotlightAnalyticsItem {
  id: string;
  founderName: string;
  companyName: string;
  title: string;
  slug?: string;
  image: string;
  author?: string;
  views: number;
  shareOfSpotlights: number;
  createdAt?: string;
}

export interface PlatformAnalyticsOverview {
  platform: {
    totalViews: number;
    todayViews: number;
    yesterdayViews: number;
    last7DaysViews: number;
    last30DaysViews: number;
    avgDailyViews: number;
    todayUniqueVisitors: number;
    growthRate: number;
    totalArticleReads: number;
    totalSpotlightReads: number;
  };
  dailyHistory: DailyAnalyticsData[];
  sections: SectionAnalytics[];
  spotlights: {
    totalSpotlights: number;
    totalViews: number;
    averageViews: number;
    items: SpotlightAnalyticsItem[];
  };
  topArticles: Array<{
    id: string;
    title: string;
    slug?: string;
    category: string;
    author: string;
    views: number;
    image?: string;
    date?: string;
  }>;
}

