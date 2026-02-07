# v0.dev AI Prompts for LearningHub UI Prototypes

**Project**: LearningHub AI - Educational Platform for Grade 3 Students  
**Framework**: React with TypeScript, Tailwind CSS, shadcn/ui  
**Design System**: Material Design inspired, child-friendly  
**Generated**: January 23, 2026

---

## Prompt 1: Student Question Practice Screen

```
Create a child-friendly math question practice interface for a Grade 3 educational app. Design requirements:

LAYOUT & STRUCTURE:
- Full-screen immersive design optimized for tablets (768px width)
- Top progress bar showing "Question 3 of 10" with 80% visual progress indicator
- Main question card with rounded corners (24px radius) and soft shadow
- Large, touch-friendly answer buttons (minimum 80px height)
- Prominent "Submit Answer" button at the bottom

VISUAL DESIGN:
- Primary color: Bright blue (#2196F3) for actions and progress
- Success color: Green (#4CAF50) for correct states
- Error color: Soft red (#F44336) for incorrect states
- Card background: White with subtle gradient header (blue gradient from #2196F3 to #1976d2)
- Large, readable fonts: 24px for question text, 20px for answers
- Rounded sans-serif typography (system fonts)

QUESTION SECTION:
- Display question: "What is 15 + 7?"
- Optional visual aid area showing apple icons or number blocks
- Question text in large, bold typography with ample padding (32px)

ANSWER OPTIONS (Multiple Choice):
- 4 answer buttons in a 2x2 grid with 16px gaps
- Each button contains:
  - Letter badge (A, B, C, D) in a circular badge on the left
  - Answer number in large text (20, 21, 22, 23)
- Buttons have 3 states:
  - Default: White with blue outline (2px), subtle shadow
  - Selected: Blue background (#2196F3), white text, scale up slightly
  - Hover: Lift effect (4px shadow increase), subtle scale (1.02)
- Ripple effect on click

INTERACTIVE FEATURES:
- "Need Help?" button (outline style) in top right with lightbulb icon
- Progress bar animates smoothly when advancing
- All buttons have smooth transitions (300ms)
- Disabled state for submit button when no answer selected

ACCESSIBILITY:
- High contrast ratios (WCAG AA minimum)
- Large touch targets (60px minimum)
- Clear focus indicators (3px blue outline)
- Keyboard navigation support

Include React state management for:
- Selected answer index
- Current question number
- Progress percentage
- Show/hide help modal

Add smooth micro-interactions:
- Button press: scale(0.95) transform
- Progress bar: ease-in-out animation
- Card entry: fade-in + slide-up animation

Make it joyful and encouraging for 8-year-old learners!
```

---

## Prompt 2: Student Feedback Modal (Correct Answer)

```
Create a celebratory feedback modal for when a Grade 3 student answers a math question correctly. Design requirements:

MODAL STRUCTURE:
- Centered overlay modal (max-width: 600px)
- Rounded corners (24px radius)
- White background with success-themed left border (6px solid #4CAF50)
- Subtle backdrop blur effect
- Entry animation: scale from 0.8 to 1.0 with bounce easing

HEADER SECTION:
- Large animated checkmark icon (80px) in success green (#4CAF50)
- Icon animation: pop effect with bounce (starts at scale 0, bounces to scale 1.1, settles at 1)
- Title: "Excellent Work!" in 32px bold text, success green color
- Sparkle/star particle effects around the checkmark

CONTENT SECTION:
- Encouraging message: "You got it right! Great job!" (18px, gray-700)
- Explanation card with light background (#F8F9FA):
  - Header: "How to Solve It:" with lightbulb icon
  - Step-by-step explanation:
    "15 + 7 = 22

    Let's count: 15 → 16, 17, 18, 19, 20, 21, 22!

    You can also think: 15 + 5 = 20, then 20 + 2 = 22"
  - Use number line visualization or counting dots

ACHIEVEMENT SECTION:
- Horizontal flex row showing rewards:
  - Points earned: "🎖️ +10 points" badge (yellow background)
  - Streak indicator: "⚡ 3-day streak" badge (orange background)
- Badges have subtle shadow and rounded corners (12px)

FOOTER ACTIONS:
- Primary button: "Next Question →"
  - Full width on mobile, auto width on desktop
  - Green background (#4CAF50), white text
  - Large size (52px height, 20px padding horizontal)
  - Hover: Darken slightly, lift shadow
  - Icon: Right arrow

ANIMATIONS:
- Confetti particles falling from top (optional)
- Checkmark draws in with animation
- Content fades in sequentially (header → body → footer)
- All transitions: 400ms ease-out

MICRO-INTERACTIONS:
- Button hover: scale(1.03) + shadow increase
- Particle effects on mount
- Smooth modal close with fade-out

Make it feel celebratory and rewarding without being overwhelming!
```

