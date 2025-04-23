import { HfInference } from '@huggingface/inference';

// Initialize HF Inference. For higher rate or private models, set HF_API_KEY in .env.local
const hf = new HfInference(process.env.HF_API_KEY || '');

export async function POST(req) {
  try {
    const { items } = await req.json();
    // Clear instruction-style prompt
    const prompt = `You are an experienced chef. I have these ingredients: ${items.join(', ')}. Please suggest a quick and tasty recipe, listing ingredients and step-by-step instructions.`;

    // Use a model known to be supported by HF Inference
    const res = await hf.textGeneration({
      model: 'deepseek-ai/DeepSeek-V3-0324',   // reliably supported for HF hosted inference
      inputs: prompt,
      parameters: {
        max_new_tokens: 150,
        return_full_text: false,
        temperature: 0.7,
        top_p: 0.9,
      },
    });

    const suggestion = res.generated_text.trim();
    return new Response(JSON.stringify({ suggestion }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('HF inference error:', err);
    return new Response(JSON.stringify({ error: err.toString() }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}