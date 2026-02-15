NeuroSync: The Smart Companion 🧠✨
Neuro-Inclusive Executive Function Support

NeuroSync is a specialized task management and executive function aid designed for neurodivergent individuals (ADHD, Autism, Anxiety, etc.). Unlike standard to-do lists, NeuroSync acts as a supportive body double—using AI to break down complex tasks into manageable micro-steps based on the user's current energy level, diagnosis, and focus capacity.

🌟 Key Features
🤖 adaptive AI Assistance
Task Decomposition: Takes a vague goal (e.g., "Clean my room") and breaks it down into small, non-overwhelming steps tailored to your specific profile.

Context Aware: Generates steps based on your Energy Level (Low/Medium/High) and Focus Window (e.g., 15 mins).

Recursive Breakdown: If a specific step is still too hard, the "Break It Down" feature splits that single step into 3 smaller micro-tasks.

👁️ Multimodal Input
Vision Analysis: Use your camera to scan a messy room or workspace. The AI analyzes the visual context and generates a cleanup plan.

Voice Command: Integrated Groq (Whisper) transcription allows you to speak your tasks naturally.

Text Input: A simple, high-visibility input field for typing.

🎮 Gamification & Motivation
Streak System: Tracks daily usage to build momentum.

Dynamic Badges: Earn ranks from Initiator to Legendary based on consistency.

Positive Reinforcement: Uses confetti effects and encouraging TTS (Text-to-Speech) voice feedback.

🔒 Privacy & Local-First
Client-Side Encryption: User profiles are encrypted (silentEncrypt) before storage.

Local Storage: User data (Diagnosis, Name, Vault) is stored in the browser's IndexedDB, minimizing server-side data retention.

🛠️ Tech Stack
Frontend:

Framework: Next.js (App Router)

Styling: Tailwind CSS v4

Icons: Lucide React

Fonts: Lexend (Google Fonts)

Animations: Canvas Confetti, CSS Keyframes

Backend (BFF & AI):

API Routes: Next.js Server Actions/Route Handlers.

Transcription: Groq SDK (Whisper-large-v3 model).

Logic Engine: Connects to an external Python FastAPI backend for complex reasoning.

🚀 Getting Started
Prerequisites
Node.js (v18 or higher)

npm, pnpm, or yarn

A Groq API Key

Installation
Clone the repository:
Bash
```
git clone https://github.com/your-username/neurosync.git
cd neurosync
```
Install dependencies:
```
Bash
npm install
# or
yarn install
```
Environment Setup:
Create a .env.local file in the root directory and add your Groq API key:

```
GROQ_API_KEY=your_groq_api_key_here
# Optional: Override backend URL if running locally
# NEXT_PUBLIC_BACKEND_URL=http://localhost:8000/api
Run the development server:

Bash
npm run dev
Open the app:
Navigate to http://localhost:3000 in your browser.
```
📂 Project Structure
```
Plaintext
├── app/
│   ├── api/bridge/route.js    # API Proxy (Handles Groq & FastAPI connection)
│   ├── globals.css            # Tailwind v4 configuration & global styles
│   ├── layout.js              # Root layout & Metadata
│   └── page.js                # Main Dashboard & Logic
├── components/
│   └── Onboarding/
│       └── Setup.js           # Initial Profile Creation Flow
├── utils/
│   ├── crypto.js              # Encryption helpers (silentEncrypt/Decrypt)
│   └── db.js                  # IndexedDB helpers (getValue/setValue)
└── public/
    └── logo.png
```

🧩 Usage Guide
Onboarding:

Upon first load, you will be asked to set up your "Neural Profile."

Input your name, diagnosis type (e.g., ADHD), current energy level, and preferred focus duration.

Note: This data is stored locally.

Dashboard:

Microphone: Tap to speak your task.

Camera: Tap "Scan Environment" to take a photo of a task (e.g., a pile of laundry).

Text: Type a task in the input box.

Task Execution:

The AI will generate a list of steps.

Click "Hear It" for voice guidance.

Click "Break It Down" if a specific step feels too big.

Click "Done" to complete steps and trigger rewards.

Settings:

Click the gear icon to adjust your energy level or focus time dynamically as your day changes.

🤝 Contributing
Contributions are welcome! This project focuses on accessibility and neuro-inclusion.

Fork the Project

Create your Feature Branch (git checkout -b feature/AmazingFeature)

Commit your Changes (git commit -m 'Add some AmazingFeature')

Push to the Branch (git push origin feature/AmazingFeature)

Open a Pull Request

📄 License
Distributed under the MIT License. See LICENSE for more information.
Built with ❤️ for the Neurodivergent Community.