// Party Model Interface based on backend documentation
export interface Party {
  _id?: string
  name: string
  phoneNumber: string
  balance: number
  address?: string
  email?: string
  createdAt?: string
  updatedAt?: string
}

export interface PartyFilters {
  search?: string
}

export interface PartyTransaction {
  id: string
  type: 'sale' | 'purchase' | 'payment-in' | 'payment-out'
  transactionId: string
  partyName: string
  phoneNumber: string
  totalAmount?: number
  amount?: number
  date: string
  pdfUri?: string
  description?: string
  paymentMethod?: string
  reference?: string
  createdAt: string
  updatedAt: string
  items?: any[]
}

export interface PartyTransactionsResponse {
  party: Party
  transactions: PartyTransaction[]
}

export interface BalanceUpdate {
  amount: number
  operation: 'add' | 'subtract' | 'set'
}

export interface FindOrCreateParty {
  name: string
  phoneNumber: string
  address?: string
  email?: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  count?: number
  details?: any[]
}

// Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// Party Service Class
export class PartyService {
  private baseEndpoint = '/api/parties'

  /**
   * Get all parties with optional filtering
   * GET /api/parties
   */
  async getParties(filters?: PartyFilters): Promise<ApiResponse<Party[]>> {
    try {
      const queryParams = new URLSearchParams()
      
      if (filters?.search) {
        queryParams.append('search', filters.search)
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
   * Get single party by ID
   * GET /api/parties/:id
   */
  async getPartyById(id: string): Promise<ApiResponse<Party>> {
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
   * Create new party
   * POST /api/parties
   */
  async createParty(partyData: Omit<Party, '_id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Party>> {
    try {
      const response = await fetch(`${API_BASE_URL}${this.baseEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(partyData),
      })
      
      const data = await response.json()
      if (!response.ok) {
        throw {
          message: data.error || 'An error occurred',
          status: response.status,
          details: data.details,
        }
      }
      
      return data
    } catch (error: any) {
      throw error
    }
  }

  /**
   * Update party
   * PUT /api/parties/:id
   */
  async updateParty(id: string, partyData: Partial<Party>): Promise<ApiResponse<Party>> {
    try {
      const response = await fetch(`${API_BASE_URL}${this.baseEndpoint}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(partyData),
      })
      
      const data = await response.json()
      if (!response.ok) {
        throw {
          message: data.error || 'An error occurred',
          status: response.status,
          details: data.details,
        }
      }
      
      return data
    } catch (error: any) {
      throw error
    }
  }

  /**
   * Update party balance
   * PATCH /api/parties/:id/balance
   */
  async updatePartyBalance(id: string, balanceData: BalanceUpdate): Promise<ApiResponse<Party>> {
    try {
      const response = await fetch(`${API_BASE_URL}${this.baseEndpoint}/${id}/balance`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(balanceData),
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
   * Find existing party or create new one
   * POST /api/parties/find-or-create
   */
  async findOrCreateParty(partyData: FindOrCreateParty): Promise<ApiResponse<Party>> {
    try {
      const response = await fetch(`${API_BASE_URL}${this.baseEndpoint}/find-or-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(partyData),
      })
      
      const data = await response.json()
      if (!response.ok) {
        throw {
          message: data.error || 'An error occurred',
          status: response.status,
          details: data.details,
        }
      }
      
      return data
    } catch (error: any) {
      throw error
    }
  }

  /**
   * Delete party
   * DELETE /api/parties/:id
   */
  async deleteParty(id: string): Promise<ApiResponse<void>> {
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
   * Get all transactions for a party
   * GET /api/parties/:id/transactions
   */
  async getPartyTransactions(id: string): Promise<ApiResponse<PartyTransactionsResponse>> {
    try {
      const response = await fetch(`${API_BASE_URL}${this.baseEndpoint}/${id}/transactions`, {
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
   * Validate party data before submission
   */
  validatePartyData(partyData: Partial<Party>): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!partyData.name?.trim()) {
      errors.push('Party name is required')
    }

    if (!partyData.phoneNumber?.trim()) {
      errors.push('Phone number is required')
    } else {
      // Basic phone number validation
      const phoneRegex = /^\+?[1-9]\d{1,14}$/
      const cleanedPhone = partyData.phoneNumber.replace(/\s/g, '')
      if (!phoneRegex.test(cleanedPhone)) {
        errors.push('Invalid phone number format')
      }
    }

    if (partyData.email && partyData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(partyData.email)) {
        errors.push('Invalid email format')
      }
    }

    // Balance can be negative, positive, or zero - no validation needed

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Format party for display
   */
  formatPartyForDisplay(party: Party) {
    return {
      ...party,
      displayName: party.name,
      displayPhone: party.phoneNumber,
      displayEmail: party.email || 'Not provided',
      displayAddress: party.address || 'Not provided',
      balanceStatus: party.balance > 0 ? 'positive' : party.balance < 0 ? 'negative' : 'neutral',
      balanceColor: party.balance > 0 ? 'text-green-600' : party.balance < 0 ? 'text-red-600' : 'text-gray-600'
    }
  }

  /**
   * Sanitize phone number
   */
  sanitizePhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/[^\d+]/g, '')
    return cleaned.startsWith('+') ? cleaned : `+91${cleaned}`
  }

  /**
   * Format balance for display
   */
  formatBalance(balance: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(balance)
  }

  /**
   * Get party statistics
   */
  async getPartyStats(): Promise<{
    totalParties: number
    customers: number
    suppliers: number
    totalBalance: number
  }> {
    try {
      const response = await this.getParties()
      const parties = response.data || []
      
      // Calculate statistics
      const totalParties = parties.length
      const totalBalance = parties.reduce((sum, party) => sum + (party.balance || 0), 0)
      
      // Note: The backend doesn't distinguish between customers and suppliers
      // This is a placeholder - you might need to implement this logic based on your business rules
      const customers = Math.floor(totalParties * 0.7) // Assuming 70% are customers
      const suppliers = totalParties - customers
      
      return {
        totalParties,
        customers,
        suppliers,
        totalBalance
      }
    } catch (error) {
      return {
        totalParties: 0,
        customers: 0,
        suppliers: 0,
        totalBalance: 0
      }
    }
  }
}

// Export singleton instance
export const partyService = new PartyService()

// Export default
export default partyService
