# Design Guidelines: PestEdge-FSL AI Pest Detection Platform

## Design Approach

**Reference-Based Approach**: Drawing inspiration from Linear's clean SaaS aesthetic, Notion's content organization, and modern AI platforms (OpenAI, Midjourney) that showcase technical capability with elegance. The design emphasizes technological sophistication while maintaining accessibility for agricultural users.

**Key Design Principles**:
- Scientific precision meets agricultural accessibility
- Visual storytelling of AI technology through imagery and animations
- Trust-building through professional polish and clear information hierarchy
- Instant comprehension of complex AI concepts through visual design

---

## Typography System

**Font Families** (Google Fonts CDN):
- **Primary**: Inter (400, 500, 600, 700) - All UI, body text, navigation
- **Display**: Space Grotesk (500, 700) - Hero headlines, section headers
- **Monospace**: JetBrains Mono (400, 500) - Technical data, accuracy percentages, metrics

**Hierarchy**:
- Hero Headline: Space Grotesk 700, 4xl to 6xl (responsive)
- Section Headers: Space Grotesk 700, 3xl to 4xl
- Subsection Titles: Inter 600, xl to 2xl
- Body Text: Inter 400, base to lg
- Captions/Metadata: Inter 500, sm to base
- Technical Labels: JetBrains Mono 500, sm

---

## Layout System

**Spacing Primitives**: Consistent use of Tailwind units 2, 4, 8, 12, 16, 20, 24, 32 for all spacing
- Micro spacing: 2, 4 (between related elements)
- Component padding: 8, 12, 16
- Section padding: 20, 24, 32 (responsive)
- Major separations: 32+ 

**Container Strategy**:
- Full-width sections with inner max-w-7xl for most content
- Hero and feature showcases: Full-bleed with max-w-6xl inner content
- Text-heavy sections: max-w-4xl for readability

---

## Homepage Structure (7-8 Sections)

### 1. Hero Section (80vh)
- **Layout**: Asymmetric split - 60% visual showcase, 40% content on desktop
- **Left**: Animated BounceCards component showing pest detection in action (5 cards with real pest images, staggered elastic animation)
- **Right**: Headline, subheadline, dual CTA buttons (primary + secondary), trust indicator ("98.5% accuracy • Works offline")
- **Background**: Subtle gradient overlay, blurred agricultural field video (low opacity, slow pan)

### 2. Real-Time Detection Demo (Full viewport)
- **Layout**: Centered demo interface (max-w-4xl)
- **Components**: 
  - Large upload zone with drag-and-drop (rounded-3xl, border-dashed)
  - Live detection results card appearing with slide-up animation
  - Confidence meter visualization
  - Side panel with similar species thumbnails (3-column grid)

### 3. AI Technology Showcase (2-column on desktop)
- **Left Column**: Video demonstration of visual prompt learning (upload 5 images → instant learning animation)
- **Right Column**: 
  - Feature list with icon bullets (Heroicons)
  - Technical specs in cards (model size, inference time, accuracy)
  - Each spec animates in on scroll

### 4. How It Works (3-step horizontal flow)
- **Layout**: 3-column grid, connected with animated dotted lines
- **Cards**: Icon → Title → Description → Supporting image
- Step 1: Upload/Camera | Step 2: AI Analysis | Step 3: Actionable Results
- Stagger animations as user scrolls

### 5. Features Grid (3-column on desktop, 1 on mobile)
- **Cards**: 6 feature cards with hover lift effect
- Icon (top) → Title → Description → "Learn more" link
- Features: Few-shot learning, Offline detection, Local adaptation, Privacy-first, Treatment recommendations, History tracking

### 6. Impact Statistics (4-column metrics bar)
- **Layout**: Full-width section with semi-transparent background
- **Content**: Large numbers (JetBrains Mono) with labels
- Metrics: "98.5% Accuracy", "<500ms Detection", "20MB Model", "10,000+ Species"
- Counter animations on scroll

