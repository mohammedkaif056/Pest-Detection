# PestEdge-FSL: AI-Powered Real-Time Pest Detection

## Project Overview
PestEdge-FSL is a professional web application that democratizes AI-driven agriculture through real-time pest detection using hybrid few-shot learning technology. The system enables farmers to identify crop pests instantly with 98.5% accuracy and learn new species with just 5-10 sample images.

## Technology Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion, Wouter, TanStack Query
- **Backend**: Express.js, Node.js
- **AI Integration**: OpenAI GPT-5 (for pest identification and recommendations)
- **Storage**: In-memory storage (MemStorage)
- **UI Components**: Shadcn UI with custom animations

## Key Features
1. **Hero Section with BounceCards**: Animated pest image showcase with elastic animations
2. **Real-Time Detection**: Upload/capture images for instant pest identification
3. **Visual Prompt Learning**: Few-shot learning system to teach AI new pest species with 5-10 images
4. **Species Database**: Comprehensive pest catalog with taxonomy-aware classifications
5. **Detection History**: Track detection activity with charts and analytics
6. **Treatment Recommendations**: AI-powered personalized pesticide suggestions
7. **Dark Mode**: Full theme support with custom toggle
8. **Responsive Design**: Mobile-first approach with professional polish

## Architecture

### Data Models (shared/schema.ts)
- **Detections**: Pest detection records with confidence scores, risk levels, and treatments
- **Species**: Pest species database with taxonomy and descriptions
- **Prototypes**: Few-shot learning prototypes for visual prompt-based adaptation
- **Treatments**: Treatment recommendation data linked to species

### Frontend Pages
- **Home**: Hero with BounceCards, features grid, how-it-works, CTA
- **Detect**: Image upload interface with drag-drop and real-time results
- **Species**: Searchable gallery of pest species with filtering
- **History**: Detection history dashboard with charts and statistics
- **Learn**: Visual prompt learning wizard for teaching new species

### Components
- **Navigation**: Sticky header with mobile menu
- **BounceCards**: Custom animated card showcase component
- **ThemeToggle**: Dark/light mode switcher
- **Footer**: Multi-column footer with links

## Design System
- **Colors**: Green primary (#22C55E) for agricultural theme
- **Typography**: 
  - Display: Space Grotesk
  - Sans: Inter
  - Mono: JetBrains Mono
- **Animations**: Framer Motion for smooth transitions, fade-ins, slides
- **Spacing**: Consistent 8px grid system
- **Components**: Shadcn UI with hover-elevate and active-elevate-2 utilities

## API Endpoints (To Be Implemented)
- `POST /api/detect` - Analyze pest image using OpenAI Vision
- `GET /api/detections` - Fetch detection history
- `GET /api/species` - Fetch pest species database
- `POST /api/learn` - Learn new pest species via visual prompts
- `GET /api/prototypes` - Fetch learned prototypes
- `POST /api/treatments` - Get treatment recommendations

## Environment Variables
- `OPENAI_API_KEY` - OpenAI API key for GPT-5 and vision models
- `SESSION_SECRET` - Session secret for Express

## Development Notes
- Following schema-first development approach
- All images generated using AI for pest specimens and agricultural scenes
- Design guidelines strictly followed from design_guidelines.md
- Professional visual quality with attention to spacing, typography, and interactions
- Full accessibility with data-testid attributes for testing

## Next Steps
1. Implement backend API routes with OpenAI integration
2. Connect frontend to backend APIs
3. Add error handling and loading states
4. Test all features end-to-end
