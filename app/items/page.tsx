"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Package2, Plus, Search, Filter, AlertTriangle, Edit, Trash2, Loader2, Crown, ChevronLeft, ChevronRight } from "lucide-react";
import { itemService, Item, ItemSummary, ItemFilters } from "@/services/item";
import { toast } from "sonner";

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [summary, setSummary] = useState<ItemSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [formData, setFormData] = useState({
    productName: "",
    category: "Primary" as "Primary" | "Kirana",
    openingStock: 0,
    lowStockAlert: 10,
    isUniversal: false
  });

  // Load items and summary on component mount
  useEffect(() => {
    loadItems();
  }, []);

  // Load items with current filters
  const loadItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: ItemFilters = {};
      if (searchTerm) filters.search = searchTerm;
      if (categoryFilter !== "all") filters.category = categoryFilter;
      
      const response = await itemService.getItems(filters);
      const allItems = response.data || [];
      
      // Sort items: Bardana first, then rest in A-Z order
      const sortedItems = allItems.sort((a, b) => {
        // Bardana (universal item) always comes first
        if (a.isUniversal && a.productName === 'Bardana') return -1;
        if (b.isUniversal && b.productName === 'Bardana') return 1;
        
        // For all other items, sort alphabetically by product name
        return a.productName.localeCompare(b.productName);
      });
      
      setItems(sortedItems);
    } catch (err: any) {
      setError(err.message || "Failed to load items");
      toast.error("Failed to load items");
    } finally {
      setLoading(false);
    }
  };
  // Handle search and filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when filters change
      loadItems();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, categoryFilter]);

  // Calculate pagination
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = items.slice(startIndex, endIndex);

  // Calculate pagination window (show max 5 page numbers)
  const maxVisiblePages = 5;
  const halfWindow = Math.floor(maxVisiblePages / 2);
  
  let startPage = Math.max(1, currentPage - halfWindow);
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  // Adjust start page if we're near the end
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  
  const visiblePages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  // Separate Bardana from other items
  const bardanaItems = currentItems.filter(item => item.isUniversal && item.productName === 'Bardana');
  const regularItems = currentItems.filter(item => !(item.isUniversal && item.productName === 'Bardana'));

  // Handle form submission for adding new item
  const handleAddItem = async () => {
    try {
      const validation = itemService.validateItemData(formData);
      if (!validation.isValid) {
        toast.error(validation.errors.join(", "));
        return;
      }

      await itemService.createItem(formData);
      toast.success("Item created successfully");
      setIsAddDialogOpen(false);
      resetForm();
      loadItems();
    } catch (err: any) {
      toast.error(err.message || "Failed to create item");
    }
  };

  // Handle form submission for editing item
  const handleEditItem = async () => {
    if (!editingItem?._id) return;

    try {
      const validation = itemService.validateItemData(formData);
      if (!validation.isValid) {
        toast.error(validation.errors.join(", "));
        return;
      }

      await itemService.updateItem(editingItem._id, formData);
      toast.success("Item updated successfully");
      setIsEditDialogOpen(false);
      setEditingItem(null);
      resetForm();
      loadItems();
    } catch (err: any) {
      toast.error(err.message || "Failed to update item");
    }
  };

  // Handle item deletion
  const handleDeleteItem = async (item: Item) => {
    if (!item._id) return;
    
    if (item.isUniversal) {
      toast.error("Universal items cannot be deleted");
      return;
    }

    if (!confirm(`Are you sure you want to delete "${item.productName}"?`)) {
      return;
    }

    try {
      await itemService.deleteItem(item._id);
      toast.success("Item deleted successfully");
      loadItems();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete item");
    }
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      productName: "",
      category: "Primary",
      openingStock: 0,
      lowStockAlert: 10,
      isUniversal: false
    });
  };

  // Open edit dialog with item data
  const openEditDialog = (item: Item) => {
    setEditingItem(item);
    setFormData({
      productName: item.productName,
      category: item.category,
      openingStock: item.openingStock,
      lowStockAlert: item.lowStockAlert,
      isUniversal: item.isUniversal || false
    });
    setIsEditDialogOpen(true);
  };

  // Get stock status badge variant
  const getStockStatusBadge = (item: Item) => {
    if (item.openingStock === 0) return "destructive";
    if (item.openingStock <= item.lowStockAlert) return "destructive";
    return "default";
  };

  // Get stock status text
  const getStockStatusText = (item: Item) => {
    if (item.openingStock === 0) return "Out of Stock";
    if (item.openingStock <= item.lowStockAlert) return "Low Stock";
    return "In Stock";
  };

  // Helper function to round up bags value
  const roundUpBags = (value: number) => {
    return Math.ceil(value);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground">
            Manage your plastic inventory and stock levels
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Item</DialogTitle>
                <DialogDescription>
                  Create a new inventory item with all required details.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 px-2 sm:px-0">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="productName" className="text-right">
                    Product Name
                  </Label>
                  <Input
                    id="productName"
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    className="col-span-3"
                    placeholder="Enter product name"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">
                    Category
                  </Label>
                  <Select value={formData.category} onValueChange={(value: "Primary" | "Kirana") => setFormData({ ...formData, category: value })}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Primary">Primary</SelectItem>
                      <SelectItem value="Kirana">Kirana</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="openingStock" className="text-right">
                    Opening Stock
                  </Label>
                  <Input
                    id="openingStock"
                    type="number"
                    value={formData.openingStock}
                    onChange={(e) => setFormData({ ...formData, openingStock: Number(e.target.value) })}
                    className="col-span-3"
                    placeholder="0"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="lowStockAlert" className="text-right">
                    Low Stock Alert
                  </Label>
                  <Input
                    id="lowStockAlert"
                    type="number"
                    value={formData.lowStockAlert}
                    onChange={(e) => setFormData({ ...formData, lowStockAlert: Number(e.target.value) })}
                    className="col-span-3"
                    placeholder="10"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddItem}>
                  Add Item
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
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Primary">Primary</SelectItem>
            <SelectItem value="Kirana">Kirana</SelectItem>
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

      {/* Items List */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
          <CardDescription>
            Current stock levels and item details
            {items.length > 0 && (
              <span className="ml-2 text-sm">
                (Showing {startIndex + 1}-{Math.min(endIndex, items.length)} of {items.length} items)
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading items...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No items found. Try adjusting your search or filters.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Bardana Items - Special UI */}
              {bardanaItems.map((item) => {
                const formattedItem = itemService.formatItemForDisplay(item);
                return (
                  <div key={item._id} className="flex items-center justify-between p-4 border-2 border-gradient-to-r from-amber-200 to-yellow-200 rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 shadow-md">
                    {/* Desktop Layout - Keep original */}
                    <div className="hidden md:flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-200 to-yellow-200 flex items-center justify-center shadow-lg">
                        <Crown className="h-6 w-6 text-amber-700" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-amber-800">{item.productName}</h3>
                          <Badge variant="destructive" className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold">
                            UNIVERSAL ITEM
                          </Badge>
                        </div>
                        <p className="text-sm text-amber-700 font-medium">
                          {item.category} Category • System Essential
                        </p>
                      </div>
                    </div>
                    
                    {/* Mobile Layout - Only 4 elements */}
                    <div className="md:hidden flex items-center gap-3 flex-1">
                      <div className="flex-1">
                        <h3 className="font-bold text-base text-amber-800">{item.productName}</h3>
                        <p className="text-sm text-amber-700 font-medium">{roundUpBags(item.openingStock)} bags</p>
                      </div>
                    </div>

                    {/* Desktop Actions - Keep original */}
                    <div className="hidden md:flex items-center gap-2">
                      <Badge variant={getStockStatusBadge(item)} className="font-semibold">
                        {getStockStatusText(item)}
                      </Badge>
                      <Badge variant="outline" className="border-amber-300 text-amber-700">
                        {roundUpBags(item.openingStock)} bags
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(item)}
                          className="hover:bg-amber-100"
                        >
                          <Edit className="h-4 w-4 text-amber-700" />
                        </Button>
                      </div>
                    </div>

                    {/* Mobile Actions - Only Edit */}
                    <div className="md:hidden flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(item)}
                        className="hover:bg-amber-100"
                      >
                        <Edit className="h-4 w-4 text-amber-700" />
                      </Button>
                    </div>
                  </div>
                );
              })}

              {/* Regular Items */}
              {regularItems.map((item) => {
                const formattedItem = itemService.formatItemForDisplay(item);
                return (
                  <div key={item._id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow">
                    {/* Desktop Layout - Keep original */}
                    <div className="hidden md:flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Package2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{item.productName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item.category} Category
                          {item.isUniversal && " • Universal Item"}
                        </p>
                      </div>
                    </div>
                    
                    {/* Mobile Layout - Only 4 elements */}
                    <div className="md:hidden flex items-center gap-3 flex-1">
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{item.productName}</h3>
                        <p className="text-xs text-muted-foreground">{roundUpBags(item.openingStock)} bags</p>
                      </div>
                    </div>

                    {/* Desktop Actions - Keep original */}
                    <div className="hidden md:flex items-center gap-2">
                      <Badge variant={getStockStatusBadge(item)}>
                        {getStockStatusText(item)}
                      </Badge>
                      <Badge variant="outline">{roundUpBags(item.openingStock)} bags</Badge>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!item.isUniversal && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteItem(item)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Mobile Actions - Only Edit and Delete */}
                    <div className="md:hidden flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {!item.isUniversal && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteItem(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {items.length > itemsPerPage && (
            <div className="flex items-center justify-center mt-6 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
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
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>
              Update the item details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 px-2 sm:px-0">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-productName" className="text-right">
                Product Name
              </Label>
              <Input
                id="edit-productName"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                className="col-span-3"
                placeholder="Enter product name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-category" className="text-right">
                Category
              </Label>
              <Select value={formData.category} onValueChange={(value: "Primary" | "Kirana") => setFormData({ ...formData, category: value })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Primary">Primary</SelectItem>
                  <SelectItem value="Kirana">Kirana</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-openingStock" className="text-right">
                Opening Stock
              </Label>
              <Input
                id="edit-openingStock"
                type="number"
                value={formData.openingStock}
                onChange={(e) => setFormData({ ...formData, openingStock: Number(e.target.value) })}
                className="col-span-3"
                placeholder="0"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-lowStockAlert" className="text-right">
                Low Stock Alert
              </Label>
              <Input
                id="edit-lowStockAlert"
                type="number"
                value={formData.lowStockAlert}
                onChange={(e) => setFormData({ ...formData, lowStockAlert: Number(e.target.value) })}
                className="col-span-3"
                placeholder="10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditItem}>
              Update Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
