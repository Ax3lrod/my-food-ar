import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { items } = req.body;
  const prompt = `I have these ingredients: ${items.join(', ')}. Suggest a quick recipe and health tips.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 300,
  });

  res.status(200).json({ suggestion: completion.choices[0].message.content });
}