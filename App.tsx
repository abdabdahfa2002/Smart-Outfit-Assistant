
import React, { useState, useEffect } from 'react';
import type { ClothingItem, Outfit, UserProfile } from './types';
import { ClothingCategory, Formality, Season, StylePreference, Gender, Fit, Layering } from './types';
import ClothingCard from './components/ClothingCard';
import AddItemModal from './components/AddItemModal';
import EditItemModal from './components/EditItemModal';
import { getOutfitRecommendation, generateVirtualTryOn } from './services/geminiService';
import Spinner from './components/Spinner';

// Initial mock data for first-time users, updated to the new data model
const initialWardrobe: ClothingItem[] = [
    { 
        id: '1', 
        name: 'Plain White T-Shirt',
        imageUrl: 'https://picsum.photos/id/10/400/600', 
        category: ClothingCategory.TOP, 
        gender: Gender.UNISEX,
        colors: [{ type: 'Primary', name: 'White', hex: '#FFFFFF' }],
        tags: ['Solid', 'Plain'],
        fabric: 'Cotton',
        texture: 'Soft',
        season: Season.ALL_SEASON, 
        formality: Formality.CASUAL, 
        fit: Fit.REGULAR,
        layering: Layering.BASE,
        isAvailable: true 
    },
    { 
        id: '2', 
        name: 'Blue Slim-Fit Jeans',
        imageUrl: 'https://picsum.photos/id/20/400/600', 
        category: ClothingCategory.BOTTOM, 
        gender: Gender.UNISEX,
        colors: [{ type: 'Primary', name: 'Blue', hex: '#0000FF' }],
        tags: ['Denim'],
        fabric: 'Denim',
        texture: 'Slightly Rough',
        season: Season.ALL_SEASON, 
        formality: Formality.CASUAL, 
        fit: Fit.SLIM,
        layering: Layering.BASE,
        isAvailable: true 
    },
    { 
        id: '3', 
        name: 'Black Leather Jacket',
        imageUrl: 'https://picsum.photos/id/30/400/600', 
        category: ClothingCategory.OUTERWEAR, 
        gender: Gender.MALE,
        colors: [{ type: 'Primary', name: 'Black', hex: '#000000' }],
        tags: ['Solid', 'Leather'],
        fabric: 'Leather',
        texture: 'Smooth',
        season: Season.AUTUMN, 
        formality: Formality.SMART_CASUAL, 
        fit: Fit.REGULAR,
        layering: Layering.OUTER,
        isAvailable: true 
    },
    { 
        id: '4', 
        name: 'White Canvas Sneakers',
        imageUrl: 'https://picsum.photos/id/40/400/600', 
        category: ClothingCategory.FOOTWEAR, 
        gender: Gender.UNISEX,
        colors: [{ type: 'Primary', name: 'White', hex: '#FFFFFF' }],
        tags: ['Sneakers', 'Laces'],
        fabric: 'Canvas',
        texture: 'Matte',
        season: Season.ALL_SEASON, 
        formality: Formality.CASUAL, 
        fit: Fit.REGULAR,
        layering: Layering.BASE, // Not applicable, but required
        isAvailable: true 
    },
    { 
        id: '5', 
        name: 'Red Floral Summer Dress',
        imageUrl: 'https://picsum.photos/id/50/400/600', 
        category: ClothingCategory.DRESS, 
        gender: Gender.FEMALE,
        colors: [
            { type: 'Primary', name: 'Red', hex: '#FF0000' },
            { type: 'Secondary', name: 'Green', hex: '#00FF00' },
        ],
        tags: ['Floral', 'Sleeveless'],
        fabric: 'Viscose',
        texture: 'Lightweight',
        season: Season.SUMMER, 
        formality: Formality.CASUAL, 
        fit: Fit.LOOSE,
        layering: Layering.BASE,
        isAvailable: false 
    },
    { 
        id: '6', 
        name: 'Brown Leather Belt',
        imageUrl: 'https://picsum.photos/id/60/400/600', 
        category: ClothingCategory.ACCESSORY, 
        gender: Gender.UNISEX,
        colors: [{ type: 'Primary', name: 'Brown', hex: '#A52A2A' }],
        tags: ['Leather', 'Belt'],
        fabric: 'Leather',
        texture: 'Smooth',
        season: Season.ALL_SEASON, 
        formality: Formality.SMART_CASUAL, 
        fit: Fit.REGULAR, // Not applicable, but required
        layering: Layering.BASE, // Not applicable, but required
        isAvailable: true 
    },
];

