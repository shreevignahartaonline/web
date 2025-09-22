'use client'

import React, { useState, useEffect } from 'react'
import { PurchaseService, Purchase, PurchaseCreateData, PurchaseItem } from '../../services/purchase'
import { partyService, Party } from '../../services/party'
import { itemService, Item } from '../../services/item'
import { Edit, Trash2, ChevronLeft, ChevronRight, Eye, Loader2 } from 'lucide-react'
import BasePDFGenerator from '../../services/basePDFGenerator'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface PurchaseFormData {
  billNo: string
  partyName: string
  phoneNumber: string
  items: PurchaseItemFormData[]
  date: string
}

interface PurchaseItemFormData {
  id: string
  itemName: string
  quantity: string | number
  rate: string | number
  total: number
}

const PurchasePage: React.FC = () => {
  // State management
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [parties, setParties] = useState<Party[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  
  // Form states
  const [showForm, setShowForm] = useState(false)
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null)
  const [showPartyDropdown, setShowPartyDropdown] = useState(false)
  const [filteredParties, setFilteredParties] = useState<Party[]>([])
  const [itemSearchQuery, setItemSearchQuery] = useState('')
  const [filteredItems, setFilteredItems] = useState<Item[]>([])
  const [showItemSearchBar, setShowItemSearchBar] = useState(false)
  
  // Bulk selection states
  const [selectedPurchases, setSelectedPurchases] = useState<string[]>([])
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Transaction detail states
  const [isTransactionDetailOpen, setIsTransactionDetailOpen] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [purchaseDetail, setPurchaseDetail] = useState<Purchase | null>(null)
  const [loadingPurchaseDetail, setLoadingPurchaseDetail] = useState(false)
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const purchasesPerPage = 10
  const [formData, setFormData] = useState<PurchaseFormData>({
    billNo: '',
    partyName: '',
    phoneNumber: '',
    items: [],
    date: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD format
  })
  

  // Load initial data
  useEffect(() => {
    loadPurchases()
    
    // Test items loading separately
    const testItemsLoad = async () => {
      try {
        console.log('Testing items load...')
        const itemsTest = await itemService.getItems()
        console.log('Items test result:', itemsTest)
      } catch (err) {
        console.error('Items test error:', err)
      }
    }
    
    testItemsLoad()
  }, [])

  const loadPurchases = async () => {
    try {
      setLoading(true)
      console.log('Loading data...')
      
      const [purchasesResponse, partiesResponse, itemsResponse] = await Promise.all([
        PurchaseService.getPurchases(),
        partyService.getParties(),
        itemService.getItems()
      ])
      
      console.log('Purchases response:', purchasesResponse)
      console.log('Parties response:', partiesResponse)
      console.log('Items response:', itemsResponse)
      
      setPurchases(purchasesResponse.data)
      setParties(partiesResponse.data || [])
      setItems(itemsResponse.data || [])
    } catch (err) {
      console.error('Error loading data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }


  const handleCreatePurchase = async () => {
    try {
      setError(null)
      setIsCreating(true)
      
      // Validate bill number
      if (!formData.billNo.trim()) {
        setError('Bill number is required')
        return
      }
      
      // Check if bill number already exists
      const billExists = await checkBillNumberExists(formData.billNo)
      if (billExists) {
        setError('Bill number already exists. Please use a different bill number.')
        return
      }
      
      // Basic validation
      if (!formData.partyName.trim()) {
        setError('Party name is required')
        return
      }
      if (!formData.phoneNumber.trim()) {
        setError('Phone number is required')
        return
      }
      if (!formData.date.trim()) {
        setError('Date is required')
        return
      }
      if (formData.items.length === 0) {
        setError('At least one item is required')
        return
      }

      const purchaseData = {
        ...formData,
        date: formData.date,
        items: formData.items.map(item => ({
          ...item,
          quantity: typeof item.quantity === 'string' ? parseFloat(item.quantity) || 0 : item.quantity,
          rate: typeof item.rate === 'string' ? parseFloat(item.rate) || 0 : item.rate
        }))
      }

      const response = await PurchaseService.createPurchase(purchaseData)
      setPurchases(prev => [response.data, ...prev])
      
      // Send PDF via WhatsApp
      try {
        const whatsappResult = await PurchaseService.generateAndSendPDFViaWhatsApp(response.data)
        if (whatsappResult) {
          setSuccess('Purchase bill created and sent to party via WhatsApp!')
        } else {
          setSuccess('Purchase created successfully!')
        }
      } catch (whatsappError) {
        console.error('WhatsApp send error:', whatsappError)
        setSuccess('Purchase created successfully!')
      }
      
      resetForm()
      setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create purchase')
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdatePurchase = async () => {
    if (!editingPurchase) return
    
    try {
      setError(null)
      
      // Basic validation
      if (!formData.partyName.trim()) {
        setError('Party name is required')
        return
      }
      if (!formData.phoneNumber.trim()) {
        setError('Phone number is required')
        return
      }
      if (!formData.date.trim()) {
        setError('Date is required')
        return
      }
      if (formData.items.length === 0) {
        setError('At least one item is required')
        return
      }

      const purchaseData = {
        ...formData,
        date: formData.date,
        items: formData.items.map(item => ({
          ...item,
          quantity: typeof item.quantity === 'string' ? parseFloat(item.quantity) || 0 : item.quantity,
          rate: typeof item.rate === 'string' ? parseFloat(item.rate) || 0 : item.rate
        }))
      }

      const response = await PurchaseService.updatePurchase(editingPurchase.id!, purchaseData)
      setPurchases(prev => prev.map(purchase => purchase.id === editingPurchase.id ? response.data : purchase))
      setSuccess('Purchase updated successfully!')
      resetForm()
      setShowForm(false)
      setEditingPurchase(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update purchase')
    }
  }

  const handleDeletePurchase = async (id: string) => {
    if (!confirm('Are you sure you want to delete this purchase?')) return
    
    try {
      await PurchaseService.deletePurchase(id)
      setPurchases(prev => prev.filter(purchase => purchase.id !== id))
      setSuccess('Purchase deleted successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete purchase')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedPurchases.length === 0) return
    
    const confirmMessage = `Are you sure you want to delete ${selectedPurchases.length} purchase(s)? This action cannot be undone.`
    if (!confirm(confirmMessage)) return
    
    try {
      setIsDeleting(true)
      const result = await PurchaseService.deletePurchases(selectedPurchases)
      
      if (result.success) {
        setPurchases(prev => prev.filter(purchase => !selectedPurchases.includes(purchase.id!)))
        setSuccess(`${result.deletedCount} purchases deleted successfully!`)
        setSelectedPurchases([])
        setIsSelectMode(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete purchases')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSelectPurchase = (purchaseId: string) => {
    setSelectedPurchases(prev => 
      prev.includes(purchaseId) 
        ? prev.filter(id => id !== purchaseId)
        : [...prev, purchaseId]
    )
  }

  const handleSelectAll = () => {
    if (selectedPurchases.length === currentPurchases.length) {
      setSelectedPurchases([])
    } else {
      setSelectedPurchases(currentPurchases.map(purchase => purchase.id!))
    }
  }

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode)
    setSelectedPurchases([])
  }

  const handleEditPurchase = (purchase: Purchase) => {
    setEditingPurchase(purchase)
    
    // Convert date from MM/DD/YYYY to YYYY-MM-DD for the date input
    let formattedDate = purchase.date
    if (purchase.date.includes('/')) {
      const dateParts = purchase.date.split('/')
      formattedDate = `${dateParts[2]}-${dateParts[0].padStart(2, '0')}-${dateParts[1].padStart(2, '0')}`
    }
    
    setFormData({
      billNo: purchase.billNo,
      partyName: purchase.partyName,
      phoneNumber: purchase.phoneNumber,
      items: purchase.items,
      date: formattedDate
    })
    setShowForm(true)
  }

  const handleViewPurchase = async (purchase: Purchase) => {
    try {
      setLoadingPurchaseDetail(true)
      setSelectedPurchase(purchase)
      
      const detailResponse = await PurchaseService.getPurchase(purchase.id!)
      
      if (detailResponse.success) {
        setPurchaseDetail(detailResponse.data)
        setIsTransactionDetailOpen(true)
      } else {
        setError(detailResponse.message || 'Failed to load purchase details')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load purchase details')
    } finally {
      setLoadingPurchaseDetail(false)
    }
  }

  const resetForm = () => {
    setFormData({
      billNo: '',
      partyName: '',
      phoneNumber: '',
      items: [],
      date: new Date().toLocaleDateString('en-CA')
    })
    setEditingPurchase(null)
    setShowPartyDropdown(false)
    setFilteredParties([])
    setItemSearchQuery('')
    setFilteredItems([])
    setShowItemSearchBar(false)
  }

  const addItem = () => {
    setShowItemSearchBar(true)
    setItemSearchQuery('')
    setFilteredItems([])
  }

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }


  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.total, 0)
  }

  // Calculate pagination
  const totalPages = Math.ceil(purchases.length / purchasesPerPage)
  const startIndex = (currentPage - 1) * purchasesPerPage
  const endIndex = startIndex + purchasesPerPage
  const currentPurchases = purchases.slice(startIndex, endIndex)

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

  // Helper function to check if bill number already exists
  const checkBillNumberExists = async (billNo: string): Promise<boolean> => {
    try {
      return await PurchaseService.isBillNumberExists(billNo)
    } catch (error) {
      console.error('Error checking bill number:', error)
      return false
    }
  }

  // Party handling functions
  const handlePartyNameChange = (value: string) => {
    setFormData(prev => ({ ...prev, partyName: value }))
    
    if (value.trim()) {
      const filtered = parties.filter(party => 
        party.name.toLowerCase().includes(value.toLowerCase()) ||
        party.phoneNumber.includes(value)
      )
      setFilteredParties(filtered)
      setShowPartyDropdown(true)
    } else {
      setShowPartyDropdown(false)
      setFilteredParties([])
    }
  }

  const selectParty = (party: Party) => {
    setFormData(prev => ({
      ...prev,
      partyName: party.name,
      phoneNumber: party.phoneNumber
    }))
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

  // Item handling functions
  const handleItemSearch = (query: string) => {
    setItemSearchQuery(query)
    
    console.log('Searching items with query:', query)
    console.log('Available items:', items)
    
    if (query.trim()) {
      const filtered = items.filter(item => 
        item.productName.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      )
      console.log('Filtered items:', filtered)
      setFilteredItems(filtered)
    } else {
      setFilteredItems([])
    }
  }

  const selectItem = (item: Item) => {
    // Add the selected item to the form
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        id: item._id || '',
        itemName: item.productName,
        quantity: '',
        rate: '',
        total: 0
      }]
    }))
    
    // Reset search but keep search bar open
    setItemSearchQuery('')
    setFilteredItems([])
    // Keep showItemSearchBar as true so search bar stays visible
  }

  const updateItemQuantity = (index: number, quantity: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const quantityNum = typeof quantity === 'string' ? parseFloat(quantity) || 0 : quantity
          const rateNum = typeof item.rate === 'string' ? parseFloat(item.rate) || 0 : item.rate
          const updatedItem = { ...item, quantity, total: quantityNum * rateNum }
          return updatedItem
        }
        return item
      })
    }))
  }

  const updateItemRate = (index: number, rate: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const rateNum = typeof rate === 'string' ? parseFloat(rate) || 0 : rate
          const quantityNum = typeof item.quantity === 'string' ? parseFloat(item.quantity) || 0 : item.quantity
          const updatedItem = { ...item, rate, total: quantityNum * rateNum }
          return updatedItem
        }
        return item
      })
    }))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-xl md:text-3xl font-bold text-gray-900">Purchase Management</h1>
        <div className="flex items-center gap-2">
          {isSelectMode && (
            <>
              <button
                onClick={handleSelectAll}
                className="bg-gray-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm md:text-base"
              >
                {selectedPurchases.length === currentPurchases.length ? 'Deselect All' : 'Select All'}
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={selectedPurchases.length === 0 || isDeleting}
                className="bg-red-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base flex items-center gap-2"
              >
                {isDeleting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                Delete ({selectedPurchases.length})
              </button>
              <button
                onClick={toggleSelectMode}
                className="bg-gray-500 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm md:text-base"
              >
                Cancel
              </button>
            </>
          )}
          {!isSelectMode && (
            <>
              <button
                onClick={toggleSelectMode}
                className="bg-gray-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm md:text-base"
              >
                Select
              </button>
              <button
                onClick={() => {
                  resetForm()
                  setShowForm(true)
                }}
                className="bg-blue-600 text-white px-3 py-1.5 md:px-6 md:py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base"
              >
                <span className="hidden sm:inline">Create New Purchase</span>
                <span className="sm:hidden">New Purchase</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
          <button
            onClick={() => setSuccess(null)}
            className="float-right font-bold text-green-700"
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button
            onClick={() => setError(null)}
            className="float-right font-bold text-red-700"
          >
            ×
          </button>
        </div>
      )}


      {/* Purchase Cards */}
      <div className="space-y-4">
        {purchases.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">No purchases found</h3>
            <p className="text-gray-500">Start by creating your first purchase transaction.</p>
          </div>
        ) : (
          currentPurchases.map((purchase) => (
            <div 
              key={purchase.id} 
              className={`border rounded-lg hover:bg-gray-50 transition-colors ${
                isSelectMode ? 'cursor-pointer' : 'cursor-pointer'
              } ${selectedPurchases.includes(purchase.id!) ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
              onClick={() => {
                if (isSelectMode) {
                  handleSelectPurchase(purchase.id!)
                } else {
                  handleViewPurchase(purchase)
                }
              }}
            >
              {/* Desktop Layout */}
              <div className="hidden md:flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  {isSelectMode && (
                    <input
                      type="checkbox"
                      checked={selectedPurchases.includes(purchase.id!)}
                      onChange={() => handleSelectPurchase(purchase.id!)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{purchase.partyName}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        BILL-{purchase.billNo}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        {purchase.items.length} item(s)
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {purchase.date}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right mr-4">
                    <p className="text-lg font-semibold text-blue-600">
                      {PurchaseService.formatCurrency(purchase.totalAmount)}
                    </p>
                  </div>
                  {!isSelectMode && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewPurchase(purchase)
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                        title="View Purchase Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditPurchase(purchase)
                        }}
                        className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                        title="Edit Purchase"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeletePurchase(purchase.id!)
                        }}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                        title="Delete Purchase"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile Layout */}
              <div className="md:hidden p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {isSelectMode && (
                      <input
                        type="checkbox"
                        checked={selectedPurchases.includes(purchase.id!)}
                        onChange={() => handleSelectPurchase(purchase.id!)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-gray-900">{purchase.partyName}</h3>
                      <p className="text-xs text-gray-500">BILL-{purchase.billNo}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-blue-600">
                      {PurchaseService.formatCurrency(purchase.totalAmount)}
                    </p>
                    <p className="text-xs text-gray-500">{purchase.items.length} items</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {purchase.date}
                    </span>
                  </div>
                  {!isSelectMode && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewPurchase(purchase)
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                        title="View Purchase Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditPurchase(purchase)
                        }}
                        className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                        title="Edit Purchase"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeletePurchase(purchase.id!)
                        }}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                        title="Delete Purchase"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {purchases.length > purchasesPerPage && (
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

      {/* Purchase Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="min-h-screen p-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-blue-800">
                {editingPurchase ? `Edit Purchase - ${editingPurchase.billNo}` : 'Add New Purchase'}
              </h2>
              <div className="flex items-center gap-4">
                {/* Party Balance Display */}
                {formData.partyName && parties.find(p => p.name === formData.partyName) ? (
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Balance</div>
                    <div className={`text-lg font-semibold ${
                      (() => {
                        const party = parties.find(p => p.name === formData.partyName)
                        if (!party || party.balance === undefined) return 'text-gray-900'
                        if (party.balance > 0) return 'text-green-600'
                        if (party.balance < 0) return 'text-red-600'
                        return 'text-gray-900'
                      })()
                    }`}>
                      ₹{(() => {
                        const party = parties.find(p => p.name === formData.partyName)
                        return party?.balance?.toFixed(2) || '0.00'
                      })()}
                    </div>
                  </div>
                ) : (
                  <div></div>
                )}
                {/* Close Button */}
                <button
                  onClick={() => {
                    setShowForm(false)
                    resetForm()
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                  title="Close"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault()
              editingPurchase ? handleUpdatePurchase() : handleCreatePurchase()
            }}>
              {/* Bill Number */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bill Number *
                </label>
                <input
                  type="text"
                  value={formData.billNo}
                  onChange={(e) => setFormData(prev => ({ ...prev, billNo: e.target.value }))}
                  placeholder="Enter bill number (e.g., BILL-2024-001)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Bill number must be unique and contain only letters, numbers, hyphens, and underscores
                </p>
              </div>

              {/* Party Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Party Name *
                  </label>
                  <input
                    type="text"
                    value={formData.partyName}
                    onChange={(e) => handlePartyNameChange(e.target.value)}
                    onFocus={handlePartyNameFocus}
                    onBlur={handlePartyNameBlur}
                    placeholder="Type to search existing parties or enter new party name"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="Enter phone number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>


              {/* Date */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Items */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Items *
                  </label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Add Item
                  </button>
                </div>

                {/* Item Search Bar */}
                {showItemSearchBar && (
                  <div className="mb-4 p-4 border border-gray-300 rounded-lg bg-gray-50">
                    <div className="relative">
                      <input
                        type="text"
                        value={itemSearchQuery}
                        onChange={(e) => handleItemSearch(e.target.value)}
                        placeholder="Search items by name or category..."
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <button
                        onClick={() => setShowItemSearchBar(false)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        ×
                      </button>
                    </div>

                    {/* Search Results */}
                    {filteredItems.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {filteredItems.slice(0, 3).map((item) => (
                          <div
                            key={item._id}
                            onClick={() => selectItem(item)}
                            className="p-3 border border-gray-200 rounded-lg hover:bg-white cursor-pointer transition-colors bg-white"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-semibold text-gray-900">{item.productName}</h4>
                                <p className="text-sm text-gray-600">Category: {item.category}</p>
                                <p className="text-sm text-gray-500">
                                  Stock: {Math.ceil(item.openingStock)} bags
                                  {item.lowStockAlert && item.openingStock <= item.lowStockAlert && (
                                    <span className="text-red-500 ml-2">⚠️ Low Stock</span>
                                  )}
                                </p>
                              </div>
                              <div className="text-right">
                                {item.isUniversal && (
                                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Universal</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {itemSearchQuery.trim() && filteredItems.length === 0 && (
                      <div className="mt-3 text-center py-4 text-gray-500">
                        No items found matching "{itemSearchQuery}"
                      </div>
                    )}
                  </div>
                )}

                {/* Selected Items Cards */}
                {formData.items.length > 0 && (
                  <div className="space-y-3">
                    {formData.items.map((item, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">{item.itemName}</h4>
                            <p className="text-sm text-gray-500">Item #{index + 1}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Quantity (kg)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(index, e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Rate (₹/kg)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.rate}
                              onChange={(e) => updateItemRate(index, e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Total
                            </label>
                            <input
                              type="number"
                              value={item.total}
                              readOnly
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 font-semibold"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total Amount */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total Amount:</span>
                  <span className="text-xl font-bold text-blue-600">
                    {PurchaseService.formatCurrency(calculateTotal())}
                  </span>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    resetForm()
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isCreating && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {editingPurchase ? 'Update Purchase' : 'Create Purchase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchase Detail Dialog */}
      {isTransactionDetailOpen && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="min-h-screen p-4">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-blue-800">Purchase Details</h2>
                <p className="text-gray-600">View complete purchase information</p>
              </div>
              {/* Close Button */}
              <button
                onClick={() => setIsTransactionDetailOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                title="Close"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          {loadingPurchaseDetail ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading purchase details...</span>
            </div>
          ) : purchaseDetail && selectedPurchase ? (
            <div className="space-y-6">
              {/* Purchase Header */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">Bill #{purchaseDetail.billNo}</h3>
                    <p className="text-sm text-muted-foreground">{purchaseDetail.date}</p>
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-800">Purchase</Badge>
              </div>

              {/* Party Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Party Information</h4>
                <div className="grid gap-3 p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-medium">{purchaseDetail.partyName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{purchaseDetail.phoneNumber}</span>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Items</h4>
                <div className="space-y-2">
                  {purchaseDetail.items.map((item: any, index: number) => (
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

              {/* Total Amount */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <span className="text-lg font-semibold">Total Amount:</span>
                <span className="text-xl font-bold text-blue-600">
                  ₹{purchaseDetail.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="h-12 w-12 text-muted-foreground mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-muted-foreground">Failed to load purchase details</p>
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PurchasePage
