// Sale Model Interface based on backend documentation
export interface SaleItem {
  id: string
  itemName: string
  quantity: number
  rate: number
  total: number
}

export interface Sale {
  id?: string
  invoiceNo: string
  partyName: string
  phoneNumber: string
  items: SaleItem[]
  totalAmount: number
  date: string
  pdfUri?: string
  partyId?: string
  createdAt?: string
  updatedAt?: string
}

export interface SaleFilters {
  partyName?: string
  phoneNumber?: string
  date?: string
  search?: string
}

export interface SaleCreateData {
  partyName: string
  phoneNumber: string
  items: SaleItem[]
  date: string
  pdfUri?: string
}

export interface SaleUpdateData {
  partyName?: string
  phoneNumber?: string
  items?: SaleItem[]
  date?: string
  pdfUri?: string
}

export interface SalesResponse {
  success: boolean
  data: Sale[]
  count: number
}

export interface SaleResponse {
  success: boolean
  data: Sale
  message?: string
}

export interface DateRangeFilters {
  startDate: string
  endDate: string
}

export interface PartySalesFilters {
  partyName: string
  phoneNumber?: string
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

// Sale Service Class
export class SaleService {
  // Get all sales with optional filtering
  static async getSales(filters: SaleFilters = {}): Promise<SalesResponse> {
    try {
      const queryParams = new URLSearchParams()
      
      if (filters.partyName) queryParams.append('partyName', filters.partyName)
      if (filters.phoneNumber) queryParams.append('phoneNumber', filters.phoneNumber)
      if (filters.date) queryParams.append('date', filters.date)
      if (filters.search) queryParams.append('search', filters.search)
      
      const url = `${API_BASE_URL}/sales${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      return handleResponse(response)
    } catch (error) {
      console.error('Error fetching sales:', error)
      throw error
    }
  }

  // Get single sale by ID
  static async getSaleById(id: string): Promise<SaleResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/sales/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      return handleResponse(response)
    } catch (error) {
      console.error('Error fetching sale:', error)
      throw error
    }
  }

  // Create new sale
  static async createSale(saleData: SaleCreateData): Promise<SaleResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData),
      })
      
      return handleResponse(response)
    } catch (error) {
      console.error('Error creating sale:', error)
      throw error
    }
  }

  // Update sale
  static async updateSale(id: string, saleData: SaleUpdateData): Promise<SaleResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/sales/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData),
      })
      
      return handleResponse(response)
    } catch (error) {
      console.error('Error updating sale:', error)
      throw error
    }
  }

  // Delete sale
  static async deleteSale(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/sales/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      return handleResponse(response)
    } catch (error) {
      console.error('Error deleting sale:', error)
      throw error
    }
  }

  // Get sales by party name
  static async getSalesByParty(filters: PartySalesFilters): Promise<SalesResponse> {
    try {
      const queryParams = new URLSearchParams()
      
      if (filters.phoneNumber) queryParams.append('phoneNumber', filters.phoneNumber)
      
      const url = `${API_BASE_URL}/sales/party/${encodeURIComponent(filters.partyName)}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      return handleResponse(response)
    } catch (error) {
      console.error('Error fetching sales by party:', error)
      throw error
    }
  }

  // Get sales by date range
  static async getSalesByDateRange(filters: DateRangeFilters): Promise<SalesResponse> {
    try {
      const queryParams = new URLSearchParams()
      queryParams.append('startDate', filters.startDate)
      queryParams.append('endDate', filters.endDate)
      
      const response = await fetch(`${API_BASE_URL}/sales/date-range?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      return handleResponse(response)
    } catch (error) {
      console.error('Error fetching sales by date range:', error)
      throw error
    }
  }

  // Generate next invoice number (utility function)
  static async generateNextInvoiceNumber(): Promise<string> {
    try {
      // This would typically be handled by the backend, but we can simulate it
      // by getting the latest sale and incrementing the invoice number
      const sales = await this.getSales()
      if (sales.data.length === 0) {
        return '1'
      }
      
      const latestSale = sales.data[0]
      const lastNumber = parseInt(latestSale.invoiceNo)
      return isNaN(lastNumber) ? '1' : (lastNumber + 1).toString()
    } catch (error) {
      console.error('Error generating invoice number:', error)
      return '1'
    }
  }

  // Format date for display
  static formatDate(dateString: string): string {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    } catch (error) {
      return dateString
    }
  }

  // Format currency for display
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount)
  }

  // Validate sale data
  static validateSaleData(saleData: SaleCreateData): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!saleData.partyName?.trim()) {
      errors.push('Party name is required')
    }

    if (!saleData.phoneNumber?.trim()) {
      errors.push('Phone number is required')
    }

    if (!saleData.date?.trim()) {
      errors.push('Date is required')
    }

    if (!saleData.items || saleData.items.length === 0) {
      errors.push('At least one item is required')
    } else {
      saleData.items.forEach((item, index) => {
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

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

export default SaleService
