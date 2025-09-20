"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp,
  DollarSign,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  Eye,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  MapPin,
  FileText,
  Calendar,
  User,
  Share2,
  Printer,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { partyService, Party } from "@/services/party"
import { SaleService, Sale } from "@/services/sale"
import { PurchaseService, Purchase } from "@/services/purchase"
import { PaymentService, Payment } from "@/services/payment"

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [recentParties, setRecentParties] = useState<Party[]>([])
  const [allParties, setAllParties] = useState<Party[]>([])
  const [filteredParties, setFilteredParties] = useState<Party[]>([])
  const [partyStats, setPartyStats] = useState({
    totalParties: 0,
    customers: 0,
    suppliers: 0,
    totalBalance: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Dashboard data states
  const [allTransactions, setAllTransactions] = useState<any[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([])
  const [dashboardLoading, setDashboardLoading] = useState(false)
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("all")
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const transactionsPerPage = 10

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isTransactionDetailOpen, setIsTransactionDetailOpen] = useState(false)
  const [selectedParty, setSelectedParty] = useState<Party | null>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const [transactionDetail, setTransactionDetail] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingTransactionDetail, setLoadingTransactionDetail] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    address: "",
    balance: 0
  })
  const [formErrors, setFormErrors] = useState<string[]>([])

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setDashboardLoading(true)
      
      // Load all transaction types in parallel
      const [salesResponse, purchasesResponse, paymentsResponse, partiesResponse] = await Promise.all([
        SaleService.getSales(),
        PurchaseService.getPurchases(),
        PaymentService.getPayments(),
        partyService.getParties()
      ])

      // Combine all transactions
      const allTransactions: any[] = []

      // Add sales transactions
      if (salesResponse.success && salesResponse.data) {
        const sales = salesResponse.data.map(sale => ({
          id: sale.id,
          type: 'sale',
          transactionId: sale.invoiceNo,
          partyName: sale.partyName,
          phoneNumber: sale.phoneNumber,
          totalAmount: sale.totalAmount,
          date: sale.date,
          createdAt: sale.createdAt,
          items: sale.items
        }))
        allTransactions.push(...sales)
      }

      // Add purchase transactions
      if (purchasesResponse.success && purchasesResponse.data) {
        const purchases = purchasesResponse.data.map(purchase => ({
          id: purchase.id,
          type: 'purchase',
          transactionId: purchase.billNo,
          partyName: purchase.partyName,
          phoneNumber: purchase.phoneNumber,
          totalAmount: purchase.totalAmount,
          date: purchase.date,
          createdAt: purchase.createdAt,
          items: purchase.items
        }))
        allTransactions.push(...purchases)
      }

      // Add payment transactions
      if (paymentsResponse.success && paymentsResponse.data) {
        const payments = paymentsResponse.data.map(payment => ({
          id: payment.id,
          type: payment.type, // 'payment-in' or 'payment-out'
          transactionId: payment.paymentNo,
          partyName: payment.partyName,
          phoneNumber: payment.phoneNumber,
          totalAmount: payment.amount,
          date: payment.date,
          createdAt: payment.createdAt
        }))
        allTransactions.push(...payments)
      }

      // Sort all transactions by creation date (newest first)
      allTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      
      setAllTransactions(allTransactions)
      setFilteredTransactions(allTransactions)

      // Set parties data for party management
      if (partiesResponse.success && partiesResponse.data) {
        setAllParties(partiesResponse.data)
        setFilteredParties(partiesResponse.data)
        setRecentParties(partiesResponse.data.slice(0, 3))
        }
        
        // Load party stats
        const statsData = await partyService.getPartyStats()
        setPartyStats(statsData)
      
      } catch (err) {
      console.error("Failed to load dashboard data:", err)
      setError("Failed to load dashboard data")
      } finally {
      setDashboardLoading(false)
      }
    }

  // Load parties for dashboard
  useEffect(() => {
    loadDashboardData()
  }, [])

  // Filter transactions based on search term and type filter
  useEffect(() => {
    let filtered = allTransactions

    // Filter by transaction type
    if (transactionTypeFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === transactionTypeFilter)
    }

    // Filter by search term (party name)
    if (searchTerm.trim()) {
      filtered = filtered.filter(transaction =>
        transaction.partyName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredTransactions(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [allTransactions, searchTerm, transactionTypeFilter])

  // Calculate pagination
  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage)
  const startIndex = (currentPage - 1) * transactionsPerPage
  const endIndex = startIndex + transactionsPerPage
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex)

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

  // Filter parties based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredParties(allParties)
    } else {
      const filtered = allParties.filter(party =>
        party.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        party.phoneNumber.includes(searchTerm) ||
        (party.email && party.email.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setFilteredParties(filtered)
    }
  }, [searchTerm, allParties])

  // Party management functions
  const resetForm = () => {
    setFormData({
      name: "",
      phoneNumber: "",
      email: "",
      address: "",
      balance: 0
    })
    setFormErrors([])
  }

  const handleAddParty = () => {
    resetForm()
    setIsAddDialogOpen(true)
  }

  const handleEditParty = (party: Party) => {
    setFormData({
      name: party.name,
      phoneNumber: party.phoneNumber,
      email: party.email || "",
      address: party.address || "",
      balance: party.balance
    })
    setSelectedParty(party)
    setIsEditDialogOpen(true)
  }

  const handleViewParty = (party: Party) => {
    setSelectedParty(party)
    setIsViewDialogOpen(true)
  }

  const handleViewTransaction = async (transaction: any) => {
    try {
      setLoadingTransactionDetail(true)
      setSelectedTransaction(transaction)
      
      let detailResponse
      switch (transaction.type) {
        case 'sale':
          detailResponse = await SaleService.getSaleById(transaction.id)
          break
        case 'purchase':
          detailResponse = await PurchaseService.getPurchase(transaction.id)
          break
        case 'payment-in':
        case 'payment-out':
          detailResponse = await PaymentService.getPaymentById(transaction.id)
          break
        default:
          throw new Error('Unknown transaction type')
      }
      
      if (detailResponse.success) {
        setTransactionDetail(detailResponse.data)
        setIsTransactionDetailOpen(true)
      } else {
        setError(detailResponse.message || 'Failed to load transaction details')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load transaction details')
    } finally {
      setLoadingTransactionDetail(false)
    }
  }

  const handleDeleteParty = async (party: Party) => {
    if (!confirm(`Are you sure you want to delete ${party.name}?`)) {
      return
    }

    try {
      const response = await partyService.deleteParty(party._id!)
      if (response.success) {
        await loadParties()
      } else {
        setError(response.error || "Failed to delete party")
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while deleting party")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormErrors([])

    // Validate form data
    const validation = partyService.validatePartyData(formData)
    if (!validation.isValid) {
      setFormErrors(validation.errors)
      setIsSubmitting(false)
      return
    }

    try {
      const sanitizedData = {
        ...formData,
        phoneNumber: partyService.sanitizePhoneNumber(formData.phoneNumber)
      }

      let response
      if (isAddDialogOpen) {
        response = await partyService.createParty(sanitizedData)
      } else {
        response = await partyService.updateParty(selectedParty!._id!, sanitizedData)
      }

      if (response.success) {
        await loadParties()
        setIsAddDialogOpen(false)
        setIsEditDialogOpen(false)
        resetForm()
      } else {
        setFormErrors([response.error || "Failed to save party"])
      }
    } catch (err: any) {
      setFormErrors([err.message || "An error occurred while saving party"])
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Helper functions for transaction display
  const getTransactionTypeInfo = (type: string) => {
    switch (type) {
      case 'sale':
        return {
          label: 'Sale',
          icon: ShoppingCart,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        }
      case 'purchase':
        return {
          label: 'Purchase',
          icon: Package,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        }
      case 'payment-in':
        return {
          label: 'Payment In',
          icon: DollarSign,
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200'
        }
      case 'payment-out':
        return {
          label: 'Payment Out',
          icon: DollarSign,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        }
      default:
        return {
          label: 'Transaction',
          icon: FileText,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        }
    }
  }

  const loadParties = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await partyService.getParties()
      if (response.success && response.data) {
        setAllParties(response.data)
        setFilteredParties(response.data)
        setRecentParties(response.data.slice(0, 3))
      } else {
        setError(response.error || "Failed to load parties")
      }
      
      // Load party stats
      const statsData = await partyService.getPartyStats()
      setPartyStats(statsData)
    } catch (err: any) {
      setError(err.message || "An error occurred while loading parties")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="party">Party</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">All Transactions</h1>
              <p className="text-muted-foreground">
                View all sales, purchases, and payment transactions
                {filteredTransactions.length > 0 && (
                  <span className="ml-2 text-sm">
                    (Showing {startIndex + 1}-{Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length} transactions)
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Search and Filter Controls */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by party name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="sale">Sales</SelectItem>
                <SelectItem value="purchase">Purchases</SelectItem>
                <SelectItem value="payment-in">Payment In</SelectItem>
                <SelectItem value="payment-out">Payment Out</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transactions List */}
          <div className="space-y-4">
            {dashboardLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading transactions...</span>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No transactions found</h3>
                <p className="text-muted-foreground">
                  Start by creating your first sale, purchase, or payment transaction.
                </p>
          </div>
            ) : (
              <div className="space-y-4">
                {currentTransactions.map((transaction) => {
                  const typeInfo = getTransactionTypeInfo(transaction.type)
                  const IconComponent = typeInfo.icon
                  
                  return (
                    <Card 
                      key={transaction.id} 
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleViewTransaction(transaction)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Row 1: Transaction ID and Badge */}
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              {transaction.type === 'sale' 
                                ? `INV-${transaction.transactionId}`
                                : transaction.type === 'purchase'
                                ? `BILL-${transaction.transactionId}`
                                : transaction.transactionId
                              }
                            </p>
                            <Badge 
                              variant="outline" 
                              className={`${
                                transaction.type === 'sale' 
                                  ? 'border-green-500 text-green-700 bg-green-50' 
                                  : transaction.type === 'purchase'
                                  ? 'border-blue-500 text-blue-700 bg-blue-50'
                                  : transaction.type === 'payment-in'
                                  ? 'border-emerald-500 text-emerald-700 bg-emerald-50'
                                  : 'border-red-500 text-red-700 bg-red-50'
                              }`}
                            >
                              {transaction.type === 'sale' 
                                ? 'Sale' 
                                : transaction.type === 'purchase'
                                ? 'Purchase'
                                : transaction.type === 'payment-in'
                                ? 'Payment In'
                                : 'Payment Out'
                              }
                            </Badge>
                          </div>
                          
                          {/* Row 2: Party Name and Amount */}
                          <div className="flex items-center justify-between">
                            <p className="text-base font-medium">{transaction.partyName}</p>
                            <p className="text-lg font-semibold">
                              ₹{transaction.totalAmount.toLocaleString()}
                            </p>
                          </div>
                          
                          {/* Row 3: Share/Print Icons and Date */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <button 
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Share"
                              >
                                <Share2 className="h-4 w-4 text-muted-foreground" />
                              </button>
                              <button 
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Print"
                              >
                                <Printer className="h-4 w-4 text-muted-foreground" />
                              </button>
                            </div>
                            <p className="text-sm text-muted-foreground">{transaction.date}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
                      </div>
                    )}
          </div>

          {/* Pagination Controls */}
          {filteredTransactions.length > transactionsPerPage && (
            <div className="flex items-center justify-center mt-6 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">Previous</span>
                </Button>
                <div className="flex items-center gap-1">
                  {visiblePages.map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <span className="hidden sm:inline mr-1">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Party Tab */}
        <TabsContent value="party" className="space-y-6">
          {/* Party Header */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Party Management</h2>
              <p className="text-muted-foreground">
                Manage your customers and suppliers
              </p>
            </div>
            
            {/* Desktop Layout */}
            <div className="hidden md:flex items-center justify-between">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search parties..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button onClick={handleAddParty}>
                <Plus className="mr-2 h-4 w-4" />
                Add Party
              </Button>
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search parties..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              <Button onClick={handleAddParty} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Party
              </Button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}


          {/* Party List */}
          <Card>
            <CardHeader>
              <CardTitle>Parties ({filteredParties.length})</CardTitle>
              <CardDescription>
                {searchTerm ? `Search results for "${searchTerm}"` : "All customers and suppliers"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : filteredParties.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? "No parties found matching your search." : "No parties found. Add your first party to get started."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredParties.map((party) => (
                    <div key={party._id} className="border rounded-lg hover:bg-muted/50 transition-colors">
                      {/* Desktop Layout */}
                      <div className="hidden md:flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium">{party.name}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {party.phoneNumber}
                              </span>
                              {party.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {party.email}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            className={`${
                              party.balance > 0 
                                ? "bg-green-100 text-green-800 hover:bg-green-200" 
                                : party.balance < 0 
                                ? "bg-red-100 text-red-800 hover:bg-red-200" 
                                : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                            }`}
                          >
                            {partyService.formatBalance(party.balance)}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewParty(party)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditParty(party)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteParty(party)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Mobile Layout */}
                      <div className="md:hidden p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="h-4 w-4 text-primary" />
                            </div>
                            <h3 className="font-medium text-sm">{party.name}</h3>
                          </div>
                          <Badge 
                            className={`text-xs ${
                              party.balance > 0 
                                ? "bg-green-100 text-green-800 hover:bg-green-200" 
                                : party.balance < 0 
                                ? "bg-red-100 text-red-800 hover:bg-red-200" 
                                : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                            }`}
                          >
                            {partyService.formatBalance(party.balance)}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditParty(party)}
                            className="text-primary"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteParty(party)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Party Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Party</DialogTitle>
            <DialogDescription>
              Create a new customer or supplier party.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter party name"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                  placeholder="+91 98765 43210"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="party@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Enter party address"
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="balance">Opening Balance</Label>
                <Input
                  id="balance"
                  type="number"
                  value={formData.balance}
                  onChange={(e) => handleInputChange("balance", parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>
            {formErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside">
                    {formErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Party
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Party Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Party</DialogTitle>
            <DialogDescription>
              Update party information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter party name"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-phoneNumber">Phone Number *</Label>
                <Input
                  id="edit-phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                  placeholder="+91 98765 43210"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="party@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-address">Address</Label>
                <Textarea
                  id="edit-address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Enter party address"
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-balance">Balance</Label>
                <Input
                  id="edit-balance"
                  type="number"
                  value={formData.balance}
                  onChange={(e) => handleInputChange("balance", parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>
            {formErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside">
                    {formErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Party
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Party Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Party Details</DialogTitle>
            <DialogDescription>
              View complete party information.
            </DialogDescription>
          </DialogHeader>
          {selectedParty && (
            <div className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedParty.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Created: {new Date(selectedParty.createdAt!).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="grid gap-3">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedParty.phoneNumber}</span>
                  </div>
                  
                  {selectedParty.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedParty.email}</span>
                    </div>
                  )}
                  
                  {selectedParty.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="text-sm">{selectedParty.address}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <Badge 
                      className={`${
                        selectedParty.balance > 0 
                          ? "bg-green-100 text-green-800 hover:bg-green-200" 
                          : selectedParty.balance < 0 
                          ? "bg-red-100 text-red-800 hover:bg-red-200" 
                          : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                      }`}
                    >
                      {partyService.formatBalance(selectedParty.balance)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsViewDialogOpen(false)
              handleEditParty(selectedParty!)
            }}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Party
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Detail Dialog */}
      <Dialog open={isTransactionDetailOpen} onOpenChange={setIsTransactionDetailOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              View complete transaction information.
            </DialogDescription>
          </DialogHeader>
          {loadingTransactionDetail ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading transaction details...</span>
            </div>
          ) : transactionDetail && selectedTransaction ? (
            <div className="space-y-6">
              {/* Transaction Header */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedTransaction.type === 'sale' 
                      ? 'bg-green-100' 
                      : selectedTransaction.type === 'purchase'
                      ? 'bg-blue-100'
                      : selectedTransaction.type === 'payment-in'
                      ? 'bg-emerald-100'
                      : 'bg-red-100'
                  }`}>
                    {selectedTransaction.type === 'sale' && <ShoppingCart className="h-5 w-5 text-green-600" />}
                    {selectedTransaction.type === 'purchase' && <Package className="h-5 w-5 text-blue-600" />}
                    {(selectedTransaction.type === 'payment-in' || selectedTransaction.type === 'payment-out') && <DollarSign className="h-5 w-5 text-emerald-600" />}
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {selectedTransaction.type === 'sale' 
                        ? `Invoice #${transactionDetail.invoiceNo}`
                        : selectedTransaction.type === 'purchase'
                        ? `Bill #${transactionDetail.billNo}`
                        : `${selectedTransaction.type === 'payment-in' ? 'Receipt' : 'Voucher'} #${transactionDetail.paymentNo}`
                      }
                    </h3>
                    <p className="text-sm text-muted-foreground">{transactionDetail.date}</p>
                  </div>
                </div>
                <Badge 
                  className={`${
                    selectedTransaction.type === 'sale' 
                      ? 'bg-green-100 text-green-800' 
                      : selectedTransaction.type === 'purchase'
                      ? 'bg-blue-100 text-blue-800'
                      : selectedTransaction.type === 'payment-in'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selectedTransaction.type === 'sale' 
                    ? 'Sale' 
                    : selectedTransaction.type === 'purchase'
                    ? 'Purchase'
                    : selectedTransaction.type === 'payment-in'
                    ? 'Payment In'
                    : 'Payment Out'
                  }
                </Badge>
              </div>

              {/* Party Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Party Information</h4>
                <div className="grid gap-3 p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{transactionDetail.partyName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{transactionDetail.phoneNumber}</span>
                  </div>
                </div>
              </div>

              {/* Items (for Sales and Purchases) */}
              {(selectedTransaction.type === 'sale' || selectedTransaction.type === 'purchase') && transactionDetail.items && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Items</h4>
                  <div className="space-y-2">
                    {transactionDetail.items.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{item.itemName}</p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.quantity.toLocaleString()} kg | Rate: ₹{item.rate.toLocaleString()}
                          </p>
                        </div>
                        <p className="font-semibold">₹{item.total.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Information (for Payments) */}
              {(selectedTransaction.type === 'payment-in' || selectedTransaction.type === 'payment-out') && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Payment Information</h4>
                  <div className="grid gap-3 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-semibold">₹{transactionDetail.amount.toLocaleString()}</span>
                    </div>
                    {transactionDetail.totalAmount && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Total Amount:</span>
                        <span className="font-semibold">₹{transactionDetail.totalAmount.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Total Amount */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <span className="text-lg font-semibold">Total Amount:</span>
                <span className="text-xl font-bold">
                  ₹{(transactionDetail.totalAmount || transactionDetail.amount).toLocaleString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Failed to load transaction details</p>
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