import React from 'react';
import type { ClothingItem } from '../types';

interface ClothingCardProps {
  item: ClothingItem;
  onUpdate: (updatedItem: ClothingItem) => void;
  onEdit: (item: ClothingItem) => void;
}

const ClothingCard: React.FC<ClothingCardProps> = ({ item, onUpdate, onEdit }) => {
  const handleToggleAvailability = () => {
    onUpdate({ ...item, isAvailable: !item.isAvailable });
  };
  
  const primaryColor = item.colors.find(c => c.type === 'Primary') || item.colors[0];
  const otherColors = item.colors.filter(c => c !== primaryColor);

  return (
    <div className="relative group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md overflow-hidden transform transition-all hover:shadow-xl hover:-translate-y-1">
      <div className={`absolute top-2 right-2 z-10 flex items-center px-2 py-1 text-xs font-bold text-white rounded-full ${item.isAvailable ? 'bg-green-500' : 'bg-red-500'}`}>
        {item.isAvailable ? 'Available' : 'Unavailable'}
      </div>
      <div className="w-full h-56">
        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white capitalize truncate" title={item.name}>{item.name}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{primaryColor?.name} {item.category}</p>
        
        <div className="mt-2 flex items-center space-x-2">
            {item.colors.map((color) => (
                <div key={color.hex} className="w-5 h-5 rounded-full border-2 dark:border-gray-600" style={{ backgroundColor: color.hex }} title={`${color.name} (${color.type})`}></div>
            ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
            {item.tags.slice(0, 3).map(tag => (
                <span key={tag} className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full">{tag}</span>
            ))}
        </div>
        
        <div className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-300">
          <p><span className="font-medium">Formality:</span> {item.formality}</p>
          <p><span className="font-medium">Season:</span> {item.season}</p>
          <p><span className="font-medium">Fit:</span> {item.fit}</p>
        </div>
      </div>
       <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-between">
         <label className="flex items-center cursor-pointer">
          <div className="relative">
            <input type="checkbox" className="sr-only" checked={item.isAvailable} onChange={handleToggleAvailability} />
            <div className={`block w-14 h-8 rounded-full ${item.isAvailable ? 'bg-blue-600' : 'bg-gray-600'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${item.isAvailable ? 'transform translate-x-6' : ''}`}></div>
          </div>
          <div className="ml-3 text-gray-700 dark:text-gray-200 font-medium text-sm">
            Availability
          </div>
        </label>
        <button 
            onClick={() => onEdit(item)}
            className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-2 rounded-full"
            aria-label={`Edit ${item.name}`}
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" />
             </svg>
        </button>
      </div>
    </div>
  );
};

export default ClothingCard;