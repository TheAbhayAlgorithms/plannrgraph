# StudyFlow Planner 🎓⚡

**StudyFlow Planner** is an all-in-one, fully editable daily-routine, study, project, and progress tracker built with modern client-side web technologies to replace complex Excel workbooks with a frictionless, responsive, and aesthetically stunning user experience.

---

## 🚀 Key Features & Modules

- **Module 0: Foundation & Core Layout**: Clean mobile-first layout with desktop sidebar, mobile bottom navigation, keyboard shortcuts, light/dark mode, and persistent state.
- **Module 1: Daily Tracker Grid & Interactive Cells**: Dual-view tracker (matrix table and daily checklist), status transitions (`done`, `missed`, `pending`), custom date-range cell hints, bulk actions, and next-day rollover.
- **Module 2: Daily Routine Manager**: Split weekday/weekend timelines, visual overlap conflict detection, linked tasks, drag-and-drop reordering, and routine time distribution calculations.
- **Module 3: Custom Task & Habit Manager**: Categorized habits, custom color palettes, active toggles, study/research flags, and drag-and-drop template ordering.
- **Module 4: Academic Subjects & Topics Checklist**: Subject timelines, target deadlines, 3-point study checklist (Video, Code, Written), and test description tracking.
- **Module 5: Study Plan & Timetable**: Dynamic date-range timeline with automated subject distribution, study block weightings, and daily topic breakdown.
- **Module 6: Projects, Milestones & Assignments**: Timeline-based milestones, assignment kanban/table with priority tags, status management, and countdown deadlines.
- **Module 7: Research Log**: Dedicated research session recorder with hours tracking, study goal integration, and notes.
- **Module 8: Analytics Dashboard & Progress Visualizations**: Comprehensive analytics with completion rates, strong-day badges (≥80%), streak counters, Recharts study trend graphs, and subject distribution charts.
- **Module 9: Toast System & Micro-Interactions**: Stacked animated toast alerts across 4 notification levels (`success`, `info`, `warning`, `error`).
- **Module 10: Global Filters, Search & Saved Views**: Deep URL search query synchronization (`?subject=...&status=...`), multi-faceted filter drawer, and persistent named views (e.g. *"All Missed Tasks"*).
- **Module 11: Settings, Data Backup & Plan Setup**:
  - Full state JSON export and schema-validated restore.
  - Multi-sheet Excel (`.xlsx`) and RFC 4180 UTF-8 CSV exports.
  - 3-step Plan Setup Wizard.
  - 20-action Undo/Redo engine (`Ctrl/Cmd+Z`, `Ctrl/Cmd+Y`).
  - Safeguarded Danger Zone ("CLEAR" text confirmation guard).
- **Module 12: Polish, PWA, Notifications & Delivery**:
  - Offline-first Progressive Web App with Service Worker (`sw.js`) and Web Manifest.
  - Optional browser desktop notifications for routine slots with slot-level toggles.
  - Synthesized Web Audio API harmonic chime (no external audio files needed).
  - Accessibility pass: WCAG AA contrast, keyboard navigation, focus rings, skip-to-content link, and ARIA landmarks.
  - Optimized Vite chunk-splitting for high-speed bundle loading.

---

## 🛠️ Technology Stack

- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with rich custom dark theme (`#090d16`)
- **State Management**: Zustand with `persist` middleware and schema versioning
- **Drag & Drop**: `@dnd-kit/core` & `@dnd-kit/sortable`
- **Charts**: Recharts
- **Date Utilities**: `date-fns` & custom time calculations
- **Spreadsheets**: `xlsx` (Excel export) & UTF-8 BOM CSV generators
- **Icons**: Lucide React
- **Testing**: Vitest (94 unit & integration tests)

---

## 📦 Getting Started

### 1. Prerequisites
- Node.js 18+ (tested on Node 20 & 26)
- npm or yarn

### 2. Installation
```bash
git clone <repository-url>
cd planner
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your browser.

---

## 📜 Available Scripts

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Starts Vite dev server with Hot Module Replacement (HMR) |
| `npm test` | Runs the full Vitest suite (94 tests across 14 suites) |
| `npm run lint` | Runs `tsc --noEmit` type checking |
| `npm run build` | Compiles TypeScript and creates optimized production bundle in `dist/` |
| `npm run preview` | Previews the production build locally |

---

## 🗄️ Data Model & LocalStorage Schema

All planner data is stored in the browser's `localStorage` under the key `studyflow-planner-storage` with schema versioning:

```ts
interface PlannerData {
  schemaVersion: number;
  settings: {
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    theme: 'light' | 'dark' | 'system';
    studyHoursWeekday: number; // default 2
    studyHoursWeekend: number; // default 8
    researchHoursPerSession: number; // default 2
    strongDayThreshold: number; // default 80%
    weekStartsOn: 0 | 1; // 0 = Sunday, 1 = Monday
    notificationsEnabled?: boolean;
    soundEnabled?: boolean;
  };
  categories: Category[];
  taskTemplates: TaskTemplate[];
  routineSlots: RoutineSlot[];
  subjects: Subject[];
  topics: Topic[];
  dayPlans: Record<string, DayPlan>; // Keyed by 'YYYY-MM-DD'
  milestones: Milestone[];
  assignments: Assignment[];
  researchEntries: ResearchEntry[];
  savedViews: SavedView[];
}
```

---

## 🌐 Deployment Guide

### Deploy to Vercel
1. Install Vercel CLI or link through [vercel.com](https://vercel.com/):
   ```bash
   npm i -g vercel
   vercel
   ```
2. Build command: `npm run build`
3. Output directory: `dist`
4. The project includes `vercel.json` with SPA route rewrites to avoid 404s on browser refresh.

### Deploy to Netlify
1. Connect repository in [netlify.com](https://netlify.com/) or install Netlify CLI:
   ```bash
   npm i -g netlify-cli
   netlify deploy --prod
   ```
2. Build command: `npm run build`
3. Publish directory: `dist`
4. The project includes `public/_redirects` (`/* /index.html 200`) ensuring client-side routes resolve properly.

### Deploy to GitHub Pages
1. In `vite.config.ts`, set the `base` property to your repository name:
   ```ts
   export default defineConfig({
     base: '/<repo-name>/',
     // ...
   });
   ```
2. Install `gh-pages`:
   ```bash
   npm install --save-dev gh-pages
   ```
3. Add deployment scripts to `package.json`:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```
4. Run `npm run deploy`.

---

## ♿ Accessibility & Keyboard Shortcuts

- **Skip to Content**: Press `Tab` on first load to jump straight to `#main-content`.
- **Global Undo**: `Ctrl + Z` or `Cmd + Z`
- **Global Redo**: `Ctrl + Y` or `Cmd + Shift + Z`
- **Focus Rings**: High-visibility focus indicators across all buttons and inputs.
- **Screen Reader Support**: Semantic HTML5 elements (`<header>`, `<main>`, `<nav>`, `<aside>`) with explicit `aria-label` tags.

---

## 📄 License
MIT License. Built for students and lifelong learners.
