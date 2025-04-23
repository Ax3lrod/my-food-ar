'use client';
import { useState, useCallback } from 'react';
import CameraScanner from './components/CameraScanner';
import BlankPage from './components/BlankPage';

export default function Home() {
  const [ingredients, setIngredients] = useState(new Set());
  const [recipe, setRecipe] = useState('');
  const [loading, setLoading] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);

  const addIngredient = useCallback(item => setIngredients(prev => new Set(prev).add(item)), []);
  const endpoint = '/api/recipes-together';

  const removeIngredient = useCallback(item => {
    setIngredients(prev => {
      const newSet = new Set(prev);
      newSet.delete(item);
      return newSet;
    });
  }, []);

  const clearAllIngredients = useCallback(() => {
    setIngredients(new Set());
    setRecipe('');
  }, []);

  const askRecipe = async () => {
    setLoading(true);
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ items: Array.from(ingredients) })
    });
    const payload = await res.json();
    setRecipe(payload.suggestion || payload.error);
    setLoading(false);
  };

  const toggleCamera = () => {
    setCameraEnabled(prev => !prev);
  };

  return (
    <main className="p-0.5 max-w-5xl mx-auto">
      <h1 className="text-4xl font-bold mb-4 mt-4 text-center">AR Ingredient Scanner</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="md:col-span-3 rounded-xl overflow-hidden h-[400px]">
          {cameraEnabled ? (
            <CameraScanner onUpdate={addIngredient} enabled={cameraEnabled} />
          ) : (
            <BlankPage />
          )}
        </div>
        
        <div className="md:col-span-2 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800 p-4 h-[400px] flex flex-col">
          <h2 className="font-semibold mb-2">Recipe Suggestions</h2>
          <div className="overflow-y-auto flex-grow recipe-section">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p>Loading recipe suggestions...</p>
              </div>
            ) : recipe ? (
              <pre className="bg-white dark:bg-gray-700 p-4 rounded-md whitespace-pre-wrap h-full">{recipe}</pre>
            ) : (
              <div className="flex items-center justify-center text-gray-500 dark:text-gray-400 h-full">
                <p>Select ingredients and click "Get Recipe Suggestions"</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="mt-8 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Detected Ingredients</h2>
          <div className="flex items-center gap-2">
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {ingredients.size} {ingredients.size === 1 ? 'item' : 'items'} found
            </span>
            {ingredients.size > 0 && (
              <button 
                onClick={clearAllIngredients}
                className="text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-0.5 px-2 rounded-full transition duration-200"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
        
        {ingredients.size > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from(ingredients).sort().map(ingredient => (
              <div 
                key={ingredient} 
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600 flex items-center group hover:bg-gray-100 dark:hover:bg-gray-600 transition-all"
              >
                <div className="h-8 w-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <span role="img" aria-label="food" className="text-lg">
                    {ingredient.toLowerCase().includes('fruit') || 
                     ingredient === 'apple' || 
                     ingredient === 'orange' || 
                     ingredient === 'banana' ? '🍎' :
                     ingredient.toLowerCase().includes('vegetable') || 
                     ingredient === 'carrot' || 
                     ingredient === 'broccoli' ? '🥦' : 
                     ingredient.toLowerCase().includes('meat') || 
                     ingredient === 'beef' || 
                     ingredient === 'steak' ? '🥩' :
                     ingredient.toLowerCase().includes('chicken') ? '🍗' :
                     ingredient.toLowerCase().includes('fish') ? '🐟' : '🥘'}
                  </span>
                </div>
                <div className="font-medium text-gray-700 dark:text-gray-200 capitalize flex-grow">{ingredient}</div>
                <button
                  className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 ml-2 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900 transition-colors flex-shrink-0"
                  onClick={() => removeIngredient(ingredient)}
                  title="Remove ingredient"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">No ingredients detected yet. Point your camera at food items.</p>
          </div>
        )}
      </section>

      <div className="flex justify-between items-center mt-6 mb-8">
        <button
          className="px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition duration-200 shadow-md flex items-center justify-center disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
          disabled={loading || ingredients.size===0}
          onClick={askRecipe}
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading...
            </span>
          ) : 'Get Recipe Suggestions'}
        </button>

        <button
          className={`px-6 py-3 rounded-lg transition duration-200 shadow-md ${cameraEnabled ? 'bg-red-600 dark:bg-red-700 text-white hover:bg-red-700 dark:hover:bg-red-800' : 'bg-green-600 dark:bg-green-700 text-white hover:bg-green-700 dark:hover:bg-green-800'}`}
          onClick={toggleCamera}
        >
          {cameraEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
        </button>
      </div>
    </main>
  );
}