// API Service Layer for SocialPilot AI

const API_BASE = '/api';

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface PlatformPostContent {
  platform: string;
  hook: string;
  caption: string;
  description?: string;
  key_points: string[];
  cta: string;
  hashtags: string[];
  mentions: string[];
  media_recommendation?: string;
  character_count: number;
  is_valid_length: boolean;
  char_limit: number;
}

export interface CompleteContentPackage {
  overview: {
    internal_title: string;
    main_topic: string;
    campaign_objective: string;
    target_audience: string;
    primary_keyword: string;
    secondary_keywords: string[];
    content_category: string;
  };
  title: string;
  hook: string;
  description: string;
  main_caption: string;
  key_points: string[];
  call_to_action: string;
  hashtags: string[];
  keywords: string[];
  tags_and_mentions: {
    search_keywords: string[];
    internal_content_tags: string[];
    hashtags: string[];
    suggested_mentions_to_verify: string[];
  };
  image_prompt: {
    main_subject: string;
    background: string;
    composition: string;
    visual_style: string;
    lighting: string;
    brand_colors: string;
    intended_audience: string;
    aspect_ratio: string;
    text_placement?: string;
    full_prompt: string;
  };
  alternative_hooks: string[];
  alternative_ctas: string[];
  alt_text: string;
  improvements: string[];
  platform_posts: Record<string, PlatformPostContent>;
  generation_source: 'ollama' | 'fallback_demo';
}

export interface PlatformPost {
  id: number;
  post_id: number;
  social_account_id?: number | null;
  platform: string;
  caption: string;
  description?: string;
  hashtags: string[];
  mentions: string[];
  media_ids: number[];
  scheduled_at?: string | null;
  published_at?: string | null;
  platform_post_id?: string | null;
  status: string;
  error_message?: string | null;
  attempt_count: number;
  idempotency_key: string;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: number;
  user_id: number;
  campaign_id?: number | null;
  title: string;
  topic: string;
  website_url?: string;
  target_audience?: string;
  marketing_goal?: string;
  status: string;
  content_json: any;
  created_at: string;
  updated_at: string;
  platform_posts: PlatformPost[];
}

export interface SocialAccount {
  id: number;
  user_id: number;
  platform: string;
  platform_account_id: string;
  account_name: string;
  account_type: string;
  connection_status: string;
  permissions: string[];
  token_expires_at?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface MediaItem {
  id: number;
  user_id: number;
  storage_key: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  width?: number | null;
  height?: number | null;
  duration_seconds?: number | null;
  alt_text: string;
  created_at: string;
  url: string;
}

export interface Campaign {
  id: number;
  user_id: number;
  name: string;
  objective: string;
  target_audience: string;
  start_date?: string | null;
  end_date?: string | null;
  settings_json: any;
  created_at: string;
  updated_at: string;
  posts_count: number;
}

export interface BrandSettings {
  id: number;
  user_id: number;
  company_name: string;
  website: string;
  company_description: string;
  logo_url: string;
  brand_colors: string[];
  industry: string;
  target_audience: string;
  writing_tone: string;
  preferred_language: string;
  default_cta: string;
  default_hashtags: string;
  prohibited_phrases: string;
  brand_guidelines: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_posts: number;
  published_posts: number;
  scheduled_posts: number;
  draft_posts: number;
  failed_posts: number;
  connected_accounts: number;
  app_mode: string;
}

export interface CalendarItem {
  id: number;
  post_id: number;
  title: string;
  platform: string;
  caption: string;
  scheduled_at?: string | null;
  published_at?: string | null;
  status: string;
  account_name?: string | null;
  campaign_name?: string | null;
  media_ids: number[];
}

export interface AnalyticsOverview {
  app_mode: string;
  is_real_data: boolean;
  data_source_notice: string;
  total_published: number;
  total_scheduled: number;
  total_failed: number;
  platform_breakdown: Record<string, number>;
  platforms: {
    platform: string;
    connected: boolean;
    is_real_data: boolean;
    followers_count?: number | null;
    posts_published_count: number;
    total_engagements?: number | null;
    estimated_reach?: number | null;
    disclaimer: string;
  }[];
}

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('socialpilot_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errorDetail = `Error ${res.status}: ${res.statusText}`;
      try {
        const data = await res.json();
        errorDetail = data.detail || JSON.stringify(data);
      } catch {
        // ignore
      }
      throw new Error(errorDetail);
    }

    if (res.status === 204) {
      return null as any;
    }

