import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Download, Plus, Loader2, Package } from "lucide-react";
import { directus, Component, getFileUrl, ComponentType } from "../lib/directus";
import { readItems } from "@directus/sdk";

export function Inventory() {
  const [components, setComponents] = useState<Component[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchComponents = async () => {
      try {
        const fetchedComponents = await directus.request(
          readItems('components', {
            fields: ['*', 'type.*'],
            sort: ['-date_created']
          })
        );
        setComponents(fetchedComponents as Component[]);
      } catch (error) {
        console.error("Error fetching components:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComponents();
  }, []);

  const getStatus = (quantity: number) => {
    if (quantity === 0) return { label: "Out of Stock", color: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400", stockColor: "text-red-500 font-bold" };
    if (quantity < 10) return { label: "Low Stock", color: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400", stockColor: "text-orange-500 font-bold" };
    return { label: "Healthy", color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400", stockColor: "text-slate-500" };
  };

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight">Component Inventory</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Manage your electronic stock and visual identification.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <Download className="w-5 h-5" /> Export
          </button>
          <Link to="/inventory/add" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-semibold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20">
            <Plus className="w-5 h-5" /> New Component
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        <button className="px-4 py-1.5 rounded-full bg-primary text-white text-xs font-bold uppercase tracking-wider">
          All
        </button>
        <button className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-primary transition-colors">
          Sensors
        </button>
        <button className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-primary transition-colors">
          ICs
        </button>
        <button className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-primary transition-colors">
          Passives
        </button>
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
            <p>No components found. Add your first one!</p>
          </div>
        ) : (
          components.map((comp) => {
            const status = getStatus(comp.quantity_available);
            const categoryName = (comp.type as ComponentType)?.name || "Uncategorized";
            
            return (
              <Link
                to={`/inventory/${comp.id}`}
                key={comp.id}
                className="group bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-primary/50 transition-all shadow-sm block"
              >
                <div className="aspect-square w-full bg-slate-100 dark:bg-slate-800 relative">
                  <div
                    className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                    style={{ backgroundImage: `url('${getFileUrl(comp.main_image)}')` }}
                  ></div>
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${status.color}`}
                    >
                      {status.label}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <p className={`text-[10px] font-bold uppercase tracking-tighter mb-1 text-primary`}>
                    {categoryName}
                  </p>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{comp.name}</h3>
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`text-xs ${status.stockColor}`}>{comp.quantity_available} units</span>
                    <span className="text-[10px] font-mono text-slate-400">#{comp.id}</span>
                  </div>
                </div>
              </Link>
            );
          })
        )}

        {/* Add Card */}
        <Link to="/inventory/add" className="group border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center p-8 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer shadow-sm">
          <div className="size-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
            <Plus className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-500 group-hover:text-primary">Add Component</p>
        </Link>
      </div>
    </main>
  );
}
