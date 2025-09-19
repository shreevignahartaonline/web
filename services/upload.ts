import axios from 'axios'

// Upload Service for PDF upload and WhatsApp integration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export interface UploadResult {
  success: boolean
  url?: string
  public_id?: string
  message?: string
  error?: string
  local?: boolean
}

export interface WhatsAppSendData {
  phoneNumber: string
  documentUrl: string
  fileName: string
  message?: string
  documentType: 'invoice' | 'purchase-bill' | 'payment-receipt' | 'payment-voucher'
  // Document-specific data
  invoiceNo?: string
  customerName?: string
  amount?: number
  billNo?: string
  supplierName?: string
  receiptNo?: string
  voucherNo?: string
}

export interface WhatsAppResult {
  success: boolean
  messageId?: string
  status?: string
  data?: any
  error?: string
  statusCode?: number
  details?: any
}

export interface UploadStatus {
  success: boolean
  message?: string
  cloudinary?: {
    cloud_name?: string
    api_key?: string
    configured: boolean
  }
  wasender?: {
    configured: boolean
    apiKey?: string
    baseUrl?: string
  }
  uploads?: {
    max_file_size?: string
    allowed_types?: string[]
  }
}

export interface TestResult {
  success: boolean
  message?: string
  status?: any
  error?: string
}

export class UploadService {

  /**
   * Upload PDF file to backend
   * @param pdfBlob - PDF blob to upload
   * @param fileName - Name for the file
   * @returns Promise<UploadResult>
   */
  static async uploadPDF(pdfBlob: Blob, fileName: string): Promise<UploadResult> {
    try {
      const formData = new FormData()
      formData.append('file', pdfBlob, fileName)

      const response = await axios.post<UploadResult>(`${API_BASE_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      return response.data
    } catch (error: any) {
      console.error('Upload error:', error)
      return {
        success: false,
        error: error.message || 'Network error during upload'
      }
    }
  }

  /**
   * Send PDF via WhatsApp
   * @param data - WhatsApp send data
   * @returns Promise<WhatsAppResult>
   */
  static async sendPDFViaWhatsApp(data: WhatsAppSendData): Promise<WhatsAppResult> {
    try {
      const response = await axios.post<WhatsAppResult>(`${API_BASE_URL}/upload/send-whatsapp`, data)

      return response.data
    } catch (error: any) {
      console.error('WhatsApp send error:', error)
      return {
        success: false,
        error: error.message || 'Network error during WhatsApp send'
      }
    }
  }

  /**
   * Get upload service status
   * @returns Promise<UploadStatus>
   */
  static async getUploadStatus(): Promise<UploadStatus> {
    try {
      const response = await axios.get<UploadStatus>(`${API_BASE_URL}/upload/status`)
      return response.data
    } catch (error: any) {
      console.error('Status check error:', error)
      return {
        success: false,
        message: error.message || 'Network error during status check'
      }
    }
  }

  /**
   * Test WhatsApp connection
   * @returns Promise<TestResult>
   */
  static async testWhatsAppConnection(): Promise<TestResult> {
    try {
      const response = await axios.get<TestResult>(`${API_BASE_URL}/upload/test-whatsapp`)
      return response.data
    } catch (error: any) {
      console.error('WhatsApp test error:', error)
      return {
        success: false,
        error: error.message || 'Network error during WhatsApp test'
      }
    }
  }

  /**
   * Generate PDF, upload, and send via WhatsApp in one go
   * @param pdfBlob - PDF blob
   * @param fileName - File name
   * @param whatsappData - WhatsApp send data
   * @returns Promise<WhatsAppResult>
   */
  static async uploadAndSendPDF(pdfBlob: Blob, fileName: string, whatsappData: WhatsAppSendData): Promise<WhatsAppResult> {
    try {
      // Step 1: Upload PDF
      const uploadResult = await this.uploadPDF(pdfBlob, fileName)
      if (!uploadResult.success) {
        return {
          success: false,
          error: uploadResult.error || 'Failed to upload PDF'
        }
      }

      // Step 2: Send via WhatsApp
      const whatsappResult = await this.sendPDFViaWhatsApp({
        ...whatsappData,
        documentUrl: uploadResult.url!,
        fileName: fileName
      })

      return whatsappResult
    } catch (error: any) {
      console.error('Upload and send error:', error)
      return {
        success: false,
        error: error.message || 'Failed to upload and send PDF'
      }
    }
  }

  /**
   * Helper method to create FormData from PDF blob
   * @param pdfBlob - PDF blob
   * @param fileName - File name
   * @returns FormData
   */
  static createFormDataFromBlob(pdfBlob: Blob, fileName: string): FormData {
    const formData = new FormData()
    formData.append('file', pdfBlob, fileName)
    return formData
  }

  /**
   * Format phone number for WhatsApp
   * @param phoneNumber - Raw phone number
   * @returns Formatted phone number
   */
  static formatPhoneNumber(phoneNumber: string): string {
    if (!phoneNumber) {
      throw new Error('Phone number is required')
    }

    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '')
    
    // If it doesn't start with country code, assume India (+91)
    if (cleaned.length === 10) {
      return `+91${cleaned}`
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return `+${cleaned}`
    } else if (phoneNumber.startsWith('+')) {
      return phoneNumber // Already formatted
    } else {
      return `+${cleaned}`
    }
  }

  /**
   * Generate default WhatsApp message based on document type
   * @param documentType - Type of document
   * @param fileName - File name
   * @returns Default message
   */
  static generateDefaultMessage(documentType: string, fileName: string): string {
    const messages = {
      'invoice': `📄 Invoice: ${fileName}\n\nPlease find your invoice attached.`,
      'purchase-bill': `📄 Purchase Bill: ${fileName}\n\nPlease find the purchase bill attached.`,
      'payment-receipt': `📄 Payment Receipt: ${fileName}\n\nPlease find your payment receipt attached.`,
      'payment-voucher': `📄 Payment Voucher: ${fileName}\n\nPlease find the payment voucher attached.`,
      'document': `📄 Document: ${fileName}\n\nPlease find the document attached.`
    }
    
    return messages[documentType as keyof typeof messages] || messages['document']
  }
}

export default UploadService
