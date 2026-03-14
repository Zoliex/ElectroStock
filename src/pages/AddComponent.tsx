import { useState, useRef, useEffect } from "react";
import {
  Settings,
  Paperclip,
  Package,
  Hash,
  MapPin,
  Barcode,
  Image as ImageIcon,
  FileText,
  X,
  AlertTriangle,
  UploadCloud,
  FilePlus,
  Plus,
  Edit,
  Loader2,
  Zap,
  Sparkles,
  Search,
  Globe,
  ArrowLeft,
  Save,
  ChevronDown,
  Camera
} from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import BarcodeGenerator from "react-barcode";
import MDEditor from '@uiw/react-md-editor';
import { toast } from "sonner";
import { directus, Box, ComponentPackage, ComponentType, getFileUrl, Component } from "../lib/directus";
import { readItems, uploadFiles, createItem, readItem, updateItem } from "@directus/sdk";
import { BarcodeScanner } from "../components/BarcodeScanner";

export function AddComponent() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const cloneId = searchParams.get("clone");
  const isEditMode = !!id;
  const isCloneMode = !!cloneId;
  
  const [barcodes, setBarcodes] = useState<string[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [aiProposal, setAiProposal] = useState<{ category?: string, subcategory?: string, package?: string } | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [isAiFilling, setIsAiFilling] = useState(false);
  const [isSearchingImages, setIsSearchingImages] = useState(false);
  const [searchResults, setSearchResults] = useState<{ url: string; title: string }[]>([]);
  const [showImageSearchModal, setShowImageSearchModal] = useState<{ type: 'main' | 'additional' | 'datasheet', query: string } | null>(null);

  // Global Barcode Listener for this page
  useEffect(() => {
    let buffer = "";
    let lastKeyTime = Date.now();

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      const char = e.key;

      if (currentTime - lastKeyTime > 100) {
        buffer = "";
      }
      lastKeyTime = currentTime;

      if (char === "Enter") {
        if (buffer.length > 2) {
          const activeTag = document.activeElement?.tagName;
          // Only add to list if NOT already typing in an input (the input handles itself)
          if (activeTag !== "INPUT" && activeTag !== "TEXTAREA") {
            const newBarcode = buffer.trim();
            if (newBarcode && !barcodes.includes(newBarcode)) {
              setBarcodes(prev => [...prev, newBarcode]);
              toast.success(`Barcode added: ${newBarcode}`);
            }
          }
        }
        buffer = "";
      } else if (char.length === 1) {
        buffer += char;
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [barcodes]);

  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (barcodeInput.trim()) {
        const newBarcode = barcodeInput.trim();
        if (!barcodes.includes(newBarcode)) {
          setBarcodes([...barcodes, newBarcode]);
        }
        setBarcodeInput("");
      }
    }
  };

  const removeBarcode = (codeToRemove: string) => {
    setBarcodes(barcodes.filter(b => b !== codeToRemove));
  };
  
  // Options State
  const [categories, setCategories] = useState<ComponentType[]>([]);
  const [packages, setPackages] = useState<ComponentPackage[]>([]);
  const [locations, setLocations] = useState<Box[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    subcategory: "",
    pkg: "",
    description: "",
    quantity: 0,
    storageLocation: "",
    packetReference: "",
    referenceUrl: "",
  });

  // Existing Files State (for Edit Mode)
  const [existingMainImage, setExistingMainImage] = useState<string | null>(null);
  const [existingDatasheet, setExistingDatasheet] = useState<string | null>(null);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [fetchedCategories, fetchedPackages, fetchedLocations] = await Promise.all([
          directus.request(readItems('components_types')),
          directus.request(readItems('components_packages')),
          directus.request(readItems('boxes'))
        ]);
        
        setCategories(fetchedCategories);
        setPackages(fetchedPackages);
        setLocations(fetchedLocations);

        if (!isEditMode && !isCloneMode) {
          // Set default values only in add mode
          setFormData(prev => ({
            ...prev,
            category: fetchedCategories.length > 0 ? fetchedCategories[0].id.toString() : "",
            pkg: fetchedPackages.length > 0 ? fetchedPackages[0].id.toString() : "",
            storageLocation: fetchedLocations.length > 0 ? fetchedLocations[0].id.toString() : "",
          }));
        }
      } catch (error) {
        console.error("Error fetching options from Directus:", error);
      } finally {
        setIsLoadingOptions(false);
      }
    };

    fetchOptions();
  }, [isEditMode, isCloneMode]);

  useEffect(() => {
    const fetchId = id || cloneId;
    if (!fetchId) return;

    const fetchComponent = async () => {
      try {
        const component = await directus.request(readItem('components', Number(fetchId), {
          fields: ['*', 'type.*', 'package.*', 'location.*'] as any
        })) as unknown as Component;

        setFormData({
          name: isCloneMode ? `${component.name} (Copy)` : component.name,
          category: typeof component.type === 'object' ? component.type?.id?.toString() || "" : String(component.type || ""),
          subcategory: component.subcategory || "",
          pkg: typeof component.package === 'object' ? component.package?.id?.toString() || "" : String(component.package || ""),
          description: component.description || "",
          quantity: isCloneMode ? 0 : (component.quantity_available || 0),
          storageLocation: typeof component.location === 'object' ? component.location?.id?.toString() || "" : String(component.location || ""),
          packetReference: component.packet_reference || "",
          referenceUrl: component.url || "",
        });

        setTags(component.keywords || []);
        // Don't copy barcode for clones
        if (!isCloneMode && component.barcode) {
          setBarcodes(component.barcode.split(';').filter(b => b.trim() !== ""));
        } else {
          setBarcodes([]);
        }
        
        // For clones, we can reuse existing images if we want, OR we can force re-upload.
        // Reusing existing images is better UX.
        setExistingMainImage(component.main_image as string);
        setExistingDatasheet(component.datasheet as string);

      } catch (error) {
        console.error("Error fetching component:", error);
        toast.error("Failed to load component details");
        navigate("/inventory");
      }
    };

    fetchComponent();
  }, [id, cloneId, navigate, isCloneMode]);

  // Tags State
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // File Upload States
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [datasheet, setDatasheet] = useState<File | null>(null);
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);

  // File Input Refs
  const mainImageRef = useRef<HTMLInputElement>(null);
  const datasheetRef = useRef<HTMLInputElement>(null);
  const additionalImagesRef = useRef<HTMLInputElement>(null);
  const additionalFilesRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim().toUpperCase();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSingleFile = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>) => {
    if (e.target.files && e.target.files.length > 0) {
      setter(e.target.files[0]);
    }
  };

  const handleMultipleFiles = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File[]>>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setter(prev => [...prev, ...newFiles]);
    }
    // Reset input so the same file can be selected again if removed
    e.target.value = '';
  };

  const removeMultipleFile = (index: number, setter: React.Dispatch<React.SetStateAction<File[]>>) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const [isSaving, setIsSaving] = useState(false);

  // Modal States
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ComponentType | null>(null);
  const [editingPackage, setEditingPackage] = useState<ComponentPackage | null>(null);
  
  // Modal Form States
  const [modalName, setModalName] = useState("");
  const [modalSubcategory, setModalSubcategory] = useState("");
  const [isModalSaving, setIsModalSaving] = useState(false);

  const openCategoryModal = (category?: ComponentType) => {
    if (category) {
      setEditingCategory(category);
      setModalName(category.name);
      setModalSubcategory(category.subcategory || "");
    } else {
      setEditingCategory(null);
      setModalName("");
      setModalSubcategory("");
    }
    setShowCategoryModal(true);
  };

  const openPackageModal = (pkg?: ComponentPackage) => {
    if (pkg) {
      setEditingPackage(pkg);
      setModalName(pkg.name);
    } else {
      setEditingPackage(null);
      setModalName("");
    }
    setShowPackageModal(true);
  };

  const handleSaveCategory = async () => {
    if (!modalName.trim()) return;
    
    // Check for duplicates
    if (!editingCategory) {
      const exists = categories.some(c => c.name.toLowerCase() === modalName.trim().toLowerCase());
      if (exists) {
        toast.error("A category with this name already exists");
        return;
      }
    }

    setIsModalSaving(true);
    try {
      if (editingCategory) {
        await directus.request(updateItem('components_types', editingCategory.id, {
          name: modalName,
          subcategory: modalSubcategory
        }));
        setCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, name: modalName, subcategory: modalSubcategory } : c));
        toast.success("Category updated");
      } else {
        const newCat = await directus.request(createItem('components_types', {
          name: modalName,
          subcategory: modalSubcategory
        }));
        setCategories(prev => [...prev, newCat as ComponentType]);
        setFormData(prev => ({ ...prev, category: String(newCat.id) }));
        toast.success("Category created");
      }
      setShowCategoryModal(false);
    } catch (e) {
      console.error(e);
      toast.error("Failed to save category");
    } finally {
      setIsModalSaving(false);
    }
  };

  const handleSavePackage = async () => {
    if (!modalName.trim()) return;
    setIsModalSaving(true);
    try {
      if (editingPackage) {
        await directus.request(updateItem('components_packages', editingPackage.id, {
          name: modalName
        }));
        setPackages(prev => prev.map(p => p.id === editingPackage.id ? { ...p, name: modalName } : p));
        toast.success("Package updated");
      } else {
        const newPkg = await directus.request(createItem('components_packages', {
          name: modalName
        }));
        setPackages(prev => [...prev, newPkg as ComponentPackage]);
        setFormData(prev => ({ ...prev, pkg: String(newPkg.id) }));
        toast.success("Package created");
      }
      setShowPackageModal(false);
    } catch (e) {
      console.error(e);
      toast.error("Failed to save package");
    } finally {
      setIsModalSaving(false);
    }
  };

  const handleAiFill = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a component name first");
      return;
    }

    setIsAiFilling(true);
    const toastId = toast.loading("AI is researching the component...");

    try {
      // 1. Search for component details using SerpApi
      const searchResponse = await fetch(`/api/search-images?q=${encodeURIComponent(formData.name)}`);
      if (!searchResponse.ok) throw new Error("Failed to search component");
      const searchResults = await searchResponse.json();
      
      const context = searchResults.slice(0, 5).map((r: any) => r.title).join("\n");

      // 2. Use our backend to fill fields
      const categoriesInfo = categories.map(c => `${c.name} (Subcategories: ${c.subcategory || 'none'})`).join("; ");
      const packagesInfo = packages.map(p => p.name).join(", ");
      
      const aiResponse = await fetch("/api/ai-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          context,
          categoriesInfo,
          packagesInfo
        })
      });

      if (!aiResponse.ok) throw new Error("Failed to get AI research");
      const data = await aiResponse.json();
      
      // Try to match category and package from existing options
      const matchedCategory = categories.find(c => 
        c.name.toLowerCase().includes(data.category.toLowerCase()) || 
        data.category.toLowerCase().includes(c.name.toLowerCase())
      );
      
      const matchedPackage = packages.find(p => 
        p.name.toLowerCase().includes(data.package.toLowerCase()) || 
        data.package.toLowerCase().includes(p.name.toLowerCase())
      );

      let proposedCategory: string | undefined;
      let proposedSubcategory: string | undefined;
      let proposedPackage: string | undefined;

      if (!matchedCategory && data.category) {
        proposedCategory = data.category;
      }
      
      if (data.subcategory) {
        if (matchedCategory && matchedCategory.subcategory) {
          const existingSubcategories = matchedCategory.subcategory.split(',').map(s => s.trim());
          const matchedSubcat = existingSubcategories.find(s => 
            s.toLowerCase() === data.subcategory.toLowerCase() ||
            s.toLowerCase().includes(data.subcategory.toLowerCase()) ||
            data.subcategory.toLowerCase().includes(s.toLowerCase())
          );
          
          if (matchedSubcat) {
            data.subcategory = matchedSubcat;
          } else {
            proposedSubcategory = data.subcategory;
          }
        } else {
          proposedSubcategory = data.subcategory;
        }
      }
      
      if (!matchedPackage && data.package) {
        proposedPackage = data.package;
      }

      setFormData(prev => ({
        ...prev,
        description: data.description || prev.description,
        category: matchedCategory ? matchedCategory.id.toString() : prev.category,
        subcategory: !proposedSubcategory ? data.subcategory : prev.subcategory,
        pkg: matchedPackage ? matchedPackage.id.toString() : prev.pkg,
        packetReference: data.packet_reference || prev.packetReference
      }));

      if (data.keywords && Array.isArray(data.keywords)) {
        setTags(prev => Array.from(new Set([...prev, ...data.keywords])));
      }

      if (proposedCategory || proposedSubcategory || proposedPackage) {
        setAiProposal({ category: proposedCategory, subcategory: proposedSubcategory, package: proposedPackage });
        toast.success("AI has filled the fields, but suggested some new categories/packages.", { id: toastId, duration: 5000 });
      } else {
        toast.success(
          <div className="flex flex-col gap-2">
            <p>AI has filled the fields!</p>
            <button 
              onClick={() => setShowImageSearchModal({ type: 'main', query: formData.name })}
              className="text-[10px] font-bold uppercase tracking-wider bg-primary text-white px-2 py-1 rounded hover:bg-primary/90 transition-colors w-fit"
            >
              Search for images now
            </button>
          </div>,
          { id: toastId, duration: 5000 }
        );
      }
    } catch (error) {
      console.error("AI Fill Error:", error);
      toast.error("AI failed to research the component", { id: toastId });
    } finally {
      setIsAiFilling(false);
    }
  };

  const handleSearchImages = async (query: string) => {
    if (!query.trim()) return;

    setIsSearchingImages(true);
    setSearchResults([]);
    try {
      const response = await fetch(`/api/search-images?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch images");
      }
      
      const results = await response.json();
      if (results && results.length > 0) {
        setSearchResults(results);
      } else {
        toast.info("No images found for this search");
      }
    } catch (error: any) {
      console.error("Image Search Error:", error);
      toast.error(error.message || "Failed to search for images");
    } finally {
      setIsSearchingImages(false);
    }
  };

  const selectWebImage = async (url: string) => {
    if (!showImageSearchModal) return;
    
    const toastId = toast.loading("Downloading image...");
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], "web-image.jpg", { type: blob.type });
      
      if (showImageSearchModal.type === 'main') {
        setMainImage(file);
      } else if (showImageSearchModal.type === 'datasheet') {
        setDatasheet(file);
      } else {
        setAdditionalImages(prev => [...prev, file]);
      }
      
      setShowImageSearchModal(null);
      toast.success("Image added!", { id: toastId });
    } catch (error) {
      console.error("Image Download Error:", error);
      toast.error("Failed to download image. It might be protected.", { id: toastId });
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name || !formData.category || !formData.description || tags.length === 0 || !formData.storageLocation) {
      toast.error("Please fill in all required fields (Name, Category, Description, Keywords, Storage Location).");
      return;
    }

    if (!isEditMode && !mainImage && !existingMainImage) {
      toast.error("Please upload a main image.");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading(isEditMode ? "Updating component..." : "Saving component...");
    try {
      let mainImageId = existingMainImage;
      let datasheetId = existingDatasheet;

      // 1. Upload Main Image if new one selected
      if (mainImage) {
        const mainImageFormData = new FormData();
        mainImageFormData.append('file', mainImage);
        const mainImageRes = await directus.request(uploadFiles(mainImageFormData));
        mainImageId = (mainImageRes as any).id;
      }

      // 2. Upload Datasheet if new one selected
      if (datasheet) {
        const datasheetFormData = new FormData();
        datasheetFormData.append('file', datasheet);
        const datasheetRes = await directus.request(uploadFiles(datasheetFormData));
        datasheetId = (datasheetRes as any).id;
      }

      // 3. Create or Update Component
      const componentData: any = {
        name: formData.name,
        description: formData.description,
        quantity_available: Number(formData.quantity),
        location: formData.storageLocation && formData.storageLocation !== "0" ? formData.storageLocation : null,
        url: formData.referenceUrl || null,
        keywords: tags,
        packet_reference: formData.packetReference || null,
        package: formData.pkg && formData.pkg !== "0" ? Number(formData.pkg) : null,
        type: formData.category && formData.category !== "0" ? Number(formData.category) : null,
        subcategory: formData.subcategory || null,
        barcode: barcodes.length > 0 ? barcodes.join(';') : null,
      };

      if (mainImageId) {
        componentData.main_image = mainImageId;
      }
      if (datasheetId) {
        componentData.datasheet = datasheetId;
      }

      let componentId = id ? Number(id) : null;

      if (isEditMode && id) {
        await directus.request(updateItem('components', Number(id), componentData));
      } else {
        const newComponentRes = await directus.request(createItem('components', componentData));
        componentId = (newComponentRes as any).id;
      }

      // 4. Upload Additional Images & Create Relations
      if (additionalImages.length > 0 && componentId) {
        for (const file of additionalImages) {
          const fileData = new FormData();
          fileData.append('file', file);
          const fileRes = await directus.request(uploadFiles(fileData));
          
          await directus.request(createItem('components_files', {
            components_id: componentId,
            directus_files_id: (fileRes as any).id
          }));
        }
      }

      // 5. Upload Additional Files & Create Relations
      if (additionalFiles.length > 0 && componentId) {
        for (const file of additionalFiles) {
          const fileData = new FormData();
          fileData.append('file', file);
          const fileRes = await directus.request(uploadFiles(fileData));
          
          await directus.request(createItem('components_files_1', {
            components_id: componentId,
            directus_files_id: (fileRes as any).id
          }));
        }
      }

      toast.success(isEditMode ? "Component updated successfully!" : "Component saved successfully!", { id: toastId });
      navigate("/inventory");
    } catch (error) {
      console.error("Error saving component:", error);
      toast.error("Failed to save component. Please check the console for details.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const focusClasses = "focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all";

  return (
    <>
      <main className="flex flex-1 justify-center py-8 px-6 lg:px-40">
        <div className="layout-content-container flex flex-col max-w-[1000px] flex-1">
          {/* Page Header */}
          <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
            <div className="flex flex-col gap-1">
              <h1 className="text-slate-900 dark:text-white text-3xl font-extrabold tracking-tight">{isEditMode ? "Edit Component" : "Add Component"}</h1>
              <p className="text-slate-500 dark:text-slate-400 text-base">
                {isEditMode ? "Update the technical and logistical specifications." : "Enter the technical and logistical specifications for the new component."}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(true)}
                className="flex min-w-[100px] cursor-pointer items-center justify-center rounded-xl h-10 px-5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex min-w-[140px] cursor-pointer items-center justify-center rounded-xl h-10 px-5 bg-primary text-white text-sm font-semibold shadow-lg shadow-primary/20 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (isEditMode ? "Updating..." : "Saving...") : (isEditMode ? "Update Component" : "Save Component")}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Primary Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Technical Details Section */}
              <section className="bg-white dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 mb-6 text-primary">
                  <Settings className="w-5 h-5" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Technical Information</h2>
                </div>
                <div className="space-y-6">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Name <span className="text-red-500">*</span></label>
                      <button 
                        onClick={handleAiFill}
                        disabled={isAiFilling || !formData.name.trim()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all disabled:opacity-50 disabled:hover:bg-primary/10 disabled:hover:text-primary group"
                      >
                        {isAiFilling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 group-hover:animate-pulse" />}
                        <span className="text-[11px] font-bold uppercase tracking-wider">Fill with AI</span>
                      </button>
                    </div>
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`form-input w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white h-12 px-4 text-base ${focusClasses}`}
                      placeholder="e.g. ATmega328P Microcontroller"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Category <span className="text-red-500">*</span></label>
                      <div className="flex gap-2">
                        <select 
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          disabled={isLoadingOptions}
                          className={`form-select w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white h-12 px-4 text-base ${focusClasses}`}
                        >
                          {isLoadingOptions ? (
                            <option>Loading...</option>
                          ) : (
                            categories.map(cat => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}{cat.subcategory ? ` - ${cat.subcategory}` : ''}
                              </option>
                            ))
                          )}
                        </select>
                        <button 
                          onClick={() => openCategoryModal()} 
                          className="flex items-center justify-center w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-primary hover:text-white hover:border-primary transition-colors shrink-0"
                          title="Create New Category"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => {
                            const selected = categories.find(c => c.id === Number(formData.category));
                            if (selected) openCategoryModal(selected);
                          }} 
                          disabled={!formData.category}
                          className="flex items-center justify-center w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-primary hover:text-white hover:border-primary transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Edit Selected Category"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Package</label>
                      <div className="flex gap-2">
                        <select 
                          name="pkg"
                          value={formData.pkg}
                          onChange={handleInputChange}
                          disabled={isLoadingOptions}
                          className={`form-select w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white h-12 px-4 text-base ${focusClasses}`}
                        >
                          {isLoadingOptions ? (
                            <option>Loading...</option>
                          ) : (
                            packages.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))
                          )}
                        </select>
                        <button 
                          onClick={() => openPackageModal()} 
                          className="flex items-center justify-center w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-primary hover:text-white hover:border-primary transition-colors shrink-0"
                          title="Create New Package"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => {
                            const selected = packages.find(p => p.id === Number(formData.pkg));
                            if (selected) openPackageModal(selected);
                          }} 
                          disabled={!formData.pkg}
                          className="flex items-center justify-center w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-primary hover:text-white hover:border-primary transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Edit Selected Package"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Description <span className="text-red-500">*</span></label>
                      <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                        <button 
                          onClick={() => setPreviewMode(false)}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${!previewMode ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                          Write
                        </button>
                        <button 
                          onClick={() => setPreviewMode(true)}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${previewMode ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                          Preview
                        </button>
                      </div>
                    </div>
                    <div className={`border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/20 transition-all bg-white dark:bg-slate-900 min-h-[250px]`}>
                      {!previewMode ? (
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          className="w-full h-full min-h-[250px] p-4 bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white resize-y outline-none"
                          placeholder="Enter component specifications, features, and technical notes... (Markdown supported)"
                        />
                      ) : (
                        <div className="p-4 prose dark:prose-invert max-w-none min-h-[250px]" data-color-mode="light">
                          {formData.description ? (
                            <MDEditor.Markdown source={formData.description} style={{ backgroundColor: 'transparent', color: 'inherit' }} />
                          ) : (
                            <p className="text-slate-400 italic">Nothing to preview...</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Keywords / Tags <span className="text-red-500">*</span></label>
                    <div className="flex flex-wrap gap-2 p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/20 transition-all">
                      {tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                          {tag}
                          <button onClick={() => removeTag(tag)} className="hover:bg-primary/20 rounded-full p-0.5 transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      <input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        className="border-none bg-transparent focus:ring-0 text-sm flex-1 min-w-[120px] p-1 outline-none"
                        placeholder="Type and press Enter..."
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Media & Files */}
              <section className="bg-white dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 mb-6 text-primary">
                  <Paperclip className="w-5 h-5" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Assets & Documentation</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Main Image */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Main Image <span className="text-red-500">*</span></label>
                      <button 
                        onClick={() => setShowImageSearchModal({ type: 'main', query: formData.name })}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-primary hover:text-white transition-all border border-slate-200 dark:border-slate-700 hover:border-primary"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Search Web</span>
                      </button>
                    </div>
                    <div 
                      onClick={() => mainImageRef.current?.click()}
                      className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-6 hover:border-primary hover:bg-primary/5 transition-all group cursor-pointer min-h-[140px]"
                    >
                      {mainImage ? (
                        <div className="flex flex-col items-center text-primary w-full">
                          <img 
                            src={URL.createObjectURL(mainImage)} 
                            alt="Main preview" 
                            className="w-full h-32 object-contain rounded-lg mb-2" 
                          />
                          <p className="text-sm font-bold text-center truncate w-full px-4">{mainImage.name}</p>
                          <p className="text-xs opacity-70 mt-1">Click to replace</p>
                        </div>
                      ) : existingMainImage ? (
                        <div className="flex flex-col items-center text-primary w-full">
                          <img 
                            src={getFileUrl(existingMainImage)} 
                            alt="Existing Main" 
                            className="w-full h-32 object-contain rounded-lg mb-2" 
                          />
                          <p className="text-sm font-bold text-center truncate w-full px-4">Current Image</p>
                          <p className="text-xs opacity-70 mt-1">Click to replace</p>
                        </div>
                      ) : (
                        <>
                          <ImageIcon className="w-8 h-8 text-slate-400 group-hover:text-primary transition-colors" />
                          <div className="text-center">
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-primary transition-colors">Upload Main Image</p>
                            <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 5MB</p>
                          </div>
                        </>
                      )}
                    </div>
                    <input type="file" hidden ref={mainImageRef} accept="image/*" onChange={(e) => handleSingleFile(e, setMainImage)} />
                  </div>

                  {/* Main Datasheet */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Datasheet (PDF/Image) <span className="text-red-500">*</span></label>
                      <button 
                        onClick={() => setShowImageSearchModal({ type: 'datasheet', query: `${formData.name} datasheet` })}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-primary hover:text-white transition-all border border-slate-200 dark:border-slate-700 hover:border-primary"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Search Web</span>
                      </button>
                    </div>
                    <div 
                      onClick={() => datasheetRef.current?.click()}
                      className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-6 hover:border-primary hover:bg-primary/5 transition-all group cursor-pointer min-h-[140px]"
                    >
                      {datasheet ? (
                        <div className="flex flex-col items-center text-primary w-full">
                          {datasheet.type.startsWith('image/') ? (
                            <img 
                              src={URL.createObjectURL(datasheet)} 
                              alt="Datasheet preview" 
                              className="w-full h-32 object-contain rounded-lg mb-2" 
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center w-full h-32 bg-red-50 dark:bg-red-900/10 rounded-lg mb-2 border border-red-100 dark:border-red-900/30">
                              <FileText className="w-10 h-10 text-red-500 mb-2" />
                              <span className="text-xs font-bold text-red-600 dark:text-red-400">PDF Document</span>
                              <span className="text-[10px] text-red-500/70">{(datasheet.size / 1024 / 1024).toFixed(2)} MB</span>
                            </div>
                          )}
                          <p className="text-sm font-bold text-center truncate w-full px-4">{datasheet.name}</p>
                          <p className="text-xs opacity-70 mt-1">Click to replace</p>
                        </div>
                      ) : existingDatasheet ? (
                         <div className="flex flex-col items-center text-primary w-full">
                            <div className="flex flex-col items-center justify-center w-full h-32 bg-slate-100 dark:bg-slate-800 rounded-lg mb-2 border border-slate-200 dark:border-slate-700">
                              <FileText className="w-10 h-10 text-slate-500 mb-2" />
                              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Current Datasheet</span>
                            </div>
                            <p className="text-xs opacity-70 mt-1">Click to replace</p>
                         </div>
                      ) : (
                        <>
                          <FileText className="w-8 h-8 text-slate-400 group-hover:text-primary transition-colors" />
                          <div className="text-center">
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-primary transition-colors">Upload Datasheet</p>
                            <p className="text-xs text-slate-500 mt-1">PDF or Image</p>
                          </div>
                        </>
                      )}
                    </div>
                    <input type="file" hidden ref={datasheetRef} accept=".pdf,image/*" onChange={(e) => handleSingleFile(e, setDatasheet)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Additional Images */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Additional Images</label>
                    <div 
                      onClick={() => additionalImagesRef.current?.click()}
                      className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 hover:border-primary hover:bg-primary/5 transition-all group cursor-pointer"
                    >
                      <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-primary transition-colors" />
                      <div className="text-center">
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-primary transition-colors">Add More Images</p>
                        <p className="text-xs text-slate-500">Select multiple files</p>
                      </div>
                    </div>
                    <input type="file" hidden multiple ref={additionalImagesRef} accept="image/*" onChange={(e) => handleMultipleFiles(e, setAdditionalImages)} />
                    
                    {additionalImages.length > 0 && (
                      <div className="flex flex-col gap-2 mt-2 max-h-40 overflow-y-auto pr-1">
                        {additionalImages.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <img 
                                src={URL.createObjectURL(file)} 
                                alt={`Preview ${idx}`} 
                                className="w-8 h-8 object-cover rounded shrink-0 border border-slate-200 dark:border-slate-700" 
                              />
                              <span className="text-xs truncate">{file.name}</span>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); removeMultipleFile(idx, setAdditionalImages); }} className="text-slate-400 hover:text-red-500 p-1 transition-colors">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Additional Files */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Additional Files</label>
                    <div 
                      onClick={() => additionalFilesRef.current?.click()}
                      className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 hover:border-primary hover:bg-primary/5 transition-all group cursor-pointer"
                    >
                      <FilePlus className="w-6 h-6 text-slate-400 group-hover:text-primary transition-colors" />
                      <div className="text-center">
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-primary transition-colors">Add More Documents</p>
                        <p className="text-xs text-slate-500">CAD, ZIP, TXT, etc.</p>
                      </div>
                    </div>
                    <input type="file" hidden multiple ref={additionalFilesRef} onChange={(e) => handleMultipleFiles(e, setAdditionalFiles)} />
                    
                    {additionalFiles.length > 0 && (
                      <div className="flex flex-col gap-2 mt-2 max-h-40 overflow-y-auto pr-1">
                        {additionalFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                              <span className="text-xs truncate">{file.name}</span>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); removeMultipleFile(idx, setAdditionalFiles); }} className="text-slate-400 hover:text-red-500 p-1 transition-colors">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Reference URL</label>
                  <div className={`mt-2 flex rounded-lg shadow-sm focus-within:ring-4 focus-within:ring-primary/20 focus-within:border-primary transition-all border border-slate-200 dark:border-slate-700`}>
                    <input
                      name="referenceUrl"
                      value={formData.referenceUrl}
                      onChange={handleInputChange}
                      className="form-input flex-1 block w-full rounded-lg border-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-0 text-sm h-11 px-4 outline-none"
                      placeholder="https://www.mouser.com/product/..."
                      type="text"
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Logistical Info */}
            <div className="space-y-8">
              <section className="bg-white dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm sticky top-24">
                <div className="flex items-center gap-2 mb-6 text-primary">
                  <Package className="w-5 h-5" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Logistics</h2>
                </div>
                <div className="space-y-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Quantity Available</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                        <Hash className="w-5 h-5" />
                      </span>
                      <input
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        className={`form-input w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white h-12 pl-10 pr-4 text-base ${focusClasses}`}
                        placeholder="0"
                        type="number"
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Storage Location <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                        <MapPin className="w-5 h-5" />
                      </span>
                      <select
                        name="storageLocation"
                        value={formData.storageLocation}
                        onChange={handleInputChange}
                        disabled={isLoadingOptions}
                        className={`form-select w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white h-12 pl-10 pr-4 text-base appearance-none ${focusClasses}`}
                      >
                        <option value="" disabled>{isLoadingOptions ? "Loading..." : "Select a location..."}</option>
                        {!isLoadingOptions && locations.map(loc => (
                          <option key={loc.id} value={loc.id}>{loc.name} ({loc.unique_id})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Packet Reference</label>
                    <input
                      name="packetReference"
                      value={formData.packetReference}
                      onChange={handleInputChange}
                      className={`form-input w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white h-12 px-4 text-base ${focusClasses}`}
                      placeholder="Internal Ref Code"
                      type="text"
                    />
                  </div>
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Barcodes / SKUs</label>
                    <div className="mt-2 flex flex-col gap-4">
                      <div className="flex flex-wrap gap-2 p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/20 transition-all">
                        {barcodes.map((code) => (
                          <span key={code} className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-1 rounded-md text-xs font-mono font-bold tracking-wider border border-slate-200 dark:border-slate-600">
                            {code}
                            <button onClick={() => removeBarcode(code)} className="hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 rounded-full p-0.5 transition-colors">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        <div className="relative flex-1 min-w-[150px] flex items-center">
                          <span className="absolute inset-y-0 left-0 pl-1 flex items-center text-slate-400">
                            <Barcode className="w-4 h-4" />
                          </span>
                          <input
                            className="w-full bg-transparent border-none focus:ring-0 text-sm h-8 pl-7 pr-8 outline-none font-mono"
                            placeholder="Scan or enter barcode..."
                            type="text"
                            value={barcodeInput}
                            onChange={(e) => setBarcodeInput(e.target.value)}
                            onKeyDown={handleBarcodeKeyDown}
                          />
                          <button 
                            onClick={() => setShowScanner(true)}
                            className="absolute right-1 p-1 text-slate-400 hover:text-primary transition-colors sm:hidden"
                            title="Scan with Camera"
                          >
                            <Camera className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 flex flex-col items-center justify-center gap-4 border border-slate-200 dark:border-slate-800 min-h-[160px] overflow-hidden">
                        {barcodes.length > 0 ? (
                          <div className="flex flex-col gap-4 w-full">
                            {barcodes.map((code) => (
                              <div key={code} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center gap-3 transition-all hover:shadow-md group relative">
                                <div className="flex justify-between items-start w-full">
                                  <div className="flex items-center gap-1.5">
                                    <Zap className="w-3.5 h-3.5 text-orange-500" />
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">ElectroStock</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[8px] font-mono text-slate-400 dark:text-slate-500">v2.4.0</span>
                                    <button 
                                      onClick={() => removeBarcode(code)}
                                      className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                      title="Remove Barcode"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                                
                                <div className="w-full flex flex-col items-center justify-center bg-white dark:bg-white rounded-lg p-3 border border-slate-100 dark:border-slate-200">
                                  <BarcodeGenerator value={code} height={40} displayValue={false} background="transparent" width={1.5} margin={0} />
                                  <div className="text-center text-[10px] font-mono mt-2 tracking-[0.2em] font-bold text-slate-900">{code}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <>
                            <div className="h-16 w-full bg-white dark:bg-slate-700 flex items-center justify-center rounded border border-slate-200 dark:border-slate-600 opacity-50">
                              <Barcode className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">
                              No barcodes added
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Footer Sticky for mobile or end of form */}
          <div className="mt-12 flex justify-end gap-4 pb-12 border-t border-slate-200 dark:border-slate-800 pt-8 lg:hidden">
            <button
              onClick={() => setShowCancelModal(true)}
              className="flex-1 cursor-pointer items-center justify-center rounded-xl h-12 px-5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-base font-semibold flex"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex-[2] cursor-pointer items-center justify-center rounded-xl h-12 px-5 bg-primary text-white text-base font-semibold shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving..." : "Save Component"}
            </button>
          </div>
        </div>
      </main>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4 text-amber-500">
              <div className="p-2 bg-amber-500/10 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Discard changes?</h3>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              You have unsaved changes. Are you sure you want to discard them and leave this page?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Keep Editing
              </button>
              <button
                onClick={() => navigate("/inventory")}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Proposal Modal */}
      {aiProposal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4 text-primary">
              <div className="p-2 bg-primary/10 rounded-full">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">AI Suggestions</h3>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              The AI suggested new options that don't exist in your database yet. Would you like to create them?
            </p>
            
            <div className="space-y-4 mb-6">
              {aiProposal.category && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">New Category</p>
                  <p className="text-slate-900 dark:text-white font-medium">{aiProposal.category}</p>
                </div>
              )}
              {aiProposal.subcategory && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">New Subcategory</p>
                  <p className="text-slate-900 dark:text-white font-medium">{aiProposal.subcategory}</p>
                </div>
              )}
              {aiProposal.package && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">New Package</p>
                  <p className="text-slate-900 dark:text-white font-medium">{aiProposal.package}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setAiProposal(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Ignore
              </button>
              <button
                onClick={async () => {
                  try {
                    let newCatId = formData.category;
                    let newPkgId = formData.pkg;
                    let newSubcat = formData.subcategory;

                    if (aiProposal.category) {
                      const catRes = await directus.request(createItem('components_types', { name: aiProposal.category }));
                      newCatId = catRes.id.toString();
                      setCategories(prev => [...prev, catRes as ComponentType]);
                    }
                    if (aiProposal.subcategory) {
                      newSubcat = aiProposal.subcategory;
                    }
                    if (aiProposal.package) {
                      const pkgRes = await directus.request(createItem('components_packages', { name: aiProposal.package }));
                      newPkgId = pkgRes.id.toString();
                      setPackages(prev => [...prev, pkgRes as ComponentPackage]);
                    }

                    setFormData(prev => ({
                      ...prev,
                      category: newCatId,
                      subcategory: newSubcat,
                      pkg: newPkgId
                    }));

                    toast.success("Created new options successfully");
                    setAiProposal(null);
                  } catch (error) {
                    console.error("Failed to create AI proposals", error);
                    toast.error("Failed to create new options");
                  }
                }}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              >
                Create & Apply
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              {editingCategory ? "Edit Category" : "New Category"}
            </h3>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Name <span className="text-red-500">*</span></label>
                <input
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  className={`form-input w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white h-10 px-3 text-sm ${focusClasses}`}
                  placeholder="e.g. Microcontrollers"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Subcategory</label>
                <textarea
                  value={modalSubcategory}
                  onChange={(e) => setModalSubcategory(e.target.value)}
                  className={`form-input w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-3 text-sm min-h-[80px] resize-none ${focusClasses}`}
                  placeholder="e.g. SMD, Through-hole..."
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCategory}
                disabled={isModalSaving || !modalName.trim()}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:brightness-110 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isModalSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingCategory ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Package Modal */}
      {showPackageModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              {editingPackage ? "Edit Package" : "New Package"}
            </h3>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Name <span className="text-red-500">*</span></label>
                <input
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  className={`form-input w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white h-10 px-3 text-sm ${focusClasses}`}
                  placeholder="e.g. DIP-28"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowPackageModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePackage}
                disabled={isModalSaving || !modalName.trim()}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:brightness-110 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isModalSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingPackage ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Search Modal */}
      {showImageSearchModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Search Web Images
              </h3>
              <button onClick={() => setShowImageSearchModal(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  defaultValue={showImageSearchModal.query}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearchImages(e.currentTarget.value);
                  }}
                  placeholder="Search for images..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <button 
                onClick={() => {
                  const input = document.querySelector('input[placeholder="Search for images..."]') as HTMLInputElement;
                  handleSearchImages(input.value);
                }}
                disabled={isSearchingImages}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50"
              >
                {isSearchingImages ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
              {isSearchingImages ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-4" />
                  <p>Searching the web...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {searchResults.map((result, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => selectWebImage(result.url)}
                      className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-primary transition-all"
                    >
                      <img 
                        src={result.url} 
                        alt={result.title} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold uppercase tracking-widest bg-primary px-2 py-1 rounded">Select</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <ImageIcon className="w-12 h-12 mb-4 opacity-20" />
                  <p>Enter a search term to find images</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <BarcodeScanner 
          onScan={(decodedText) => {
            if (!barcodes.includes(decodedText)) {
              setBarcodes(prev => [...prev, decodedText]);
              toast.success(`Scanned: ${decodedText}`);
            }
            setShowScanner(false);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </>
  );
}
