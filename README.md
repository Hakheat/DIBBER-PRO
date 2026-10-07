# Dubber Pro (ឌុបប័រ ប្រូ)
### AI Story Summarizer, Translator & Voice Cloning Studio

Dubber Pro is a production-grade full-stack TypeScript application for summarizing, translating, and vocalizing stories across multiple languages, with **Khmer as the primary first-class supported language**.

---

## 🚀 Key Features

1. **Multilingual Story Processing:**
   - Summarize, Translate, or perform both simultaneously using Anthropic's Claude 3.5 Sonnet.
   - Preserves literary tone, narrative pacing, character names, and cultural authenticity.
   - Long stories (>15,000 characters) are automatically partitioned with `chunkText`, processed sequentially, and synthesized without losing context.
2. **Text-to-Speech (TTS) Narration:**
   - Multi-provider architecture supporting **ElevenLabs**, **Azure Speech**, and **Google Cloud TTS**.
   - Built-in text chunking and audio concatenation for smooth, uninterrupted playback of long audiobooks and stories.
3. **Voice Cloning Studio (Voice Lab):**
   - Record directly in the browser or upload clean audio samples (`.mp3`, `.wav`, `.m4a`, `.webm`).
   - Mandatory consent validation ensuring ethical AI voice synthesis.
   - Zero permanent audio retention: audio samples are immediately wiped from disk once uploaded to the provider.
4. **Universal Video & Audio Downloader:**
   - Download high-resolution videos (1080p, 720p, 480p) or MP3 audio from **YouTube, Facebook, TikTok, Instagram, Twitter/X, and 1,000+ web platforms**.
   - Direct integration: extracted audio can be seamlessly transitioned to the Voice Lab for voice cloning or Story Studio for narration dubbing.
5. **Bilingual UI (English & Khmer):**
   - High-fidelity typography using **Noto Sans Khmer** and **Inter** with optimized Khmer line-height (`1.85`).
   - One-click instant language toggle between English and Khmer, with Light/Dark mode switching.

---

## 🛠️ Tech Stack

- **Monorepo:** npm workspaces (`backend`, `frontend`)
- **Language:** TypeScript 5.6 (strict mode enabled across all packages)
- **Frontend:** React 18, Vite, React Router 6, TanStack Query 5, Tailwind CSS, Lucide Icons
- **Backend:** Node.js 20+, Express 4, Helmet, CORS, Express-Rate-Limit, Multer
- **Validation:** Zod schemas
- **LLM Provider:** Anthropic Claude API (`@anthropic-ai/sdk`)
- **TTS Providers:** ElevenLabs, Azure Cognitive Services Speech, Google Cloud TTS
- **Testing:** Vitest

---

## 📁 Repository Architecture

Dubber Pro adheres strictly to a clean 2-workspace architecture (`backend` and `frontend`):

```
├── backend/
│   ├── src/
│   │   ├── config/env.ts              # Centralized environment validation
│   │   ├── constants/                 # Supported languages & limits
│   │   ├── controllers/               # story, tts, voice controllers
│   │   ├── middleware/                # error, rateLimit, upload, validate
│   │   ├── routes/                    # API route declarations
│   │   ├── schemas/                   # Zod validation schemas
│   │   ├── services/
│   │   │   ├── llm/                   # Claude provider and prompt templates
│   │   │   └── tts/                   # ElevenLabs, Azure, Google providers and factory
│   │   ├── storage/                   # Cloned voice metadata persistence
│   │   ├── types/                     # Shared types and contracts
│   │   └── utils/                     # chunkText, logger, AppError
└── frontend/
    ├── src/
        ├── api/                       # API clients calling backend /api/*
        ├── components/                # UI, Layout, Story, Audio, Voice components
        ├── hooks/                     # Custom React hooks (TanStack Query & Web Audio)
        ├── pages/                     # HomePage & VoicesPage
        ├── types/                     # Types and Zod contracts
        └── utils/                     # i18n dictionary and formatters
```

---

## 🔐 Environment Variables

Create a `.env` file in the root directory or in `backend/.env`:

```env
PORT=4000
CORS_ORIGIN=http://localhost:5173

# Anthropic Claude
ANTHROPIC_API_KEY=your_anthropic_api_key
CLAUDE_MODEL=claude-sonnet-5-5

# TTS Provider Selection ('elevenlabs' | 'azure' | 'google')
TTS_PROVIDER=elevenlabs

# ElevenLabs (Default TTS + Voice Cloning)
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# Azure Speech (High-Fidelity Khmer Neural Voices)
AZURE_SPEECH_KEY=your_azure_speech_key
AZURE_SPEECH_REGION=eastus

# Google Cloud TTS
GOOGLE_TTS_API_KEY=your_google_cloud_tts_api_key

# Limits
MAX_STORY_CHARS=50000
MAX_UPLOAD_MB=10
```