---

## Prompt 3: Student Feedback Modal (Incorrect Answer)

```
Create a supportive, growth-mindset feedback modal for when a Grade 3 student answers incorrectly. Design requirements:

MODAL STRUCTURE:
- Centered modal (max-width: 600px)
- White background with orange left border (6px solid #FF9800) for "learning moment"
- Warm, encouraging tone - never discouraging

HEADER SECTION:
- Icon: Thoughtful emoji or lightbulb (60px) - NOT a red X
- Title: "Let's Try Again Together" or "Not quite yet!" in 28px
- Color: Warm orange (#FF9800), not harsh red

ANSWER COMPARISON:
- Two-column card showing:
  - Left: "Your Answer: 20" with neutral styling
  - Right: "Correct Answer: 22" in success green
- Card has light gray background (#F8F9FA)
- Clear visual separation between columns

EXPLANATION SECTION:
- Header: "💡 How to Solve It:" with lightbulb icon
- Step-by-step breakdown:
  "Let's break this down together:

  15 + 7 = ?

  Start with 15, then count up 7 more:
  15 → 16 → 17 → 18 → 19 → 20 → 21 → 22

  The answer is 22!"

- Visual aids:
  - Number line showing jumps from 15 to 22
  - OR finger counting illustration
  - OR dot/apple counting visualization

HINT SECTION (Progressive):
- First hint appears automatically:
  "💭 Hint: Try using your fingers or drawing dots to help count"
- Soft yellow background (#FFF9C4)
- Gentle, encouraging tone

ACTIONS:
- Two buttons:
  1. "Try Again" (outline style, gray) - returns to question
  2. "Continue" (primary blue) - moves forward
- Buttons side-by-side on desktop, stacked on mobile
- Equal importance (no visual hierarchy suggesting one is "better")

EMOTIONAL DESIGN:
- Warm color scheme (oranges, yellows, not reds)
- Encouraging language: "Almost there!", "Great effort!", "Learning is a journey!"
- Growth mindset: Emphasize that mistakes help us learn
- No timer pressure or score reduction

ACCESSIBILITY:
- Clear, simple language at Grade 3 reading level
- Option to read explanation aloud (speaker icon)
- Visual and text explanations together

Include:
- Smooth entry animation (fade + slide up)
- No harsh transitions
- Encouraging micro-animations (gentle pulse on hint)
- Allow retry without penalty

Make it feel like a supportive tutor, not a judgmental test!
```

---

## Prompt 4: Student Topic Selection Dashboard

