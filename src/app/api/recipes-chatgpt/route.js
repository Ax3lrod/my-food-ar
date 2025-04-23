import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const { items } = await req.json();
    const messages = [
      { role: 'system', content: 'You are a world-class chef assistant.' },
      { role: 'user', content: `I have these ingredients: ${items.join(', ')}. ` +
        'Please suggest a quick and tasty recipe, listing ingredients and step-by-step instructions. If no food ingridients are found, say "No food ingridients are found".' }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',  // cost-effective and widely available
      messages,
      max_tokens: 300,
      temperature: 0.7,
      top_p: 0.9,
    });

    const suggestion = completion.choices[0].message.content.trim();
    return new Response(JSON.stringify({ suggestion }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('OpenAI error:', err);
    return new Response(JSON.stringify({ error: err.toString() }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}