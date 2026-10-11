# Sarvam AI Autonomous Podcast Agent

This module contains the agentic core for **Idea #17: AI Podcast Generator** from the Sarvam Idea Library.

## Features
- **Autonomous Script Drafting**: Uses Sarvam-105B to craft engaging multi-speaker dialogues.
- **Bulbul TTS Audio Synthesis**: Calls Sarvam's `bulbul:v3` API with distinct Indic voice personas (`rohan` and `pooja`).
- **Manifest Generation**: Exports production-ready `.wav` tracks and JSON episode manifest.

## Usage
Run directly from terminal:
```bash
python sarvam-agent/sarvam_podcast_agent.py --topic "Bengaluru Startup Culture" --language "en-IN"
```
Or for Hindi:
```bash
python sarvam-agent/sarvam_podcast_agent.py --topic "भारतीय अंतरिक्ष मिशन" --language "hi-IN"
```
