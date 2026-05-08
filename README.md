# Helius Chain — Blockchain Designed for Impact

Helius Network's AI-powered blockchain dashboard with EngineerAgent and ResearchAgent.

## Local Development

```bash
npm install
npm run dev
```

For local dev with Netlify Functions (agents):
```bash
npm install -g netlify-cli
netlify dev
```

## Deploy to Netlify

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Helius Chain v1.0"
git remote add origin https://github.com/YOUR_ORG/helius-chain.git
git push -u origin main
```

### 2. Connect to Netlify
- Go to app.netlify.com → Add new site → Import from Git
- Select your GitHub repo
- Build command: `npm run build`
- Publish directory: `dist`

### 3. Set Environment Variable
In Netlify → Site settings → Environment variables:
```
ANTHROPIC_API_KEY = sk-ant-your-key-here
```

### 4. Deploy
Netlify auto-deploys on every push to main.

## Architecture
- `src/App.jsx` — React frontend
- `netlify/functions/claude.js` — Serverless API proxy (keeps API key secure)
- `netlify.toml` — Routing + build config
