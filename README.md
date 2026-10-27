# 🚀 SocialPilot AI — AI Social Media Content Generator & Auto Publisher

> **A modern, full-stack, local-first social media marketing automation platform with ₹0 operational cost.**  
> Create multi-platform campaigns, generate tailored copy with local AI, compose publication-ready visual marketing flyers across 20 distinct design archetypes, preview posts in realistic social mockups, and schedule or publish directly to **Facebook, Instagram, LinkedIn, and X (Twitter)** with zero monthly API subscription costs.

---

## 📑 Table of Contents

- [Executive Summary](#-executive-summary)
- [System Architecture](#-system-architecture)
- [Core Methods & How It Works](#-core-methods--how-it-works)
  - [Method 1: Single Topic to Multi-Platform AI Copywriting](#method-1-single-topic-to-multi-platform-ai-copywriting)
  - [Method 2: Multi-Archetype 20-Template Visual Flyer Engine](#method-2-multi-archetype-20-template-visual-flyer-engine)
  - [Method 3: Bulk Scheduling & Automation Workflow](#method-3-bulk-scheduling--automation-workflow)
  - [Method 4: Dual-Engine Publishing Architecture (Mock vs Real)](#method-4-dual-engine-publishing-architecture-mock-vs-real)
  - [Method 5: Background Scheduler & Fault-Tolerant Retry Loop](#method-5-background-scheduler--fault-tolerant-retry-loop)
- [Feature Tour & Application Pages (17 Views)](#-feature-tour--application-pages-17-views)
- [Supported Social Networks & Limits](#-supported-social-networks--limits)
- [Project Directory Structure](#-project-directory-structure)
- [Quickstart: Local Development Setup](#-quickstart-local-development-setup)
  - [Prerequisites](#prerequisites)
  - [Option A: 1-Click Windows Launcher (Fastest)](#option-a-1-click-windows-launcher-fastest)
  - [Option B: Manual Step-by-Step Setup](#option-b-manual-step-by-step-setup)
  - [Option C: Full Containerized Docker Compose](#option-c-full-containerized-docker-compose)
- [Configuration & Environment Variables](#-configuration--environment-variables)
- [REST API Reference](#-rest-api-reference)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Security & Credential Protection](#-security--credential-protection)
- [Frequently Asked Questions (FAQ) & Troubleshooting](#-frequently-asked-questions-faq--troubleshooting)
- [License](#-license)

---

## 💡 Executive Summary

Traditional social media management tools (Buffer, Hootsuite, Sprout Social) charge expensive monthly subscriptions ($50 to $500+/mo) and require manual graphic design, copy reformatting for every channel, and high operational overhead.

**SocialPilot AI** is built from the ground up to eliminate this overhead:
1. **₹0 Monthly AI Cost:** Uses [Ollama](https://ollama.com/) (Llama 3, Mistral, Qwen) running locally on your hardware. If Ollama is offline, a built-in algorithmic template fallback guarantees zero downtime.
2. **₹0 Graphic Design Cost:** An embedded Pillow + Vector graphics engine composes branded 1080x1080 marketing flyers across 20 distinct design archetypes (Dark Tech, Brutalist, Glassmorphic, Minimalist, Corporate) with badges, bullet points, and contact footers.
3. **Dual Publishing Modes:** Develop and test freely in `mock` mode with realistic platform simulation and failure injection without risk of social media account bans. Flip to `real` mode for official OAuth 2.0 publishing.
4. **Channel Isolation:** Publishing to all 4 platforms simultaneously is decoupled. If X (Twitter) fails due to a character limit, LinkedIn, Facebook, and Instagram continue to publish successfully.

---

## 🏛 System Architecture

```
                                  +---------------------------------------+
                                  |         SocialPilot AI Web UI         |
                                  |     (React 19, TypeScript, Vite)      |
                                  +-------------------+-------------------+
                                                      |
                                               REST API / JSON
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |           FastAPI Backend             |
                                  |         (Python 3.12+ Async)          |
                                  +----+--------------------+---------+---+
                                       |                    |         |
                  +--------------------+                    |         +---------------------+
                  |                                         |                               |
                  v                                         v                               v
    +---------------------------+             +---------------------------+   +---------------------------+
    |         AI Engine         |             |       Image Engine        |   |    Publishing Adapters    |
    |  - Local Ollama (LLaMA3)  |             |  - 20 Design Archetypes   |   |  - Facebook Graph API     |
    |  - Zero-Downtime Fallback |             |  - Pillow 2D/3D Vectors   |   |  - Instagram Graph API    |
    |  - Brand Tone Injector    |             |  - Free AI Backgrounds    |   |  - LinkedIn UGC API       |
    +---------------------------+             +---------------------------+   |  - X (Twitter) API v2     |
                  |                                         |                 |  - Mock Dev Engine        |
                  |                                         |                 +---------------------------+
                  +--------------------+--------------------+                               |
                                       |                                                    |
                                       v                                                    v
                        +-------------------------------+                    +-------------------------------+
                        |   Storage & Persistence       |                    |     Background Scheduler      |
                        |  - SQLite / PostgreSQL Async  |                    |  - Built-in AsyncIOScheduler  |
                        |  - Fernet 256-Bit Key Vault   | <----------------- |  - Celery + Redis (Optional)  |
                        |  - Storage/media/ Asset Store |                    |  - 10-Second Queue Poller     |
                        +-------------------------------+                    +-------------------------------+
```

---

## ⚙ Core Methods & How It Works

### Method 1: Single Topic to Multi-Platform AI Copywriting

```
[ User Input / Raw Topic ]
           │
           ▼
[ Brand Tone Rules & Constraints ] ──► (Injected into System Prompt)
           │
           ▼
[ Local LLM / Ollama Engine ]
           │
           ├──► Facebook  : Conversational, bulleted benefits, strong call-to-action
           ├──► Instagram : Engaging visual hook, clean spacing, 15-25 targeted hashtags
           ├──► LinkedIn  : Executive thought leadership, industry context, career takeaways
           └──► X/Twitter : Concise punchy hook under 280 strict characters
```

1. The user provides a raw topic, link, or bullet points (e.g. *"AI Voice Receptionist for Small Clinics"*).
2. The AI service merges the prompt with your **Brand Voice Settings** (personality traits, target audience, banned words, custom hashtags).
3. The prompt is dispatched to **Ollama** (`http://localhost:11434`), requesting a structured JSON schema containing channel-tailored copy, extracted keywords, hashtags, call-to-action text, and an image generation prompt.
4. If Ollama is offline or uninstalled, the backend triggers an **Intelligent Heuristic Fallback Engine** that analyzes the text and synthesizes clean, high-performing copy for all 4 channels automatically.

---

### Method 2: Multi-Archetype 20-Template Visual Flyer Engine

Instead of relying on third-party graphic design tools or expensive DALL-E/Midjourney credits, SocialPilot AI ships with a self-contained visual rendering system ([`app/services/image_engine/composer.py`](file:///c:/Users/katana/Downloads/socialpilot-ai/backend/app/services/image_engine/composer.py)):

```
   ┌────────────────────────────────────────────────────────┐
   │ [CATEGORY PILL / BADGE]       AI • AUTOMATION ENGINE   │
   │                                                        │
   │ Main Marketing Headline In Heavy Display Typography    │
   │ Supporting contextual description explaining value... │
   │                                                        │
   │  ┌──────────────────────┐   ┌───────────────────────┐  │
   │  │ ✓ Bullet Benefit 1    │   │  [3D Render Graphic / │  │
   │  │ ✓ Bullet Benefit 2    │   │   Glowing Podium Art] │  │
   │  │ ✓ Bullet Benefit 3    │   │                       │  │
   │  └──────────────────────┘   └───────────────────────┘  │
   │                                                        │
   │ [ ACTION BUTTON CTA ]                  ★ 4.9 RATED     │
   ├────────────────────────────────────────────────────────┤
   │ 🏢 InfiniteTech AI  |  🌐 www.domain.com  | 📞 Contact │
   └────────────────────────────────────────────────────────┘
```

- **20 Visual Archetypes:** Choose from Dark Tech, Cyberpunk Glow, Glassmorphism, Brutalist Mono, Corporate Clean, Pastel Modern, Editorial Serif, and more.
- **Dynamic Content Adapters:** Auto-wraps headlines, dynamically sizes typography to prevent text clipping, places vector checkmarks, and draws phone/avatar mockups.
- **Branded Footers:** Every flyer includes your company name, website link, phone number, and social handle for instant brand recall.

---

### Method 3: Bulk Scheduling & Automation Workflow

The **Bulk Auto-Post Engine** (`/bulk-schedule`) lets you schedule up to 30 to 100 days of content in under 60 seconds:

1. **Input:** Upload an Excel (`.xlsx`) or CSV (`.csv`) file with columns: `Topic`, `Heading`, `Key Details`, `Call To Action`. Alternatively, type a list of topics directly into the UI.
2. **Batch Ingestion:** The engine iterates through every item, generates unique copy for Facebook, Instagram, LinkedIn, and X, renders a distinctive flyer for each post, and calculates staggered publication times.
3. **Queue Creation:** Posts are automatically stored in the database with status `SCHEDULED` and distributed across the interactive **Content Calendar**.

---

### Method 4: Dual-Engine Publishing Architecture (Mock vs Real)

SocialPilot AI uses a pluggable adapter pattern ([`app/adapters/`](file:///c:/Users/katana/Downloads/socialpilot-ai/backend/app/adapters/)) controlled by the `APP_MODE` environment setting:

| Feature | `APP_MODE=mock` (Development) | `APP_MODE=real` (Production) |
| :--- | :--- | :--- |
| **Target Audience** | Developers, QA, Local Testing | Production Live Publishing |
| **API Keys Needed?** | ❌ None (zero setup required) | ✅ Yes (Facebook, IG, LinkedIn, X Apps) |
| **Risk of Account Bans** | 0% (Pure local simulation) | Depends on platform rate limits |
| **Latency Simulation** | Configurable realistic delay (300ms–800ms) | Real network roundtrip |
| **Failure Injection** | Toggle simulated platform errors via UI to test retries | Real API error codes & responses |
| **Account Linking** | 1-Click instant connection | Official OAuth 2.0 user login flow |

---

### Method 5: Background Scheduler & Fault-Tolerant Retry Loop

1. **Lightweight In-Process Polling:** By default, a lightweight `AsyncIOScheduler` runs inside the FastAPI process, checking the database every 10 seconds for posts where `scheduled_at <= NOW()` and `status == 'SCHEDULED'`.
2. **Channel Decoupling:** When a post is due, publication jobs are dispatched to each platform in parallel using Python's `asyncio.gather(..., return_exceptions=True)`.
3. **Audit & Error Logging:** Every attempt records status, HTTP codes, response bodies, and error details into the `platform_posts` table.
4. **One-Click Retry:** If any platform encounters an issue (e.g. rate limit or token expiry), it is flagged with status `FAILED` in the **Failed Posts Center** (`/failed`). The user can review the exact API error and trigger an idempotent retry without re-publishing to channels that already succeeded.

---

## 🖥 Feature Tour & Application Pages (17 Views)

| # | Route | Page Name | Primary Capability |
| :-: | :--- | :--- | :--- |
| 1 | `/` | **Dashboard** | KPI cards, channel distribution chart, upcoming scheduled queue, system status. |
| 2 | `/create-post` | **Create Post** | Multi-channel interactive editor with live mockups, character counters, and scheduler. |
| 3 | `/bulk-schedule` | **Bulk Scheduler** | Upload CSV/Excel or enter topics; bulk AI copy generation and flyer rendering. |
| 4 | `/ai-studio` | **AI Content Studio** | Generate structured social copy from topics, notes, or links across all 4 platforms. |
| 5 | `/image-studio` | **AI Image Studio** | Generate marketing flyers using the 20-template engine or prompt-based AI art. |
| 6 | `/campaigns` | **Campaigns** | Organize posts under strategic marketing initiatives with start/end dates. |
| 7 | `/calendar` | **Content Calendar** | Monthly and weekly interactive grid with color-coded status badges. |
| 8 | `/scheduled` | **Scheduled Queue** | View pending posts with countdown timers, reschedule, or cancel actions. |
| 9 | `/preview/:postId`| **Post Preview** | Pixel-accurate mockups replicating the real Facebook, Instagram, LinkedIn, and X feeds. |
| 10 | `/published` | **Published History**| Archive of successfully posted content with platform IDs and live permalinks. |
| 11 | `/drafts` | **Drafts Center** | Auto-saved drafts ready for refinement and later scheduling. |
| 12 | `/failed` | **Failed & Retry** | Error logs detailing failed publications with 1-click isolated channel retry. |
| 13 | `/accounts` | **Social Accounts** | Connect, monitor, and disconnect social media profiles (Mock or OAuth 2.0). |
| 14 | `/analytics` | **Analytics** | Engagement rates, reach metrics, top-performing posts, and audience growth charts. |
| 15 | `/templates` | **Templates** | Reusable marketing prompts (Product Launch, Thought Leadership, Promos). |
| 16 | `/brand-settings`| **Brand Voice** | Define tone, persona, banned keywords, and default hashtags. |
| 17 | `/ai-settings` | **AI Settings** | Switch Ollama models (`llama3`, `mistral`, `qwen2.5`), change temperature, test latency. |
| 18 | `/app-settings` | **App Settings** | Toggle publishing modes (`mock` vs `real`), inspect database metrics, change logs. |

---

## 📱 Supported Social Networks & Limits

| Platform | Target API | Payload Support | Validation Limits Enforced |
| :--- | :--- | :--- | :--- |
| **Facebook Pages** | Meta Graph API v19.0 | Text copy, link cards, single & multi-image | Max 63,206 chars; auto token refresh |
| **Instagram** | Instagram Graph API | Single square/portrait images, carousels | Max 2,200 chars; max 30 hashtags; aspect ratio validation |
| **LinkedIn** | UGC Posts API / REST | Text articles, images, company page feeds | Max 3,000 chars; rich formatting; hashtags |
| **X (Twitter)** | Twitter API v2 | Tweets, threads, media upload v1.1/v2 | Strict 280-character counter with live warnings |

---

## 📂 Project Directory Structure

```
socialpilot-ai/
├── backend/
│   ├── app/
│   │   ├── adapters/          # Social platform publishers (base, mock, facebook, instagram, linkedin, twitter)
│   │   ├── api/               # FastAPI REST endpoints (auth, ai, posts, publishing, media, campaigns, etc.)
│   │   ├── core/              # Security (JWT, bcrypt), Fernet encryption, database session, async scheduler
│   │   ├── models/            # SQLAlchemy 2.0 async models (User, Post, PlatformPost, Media, Campaign, etc.)
│   │   ├── schemas/           # Pydantic v2 validation contracts & request/response schemas
│   │   ├── services/          # Business logic: AI service, image composer, social publisher lifecycle
│   │   │   └── image_engine/  # 20-template marketing flyer composer & vector generator
│   │   ├── config.py          # Environment settings with Pydantic BaseSettings
│   │   └── main.py            # FastAPI entry point, static media mounts, CORS & lifespan handlers
│   ├── alembic/               # Database migration scripts
│   ├── tests/                 # Automated pytest test suites (11 comprehensive test cases)
│   ├── Dockerfile             # Multi-stage production backend container configuration
│   ├── requirements.txt       # Python dependencies
│   ├── run_server.py          # Standalone Uvicorn development server launcher
│   └── run_tests.py           # Automated test suite runner
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable UI components (Sidebar, Topbar, Modals, Feed Mockups)
│   │   ├── contexts/          # React contexts: AuthContext, ThemeContext (Dark/Light), ToastContext
│   │   ├── pages/             # All 17 application pages + Login/Register views
│   │   ├── services/          # Typed Axios client connecting to backend /api
│   │   ├── App.tsx            # Protected client-side routing
│   │   └── main.tsx           # React 19 root bootstrap
│   ├── Dockerfile             # Multi-stage build serving static frontend with Nginx
│   ├── nginx.conf             # Production Nginx reverse-proxy rules
│   ├── package.json           # React 19, Tailwind CSS v4, Lucide icons, Vite
│   └── vite.config.ts         # Vite bundler configuration & local dev proxy
├── storage/
│   └── media/                 # Persisted uploaded and AI-generated flyer images
├── .env.example               # Complete environment variable template
├── .gitignore                 # Clean repository rules (ignores caches, pyc, node_modules)
├── docker-compose.yml         # 6-service orchestration (Postgres, Redis, Backend, Worker, Frontend)
├── README.md                  # Project documentation
└── run_local.bat              # 1-Click Windows development launcher
```

---

## ⚡ Quickstart: Local Development Setup

### Prerequisites

- **Python 3.11+** installed ([Download Python](https://www.python.org/downloads/))
- **Node.js 18+** & **npm** installed ([Download Node.js](https://nodejs.org/))
- *(Optional)* **Ollama** for local AI generation ([Download Ollama](https://ollama.com/download))

---

### Option A: 1-Click Windows Launcher (Fastest)

If you are on Windows, simply double-click:
```bash
run_local.bat
```
This batch file automatically opens two terminal windows:
1. Starts the FastAPI backend at `http://localhost:8000`
2. Starts the Vite React frontend at `http://localhost:5173`

---

### Option B: Manual Step-by-Step Setup

#### 1. Setup Backend

Open a terminal in the project root:
```bash
cd backend

# Create a virtual environment
python -m venv .venv

# Activate virtual environment
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
python run_server.py
```
- **Backend API:** `http://localhost:8000`
- **Interactive Swagger Docs:** `http://localhost:8000/docs`
- **ReDoc Documentation:** `http://localhost:8000/redoc`

#### 2. Setup Frontend

Open a second terminal window:
```bash
cd frontend

# Install npm dependencies
npm install

# Start Vite development server
npm run dev
```
- **Frontend Web Application:** `http://localhost:5173`

#### 3. Start Local AI (Optional)

If you want real local LLM generation instead of the built-in fallback:
```bash
ollama run llama3
```

---

### Option C: Full Containerized Docker Compose

To run the entire production-grade stack with **PostgreSQL 16, Redis 7, Celery Background Workers, FastAPI, and Nginx**:

```bash
# Build and launch all 6 containers in detached mode
docker compose up --build -d

# Verify all containers are healthy
docker compose ps

# Tail logs
docker compose logs -f backend
```

Exposed Services:
- **Frontend Web UI:** `http://localhost:3000`
- **Backend API:** `http://localhost:8000`
- **Swagger Docs:** `http://localhost:8000/docs`
- **PostgreSQL Database:** `localhost:5432`
- **Redis Queue:** `localhost:6379`

---

## ⚙ Configuration & Environment Variables

Copy `.env.example` to `backend/.env` to customize settings:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `APP_NAME` | `SocialPilot AI` | Application title displayed across UI and headers |
| `APP_ENV` | `development` | Runtime environment (`development`, `production`, `test`) |
| `APP_MODE` | `mock` | Publishing engine mode: `mock` (safe local testing) or `real` (OAuth 2.0) |
| `SECRET_KEY` | *(Random 64-char string)* | Secret key used for signing JWT bearer tokens |
| `DATABASE_URL` | `sqlite+aiosqlite:///./socialpilot.db` | Database connection string (SQLite or PostgreSQL) |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis instance for Celery job queues |
| `OLLAMA_BASE_URL`| `http://localhost:11434` | Address where local Ollama daemon is running |
| `OLLAMA_MODEL` | `llama3` | Model name to use (`llama3`, `mistral`, `qwen2.5`) |
| `MEDIA_STORAGE_PATH` | `../storage/media` | Absolute or relative path where flyer images are saved |
| `TOKEN_ENCRYPTION_KEY` | *(Fernet 32-byte key)* | 256-bit symmetric key for encrypting social OAuth tokens |
| `FACEBOOK_APP_ID` | `""` | Facebook App ID (required only in `real` mode) |
| `FACEBOOK_APP_SECRET`| `""` | Facebook App Secret (required only in `real` mode) |
| `INSTAGRAM_APP_ID`| `""` | Instagram App ID (required only in `real` mode) |
| `LINKEDIN_CLIENT_ID`| `""` | LinkedIn OAuth Client ID (required only in `real` mode) |
| `X_CLIENT_ID` | `""` | X / Twitter Developer App Client ID |

---

## 📡 REST API Reference

All backend API routes are prefixed under `/api`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user account |
| `POST` | `/api/auth/login` | Authenticate user and receive JWT Bearer token |
| `GET` | `/api/auth/me` | Fetch currently authenticated user profile |
| `POST` | `/api/ai/generate` | Generate tailored multi-platform copy from a topic |
| `POST` | `/api/ai/regenerate-platform`| Regenerate copy for a single platform |
| `GET` | `/api/ai/health` | Check Ollama status, active model, and latency |
| `GET` | `/api/posts` | List posts with pagination, status, and search filters |
| `POST` | `/api/posts` | Create a post with channel payloads and schedule date |
| `GET` | `/api/posts/{id}` | Retrieve post details, media attachments, and channel states |
| `PUT` | `/api/posts/{id}` | Update draft or scheduled post content |
| `DELETE`| `/api/posts/{id}` | Delete a post and cancel pending scheduler jobs |
| `POST` | `/api/publishing/publish-now/{id}`| Publish a post immediately across all selected channels |
| `POST` | `/api/publishing/retry/{job_id}` | Retry a failed platform post |
| `POST` | `/api/media/upload` | Upload image/video asset to local media store |
| `POST` | `/api/media/generate-flyer` | Generate a 1080x1080 marketing flyer using the 20-template engine |
| `GET` | `/api/calendar` | Retrieve posts mapped by date for calendar views |
| `GET` | `/api/analytics/overview` | Fetch KPI totals, channel shares, and engagement stats |
| `GET` | `/api/brand-settings` | Get user brand voice rules, hashtags, and guidelines |
| `PUT` | `/api/brand-settings` | Update user brand voice settings |

---

## 🧪 Testing & Quality Assurance

The project includes an end-to-end automated test suite covering authentication, AI generation, post management, isolated channel publishing, and media handling.

Run tests using the project test runner:
```bash
cd backend
python run_tests.py
```

### Verified Test Suites:
- `tests/test_auth.py` — Registration, login, password hashing, and token verification.
- `tests/test_ai_generation.py` — Content generation, single-platform regeneration, and helper tools.
- `tests/test_posts.py` — Post creation, user isolation, and multi-platform payload validation.
- `tests/test_publishing_lifecycle.py` — Immediate publishing, scheduled queue execution, failure isolation, and calendar retrieval.
- `tests/test_media_and_campaigns.py` — File uploads, mime-type verification, campaign CRUD, and brand voice settings.

**Result:** `11 passed (100% passing rate)`

---

## 🔒 Security & Credential Protection

- **Zero Plaintext Tokens:** All third-party OAuth access tokens and secrets are encrypted at rest using AES-128-CBC / Fernet 256-bit symmetric encryption (`cryptography.fernet`).
- **User Isolation:** Every database query enforces multi-tenant isolation by scoping queries to the `user_id` parsed from cryptographically signed JWT headers.
- **Fail-Safe Mode Guards:** The application refuses to call live social APIs unless `APP_MODE=real` is explicitly enabled and all credentials are validated.
- **Strict Input Validation:** All API requests and responses are strictly validated via Pydantic v2 schemas.

---

## ❓ Frequently Asked Questions (FAQ) & Troubleshooting

### 1. What happens if I don't have Ollama installed?
SocialPilot AI will **not crash**. It detects that Ollama is unreachable and seamlessly activates its built-in heuristic fallback engine, generating complete, channel-tailored copy for Facebook, Instagram, LinkedIn, and X automatically.

### 2. Can I use SocialPilot AI without entering any social media API keys?
**Yes.** The system defaults to `APP_MODE=mock`. In mock mode, you can connect mock accounts with 1-click, test publishing, simulate failures, schedule posts, and view live mockups without setting up Meta, LinkedIn, or Twitter Developer accounts.

### 3. How do I switch to live publishing on real social accounts?
1. Edit `backend/.env` and set `APP_MODE=real`.
2. Add your developer credentials for each network (`FACEBOOK_APP_ID`, `X_CLIENT_ID`, etc.).
3. Restart the backend. In the frontend, navigate to **Social Accounts** (`/accounts`) and click **Connect** to initiate OAuth 2.0 authorization.

### 4. Where are uploaded media and generated flyers stored?
All image assets are saved locally to `storage/media/`. The FastAPI backend serves them statically at `http://localhost:8000/storage/media/<filename>`.

### 5. How do I reset or inspect the database?
The default database is an SQLite file located at `backend/socialpilot.db`. To inspect it, you can open it with any SQLite viewer (e.g. [DB Browser for SQLite](https://sqlitebrowser.org/)) or run queries with the Python SQLite module. To reset from scratch, simply delete `backend/socialpilot.db` and the backend will recreate a clean schema on the next launch.

---

## 📄 License

This project is licensed under the **MIT License** — you are free to modify, distribute, and use it for commercial and private projects.
