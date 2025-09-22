// Item Model Interface based on backend documentation
export interface Item {
  _id?: string
  productName: string
  category: 'Primary' | 'Kirana'
  openingStock: number
  lowStockAlert: number
  isUniversal?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface ItemSummary {
  totalItems: number
  primaryItems: number
  kiranaItems: number
  universalItems: number
  totalStock: number
  lowStockCount: number
  lowStockItems: Array<{
    id: string
    productName: string
    currentStock: number
    lowStockAlert: number
    stockInKg: number
  }>
}

export interface ItemFilters {
  category?: string
  search?: string
  isUniversal?: boolean
}

export interface BardanaStockUpdate {
  operation: 'add' | 'subtract'
  quantity: number // in kg
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  count?: number
}

// Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-app-v43g.onrender.com'
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'


// Item Service Class
export class ItemService {
  private baseEndpoint = '/api/items'

  /**
   * Get all items with optional filtering
   * GET /items
   */
  async getItems(filters?: ItemFilters): Promise<ApiResponse<Item[]>> {
    try {
      const queryParams = new URLSearchParams()
      
      if (filters?.category && filters.category !== 'all') {
        queryParams.append('category', filters.category)
      }
      
      if (filters?.search) {
        queryParams.append('search', filters.search)
      }
      
      if (filters?.isUniversal !== undefined) {
        queryParams.append('isUniversal', filters.isUniversal.toString())
      }

      const url = `${API_BASE_URL}${this.baseEndpoint}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      if (!response.ok) {
        throw {
          message: data.error || 'An error occurred',
          status: response.status,
        }
      }
      
      return data
    } catch (error: any) {
      throw error
    }
  }

  /**
   * Get single item by ID
   * GET /items/:id
   */
  async getItemById(id: string): Promise<ApiResponse<Item>> {
    try {
      const response = await fetch(`${API_BASE_URL}${this.baseEndpoint}/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      if (!response.ok) {
        throw {
          message: data.error || 'An error occurred',
          status: response.status,
        }
      }
      
      return data
    } catch (error: any) {
      throw error
    }
  }

  /**
   * Create new item
   * POST /items
   */
  async createItem(itemData: Omit<Item, '_id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Item>> {
    try {
      const response = await fetch(`${API_BASE_URL}${this.baseEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      })
      
      const data = await response.json()
      if (!response.ok) {
        throw {
          message: data.error || 'An error occurred',
          status: response.status,
        }
      }
      
      return data
    } catch (error: any) {
      throw error
    }
  }

  /**
   * Update item
   * PUT /items/:id
   */
  async updateItem(id: string, itemData: Partial<Item>): Promise<ApiResponse<Item>> {
    try {
      const response = await fetch(`${API_BASE_URL}${this.baseEndpoint}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      })
      
      const data = await response.json()
      if (!response.ok) {
        throw {
          message: data.error || 'An error occurred',
          status: response.status,
        }
      }
      
      return data
    } catch (error: any) {
      throw error
    }
  }

  /**
   * Delete item
   * DELETE /items/:id
   */
  async deleteItem(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_BASE_URL}${this.baseEndpoint}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      if (!response.ok) {
        throw {
          message: data.error || 'An error occurred',
          status: response.status,
        }
      }
      
      return data
    } catch (error: any) {
      throw error
    }
  }

  /**
   * Get items summary statistics
   * GET /items/stats/summary
   */
  async getItemsSummary(): Promise<ApiResponse<ItemSummary>> {
    try {
      const response = await fetch(`${API_BASE_URL}${this.baseEndpoint}/stats/summary`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      if (!response.ok) {
        throw {
          message: data.error || 'An error occurred',
          status: response.status,
        }
      }
      
      return data
    } catch (error: any) {
      throw error
    }
  }

  /**
   * Initialize Bardana universal item
   * POST /items/initialize-bardana
   */
  async initializeBardana(): Promise<ApiResponse<Item>> {
    try {
      const response = await fetch(`${API_BASE_URL}${this.baseEndpoint}/initialize-bardana`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      if (!response.ok) {
        throw {
          message: data.error || 'An error occurred',
          status: response.status,
        }
      }
      
      return data
    } catch (error: any) {
      throw error
    }
  }

  /**
   * Get Bardana universal item
   * GET /items/bardana
   */
  async getBardana(): Promise<ApiResponse<Item>> {
    try {
      const response = await fetch(`${API_BASE_URL}${this.baseEndpoint}/bardana`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      if (!response.ok) {
        throw {
          message: data.error || 'An error occurred',
          status: response.status,
        }
      }
      
      return data
    } catch (error: any) {
      throw error
    }
  }

  /**
   * Update Bardana stock
   * PUT /items/bardana/stock
   */
  async updateBardanaStock(updateData: BardanaStockUpdate): Promise<ApiResponse<Item>> {
    try {
      const response = await fetch(`${API_BASE_URL}${this.baseEndpoint}/bardana/stock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })
      
      const data = await response.json()
      if (!response.ok) {
        throw {
          message: data.error || 'An error occurred',
          status: response.status,
        }
      }
      
      return data
    } catch (error: any) {
      throw error
    }
  }

  /**
   * Validate item data before submission
   */
  validateItemData(itemData: Partial<Item>): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!itemData.productName?.trim()) {
      errors.push('Product name is required')
    }

    if (!itemData.category || !['Primary', 'Kirana'].includes(itemData.category)) {
      errors.push('Category must be either Primary or Kirana')
    }

    if (itemData.openingStock === undefined || itemData.openingStock < 0) {
      errors.push('Opening stock must be a non-negative number')
    }

    if (itemData.lowStockAlert === undefined || itemData.lowStockAlert < 0) {
      errors.push('Low stock alert must be a non-negative number')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Format item for display
   */
  formatItemForDisplay(item: Item) {
    return {
      ...item,
      stockInKg: Math.round(item.openingStock * 30), // Convert bags to kg
      stockStatus: item.openingStock <= item.lowStockAlert ? 'low' : 'normal',
      categoryBadge: item.category === 'Primary' ? 'default' : 'secondary',
      isUniversalBadge: item.isUniversal ? 'destructive' : 'outline'
    }
  }
}

// Export singleton instance
export const itemService = new ItemService()

// Export default
export default itemService
