'use client';
import { useState, useCallback } from 'react';
import CameraScanner from './components/CameraScanner';

export default function Home() {
  const [ingredients, setIngredients] = useState(new Set());
  const [recipe, setRecipe] = useState('');
  const [loading, setLoading] = useState(false);

  const addIngredient = useCallback((item) => {
    setIngredients(prev => new Set(prev).add(item));
  }, []);

  // Choose the endpoint: '/api/recipes-hf' for free HF, '/api/recipes-openai' for GPT-4
  const endpoint = '/api/recipes-hf';

  const askRecipe = async () => {
    setLoading(true);
    const list = Array.from(ingredients);
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: list }),
    });
    const data = await res.json();
    setRecipe(data.suggestion);
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">AR Ingredient Scanner</h1>
      <CameraScanner onUpdate={addIngredient} />

      <div className="mt-4">
        <h2 className="font-semibold">Detected Ingredients:</h2>
        <ul className="list-disc pl-5">
          {Array.from(ingredients).map(item => <li key={item}>{item}</li>)}
        </ul>
      </div>

      <button
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg"
        onClick={askRecipe}
        disabled={loading || ingredients.size === 0}
      >
        {loading ? 'Loading...' : 'Get Recipe Suggestions'}
      </button>

      {recipe && (
        <div className="mt-6 bg-gray-100 p-4 rounded-md">
          <h3 className="font-semibold">Recipe Suggestions:</h3>
          <pre className="whitespace-pre-wrap">{recipe}</pre>
        </div>
      )}
    </div>
  );
}