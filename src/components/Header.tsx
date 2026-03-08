import { Search, Cpu } from "lucide-react";
import { Link, useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";

  const navLinks = [
    { name: "Dashboard", path: "/" },
    { name: "Inventory", path: "/inventory" },
    { name: "Categories", path: "/categories" },
    { name: "Boxes", path: "/boxes" },
    { name: "Barcodes", path: "/barcodes" },
  ];

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // If we are not on the inventory page, redirect there when searching
    if (location.pathname !== "/inventory" && value) {
      navigate(`/inventory?q=${encodeURIComponent(value)}`);
    } else {
      setSearchParams(prev => {
        if (value) {
          prev.set("q", value);
        } else {
          prev.delete("q");
        }
        return prev;
      });
    }
  };

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-background-light dark:bg-background-dark sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3 text-primary">
          <Cpu className="w-8 h-8 font-bold" />
          <h2 className="text-slate-900 dark:text-slate-100 text-xl font-bold leading-tight tracking-tight">
            ElectroStock
          </h2>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={cn(
                "text-sm font-medium transition-colors",
                location.pathname === link.path
                  ? "text-primary font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary"
              )}
            >
              {link.name}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex flex-1 justify-end gap-4">
        <label className="hidden sm:flex flex-col min-w-40 max-w-64 relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="text-slate-400 w-5 h-5" />
          </div>
          <input
            className="form-input w-full rounded-lg border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 focus:border-primary focus:ring-1 focus:ring-primary pl-10 pr-4 py-2 text-sm placeholder:text-slate-500"
            placeholder="Search components..."
            value={searchQuery}
            onChange={handleSearch}
          />
        </label>
      </div>
    </header>
  );
}
