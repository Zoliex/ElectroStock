/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Dashboard } from "./pages/Dashboard";
import { Inventory } from "./pages/Inventory";
import { ComponentDetails } from "./pages/ComponentDetails";
import { Categories } from "./pages/Categories";
import { AddComponent } from "./pages/AddComponent";
import { BatchBarcodes } from "./pages/BatchBarcodes";
import { Boxes } from "./pages/Boxes";
import { Settings } from "./pages/Settings";
import { useEffect } from "react";

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let pageName = "Dashboard";
    if (path === "/") pageName = "Dashboard";
    else if (path.startsWith("/inventory/add")) pageName = "Add Component";
    else if (path.startsWith("/inventory/edit")) pageName = "Edit Component";
    else if (path.startsWith("/inventory")) pageName = "Inventory";
    else if (path.startsWith("/categories")) pageName = "Categories";
    else if (path.startsWith("/boxes")) pageName = "Boxes";
    else if (path.startsWith("/barcodes")) pageName = "Batch Barcodes";
    else if (path.startsWith("/settings")) pageName = "Settings";
    
    document.title = `ElectroStock - ${pageName}`;
  }, [location]);

  useEffect(() => {
    let buffer = "";
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      const char = e.key;

      // If time between keystrokes is too long, reset buffer (manual typing)
      // Barcode scanners usually send chars within 20-50ms
      if (currentTime - lastKeyTime > 100) {
        buffer = "";
      }

      lastKeyTime = currentTime;

      if (char === "Enter") {
        // If buffer has content and was typed fast (implied by not being reset)
        if (buffer.length > 2) {
          // Check if user is NOT focusing on an input
          const activeTag = document.activeElement?.tagName;
          const isAddOrEditPage = window.location.pathname.includes('/inventory/add') || window.location.pathname.includes('/inventory/edit');
          
          if (activeTag !== "INPUT" && activeTag !== "TEXTAREA" && !isAddOrEditPage) {
             navigate(`/inventory?q=${encodeURIComponent(buffer)}`);
          }
        }
        buffer = "";
      } else if (char.length === 1) {
        // Only append printable characters
        buffer += char;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display transition-colors duration-300">
      <Toaster position="top-right" richColors offset="80px" toastOptions={{ className: 'mt-16 sm:mt-0' }} />
      <Header />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/inventory/add" element={<AddComponent />} />
        <Route path="/inventory/edit/:id" element={<AddComponent />} />
        <Route path="/inventory/:id" element={<ComponentDetails />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/boxes" element={<Boxes />} />
        <Route path="/barcodes" element={<BatchBarcodes />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