### 7. Pest Species Gallery Preview
- **Layout**: Masonry grid (3-4 columns) showing diverse pest thumbnails
- **Interaction**: Hover reveals species name overlay
- CTA to "Explore Full Database" button centered below

### 8. Final CTA + Footer
- **CTA Section**: Centered headline + description + email signup form (inline)
- **Footer**: 4-column layout
  - About + Mission
  - Quick Links (Documentation, API, Research Paper)
  - Resources (Datasets, Model Downloads)
  - Contact + Social (icons from Heroicons)

---

## Core Components Library

### Cards
- Default: rounded-2xl, backdrop-blur-sm effect
- Feature cards: p-8, subtle border
- Detection result cards: rounded-3xl, with shadow-2xl

### Buttons
- Primary CTA: rounded-full, px-8 py-4, font-semibold
- Secondary: rounded-full, px-8 py-4, border variant
- Ghost links: underline-offset-4 on hover

### Form Elements
- Upload zone: rounded-3xl, border-2 border-dashed, min-h-64
- Input fields: rounded-xl, px-4 py-3
- File upload button: rounded-full with icon (camera or upload)

### Navigation
- Sticky header with backdrop-blur
- Logo + Nav links + CTA button
- Mobile: Hamburger → slide-in drawer

### Data Displays
- Confidence meter: Horizontal progress bar with percentage label
- Accuracy chart: Simple line visualization (can use recharts library)
- History timeline: Vertical cards with connecting line

### Modals/Overlays
- Detection results: Slide-up panel (bottom sheet on mobile)
- Species detail: Full-screen modal with close button
- Prompt learning wizard: Multi-step modal with progress indicator

---

## Animation Strategy (Minimal, Purposeful)

**Hero Animations**:
- BounceCards: Elastic.out stagger effect (provided code)
- Background video: Subtle parallax on scroll (0.5x speed)

**Scroll Animations**:
- Fade-in-up for section headers (intersection observer)
- Stagger-in for feature cards (0.1s delay between)
- Counter animations for statistics (count-up effect)

**Interaction Animations**:
- Card hover: translate-y lift (4-8px)
- Button hover: scale(1.05) + brightness
- Image upload: Pulse effect on drag-over
- Detection result: Slide-up reveal (300ms ease-out)

**Performance**: All animations use CSS transforms (translate, scale) and opacity only - no layout thrashing

---

## Images Section

**Required Images**:
1. **Hero BounceCards**: 5 high-quality pest images (close-ups, varied species) - grayscale or desaturated aesthetic
2. **Hero Background**: Agricultural field video or cinematic still (blurred, low opacity overlay)
3. **Detection Demo**: Sample pest images for upload demonstration
4. **Technology Showcase**: Screenshot/mockup of visual prompt learning interface
5. **How It Works**: 3 supporting illustrations/images showing upload → analysis → results flow
6. **Species Gallery**: 12-20 diverse pest thumbnails for preview grid
7. **Impact Section**: Optional abstract tech/agriculture imagery as background

**Image Treatment**:
- Hero images: Contained within BounceCards with subtle shadow
- Demo images: Sharp, well-lit pest photos with clean backgrounds
- Background imagery: Heavily blurred (blur-3xl), reduced opacity
- Gallery thumbnails: Consistent aspect ratio (square), rounded corners

**Icon Library**: Heroicons (via CDN) for all interface icons - camera, upload, check, x, menu, search, filter

---

## Responsive Behavior

**Breakpoints**: Standard Tailwind (sm: 640px, md: 768px, lg: 1024px, xl: 1280px)
- **Mobile (<768px)**: Single column, stack all multi-column layouts, BounceCards reduce to 3 visible
- **Tablet (768-1024px)**: 2-column grids, reduced spacing (py-16 vs py-24)
- **Desktop (1024px+)**: Full 3-4 column grids, maximum spacing, parallax effects enabled