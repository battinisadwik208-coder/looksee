# Looksee — Product Requirements Document

**Version:** 1.0  
**Status:** Build-ready  
**Product:** Looksee — AI Image Analysis & Component Identification  
**Owner:** Product / Engineering  
**Last updated:** 2026-08-25

## 1. Product Summary

Looksee is a web application where a user uploads an image and receives a concise visual analysis. It supports two modes:

1. **General analysis** — names visible subjects, describes the scene, and produces a short factual summary.
2. **Identify parts** — identifies visible engine, vehicle, mechanical, electronic, appliance, tool, and other physical components. Each component is clearly named and includes its category, image location, confidence, and a short visual description.

The first release is an assistive visual-understanding product, not a maintenance, diagnostics, or safety-decision tool.

## 2. Problem

People frequently have photos of engines, machines, vehicles, tools, appliances, and unfamiliar objects but do not know the names of visible parts. Existing image search tools often return generic labels, while manuals require knowing the name of the part first.

Users need a low-friction way to upload a photo and receive understandable labels for visible components, with clear limits on what AI can reliably infer from one image.

## 3. Goals

### Primary goals

- Let a user upload a JPG, PNG, or WebP image from desktop or mobile.
- Return a useful general visual description in under one minute under normal provider availability.
- Let a user explicitly choose **Identify parts** before analyzing a component or engine image.
- Return clearly named visible components with category, approximate image location, confidence, and short description.
- Show uncertainty clearly and prevent the product from presenting AI output as repair-grade truth.
- Keep the user experience simple enough for a first-time user.

### Success metrics for v1

- At least 80% of successful component-mode analyses return one or more usable part labels for clear close-up photos.
- At least 90% of accepted images receive either an analysis or a specific actionable error message.
- Median time from clicking Analyze to result is below 20 seconds when the model provider is available.
- Fewer than 5% of sessions fail because users do not understand the upload or mode-selection flow.

## 4. Non-goals

V1 does **not**:

- Diagnose faults, predict failures, or prescribe repairs.
- Confirm exact model numbers, OEM part numbers, compatibility, torque specifications, or warranty status.
- Identify parts hidden behind covers, out of frame, or too blurry to see.
- Generate bounding boxes or AR overlays on the uploaded image.
- Save user uploads or analysis history permanently.
- Support video analysis, batch upload, user accounts, payments, or collaboration.

## 5. Users and Jobs to Be Done

| User | Job to be done |
|---|---|
| Student / learner | “I have an image of an engine or machine and need clear names for visible parts.” |
| Car or motorcycle owner | “I want to understand what I am looking at before reading a manual or speaking with a mechanic.” |
| Maker / hobbyist | “I want a quick explanation of visible components in a tool, appliance, or electronics photo.” |
| General user | “I want to know what objects and scene are in an unfamiliar image.” |

## 6. User Flows

### Flow A — General image analysis

1. User opens Looksee.
2. User sees the default **General analysis** mode.
3. User uploads or drops a JPG, PNG, or WebP image under 10 MB.
4. User clicks **Analyze image**.
5. Looksee shows a loading state.
6. Looksee displays summary, visible subject tags, scene, confidence note, and copy action.
7. User may choose **Analyze another**.

### Flow B — Engine / component identification

1. User opens Looksee.
2. User selects **Identify parts**.
3. The UI displays guidance asking for a bright, close-up photo where components are visible.
4. User uploads an image.
5. User clicks **Identify parts**.
6. Looksee shows a loading state: “Naming visible components.”
7. Looksee returns the general summary plus an **Identified parts & components** list.
8. Each part row shows:
   - Part name
   - Category
   - Approximate location in the image
   - High / medium / low visual confidence
   - Brief visual description
9. The UI shows a safety note: users must verify part names before repair, purchase, or safety decisions.

### Flow C — Error recovery

1. User uploads an unsupported or oversized file, or the provider fails.
2. Looksee shows a plain-language message.
3. User can choose another file or retry.
4. The selected image remains visible when possible.

## 7. Functional Requirements

### 7.1 Upload

| ID | Requirement | Priority |
|---|---|---|
| FR-01 | Accept JPG, PNG, and WebP uploads. | Must |
| FR-02 | Reject files larger than 10 MB with a clear error. | Must |
| FR-03 | Show a local image preview before analysis. | Must |
| FR-04 | Support click-to-upload and drag-and-drop on desktop. | Must |
| FR-05 | Allow user to remove or replace an uploaded image. | Must |

### 7.2 Mode selection

| ID | Requirement | Priority |
|---|---|---|
| FR-06 | Default to General analysis mode. | Must |
| FR-07 | Provide a visible Identify parts mode selector. | Must |
| FR-08 | Explain that component mode identifies only visible parts and works best with close-up, well-lit images. | Must |
| FR-09 | Send selected mode to the backend with the uploaded image. | Must |

### 7.3 General analysis result

| ID | Requirement | Priority |
|---|---|---|
| FR-10 | Return a concise summary. | Must |
| FR-11 | Return a list of visible subjects/objects. | Must |
| FR-12 | Return a scene/context description. | Must |
| FR-13 | Return a confidence/uncertainty note. | Must |
| FR-14 | Allow copy-to-clipboard for completed results. | Should |

### 7.4 Component identification result

