# 🚀 Focusly - Production SaaS Execution Workspace

**Force execution, not information storage.**

Focusly is a role-specialized execution system that converts notes into time-bound plans and tasks, enforces realistic execution limits, and provides behavioral feedback.

---

## 🎯 Product Overview

Focusly is **NOT** a note-taking app or generic productivity tool. It is an **opinionated execution workspace** designed to enforce action and prevent over-planning.

### Core Principles

1. **Notes must be resolved** - No orphan notes allowed
2. **Time capacity is enforced** - No unlimited task creation
3. **Execution-first** - Every feature drives completing work
4. **Role-specialized** - Student, Professional, and Business workflows
5. **Offline-first** - Full functionality without internet

---

## ✨ Features

### 1. **Role-Based Onboarding**
- User selects role: Student / Professional / Business
- Context-driven workspace generation
- Pre-configured areas and constraints

### 2. **Action-First Notes**
- Notes must be resolved within expiry period (default: 7 days)
- Resolution options:
  - Convert to task (AI-assisted)
  - Add to plan
  - Mark as reference
  - Discard

### 3. **Time-Aware Task Engine**
- Tasks require estimated duration
- Daily time capacity enforced (prevents over-planning)
- Automatic overload detection
- AI-powered rescheduling suggestions

### 4. **AI Decision Support**
- Convert notes → tasks with realistic estimates
- Generate project breakdowns
- Detect schedule overload
- Suggest daily focus priorities
- Weekly behavioral insights

### 5. **Focus Mode**
- Distraction-free single-task execution
- Built-in timer with progress tracking
- Queue management
- Actual vs estimated time tracking

### 6. **Weekly Execution Review**
- Completion rate analytics
- Time spent breakdown
- Role-specific metrics
- AI-generated insights
- Behavioral feedback

### 7. **Offline-First PWA**
- Full offline functionality
- IndexedDB persistence
- Background sync support
- Installable on all devices

---

## 🧑‍💼 Supported Roles

### 📚 Student
- Subject-based planning
- Exam countdown tracking
- Revision cycles
- Assignment management
- **Default capacity:** 6 hours/day

### 💼 Professional
- Project-based execution
- Deadline tracking
- Meeting → action extraction
- Professional development planning
- **Default capacity:** 8 hours/day

### 🚀 Business / Organizer
- Area-based organization
- Recurring operational tasks
- Bottleneck visibility
- Quarterly goal tracking
- **Default capacity:** 9 hours/day

---

## 🏗️ Architecture

### Tech Stack

- **Frontend:** React + Vite
- **State:** React Hooks
- **Storage:** IndexedDB (offline-first)
- **PWA:** Vite PWA Plugin
- **Styling:** Vanilla CSS with design system
- **AI:** Modular service layer (rule-based MVP)

### Project Structure

```
focusly/
├── src/
│   ├── components/          # React components
│   │   ├── Onboarding.jsx   # Role selection & setup
│   │   ├── Workspace.jsx    # Main workspace UI
│   │   ├── NotesView.jsx    # Note management
│   │   ├── TasksView.jsx    # Task management
│   │   ├── FocusMode.jsx    # Execution mode
│   │   └── WeeklyReview.jsx # Analytics & insights
│   ├── services/            # Business logic
│   │   ├── database.js      # IndexedDB operations
│   │   └── ai.js            # AI decision engine
│   ├── config/              # Configuration
│   │   └── roles.js         # Role definitions
│   ├── index.css            # Design system
│   ├── App.jsx              # Root component
│   └── main.jsx             # Entry point
├── public/                  # Static assets
├── vite.config.js           # Vite + PWA config
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### First Launch

1. Open the app (default: http://localhost:5173)
2. Select your role (Student/Professional/Business)
3. Answer context questions
4. Workspace auto-generated with starter content
5. Start executing!

---

## 💾 Data Storage

### IndexedDB Stores

- **workspaces** - Role-based execution environments
- **notes** - Temporary action-oriented captures
- **tasks** - Time-bound execution units
- **plans** - Structured task sequences
- **timeCapacity** - Daily execution limits
- **settings** - User preferences
- **executionHistory** - Performance tracking

### Offline Support

- All data stored locally in IndexedDB
- No server required for core functionality
- PWA allows installation and offline usage
- Future: Background sync for cloud backup

---

## 🤖 AI Features (Rule-Based MVP)

The AI service uses intelligent rules to:

1. **Analyze note content**
   - Extract keywords
   - Detect urgency
   - Estimate complexity

2. **Generate realistic estimates**
   - Role-specific duration calculations
   - Category-based adjustments
   - Complexity scoring

3. **Smart scheduling**
   - Find available capacity
   - Detect overload
   - Suggest rebalancing

4. **Behavioral insights**
   - Completion rate analysis
   - Time usage patterns
   - Execution velocity tracking

**Future:** Integration with actual AI APIs (OpenAI, Gemini, etc.)

---

## 🎨 Design System

### Color Palette

- **Background:** `#0a0a0a` (deep black)
- **Surface:** `#1e1e1e` (dark gray)
- **Brand Primary:** `#6366f1` (vibrant indigo)
- **Brand Secondary:** `#8b5cf6` (purple)
- **Success:** `#10b981` (green)
- **Warning:** `#f59e0b` (amber)
- **Error:** `#ef4444` (red)