```
Create a joyful topic selection screen for Grade 3 math students. Design requirements:

HEADER:
- Friendly greeting: "🎯 What do you want to learn today, [Student Name]?"
- Large, welcoming text (32px)
- Today's streak indicator: "🔥 5 days in a row! Keep going!"

TOPIC GRID:
- 2-column grid on tablet (4 columns on desktop)
- Gap between cards: 24px
- Each card represents a math topic

TOPIC CARD DESIGN:
- Tall card (200px height minimum)
- Rounded corners (16px)
- Soft shadow that lifts on hover
- White background with colored accent strip at top

Card Contents:
1. Large emoji icon (64px):
   - Numbers: 🔢
   - Addition: ➕
   - Subtraction: ➖
   - Multiplication: ✖️
   - Division: ➗

2. Topic name (24px, bold): "Addition"

3. Mastery stars (below title):
   - 3 stars showing progress: ⭐⭐⭐ (filled), ⭐⭐☆ (partial), ⭐☆☆ (beginning)
   - Gold stars (#FFC107) for earned
   - Gray (#E0E0E0) for unearned

4. Progress indicator:
   - Small text: "15/20 completed"
   - Thin progress bar (4px height)
   - Colored based on topic (blue, green, orange, purple)

5. Status badge (top-right corner):
   - "New!" (blue badge)
   - "Keep going!" (green badge)
   - "🔒 Locked" (gray badge with lock icon)

INTERACTION STATES:
- Default: Subtle shadow, scale(1)
- Hover: Lift shadow, scale(1.02), slight tilt (2deg)
- Active: Scale(0.98), reduced shadow
- Locked: Grayscale filter, reduced opacity (0.6)

LOCKED CARDS:
- Grayed out appearance
- Lock icon overlay
- Tooltip on hover: "Complete Addition to unlock!"
- Not clickable (cursor: not-allowed)

RECOMMENDED SECTION:
- Special "Recommended for You" card at top
- Highlighted with gradient border
- AI icon with text: "🤖 AI recommends: Practice Subtraction"
- Reasoning: "You're doing great with addition - ready for the next challenge!"

BOTTOM ACTIONS:
- "Continue where you left off" button (if session in progress)
- Shows last topic + question number: "Continue: Addition (Question 7/10)"
- Orange accent color (#FF9800)

ANIMATIONS:
- Cards fade in sequentially (stagger 50ms)
- Progress bars animate from 0 to current value
- Stars have gentle pulse animation when earned
- Hover effects smooth (300ms ease-out)

ACCESSIBILITY:
- Keyboard navigation with clear focus indicators
- Cards have ARIA labels: "Addition topic, 2 of 3 stars earned, 15 of 20 questions completed"
- Color-blind friendly (don't rely only on color)

Make it feel like a game selection screen - exciting and inviting!
```

---

## Prompt 5: Parent Dashboard Overview

```
Create a professional yet approachable parent dashboard for tracking child's learning progress. Design requirements:

LAYOUT:
- Clean, data-focused design
- Desktop-first (responsive to mobile)
- White background with subtle gray sections (#F8F9FA)

HEADER:
- Title: "📊 Emma's Learning Dashboard"
- Date range selector: "Last 7 days" dropdown
- Quick filter chips: "All Subjects", "Math Only", "This Week"

TOP METRICS ROW (3 Cards):
- Card 1: Questions Answered
  - Large number: "156" (48px, bold)
  - Label: "Questions answered" (14px, gray)
  - Trend indicator: "↗️ +23 from last week" (green)

- Card 2: Accuracy Rate
  - Large percentage: "87%" (48px, bold)
  - Label: "Overall accuracy"
  - Trend: "↗️ +5% improvement" (green)
  - Mini sparkline chart showing trend

- Card 3: Learning Streak
  - Large number: "🔥 5" (48px)
  - Label: "Days in a row"
  - Encouragement: "Great consistency!"

PERFORMANCE TREND CHART:
- Card title: "📈 Performance Over Time"
- Line chart showing:
  - X-axis: Last 4 weeks
  - Y-axis: Accuracy percentage (0-100%)
  - Two lines: Overall accuracy (blue) + Topic-specific (green)
  - Smooth curves, filled area under lines
  - Interactive tooltips on hover
  - Grid lines subtle (gray-200)

LEARNING FOCUS AREAS:
- Two-column section:

Left Column - "⚠️ Needs Practice":
- Red/orange accent
- List items:
  - "Multi-digit subtraction - 62% accuracy"
  - "Word problems - 68% accuracy"
- Each item has mini progress bar
- Click to drill into details

Right Column - "⭐ Strengths":
- Green accent
- List items:
  - "Single-digit addition - 95% accuracy"
  - "Number recognition - 100% accuracy"
- Checkmark icons
- Celebration micro-animation

AI INSIGHTS CARD:
- Prominent card with AI icon (🤖)
- Title: "AI-Powered Insights"
- Message in conversational tone:
  "Emma shows strong pattern recognition skills but tends to rush through word problems.

  💡 Suggestion: Encourage her to read the problem aloud before answering. This helps with comprehension and reduces careless mistakes.

  Her accuracy on word problems could improve from 68% to 80%+ with this strategy."

- "Learn More" link
- Soft blue background (#E3F2FD)

TOPIC BREAKDOWN TABLE:
- Clean, sortable data table
- Columns:
  - Topic name
  - Questions attempted
  - Accuracy %
  - Trend (↗️↘️→)
  - Action button ("Practice" or "Review")

- Rows:
  - Addition: 43/50 correct (86%) ↗️ +5%
  - Subtraction: 31/50 correct (62%) ↘️ -3%
  - Multiplication: 12/20 correct (60%) → 0%

- Color-coded accuracy:
  - 85%+: Green background
  - 70-84%: Yellow background
  - <70%: Orange background

- Hover row: Subtle highlight

BOTTOM ACTIONS:
- "View Detailed Report" button (primary blue)
- "Export Progress (PDF)" button (outline)
- "Schedule Review Session" button (outline)

DATA VISUALIZATIONS:
- Use Chart.js or Recharts for graphs
- Smooth animations on load
- Interactive tooltips
- Color-blind friendly palette:
  - Primary: #2196F3 (blue)
  - Success: #4CAF50 (green)
  - Warning: #FF9800 (orange)
  - Danger: #F44336 (red)

MICRO-INTERACTIONS:
- Cards have subtle hover lift
- Chart animates in on scroll
- Trend arrows have gentle pulse
- Tooltips fade in smoothly (200ms)

EMPTY STATES:
- If no data: Show encouraging message with illustration
- "Start tracking progress by completing your first practice session!"

ACCESSIBILITY:
- All charts have text alternatives
- Color + icon combinations (not color alone)
- Keyboard navigable
- Screen reader friendly labels

Make it feel like a professional analytics dashboard but approachable for non-technical parents!
```

