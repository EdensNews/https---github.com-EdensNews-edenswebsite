import { db } from '@/api/databaseClient'

export const articlesRepo = {
  async list({ limit = 20, offset = 0, status = 'published' } = {}) {
    try {
      const data = await db.getArticles({ limit, offset, status })
      return data || []
    } catch (error) {
      console.error('Error fetching articles:', error)
      return []
    }
  },

  async listByCategory(slug, { limit = 20, offset = 0 } = {}) {
    // For now, return all articles (category filtering will be added to API later)
    return this.list({ limit, offset })
  },

  async search(q, { limit = 20, offset = 0 } = {}) {
    try {
      const data = await db.searchArticles(q, limit)
      return data || []
    } catch (error) {
      console.error('Error searching articles:', error)
      return []
    }
  },

  async searchByCategory(q, slug, { limit = 20, offset = 0 } = {}) {
    // For now, just search all articles
    return this.search(q, { limit, offset })
  },

  async get(id) {
    try {
      const data = await db.getArticle(id)
      return data
    } catch (error) {
      console.error('Error fetching article:', error)
      return null
    }
  },

  async create(article) {
    try {
      const data = await db.createArticle(article)
      return data
    } catch (error) {
      console.error('Error creating article:', error)
      throw error
    }
  },

  async update(id, updates) {
    try {
      const data = await db.updateArticle(id, updates)
      return data
    } catch (error) {
      console.error('Error updating article:', error)
      throw error
    }
  },

  async delete(id) {
    try {
      await db.deleteArticle(id)
      return true
    } catch (error) {
      console.error('Error deleting article:', error)
      throw error
    }
  }
}