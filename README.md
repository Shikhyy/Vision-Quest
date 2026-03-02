<div align="center">

# 🏰 Vision Quest — The Watching World

### *An AI-powered retro-fantasy RPG where NPCs see, hear, and react to YOU in real-time*

[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Gemini AI](https://img.shields.io/badge/Gemini_2.0-Flash-8B5CF6?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![Stream Video](https://img.shields.io/badge/Stream-Video_SDK-00E396?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiPjwvc3ZnPg==&logoColor=white)](https://getstream.io)
[![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev)

Built for the [WeMakeDevs Vision Agents Hackathon](https://www.wemakedevs.org/hackathons/vision) 🏆

---

> *"The tavern door creaks open. A figure stands on stage, bells jingling, face split between joy and sorrow. It turns toward you — and somehow, it* ***sees*** *you."*

</div>

---

## 🎮 What is Vision Quest?

Vision Quest is an **interactive pixel-art RPG** where your webcam becomes the controller. Three unique NPCs observe you through a "Magic Mirror" and react to your **facial expressions**, **real-world objects**, **gestures**, and **voice** — all powered by **Google Gemini 2.0 Flash** and the **Stream Vision Agents SDK**.

No keyboard combos. No button mashing. Just **you** — your face, your voice, your creativity.

<div align="center">

### ⚔️ Three NPCs. Three Challenges. One Webcam.

</div>

---

## 🃏🧙👁️ Meet the NPCs

<table>
<tr>
<td align="center" width="33%">

### 🃏 The Jester
**The Laughing Tavern**

*A darkly comedic trickster who lives for laughter*

**Challenge:** Make him laugh — smile, be expressive, perform for the crowd!

⏱ 60s · ✦ 50 XP · ★☆☆☆☆

</td>
<td align="center" width="33%">

### 🧙 The Sage
**The Wizard's Tower**

*An ancient wizard made of floating runes, fascinated by the mundane*

**Challenge:** Show real-world objects to solve three arcane riddles

⏱ 90s · ✦ 75 XP · ★★☆☆☆

</td>
<td align="center" width="33%">

### 👁️ The Shadow
**The Dark Forest**

*A formless void with burning red eyes that feeds on fear*

**Challenge:** Stay calm for 90 seconds — don't show fear, or be consumed

⏱ 90s · ✦ 100 XP · ★★★☆☆

</td>
</tr>
</table>

---

## ✨ Features

<table>
<tr>
<td>

**🤖 AI Vision Agents**
Real-time video/audio processing via `vision-agents` SDK with `getstream.Edge()` + `gemini.Realtime(fps=3)`

**🔮 Gemini 2.0 Flash**
Direct vision + text AI for context-aware NPC dialogue and webcam frame analysis

**📹 Stream Video SDK**
Real-time bidirectional video calls between player and AI agent

**🎙️ Push-to-Talk Voice**
Speak to NPCs directly via Web Speech API — they hear and respond

</td>
<td>

**🎨 Retro Cyberpunk Design**
CRT scanlines, glassmorphism, glitch effects, neon glows, noise textures, and animated pixel art

**🃏 3 Unique NPC Personalities**
Each NPC has distinct prompts, emotion states, challenge mechanics, and dialogue trees

**📊 Full Progression System**
XP, levels, titles, zone completion, badge collection, inventory, and emotion statistics

**🔄 Graceful Fallback**
Works without the Python agent — auto-falls back to direct Gemini API for NPC reactions

</td>
</tr>
</table>

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────┐
│              React Frontend (Vite 7.3)            │
│                                                    │
│  ┌──────────┐  ┌───────────┐  ┌───────────────┐   │
│  │ 8 Screens│  │ 3 Zustand │  │ Vision Loop   │   │
│  │ (Framer  │  │  Stores   │  │ (3s interval) │   │
│  │  Motion) │  │ (persist) │  │ Webcam → AI   │   │
│  └─────┬────┘  └───────────┘  └───────┬───────┘   │
│        │                              │            │
│  ┌─────▼──────────────┐  ┌────────────▼─────────┐  │
│  │ Gemini 2.0 Flash   │  │  Stream Video SDK    │  │
│  │ • Expression detect │  │  • Real-time video   │  │
│  │ • NPC dialogue gen  │  │  • Audio streaming   │  │
│  │ • Riddle evaluation │  │  • Custom events     │  │
│  └─────────────────────┘  └────────────┬─────────┘  │
└────────────────────────────────────────┼────────────┘
                                         │
┌────────────────────────────────────────▼────────────┐
│           Python Agent Backend (Optional)            │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  vision-agents SDK                              │  │
│  │  ├── getstream.Edge()  → Stream video infra     │  │
│  │  ├── gemini.Realtime(fps=3) → 3 FPS analysis   │  │
│  │  └── NPC personality system prompts             │  │
│  └────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 18+ | Runtime for frontend |
| Python | 3.11+ | Only if running the agent backend |
| [uv](https://docs.astral.sh/uv/) | Latest | Python package manager (for agent) |
| Google API Key | — | [Get one free](https://ai.google.dev) for Gemini 2.0 Flash |
| Stream API Key | — | [Free tier](https://getstream.io/try-for-free/) (for live video agent) |

### 1️⃣ Clone & Install

```bash
git clone https://github.com/Shikhyy/Vision-Quest.git
cd Vision-Quest
npm install
```

### 2️⃣ Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your keys:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key      # Required — powers NPC AI
VITE_STREAM_API_KEY=your_stream_api_key      # Optional — enables live video agent
VITE_STREAM_TOKEN_URL=/api/token             # Leave as-is (dev proxy)
```

<details>
<summary><strong>🤖 Agent Backend Setup (Optional)</strong></summary>

The Python agent enables real-time video/audio NPC interactions via the Vision Agents SDK. The app works perfectly without it using direct Gemini API calls.

```bash
cd agent
cp .env.example .env
# Edit agent/.env:
#   STREAM_API_KEY=your_stream_api_key
#   STREAM_API_SECRET=your_stream_secret
#   GOOGLE_API_KEY=your_google_key

uv sync
uv run python main.py run
```

The agent listens for incoming Stream calls from the frontend automatically.

</details>

### 3️⃣ Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — allow camera access and enter the village!

### 4️⃣ Build for Production

```bash
npm run build      # TypeScript check + Vite production build
npm run preview    # Preview the production build locally
```

---

## 🛠️ Tech Stack

<table>
<tr><th>Layer</th><th>Technology</th><th>Purpose</th></tr>
<tr><td><strong>Framework</strong></td><td>React 19 + TypeScript 5.9 + Vite 7.3</td><td>SPA with full type safety</td></tr>
<tr><td><strong>Styling</strong></td><td>Tailwind CSS 4 + Custom Design System</td><td>Glassmorphism, CRT effects, neon glows</td></tr>
<tr><td><strong>State</strong></td><td>Zustand 5 (localStorage persist)</td><td>Game state, player progress, challenge data</td></tr>
<tr><td><strong>AI Primary</strong></td><td>Vision Agents SDK + Gemini Realtime</td><td>Real-time video/audio NPC agent</td></tr>
<tr><td><strong>AI Fallback</strong></td><td>Google Gemini 2.0 Flash (direct API)</td><td>Expression detection + NPC dialogue</td></tr>
<tr><td><strong>Video</strong></td><td>Stream Video React SDK</td><td>Bidirectional real-time video calls</td></tr>
<tr><td><strong>Audio</strong></td><td>Web Audio API</td><td>Procedural 8-bit SFX + ambient music</td></tr>
<tr><td><strong>Voice</strong></td><td>Web Speech API</td><td>Push-to-talk NPC interaction</td></tr>
<tr><td><strong>Animation</strong></td><td>Framer Motion</td><td>Screen transitions, particles, 3D tilt cards</td></tr>
<tr><td><strong>Agent</strong></td><td>Python + vision-agents + getstream</td><td>Server-side NPC AI processing</td></tr>
</table>

---

## 📁 Project Structure

```
vision-quest/
├── src/
│   ├── api/            # Gemini service, Stream service, token provider
│   ├── assets/         # Zone configs, badges, items, riddles data
│   ├── audio/          # Procedural 8-bit sound engine (Web Audio API)
│   ├── components/     # StreamVideoCall, LevelUpOverlay
│   ├── hooks/          # useVisionLoop, useNPCReaction, useVoiceRecognition
│   ├── npcs/           # Jester, Sage, Shadow — personality prompts & configs
│   ├── screens/        # 8 game screens (Landing → Village → NPC → Reward...)
│   ├── store/          # Zustand stores (gameStore, playerStore, challengeStore)
│   ├── vision/         # Detection utilities & emotion classification
│   ├── App.tsx         # Screen router, keyboard shortcuts, level-up detection
│   ├── index.css       # Complete design system (~880 lines)
│   └── types.ts        # Shared TypeScript interfaces
├── agent/
│   ├── main.py         # Vision Agents NPC server (AgentLauncher + Runner)
│   ├── processors.py   # NPC personality processors
│   └── pyproject.toml  # Python dependencies
├── public/
│   └── favicon.svg     # Pixel-art crosshair favicon
├── vite.config.ts      # Build config + dev-only Stream token middleware
└── .env.example        # Environment variable template
```

---

## 🎯 How It Works

```
  You (webcam)                    Vision Quest                     Gemini AI
  ───────────                    ────────────                     ──────────
       │                              │                                │
       │  📷 Webcam frame (3s)        │                                │
       ├─────────────────────────────►│                                │
       │                              │  🧠 Analyze expression/objects │
       │                              ├───────────────────────────────►│
       │                              │                                │
       │                              │  📨 {emotion, objects, gesture}│
       │                              │◄───────────────────────────────┤
       │                              │                                │
       │                              │  💬 Generate NPC dialogue      │
       │                              ├───────────────────────────────►│
       │                              │                                │
       │                              │  🗨️ "Ha! That smile! +12% 🎭" │
       │                              │◄───────────────────────────────┤
       │                              │                                │
       │  🎮 NPC reacts + UI updates  │                                │
       │◄─────────────────────────────┤                                │
       │                              │                                │
```

### The Vision Loop

1. **Capture** — Every 3 seconds, a webcam frame is captured to a 320×240 canvas
2. **Detect** — Gemini 2.0 Flash analyzes the frame for emotion, objects, and gestures
3. **React** — Zone-specific NPC logic processes the detection (Jester checks smiles, Sage evaluates objects, Shadow measures fear)
4. **Dialogue** — Gemini generates an in-character NPC response based on the detection context
5. **Update** — Progress bar, emotion state, lives, and dialogue box all update in real-time

---

## 🎯 Hackathon Requirements

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Vision Agents SDK | ✅ | Full `vision-agents` backend with `getstream.Edge()` + `gemini.Realtime(fps=3)` |
| Real-time Video | ✅ | NPCs analyze player webcam at 3 FPS via Stream Video SDK |
| AI-Powered Responses | ✅ | Gemini 2.0 Flash generates contextual NPC dialogue with vision input |
| Stream Video SDK | ✅ | Bidirectional real-time video/audio via `@stream-io/video-react-sdk` |
| Creative Application | ✅ | An RPG where AI NPCs genuinely *see* and react to your real expressions |
| Graceful Degradation | ✅ | Seamless fallback to direct Gemini API when the Python agent is offline |

---

## 🎮 Game Controls

| Key | Action |
|-----|--------|
| `1` `2` `3` | Quick-select zone from Village Map |
| `P` | Open Player Profile |
| `S` | Open Settings |
| `Esc` | Return to Village Map |
| `Hold 🎤` | Push-to-talk (speak to NPCs) |

---

<div align="center">

## 📄 License

MIT — Built with ❤️ for the [WeMakeDevs Vision Agents Hackathon](https://www.wemakedevs.org/hackathons/vision)

*Three NPCs await you in the village. Each one can see you. Each one will react.*

**Be prepared.** ⚔️

</div>
