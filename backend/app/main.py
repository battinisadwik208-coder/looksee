from __future__ import annotations

import base64
import io
import json
import os
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel, Field

load_dotenv()

MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free")
origins = [item.strip() for item in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")]

app = FastAPI(title="Looksee Image Analysis API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


class IdentifiedPart(BaseModel):
    name: str
    category: str
    location: str
    confidence: str
    description: str


class Analysis(BaseModel):
    summary: str
    objects: list[str] = Field(default_factory=list)
    scene: str
    parts: list[IdentifiedPart] = Field(default_factory=list)
    confidence_note: str
    safety_note: str


def parse_model_json(raw_text: str) -> dict[str, Any]:
    clean = raw_text.strip()
    if clean.startswith("```"):
        clean = clean.split("\n", 1)[1].rsplit("```", 1)[0].strip()
    try:
        data = json.loads(clean)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail="The AI returned an unreadable answer. Please try another image.") from exc
    data.setdefault("objects", [])
    data.setdefault("parts", [])
    data.setdefault("safety_note", "Visual identification is informational only. Confirm part names with the manufacturer or a qualified technician before repair or purchase.")
    return data


def build_prompt(analysis_mode: str) -> str:
    component_instruction = """
This is COMPONENT IDENTIFICATION MODE. Carefully identify every clearly visible mechanical, engine, vehicle, appliance, electronic, tool, or other physical component. Use a precise common name where visible. For engine photos, distinguish components such as valve cover, intake manifold, air filter housing, battery, radiator hose, oil cap, alternator, belt, coolant reservoir, fuse box, and wiring only when you can actually see them. Do not invent labels for hidden parts. For non-engine photos, identify visible components in the same structured way.
""" if analysis_mode == "components" else """
Also identify clearly visible physical components when useful, but keep the answer focused on the overall image.
"""

    return f"""Analyze this image for Looksee, a general image and parts-identification website.
{component_instruction}
Return ONLY valid JSON with exactly this structure:
{{
  "summary": "one concise factual sentence",
  "objects": ["up to eight visible objects or subjects"],
  "scene": "short scene or context description",
  "parts": [
    {{
      "name": "clear component name",
      "category": "engine | vehicle | mechanical | electronic | appliance | tool | other",
      "location": "where it appears in the image, e.g. upper left or centre",
      "confidence": "high | medium | low",
      "description": "one brief description of its visible role or appearance"
    }}
  ],
  "confidence_note": "brief uncertainty statement",
  "safety_note": "visual identification is informational only; verify before repair, safety decisions, or purchase"
}}
If no physical components can be confidently identified, return an empty parts array. Never claim model numbers, exact compatibility, internal faults, safety conditions, or repair requirements from the image alone. Do not identify people or infer sensitive traits."""


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "provider": "openrouter", "model": OPENROUTER_MODEL}


@app.post("/classify", response_model=Analysis)
async def classify(
    image: UploadFile = File(...),
    analysis_mode: str = Form("general"),
) -> Analysis:
    if image.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=415, detail="Use a JPG, PNG, or WebP image.")
    if analysis_mode not in {"general", "components"}:
        raise HTTPException(status_code=400, detail="Use either general or components analysis mode.")

    content = await image.read()
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded image is empty.")
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Image must be 10 MB or smaller.")
    if not OPENROUTER_API_KEY or OPENROUTER_API_KEY == "PASTE_YOUR_OPENROUTER_KEY_HERE":
        raise HTTPException(status_code=503, detail="Add OPENROUTER_API_KEY to backend/.env first.")

    try:
        with Image.open(io.BytesIO(content)) as source:
            normalized = source.convert("RGB")
            output = io.BytesIO()
            normalized.save(output, format="JPEG", quality=90, optimize=True)
            image_data = base64.b64encode(output.getvalue()).decode("utf-8")
    except (OSError, ValueError) as exc:
        raise HTTPException(status_code=400, detail="This file could not be read as an image. Try another JPG, PNG, or WebP.") from exc

    payload = {
        "model": OPENROUTER_MODEL,
        "temperature": 0.1,
        "max_tokens": 1000,
        "messages": [{
            "role": "user",
            "content": [
                {"type": "text", "text": build_prompt(analysis_mode)},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_data}"}},
            ],
        }],
    }
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "Looksee Image Analysis",
    }

    try:
        async with httpx.AsyncClient(timeout=75) as client:
            response = await client.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
            response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        status = exc.response.status_code
        if status in {401, 403}:
            detail = "OpenRouter rejected the API key. Create a new OpenRouter key and replace OPENROUTER_API_KEY in backend/.env."
        elif status == 404:
            detail = f"OpenRouter model '{OPENROUTER_MODEL}' is unavailable."
        elif status == 429:
            detail = "OpenRouter is rate-limiting this key or free model. Wait a minute and try again."
        elif status == 400:
            detail = "OpenRouter rejected this image request. Try a JPG or PNG under 10 MB."
        else:
            detail = f"OpenRouter is temporarily unavailable (HTTP {status}). Try again in a minute."
        raise HTTPException(status_code=502, detail=detail) from exc
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail="Could not reach OpenRouter. Check your connection and try again.") from exc

    data: dict[str, Any] = response.json()
    if "error" in data:
        provider_message = data["error"].get("message", "The vision provider returned an unknown error.")
        raise HTTPException(status_code=502, detail=f"OpenRouter image error: {provider_message[:250]}")
    try:
        raw_text = data["choices"][0]["message"]["content"]
        if not isinstance(raw_text, str):
            raw_text = "".join(part.get("text", "") for part in raw_text if isinstance(part, dict))
    except (KeyError, IndexError, TypeError) as exc:
        raise HTTPException(status_code=502, detail="OpenRouter did not return an analysis.") from exc

    return Analysis.model_validate(parse_model_json(raw_text))
