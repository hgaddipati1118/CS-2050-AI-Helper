import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { pdfText} = await req.json();

    if (!pdfText) {
      return NextResponse.json({ error: 'PDF text required' }, { status: 400 });
    }

    // Prepare messages for ChatGPT
    const messages = [
      { role: "system", content: "Based on the text provided you need to return categories, just return the name of the category seperated by a comma, make it each very specific" },
      { role: "user", content: `Context: ${pdfText}` }
    ];

    // Call ChatGPT API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      max_tokens: 10000,
    });

    const answer = completion.choices[0].message.content.trim();
    console.log('Answer:', answer);
    const categories = answer.split(',');

    return NextResponse.json({ answer, categories });
  } catch (error) {
    console.error('Error processing request:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ error: 'An error occurred while processing your request', details: error.message }, { status: 500 });
  }
}
