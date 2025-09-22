import axios from 'axios'

// Upload Service for PDF upload and WhatsApp integration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-app-v43g.onrender.com'
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export interface UploadResult {
  success: boolean
  url?: string
  public_id?: string
  message?: string
  error?: string
  local?: boolean
  details?: any
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
    max_file_size_bytes?: number
    allowed_types?: string[]
    limits?: {
      files?: number
      fields?: number
    }
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
   * Test backend connection and get basic info
   * @returns Promise<{connected: boolean, info?: any}>
   */
  static async testBackendConnection(): Promise<{connected: boolean, info?: any}> {
    try {
      const response = await axios.get(`${API_BASE_URL}/upload/status`, {
        timeout: 5000
      });
      return {
        connected: true,
        info: response.data
      };
    } catch (error: any) {
      return {
        connected: false
      };
    }
  }

  /**
   * Check if file size is within limits before uploading
   * @param fileSize - Size of the file in bytes
   * @returns Object with validation result
   */
  static async validateFileSize(fileSize: number): Promise<{ isValid: boolean; error?: string; maxSize?: number }> {
    try {
      const status = await this.getUploadStatus()
      
      if (!status.success) {
        const defaultMaxSize = 50 * 1024 * 1024; // 50MB default
        return {
          isValid: fileSize <= defaultMaxSize,
          error: fileSize > defaultMaxSize ? `File size exceeds default limit of 50MB` : undefined,
          maxSize: defaultMaxSize
        }
      }
      
      const maxSizeBytes = status.uploads?.max_file_size_bytes || 50 * 1024 * 1024 // 50MB default
      
      if (fileSize > maxSizeBytes) {
        const maxSizeMB = Math.round(maxSizeBytes / (1024 * 1024))
        const fileSizeMB = Math.round(fileSize / (1024 * 1024))
        
        return {
          isValid: false,
          error: `File size (${fileSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`,
          maxSize: maxSizeBytes
        }
      }
      
      return {
        isValid: true,
        maxSize: maxSizeBytes
      }
    } catch (error) {
      console.error('File size validation error:', error)
      // Fallback to default validation
      const defaultMaxSize = 50 * 1024 * 1024; // 50MB default
      return {
        isValid: fileSize <= defaultMaxSize,
        error: fileSize > defaultMaxSize ? `File size exceeds default limit of 50MB` : undefined,
        maxSize: defaultMaxSize
      }
    }
  }

  /**
   * Upload PDF file to backend
   * @param pdfBlob - PDF blob to upload
   * @param fileName - Name for the file
   * @returns Promise<UploadResult>
   */
  static async uploadPDF(pdfBlob: Blob, fileName: string): Promise<UploadResult> {
    try {
      // Validate inputs
      if (!pdfBlob) {
        throw new Error('PDF blob is required')
      }
      
      if (!fileName) {
        throw new Error('File name is required')
      }

      // Check file size before uploading
      // Check if PDF blob is empty (indicates generation issue)
      if (pdfBlob.size === 0) {
        return {
          success: false,
          error: 'PDF blob is empty. This indicates an issue with PDF generation. Please try again.'
        }
      }
      
      const sizeValidation = await this.validateFileSize(pdfBlob.size)
      if (!sizeValidation.isValid) {
        return {
          success: false,
          error: sizeValidation.error || 'File size validation failed'
        }
      }

      // Ensure file has .pdf extension
      const fileNameWithExt = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`
      
      // Ensure the blob has the correct MIME type
      let blobToUpload = pdfBlob
      if (pdfBlob.type !== 'application/pdf') {
        blobToUpload = new Blob([pdfBlob], { type: 'application/pdf' })
      }
      
      const formData = new FormData()
      formData.append('file', blobToUpload, fileNameWithExt)

      const response = await axios.post<UploadResult>(`${API_BASE_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 second timeout for large files
      })

      return response.data
    } catch (error: any) {
      console.error('Upload error:', error)
      
      // Extract detailed error information
      let errorMessage = 'Network error during upload'
      let errorDetails = null
      
      if (error.response) {
        // Server responded with error status
        errorMessage = error.response.data?.error || error.response.data?.message || `Server error: ${error.response.status}`
        errorDetails = error.response.data
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'No response from server. Please check if the backend is running.'
      } else {
        // Something else happened
        errorMessage = error.message || 'Unknown error occurred'
      }
      
      return {
        success: false,
        error: errorMessage,
        details: errorDetails
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
      const response = await axios.post<WhatsAppResult>(`${API_BASE_URL}/upload/send-whatsapp`, data, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000, // 60 second timeout for WhatsApp API
      })

      return response.data
    } catch (error: any) {
      console.error('WhatsApp send error:', error)
      
      let errorMessage = 'Network error during WhatsApp send'
      let errorDetails = null
      
      if (error.response) {
        errorMessage = error.response.data?.error || error.response.data?.message || `Server error: ${error.response.status}`
        errorDetails = error.response.data
      } else if (error.request) {
        errorMessage = 'No response from server. Please check if the backend is running.'
      } else {
        errorMessage = error.message || 'Unknown error occurred'
      }
      
      return {
        success: false,
        error: errorMessage,
        details: errorDetails
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
   * Check WhatsApp configuration status
   * @returns Promise<{configured: boolean, error?: string}>
   */
  static async checkWhatsAppConfig(): Promise<{configured: boolean, error?: string}> {
    try {
      const status = await this.getUploadStatus();
      if (status.success && status.wasender?.configured) {
        return { configured: true };
      } else {
        return { 
          configured: false, 
          error: 'WASender API not configured. Please add WASENDER_API_KEY to environment variables.' 
        };
      }
    } catch (error: any) {
      return { 
        configured: false, 
        error: error.message || 'Failed to check WhatsApp configuration' 
      };
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
      // Test backend connection first
      const connectionTest = await this.testBackendConnection();
      if (!connectionTest.connected) {
        return {
          success: false,
          error: 'Backend server is not reachable. Please check if the server is running.'
        };
      }

      // Check WhatsApp configuration first
      const configCheck = await this.checkWhatsAppConfig();
      if (!configCheck.configured) {
        return {
          success: false,
          error: configCheck.error || 'WhatsApp not configured'
        };
      }

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