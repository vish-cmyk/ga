# SME Coach — Real Coach Engine v1

This is the first real AI coaching engine for SME Coach. It replaces keyword/canned-response logic with a server-side OpenAI Responses API call and structured coaching state.

## What this milestone is for

The objective is to prove coaching quality before building more product features.

The Coach must:
- understand the whole case;
- choose the next useful intervention;
- distinguish fact, belief, evidence, inference and unknown;
- avoid redundant questions;
- detect contradictions;
- challenge assumptions;
- know when to stop investigating;
- form a working diagnosis with confidence;
- help move from diagnosis to decision and action.

## Architecture

Browser -> Express API -> OpenAI Responses API
                         -> structured coaching state

The API key stays on the server.

## Run

Use Node.js 24+.

cp .env.example .env
# put OPENAI_API_KEY in .env
npm install
npm start

Open http://localhost:3000

## Test cases

test-cases.json contains the three adversarial cases we should use before external testing:
1. IT company — price vs value, churn, cash and owner workload.
2. Paint distributor — dealer incentives vs genuine customer demand.
3. Successful retailer — health vs readiness for a second location.

## Acceptance rule

If the experience feels like:
Question -> Answer -> Question -> Answer

it fails.

The desired experience is:
Listen -> Understand -> Investigate -> Connect evidence -> Challenge -> Diagnose -> Decide -> Act.

## Technology note

The current implementation uses the OpenAI Responses API. OpenAI's official SDK documentation recommends the Responses API for primary model interaction, and the Assistants API was sunset on 26 August 2026.
