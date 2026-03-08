import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Download, Plus, Loader2, Package, Filter, ArrowUpDown, Search, X, AlertTriangle, ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { directus, Component, getFileUrl, ComponentType, Box, ComponentPackage } from "../lib/directus";
import { readItems, aggregate } from "@directus/sdk";

export function Inventory() {
  const [components, setComponents] = useState<Component[]>([]);
  const [types, setTypes] = useState<ComponentType[]>([]);
  const [locations, setLocations] = useState<Box[]>([]);
  const [packages, setPackages] = useState<ComponentPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const searchQuery = searchParams.get("q") || "";
  const filterParam = searchParams.get("filter");
  const categoryParam = searchParams.get("category");

  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>(categoryParam ? Number(categoryParam) : 'all');
  const [selectedLocation, setSelectedLocation] = useState<string | 'all'>('all');
  const [selectedPackage, setSelectedPackage] = useState<number | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(Number(categoryParam));
    }
  }, [categoryParam]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page on filter change
  }, [searchQuery, selectedCategory, selectedLocation, selectedPackage, filterParam, sortBy, sortOrder]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [fetchedTypes, fetchedLocations, fetchedPackages] = await Promise.all([
          directus.request(readItems('components_types', { limit: -1, sort: ['name'] })),
          directus.request(readItems('boxes', { limit: -1, sort: ['name'] })),
          directus.request(readItems('components_packages', { limit: -1, sort: ['name'] }))
        ]);
        
        setTypes(fetchedTypes as ComponentType[]);
        setLocations(fetchedLocations as Box[]);
        setPackages(fetchedPackages as ComponentPackage[]);
      } catch (error) {
        console.error("Error fetching options:", error);
      }
    };

    fetchOptions();
  }, []);

  useEffect(() => {
    const fetchComponents = async () => {
      setIsLoading(true);
      try {
        const filter: any = { _and: [] };

        if (searchQuery) {
          filter._and.push({
            _or: [
              { name: { _icontains: searchQuery } },
              { description: { _icontains: searchQuery } },
              { barcode: { _icontains: searchQuery } },
              { packet_reference: { _icontains: searchQuery } }
            ]
          });
        }

        if (selectedCategory !== 'all') {
          filter._and.push({ type: { _eq: selectedCategory } });
        }

        if (selectedLocation !== 'all') {
          filter._and.push({ location: { _eq: selectedLocation } });
        }

        if (selectedPackage !== 'all') {
          filter._and.push({ package: { _eq: selectedPackage } });
        }

        if (filterParam === 'low_stock') {
          filter._and.push({ quantity_available: { _lte: 10 } });
        }

        const queryParams: any = {
          fields: ['*', 'type.*', 'package.*', 'location.*'] as any,
          sort: sortBy === 'name' ? (sortOrder === 'asc' ? 'name' : '-name') :
                sortBy === 'quantity' ? (sortOrder === 'asc' ? 'quantity_available' : '-quantity_available') :
                (sortOrder === 'asc' ? 'date_created' : '-date_created'),
          filter: filter._and.length > 0 ? filter : undefined,
          limit: itemsPerPage,
          page: currentPage
        };

        const [response, countResponse] = await Promise.all([
          directus.request(readItems('components', queryParams)),
          directus.request(aggregate('components', {
            query: { filter: filter._and.length > 0 ? filter : undefined },
            aggregate: { count: '*' }
          }))
        ]) as any;
        
        const data = Array.isArray(response) ? response : (response.data || []);
        const totalCount = Number(countResponse[0]?.count || 0);
        
        setComponents(data as unknown as Component[]);
        setTotalItems(totalCount);

        // Auto-redirect if single result matches barcode (only on first page search)
        if (searchQuery && data.length === 1 && currentPage === 1) {
            const item = data[0] as unknown as Component;
            if (item.barcode) {
                const barcodes = item.barcode.split(';').map(b => b.trim().toLowerCase());
                if (barcodes.includes(searchQuery.toLowerCase())) {
                     navigate(`/inventory/${item.id}`);
                }
            }
        }
      } catch (error) {
        console.error("Error fetching components:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComponents();
  }, [searchQuery, selectedCategory, selectedLocation, selectedPackage, filterParam, sortBy, sortOrder, currentPage, navigate]);

  const getStatus = (quantity: number) => {
    if (quantity === 0) return { label: "Out of Stock", color: "bg-red-500 text-white", stockColor: "text-red-500 font-bold" };
    if (quantity < 10) return { label: "Low Stock", color: "bg-orange-500 text-white", stockColor: "text-orange-500 font-bold" };
    return { label: "Healthy", color: "bg-emerald-500 text-white", stockColor: "text-slate-500" };
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handleExport = () => {
    if (components.length === 0) return;

    const headers = ['ID', 'Name', 'Category', 'Quantity', 'Location', 'Description'];
    const csvContent = [
      headers.join(','),
      ...components.map(comp => {
        const categoryName = typeof comp.type === 'object' && comp.type ? comp.type.name : '';
        const locationName = typeof comp.location === 'object' && comp.location ? comp.location.name : '';
        
        return [
          comp.id,
          `"${comp.name.replace(/"/g, '""')}"`,
          `"${categoryName.replace(/"/g, '""')}"`,
          comp.quantity_available,
          `"${locationName.replace(/"/g, '""')}"`,
          `"${(comp.description || '').replace(/"/g, '""')}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedLocation('all');
    setSelectedPackage('all');
    setSearchParams({});
  };

  // Group categories by name
  const groupedCategories = types.reduce((acc, type) => {
    if (!acc[type.name]) {
      acc[type.name] = [];
    }
    acc[type.name].push(type);
    return acc;
  }, {} as Record<string, ComponentType[]>);

  return (
    <motion.main 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex-1 max-w-7xl mx-auto w-full px-6 py-8"
    >
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight">Component Inventory</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Manage your electronic stock and visual identification.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Download className="w-5 h-5" /> Export
          </button>
          <Link to="/inventory/add" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-semibold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20">
            <Plus className="w-5 h-5" /> New Component
          </Link>
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          {/* Search & Filter Toggle */}
          <div className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchParams(prev => {
                  if (e.target.value) prev.set("q", e.target.value);
                  else prev.delete("q");
                  return prev;
                })}
                placeholder="Search components..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg border text-sm font-semibold flex items-center gap-2 transition-colors ${showFilters ? 'bg-primary/10 border-primary text-primary' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <Filter className="w-4 h-4" /> Filters
            </button>
          </div>

          {/* Pagination & Sort Controls */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-1 mr-4 bg-slate-50 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-bold px-2 text-slate-500">
                Page {currentPage} of {totalPages || 1}
              </span>
              <button
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 mr-2">
              <Layers className="w-4 h-4 text-slate-400" />
              <select 
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10px] font-bold outline-none focus:border-primary"
                title="Items per page"
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase mr-2 hidden sm:inline-block">
              {totalItems} items found
            </span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium outline-none focus:border-primary"
            >
              <option value="date">Date Added</option>
              <option value="name">Name</option>
              <option value="quantity">Quantity</option>
            </select>
            <button 
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowUpDown className={`w-4 h-4 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-200">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Category</label>
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-primary"
              >
                <option value="all">All Categories</option>
                {Object.entries(groupedCategories).map(([name, subTypes]) => (
                  <optgroup key={name} label={name}>
                    {subTypes.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.comments || t.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Location</label>
              <select 
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value === 'all' ? 'all' : e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-primary"
              >
                <option value="all">All Locations</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Package</label>
              <select 
                value={selectedPackage}
                onChange={(e) => setSelectedPackage(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-primary"
              >
                <option value="all">All Packages</option>
                {packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-3 flex justify-end">
              <button 
                onClick={clearFilters}
                className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Low Stock Filter Banner */}
        {filterParam === 'low_stock' && (
          <div className="mt-4 flex items-center justify-between bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 text-sm text-orange-800 dark:text-orange-200 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span className="font-semibold">Filtering by Low Stock (≤ 10 units)</span>
            </div>
            <button 
              onClick={() => {
                const newParams = new URLSearchParams(searchParams);
                newParams.delete("filter");
                setSearchParams(newParams);
              }}
              className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200 font-bold text-xs uppercase tracking-wider flex items-center gap-1 transition-colors"
            >
              Clear Filter <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6" id="inventory-grid">
        {isLoading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p>Loading inventory...</p>
          </div>
        ) : components.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
            <Package className="w-12 h-12 mb-4 opacity-20" />
            <p>{searchQuery ? `No components found matching "${searchQuery}"` : "No components found. Add your first one!"}</p>
            {(selectedCategory !== 'all' || selectedLocation !== 'all' || selectedPackage !== 'all') && (
              <button onClick={clearFilters} className="mt-4 text-primary text-sm font-bold hover:underline">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          components.map((comp) => {
            const status = getStatus(comp.quantity_available);
            const categoryName = (comp.type as ComponentType)?.name || "Uncategorized";
            
            return (
              <Link
                to={`/inventory/${comp.id}`}
                key={comp.id}
                className="group bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-primary/50 transition-all shadow-sm block relative"
              >
                <div className="aspect-square w-full bg-slate-100 dark:bg-slate-800 relative">
                  <div
                    className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                    style={{ backgroundImage: `url('${getFileUrl(comp.main_image)}')` }}
                  ></div>
                  <div className="absolute top-3 right-3 z-10">
                    <span
                      className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${status.color}`}
                    >
                      {status.label}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <p className={`text-[10px] font-bold uppercase tracking-tighter mb-1 text-primary truncate`}>
                    {categoryName}
                  </p>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate" title={comp.name}>{comp.name}</h3>
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`text-xs ${status.stockColor}`}>{comp.quantity_available} units</span>
                    <span className="text-[10px] font-mono text-slate-400">#{comp.id}</span>
                  </div>
                </div>
              </Link>
            );
          })
        )}

        {/* Add Card - Only show when not searching */}
        {!searchQuery && (
          <Link to="/inventory/add" className="group border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center p-8 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer shadow-sm min-h-[280px]">
            <div className="size-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
              <Plus className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-500 group-hover:text-primary">Add Component</p>
          </Link>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-12 flex items-center justify-center gap-2">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-sm font-bold disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>
        <div className="flex items-center gap-1">
          {totalPages > 0 ? Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum = currentPage;
            if (currentPage <= 3) pageNum = i + 1;
            else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
            else pageNum = currentPage - 2 + i;
            
            if (pageNum < 1 || pageNum > totalPages) return null;

            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`size-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${currentPage === pageNum ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'}`}
              >
                {pageNum}
              </button>
            );
          }) : (
            <button
              disabled
              className="size-10 rounded-lg flex items-center justify-center text-sm font-bold bg-primary text-white shadow-lg shadow-primary/20"
            >
              1
            </button>
          )}
        </div>
        <button
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-sm font-bold disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </motion.main>
  );
}
