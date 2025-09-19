// Payment Model Interface based on backend documentation
import BasePDFGenerator from './basePDFGenerator'

export interface Payment {
  id?: string
  paymentNo: string
  type: 'payment-in' | 'payment-out'
  partyName: string
  phoneNumber: string
  amount: number
  totalAmount: number
  date: string
  partyId?: string
  createdAt?: string
  updatedAt?: string
}

export interface PaymentFilters {
  type?: string
  partyName?: string
  phoneNumber?: string
  startDate?: string
  endDate?: string
  search?: string
}

export interface PaymentCreateData {
  type: 'payment-in' | 'payment-out'
  partyName: string
  phoneNumber: string
  amount: number
  totalAmount?: number
  date: string
}

export interface PaymentUpdateData {
  partyName?: string
  phoneNumber?: string
  amount?: number
  totalAmount?: number
  date?: string
}

export interface PaymentsResponse {
  success: boolean
  data: Payment[]
  count: number
}

export interface PaymentResponse {
  success: boolean
  data: Payment
  message?: string
}

export interface PaymentSummary {
  _id: string
  totalAmount: number
  totalCount: number
}

export interface PaymentSummaryResponse {
  success: boolean
  data: PaymentSummary[]
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

// Payment Service Class
export class PaymentService {
  // Get all payments with optional filtering
  static async getPayments(filters: PaymentFilters = {}): Promise<PaymentsResponse> {
    try {
      const queryParams = new URLSearchParams()
      
      if (filters.type && filters.type !== 'all') queryParams.append('type', filters.type)
      if (filters.partyName) queryParams.append('partyName', filters.partyName)
      if (filters.phoneNumber) queryParams.append('phoneNumber', filters.phoneNumber)
      if (filters.startDate) queryParams.append('startDate', filters.startDate)
      if (filters.endDate) queryParams.append('endDate', filters.endDate)
      if (filters.search) queryParams.append('search', filters.search)
      
      const url = `${API_BASE_URL}/payments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      return handleResponse(response)
    } catch (error) {
      console.error('Error fetching payments:', error)
      throw error
    }
  }

  // Get single payment by ID
  static async getPaymentById(id: string): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      return handleResponse(response)
    } catch (error) {
      console.error('Error fetching payment:', error)
      throw error
    }
  }

  // Create new payment
  static async createPayment(paymentData: PaymentCreateData): Promise<PaymentResponse> {
    try {
      // Convert date from frontend format (YYYY-MM-DD) to backend format (MM/DD/YYYY)
      const formattedData = {
        ...paymentData,
        date: PaymentService.convertDateToBackendFormat(paymentData.date)
      }

      const response = await fetch(`${API_BASE_URL}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      })
      
      const result = await handleResponse(response)
      
      // Generate and open PDF after successful creation
      if (result.success && result.data) {
        try {
          if (result.data.type === 'payment-in') {
            const paymentInData = {
              id: result.data.id || '',
              paymentNo: result.data.paymentNo,
              partyName: result.data.partyName,
              phoneNumber: result.data.phoneNumber,
              received: result.data.amount,
              totalAmount: result.data.totalAmount,
              date: result.data.date
            }
            
            // Generate and open payment receipt PDF in new tab
            await BasePDFGenerator.generateAndOpenPaymentReceipt(paymentInData)
            console.log('Payment receipt PDF generated and opened successfully!')
          } else if (result.data.type === 'payment-out') {
            const paymentOutData = {
              id: result.data.id || '',
              paymentNo: result.data.paymentNo,
              partyName: result.data.partyName,
              phoneNumber: result.data.phoneNumber,
              paid: result.data.amount,
              totalAmount: result.data.totalAmount,
              date: result.data.date
            }
            
            // Generate and open payment voucher PDF in new tab
            await BasePDFGenerator.generateAndOpenPaymentVoucher(paymentOutData)
            console.log('Payment voucher PDF generated and opened successfully!')
          }
        } catch (pdfError) {
          console.error('Error generating payment PDF:', pdfError)
          // Don't throw error - PDF generation failure shouldn't break the payment creation
        }
      }
      
