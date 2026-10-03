export interface Reel {
  id: number;
  title: string;
  category: string;
  client: string;
  video_url: string;
  thumbnail_url: string;
  views_count?: string;
  duration?: string;
  aspect_ratio?: string;
  is_featured?: number;
  order_index?: number;
  created_at?: string;
}

export interface HorizontalVideo {
  id: number;
  title: string;
  category: string;
  client: string;
  video_url: string;
  thumbnail_url: string;
  description?: string;
  duration?: string;
  year?: string;
  aspect_ratio?: string;
  is_featured?: number;
  order_index?: number;
  created_at?: string;
}

export interface Testimonial {
  id: number;
  client_name: string;
  client_title?: string;
  company: string;
  avatar_url?: string;
  video_url: string;
  thumbnail_url?: string;
  quote?: string;
  rating?: number;
  order_index?: number;
  created_at?: string;
}

export interface Project {
  id: number;
  title: string;
  client: string;
  category: string;
  thumbnail_url?: string;
  video_url: string;
  brief?: string;
  approach?: string;
  deliverables?: string;
  software_used?: string;
  before_image_url?: string;
  after_image_url?: string;
  metrics?: string;
  order_index?: number;
  created_at?: string;
}

export interface Service {
  id: number;
  title: string;
  slug?: string;
  icon_name?: string;
  short_description: string;
  deliverables?: string;
  turnaround?: string;
  order_index?: number;
  is_active?: number;
}

export interface AboutData {
  id: number;
  headline: string;
  bio: string;
  philosophy: string;
  years_experience: string;
  views_generated: string;
  projects_delivered: string;
  client_satisfaction: string;
  avatar_url: string;
  showreel_url: string;
}

export interface SettingsData {
  site_name?: string;
  hero_headline?: string;
  hero_subtitle?: string;
  availability?: string;
  featured_showreel_url?: string;
  featured_showreel_poster?: string;
  contact_email?: string;
  contact_phone?: string;
  whatsapp_number?: string;
  instagram_url?: string;
  linkedin_url?: string;
  youtube_url?: string;
  twitter_url?: string;
  profile_picture_url?: string;
  heading_font?: string;
  body_font?: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  company?: string;
  project_type?: string;
  budget?: string;
  message: string;
  brief_url?: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  created_at?: string;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
}
