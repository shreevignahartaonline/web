// Purchase Model Interface based on backend documentation
export interface PurchaseItem {
  id: string
  itemName: string
  quantity: number
  rate: number
  total: number
}

export interface Purchase {
  id?: string
  billNo: string
  partyName: string
  phoneNumber: string
  items: PurchaseItem[]
  totalAmount: number
  date: string
  pdfUri?: string
  partyId?: string
  createdAt?: string
  updatedAt?: string
}

export interface PurchaseFilters {
  partyName?: string
  phoneNumber?: string
  date?: string
  search?: string
}

export interface PurchaseCreateData {
  partyName: string
  phoneNumber: string
  items: PurchaseItem[]
  date: string
  pdfUri?: string
}

export interface PurchaseUpdateData {
  partyName?: string
  phoneNumber?: string
  items?: PurchaseItem[]
  date?: string
  pdfUri?: string
}

export interface PurchasesResponse {
  success: boolean
  data: Purchase[]
  count: number
}

export interface PurchaseResponse {
  success: boolean
  data: Purchase
  message?: string
}

export interface ApiError {
  success: false
  error: string
  details?: string[]
}

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network error' }))
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
  }
  return response.json()
}

export class PurchaseService {

  // Format currency for display
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  // Format date for display
  static formatDate(dateString: string): string {
    try {
      // Handle both MM/DD/YYYY and YYYY-MM-DD formats
      if (dateString.includes('/')) {
        const [month, day, year] = dateString.split('/')
        return `${day}/${month}/${year}`
      } else if (dateString.includes('-')) {
        const [year, month, day] = dateString.split('-')
        return `${day}/${month}/${year}`
      }
      return dateString
    } catch (error) {
      console.error('Error formatting date:', error)
      return dateString
    }
  }

  // Convert date from frontend format (YYYY-MM-DD) to backend format (MM/DD/YYYY)
  static convertDateToBackendFormat(dateString: string): string {
    try {
      if (dateString.includes('-')) {
        const [year, month, day] = dateString.split('-')
        return `${month}/${day}/${year}`
      }
      return dateString
    } catch (error) {
      console.error('Error converting date:', error)
      return dateString
    }
  }

  // Convert date from backend format (MM/DD/YYYY) to frontend format (YYYY-MM-DD)
  static convertDateToFrontendFormat(dateString: string): string {
    try {
      if (dateString.includes('/')) {
        const [month, day, year] = dateString.split('/')
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      }
      return dateString
    } catch (error) {
      console.error('Error converting date:', error)
      return dateString
    }
  }

  // Get all purchases with optional filters
  static async getPurchases(filters?: PurchaseFilters): Promise<PurchasesResponse> {
    try {
      const queryParams = new URLSearchParams()
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            queryParams.append(key, value.toString())
          }
        })
      }

      const url = `${API_BASE_URL}/purchases${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      return handleResponse(response)
    } catch (error) {
      console.error('Error fetching purchases:', error)
      throw error
    }
  }

  // Get single purchase by ID
  static async getPurchase(id: string): Promise<PurchaseResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/purchases/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      return handleResponse(response)
    } catch (error) {
      console.error('Error fetching purchase:', error)
      throw error
    }
  }

  // Create new purchase
  static async createPurchase(purchaseData: PurchaseCreateData): Promise<PurchaseResponse> {
    try {
      // Convert date to backend format
      const formattedData = {
        ...purchaseData,
        date: PurchaseService.convertDateToBackendFormat(purchaseData.date)
      }

      const response = await fetch(`${API_BASE_URL}/purchases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      })
      
      return handleResponse(response)
    } catch (error) {
      console.error('Error creating purchase:', error)
      throw error
    }
  }

  // Update purchase
  static async updatePurchase(id: string, purchaseData: PurchaseUpdateData): Promise<PurchaseResponse> {
    try {
      // Convert date to backend format if provided
      const formattedData = {
        ...purchaseData,
        ...(purchaseData.date && { date: PurchaseService.convertDateToBackendFormat(purchaseData.date) })
      }

      const response = await fetch(`${API_BASE_URL}/purchases/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      })
      
      return handleResponse(response)
    } catch (error) {
      console.error('Error updating purchase:', error)
      throw error
    }
  }

  // Delete purchase
  static async deletePurchase(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/purchases/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      return handleResponse(response)
    } catch (error) {
      console.error('Error deleting purchase:', error)
      throw error
    }
  }

  // Get purchases by party
  static async getPurchasesByParty(partyName: string, phoneNumber?: string): Promise<PurchasesResponse> {
    try {
      const queryParams = new URLSearchParams()
      if (phoneNumber) {
        queryParams.append('phoneNumber', phoneNumber)
      }

      const url = `${API_BASE_URL}/purchases/party/${encodeURIComponent(partyName)}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      return handleResponse(response)
    } catch (error) {
      console.error('Error fetching purchases by party:', error)
      throw error
    }
  }

  // Get purchases by date range
  static async getPurchasesByDateRange(startDate: string, endDate: string): Promise<PurchasesResponse> {
    try {
      const queryParams = new URLSearchParams({
        startDate,
        endDate
      })

      const response = await fetch(`${API_BASE_URL}/purchases/date-range?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      return handleResponse(response)
    } catch (error) {
      console.error('Error fetching purchases by date range:', error)
      throw error
    }
  }

  // Generate next bill number (this would typically be handled by the backend)
  static async generateNextBillNumber(): Promise<string> {
    try {
      const purchases = await PurchaseService.getPurchases()
      if (purchases.data.length === 0) return '1'
      
      // Find the highest bill number
      const maxBillNo = Math.max(...purchases.data.map(purchase => parseInt(purchase.billNo) || 0))
      return (maxBillNo + 1).toString()
    } catch (error) {
      console.error('Error generating bill number:', error)
      return '1'
    }
  }

  // Validate purchase data
  static validatePurchaseData(data: PurchaseCreateData): string[] {
    const errors: string[] = []

    if (!data.partyName?.trim()) {
      errors.push('Party name is required')
    }

    if (!data.phoneNumber?.trim()) {
      errors.push('Phone number is required')
    }

    if (!data.date?.trim()) {
      errors.push('Date is required')
    }

    if (!data.items || data.items.length === 0) {
      errors.push('At least one item is required')
    } else {
      data.items.forEach((item, index) => {
        if (!item.itemName?.trim()) {
          errors.push(`Item ${index + 1}: Item name is required`)
        }
        if (!item.quantity || item.quantity <= 0) {
          errors.push(`Item ${index + 1}: Quantity must be greater than 0`)
        }
        if (!item.rate || item.rate <= 0) {
          errors.push(`Item ${index + 1}: Rate must be greater than 0`)
        }
      })
    }

    return errors
  }
}

export default PurchaseService