---

## Prompt 6: Student Progress Report Card

```
Create a weekly progress summary screen shown to students after completing sessions. Design requirements:

CELEBRATION HEADER:
- Large congratulatory banner
- Animated trophy or star icon (100px)
- Headline: "Amazing Week, [Student Name]!" (36px, bold)
- Subtext: "Here's everything you accomplished" (18px)
- Confetti animation in background (subtle)

WEEKLY STATS (3 Visual Metrics):

1. Questions Solved:
   - Large circular progress indicator
   - Center number: "47 questions"
   - Surrounding ring shows completion (80% filled)
   - Color: Blue gradient
   - Icon: 🎯

2. Stars Earned:
   - Stack of gold stars animation
   - Number: "12 ⭐ stars earned"
   - Stars fall in from top on load
   - Color: Gold (#FFC107)
   - Icon: ⭐

3. Accuracy Score:
   - Gauge/speedometer visualization
   - Needle points to 85%
   - Color zones: Red (0-60%), Yellow (60-80%), Green (80-100%)
   - Label: "Great accuracy!"

ACHIEVEMENT UNLOCKS:
- Horizontal scrollable carousel
- Each achievement card:
  - Badge icon (64px)
  - Achievement name: "Math Star"
  - Description: "Solved 50 addition problems"
  - "New!" tag for recently earned
  - Shine/glitter effect on new achievements

SKILL PROGRESS BARS:
- List of practiced topics with visual progress:

  Addition
  [████████████████████] 95%
  "You're almost a master!"

  Subtraction
  [████████████░░░░░░░░] 62%
  "Keep practicing!"

  Multiplication
  [████░░░░░░░░░░░░░░░░] 20%
  "Just getting started!"

- Bars animate from 0 to current value
- Color-coded based on mastery level
- Encouraging text below each

BEST MOMENT HIGHLIGHT:
- Featured card showing:
  - "🏆 Your Best Moment This Week!"
  - Specific achievement: "Perfect score on 5 addition problems in a row!"
  - Illustration or animation
  - Date/time: "Tuesday, 3:45 PM"

NEXT WEEK PREVIEW:
- Card with forward-looking motivation
- "🎯 Next Week's Goals:"
  - "Complete 50 questions"
  - "Improve subtraction to 70%"
  - "Practice 5 days in a row"
- Each goal has checkbox (currently unchecked)

SHARING SECTION:
- "Share your progress!" button
- Options:
  - "Send to Parent" (email/in-app)
  - "Print certificate" (PDF)
- Optional: Fun shareable image generated

CALL TO ACTION:
- Large button: "Start Next Week's Learning! →"
- Gradient background (blue to purple)
- Pulsing animation
- Takes to topic selection

DESIGN ELEMENTS:
- Playful illustrations throughout
- Gradient backgrounds (subtle)
- Rounded corners everywhere (16px)
- Generous white space
- Celebration animations (confetti, sparkles)

ANIMATIONS:
- Progress bars count up from 0
- Numbers increment with animation
- Stars twinkle
- Cards fade in sequentially
- Smooth scrolling

EMOTIONAL DESIGN:
- Celebrate ALL progress (even small wins)
- Positive reinforcement throughout
- No negative language
- Growth mindset: "Keep growing!"

Make it feel like a game achievement screen - exciting and motivating!
```

