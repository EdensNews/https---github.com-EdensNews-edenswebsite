// Edens News - New Database Client (replaces Supabase)
// Use this in your React app instead of supabaseClient.js

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class DatabaseClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Request failed');
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Articles
  async getArticles({ limit = 20, offset = 0, status = 'published', category } = {}) {
    const params = new URLSearchParams({ limit, offset, status });
    if (category) params.append('category', category);
    
    return this.request(`/articles?${params}`);
  }

  async getArticle(id) {
    return this.request(`/articles/${id}`);
  }

  async createArticle(article) {
    return this.request('/articles', {
      method: 'POST',
      body: JSON.stringify(article),
    });
  }

  async updateArticle(id, updates) {
    return this.request(`/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteArticle(id) {
    return this.request(`/articles/${id}`, {
      method: 'DELETE',
    });
  }

  async searchArticles(query, limit = 20) {
    return this.request(`/articles/search/${encodeURIComponent(query)}?limit=${limit}`);
  }

  // Categories
  async getCategories() {
    return this.request('/categories');
  }

  // Bookmarks
  async getBookmarks(userId) {
    return this.request(`/bookmarks/${userId}`);
  }

  async addBookmark(userId, articleId) {
    return this.request('/bookmarks', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, article_id: articleId }),
    });
  }

  async removeBookmark(userId, articleId) {
    return this.request(`/bookmarks/${userId}/${articleId}`, {
      method: 'DELETE',
    });
  }

  // Analytics
  async trackView(articleId, userId = null) {
    return this.request('/analytics/view', {
      method: 'POST',
      body: JSON.stringify({
        article_id: articleId,
        user_id: userId,
        ip_address: null, // Will be set by server
        user_agent: navigator.userAgent,
      }),
    });
  }

  // Settings
  async getSiteSettings() {
    return this.request('/settings/site');
  }

  async getStreamSettings() {
    return this.request('/settings/stream');
  }
}

export const db = new DatabaseClient(API_URL);

// Compatibility layer for existing Supabase code
export const supabase = {
  from: (table) => ({
    select: (columns = '*') => ({
      eq: (column, value) => ({
        order: (orderColumn, options) => ({
          range: async (start, end) => {
            try {
              const limit = end - start + 1;
              const offset = start;
              const data = await db.getArticles({ limit, offset });
              return { data, error: null };
            } catch (error) {
              return { data: null, error };
            }
          },
          limit: async (limit) => {
            try {
              const data = await db.getArticles({ limit });
              return { data, error: null };
            } catch (error) {
              return { data: null, error };
            }
          },
        }),
        maybeSingle: async () => {
          try {
            // This is a simplified version
            const data = await db.getArticles({ limit: 1 });
            return { data: data[0] || null, error: null };
          } catch (error) {
            return { data: null, error };
          }
        },
      }),
    }),
  }),
};
