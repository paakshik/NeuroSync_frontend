import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'missing' });
const FASTAPI_BASE_URL = "https://neurothon-project-backend.onrender.com/api";

export async function POST(req) {
  try {
    const contentType = req.headers.get('content-type') || '';
    
    // --- 1. MULTIPART HANDLER (CAMERA & AUDIO) ---
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file');

      // CAMERA / IMAGE LOGIC
      if (file && file.type.startsWith('image/')) {
        const visionData = new FormData();
        visionData.append('file', file);
        visionData.append('task', "Give a very detailed, descriptive, and thorough breakdown of steps based on this room. Use long, encouraging sentences.");
        visionData.append('energy', "high"); 
        visionData.append('focus_time', "25");

        const res = await fetch(`${FASTAPI_BASE_URL}/analyze-image`, { 
            method: 'POST', 
            body: visionData 
        });
        const data = await res.json();
        return NextResponse.json(data);
      }

      // AUDIO LOGIC (Whisper Transcription -> FastAPI)
      const audioBlob = file; 
      const audioFile = new File([audioBlob], 'input.webm', { type: audioBlob.type });
      
      const transcription = await groq.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-large-v3",
      });

      const textData = new FormData();
      textData.append('task', `User wants help with: "${transcription.text}". Provide a detailed, long-form plan with clear sentences.`);
      textData.append('energy', 'high');
      textData.append('focus_time', '25');

      const res = await fetch(`${FASTAPI_BASE_URL}/analyze-text`, { 
          method: 'POST', 
          body: textData 
      });
      const data = await res.json();
      return NextResponse.json(data);
    }

    // --- 2. JSON HANDLER (TEXT INPUT & MAGIC BUTTON) ---
    const body = await req.json();

    // CASE A: "Break It Down" Button (Decompose a specific existing step)
    if (body.step_title) {
        const fastApiFormData = new FormData();
        const breakdownPrompt = `This step is too hard: "${body.step_title}". Break it into 3 much smaller, descriptive micro-steps for a neuropatient.`;
        fastApiFormData.append('original_task', breakdownPrompt);
        fastApiFormData.append('num_steps', '3'); 
        fastApiFormData.append('energy', 'high');
        fastApiFormData.append('focus_time', '10');

        const response = await fetch(`${FASTAPI_BASE_URL}/decompose-step`, { 
            method: 'POST', 
            body: fastApiFormData 
        });
        const data = await response.json();
        return NextResponse.json(data);
    }

    // CASE B: Direct Text Prompt (The Main Search Bar)
    // Inside your route.js -> CASE B: Direct Text Prompt
// route.js -> CASE B: Direct Text Prompt
if (body.prompt) {
    const response = await fetch(`${FASTAPI_BASE_URL}/analyze-text`, { 
        method: 'POST', 
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            // Ensure this is EXACTLY 'task'
            task: String(body.prompt), 
            energy: String(body.context?.energy || 'medium'),
            focus_time: Number(body.context?.focus_time || 25)
        })
    });

    const data = await response.json();

    // If FastAPI sends an error, pass it back to frontend properly
    if (!response.ok) {
        return NextResponse.json({ 
            error: "Neural Link Rejected", 
            details: data 
        }, { status: response.status });
    }

    return NextResponse.json(data);
}

    return NextResponse.json({ error: "Invalid request format" }, { status: 400 });

  } catch (error) {
    console.error("CRITICAL BRIDGE ERROR:", error.message);
    return NextResponse.json(
      { error: "Neural Link Interrupted", details: error.message }, 
      { status: 500 }
    );
  }
}