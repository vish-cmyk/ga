# SME Business Coach — low-cost stack

This branch is the cheaper production-oriented build. The current Floot prototype remains untouched on main.

Architecture:
- Cloudflare Workers: web app + API.
- Cloudflare D1: persistent cases, conversation history and tester feedback.
- Cloudflare Workers AI: hosted inference through the AI binding.
- Validation model: @cf/zai-org/glm-4.7-flash.
- Browser-generated client key for validation only.

Why this route:
Cloudflare Workers Paid currently starts at US$5/month, while D1 has a free prototype tier. OpenRouter supports standard Bearer-authenticated chat completions and pay-as-you-go model routing. Pricing varies by model; the current OpenRouter listing for GLM 4.7 Flash is US$0.06/M input and US$0.40/M output.

Deployment needs the Cloudflare account to have Workers AI enabled. No third-party AI API key is required for this validation build.

Recommended validation setup:
1. Start with GLM-4.7-Flash to keep inference costs low.
2. Compare the coaching quality against the Floot version before changing architecture further.
3. Compare coaching quality, not just answer quality.
4. Watch Workers AI Neuron usage in the Cloudflare dashboard.

This v1 is intentionally validation-grade, not public-production-grade. Before wider release add authenticated accounts, rate limiting, privacy/retention controls, stronger tenant isolation and abuse protection.

Useful commands from this directory:
npm install
npm run check
npx wrangler d1 migrations apply DB --local
npm run dev
npx wrangler d1 migrations apply DB --remote
npm run deploy
