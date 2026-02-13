// Purchase Model Interface based on backend documentation
import BasePDFGenerator from './basePDFGenerator'

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
  billNo: string
  partyName: string
  phoneNumber: string
  items: PurchaseItem[]
  date: string
  pdfUri?: string
}

export interface PurchaseUpdateData {
  billNo?: string
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
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-app-v43g.onrender.com/api'
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'


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
      
      const result = await handleResponse(response)
      
      // Generate and send PDF via WhatsApp after successful creation
      if (result.success && result.data) {
        try {
          const billData = {
            id: result.data.id || '',
            billNo: result.data.billNo,
            partyName: result.data.partyName,
            phoneNumber: result.data.phoneNumber,
            items: result.data.items,
            totalAmount: result.data.totalAmount,
            date: result.data.date
          }
          
          await BasePDFGenerator.generateAndSendPDFOnly(billData, 'purchase-bill', result.data.phoneNumber)
        } catch (pdfError) {
          console.error('PDF generation/WhatsApp send failed:', pdfError)
          // PDF generation failure shouldn't break the purchase creation
        }
      }
      
      return result
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

  // Delete multiple purchases
  static async deletePurchases(purchaseIds: string[]): Promise<{ success: boolean; message: string; deletedCount: number }> {
    try {
      const response = await fetch(`${API_BASE_URL}/purchases/bulk`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ purchaseIds }),
      })
      
      return handleResponse(response)
    } catch (error) {
      console.error('Error deleting purchases:', error)
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

  // Check if bill number already exists
  static async isBillNumberExists(billNo: string): Promise<boolean> {
    try {
      const purchases = await this.getPurchases()
      return purchases.data.some(purchase => purchase.billNo === billNo.trim())
    } catch (error) {
      console.error('Error checking bill number:', error)
      return false
    }
  }

  // Validate bill number format
  static validateBillNumber(billNo: string): { isValid: boolean; error?: string } {
    if (!billNo || typeof billNo !== 'string') {
      return { isValid: false, error: 'Bill number is required' }
    }
    
    const trimmed = billNo.trim()
    
    if (trimmed.length < 1 || trimmed.length > 50) {
      return { isValid: false, error: 'Bill number must be 1-50 characters long' }
    }
    
    if (!/^[A-Za-z0-9\-_]+$/.test(trimmed)) {
      return { isValid: false, error: 'Bill number can only contain letters, numbers, hyphens, and underscores' }
    }
    
    return { isValid: true }
  }

  // Generate PDF for existing purchase
  static async generatePDFForPurchase(purchase: Purchase): Promise<boolean> {
    try {
      const billData = {
        id: purchase.id || '',
        billNo: purchase.billNo,
        partyName: purchase.partyName,
        phoneNumber: purchase.phoneNumber,
        items: purchase.items,
        totalAmount: purchase.totalAmount,
        date: purchase.date
      }
      
      const result = await BasePDFGenerator.generateAndSendPDFOnly(billData, 'purchase-bill', purchase.phoneNumber)
      return result.success
    } catch (error) {
      console.error('Error generating PDF for purchase:', error)
      return false
    }
  }

  // Generate PDF and send via WhatsApp (simplified - no PDF opening)
  static async generateAndSendPDFViaWhatsApp(purchase: Purchase): Promise<boolean> {
    try {
      const billData = {
        id: purchase.id || '',
        billNo: purchase.billNo,
        partyName: purchase.partyName,
        phoneNumber: purchase.phoneNumber,
        items: purchase.items,
        totalAmount: purchase.totalAmount,
        date: purchase.date
      }
      
      const result = await BasePDFGenerator.generateAndSendPDFOnly(
        billData, 
        'purchase-bill', 
        purchase.phoneNumber
      )
      
      return result.success
    } catch (error) {
      console.error('Error generating and sending PDF via WhatsApp:', error)
      return false
    }
  }

  // Upload existing PDF and send via WhatsApp
  static async uploadAndSendExistingPDF(pdfBlob: Blob, fileName: string, purchase: Purchase): Promise<boolean> {
    try {
      const whatsappData = {
        phoneNumber: purchase.phoneNumber,
        documentUrl: '', // Will be set after upload
        fileName: fileName,
        documentType: 'purchase-bill' as const,
        billNo: purchase.billNo,
        supplierName: purchase.partyName,
        amount: purchase.totalAmount
      }
      
      const result = await BasePDFGenerator.uploadAndSendExistingPDF(pdfBlob, fileName, whatsappData)
      return result.success
    } catch (error) {
      console.error('Error uploading and sending existing PDF:', error)
      return false
    }
  }

  // Validate purchase data
  static validatePurchaseData(data: PurchaseCreateData): string[] {
    const errors: string[] = []

    // Validate bill number
    const billValidation = this.validateBillNumber(data.billNo)
    if (!billValidation.isValid) {
      errors.push(billValidation.error || 'Invalid bill number')
    }

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

