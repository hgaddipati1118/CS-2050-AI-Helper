import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const {section, categories} = await req.json();

    if (!section || !categories) {
      return NextResponse.json({ error: 'Section text and categories required' }, { status: 400 });
    }

    // Prepare messages for ChatGPT
    const messages = [
      { role: "system", content: `Based on the section provided you need to return categories covered by this text from this list: ${categories.join()} separated by a comma.` },
      { role: "user", content: `Context: ${section}` }
    ];

    // Call ChatGPT API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      max_tokens: 10000,
    });

    const answer = completion.choices[0].message.content.trim();
    console.log('Answer:', answer);
    const tags = answer.split(',');

    return NextResponse.json({ answer, tags });
  } catch (error) {
    console.error('Error processing request:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ error: 'An error occurred while processing your request', details: error.message }, { status: 500 });
  }
}
