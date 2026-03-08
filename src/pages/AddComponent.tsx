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
  FilePlus
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import BarcodeGenerator from "react-barcode";
import MDEditor from '@uiw/react-md-editor';
import { toast } from "sonner";
import { directus, Box, ComponentPackage, ComponentType } from "../lib/directus";
import { readItems, uploadFiles, createItem } from "@directus/sdk";

export function AddComponent() {
  const navigate = useNavigate();
  const [barcodeValue, setBarcodeValue] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Options State
  const [categories, setCategories] = useState<ComponentType[]>([]);
  const [packages, setPackages] = useState<ComponentPackage[]>([]);
  const [locations, setLocations] = useState<Box[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    pkg: "",
    description: "",
    quantity: 0,
    storageLocation: "",
    packetReference: "",
    referenceUrl: "",
  });

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

        // Set default values if available
        setFormData(prev => ({
          ...prev,
          category: fetchedCategories.length > 0 ? fetchedCategories[0].id.toString() : "",
          pkg: fetchedPackages.length > 0 ? fetchedPackages[0].id.toString() : "",
          storageLocation: fetchedLocations.length > 0 ? fetchedLocations[0].id.toString() : "",
        }));
      } catch (error) {
        console.error("Error fetching options from Directus:", error);
      } finally {
        setIsLoadingOptions(false);
      }
    };

    fetchOptions();
  }, []);

  // Tags State
  const [tags, setTags] = useState<string[]>(["AVR", "8-BIT"]);
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

  const handleSave = async () => {
    if (!formData.name || !formData.category || !formData.description || tags.length === 0 || !formData.storageLocation || !mainImage || !datasheet) {
      toast.error("Please fill in all required fields (Name, Category, Description, Keywords, Storage Location, Main Image, Datasheet).");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading("Saving component...");
    try {
      // 1. Upload Main Image
      const mainImageFormData = new FormData();
      mainImageFormData.append('file', mainImage);
      const mainImageRes = await directus.request(uploadFiles(mainImageFormData));
      // uploadFiles returns the file object directly
      const mainImageId = (mainImageRes as any).id;

      // 2. Upload Datasheet
      const datasheetFormData = new FormData();
      datasheetFormData.append('file', datasheet);
      const datasheetRes = await directus.request(uploadFiles(datasheetFormData));
      const datasheetId = (datasheetRes as any).id;

      // 3. Create Component
      const componentData = {
        name: formData.name,
        description: formData.description,
        main_image: mainImageId,
        datasheet: datasheetId,
        quantity_available: Number(formData.quantity),
        location: formData.storageLocation,
        url: formData.referenceUrl || null,
        keywords: tags,
        packet_reference: formData.packetReference || null,
        package: Number(formData.pkg),
        type: Number(formData.category),
        barcode: barcodeValue || null,
      };

      const newComponentRes = await directus.request(createItem('components', componentData));
      const componentId = (newComponentRes as any).id;

      // 4. Upload Additional Images & Create Relations
      if (additionalImages.length > 0) {
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
      if (additionalFiles.length > 0) {
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

      toast.success("Component saved successfully!", { id: toastId });
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
              <h1 className="text-slate-900 dark:text-white text-3xl font-extrabold tracking-tight">Add Component</h1>
              <p className="text-slate-500 dark:text-slate-400 text-base">
                Enter the technical and logistical specifications for the new component.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(true)}
                className="flex min-w-[100px] cursor-pointer items-center justify-center rounded-lg h-10 px-5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex min-w-[140px] cursor-pointer items-center justify-center rounded-lg h-10 px-5 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "Saving..." : "Save Component"}
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
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Name <span className="text-red-500">*</span></label>
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
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))
                        )}
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Package</label>
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
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Main Image <span className="text-red-500">*</span></label>
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
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Datasheet (PDF/Image) <span className="text-red-500">*</span></label>
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
                    <span className="inline-flex items-center px-3 rounded-l-lg border-r border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 text-sm">
                      https://
                    </span>
                    <input
                      name="referenceUrl"
                      value={formData.referenceUrl}
                      onChange={handleInputChange}
                      className="form-input flex-1 block w-full rounded-none rounded-r-lg border-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-0 text-sm h-11 outline-none"
                      placeholder="www.mouser.com/product/..."
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
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Barcode / SKU</label>
                    <div className="mt-2 flex flex-col gap-4">
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                          <Barcode className="w-5 h-5" />
                        </span>
                        <input
                          className={`form-input w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white h-12 pl-10 pr-4 text-base ${focusClasses}`}
                          placeholder="Scan or enter barcode"
                          type="text"
                          value={barcodeValue}
                          onChange={(e) => setBarcodeValue(e.target.value)}
                        />
                      </div>
                      <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 flex flex-col items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 min-h-[120px] overflow-hidden">
                        {barcodeValue ? (
                          <div className="bg-white p-2 rounded flex items-center justify-center w-full overflow-hidden">
                            <BarcodeGenerator value={barcodeValue} height={50} displayValue={false} background="transparent" />
                          </div>
                        ) : (
                          <>
                            <div className="h-16 w-full bg-white dark:bg-slate-700 flex items-center justify-center rounded border border-slate-200 dark:border-slate-600 opacity-50">
                              <Barcode className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">
                              No barcode generated
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
              className="flex-1 cursor-pointer items-center justify-center rounded-lg h-12 px-5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-base font-bold flex"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex-[2] cursor-pointer items-center justify-center rounded-lg h-12 px-5 bg-primary text-white text-base font-bold shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="px-4 py-2 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Keep Editing
              </button>
              <button
                onClick={() => navigate("/inventory")}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
