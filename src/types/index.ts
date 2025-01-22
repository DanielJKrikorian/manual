export interface User {
  id: string;
  email: string;
  role: 'couple' | 'vendor';
  created_at: string;
}

export interface Vendor {
  id: string;
  user_id: string;
  business_name: string;
  category: string;
  description: string;
  location: string;
  price_range: string;
  rating: number;
  images: string[];
  subscription_plan: 'essential' | 'featured' | 'elite' | null;
  subscription_end_date: string | null;
  website_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  tiktok_url?: string;
  youtube_url?: string;
  created_at: string;
}

export interface Couple {
  id: string;
  user_id: string;
  partner1_name: string;
  partner2_name: string;
  wedding_date: string | null;
  budget: number | null;
  location: string;
  created_at: string;
}

export interface Review {
  id: string;
  rating: number;
  content: string;
  created_at: string;
  response?: string | null;
  response_date?: string | null;
  couple?: {
    partner1_name: string;
    partner2_name: string;
  } | null;
}

export interface VendorInquiry {
  vendor: Vendor;
  lastMessage: string;
  lastMessageDate: string;
  status: 'pending' | 'responded' | 'booked';
}