### Typography

- **Primary Font:** Inter
- **Monospace Font:** JetBrains Mono
- **Sizes:** Fluid scale from 12px to 48px

### Components

- Buttons (primary, secondary, ghost, success, error)
- Cards (elevated, subtle)
- Inputs (text, textarea, select)
- Badges (role, priority, status)
- Progress bars
- Animations (fade-in, slide-in, pulse, spin)

---

## 🔒 System Constraints (Non-Negotiable)

1. **No blank pages** - Every workspace starts with content
2. **No unlimited tasks** - Time capacity enforced
3. **No orphan notes** - Notes must be resolved
4. **No skipping reviews** - Weekly reflection required
5. **Time capacity enforced** - Cannot over-commit

---

## 📊 Analytics & Metrics

### Universal Metrics
- Tasks completed
- Completion rate %
- Total time spent
- Average task duration

### Role-Specific Metrics

**Student:**
- Study hours per subject
- Exam readiness %
- Assignment completion rate

**Professional:**
- Project progress
- Deadlines met %
- Meeting vs execution time ratio

**Business:**
- Area time distribution
- Execution velocity
- Neglected areas detection

---

## 🚫 Hard Exclusions

- ❌ No collaboration features
- ❌ No social features
- ❌ No template marketplace
- ❌ No Notion-style blocks
- ❌ No free-form pages

These are **intentional** omissions to maintain focus on execution.

---

## 🛣️ Roadmap

### MVP (Current)
- ✅ Role-based onboarding
- ✅ Note → Task conversion
- ✅ Time capacity enforcement
- ✅ Focus mode
- ✅ Weekly review
- ✅ Offline-first PWA

### Phase 2
- [ ] Cloud sync (optional)
- [ ] Real AI integration (GPT-4, Gemini)
- [ ] Advanced analytics dashboard
- [ ] Mobile-specific optimizations
- [ ] Export functionality

### Phase 3
- [ ] Monetization (freemium model)
- [ ] Advanced AI coaching
- [ ] Habit tracking integration
- [ ] API for integrations

---

## 💰 Monetization Strategy

### Free Tier
- 1 workspace
- Basic AI features
- 100 tasks/month
- Local storage only

### Pro Tier ($9/month)
- Unlimited workspaces
- Advanced AI actions
- Unlimited tasks
- Cloud sync & backup
- Deep analytics
- Priority support

---

## 🧪 Testing

```bash
# Manual testing checklist
1. Complete onboarding for each role
2. Create notes and convert to tasks
3. Try to exceed time capacity (should block)
4. Complete tasks in focus mode
5. View weekly review
6. Test offline functionality
```

### Future: Automated Tests
- Unit tests for services
- Integration tests for workflows
- E2E tests for critical paths

---

## 🤝 Contributing

This is a production SaaS product. Contributions should:

1. Align with core philosophy (execution-first)
2. Not add complexity without clear value
3. Maintain offline-first architecture
4. Include proper documentation

---

## 📄 License

Proprietary - All rights reserved

---

## 🎓 Philosophy

Focusly is built on the belief that most productivity tools **enable procrastination** by allowing unlimited storage of "someday" items.

We enforce:
- **Temporal constraints** (notes expire, tasks have due dates)
- **Capacity limits** (you can't do infinite work)
- **Regular review** (reflection is mandatory)
- **Resolution forcing** (no permanent "inbox")

The goal is not to capture everything - it's to **execute what matters**.

---

## 📞 Support

For issues or questions:
- Check the console for error messages
- Clear browser data and try again
- Verify offline functionality is enabled

---

**Built with ⚡ by the Focusly team**

*Force execution. Stop planning. Start doing.*
