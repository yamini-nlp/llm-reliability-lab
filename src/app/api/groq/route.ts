import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: Request) {
  try {
    const { model, messages, max_tokens } = await request.json();

    const completion = await groq.chat.completions.create({
      model,
      messages,
      max_tokens: max_tokens ?? 1000,
    });

    const content = completion.choices[0]?.message?.content?.trim() || "No response from model.";

    return Response.json({ content });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}