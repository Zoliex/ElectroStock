import { Cpu, Globe, AtSign, Rss } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 text-primary mb-4">
              <Cpu className="w-6 h-6" />
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">ElectroStock</h2>
            </div>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm">
              The professional standard for electronic component inventory management and tracking.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Resources</h4>
            <ul className="space-y-2">
              <li><a className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary" href="#">Documentation</a></li>
              <li><a className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary" href="#">API Reference</a></li>
              <li><a className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary" href="#">Suppliers List</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Support</h4>
            <ul className="space-y-2">
              <li><a className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary" href="#">Help Center</a></li>
              <li><a className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary" href="#">Privacy Policy</a></li>
              <li><a className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary" href="#">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">© 2024 ElectroStock Inventory Management. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a className="text-slate-400 hover:text-primary transition-colors" href="#"><Globe className="w-5 h-5" /></a>
            <a className="text-slate-400 hover:text-primary transition-colors" href="#"><AtSign className="w-5 h-5" /></a>
            <a className="text-slate-400 hover:text-primary transition-colors" href="#"><Rss className="w-5 h-5" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
