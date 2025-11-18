
import React, { useState, useCallback } from 'react';
import { analyzeClothingItem } from '../services/geminiService';
import { uploadImageToCloudinary } from '../services/uploadService';
import { ClothingCategory, Formality, Season, ClothingItem, AnalyzedClothingItem, Gender, Fit, Layering } from '../types';
import Spinner from './Spinner';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: Omit<ClothingItem, 'id' | 'isAvailable'>) => void;
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });


const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose, onAddItem }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Partial<AnalyzedClothingItem>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1); // 1: Upload, 2: Confirm

  const resetState = useCallback(() => {
    setFile(null);
    setPreview(null);
    setAnalysis({});
    setIsLoading(false);
    setError(null);
    setStep(1);
  }, []);

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setError(null);
    }
  };
  
  const handleAnalyze = async () => {
    if (!file) {
      setError("Please select an image file first.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // 1. Upload image to Cloudinary via the secure backend API
      const imageUrl = await uploadImageToCloudinary(file);
      
      // 2. Analyze the image using Gemini (still requires base64 for the Gemini service)
      const base64 = await fileToBase64(file);
      const result = await analyzeClothingItem(base64, file.type);
      
      // 3. Store the Cloudinary URL in the analysis state for later submission
      setAnalysis({ ...result, imageUrl });
      setStep(2);
    } catch (err) {
      setError("Failed to analyze image. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAnalysis(prev => ({...prev, [name]: value}));
  };

   const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',').map(tag => tag.trim());
    setAnalysis(prev => ({ ...prev, tags }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { imageUrl, name, category, gender, colors, tags, fabric, texture, season, formality, fit, layering } = analysis;
    if (imageUrl && name && category && gender && colors && tags && fabric && texture && season && formality && fit && layering) {
      onAddItem({
        imageUrl, // Use the Cloudinary URL instead of the local preview URL
        name, category, gender, colors, tags, fabric, texture, season, formality, fit, layering
      });
      handleClose();
    } else {
      setError("Please ensure all fields are filled out.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm" onClick={handleClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg m-4 transform transition-all" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Clothing Item</h2>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded" role="alert"><p>{error}</p></div>}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload Image</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        <span>Upload a file</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </div>
              </div>
              {preview && <img src={preview} alt="Preview" className="w-full h-auto rounded-lg object-contain max-h-60" />}
              <button
                onClick={handleAnalyze}
                disabled={!file || isLoading}
                className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition duration-300"
              >
                {isLoading ? <><Spinner /> Analyzing...</> : "Analyze Item"}
              </button>
            </div>
          )}

          {step === 2 && (
             <form onSubmit={handleSubmit} className="space-y-4">
              {preview && <img src={preview} alt="Preview" className="w-full h-auto rounded-lg object-contain max-h-48" />}
              
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Item Name</label>
                  <input type="text" name="name" value={analysis.name || ''} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md" required />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                  <select name="category" value={analysis.category || ''} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                      {Object.values(ClothingCategory).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
                  <select name="gender" value={analysis.gender || ''} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                      {Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Colors</label>
                <div className="mt-1 flex flex-wrap gap-2 items-center p-2 border border-gray-300 dark:border-gray-600 rounded-md">
                  {analysis.colors?.map(color => (
                    <div key={color.hex} className="flex items-center gap-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                      <div className="w-4 h-4 rounded-full border dark:border-gray-500" style={{ backgroundColor: color.hex }}></div>
                      <span className="text-sm">{color.name}</span>
                      <span className="text-xs text-gray-500">({color.type})</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tags (comma-separated)</label>
                  <input type="text" name="tags" value={analysis.tags?.join(', ') || ''} onChange={handleTagsChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"/>
              </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fabric</label>
                      <input type="text" name="fabric" value={analysis.fabric || ''} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"/>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Texture</label>
                      <input type="text" name="texture" value={analysis.texture || ''} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"/>
                  </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Season</label>
                  <select name="season" value={analysis.season || ''} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                      {Object.values(Season).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Formality</label>
                  <select name="formality" value={analysis.formality || ''} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                      {Object.values(Formality).map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fit</label>
                    <select name="fit" value={analysis.fit || ''} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                        {Object.values(Fit).map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Layering</label>
                    <select name="layering" value={analysis.layering || ''} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                        {Object.values(Layering).map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
              </div>


              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setStep(1)} className="w-full bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-lg hover:bg-gray-300 transition duration-300">Back</button>
                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300">Add to Wardrobe</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddItemModal;