'use client'

import React, { useState, useEffect } from 'react'
import { PurchaseService, Purchase, PurchaseCreateData, PurchaseItem } from '../../services/purchase'
import { partyService, Party } from '../../services/party'
import { itemService, Item } from '../../services/item'
import { Edit, Trash2 } from 'lucide-react'

interface PurchaseFormData {
  partyName: string
  phoneNumber: string
  items: PurchaseItem[]
  date: string
}

const PurchasePage: React.FC = () => {
  // State management
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [parties, setParties] = useState<Party[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Form states
  const [showForm, setShowForm] = useState(false)
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null)
  const [showPartyDropdown, setShowPartyDropdown] = useState(false)
  const [filteredParties, setFilteredParties] = useState<Party[]>([])
  const [itemSearchQuery, setItemSearchQuery] = useState('')
  const [filteredItems, setFilteredItems] = useState<Item[]>([])
  const [showItemSearchBar, setShowItemSearchBar] = useState(false)
  const [formData, setFormData] = useState<PurchaseFormData>({
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
        date: formData.date
      }

      const response = await PurchaseService.createPurchase(purchaseData)
      setPurchases(prev => [response.data, ...prev])
      
      // Send PDF via WhatsApp
      try {
        const whatsappResult = await PurchaseService.generateAndSendPDFViaWhatsApp(response.data)
        if (whatsappResult) {
          setSuccess('PDF Generated and Sent Successfully!')
        } else {
          setSuccess('Purchase created successfully! PDF will open in a new tab.')
        }
      } catch (whatsappError) {
        console.error('WhatsApp send error:', whatsappError)
        setSuccess('Purchase created successfully! PDF will open in a new tab.')
      }
      
      resetForm()
      setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create purchase')
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
        date: formData.date
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

  const handleEditPurchase = (purchase: Purchase) => {
    setEditingPurchase(purchase)
    
    // Convert date from MM/DD/YYYY to YYYY-MM-DD for the date input
    let formattedDate = purchase.date
    if (purchase.date.includes('/')) {
      const dateParts = purchase.date.split('/')
      formattedDate = `${dateParts[2]}-${dateParts[0].padStart(2, '0')}-${dateParts[1].padStart(2, '0')}`
    }
    
    setFormData({
      partyName: purchase.partyName,
      phoneNumber: purchase.phoneNumber,
      items: purchase.items,
      date: formattedDate
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
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

  // Helper function to generate next bill number
  const getNextBillNumber = () => {
    if (purchases.length === 0) return '1'
    
    // Find the highest bill number
    const maxBillNo = Math.max(...purchases.map(purchase => parseInt(purchase.billNo) || 0))
    return (maxBillNo + 1).toString()
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
        quantity: 0,
        rate: 0,
        total: 0
      }]
    }))
    
    // Reset search but keep search bar open
    setItemSearchQuery('')
    setFilteredItems([])
    // Keep showItemSearchBar as true so search bar stays visible
  }

  const updateItemQuantity = (index: number, quantity: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, quantity, total: quantity * item.rate }
          return updatedItem
        }
        return item
      })
    }))
  }

  const updateItemRate = (index: number, rate: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, rate, total: item.quantity * rate }
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


      {/* Purchases Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bill No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Party Name
                </th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {purchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {purchase.billNo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {purchase.partyName}
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {purchase.items.length} item(s)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {PurchaseService.formatCurrency(purchase.totalAmount)}
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {purchase.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditPurchase(purchase)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                        title="Edit Purchase"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeletePurchase(purchase.id!)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                        title="Delete Purchase"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Purchase Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-blue-800">
                {editingPurchase ? `Edit Purchase - BILL-${editingPurchase.billNo}` : `BILL-${getNextBillNumber()}`}
              </h2>
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
            </div>

            <form onSubmit={(e) => {
              e.preventDefault()
              editingPurchase ? handleUpdatePurchase() : handleCreatePurchase()
            }}>
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
                                  Stock: {item.openingStock} bags
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
                              onChange={(e) => updateItemQuantity(index, parseFloat(e.target.value) || 0)}
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
                              onChange={(e) => updateItemRate(index, parseFloat(e.target.value) || 0)}
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
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingPurchase ? 'Update Purchase' : 'Create Purchase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PurchasePage