---

## Prompt 7: Responsive Mobile Navigation

```
Create a mobile-friendly bottom navigation bar for the student app. Design requirements:

STRUCTURE:
- Fixed position at bottom of screen
- Full width, 70px height
- White background with subtle shadow on top
- Safe area padding for iOS devices

NAVIGATION ITEMS (5 Icons):

1. Home/Dashboard
   - Icon: 🏠 House
   - Label: "Home"
   - Active state: Blue (#2196F3)

2. Practice
   - Icon: 📝 Pencil/Book
   - Label: "Practice"
   - Active state: Green (#4CAF50)

3. Progress (Center - Featured)
   - Larger icon (60px vs 40px)
   - Raised circular button extending above navbar
   - Icon: 📊 Chart/Trophy
   - Label: "Progress"
   - Gradient background (blue to purple)
   - Slight shadow for elevation

4. Achievements
   - Icon: 🏆 Trophy
   - Label: "Rewards"
   - Badge showing unviewed achievements count
   - Active state: Gold (#FFC107)

5. Profile
   - Icon: 👤 Avatar
   - Label: "Me"
   - Shows student avatar/photo
   - Active state: Purple (#9C27B0)

INTERACTION STATES:
- Inactive: Gray icon (#9E9E9E), 12px label text
- Active: Colored icon, bold label, subtle scale up (1.1)
- Tap: Ripple effect from tap point, scale down (0.95) then up
- Disabled: 40% opacity, no interaction

CENTER BUTTON (Featured):
- Circular FAB extending above bar
- 60px diameter
- Gradient background
- Pulsing animation when achievements available
- Tap reveals radial menu of quick actions

VISUAL EFFECTS:
- Active indicator: Colored dot or bar above icon
- Smooth transition between states (200ms)
- Icons have subtle bounce on selection
- Haptic feedback on tap (mobile)

ACCESSIBILITY:
- Labels always visible (not icon-only)
- Large touch targets (minimum 48px)
- High contrast in active state
- Screen reader labels
- Keyboard navigation support

NOTIFICATION BADGES:
- Small red circle with number
- Position: Top-right of icon
- Max number: 9 (shows "9+" for more)
- Pulse animation when new

ANDROID/iOS ADAPTATIONS:
- Android: Material Design ripple effect
- iOS: Subtle scale animation, blur effect
- Respect system safe areas
- Platform-appropriate shadows

DARK MODE SUPPORT:
- Dark background (#212121)
- Icons remain vibrant
- Subtle glow effect on active items

Make it feel native and intuitive for young users on tablets!
```

---

## Prompt 8: AI-Generated Question Preview

