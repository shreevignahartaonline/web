// Company Model Interface based on backend documentation
export interface Company {
  id?: string
  businessName: string
  phoneNumber1: string
  phoneNumber2?: string
  emailId: string
  businessAddress: string
  pincode: string
  businessDescription: string
  createdAt?: string
  updatedAt?: string
}

export interface CompanyStatus {
  status: string
  message: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  details?: any[]
}

// Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// Company Service Class
export class CompanyService {
  private baseEndpoint = '/company'

  /**
   * Test connectivity to backend
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      return response.ok
    } catch (error) {
      return false
    }
  }

  /**
   * Get company information
   * GET /company/details
   */
  async getCompanyDetails(): Promise<ApiResponse<Company>> {
    try {
      const response = await fetch(`${API_BASE_URL}${this.baseEndpoint}/details`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      if (!response.ok) {
        throw {
          message: data.message || 'An error occurred',
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
   * Create or update company information
   * POST /company/details
   */
  async createOrUpdateCompany(companyData: Company): Promise<ApiResponse<Company>> {
    try {
      const response = await fetch(`${API_BASE_URL}${this.baseEndpoint}/details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(companyData),
      })
      
      const data = await response.json()
      if (!response.ok) {
        throw {
          message: data.message || 'An error occurred',
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
   * Update company information
   * PUT /company/details
   */
  async updateCompany(companyData: Company): Promise<ApiResponse<Company>> {
    try {
      const response = await fetch(`${API_BASE_URL}${this.baseEndpoint}/details`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(companyData),
      })
      
      const data = await response.json()
      if (!response.ok) {
        throw {
          message: data.message || 'An error occurred',
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
   * Delete company information
   * DELETE /company/details
   */
  async deleteCompany(): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_BASE_URL}${this.baseEndpoint}/details`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      if (!response.ok) {
        throw {
          message: data.message || 'An error occurred',
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
   * Get default company template
   * GET /company/details/default
   */
  async getDefaultCompanyTemplate(): Promise<ApiResponse<Company>> {
    try {
      const response = await fetch(`${API_BASE_URL}${this.baseEndpoint}/details/default`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      if (!response.ok) {
        throw {
          message: data.message || 'An error occurred',
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
   * Get service status
   * GET /company/status
   */
  async getCompanyStatus(): Promise<ApiResponse<CompanyStatus>> {
    try {
      const response = await fetch(`${API_BASE_URL}${this.baseEndpoint}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      if (!response.ok) {
        throw {
          message: data.message || 'An error occurred',
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
   * Upload company profile image
   * POST /upload (with company context)
   */
  async uploadProfileImage(file: File): Promise<ApiResponse<{ url: string }>> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('context', 'company-profile')
      
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      })
      
      const data = await response.json()
      if (!response.ok) {
        throw {
          message: data.message || 'An error occurred',
          status: response.status,
          details: data.details,
        }
      }
      
      return data
    } catch (error: any) {
      throw error
    }
  }
}

// Export singleton instance
export const companyService = new CompanyService()

// Export default
export default companyService