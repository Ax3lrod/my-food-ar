import Together from "together-ai";

const together = new Together();

export async function POST(req) {
  try {
    const { items } = await req.json();

    const response = await together.chat.completions.create({
      messages: [
        {
          role: "user",
          content:
            "Do not use any markdown settings, You are a world-class chef assistant. I have these ingredients: " +
            items.join(", ") +
            ". Please suggest a quick and tasty recipe, listing ingredients and step-by-step instructions.",
        },
      ],
      model: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
    });

    const data = response.choices[0].message.content;
    return new Response(JSON.stringify({ suggestion: data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Together error:", err);
    return new Response(JSON.stringify({ error: err.toString() }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
