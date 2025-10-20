import { db } from '@/api/databaseClient'

export const categoriesRepo = {
  async list() {
    try {
      const data = await db.getCategories()
      return data || []
    } catch (error) {
      console.error('[categoriesRepo] list error:', error)
      throw error
    }
  },

  async getBySlug(slug) {
    try {
      const categories = await db.getCategories()
      return categories.find(cat => cat.slug === slug) || null
    } catch (error) {
      console.error('[categoriesRepo] getBySlug error:', error)
      throw error
    }
  },

  async create(category) {
    try {
      const data = await db.createCategory(category)
      return data
    } catch (error) {
      console.error('[categoriesRepo] create error:', error)
      throw error
    }
  },

  async update(id, updates) {
    try {
      const data = await db.updateCategory(id, updates)
      return data
    } catch (error) {
      console.error('[categoriesRepo] update error:', error)
      throw error
    }
  },

  async remove(id) {
    try {
      await db.deleteCategory(id)
      return true
    } catch (error) {
      console.error('[categoriesRepo] remove error:', error)
      throw error
    }
  }
}