"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Building2, Save, AlertCircle, CheckCircle, Trash2, Edit } from "lucide-react"
import { companyService, Company } from "@/services/company"
import { toast } from "sonner"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

export default function CompanyPage() {
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Company>({
    businessName: "",
    phoneNumber1: "",
    phoneNumber2: "",
    emailId: "",
    businessAddress: "",
    pincode: "",
    businessDescription: ""
  })

  // Load company details on component mount
  useEffect(() => {
    loadCompanyDetails()
  }, [])

  const loadCompanyDetails = async () => {
    try {
      setLoading(true)
      
      const isConnected = await companyService.testConnection()
      if (!isConnected) {
        toast.error('Cannot connect to backend server. Please check if the server is running.')
        return
      }
      
      try {
        const response = await companyService.getCompanyDetails()
        
        if (response.success && response.data) {
          setCompany(response.data)
          setFormData(response.data)
        } else {
          const defaultResponse = await companyService.getDefaultCompanyTemplate()
          if (defaultResponse.success && defaultResponse.data) {
            setFormData(defaultResponse.data)
          }
        }
      } catch (companyError: any) {
        if (companyError?.status === 404) {
          try {
            const defaultResponse = await companyService.getDefaultCompanyTemplate()
            if (defaultResponse.success && defaultResponse.data) {
              setFormData(defaultResponse.data)
            }
          } catch (defaultError) {
            // Keep the empty form data as is
          }
        } else {
          throw companyError
        }
      }
    } catch (error) {
      try {
        const defaultResponse = await companyService.getDefaultCompanyTemplate()
        if (defaultResponse.success && defaultResponse.data) {
          setFormData(defaultResponse.data)
        }
      } catch (defaultError) {
        // Keep the empty form data as is
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof Company, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      const response = company 
        ? await companyService.updateCompany(formData)
        : await companyService.createOrUpdateCompany(formData)

      if (response.success) {
        setCompany(response.data || null)
        setIsEditing(false)
        toast.success('Company details saved successfully!')
      } else {
        const errorMessage = response.message || 'Failed to save company details'
        toast.error(errorMessage)
      }
    } catch (error: any) {
      const errorMessage = error?.message || error?.error || 'Failed to save company details'
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }


  const handleDeleteCompany = async () => {
    try {
      setDeleting(true)
      const response = await companyService.deleteCompany()
      
      if (response.success) {
        setCompany(null)
        setFormData({
          businessName: "",
          phoneNumber1: "",
          phoneNumber2: "",
          emailId: "",
          businessAddress: "",
          pincode: "",
          businessDescription: ""
        })
        setIsEditing(false)
        toast.success('Company details deleted successfully!')
      } else {
        const errorMessage = response.message || 'Failed to delete company details'
        toast.error(errorMessage)
      }
    } catch (error: any) {
      const errorMessage = error?.message || error?.error || 'Failed to delete company details'
      toast.error(errorMessage)
    } finally {
      setDeleting(false)
    }
  }

  const handleCancelEdit = () => {
    if (company) {
      setFormData(company)
    } else {
      setFormData({
        businessName: "",
        phoneNumber1: "",
        phoneNumber2: "",
        emailId: "",
        businessAddress: "",
        pincode: "",
        businessDescription: ""
      })
    }
    setIsEditing(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading company details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Company Settings</h1>
          <p className="text-muted-foreground">
            Manage your business information and settings
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {company && (
            <Badge variant="outline" className="text-sm">
              <CheckCircle className="mr-1 h-3 w-3" />
              Configured
            </Badge>
          )}
          <Button
            variant={isEditing ? "outline" : "default"}
            onClick={() => setIsEditing(!isEditing)}
            disabled={saving || deleting}
          >
            <Edit className="mr-2 h-4 w-4" />
            {isEditing ? "Cancel" : "Edit"}
          </Button>
          {company && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={saving || deleting} className="text-white">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Company Details</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete all company details? This action cannot be undone.
                    This will remove all business information including logo, contact details, and settings.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteCompany}
                    disabled={deleting}
                    className="bg-destructive text-white hover:bg-destructive/90"
                  >
                    {deleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Company
                      </>
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Company Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Business Information
          </CardTitle>
          <CardDescription>
            Update your company details and business information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Business Name */}
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name *</Label>
            <Input
              id="businessName"
              value={formData.businessName}
              onChange={(e) => handleInputChange('businessName', e.target.value)}
              disabled={!isEditing}
              placeholder="Enter your business name"
            />
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber1">Primary Phone Number *</Label>
              <Input
                id="phoneNumber1"
                value={formData.phoneNumber1}
                onChange={(e) => handleInputChange('phoneNumber1', e.target.value)}
                disabled={!isEditing}
                placeholder="+91 98765 43210"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber2">Secondary Phone Number</Label>
              <Input
                id="phoneNumber2"
                value={formData.phoneNumber2}
                onChange={(e) => handleInputChange('phoneNumber2', e.target.value)}
                disabled={!isEditing}
                placeholder="+91 87654 32109"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="emailId">Email Address *</Label>
            <Input
              id="emailId"
              type="email"
              value={formData.emailId}
              onChange={(e) => handleInputChange('emailId', e.target.value)}
              disabled={!isEditing}
              placeholder="business@example.com"
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="businessAddress">Business Address *</Label>
            <Textarea
              id="businessAddress"
              value={formData.businessAddress}
              onChange={(e) => handleInputChange('businessAddress', e.target.value)}
              disabled={!isEditing}
              placeholder="Enter your complete business address"
              rows={3}
            />
          </div>

          {/* Pincode */}
          <div className="space-y-2">
            <Label htmlFor="pincode">Pincode *</Label>
            <Input
              id="pincode"
              value={formData.pincode}
              onChange={(e) => handleInputChange('pincode', e.target.value)}
              disabled={!isEditing}
              placeholder="123456"
              maxLength={6}
            />
          </div>

          {/* Business Description */}
          <div className="space-y-2">
            <Label htmlFor="businessDescription">Business Description *</Label>
            <Textarea
              id="businessDescription"
              value={formData.businessDescription}
              onChange={(e) => handleInputChange('businessDescription', e.target.value)}
              disabled={!isEditing}
              placeholder="Describe your business activities"
              rows={4}
            />
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleCancelEdit} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Service Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            <p>• Company information is used for generating invoices and bills</p>
            <p>• All fields are optional - fill in what you need</p>
            <p>• Phone numbers can be in any format</p>
            <p>• Business description helps identify your company's activities</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
