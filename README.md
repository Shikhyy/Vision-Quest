# 🏰 Vision Quest — The Watching World

> **A retro-fantasy RPG where NPCs see, hear, and react to YOU in real-time.**
>
> Built for the [WeMakeDevs Vision Agents Hackathon](https://www.wemakedevs.org/hackathons/vision)

![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue) ![Gemini](https://img.shields.io/badge/Gemini_2.0_Flash-AI-purple) ![Stream](https://img.shields.io/badge/Stream_Video-SDK-green)

## 🎮 What is Vision Quest?

Vision Quest is an interactive pixel-art RPG where **your webcam is the controller**. Three unique NPCs watch you through a "Magic Mirror" and react to your facial expressions, gestures, and voice in real-time using **Google Gemini 2.0 Flash** and the **Vision Agents SDK**.

### The NPCs

| NPC | Zone | Challenge |
|-----|------|-----------|
| 🃏 **The Jester** | The Laughing Tavern | Make him laugh! Smile and be expressive. |
| 🧙 **The Sage** | The Sage's Tower | Show real-world objects to solve arcane riddles. |
| 👁️ **The Shadow** | The Shadow Sanctum | Stay calm for 90 seconds. Don't show fear! |

## ✨ Key Features

- **🤖 Vision Agents SDK** — NPC agents powered by `vision-agents` with `getstream.Edge()` + `gemini.Realtime(fps=3)` for real-time video/audio AI processing
- **🔮 Gemini 2.0 Flash** — Direct vision + text AI for NPC dialogue generation with webcam frame analysis
- **📹 Stream Video SDK** — Real-time video calls between player and AI agent via `@stream-io/video-react-sdk`
- **🎙️ Voice Recognition** — Talk to NPCs using Web Speech API (push-to-talk)
- **🎨 Retro Pixel-Art Design** — Custom CRT scanline overlay, neon glows, pixel borders, and 8-bit sound effects
- **📊 Progression System** — XP, levels, zone completion, badges, and a player profile
- **🔄 Graceful Fallback** — If the Vision Agent backend is offline, seamlessly falls back to local Gemini-powered webcam analysis
- **📱 Responsive Layout** — Works on desktop, tablet, and mobile

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│              React Frontend (Vite)           │
│  ┌─────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ Screens │ │  Stores  │ │  Components  │  │
│  │ (8)     │ │ (Zustand)│ │ StreamVideo  │  │
│  └────┬────┘ └──────────┘ └──────┬───────┘  │
│       │                          │           │
│  ┌────▼───────────────────┐ ┌────▼────────┐  │
│  │  Gemini 2.0 Flash API  │ │ Stream SDK  │  │
│  │  (Text + Vision)       │ │ (Video/Audio│  │
│  └────────────────────────┘ └──────┬──────┘  │
└────────────────────────────────────┼─────────┘
                                     │
┌────────────────────────────────────▼─────────┐
│         Python Agent Backend                  │
│  ┌──────────────────────────────────────┐     │
│  │  vision-agents SDK                    │     │
│  │  ├── getstream.Edge()                 │     │
│  │  ├── gemini.Realtime(fps=3)           │     │
│  │  └── NPC personality instructions     │     │
│  └──────────────────────────────────────┘     │
└───────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+ with [uv](https://docs.astral.sh/uv/)
- A Google API Key (for Gemini 2.0 Flash)
- A Stream API Key + Secret (free at [getstream.io](https://getstream.io/try-for-free/))

### 1. Clone & Install

```bash
git clone https://github.com/Shikhyy/Vision-Quest.git
cd Vision-Quest
npm install
```

### 2. Configure Environment

```bash
# Frontend (.env)
cp .env.example .env
# Set your keys:
#   VITE_GEMINI_API_KEY=your_gemini_key
#   VITE_STREAM_API_KEY=your_stream_api_key
#   VITE_STREAM_TOKEN_URL=/api/token

# Agent backend (agent/.env)
cp agent/.env.example agent/.env
# Set your keys:
#   STREAM_API_KEY=your_stream_api_key
#   STREAM_API_SECRET=your_stream_secret
#   GOOGLE_API_KEY=your_google_key
```

### 3. Run the Frontend

```bash
npm run dev
```

### 4. Run the NPC Agent (Optional)

```bash
cd agent
uv sync
uv run python main.py run
```

The agent uses `AgentLauncher` + `Runner` from the Vision Agents SDK. It will automatically listen for incoming calls from the frontend.

> **Note:** The app works without the Python agent! It falls back to direct Gemini API calls for NPC dialogue.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS 4 + Custom CSS Design System |
| State | Zustand with localStorage persistence |
| AI (Primary) | Vision Agents SDK + Gemini Realtime |
| AI (Fallback) | Google Gemini 2.0 Flash (direct API) |
| Video | Stream Video React SDK |
| Audio | Web Audio API (procedural 8-bit SFX) |
| Voice | Web Speech API |
| Animation | Framer Motion |
| Agent Backend | Python + vision-agents + getstream + gemini |

## 📁 Project Structure

```
vision-quest/
├── src/
│   ├── api/          # Gemini + Stream services
│   ├── assets/       # Zone configs, badges, items, riddles
│   ├── audio/        # 8-bit sound engine
│   ├── components/   # StreamVideoCall, LevelUpOverlay
│   ├── hooks/        # useVisionLoop, useNPCReaction, useVoiceRecognition
│   ├── npcs/         # Jester, Sage, Shadow prompt configs
│   ├── screens/      # 8 game screens
│   ├── store/        # Zustand stores (game, player, challenge)
│   ├── vision/       # Detection utilities
│   ├── App.tsx       # Screen router + keyboard shortcuts
│   └── index.css     # Complete design system
├── agent/
│   ├── main.py       # NPC agent server
│   └── pyproject.toml
└── vite.config.ts    # Dev token server plugin
```

## 🎯 Hackathon Requirements

- ✅ **Vision Agents SDK Integration** — Full `vision-agents` backend with `getstream.Edge()` + `gemini.Realtime(fps=3)`
- ✅ **Real-time Video Processing** — NPCs analyze player webcam feed at 3 FPS
- ✅ **AI-Powered Responses** — Gemini 2.0 Flash generates contextual NPC dialogue
- ✅ **Stream Video SDK** — Real-time bidirectional video/audio via `@stream-io/video-react-sdk`
- ✅ **Creative Application** — An RPG where AI NPCs react to your real expressions
- ✅ **Graceful Degradation** — Works without the Python agent (falls back to direct Gemini API)

## 📄 License

MIT — Built with ❤️ for the WeMakeDevs Vision Agents Hackathon
