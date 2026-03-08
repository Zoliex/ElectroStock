import { useState, useEffect } from "react";
import {
  Edit2,
  PlusSquare,
  ChevronRight,
  Cpu,
  Package,
  MapPin,
  Tag,
  QrCode,
  FileText,
  ShoppingCart,
  History,
  Share2,
  Copy,
  Trash2,
  Loader2,
  Printer,
  Zap
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { directus, Component, getFileUrl, ComponentType, Box, ComponentPackage } from "../lib/directus";
import { readItem } from "@directus/sdk";
import MDEditor from '@uiw/react-md-editor';
import BarcodeGenerator from "react-barcode";

export function ComponentDetails() {
  const { id } = useParams<{ id: string }>();
  const [component, setComponent] = useState<Component | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchComponent = async () => {
      if (!id) return;
      try {
        const fetchedComponent = await directus.request(
          readItem('components', Number(id), {
            fields: ['*', 'type.*', 'package.*', 'location.*']
          })
        );
        setComponent(fetchedComponent as unknown as Component);
      } catch (error) {
        console.error("Error fetching component details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComponent();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p>Loading component details...</p>
      </div>
    );
  }

  if (!component) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400">
        <Package className="w-12 h-12 mb-4 opacity-20" />
        <p>Component not found.</p>
        <Link to="/inventory" className="mt-4 text-primary hover:underline">Return to Inventory</Link>
      </div>
    );
  }

  const categoryName = (component.type as ComponentType)?.name || "Uncategorized";
  const locationName = (component.location as Box)?.name || "Unknown Location";
  const locationId = (component.location as Box)?.unique_id || "N/A";
  const packageName = (component.package as ComponentPackage)?.name || "Unknown Package";

  const handlePrint = () => {
    window.print();
  };

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #single-barcode-print, #single-barcode-print * {
              visibility: visible;
            }
            #single-barcode-print {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: white !important;
              padding: 0 !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
            }
          }
        `}
      </style>
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight">Component Details</h1>
          <p className="text-slate-500 dark:text-slate-400">Technical specifications and inventory status.</p>
        </div>
        <div className="flex gap-3">
          <Link to={`/inventory/edit/${component.id}`} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <Edit2 className="w-4 h-4" /> Edit
          </Link>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-semibold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20">
            <PlusSquare className="w-4 h-4" /> Update Stock
          </button>
        </div>
      </div>

      <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-8">
        <Link to="/inventory" className="hover:text-primary transition-colors">
          Inventory
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="hover:text-primary cursor-pointer transition-colors">{categoryName}</span>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-900 dark:text-slate-100 font-medium">{component.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Product Image & Basic Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Hero Section */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="aspect-video w-full relative bg-slate-100 dark:bg-slate-800 rounded-t-3xl overflow-hidden">
              <img
                alt={component.name}
                className="w-full h-full object-contain p-4"
                src={component.main_image ? getFileUrl(component.main_image) : "https://via.placeholder.com/800x400?text=No+Image"}
              />
              <div className="absolute top-4 right-4 flex gap-2">
                {component.quantity_available > 0 ? (
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-500 text-xs font-bold rounded-full backdrop-blur-md">
                    IN STOCK
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-red-500/20 text-red-500 text-xs font-bold rounded-full backdrop-blur-md">
                    OUT OF STOCK
                  </span>
                )}
                {component.keywords && component.keywords.length > 0 && (
                  <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-bold rounded-full backdrop-blur-md">
                    {component.keywords[0]}
                  </span>
                )}
              </div>
            </div>
            <div className="p-8">
              <h1 className="text-4xl font-black mb-6 tracking-tight text-slate-900 dark:text-white">
                {component.name}
              </h1>
              <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 text-lg leading-relaxed space-y-4" data-color-mode="light">
                <MDEditor.Markdown source={component.description || "*No description provided.*"} style={{ backgroundColor: 'transparent', color: 'inherit' }} />
              </div>
            </div>
          </div>

          {/* Technical Specs */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-800">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Cpu className="w-6 h-6 text-primary" />
              Technical Specifications
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Package</p>
                <p className="font-semibold">{packageName}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Category</p>
                <p className="font-semibold">{categoryName}</p>
              </div>
              {component.keywords && component.keywords.map((keyword, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Tag {idx + 1}</p>
                  <p className="font-semibold">{keyword}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Inventory & Actions */}
        <div className="space-y-6">
          {/* Inventory Status Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold mb-4">Inventory Status</h3>
            <div className="bg-primary/5 dark:bg-primary/10 rounded-2xl p-4 mb-6 flex items-center justify-between border border-primary/20">
              <div>
                <p className="text-xs text-primary font-bold uppercase tracking-wider mb-1">Total Available</p>
                <p className="text-4xl font-black text-primary">
                  {component.quantity_available} <span className="text-sm font-medium">units</span>
                </p>
              </div>
              <div className="size-12 bg-primary text-white rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Warehouse Location</p>
                  <p className="text-sm font-semibold font-mono">{locationName} ({locationId})</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Tag className="w-5 h-5 text-slate-400 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Packet Reference</p>
                  <p className="text-sm font-semibold">{component.packet_reference || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <QrCode className="w-5 h-5 text-slate-400 shrink-0" />
                <div className="w-full">
                  <p className="text-xs text-slate-500">Barcode</p>
                  <div className="flex items-center justify-between mt-1 mb-3">
                    <p className="text-sm font-semibold font-mono">{component.barcode || "N/A"}</p>
                    {component.barcode && (
                      <button onClick={handlePrint} className="text-primary text-xs font-bold hover:underline rounded-xl flex items-center gap-1">
                        <Printer className="w-3 h-3" /> PRINT
                      </button>
                    )}
                  </div>
                  {component.barcode && (
                    <div id="single-barcode-print" className="border border-slate-300 dark:border-slate-700 p-4 rounded-md flex flex-col justify-center h-32 relative bg-white dark:bg-slate-900 w-[300px]">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-1.5">
                          <Zap className="w-4 h-4 text-primary" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">ElectroStock</span>
                        </div>
                        <span className="text-[9px] font-mono text-slate-500">v2.4.0</span>
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <div className="h-10 w-full flex items-center justify-center overflow-hidden bg-white rounded p-1">
                          <BarcodeGenerator value={component.barcode} height={30} displayValue={false} background="transparent" width={1.5} margin={0} />
                        </div>
                        <div className="text-center text-[10px] font-mono mt-1 tracking-[0.2em] font-bold">{component.barcode}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
              {component.datasheet && (
                <a 
                  href={getFileUrl(component.datasheet)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <FileText className="w-5 h-5" />
                  View Datasheet
                </a>
              )}
              {component.url && (
                <a 
                  href={component.url.startsWith('http') ? component.url : `https://${component.url}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Source Link
                </a>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <History className="w-5 h-5 text-slate-400 mb-2" />
                <span className="text-xs font-bold">History</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <Share2 className="w-5 h-5 text-slate-400 mb-2" />
                <span className="text-xs font-bold">Share</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <Copy className="w-5 h-5 text-slate-400 mb-2" />
                <span className="text-xs font-bold">Clone</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 rounded-2xl border border-red-500/10 hover:bg-red-500/10 transition-colors group">
                <Trash2 className="w-5 h-5 text-red-500/50 group-hover:text-red-500 mb-2 transition-colors" />
                <span className="text-xs font-bold text-red-500/50 group-hover:text-red-500 transition-colors">
                  Delete
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
