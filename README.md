<div align="center">

```
███████╗ ██████╗ ███████╗███╗   ██╗
██╔════╝██╔═══██╗██╔════╝████╗  ██║
███████╗██║   ██║█████╗  ██╔██╗ ██║
╚════██║██║   ██║██╔══╝  ██║╚██╗██║
███████║╚██████╔╝███████╗██║ ╚████║
╚══════╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝
```

### ⚡ Code together. Chat live. Let AI build it. Run it — instantly. ⚡

*A real-time collaborative coding platform with an AI co-pilot and an in-browser dev environment.*

<br/>

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-Vite-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![Gemini](https://img.shields.io/badge/Google-Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=22&pause=1000&color=8B5CF6&center=true&vCenter=true&width=600&lines=Real-time+multiplayer+coding;AI-generated+full-stack+apps;Live+preview+%E2%80%94+zero+setup" alt="Typing SVG" />

</div>

---

## 📖 Table of Contents

- [✨ Overview](#-overview)
- [🚀 Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [🧩 Architecture](#-architecture)
- [📁 Project Structure](#-project-structure)
- [⚙️ Getting Started](#️-getting-started)
- [🎮 Usage](#-usage)
- [🔍 How It Works](#-how-it-works)
- [🗺️ Roadmap](#️-roadmap)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## ✨ Overview

**SOEN** turns a chat window into a full development environment. Invite collaborators into a project room, describe what you want in plain language with `@ai`, and watch a complete file tree get generated, mounted, installed, and run — live, in the browser — with everyone in the room watching it happen together.

Ask for an Express API, a React + Tailwind portfolio, or anything in between — SOEN generates the project, wires up the right install/run commands automatically, and gives you a live, editable preview without touching a terminal.

> 💭 *No terminal. No local setup. Just describe it, and watch it come alive.*

## 🚀 Features

| | |
|---|---|
| 🧑‍🤝‍🧑 **Real-time collaboration** | Multiple users join a project room and chat live via Socket.IO. |
| 🤖 **AI code generation** | Mention `@ai` in a message to have Google Gemini generate code, explanations, or a full file tree for your project. |
| ▶️ **In-browser execution** | Generated (or edited) files are mounted into a [WebContainer](https://webcontainers.io/), installed, and run directly in the browser — zero local setup to preview. |
| ⚙️ **Framework-aware run commands** | The AI specifies its own build/start commands (e.g. `npm start` for Express, `npm run dev` for Vite), so previews work correctly regardless of stack. |
| 📝 **Live code editor** | Click any file in the tree to open and edit it, with syntax highlighting powered by highlight.js. |
| 🗂️ **Nested file explorer** | AI-generated projects render as real folder structures, not flat file lists. |
| 👥 **Collaborator management** | Add teammates to a project and manage access from the sidebar. |
| 🔐 **JWT-based authentication** | Secure login/signup flow protecting project routes. |
| 🔁 **Resilient AI requests** | Automatic retry with backoff on transient Gemini API errors (503/429), with optional multi-key rotation. |

## 🛠️ Tech Stack

<table>
<tr>
<td valign="top" width="50%">

**Frontend**
- ⚛️ React (Vite)
- 🧭 React Router
- 🔌 Socket.IO client
- 🎨 Tailwind CSS
- 🌈 highlight.js — syntax highlighting
- 📝 markdown-to-jsx — rendering AI responses
- 📦 WebContainer API — in-browser Node.js runtime

</td>
<td valign="top" width="50%">

**Backend**
- 🟢 Node.js / Express
- 🔌 Socket.IO — real-time messaging
- 🍃 MongoDB / Mongoose
- 🔐 JWT — authentication
- ✨ Google Generative AI SDK (Gemini) — AI code generation

</td>
</tr>
</table>

## 🧩 Architecture

```
┌──────────────┐        Socket.IO        ┌──────────────┐
│   Browser    │◄───────────────────────►│   Express    │
│  (React app) │                          │   Server     │
│              │        REST (axios)      │              │
│  ┌────────┐  │◄───────────────────────►│  ┌────────┐  │
│  │  Chat  │  │                          │  │  Auth  │  │
│  └────────┘  │                          │  │ (JWT)  │  │
│  ┌────────┐  │                          │  └────────┘  │
│  │  File  │  │                          │  ┌────────┐  │
│  │ Editor │  │                          │  │Projects│  │
│  └────────┘  │                          │  └────────┘  │
│  ┌────────┐  │        Gemini API        │  ┌────────┐  │
│  │  Web-  │  │                          │  │   AI   │  │
│  │Container│ │                          │  │ Service│──┼──► ✨ Google Gemini
│  └────────┘  │                          │  └────────┘  │
└──────────────┘                          └──────┬───────┘
                                                  │
                                            ┌─────▼─────┐
                                            │  MongoDB   │
                                            └───────────┘
```

## 📁 Project Structure

```
SOEN/
├── backend/
│   ├── models/           # Mongoose schemas (user, project)
│   ├── routes/           # Express route handlers
│   ├── services/         # Business logic (e.g. ai.service.js)
│   ├── app.js             # Express app config
│   └── server.js          # HTTP + Socket.IO server entry point
└── frontend/
    ├── src/
    │   ├── auth/          # Route protection (UserAuth)
    │   ├── config/        # axios, socket, webcontainer setup
    │   ├── context/       # React context (user)
    │   ├── routes/        # App routing
    │   ├── screens/       # Page components (Project, Home, etc.)
    │   └── utils/         # fileTree normalization helpers
    └── vite.config.js
```

## ⚙️ Getting Started

### Prerequisites

- Node.js v18+
- A MongoDB instance (local or [Atlas](https://www.mongodb.com/atlas))
- A [Google Generative AI](https://ai.google.dev/) API key

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd SOEN
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

# Single key:
GOOGLE_AI_KEY=your_google_generative_ai_key

# Or multiple keys for load-spreading/failover (comma-separated):
# GOOGLE_AI_KEYS=key_one,key_two,key_three
```

Run the server:

```bash
npm start
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

> ⚠️ **In-browser execution requires cross-origin isolation.** `vite.config.js` must set the `Cross-Origin-Embedder-Policy` and `Cross-Origin-Opener-Policy` headers, or WebContainer previews won't boot. Verify with `window.crossOriginIsolated` in the browser console — it should return `true`.

The app will be available at your Vite dev server URL (typically `http://localhost:5173`).

## 🎮 Usage

1. **Sign up / log in.**
2. **Create or open a project.**
3. **Add collaborators** from the project sidebar.
4. **Chat in real time** with your team.
5. **Ask the AI to build something:**
   ```
   @ai create a personal portfolio website using React and Tailwind CSS with sections for About, Projects, Skills, and Contact
   ```
   The AI responds with an explanation, a nested file tree, and the correct install/run commands for that stack.
6. **Hit Run ▶️** — dependencies install and the app boots inside an embedded preview, no terminal required.
7. **Edit any file** directly in the browser; changes are saved and shared with the team.

## 🔍 How It Works

- **File tree generation**: the AI returns a strict nested `{ directory: {...} }` / `{ file: {...} }` JSON structure (never flat `"folder/file.js"` keys), which is mounted directly into WebContainer.
- **Framework-aware execution**: alongside the file tree, the AI specifies a `buildCommand` and `startCommand` (e.g. `npm install` + `npm start` for Express, or `npm install` + `npm run dev` for Vite). The run button uses whatever the AI specified instead of assuming one convention.
- **Root route guarantee**: every generated Express app includes a working `GET /` route, so the live preview never 404s at its base URL.
- **Preview URLs are session-bound**: the `*.webcontainer-api.io` preview link only works while the browser tab that booted the container stays open — WebContainer runs entirely in-browser via WASM, not on an external server.

## 🗺️ Roadmap

- [ ] AI-assisted edits to a single existing file (rather than always regenerating the full tree)
- [ ] Persistent `node_modules` caching across WebContainer sessions
- [ ] Git integration — push generated projects to a real GitHub repo
- [ ] One-click deploy (Vercel/Render) for generated apps
- [ ] Support for non-Node stacks (Python, Go) via an external sandbox

## 🤝 Contributing

Contributions are welcome! To get started:

1. 🍴 Fork the repo
2. 🌿 Create a feature branch (`git checkout -b feature/your-feature`)
3. 💾 Commit your changes (`git commit -m 'Add some feature'`)
4. 🚀 Push to the branch (`git push origin feature/your-feature`)
5. 🔃 Open a Pull Request

## 📄 License

Distributed under the **ISC License**.

---

<div align="center">

### Built by udaykx⚡ at **PREC**

<img src="https://media.giphy.com/media/hpaKe0ceR3nyd8CcnV/giphy.gif" width="200" alt="anime coding vibe"/>

</div>