| ID | Requirement | Priority |
|---|---|---|
| FR-15 | Return zero or more visible components. | Must |
| FR-16 | Each component must include name, category, approximate image location, confidence, and short description. | Must |
| FR-17 | Support categories: engine, vehicle, mechanical, electronic, appliance, tool, and other. | Must |
| FR-18 | Return an empty list rather than inventing part labels when components are unclear. | Must |
| FR-19 | Clearly distinguish confidence as high, medium, or low. | Must |
| FR-20 | Show a warning that visual labels are informational and need verification before repair, safety decisions, or purchase. | Must |

### 7.5 Failure handling

| ID | Requirement | Priority |
|---|---|---|
| FR-21 | Explain unsupported file, missing API key, provider rate limit, unavailable model, and malformed image errors in user language. | Must |
| FR-22 | Give a retry action for recoverable provider errors. | Must |
| FR-23 | Never show API keys or raw provider credentials to users. | Must |

## 8. API Contract

### Endpoint

`POST /classify`

### Multipart request

| Field | Type | Required | Values |
|---|---|---|---|
| `image` | file | Yes | JPG, PNG, WebP; max 10 MB |
| `analysis_mode` | string | Yes | `general` or `components` |

### Success response

```json
{
  "summary": "A close-up view of a car engine bay.",
  "objects": ["engine", "battery", "hoses"],
  "scene": "The image shows the upper area of a vehicle engine compartment.",
  "parts": [
    {
      "name": "Battery",
      "category": "vehicle",
      "location": "upper right",
      "confidence": "high",
      "description": "A rectangular 12-volt battery with visible terminals."
    }
  ],
  "confidence_note": "Main visible components are clear; smaller hoses and wiring are less certain.",
  "safety_note": "Visual identification is informational only. Verify with a manual or qualified technician before repair, safety decisions, or purchase."
}
```

### Error response

```json
{ "detail": "Plain-language error message" }
```

## 9. UX and Content Requirements

- Maintain the existing warm ivory, deep forest green, and pale sage visual system.
- Make **Identify parts** visually distinct without making the interface complex.
- Use plain language: “Identify parts,” not “multimodal component extraction.”
- Use short, non-technical error messages.
- Do not hide warnings in small print; show safety guidance in the result panel.
- On mobile, stack result image above the result details.
- Use icons and labels together; do not rely on color alone.

## 10. AI Output Policy

The model prompt must:

- Identify only parts visibly supported by the image.
- Prefer a general but correct label over a precise but uncertain label.
- Use empty `parts` list when no components can be identified confidently.
- Never diagnose failures, recommend repairs, claim part compatibility, or infer hidden/internal conditions.
- Never identify people or infer sensitive traits.
- Include a verification and safety statement on every result.

## 11. Technical Architecture

### Frontend

- React + Vite
- Local preview using `URL.createObjectURL`
- FormData upload to FastAPI
- Mode selector sends `analysis_mode`
- Result rendering supports `parts[]`

### Backend

- FastAPI
- Validates type and 10 MB upload limit
- Converts input to JPEG using Pillow for provider compatibility
- Sends image and structured prompt to OpenRouter
- Parses structured JSON, defaults missing arrays safely, validates response with Pydantic

### Model provider

- OpenRouter
- Current default: NVIDIA Nemotron 3 Nano Omni 30B (free)
- Model selection should remain environment-configured using `OPENROUTER_MODEL`
- Free models can be rate-limited; production should use a tested paid vision model or provider fallback.

## 12. Privacy and Security

- Keep `OPENROUTER_API_KEY` only in `backend/.env`.
- Never expose provider credentials in frontend code or API responses.
- Do not persist uploads, results, or logs containing raw image data in v1.
- Use HTTPS in any hosted environment.
- Rotate any API key that was shared in a chat or committed accidentally.

## 13. Acceptance Criteria

### General mode

- User can upload a valid image and receives summary, objects, scene, and confidence note.
- User can copy the result.
- Unsupported file types and files above 10 MB receive clear errors.

### Identify parts mode

- User can select Identify parts before upload or before analysis.
- A clear engine-bay image returns a component list with at least one named visible part when the model can see one.
- Each displayed part has a name, category, image location, confidence, and description.
- A photo without identifiable parts returns an empty list and no invented labels.
- The result includes the verification/safety note.

### Quality and resilience

- Layout works on desktop and mobile.
- Provider failures result in safe, understandable error states.
- Secrets are absent from frontend assets and error output.

## 14. Future Roadmap

### V1.1

- Overlay numbered markers on the image matching component-list rows.
- Download analysis as PDF or CSV.
- Camera capture on mobile.
- Analysis history stored locally in browser only.

### V2

- Vehicle make/model/year input to improve context.
- OEM catalog/manual integration with explicit source citations.
- Side-by-side comparison of two engine images.
- User corrections (“this is actually an alternator”) to improve future labeling.
- Batch uploads and asset organization.

### Not before validation

- Repair recommendations
- Fault diagnosis
- Exact part numbers / purchase links
- Safety-critical instructions

## 15. Open Questions

1. Which types of engines should be prioritized first: cars, motorcycles, generators, farm equipment, or industrial machinery?
2. Should the next version add image markers/bounding boxes, or is a clear list sufficient?
3. Should the product eventually support Telugu, Hindi, or other local-language component names?
4. What paid model/provider fallback is acceptable when the free NVIDIA vision endpoint is rate-limited?
