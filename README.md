# 🎙️ SarvamCast — AI Indic Podcast Studio

> **Project Concept**: Idea #17 from the Sarvam Idea Library: *AI Podcast Generator*  
> Built with **Sarvam AI Bulbul TTS**, **Sarvam Indic LLM**, and designed for **1-click Vercel Deployment**.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FKumar-Adarsh-Singh%2Fsarvam-project)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?logo=github)](https://github.com/Kumar-Adarsh-Singh/sarvam-project)
[![Powered by Sarvam AI](https://img.shields.io/badge/Powered%20by-Sarvam%20AI-FF6B35)](https://www.sarvam.ai)

---

## 🌟 Overview

**SarvamCast** is a complete, multi-speaker conversational podcast production studio tailored for Indian languages. From a simple topic or prompt, SarvamCast:
1. **Drafts dynamic two-host dialogues** between distinct host personas:
   - **Host 1 (Rohan)**: Analytical, inquisitive lead host.
   - **Host 2 (Pooja)**: Expressive, spontaneous co-host.
2. **Synthesizes natural Indic voices** using Sarvam's flagship **Bulbul TTS (`bulbul:v3`)** API.
3. **Delivers an interactive Studio Player** with live waveform animation, turn-by-turn dialogue highlighting, individual line auditioning, and full-episode export.

---

## 🚀 Key Features

- **Multi-Speaker Pacing**: Seamless alternation between speakers with natural pauses and conversational tone.
- **Indic Multilingual Support**: Works across Indian English (`en-IN`), Hindi (`hi-IN`), Tamil (`ta-IN`), Telugu (`te-IN`), Kannada (`kn-IN`), Marathi (`mr-IN`), Bengali (`bn-IN`), and Gujarati (`gu-IN`).
- **Interactive Visual Transcript**: Audition any line individually or listen to the full episode sequentially.
- **Serverless Architecture**: Built with lightweight Node.js endpoints running natively on Vercel Edge/Serverless infrastructure with zero bloated dependencies.
- **Sarvam Autonomous Agent**: Includes `sarvam-agent/sarvam_podcast_agent.py` to autonomously draft and produce episodes via CLI.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: Tailwind CSS, Vanilla JavaScript, Lucide Icons, HTML5 Web Audio API.
- **Backend / Serverless**: Node.js Vercel Serverless Functions (`/api/generate-script`, `/api/synthesize-speech`, `/api/health`).
- **AI Engine**:
  - **Text-to-Speech**: Sarvam AI Bulbul API (`POST https://api.sarvam.ai/text-to-speech`)
  - **Script Intelligence**: Sarvam-105B Indic LLM (`POST https://api.sarvam.ai/v1/chat/completions`) + Dynamic Template Fallback
- **Hosting**: Vercel

```
┌─────────────────┐       ┌────────────────────────┐       ┌─────────────────────┐
│  Browser Client │ ────> │ Vercel Serverless API  │ ────> │   Sarvam AI Cloud   │
│  (Tailwind UI)  │ <──── │ (/api/synthesize-speech)│ <──── │ (Bulbul v3 TTS API) │
└─────────────────┘       └────────────────────────┘       └─────────────────────┘
```

---

## ⚡ Quick Start (Local Development)

### 1. Clone the repository
```bash
git clone https://github.com/Kumar-Adarsh-Singh/sarvam-project.git
cd sarvam-project
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your `SARVAM_API_KEY` is added:
```env
SARVAM_API_KEY=your_sarvam_api_key_here
PORT=3000
```

### 3. Run the Studio Server
```bash
node server.js
```
Open [http://localhost:3000](http://localhost:3000) in your browser!

---

## 🌐 Deploying to Vercel (Step-by-Step)

1. Push this repository to your GitHub account (already linked to `Kumar-Adarsh-Singh/sarvam-project`).
2. Log in to [vercel.com](https://vercel.com) and click **"Add New"** → **"Project"**.
3. Import `sarvam-project` from GitHub.
4. Under **Environment Variables**, add:
   - **Key**: `SARVAM_API_KEY`
   - **Value**: `sk_qaq8ho3m_ifhyEjbCvcWMUv8RgzKzk1qn`
5. Click **Deploy**. Your podcast studio will be live in seconds!

---

## 🤖 Running the Sarvam Autonomous Agent

You can also run the agent standalone via Python:
```bash
python sarvam-agent/sarvam_podcast_agent.py --topic "Bengaluru Startup Hustle" --language "en-IN"
```
The agent generates individual speaker `.wav` files and an `episode_manifest.json` in the `output/` directory.

---

## 📜 License
MIT License • Created for the Sarvam AI Hackathon / Project Showcase.
