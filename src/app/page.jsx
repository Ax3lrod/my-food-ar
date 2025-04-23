'use client';
import { useState, useCallback } from 'react';
import CameraScanner from './components/CameraScanner';

export default function Home() {
  const [ingredients, setIngredients] = useState(new Set());
  const [recipe, setRecipe] = useState('');
  const [loading, setLoading] = useState(false);

  const addIngredient = useCallback(item => setIngredients(prev => new Set(prev).add(item)), []);
  const endpoint = '/api/recipes-together';  // switch to '/api/recipes-openai' for GPT-4

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

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">AR Ingredient Scanner</h1>
      <CameraScanner onUpdate={addIngredient} />

      <section className="mt-4">
        <h2 className="font-semibold">Detected Ingredients:</h2>
        <ul className="list-disc pl-5">
          {Array.from(ingredients).map(i => <li key={i}>{i}</li>)}
        </ul>
      </section>

      <button
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg"
        disabled={loading || ingredients.size===0}
        onClick={askRecipe}
      >{loading ? 'Loading...' : 'Get Recipe Suggestions'}</button>

      {recipe && (
        <pre className="mt-6 bg-gray-100 p-4 rounded-md whitespace-pre-wrap">{recipe}</pre>
      )}
    </main>
  );
}