    return res.json();
  }

  // Auth
  async register(data: { name: string; email: string; password: string }) {
    return this.request<{ access_token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: { email: string; password: string }) {
    return this.request<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMe() {
    return this.request<User>('/auth/me');
  }

  async logout() {
    localStorage.removeItem('socialpilot_token');
    return this.request('/auth/logout', { method: 'POST' }).catch(() => {});
  }

  // AI
  async getAiHealth() {
    return this.request<{
      is_available: boolean;
      base_url: string;
      configured_model: string;
      model_installed: boolean;
      installed_models: string[];
      message: string;
    }>('/ai/health');
  }

  async generatePost(payload: any) {
    return this.request<CompleteContentPackage>('/ai/generate-post', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async regeneratePlatformContent(payload: {
    platform: string;
    topic: string;
    company_name?: string;
    target_audience?: string;
    tone?: string;
    language?: string;
    custom_instruction?: string;
  }) {
    return this.request<PlatformPostContent>('/ai/generate-platform-content', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async generateHashtags(topic: string, industry: string = 'General', count: number = 15) {
    return this.request<{ hashtags: string[] }>('/ai/generate-hashtags', {
      method: 'POST',
      body: JSON.stringify({ topic, industry, count }),
    });
  }

  async improveCaption(caption: string, action: string, target_tone: string = 'Professional') {
    return this.request<{ original: string; improved: string; action: string }>('/ai/improve-caption', {
      method: 'POST',
      body: JSON.stringify({ caption, action, target_tone }),
    });
  }

  async generateImagePrompt(post_title: string, caption: string, visual_style: string, aspect_ratio: string, platform: string) {
    return this.request<{ prompt: string; visual_style: string; aspect_ratio: string; platform: string }>('/ai/generate-image-prompt', {
      method: 'POST',
      body: JSON.stringify({ post_title, caption, visual_style, aspect_ratio, platform }),
    });
  }

  async repurposeContent(source_content: string, source_type: string, target_platforms: string[]) {
    return this.request<CompleteContentPackage>('/ai/repurpose-content', {
      method: 'POST',
      body: JSON.stringify({ source_content, source_type, target_platforms }),
    });
  }

  // Posts
  async listPosts(status?: string, platform?: string, campaign_id?: number) {
    let query = '';
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (platform) params.append('platform', platform);
    if (campaign_id) params.append('campaign_id', campaign_id.toString());
    const qs = params.toString();
    if (qs) query = `?${qs}`;

    return this.request<Post[]>(`/posts${query}`);
  }

  async getPost(id: number) {
    return this.request<Post>(`/posts/${id}`);
  }

  async createPost(payload: any) {
    return this.request<Post>('/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updatePost(id: number, payload: any) {
    return this.request<Post>(`/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deletePost(id: number) {
    return this.request<void>(`/posts/${id}`, { method: 'DELETE' });
  }

  async bulkSchedulePosts(payload: {
    topics: string[];
    items?: {
      topic: string;
      heading?: string;
      details?: string[];
      call_to_action?: string;
    }[];
    start_date: string;
    interval_hours?: number;
    timezone?: string;
    company_name?: string;
    company_description?: string;
    website_url?: string;
    marketing_goal?: string;
    tone?: string;
    platforms?: string[];
    media_id?: number | null;
    generate_ai_images?: boolean;
    call_to_action?: string;
    campaign_id?: number | null;
  }) {
    return this.request<{
      success: boolean;
      total_created: number;
      message: string;
      posts: Post[];
    }>('/posts/bulk-schedule', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Publishing & Scheduling
  async publishNow(postId: number, platformPostIds?: number[]) {
    return this.request<{
      post_id: number;
      overall_status: string;
      platform_results: Record<string, any>;
    }>(`/posts/${postId}/publish`, {
      method: 'POST',
      body: JSON.stringify({ platform_post_ids: platformPostIds || null }),
    });
  }

  async schedulePost(postId: number, scheduledAt: string, timezone: string = 'Asia/Kolkata', platformPostIds?: number[]) {
    return this.request<any>(`/posts/${postId}/schedule`, {
      method: 'POST',
      body: JSON.stringify({
        scheduled_at: scheduledAt,
        timezone_name: timezone,
        platform_post_ids: platformPostIds || null,
      }),
    });
  }

  async retryPlatformPost(platformPostId: number) {
    return this.request<any>(`/platform-posts/${platformPostId}/retry`, { method: 'POST' });
  }

  async cancelPlatformPost(platformPostId: number) {
    return this.request<any>(`/platform-posts/${platformPostId}/cancel`, { method: 'POST' });
  }

  async updatePlatformPost(platformPostId: number, payload: any) {
    return this.request<any>(`/platform-posts/${platformPostId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  // Social Accounts
  async listSocialAccounts() {
    return this.request<SocialAccount[]>('/social/accounts');
  }

  async getConnectUrl(platform: string) {
    return this.request<{
      platform: string;
      connect_url: string;
      app_mode: string;
      is_mock: boolean;
      instructions: string;
    }>(`/social/connect/${platform}`);
  }

  async disconnectSocialAccount(id: number) {
    return this.request<any>(`/social/accounts/${id}/disconnect`, { method: 'POST' });
  }

  async removeSocialAccount(id: number) {
    return this.request<any>(`/social/accounts/${id}`, { method: 'DELETE' });
  }

  async toggleSocialAccount(id: number) {
    return this.request<any>(`/social/accounts/${id}/toggle`, { method: 'POST' });
  }

  async refreshSocialAccount(id: number) {
    return this.request<any>(`/social/accounts/${id}/refresh`, { method: 'POST' });
  }

  // Media
  async listMedia() {
    return this.request<MediaItem[]>('/media');
  }

  async uploadMedia(file: File, altText: string = '') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('alt_text', altText);

    return this.request<MediaItem>('/media/upload', {
      method: 'POST',
      body: formData,
    });
  }

  async getFlyerTemplates() {
    return this.request<{
      templates: {
        id: number;
        name: string;
        category: string;
        description: string;
        theme: string;
        layout: string;
      }[];
      palettes: {
        id: string;
        name: string;
      }[];
      aspect_ratios: {
        id: string;
        name: string;
        dimensions: string;
      }[];
    }>('/media/templates');
  }

  async getMediaAiStatus() {
    return this.request<{
      is_available: boolean;
      provider: string;
      models_supported: string[];
      latency_ms: number | null;
      requires_api_key: boolean;
      has_custom_key: boolean;
      rate_limit_info: string;
      message: string;
    }>('/media/ai-status');
  }

  async generateMarketingFlyer(payload: {
    topic: string;
    details?: string[];
    description?: string;
    cta_text?: string;
    company?: string;
    website?: string;
    phone?: string;
    template_id?: number;
    aspect_ratio?: string;
    palette_id?: string;
    engine_provider?: string;
    ai_prompt?: string;
    ai_style?: string;
  }) {
    return this.request<MediaItem>('/media/generate-flyer', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async generatePostImage(postId: number, payload?: {
    template_id?: number;
    aspect_ratio?: string;
    palette_id?: string;
    custom_headline?: string;
    custom_cta?: string;
    details?: string[];
    engine_provider?: string;
    ai_prompt?: string;
    ai_style?: string;
  }) {
    return this.request<Post>(`/posts/${postId}/generate-image`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
  }

  async approvePost(postId: number) {
    return this.request<Post>(`/posts/${postId}/approve`, {
      method: 'POST',
    });
  }

  async duplicatePost(postId: number) {
    return this.request<Post>(`/posts/${postId}/duplicate`, {
      method: 'POST',
    });
  }

  async updateMedia(id: number, altText: string) {
    return this.request<MediaItem>(`/media/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ alt_text: altText }),
    });
  }

  async deleteMedia(id: number) {
    return this.request<void>(`/media/${id}`, { method: 'DELETE' });
  }

  // Campaigns
  async listCampaigns() {
    return this.request<Campaign[]>('/campaigns');
  }

  async getCampaign(id: number) {
    return this.request<Campaign>(`/campaigns/${id}`);
  }

  async createCampaign(data: any) {
    return this.request<Campaign>('/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCampaign(id: number, data: any) {
    return this.request<Campaign>(`/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCampaign(id: number) {
    return this.request<void>(`/campaigns/${id}`, { method: 'DELETE' });
  }

  async generateCampaignBatch(campaignId: number, count: number = 3) {
    return this.request<{
      campaign_id: number;
      campaign_name: string;
      proposed_count: number;
      proposed_posts: any[];
      notice: string;
    }>(`/campaigns/${campaignId}/generate-batch?count=${count}`, {
      method: 'POST',
    });
  }

  // Calendar
  async getCalendarEvents(platform?: string, status?: string, campaignId?: number) {
    const params = new URLSearchParams();
    if (platform) params.append('platform', platform);
    if (status) params.append('status', status);
    if (campaignId) params.append('campaign_id', campaignId.toString());
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<CalendarItem[]>(`/calendar${qs}`);
  }

  async rescheduleCalendarEvent(platformPostId: number, scheduledAt: string, timezone: string = 'Asia/Kolkata') {
    return this.request<any>(`/calendar/${platformPostId}/reschedule`, {
      method: 'PUT',
      body: JSON.stringify({ scheduled_at: scheduledAt, timezone_name: timezone }),
    });
  }

  // Dashboard & Analytics
  async getDashboardStats() {
    return this.request<DashboardStats>('/dashboard/stats');
  }

  async getRecentActivity(limit: number = 10) {
    return this.request<any[]>(`/dashboard/activity?limit=${limit}`);
  }

  async getAnalyticsOverview() {
    return this.request<AnalyticsOverview>('/analytics/overview');
  }

  // Brand Settings
  async getBrandSettings() {
    return this.request<BrandSettings>('/brand-settings');
  }

  async updateBrandSettings(data: any) {
    return this.request<BrandSettings>('/brand-settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiService();
