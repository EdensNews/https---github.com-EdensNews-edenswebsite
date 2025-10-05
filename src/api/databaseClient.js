// New Database Client - Connects to our VPS API
// Replaces Supabase for data operations (auth still uses Supabase)

const API_URL = import.meta.env.VITE_API_URL || 'http://143.244.143.239/api';

class DatabaseClient {
  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
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
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Articles
  async getArticles({ limit = 20, offset = 0, status = 'published' } = {}) {
    return this.request(`/articles?limit=${limit}&offset=${offset}&status=${status}`);
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

  async createBookmark(userId, articleId) {
    return this.request('/bookmarks', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, article_id: articleId }),
    });
  }

  async deleteBookmark(userId, articleId) {
    return this.request(`/bookmarks/${userId}/${articleId}`, {
      method: 'DELETE',
    });
  }

  // Analytics
  async trackView(articleId, userId, ipAddress, userAgent) {
    return this.request('/analytics/view', {
      method: 'POST',
      body: JSON.stringify({
        article_id: articleId,
        user_id: userId,
        ip_address: ipAddress,
        user_agent: userAgent,
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

export const db = new DatabaseClient();
export default db;