```
Create a question preview/editor interface for parents to review AI-generated questions. Design requirements:

LAYOUT:
- Split screen design (desktop)
- Left: Question preview (60%)
- Right: AI metadata panel (40%)

QUESTION PREVIEW PANEL:
- Shows exactly how student will see it
- Card design matching student interface
- Question text: "What is 15 + 7?"
- Answer options displayed (A: 20, B: 21, C: 22, D: 23)
- "Preview Mode" banner at top
- Toggle: "View as Student" / "View as Parent"

AI METADATA PANEL:

1. Generation Details:
   - Curriculum aligned: "New Zealand Math Level 2"
   - Topic: "Addition > Two-digit numbers"
   - Difficulty: "Grade 3 - Medium"
   - Skills tested: "Basic addition, mental math"

2. AI Confidence Score:
   - Visual gauge: 92% confidence
   - Color: Green (high), Yellow (medium), Orange (low)
   - Explanation: "High confidence - aligned with curriculum standards"

3. Solution Breakdown:
   - Step-by-step AI-generated solution
   - "How AI solved this:"
   - Shows working:
     "15 + 7
     = 15 + 5 + 2
     = 20 + 2
     = 22"
   - Explanation methodology shown

4. Alternative Answers Considered:
   - Why distractor answers were chosen:
     - 20: "Common error: 15 + 5"
     - 21: "Off by one error"
     - 23: "Addition overflow"
   - Shows AI's pedagogical reasoning

5. Quality Indicators:
   - ✓ Curriculum aligned
   - ✓ Age-appropriate language
   - ✓ Clear solution path
   - ⚠️ May need visual aid
   - Checklist-style display

PARENT ACTIONS:
- "Approve Question" button (green)
- "Request Regeneration" button (orange)
  - Opens modal: "What should be different?"
  - Options: Difficulty, wording, topic focus

- "Edit Question" button (blue)
  - Allows manual text editing
  - Warning: "This will override AI generation"

- "Flag for Review" button (red, outline)
  - Sends to quality review queue
  - Optional feedback field

COMPARISON VIEW:
- Toggle: "Compare to similar questions"
- Shows 3 similar questions side-by-side
- Highlights differences
- Shows why this question was selected

TRANSPARENCY SECTION:
- "🤖 How AI Created This"
- Expandable accordion showing:
  - Prompt used
  - Model: "Llama 3.1 70B"
  - Generation time: "1.2s"
  - Refinement iterations: "2"
  - Safety checks passed: "5/5"

USAGE ANALYTICS:
- "Question Performance" section:
- If question already used:
  - Times presented: 47
  - Accuracy rate: 68%
  - Average time: 45 seconds
  - Common wrong answer: "20 (40% selected)"

- Not yet used: "Preview - not yet presented to students"

VISUAL DESIGN:
- Professional, data-focused
- Clean typography (Inter font family)
- Generous spacing
- Color-coded sections
- Icons for visual hierarchy

INTERACTIONS:
- Smooth panel transitions
- Expandable sections
- Tooltip explanations on hover
- Copy-to-clipboard for prompts
- Export question as PDF

Make it feel transparent and trustworthy - parents can see exactly how AI works!
```

---

## Implementation Guide for v0.dev

### How to Use These Prompts:

1. **Copy entire prompt** including all requirements
2. **Paste into v0.dev** chat interface
3. **Specify framework** if needed: "Use React with TypeScript and Tailwind CSS"
4. **Iterate**: Ask for specific changes after initial generation
5. **Export code**: Download and integrate into your Angular app (adapt as needed)

### Key Modifications for Angular + MDB 5:

After generating with v0.dev, you'll need to:

- Replace React components with Angular components
- Swap Tailwind classes with MDB 5 utility classes
- Convert `useState` to Angular component properties
- Replace JSX event handlers with Angular event binding
- Use MDB 5 components (`<mdb-card>`, `<mdb-btn>`, etc.)

### Recommended Iteration Prompts:

```
"Make the buttons larger for touch devices"
"Add more spacing between elements"
"Increase font size for better readability"
"Add smooth animation when cards appear"
"Make colors more vibrant and child-friendly"
"Add loading states for all interactive elements"
"Include empty state designs"
"Show error handling for API failures"
```

### Component Priority Order:

1. **Start with**: Question Practice Screen (most critical)
2. **Then build**: Feedback Modals (core learning loop)
3. **Next**: Topic Selection (navigation)
4. **Then**: Parent Dashboard (analytics)
5. **Finally**: Advanced features (progress reports, AI transparency)

---

## Design Tokens Reference

```css
/* Colors */
--color-primary: #2196f3;
--color-primary-dark: #1976d2;
--color-success: #4caf50;
--color-warning: #ff9800;
--color-error: #f44336;
--color-info: #00bcd4;

/* Spacing */
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;

/* Typography */
--font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-size-xs: 12px;
--font-size-sm: 14px;
--font-size-md: 16px;
--font-size-lg: 20px;
--font-size-xl: 24px;
--font-size-2xl: 32px;

/* Border Radius */
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 24px;
--radius-full: 9999px;

/* Shadows */
--shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.1);
--shadow-md: 0 4px 8px rgba(0, 0, 0, 0.12);
--shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.15);

/* Transitions */
--transition-fast: 150ms ease-out;
--transition-base: 300ms ease-out;
--transition-slow: 500ms ease-out;
```

---

**Ready to create amazing learning experiences! 🚀**

_Tip: Start with one component, test with real users (especially kids!), then iterate based on feedback before building all screens._
