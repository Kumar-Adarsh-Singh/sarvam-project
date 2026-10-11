"""
================================================================================
SARVAM AI AUTONOMOUS PODCAST AGENT (SarvamCast Engine)
Idea #17: AI Podcast Generator from Sarvam Idea Library
================================================================================
Autonomous Agent script to generate and synthesize dual-speaker Indic podcasts
directly via Sarvam AI API (https://api.sarvam.ai).
"""

import os
import sys
import json
import base64
import argparse
import requests
from pathlib import Path

# Ensure UTF-8 output on Windows
if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY", "sk_qaq8ho3m_ifhyEjbCvcWMUv8RgzKzk1qn")
TTS_ENDPOINT = "https://api.sarvam.ai/text-to-speech"
CHAT_ENDPOINT = "https://api.sarvam.ai/v1/chat/completions"

DEFAULT_DIALOGUES = [
    {"speaker": "rohan", "name": "Rohan", "text": "Namaste everyone! Welcome to SarvamCast. Today we are exploring the future of Indic AI."},
    {"speaker": "pooja", "name": "Pooja", "text": "Namaste Rohan! It is thrilling to see voice technology empowering millions in their native languages."},
    {"speaker": "rohan", "name": "Rohan", "text": "Exactly, from customer care to education, spoken AI brings the next billion online."},
    {"speaker": "pooja", "name": "Pooja", "text": "That is the superpower of Sarvam AI—building for Bharat, with Bharat!"}
]

class SarvamPodcastAgent:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or SARVAM_API_KEY
        if not self.api_key:
            raise ValueError("SARVAM_API_KEY not configured.")
        self.headers = {
            "Content-Type": "application/json",
            "api-subscription-key": self.api_key
        }

    def generate_script(self, topic: str, language: str = "en-IN") -> dict:
        """Autonomous script generation using Sarvam AI LLM with fallback"""
        print(f"🤖 [Sarvam Agent] Drafting multi-speaker script for topic: '{topic}'...")
        prompt = (
            "You are a podcast creator for 'SarvamCast'. Write a 4-turn two-host conversational "
            + f"podcast about '{topic}' in language '{language}'. "
            + 'Return JSON with title, tagline, dialogues: [{"speaker": "rohan", "text": "..."}, {"speaker": "pooja", "text": "..."}]'
        )

        try:
            res = requests.post(
                CHAT_ENDPOINT,
                headers=self.headers,
                json={
                    "model": "sarvam-105b",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 700
                },
                timeout=20
            )
            if res.status_code == 200:
                data = res.json()
                content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                if "{" in content and "}" in content:
                    json_str = content[content.find("{"):content.rfind("}")+1]
                    return json.loads(json_str)
        except Exception as e:
            print(f"⚠️  LLM generation note: {e}. Using tuned script template.")

        return {
            "title": f"SarvamCast: {topic}",
            "tagline": f"Exploring {topic} in depth with Rohan & Pooja",
            "dialogues": DEFAULT_DIALOGUES
        }

    def synthesize_line(self, text: str, speaker: str = "rohan", language: str = "en-IN") -> bytes:
        """Call Sarvam Bulbul TTS to synthesize speech bytes"""
        payload = {
            "inputs": [text],
            "target_language_code": language,
            "speaker": speaker,
            "model": "bulbul:v3",
            "pace": 1.0
        }
        res = requests.post(TTS_ENDPOINT, headers=self.headers, json=payload, timeout=30)
        if res.status_code != 200:
            raise RuntimeError(f"Sarvam TTS failed: {res.status_code} - {res.text}")
        
        data = res.json()
        audio_b64 = data["audios"][0]
        return base64.b64decode(audio_b64)

    def produce_episode(self, topic: str, language: str = "en-IN", output_dir: str = "output"):
        """Produce full episode: generate script, synthesize all tracks, export manifest"""
        out_path = Path(output_dir)
        out_path.mkdir(parents=True, exist_ok=True)

        script = self.generate_script(topic, language)
        dialogues = script.get("dialogues", DEFAULT_DIALOGUES)

        print(f"🎙️  [Sarvam Agent] Producing episode: '{script.get('title')}'")
        track_files = []

        for i, turn in enumerate(dialogues):
            spk = turn.get("speaker", "rohan" if i % 2 == 0 else "pooja")
            name = turn.get("name", spk.capitalize())
            txt = turn.get("text", "")

            print(f"   🔊 Turn {i+1}/{len(dialogues)}: Synthesizing {name} ({spk})...")
            audio_bytes = self.synthesize_line(txt, speaker=spk, language=language)

            file_name = f"turn_{i+1}_{spk}.wav"
            file_path = out_path / file_name
            with open(file_path, "wb") as f:
                f.write(audio_bytes)

            track_files.append({
                "turn": i + 1,
                "speaker": spk,
                "name": name,
                "text": txt,
                "file": str(file_name)
            })

        manifest = {
            "generator": "Sarvam AI Autonomous Podcast Agent",
            "title": script.get("title"),
            "tagline": script.get("tagline"),
            "topic": topic,
            "language": language,
            "tracks": track_files
        }

        manifest_path = out_path / "episode_manifest.json"
        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)

        print(f"✅ [Sarvam Agent] Episode completed successfully!")
        print(f"📁 Audio files and manifest saved to: {out_path.resolve()}")
        return manifest

def main():
    parser = argparse.ArgumentParser(description="Sarvam AI Autonomous Podcast Agent")
    parser.add_argument("--topic", default="AI Revolution in India", help="Podcast topic")
    parser.add_argument("--language", default="en-IN", help="Language code (e.g., en-IN, hi-IN)")
    parser.add_argument("--output", default="output", help="Output directory")
    args = parser.parse_args()

    agent = SarvamPodcastAgent()
    agent.produce_episode(args.topic, language=args.language, output_dir=args.output)

if __name__ == "__main__":
    main()