      return result
    } catch (error) {
      console.error('Error creating payment:', error)
      throw error
    }
  }

  // Update payment
  static async updatePayment(id: string, paymentData: PaymentUpdateData): Promise<PaymentResponse> {
    try {
      // Convert date to backend format if provided
      const formattedData = {
        ...paymentData,
        ...(paymentData.date && { date: PaymentService.convertDateToBackendFormat(paymentData.date) })
      }

      const response = await fetch(`${API_BASE_URL}/payments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      })
      
      return handleResponse(response)
    } catch (error) {
      console.error('Error updating payment:', error)
      throw error
    }
  }

  // Delete payment
  static async deletePayment(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      return handleResponse(response)
    } catch (error) {
      console.error('Error deleting payment:', error)
      throw error
    }
  }

  // Get payments by type
  static async getPaymentsByType(type: 'payment-in' | 'payment-out', filters?: PaymentFilters): Promise<PaymentsResponse> {
    try {
      const queryParams = new URLSearchParams()
      
      if (filters?.partyName) queryParams.append('partyName', filters.partyName)
      if (filters?.phoneNumber) queryParams.append('phoneNumber', filters.phoneNumber)
      if (filters?.startDate) queryParams.append('startDate', filters.startDate)
      if (filters?.endDate) queryParams.append('endDate', filters.endDate)
      if (filters?.search) queryParams.append('search', filters.search)
      
      const url = `${API_BASE_URL}/payments/type/${type}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      return handleResponse(response)
    } catch (error) {
      console.error('Error fetching payments by type:', error)
      throw error
    }
  }

  // Get payment summary
  static async getPaymentSummary(type?: string, startDate?: string, endDate?: string): Promise<PaymentSummaryResponse> {
    try {
      const queryParams = new URLSearchParams()
      
      if (type) queryParams.append('type', type)
      if (startDate) queryParams.append('startDate', startDate)
      if (endDate) queryParams.append('endDate', endDate)
      
      const url = `${API_BASE_URL}/payments/summary${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      return handleResponse(response)
    } catch (error) {
      console.error('Error fetching payment summary:', error)
      throw error
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

  // Format currency for display
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
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

  // Validate payment data
  static validatePaymentData(paymentData: PaymentCreateData): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!paymentData.type || !['payment-in', 'payment-out'].includes(paymentData.type)) {
      errors.push('Payment type is required and must be either payment-in or payment-out')
    }

    if (!paymentData.partyName?.trim()) {
      errors.push('Party name is required')
    }

    if (!paymentData.phoneNumber?.trim()) {
      errors.push('Phone number is required')
    } else {
      // Basic phone number validation
      const phoneRegex = /^\+?[1-9]\d{1,14}$/
      const cleanedPhone = paymentData.phoneNumber.replace(/\s/g, '')
      if (!phoneRegex.test(cleanedPhone)) {
        errors.push('Invalid phone number format')
      }
    }

    if (!paymentData.amount || paymentData.amount <= 0) {
      errors.push('Amount must be greater than 0')
    }

    if (!paymentData.date?.trim()) {
      errors.push('Date is required')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Generate PDF for existing payment
  static async generatePDFForPayment(payment: Payment): Promise<boolean> {
    try {
      if (payment.type === 'payment-in') {
        const paymentInData = {
          id: payment.id || '',
          paymentNo: payment.paymentNo,
          partyName: payment.partyName,
          phoneNumber: payment.phoneNumber,
          received: payment.amount,
          totalAmount: payment.totalAmount,
          date: payment.date
        }
        
        return await BasePDFGenerator.generateAndOpenPaymentReceipt(paymentInData)
      } else if (payment.type === 'payment-out') {
        const paymentOutData = {
          id: payment.id || '',
          paymentNo: payment.paymentNo,
          partyName: payment.partyName,
          phoneNumber: payment.phoneNumber,
          paid: payment.amount,
          totalAmount: payment.totalAmount,
          date: payment.date
        }
        
        return await BasePDFGenerator.generateAndOpenPaymentVoucher(paymentOutData)
      }
      
      return false
    } catch (error) {
      console.error('Error generating PDF for payment:', error)
      return false
    }
  }

  // Get payment type display text
  static getPaymentTypeText(type: string): string {
    return type === 'payment-in' ? 'Payment In' : 'Payment Out'
  }
}

export default PaymentService
