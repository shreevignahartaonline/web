// Sale Model Interface based on backend documentation
import BasePDFGenerator from './basePDFGenerator'

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
  invoiceNo: string
  partyName: string
  phoneNumber: string
  items: SaleItem[]
  date: string
  pdfUri?: string
}

export interface SaleUpdateData {
  invoiceNo?: string
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

import { API_URL as API_BASE_URL } from './config'

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
      
      const result = await handleResponse(response)
      
      // Generate and send PDF via WhatsApp after successful creation
      if (result.success && result.data) {
        try {
          const invoiceData = {
            id: result.data.id || '',
            invoiceNo: result.data.invoiceNo,
            partyName: result.data.partyName,
            phoneNumber: result.data.phoneNumber,
            items: result.data.items,
            totalAmount: result.data.totalAmount,
            date: result.data.date
          }
          
          await BasePDFGenerator.generateAndSendPDFOnly(invoiceData, 'invoice', result.data.phoneNumber)
        } catch (pdfError) {
          console.error('PDF generation/WhatsApp send failed:', pdfError)
        }
      }
      
      return result
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

  // Delete multiple sales
  static async deleteSales(saleIds: string[]): Promise<{ success: boolean; message: string; deletedCount: number }> {
    try {
      const response = await fetch(`${API_BASE_URL}/sales/bulk`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ saleIds }),
      })
      
      return handleResponse(response)
    } catch (error) {
      console.error('Error deleting sales:', error)
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

  // Check if invoice number already exists
  static async isInvoiceNumberExists(invoiceNo: string): Promise<boolean> {
    try {
      const sales = await this.getSales()
      return sales.data.some(sale => sale.invoiceNo === invoiceNo.trim())
    } catch (error) {
      console.error('Error checking invoice number:', error)
      return false
    }
  }

  // Validate invoice number format
  static validateInvoiceNumber(invoiceNo: string): { isValid: boolean; error?: string } {
    if (!invoiceNo || typeof invoiceNo !== 'string') {
      return { isValid: false, error: 'Invoice number is required' }
    }
    
    const trimmed = invoiceNo.trim()
    
    if (trimmed.length < 1 || trimmed.length > 50) {
      return { isValid: false, error: 'Invoice number must be 1-50 characters long' }
    }
    
    if (!/^[A-Za-z0-9\-_]+$/.test(trimmed)) {
      return { isValid: false, error: 'Invoice number can only contain letters, numbers, hyphens, and underscores' }
    }
    
    return { isValid: true }
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

  // Generate PDF and send via WhatsApp (simplified - no PDF opening)
  static async generateAndSendPDFViaWhatsApp(sale: Sale): Promise<boolean> {
    try {
      const invoiceData = {
        id: sale.id || '',
        invoiceNo: sale.invoiceNo,
        partyName: sale.partyName,
        phoneNumber: sale.phoneNumber,
        items: sale.items,
        totalAmount: sale.totalAmount,
        date: sale.date
      }
      
      const result = await BasePDFGenerator.generateAndSendPDFOnly(
        invoiceData, 
        'invoice', 
        sale.phoneNumber
      )
      
      return result.success
    } catch (error) {
      console.error('Error generating and sending PDF via WhatsApp:', error)
      return false
    }
  }

  // Upload existing PDF and send via WhatsApp
  static async uploadAndSendExistingPDF(pdfBlob: Blob, fileName: string, sale: Sale): Promise<boolean> {
    try {
      const whatsappData = {
        phoneNumber: sale.phoneNumber,
        documentUrl: '', // Will be set after upload
        fileName: fileName,
        documentType: 'invoice' as const,
        invoiceNo: sale.invoiceNo,
        customerName: sale.partyName,
        amount: sale.totalAmount
      }
      
      const result = await BasePDFGenerator.uploadAndSendExistingPDF(pdfBlob, fileName, whatsappData)
      return result.success
    } catch (error) {
      console.error('Error uploading and sending existing PDF:', error)
      return false
    }
  }

  // Validate sale data
  static validateSaleData(saleData: SaleCreateData): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate invoice number
    const invoiceValidation = this.validateInvoiceNumber(saleData.invoiceNo)
    if (!invoiceValidation.isValid) {
      errors.push(invoiceValidation.error || 'Invalid invoice number')
    }

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
