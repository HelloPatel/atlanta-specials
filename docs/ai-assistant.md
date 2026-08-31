# AI Assistant (Phera Assistant)

A built-in wedding-planning chat assistant. Users open **AI Assistant** in the
sidebar and chat with an LLM that is grounded in their current wedding's data
(events, guests, RSVP tallies, and budget summary).

## Architecture

```
AssistantChat.jsx  ──POST /api/assistant──▶  api/assistant (Azure SWA function)  ──▶  LLM
   (client)            { messages, context }        (holds API key + prompt)         (Azure OpenAI / OpenAI)
```

- **Grounding is client-supplied.** The chat blade already has the active wedding's
  guests/events/budget from Firestore subscriptions. `buildWeddingContext()` compiles
  a compact summary and sends it as `context`. No Firebase Admin credentials are
  needed server-side; the function stays stateless.
- **Auth.** The client sends the signed-in user's Firebase ID token as a
  `Bearer` token. The function verifies it against Google's public JWKS (issuer
  `securetoken.google.com/<projectId>`, audience `<projectId>`). Set
  `FIREBASE_PROJECT_ID` to enforce this in production.
- **Phase 1 = chat + grounding only.** The assistant cannot modify the wedding yet.
  Tool-calling / write actions ("add this guest to these events") are a later phase
  and can drop into `api/assistant/index.js` (add a `tools` array + handle
  `tool_calls`) plus the existing services (`guestService`, `eventService`, etc.).

## Required app settings (Azure Static Web Apps → Configuration)

Set **one** provider:

### Option A — Azure OpenAI (recommended)
| Setting | Example | Notes |
| --- | --- | --- |
| `AZURE_OPENAI_ENDPOINT` | `https://my-openai.openai.azure.com` | Resource endpoint |
| `AZURE_OPENAI_KEY` | `xxxxxxxx` | Resource key |
| `AZURE_OPENAI_DEPLOYMENT` | `gpt-4o-mini` | Your deployment name |
| `AZURE_OPENAI_API_VERSION` | `2024-08-01-preview` | Optional (has a default) |

### Option B — OpenAI
| Setting | Example | Notes |
| --- | --- | --- |
| `OPENAI_API_KEY` | `sk-...` | |
| `OPENAI_MODEL` | `gpt-4o-mini` | Optional (default `gpt-4o-mini`) |

### Recommended (security)
| Setting | Example | Notes |
| --- | --- | --- |
| `FIREBASE_PROJECT_ID` | `atlanta-specials` | Enforces Firebase ID-token verification on the endpoint |

If **no** provider is configured, the endpoint returns a friendly "not switched on
yet" message and the app keeps working — nothing crashes.

## Deployment

The SWA workflow builds and deploys the managed function from `api/`
(`api_location: "api"`). No extra steps beyond setting the app settings above.

## Local development

`npm run dev` (Vite) does **not** run the serverless function, so the chat will
show "the assistant API is not available here." To exercise the function locally,
use the SWA CLI:

```
npm run build
swa start build --api-location api
```

with the provider env vars available to the API (e.g. via `api/local.settings.json`).

## Cost

Token-driven. With a `gpt-4o-mini`-class model, a typical message is a fraction of
a cent (roughly a few cents per couple over the whole planning cycle). Consider a
per-wedding message cap before enabling for large numbers of weddings.
