"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  Edit, 
  Trash2, 
  Loader2, 
  Calendar,
  User,
  Phone,
  FileText,
  ChevronLeft,
  ChevronRight,
  Eye
} from "lucide-react"
import { PaymentService, Payment, PaymentCreateData, PaymentFilters } from "@/services/payment"
import { partyService, Party } from "@/services/party"
import { toast } from "sonner"
import BasePDFGenerator from "@/services/basePDFGenerator"

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [parties, setParties] = useState<Party[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<PaymentCreateData>({
    type: 'payment-in',
    partyName: '',
    phoneNumber: '',
    amount: 0,
    date: new Date().toLocaleDateString('en-CA')
  })
  const [selectedParty, setSelectedParty] = useState<Party | null>(null)
  const [showPartyDropdown, setShowPartyDropdown] = useState(false)
  const [filteredParties, setFilteredParties] = useState<Party[]>([])

  // Transaction detail states
  const [isTransactionDetailOpen, setIsTransactionDetailOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [paymentDetail, setPaymentDetail] = useState<Payment | null>(null)
  const [loadingPaymentDetail, setLoadingPaymentDetail] = useState(false)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const paymentsPerPage = 10

  // Load payments and parties on component mount
  useEffect(() => {
    loadPayments()
    loadParties()
  }, [])

  // Load payments with current filters
  const loadPayments = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const filters: PaymentFilters = {}
      if (searchTerm) filters.search = searchTerm
      if (paymentTypeFilter !== 'all') filters.type = paymentTypeFilter
      
      const response = await PaymentService.getPayments(filters)
      setPayments(response.data || [])
    } catch (err: any) {
      setError(err.message || "Failed to load payments")
      toast.error("Failed to load payments")
    } finally {
      setLoading(false)
    }
  }

  // Load parties for autocomplete
  const loadParties = async () => {
    try {
      const response = await partyService.getParties()
      setParties(response.data || [])
    } catch (err) {
      console.error('Failed to load parties:', err)
    }
  }

  // Handle search and filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1) // Reset to first page when filters change
      loadPayments()
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchTerm, paymentTypeFilter])

  // Calculate pagination
  const totalPages = Math.ceil(payments.length / paymentsPerPage)
  const startIndex = (currentPage - 1) * paymentsPerPage
  const endIndex = startIndex + paymentsPerPage
  const currentPayments = payments.slice(startIndex, endIndex)

  // Calculate pagination window (show max 5 page numbers)
  const maxVisiblePages = 5
  const halfWindow = Math.floor(maxVisiblePages / 2)
  
  let startPage = Math.max(1, currentPage - halfWindow)
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
  
  // Adjust start page if we're near the end
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1)
  }
  
  const visiblePages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)

  // Handle form submission for adding new payment
  const handleAddPayment = async () => {
    try {
      const validation = PaymentService.validatePaymentData(formData)
      if (!validation.isValid) {
        toast.error(validation.errors.join(", "))
        return
      }

      setIsSubmitting(true)
      const response = await PaymentService.createPayment(formData)
      
      // Send PDF via WhatsApp
      try {
        const whatsappResult = await PaymentService.generateAndSendPDFViaWhatsApp(response.data)
        if (whatsappResult) {
          toast.success("PDF Generated and Sent Successfully!")
        } else {
          toast.success("Payment created successfully!")
        }
      } catch (whatsappError) {
        console.error('WhatsApp send error:', whatsappError)
        toast.success("Payment created successfully!")
      }
      
      setIsAddDialogOpen(false)
      resetForm()
      loadPayments()
    } catch (err: any) {
      toast.error(err.message || "Failed to create payment")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle form submission for editing payment
  const handleEditPayment = async () => {
    if (!editingPayment?.id) return

    try {
      const validation = PaymentService.validatePaymentData(formData)
      if (!validation.isValid) {
        toast.error(validation.errors.join(", "))
        return
      }

      setIsSubmitting(true)
      await PaymentService.updatePayment(editingPayment.id, formData)
      toast.success("Payment updated successfully")
      setIsEditDialogOpen(false)
      setEditingPayment(null)
      resetForm()
      loadPayments()
    } catch (err: any) {
      toast.error(err.message || "Failed to update payment")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle payment deletion
  const handleDeletePayment = async (payment: Payment) => {
    if (!payment.id) return

    if (!confirm(`Are you sure you want to delete payment ${payment.paymentNo}?`)) {
      return
    }

    try {
      await PaymentService.deletePayment(payment.id)
      toast.success("Payment deleted successfully")
      loadPayments()
    } catch (err: any) {
      toast.error(err.message || "Failed to delete payment")
    }
  }

  // Reset form data
  const resetForm = () => {
    setFormData({
      type: 'payment-in',
      partyName: '',
      phoneNumber: '',
      amount: 0,
      date: new Date().toLocaleDateString('en-CA')
    })
    setSelectedParty(null)
    setEditingPayment(null)
    setShowPartyDropdown(false)
    setFilteredParties([])
  }

  // Open edit dialog with payment data
  const openEditDialog = (payment: Payment) => {
    setEditingPayment(payment)
    setFormData({
      type: payment.type,
      partyName: payment.partyName,
      phoneNumber: payment.phoneNumber,
      amount: payment.amount,
      date: PaymentService.convertDateToFrontendFormat(payment.date)
    })
    
    // Find and set the selected party
    const party = parties.find(p => p.name === payment.partyName && p.phoneNumber === payment.phoneNumber)
    setSelectedParty(party || null)
    
    setIsEditDialogOpen(true)
  }

  const handleViewPayment = async (payment: Payment) => {
    try {
      setLoadingPaymentDetail(true)
      setSelectedPayment(payment)
      
      const detailResponse = await PaymentService.getPaymentById(payment.id!)
      
      if (detailResponse.success) {
        setPaymentDetail(detailResponse.data)
        setIsTransactionDetailOpen(true)
      } else {
        setError(detailResponse.error || 'Failed to load payment details')
        toast.error(detailResponse.error || 'Failed to load payment details')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load payment details')
      toast.error(err.message || 'Failed to load payment details')
    } finally {
      setLoadingPaymentDetail(false)
    }
  }

  // Party handling functions (simplified like sales page)
  const handlePartyNameChange = (value: string) => {
    setFormData(prev => ({ ...prev, partyName: value }))
    
    if (value.trim()) {
      const filtered = parties.filter(party => 
        party.name.toLowerCase().includes(value.toLowerCase()) ||
        party.phoneNumber.includes(value)
      )
      setFilteredParties(filtered)
      setShowPartyDropdown(true)
      
      // Update selected party if exact match found
      const exactMatch = parties.find(p => p.name === value)
      setSelectedParty(exactMatch || null)
    } else {
      setShowPartyDropdown(false)
      setFilteredParties([])
      setSelectedParty(null)
    }
  }

  const selectParty = (party: Party) => {
    setFormData(prev => ({
      ...prev,
      partyName: party.name,
      phoneNumber: party.phoneNumber
    }))
    setSelectedParty(party)
    setShowPartyDropdown(false)
    setFilteredParties([])
  }

  const handlePartyNameFocus = () => {
    if (formData.partyName.trim()) {
      const filtered = parties.filter(party => 
        party.name.toLowerCase().includes(formData.partyName.toLowerCase()) ||
        party.phoneNumber.includes(formData.partyName)
      )
      setFilteredParties(filtered)
      setShowPartyDropdown(true)
    }
  }

  const handlePartyNameBlur = () => {
    // Delay hiding dropdown to allow for click events
    setTimeout(() => {
      setShowPartyDropdown(false)
    }, 200)
  }

  // Get payment type color
  const getPaymentTypeColor = (type: string) => {
    return type === "payment-in" ? "text-green-600" : "text-red-600"
  }

  // Get payment type badge variant
  const getPaymentTypeBadge = (type: string) => {
    return type === "payment-in" ? "default" : "destructive"
  }

  // Get balance color coding
  const getBalanceColor = (balance: number) => {
    if (balance > 0) return "text-green-600" // Positive balance (green)
    if (balance < 0) return "text-red-600" // Negative balance (red)
    return "text-black" // Zero balance (black)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Management</h1>
          <p className="text-muted-foreground">
            Track and manage all payment transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
              if (!open) {
                // Only allow closing via Cancel button, not X button or outside click
                return;
              }
              setIsAddDialogOpen(open);
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Payment
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader className="space-y-0">
                <div className="flex items-center justify-between">
                  <DialogTitle>Add New Payment</DialogTitle>
                  {selectedParty && (
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Balance</div>
                      <div className={`text-lg font-semibold ${getBalanceColor(selectedParty.balance)}`}>
                        {selectedParty.balance > 0 ? '+' : ''}{PaymentService.formatCurrency(selectedParty.balance)}
                      </div>
                    </div>
                  )}
                </div>
                <DialogDescription>
                  Record a new payment transaction.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Type *
                  </Label>
                  <Select value={formData.type} onValueChange={(value: 'payment-in' | 'payment-out') => setFormData({ ...formData, type: value })}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="payment-in">Payment In</SelectItem>
                      <SelectItem value="payment-out">Payment Out</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="partyName" className="text-right">
                    Party Name *
                  </Label>
                  <div className="col-span-3 relative">
                    <Input
                      id="partyName"
                      value={formData.partyName}
                      onChange={(e) => handlePartyNameChange(e.target.value)}
                      onFocus={handlePartyNameFocus}
                      onBlur={handlePartyNameBlur}
                      placeholder="Type to search existing parties or enter new party name"
                      className="w-full"
                    />
                    
                    {/* Party Dropdown */}
                    {showPartyDropdown && filteredParties.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredParties.map((party) => (
                          <div
                            key={party._id}
                            onClick={() => selectParty(party)}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">{party.name}</div>
                            <div className={`text-sm font-medium ${getBalanceColor(party.balance)}`}>
                              Balance: {PaymentService.formatCurrency(Math.abs(party.balance))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* No parties found message */}
                    {showPartyDropdown && filteredParties.length === 0 && formData.partyName.trim() && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                        <div className="text-sm text-gray-500">
                          No existing party found. A new party will be created with this name.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phoneNumber" className="text-right">
                    Phone Number *
                  </Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="col-span-3"
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">
                    Amount *
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="col-span-3"
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    Date *
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddPayment} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Payment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={paymentTypeFilter} onValueChange={setPaymentTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="payment-in">Payment In</SelectItem>
            <SelectItem value="payment-out">Payment Out</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
          <CardDescription>
            Latest payment transactions and records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading payments...</span>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payments found. Try adjusting your search or filters.
            </div>
          ) : (
            <div className="space-y-4">
              {currentPayments.map((payment) => {
                return (
                  <div 
                    key={payment.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow cursor-pointer"
                    onClick={() => handleViewPayment(payment)}
                  >
                    {/* Desktop Layout */}
                    <div className="hidden md:flex items-center gap-3">
                      <div>
                        <h3 className="font-medium">{payment.partyName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {PaymentService.getPaymentTypeText(payment.type)}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {PaymentService.formatDate(payment.date)}
                          </span>
                          <span>Ref: {payment.paymentNo}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Mobile Layout */}
                    <div className="md:hidden flex items-center gap-3 flex-1">
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{payment.partyName}</h3>
                        <p className="text-xs text-muted-foreground">{PaymentService.formatDate(payment.date)}</p>
                      </div>
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-2">
                      <Badge variant={getPaymentTypeBadge(payment.type)}>
                        {PaymentService.getPaymentTypeText(payment.type)}
                      </Badge>
                      <div className={`text-lg font-semibold ${getPaymentTypeColor(payment.type)}`}>
                        {PaymentService.formatCurrency(payment.amount)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewPayment(payment)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditDialog(payment)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeletePayment(payment)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Mobile Actions */}
                    <div className="md:hidden flex items-center gap-1">
                      <Badge variant={getPaymentTypeBadge(payment.type)} className="text-xs">
                        {payment.type === "payment-in" ? "In" : "Out"}
                      </Badge>
                      <div className={`text-sm font-semibold ${getPaymentTypeColor(payment.type)}`}>
                        {PaymentService.formatCurrency(payment.amount)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      {payments.length > paymentsPerPage && (
        <div className="flex items-center justify-center mt-6 pt-4 border-t">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>
            <div className="flex items-center gap-1">
              {visiblePages.map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 p-0 border rounded-lg transition-colors ${
                    currentPage === page 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Edit Payment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          // Only allow closing via Cancel button, not X button or outside click
          return;
        }
        setIsEditDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="space-y-0">
            <div className="flex items-center justify-between">
              <DialogTitle>Edit Payment</DialogTitle>
              {selectedParty && (
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Balance</div>
                  <div className={`text-lg font-semibold ${getBalanceColor(selectedParty?.balance || 0)}`}>
                    {(selectedParty?.balance || 0) > 0 ? '+' : ''}{PaymentService.formatCurrency(selectedParty?.balance || 0)}
                  </div>
                </div>
              )}
            </div>
            <DialogDescription>
              Update payment information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-type" className="text-right">
                Type *
              </Label>
              <Select value={formData.type} onValueChange={(value: 'payment-in' | 'payment-out') => setFormData({ ...formData, type: value })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payment-in">Payment In</SelectItem>
                  <SelectItem value="payment-out">Payment Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-partyName" className="text-right">
                Party Name *
              </Label>
              <div className="col-span-3 relative">
                <Input
                  id="edit-partyName"
                  value={formData.partyName}
                  onChange={(e) => handlePartyNameChange(e.target.value)}
                  onFocus={handlePartyNameFocus}
                  onBlur={handlePartyNameBlur}
                  placeholder="Type to search existing parties or enter new party name"
                  className="w-full"
                />
                
                {/* Party Dropdown */}
                {showPartyDropdown && filteredParties.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredParties.map((party) => (
                      <div
                        key={party._id}
                        onClick={() => selectParty(party)}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{party.name}</div>
                        <div className={`text-sm font-medium ${getBalanceColor(party.balance)}`}>
                          Balance: {PaymentService.formatCurrency(Math.abs(party.balance))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* No parties found message */}
                {showPartyDropdown && filteredParties.length === 0 && formData.partyName.trim() && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                    <div className="text-sm text-gray-500">
                      No existing party found. A new party will be created with this name.
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-phoneNumber" className="text-right">
                Phone Number *
              </Label>
              <Input
                id="edit-phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="col-span-3"
                placeholder="+91 98765 43210"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-amount" className="text-right">
                Amount *
              </Label>
              <Input
                id="edit-amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="col-span-3"
                placeholder="0.00"
                min="0.01"
                step="0.01"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-date" className="text-right">
                Date *
              </Label>
              <Input
                id="edit-date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditPayment} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Detail Dialog */}
      <Dialog open={isTransactionDetailOpen} onOpenChange={setIsTransactionDetailOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              View complete payment information.
            </DialogDescription>
          </DialogHeader>
          {loadingPaymentDetail ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading payment details...</span>
            </div>
          ) : paymentDetail && selectedPayment ? (
            <div className="space-y-6">
              {/* Payment Header */}
              <div className={`flex items-center justify-between p-4 rounded-lg ${
                paymentDetail.type === 'payment-in' ? 'bg-emerald-50' : 'bg-red-50'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    paymentDetail.type === 'payment-in' ? 'bg-emerald-100' : 'bg-red-100'
                  }`}>
                    <svg className={`h-5 w-5 ${
                      paymentDetail.type === 'payment-in' ? 'text-emerald-600' : 'text-red-600'
                    }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {paymentDetail.type === 'payment-in' ? 'Receipt' : 'Voucher'} #{paymentDetail.paymentNo}
                    </h3>
                    <p className="text-sm text-muted-foreground">{paymentDetail.date}</p>
                  </div>
                </div>
                <Badge className={`${
                  paymentDetail.type === 'payment-in' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {paymentDetail.type === 'payment-in' ? 'Payment In' : 'Payment Out'}
                </Badge>
              </div>

              {/* Party Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Party Information</h4>
                <div className="grid gap-3 p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{paymentDetail.partyName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{paymentDetail.phoneNumber}</span>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Payment Information</h4>
                <div className="grid gap-3 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-semibold">₹{paymentDetail.amount.toLocaleString()}</span>
                  </div>
                  {paymentDetail.totalAmount && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Amount:</span>
                      <span className="font-semibold">₹{paymentDetail.totalAmount.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Total Amount */}
              <div className={`flex items-center justify-between p-4 rounded-lg ${
                paymentDetail.type === 'payment-in' ? 'bg-emerald-50' : 'bg-red-50'
              }`}>
                <span className="text-lg font-semibold">Total Amount:</span>
                <span className={`text-xl font-bold ${
                  paymentDetail.type === 'payment-in' ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  ₹{(paymentDetail.totalAmount || paymentDetail.amount).toLocaleString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Failed to load payment details</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTransactionDetailOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
