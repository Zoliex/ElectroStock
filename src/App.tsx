/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Dashboard } from "./pages/Dashboard";
import { Inventory } from "./pages/Inventory";
import { ComponentDetails } from "./pages/ComponentDetails";
import { Categories } from "./pages/Categories";
import { AddComponent } from "./pages/AddComponent";
import { BatchBarcodes } from "./pages/BatchBarcodes";
import { Chatbot } from "./components/Chatbot";

export default function App() {
  return (
    <Router>
      <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display transition-colors duration-300">
        <Toaster position="top-right" richColors />
        <Header />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/inventory/add" element={<AddComponent />} />
          <Route path="/inventory/:id" element={<ComponentDetails />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/barcodes" element={<BatchBarcodes />} />
        </Routes>
        <Footer />
        <Chatbot />
      </div>
    </Router>
  );
}