const initialProfile: UserProfile = {
  height: '',
  weight: '',
  stylePreferences: [],
  favoriteColors: [],
  photoUrl: '',
};


type View = 'wardrobe' | 'recommendation' | 'profile';


const App: React.FC = () => {
  const [wardrobeItems, setWardrobeItems] = useState<ClothingItem[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(initialProfile);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);
  const [currentView, setCurrentView] = useState<View>('wardrobe');

  // Register Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          console.log('SW registered: ', registration);
        }).catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
      });
    }
  }, []);

  // Load state from localStorage on initial render
  useEffect(() => {
    try {
      const savedWardrobe = localStorage.getItem('wardrobe');
      setWardrobeItems(savedWardrobe ? JSON.parse(savedWardrobe) : initialWardrobe);

      const savedProfile = localStorage.getItem('userProfile');
      setUserProfile(savedProfile ? JSON.parse(savedProfile) : initialProfile);
    } catch (error) {
      console.error("Failed to parse from localStorage", error);
      setWardrobeItems(initialWardrobe);
      setUserProfile(initialProfile);
    }
  }, []);

  // Persist wardrobe to localStorage
  useEffect(() => {
    localStorage.setItem('wardrobe', JSON.stringify(wardrobeItems));
  }, [wardrobeItems]);

  // Persist profile to localStorage
  useEffect(() => {
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
  }, [userProfile]);


  const addClothingItem = (itemData: Omit<ClothingItem, 'id' | 'isAvailable'>) => {
    const newItem: ClothingItem = {
      ...itemData,
      id: new Date().toISOString(),
      isAvailable: true,
    };
    setWardrobeItems(prev => [newItem, ...prev]);
  };

  const updateClothingItem = (updatedItem: ClothingItem) => {
    setWardrobeItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    // Close the edit modal if it's open
    if (isEditModalOpen) {
      setIsEditModalOpen(false);
      setEditingItem(null);
    }
  };
  
  const handleOpenEditModal = (item: ClothingItem) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  const Header = () => (
    <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Smart Outfit Assistant</h1>
          </div>
          <nav className="flex space-x-2 bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
            <button
              onClick={() => setCurrentView('wardrobe')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${currentView === 'wardrobe' ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
            >
              My Wardrobe
            </button>
            <button
              onClick={() => setCurrentView('recommendation')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${currentView === 'recommendation' ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
            >
              Get Outfit
            </button>
             <button
              onClick={() => setCurrentView('profile')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${currentView === 'profile' ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
            >
              Profile
            </button>
          </nav>
        </div>
      </div>
    </header>
  );

  const WardrobeView = () => (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Your Digital Wardrobe</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition duration-300 transform hover:scale-105"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
          Add New Item
        </button>
      </div>
       {wardrobeItems.length === 0 ? (
        <div className="text-center py-12 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <p className="text-lg text-gray-600 dark:text-gray-400">Your wardrobe is empty.</p>
          <p className="mt-2 text-gray-500 dark:text-gray-500">Click "Add New Item" to start building your digital wardrobe!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {wardrobeItems.map(item => (
            <ClothingCard key={item.id} item={item} onUpdate={updateClothingItem} onEdit={handleOpenEditModal} />
          ))}
        </div>
      )}
    </div>
  );

  const RecommendationView = () => {
      const [occasion, setOccasion] = useState('');
      const [mustUseItemId, setMustUseItemId] = useState<string>('');
      const [outfit, setOutfit] = useState<Outfit | null>(null);
      const [isLoading, setIsLoading] = useState(false);
      const [error, setError] = useState<string | null>(null);
      const [generatedImage, setGeneratedImage] = useState<string | null>(null);
      const [isGenerating, setIsGenerating] = useState(false);
      const [generationError, setGenerationError] = useState<string | null>(null);


      const handleGetRecommendation = async (e: React.FormEvent) => {
          e.preventDefault();
          if (!occasion.trim()) {
              setError("Please enter an occasion.");
              return;
          }
          setIsLoading(true);
          setError(null);
          setOutfit(null);
          setGeneratedImage(null);
          setGenerationError(null);
          try {
              const result = await getOutfitRecommendation(wardrobeItems, occasion, userProfile, mustUseItemId || undefined);
              const outfitItems = result.itemIds.map(id => wardrobeItems.find(item => item.id === id)).filter((item): item is ClothingItem => !!item);
              if (outfitItems.length !== result.itemIds.length) {
                throw new Error("Could not find all recommended items in the wardrobe.");
              }
              setOutfit({ items: outfitItems, reasoning: result.reasoning, occasion });
          } catch (err: any) {
              setError(err.message || "Failed to get recommendation. Please try again.");
          } finally {
              setIsLoading(false);
          }
      };
      
      const handleVisualize = async () => {
        if (!outfit || !userProfile.photoUrl) return;

        setIsGenerating(true);
        setGeneratedImage(null);
        setGenerationError(null);

        try {
            const generatedImgSrc = await generateVirtualTryOn(userProfile.photoUrl, outfit.items);
            setGeneratedImage(generatedImgSrc);
        } catch (err: any) {
            setGenerationError(err.message || "Failed to generate virtual try-on image.");
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };


      return (
          <div className="p-4 sm:p-6 lg:p-8">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Get an Outfit Recommendation</h2>
              <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                  <form onSubmit={handleGetRecommendation} className="space-y-4">
                      <div>
                        <label htmlFor="occasion" className="block text-sm font-medium text-gray-700 dark:text-gray-300">What's the occasion?</label>
                        <input
                            type="text"
                            id="occasion"
                            value={occasion}
                            onChange={(e) => setOccasion(e.target.value)}
                            placeholder="e.g., Casual brunch, business meeting, date night"
                            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md p-3 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label htmlFor="must-use-item" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Must use this item (Optional)</label>
                        <select
                            id="must-use-item"
                            value={mustUseItemId}
                            onChange={(e) => setMustUseItemId(e.target.value)}
                            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md p-3 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">-- Choose an item --</option>
                            {wardrobeItems.filter(item => item.isAvailable).map(item => (
                                <option key={item.id} value={item.id}>{item.name}</option>
                            ))}
                        </select>
                      </div>
                      <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition duration-300">
                          {isLoading ? <><Spinner /> Finding an outfit...</> : "Get Recommendation"}
                      </button>
                  </form>
              </div>

              {error && <div className="max-w-xl mx-auto mt-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert"><p>{error}</p></div>}
              
              {outfit && (
                  <div className="mt-8 max-w-4xl mx-auto">
                      <h3 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-2">Your Outfit for: <span className="text-blue-600 dark:text-blue-400">{outfit.occasion}</span></h3>
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                          <p className="text-gray-600 dark:text-gray-300 mb-6 italic text-center">"{outfit.reasoning}"</p>
                          <div className="flex flex-wrap justify-center gap-4">
                              {outfit.items.map(item => (
                                  <div key={item.id} className="w-40 text-center">
                                      <img src={item.imageUrl} alt={item.name} className="w-full h-52 object-cover rounded-lg shadow-md mb-2" />
                                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 capitalize">{item.name}</p>
                                  </div>
                              ))}
                          </div>
                          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6 text-center">
                              <h4 className="text-lg font-semibold text-gray-800 dark:text-white">Virtual Try-On</h4>
                              {!userProfile.photoUrl ? (
                                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                      Upload a photo in your <button onClick={() => setCurrentView('profile')} className="text-blue-600 hover:underline font-medium">profile</button> to visualize this outfit.
                                  </p>
                              ) : (
                                  <button onClick={handleVisualize} disabled={isGenerating} className="mt-2 w-full md:w-auto flex justify-center items-center gap-2 bg-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-purple-700 disabled:bg-purple-400 transition duration-300">
                                      {isGenerating ? <><Spinner /> Generating Image...</> : "✨ Visualize on Me"}
                                  </button>
                              )}
                          </div>
                      </div>
                  </div>
              )}

              {isGenerating && (
                  <div className="mt-8 text-center">
                      <div className="flex justify-center items-center flex-col p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
                          <Spinner className="w-12 h-12" />
                          <p className="mt-4 text-gray-600 dark:text-gray-300">Our AI stylist is working its magic... This might take a moment.</p>
                      </div>
                  </div>
              )}
              {generationError && <div className="max-w-xl mx-auto mt-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert"><p>{generationError}</p></div>}
              {generatedImage && (
                  <div className="mt-8 max-w-xl mx-auto">
                      <h3 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-4">Here's Your Look!</h3>
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
                          <img src={generatedImage} alt="Virtual try-on result" className="w-full h-auto rounded-lg" />
                      </div>
                  </div>
              )}
          </div>
      );
  };
  
  const ProfileView = () => {
    const [localProfile, setLocalProfile] = useState<UserProfile>(userProfile);
    const [saved, setSaved] = useState(false);

    const handleStyleChange = (style: StylePreference) => {
      setLocalProfile(prev => {
        const newStyles = prev.stylePreferences.includes(style)
          ? prev.stylePreferences.filter(s => s !== style)
          : [...prev.stylePreferences, style];
        return { ...prev, stylePreferences: newStyles };
      });
    };

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const colors = e.target.value.split(',').map(c => c.trim()).filter(Boolean);
      setLocalProfile(prev => ({ ...prev, favoriteColors: colors }));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setLocalProfile(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            try {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => {
                    setLocalProfile(prev => ({ ...prev, photoUrl: reader.result as string }));
                };
                reader.onerror = (error) => {
                    console.error("Error converting file to Data URL", error);
                };
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setUserProfile(localProfile);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    };

    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Your Profile</h2>
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Your Photo</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Upload a full-body photo for virtual try-on.</p>
              <div className="mt-4 flex items-center gap-4">
                  {localProfile.photoUrl ? (
                      <img src={localProfile.photoUrl} alt="User" className="w-24 h-24 rounded-full object-cover shadow-md" />
                  ) : (
                      <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                      </div>
                  )}
                  <label htmlFor="photo-upload" className="cursor-pointer bg-white dark:bg-gray-700 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                      <span>Change Photo</span>
                      <input id="photo-upload" name="photo-upload" type="file" className="sr-only" accept="image/*" onChange={handlePhotoChange} />
                  </label>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Measurements</h3>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="height" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Height (cm)</label>
                  <input type="number" name="height" id="height" value={localProfile.height} onChange={handleInputChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md p-2 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label htmlFor="weight" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Weight (kg)</label>
                  <input type="number" name="weight" id="weight" value={localProfile.weight} onChange={handleInputChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md p-2 dark:bg-gray-700 dark:text-white" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Style Preferences</h3>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Object.values(StylePreference).map(style => (
                  <label key={style} className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" checked={localProfile.stylePreferences.includes(style)} onChange={() => handleStyleChange(style)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{style}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="favoriteColors" className="block text-lg font-medium text-gray-900 dark:text-white">Favorite Colors</label>
              <p className="text-sm text-gray-500 dark:text-gray-400">Separate colors with a comma (e.g., Blue, Black, White)</p>
              <input type="text" name="favoriteColors" id="favoriteColors" value={localProfile.favoriteColors.join(', ')} onChange={handleColorChange} className="mt-2 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md p-2 dark:bg-gray-700 dark:text-white" />
            </div>

            <div className="flex justify-end pt-4">
              <button type="submit" className="flex justify-center items-center gap-2 bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition duration-300">
                {saved ? "Saved!" : "Save Profile"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Header />
      <main className="container mx-auto">
        {currentView === 'wardrobe' && <WardrobeView />}
        {currentView === 'recommendation' && <RecommendationView />}
        {currentView === 'profile' && <ProfileView />}
      </main>
      <AddItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddItem={addClothingItem}
      />
      <EditItemModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdateItem={updateClothingItem}
        item={editingItem}
      />
    </div>
  );
};

export default App;