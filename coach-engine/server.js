import express from "express";
import OpenAI from "openai";
import crypto from "node:crypto";
import { COACH_SYSTEM_PROMPT, OUTPUT_SCHEMA } from "./coach-prompt.js";

const app = express();
const PORT = Number(process.env.PORT || 3000);
const MODEL = process.env.OPENAI_MODEL || "gpt-6-luna";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.json({ limit: "100kb" }));
app.use(express.static("public"));

const sessions = new Map();

const newId = () => crypto.randomUUID();

function newState() {
  return {
    facts: [], beliefs: [], evidence: [], inferences: [], unknowns: [],
    contradictions: [], focus_area: "", important_memory: [],
    action_candidate: null, asked_questions: [],
    working_diagnosis: {
      statement: "Not enough evidence yet.",
      confidence: "not_ready",
      evidence_for: [], evidence_against: [], what_would_change_my_mind: []
    }
  };
}

function addUnique(target, items) {
  for (const item of items || []) {
    if (typeof item !== "string") continue;
    const value = item.trim();
    if (value && !target.includes(value)) target.push(value);
  }
}

function contextFor(s) {
  return JSON.stringify({
    business: s.business,
    case_state: s.state,
    recent_conversation: s.messages.slice(-16),
    previously_asked_questions: s.state.asked_questions.slice(-25)
  }, null, 2);
}

app.post("/api/session", (req, res) => {
  const session_id = newId();
  sessions.set(session_id, {
    id: session_id,
    business: null,
    state: newState(),
    messages: [],
    created_at: new Date().toISOString()
  });
  res.json({ session_id });
});

app.post("/api/business", (req, res) => {
  const { session_id, business } = req.body || {};
  const s = sessions.get(session_id);
  if (!s) return res.status(404).json({ error: "Session not found." });
  if (!business || typeof business !== "object") return res.status(400).json({ error: "Business profile is required." });

  s.business = {
    name: String(business.name || "").trim(),
    description: String(business.description || "").trim(),
    people: String(business.people || "").trim(),
    years: String(business.years || "").trim(),
    goal: String(business.goal || "").trim(),
    concern: String(business.concern || "").trim()
  };
  res.json({ ok: true });
});

app.post("/api/message", async (req, res) => {
  try {
    const { session_id, message } = req.body || {};
    const s = sessions.get(session_id);

    if (!s) return res.status(404).json({ error: "Session not found." });
    if (typeof message !== "string" || !message.trim()) return res.status(400).json({ error: "Message is required." });
    if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: "Server API key is not configured." });

    const userMessage = message.trim();
    s.messages.push({ role: "owner", content: userMessage, at: new Date().toISOString() });

    const developerContext = [
      "CURRENT CASE WORKING MEMORY:",
      contextFor(s),
      "",
      "Before responding, silently determine whether the latest message changes any prior conclusion.",
      "Do not ask a question if the answer is already established.",
      "Do not repeat a question merely with different wording.",
      "If sufficient evidence exists, stop investigating and move to challenge, diagnosis, decision or action.",
      "The structured output is application state. The owner should only see the reply, not hidden reasoning."
    ].join("\n");

    const response = await client.responses.create({
      model: MODEL,
      input: [
        { role: "system", content: COACH_SYSTEM_PROMPT },
        { role: "developer", content: developerContext },
        { role: "user", content: userMessage }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "coach_turn",
          strict: true,
          schema: OUTPUT_SCHEMA
        }
      }
    });

    const output = JSON.parse(response.output_text);
    const update = output.state_update || {};

    for (const key of ["facts","beliefs","evidence","inferences","unknowns","contradictions","important_memory"]) {
      addUnique(s.state[key], update[key]);
    }

    s.state.focus_area = update.focus_area || s.state.focus_area;
    s.state.action_candidate = update.action_candidate || null;
    s.state.working_diagnosis = output.working_diagnosis || s.state.working_diagnosis;

    if (output.primary_question) addUnique(s.state.asked_questions, [output.primary_question]);

    s.messages.push({ role: "coach", content: output.reply, at: new Date().toISOString() });

    res.json({
      reply: output.reply,
      mode: output.mode,
      working_diagnosis: s.state.working_diagnosis,
      state: s.state
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Coach engine error.", detail: error?.message || "Unknown error." });
  }
});

app.get("/api/state/:session_id", (req, res) => {
  const s = sessions.get(req.params.session_id);
  if (!s) return res.status(404).json({ error: "Session not found." });
  res.json({ business: s.business, state: s.state, messages: s.messages });
});

app.post("/api/feedback", (req, res) => {
  const { session_id, answers } = req.body || {};
  console.log("SME_COACH_FEEDBACK", JSON.stringify({
    id: newId(),
    session_id: session_id || null,
    answers: answers || {},
    at: new Date().toISOString()
  }));
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`SME Coach engine listening on port ${PORT}`);
});