> **Note:** The frontend bundle never touches any API keys. All credentials are held securely in the backend.

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run in Development Mode
Starts both the Express API (port 4000) and the Vite frontend (port 5173) concurrently:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Run Quality Checks & Tests
```bash
# Typecheck all workspaces (backend, frontend)
npm run typecheck

# Run linter
npm run lint

# Run Vitest unit tests
npm run test

# Production build
npm run build
```

---

## 📡 API Contract

All endpoints are mounted under `/api` and validated against shared Zod schemas.

| Method | Path | Request Body | Response | Description |
|---|---|---|---|---|
| `GET` | `/api/health` | – | `{ status: "ok" }` | Health check endpoint |
| `POST` | `/api/story/process` | `{ text, action: "summarize"\|"translate"\|"both", targetLanguage, length }` | `{ summary?, translation?, usage }` | Summarize and/or translate story with Claude |
| `POST` | `/api/tts/speak` | `{ text, provider?, voiceId, language }` | `audio/mpeg` (Binary stream) | Synthesize speech with audio chunking |
| `GET` | `/api/tts/voices` | – | `{ voices: VoiceInfo[] }` | List built-in + cloned voices |
| `POST` | `/api/voice/clone` | Multipart: `name`, `consent`, `sample` (audio file) | `{ id, name, provider }` | Clone a voice with mandatory consent |
| `GET` | `/api/voice` | – | `ClonedVoice[]` | List user's cloned voices |
| `DELETE`| `/api/voice/:id` | – | `{ deleted: true }` | Delete a cloned voice |
| `POST` | `/api/video/info` | `{ url }` | `VideoInfo` | Extract metadata, thumbnails & resolutions |
| `GET/POST`| `/api/video/download`| `{ url, quality?, format? }` | `video/mp4` \| `audio/mpeg` | Download video or MP3 audio from URL |

### Error Response Schema
Any operational or validation error produces a standardized JSON payload:
```json
{
  "error": {
    "code": "VALIDATION_ERROR | UNSUPPORTED_LANGUAGE | CLONE_NOT_SUPPORTED | RATE_LIMITED",
    "message": "Human-readable description",
    "details": []
  }
}
```

---

## 🇰🇭 Khmer TTS Notes & Recommendations

1. **Azure Speech (Recommended for Khmer):**
   - Azure Speech features native neural voices trained explicitly on native Khmer speakers:
     - `km-KH-PisethNeural` (Male)
     - `km-KH-SreymomNeural` (Female)
   - Offers natural intonation, correct phrasing of Khmer compound words, and accurate pause handling at Khmer full stops (`។`).
2. **Google Cloud TTS:**
   - Supports `km-KH-Standard-A` and `km-KH-Standard-B`.
3. **ElevenLabs (Needs Testing for Khmer):**
   - While ElevenLabs' `eleven_multilingual_v2` model supports Khmer characters, phonetic pacing and accent accuracy on complex Khmer consonants **need testing and validation** compared to Azure's dedicated Khmer neural models.
   - For English, Thai, and European languages, ElevenLabs provides exceptional emotional expression and voice cloning quality.

---

## 🧩 How to Add a New AI Provider

The codebase follows the Open-Closed Principle via the **Provider Pattern**.

### Adding a new TTS Provider:
1. Create a new provider file in `backend/src/services/tts/providers/my-provider.provider.ts`:
   ```typescript
   import type { TTSProvider, SpeakOptions } from '../tts.interface.js';
   import type { VoiceInfo } from '../../../types/index.js';

   export class MyProvider implements TTSProvider {
     public readonly name = 'my_provider';

     public supportsLanguage(language: string): boolean {
       return ['en', 'km'].includes(language);
     }

     public async listVoices(): Promise<VoiceInfo[]> {
       return [{ id: 'voice-1', name: 'My Voice', provider: 'my_provider' }];
     }

     public async speak(options: SpeakOptions): Promise<Buffer> {
       // Call your TTS service and return audio Buffer
     }
   }
   ```
2. Register the provider in `backend/src/services/tts/tts.factory.ts`:
   ```typescript
   case 'my_provider':
     instance = new MyProvider();
     break;
   ```
3. No routes, controllers, or service logic need to change!

---

## 🛡️ Security & Privacy

1. **Voice Consent Enforcement:** Voice cloning requires `consent === true`. Requests lacking consent are rejected immediately with `400 CONSENT_REQUIRED`.
2. **Temporary File Lifecycle:** Audio samples uploaded for cloning are stored in `temp/uploads` during processing and **immediately deleted (`unlink`)** once dispatched to the upstream provider.
3. **Rate Limiting:** Distinct rate limit windows are enforced for story processing (40 req/15min), TTS synthesis (60 req/15min), and voice cloning (15 req/hour).
4. **Helmet & Strict CORS:** Restricts origin access and sets modern CSP/X-Content-Type headers.
5. **No Secrets in Bundles:** API keys are never exposed in frontend code or Vite builds.
