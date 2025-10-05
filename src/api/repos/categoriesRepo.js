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
    // Category creation not implemented in API yet
    console.warn('Category creation not yet implemented in new API')
    throw new Error('Not implemented')
  },

  async update(id, updates) {
    // Category update not implemented in API yet
    console.warn('Category update not yet implemented in new API')
    throw new Error('Not implemented')
  },

  async remove(id) {
    // Category deletion not implemented in API yet
    console.warn('Category deletion not yet implemented in new API')
    throw new Error('Not implemented')
  }
}