// Server-side: uses Hugging Face Inference API with a free model (e.g., gpt2 or EleutherAI/gpt-neo-125M)
import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HF_API_KEY || ''); // optional key

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { items } = req.body;
  const prompt = `I have these ingredients: ${items.join(', ')}. Suggest a quick recipe.`;

  try {
    const response = await hf.textGeneration({
      model: 'gpt2',           // or 'EleutherAI/gpt-neo-125M'
      inputs: prompt,
      parameters: { max_new_tokens: 150 }
    });

    res.status(200).json({ suggestion: response.generated_text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Generation failed' });
  }
}