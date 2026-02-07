# LearningHub AI - Complete UI Screens Catalog

**Document Version:** 1.0  
**Created:** January 24, 2026  
**Purpose:** Comprehensive screen/page specifications for Angular component implementation  
**Technology Stack:** Angular 20.x, Angular MDB 5, Bootstrap 5, TypeScript  
**Target Applications:** Student App, Parent App

---

## Table of Contents

1. [Student Application Screens](#1-student-application-screens)
2. [Parent Application Screens](#2-parent-application-screens)
3. [Shared/Common Screens](#3-sharedcommon-screens)
4. [Screen Flow Diagrams](#4-screen-flow-diagrams)
5. [Implementation Priority Matrix](#5-implementation-priority-matrix)
6. [Technical Components Mapping](#6-technical-components-mapping)

---

## 1. Student Application Screens

### 1.1 Authentication & Onboarding

#### S1.1.1 Student Login Screen

**Route:** `/login`  
**Priority:** P0 (Critical - MVP Phase 1)  
**User Story Reference:** US-AUTH-001

**Purpose:**  
Secure student authentication with child-friendly interface.

**Key Features:**

- Large, colorful avatar selection grid
- PIN/password input with virtual keypad
- "Remember me" option
- Parent override link for password recovery
- Welcome animation on successful login

**MDB 5 Components:**

- `<mdb-card>` for login container
- `<mdb-form>` for input fields
- `<mdb-btn>` for submit action
- `<mdb-modal>` for help/support

**Data Requirements:**

- Student profiles (name, avatar, credentials)
- Authentication token management
- Session persistence

**Acceptance Criteria:**

- Login completes in <2 seconds
- Clear error messages for invalid credentials
- Accessible via keyboard navigation
- Touch-optimized for tablets (60px minimum tap targets)

**Angular Component Structure:**

```typescript
student-login/
  ├── student-login.component.ts
  ├── student-login.component.html
  ├── student-login.component.scss
  └── student-login.component.spec.ts
```

**API Integration:**

- POST `/api/auth/student/login`
- GET `/api/students/avatars`

---

#### S1.1.2 Welcome & Onboarding Screen

**Route:** `/welcome`  
**Priority:** P1 (High - MVP Phase 1)  
**User Story Reference:** US-ONBOARD-001

**Purpose:**  
First-time user onboarding with skill assessment and platform introduction.

**Key Features:**

- Animated welcome sequence with friendly mascot
- Interactive tutorial (skippable)
- Quick skill assessment (5 questions)
- AI-powered level recommendation
- Goal setting (daily practice minutes)
- Avatar customization

**Screen Flow:**

1. Welcome animation (3s)
2. "How to use LearningHub" tutorial (optional)
3. Skill assessment quiz
4. Level placement results
5. Daily goal selection
6. Ready to start screen

**MDB 5 Components:**

- `<mdb-carousel>` for tutorial slides
- `<mdb-stepper>` for onboarding steps
- `<mdb-progress>` for assessment progress
- `<mdb-modal>` for skill results

**Data Requirements:**

- Assessment questions (curriculum-aligned)
- Student preferences (goals, settings)
- Initial skill level determination

**Acceptance Criteria:**

- Entire onboarding completes in 5-7 minutes
- Can skip and return later
- Assessment accurately places student (±1 grade level)
- Saves progress if interrupted

---

### 1.2 Main Dashboard & Navigation

#### S1.2.1 Student Dashboard (Home)

**Route:** `/dashboard` or `/home`  
**Priority:** P0 (Critical - MVP Phase 1)  
**User Story Reference:** US-SI-001

**Purpose:**  
Central hub for student learning journey with personalized recommendations.

**Key Features:**

- **Header Section:**
  - Personalized greeting: "Welcome back, Emma! 👋"
  - Current streak indicator: "🔥 5 days streak!"
  - Daily goal progress: "15/30 minutes today"
- **Quick Actions Card:**
  - "Continue Learning" button (last topic)
  - "Start New Topic" button
  - "View Achievements" button
- **Today's Recommended Topics:**
  - AI-suggested 3 topics based on:
    - Recent performance patterns
    - Curriculum progression
    - Time since last practice
  - Visual cards with topic icons and mastery stars
- **Progress Summary:**
  - Weekly question count
  - Accuracy trend (mini chart)
  - Recent achievements carousel
- **Motivation Section:**
  - Daily inspirational quote
  - Next achievement preview
  - Friend activity (future: social features)

**Layout Structure:**

```
┌─────────────────────────────────────┐
│ Header: Welcome + Streak + Goal     │
├─────────────────────────────────────┤
│ Quick Actions (3 large buttons)     │
├─────────────────────────────────────┤
│ Recommended For You (3 topic cards) │
├─────────────────────────────────────┤
│ This Week's Progress (chart)        │
├─────────────────────────────────────┤
│ Recent Achievements (carousel)      │
└─────────────────────────────────────┘
```

**MDB 5 Components:**

- `<mdb-card>` for section containers
- `<mdb-progress>` for goal visualization
- `<mdb-carousel>` for achievements
- `<mdb-chart>` for mini progress chart
- `<mdb-badge>` for streaks and notifications

**State Management:**

- Current student profile
- Daily/weekly progress data
- Recommended topics (AI-generated)
- Recent sessions data
- Achievement notifications

**API Integration:**

- GET `/api/students/{id}/dashboard`
- GET `/api/students/{id}/recommendations`
- GET `/api/students/{id}/progress/summary`

**Acceptance Criteria:**

- Loads in <1 second
- Recommendations update based on latest session
- Responsive: tablet portrait (primary), desktop (secondary)
- Smooth transitions between sections
- Offline-capable (cached data)

---

#### S1.2.2 Topic Selection Screen

**Route:** `/topics`  
**Priority:** P0 (Critical - MVP Phase 1)  
**User Story Reference:** US-SI-003

**Purpose:**  
Browse and select math topics for practice with clear mastery indicators.

**Key Features:**

- **Subject Header:**

  - Subject selector: "Mathematics 📐" (future: multi-subject)
  - Grade level indicator: "Grade 3"
  - Filter options: "All Topics", "In Progress", "Mastered", "Locked"

- **Topic Grid (2-column on tablet, 4-column on desktop):**
  - Each topic card shows:
    - Large emoji icon (🔢, ➕, ➖, ✖️, ➗)
    - Topic name (e.g., "Addition")
    - Mastery stars (0-3 stars): ⭐⭐⭐, ⭐⭐☆, ⭐☆☆
    - Progress bar: "15/20 completed"
    - Status badge: "New!", "Keep going!", "🔒 Locked"
    - Difficulty indicator: Easy, Medium, Hard
- **Topic Organization:**

  - Curriculum-aligned ordering
  - Progressive unlocking (complete prerequisite first)
  - Visual hierarchy (active > available > locked)

- **Recommended Section:**
  - Special highlighted card: "🤖 AI Recommends"
  - Reasoning: "You're ready for multiplication!"
  - Data-driven based on recent performance

**Card States:**

- **Active:** Full color, hover effects, clickable
- **Locked:** Grayscale, lock icon, tooltip with unlock conditions
- **Completed:** Green checkmark, star badges filled
- **In Progress:** Partially filled progress bar, orange accent

**MDB 5 Components:**

- `<mdb-card>` for topic cards
- `<mdb-progress>` for completion indicators
- `<mdb-badge>` for status labels
- `<mdb-tooltip>` for locked state explanations
- `<mdb-tabs>` for subject switching (future)

**Interactions:**

- **Hover:** Card lifts with shadow, subtle scale (1.02)
- **Click:** Ripple effect, navigate to practice session
- **Locked Click:** Shake animation, show unlock tooltip

**Data Requirements:**

- Topic list with curriculum alignment
- Student progress per topic (completion %, accuracy)
- Prerequisite relationships
- AI recommendations

**API Integration:**

- GET `/api/topics?subject=mathematics&grade=3`
- GET `/api/students/{id}/progress/topics`
- GET `/api/students/{id}/recommendations/topics`

**Acceptance Criteria:**

- Topics load within 500ms
- Clear visual distinction between states
- Locked topics show helpful unlock messages
- Smooth card animations (<300ms)
- Keyboard navigation support

---

### 1.3 Learning & Practice

#### S1.3.1 Question Practice Screen

**Route:** `/practice/:topicId`  
**Priority:** P0 (Critical - MVP Phase 1)  
**User Story Reference:** US-QG-001, US-SI-001

**Purpose:**  
Core learning interface where students answer AI-generated questions.

**Key Features:**

**1. Progress Header:**

- Question counter: "Question 3 of 10"
- Visual progress bar (animated)
- Topic name badge: "Addition"
- Timer (optional, hidden by default)
- Help button (hints)
- Exit/pause button

**2. Question Card:**

- **Question Text:** Large, readable (24px+)
  - "What is 15 + 7?"
  - Optional read-aloud button 🔊
- **Visual Aid Section (conditional):**
  - Number line visualization
  - Counting objects (apples, blocks)
  - Diagrams for geometry
  - Interactive manipulatives
- **Answer Input Area:**

  - **Multiple Choice:**

    - 4 large buttons (2x2 grid)
    - Letter badges (A, B, C, D)
    - Answer text
    - Selection state (blue highlight)

  - **Numeric Input:**

    - Large text input field (read-only)
    - Virtual number keypad
    - Backspace/clear buttons

  - **Fill in the Blank:**

    - Inline text inputs
    - Draggable word/number chips

  - **True/False:**
    - Two large buttons with icons

**3. Action Buttons:**

- **Submit Answer:** Primary green button, disabled until answer selected
- **Need Help?:** Secondary outline button, shows progressive hints
- **Skip Question:** Text link (tracked but allowed)

**4. Hint System (Progressive):**

- Hint 1: General strategy ("Try counting on your fingers")
- Hint 2: Specific guidance ("Start with 15, add 7 more")
- Hint 3: Visual demonstration (show number line)
- Final: Show solution step-by-step

**Screen States:**

- **Loading:** Question generation in progress (skeleton loader)
- **Active:** Student can interact with question
- **Submitted:** Answer sent, awaiting feedback
- **Review:** After feedback, can proceed to next

**MDB 5 Components:**

- `<mdb-card>` for question container
- `<mdb-progress>` for session progress
- `<mdb-btn>` for answer options and actions
- `<mdb-form-control>` for numeric input
- `<mdb-modal>` for hints overlay
- `<mdb-tooltip>` for read-aloud feature

**Animations:**

- Question card: Slide in from right
- Answer selection: Scale + ripple effect
- Progress bar: Smooth fill animation
- Submit button: Pulse when ready

**Data Requirements:**

- Current question object (text, type, options, correct answer)
- Session state (question index, answers given)
- Hint progression tracking
- Time tracking (optional analytics)

**API Integration:**

- GET `/api/practice/sessions/{sessionId}/questions/{index}`
- POST `/api/practice/sessions/{sessionId}/answers`
- GET `/api/practice/questions/{id}/hints`

**Accessibility:**

- Text-to-speech for all questions
- Keyboard navigation (Tab, Enter, Arrow keys)
- High contrast mode support
- Focus indicators (3px blue outline)
- Dyslexia-friendly font option

**Acceptance Criteria:**

- Question loads in <2 seconds
- Answer submission processes in <2 seconds
- Touch targets ≥60px for children
- Works offline (pre-loaded questions)
- Auto-save progress every answer
- Graceful error handling

---

#### S1.3.2 Feedback Modal - Correct Answer

**Route:** Modal overlay on `/practice/:topicId`  
**Priority:** P0 (Critical - MVP Phase 1)  
**User Story Reference:** US-EV-001

**Purpose:**  
Celebrate correct answers with encouraging feedback and learning reinforcement.

**Key Features:**

**1. Celebration Header:**

- Animated checkmark icon (✓) with bounce effect
- Confetti particle animation (subtle)
- Success sound effect (optional, user-toggle)
- Title: "Excellent Work!", "Amazing!", "You Got It!" (randomized)
- Green color theme (#4CAF50)

**2. Encouragement Message:**

- Personalized AI-generated praise:
  - "You're getting really good at addition!"
  - "Great job thinking through that one!"
  - Contextual based on question difficulty

**3. Solution Explanation:**

- **Header:** "Here's how to solve it:" with lightbulb icon 💡
- **Step-by-step breakdown:**

  ```
  15 + 7 = 22

  Let's count: 15 → 16, 17, 18, 19, 20, 21, 22!

  You can also think: 15 + 5 = 20, then 20 + 2 = 22
  ```

- **Visual aids:** Number line, counting objects
- **Multiple strategies shown** (AI-generated)

**4. Reward Indicators:**

- Points earned: "🎖️ +10 points"
- Streak bonus: "⚡ 3 correct in a row!"
- Progress toward achievement: "⭐ 2 more for Math Star badge"

**5. Action Buttons:**

- **Primary:** "Next Question →" (green, large)
- **Secondary:** "Explain More" (outline, optional deep dive)

**Modal Behavior:**

- Auto-appears after correct answer submitted
- Entry animation: Scale from 0.8 → 1.0 with bounce
- Can be dismissed with button or background click
- Auto-advances after 10 seconds (configurable)

**MDB 5 Components:**

- `<mdb-modal>` for overlay
- `<mdb-card>` for content container
- `<mdb-badge>` for rewards display
- `<mdb-btn>` for actions

**Animations:**

- Checkmark: Draw-in animation (500ms)
- Confetti: Particles fall from top (2s)
- Badges: Pop in with scale effect (staggered)
- Content: Fade in sequentially

**Data Requirements:**

- Feedback data (isCorrect, points, streaks)
- AI-generated explanation
- Reward information
- Next question preview

**API Integration:**

- Included in answer submission response
- POST `/api/practice/sessions/{sessionId}/answers` returns feedback

**Acceptance Criteria:**

- Appears within 500ms of submission
- Celebration feels rewarding, not overwhelming
- Explanation is grade-appropriate
- Can replay explanation
- Accessible to screen readers

---

#### S1.3.3 Feedback Modal - Incorrect Answer

**Route:** Modal overlay on `/practice/:topicId`  
**Priority:** P0 (Critical - MVP Phase 1)  
**User Story Reference:** US-EV-002

**Purpose:**  
Provide supportive, growth-mindset feedback to help students learn from mistakes.

**Key Features:**

**1. Supportive Header:**

- Thoughtful emoji or lightbulb icon (NOT red X)
- Warm orange/yellow color theme (#FF9800)
- Title: "Let's Learn Together!", "Not Quite Yet!", "Almost There!"
- No harsh language or negative tone

**2. Answer Comparison:**

- Two-column card:
  - **Left:** "Your Answer: 20" (neutral styling)
  - **Right:** "Correct Answer: 22" (green text)
- Visual comparison, not judgmental

**3. Explanation Section:**

- **Header:** "💡 How to Solve It:"
- **Step-by-step breakdown:**

  ```
  Let's break this down together:

  15 + 7 = ?

  Start with 15, then count up 7 more:
  15 → 16 → 17 → 18 → 19 → 20 → 21 → 22

  The answer is 22!
  ```

- **Visual aids:**
  - Number line showing jumps
  - Finger counting illustration
  - Dot/block counting
  - AI-generated diagrams

**4. Hint Section:**

- First hint shown automatically:
  - "💭 Hint: Try using your fingers to help count"
  - "Try breaking 7 into 5 + 2 to make it easier"
- Soft yellow background (#FFF9C4)
- Additional hints available on request

**5. Common Mistake Explanation (AI-generated):**

- "Many students think of 15 + 5 = 20, but don't forget we need to add 7!"
- Identifies specific misconception
- Provides targeted remediation

**6. Encouragement:**

- "Mistakes help us learn! Let's try again."
- "You're building important skills by practicing!"
- Growth mindset messaging

**7. Action Buttons:**

- **Try Again:** (outline, gray) - Returns to same question
- **Continue:** (primary blue) - Moves to next question
- **See More Examples:** (text link) - Shows similar problems
- Equal visual weight (no "preferred" button)

**Modal Behavior:**

- No time pressure or countdown
- Student chooses when to proceed
- Can request more explanation
- Tracks retry attempts (for analytics, not shown to student)

**MDB 5 Components:**

- `<mdb-modal>` for overlay
- `<mdb-card>` for explanation sections
- `<mdb-alert>` for hint boxes
- `<mdb-btn>` for action buttons

**Emotional Design:**

- Warm, encouraging color palette
- Gentle animations (no harsh movements)
- Positive language throughout
- Optional "Explain it to me" voice feature

**Data Requirements:**

- Student's answer
- Correct answer with explanation
- Common misconceptions for this question
- Similar practice problems
- Retry tracking

**API Integration:**

- Included in answer submission response
- GET `/api/practice/questions/{id}/similar` for more examples

**Acceptance Criteria:**

- Never makes student feel "wrong" or "bad"
- Explanation is at appropriate reading level (Grade 3)
- Visual aids help understanding
- No penalty for retrying
- Tracks learning patterns for AI improvement

---

#### S1.3.4 Practice Session Summary

**Route:** `/practice/:topicId/summary`  
**Priority:** P1 (High - MVP Phase 1)  
**User Story Reference:** US-PT-001

**Purpose:**  
End-of-session celebration and progress review.

**Key Features:**

**1. Celebration Header:**

- "Great Session, Emma! 🎉"
- Animated trophy or star
- Completion confetti

**2. Session Stats:**

- Questions completed: "10/10 ✓"
- Accuracy: "8 correct, 2 to practice more"
- Time spent: "15 minutes"
- Points earned: "+80 points"

**3. Visual Progress:**

- Circular progress gauge: 80% accuracy
- Color-coded: Green (≥85%), Yellow (70-84%), Orange (<70%)
- Mastery stars earned this session

**4. Topic Progress:**

- Updated topic completion: "Addition: 18/20 complete"
- Progress bar animation
- "Almost a master! 2 more to go!"

**5. Achievements Unlocked:**

- New badges earned (if any)
- Progress toward next achievement
- Celebration animation for new unlocks

**6. Review Section (Optional):**

- "Questions to Practice More" - Lists incorrect questions
- Button: "Practice These Again"

**7. What's Next:**

- AI recommendation: "Try Subtraction next!"
- Or: "Complete 2 more Addition sessions to master it!"

**8. Action Buttons:**

- **Practice Again** (same topic)
- **Choose New Topic**
- **View Progress Dashboard**
- **Done for Today**

**MDB 5 Components:**

- `<mdb-card>` for stats sections
- `<mdb-chart>` for accuracy visualization
- `<mdb-progress>` for topic completion
- `<mdb-modal>` for achievement celebrations

**Animations:**

- Stats count up from 0
- Progress bars fill smoothly
- Achievements pop in with fanfare

**Data Requirements:**

- Session results (questions, answers, time)
- Updated topic progress
- New achievements
- Next recommendations

**API Integration:**

- GET `/api/practice/sessions/{sessionId}/summary`
- POST `/api/students/{id}/sessions/complete`

**Acceptance Criteria:**

- Celebrates all progress (even low scores)
- Clear what was learned
- Motivating for next session
- Can review specific questions
- Saves session to history

---

### 1.4 Progress & Achievements

#### S1.4.1 Progress Dashboard

**Route:** `/progress`  
**Priority:** P1 (High - MVP Phase 2)  
**User Story Reference:** US-PT-001

**Purpose:**  
Student-friendly view of their learning journey and achievements.

**Key Features:**

**1. Overview Header:**

- "Your Learning Journey 🚀"
- Time range selector: "This Week", "This Month", "All Time"
- Overall level: "Grade 3 Math - Level 7"

**2. Key Metrics (3 Cards):**

- **Total Questions:**
  - Number: "156 questions solved"
  - Mini chart showing weekly trend
  - Icon: 🎯
- **Accuracy Score:**
  - Percentage: "87% correct"
  - Progress indicator
  - Icon: ⭐
- **Learning Streak:**
  - Days: "🔥 5 days in a row!"
  - Streak calendar visualization
  - Icon: 📅

**3. Progress by Topic:**

- Visual grid of all topics
- Each shows:
  - Topic icon and name
  - Completion percentage
  - Mastery level (Beginner, Learning, Advanced, Master)
  - Mini progress bar
- Click to see detailed topic report

**4. Learning Calendar:**

- Heat map showing practice days
- Darker colors = more practice
- Streak highlighting
- Hover shows questions answered that day

**5. Recent Activity Timeline:**

- Last 5 sessions shown
- Each entry:
  - Topic practiced
  - Score achieved
  - Time spent
  - Date/time
- "View All History" link

**6. Skills Tree (Visual):**

- Interactive skill map
- Shows curriculum progression
- Completed skills: Green checkmark
  - In progress: Yellow dot
- Locked skills: Gray lock
- Click for skill details

**MDB 5 Components:**

- `<mdb-card>` for metric cards
- `<mdb-chart>` for trends and visualizations
- `<mdb-progress>` for completion indicators
- `<mdb-table>` for activity timeline
- `<mdb-tooltip>` for calendar hover details

**Data Visualization:**

- Line chart: Accuracy over time
- Bar chart: Questions per topic
- Heat map: Practice calendar
- Radial chart: Topic mastery

**Data Requirements:**

- Student progress across all topics
- Historical session data
- Streak information
- Skill tree mapping

**API Integration:**

- GET `/api/students/{id}/progress/overview`
- GET `/api/students/{id}/progress/topics`
- GET `/api/students/{id}/sessions/history`

**Acceptance Criteria:**

- Visual, easy for children to understand
- Celebrates all progress
- Encouraging even with gaps
- Interactive elements
- Responsive design

---

#### S1.4.2 Achievements & Badges Screen

**Route:** `/achievements`  
**Priority:** P2 (Medium - MVP Phase 2)  
**User Story Reference:** US-PT-002

**Purpose:**  
Display earned badges, achievements, and motivate continued learning.

**Key Features:**

**1. Achievements Header:**

- "Your Achievements 🏆"
- Total badges earned: "12/50 badges"
- Level indicator: "Achievement Hunter - Level 3"

**2. Badge Gallery:**

- Grid display (3-4 columns)
- **Earned Badges:**
  - Colorful, large badge image
  - Badge name: "Math Star"
  - Description: "Solved 50 addition problems"
  - Earned date: "Jan 15, 2026"
  - Shine/glow effect
- **Locked Badges:**
  - Grayscale silhouette
  - "???" mysterious hint
  - Unlock requirement: "Solve 100 questions"
  - Progress indicator: "45/100"

**3. Badge Categories:**

- Tabs or filters:
  - All Achievements
  - Recently Earned
  - In Progress
  - Locked
  - By Type: Streaks, Mastery, Milestones, Special

**4. Featured Achievement:**

- Large highlighted card
- "Next Achievement to Unlock!"
- Shows closest achievement
- Progress bar and requirements
- Motivational message

**5. Achievement Details Modal:**

- Click badge for details:
  - Full description
  - How to earn
  - Rarity indicator
  - Students who earned it (%)
  - Share option (future)

**6. Leaderboard (Optional):**

- Personal best scores
- No comparison to others (privacy)
- Self-improvement focus

**Badge Types:**

- **Milestone:** "First Question!", "100 Questions!"
- **Streak:** "3-Day Streak", "Perfect Week"
- **Mastery:** "Addition Master", "Math Wizard"
- **Special:** "Early Bird" (practice before 9am), "Night Owl"
- **Seasonal:** Holiday-themed badges

**MDB 5 Components:**

- `<mdb-card>` for badge cards
- `<mdb-tabs>` for category filtering
- `<mdb-modal>` for badge details
- `<mdb-progress>` for unlock progress
- `<mdb-badge>` for "NEW" indicators

**Animations:**

- Badge unlock: Zoom in + sparkle effect
- Hover: Gentle float/rotate
- Click: Flip card animation
- Gallery: Staggered fade-in

**Data Requirements:**

- All available achievements
- Student's earned badges with dates
- Progress toward locked achievements
- Achievement metadata (rarity, category)

**API Integration:**

- GET `/api/achievements`
- GET `/api/students/{id}/achievements`
- GET `/api/students/{id}/achievements/progress`

**Acceptance Criteria:**

- Visually appealing badge designs
- Clear unlock requirements
- Motivating without being addictive
- Celebrates all learners
- No negative achievements

---

### 1.5 Settings & Profile

#### S1.5.1 Student Profile Screen

**Route:** `/profile`  
**Priority:** P2 (Medium - MVP Phase 2)  
**User Story Reference:** US-PROFILE-001

**Purpose:**  
View and customize student profile, preferences, and settings.

**Key Features:**

**1. Profile Header:**

- Large avatar display
- Student name
- Grade level
- Member since date
- Total points earned

**2. Avatar Customization:**

- Avatar gallery (20+ options)
- Upload custom avatar (parent approval)
- Avatar accessories/frames (unlockable)

**3. Preferences:**

- **Learning Preferences:**
  - Daily goal (minutes): Slider 10-60 minutes
  - Preferred practice time: Morning, Afternoon, Evening
  - Difficulty preference: Easier, Balanced, Challenging
- **Accessibility:**
  - Text size: Small, Medium, Large, Extra Large
  - High contrast mode: Toggle
  - Dyslexia-friendly font: Toggle
  - Text-to-speech: Always, Optional, Off
  - Reduced animations: Toggle
- **Audio:**
  - Sound effects: On/Off
  - Background music: On/Off
  - Volume slider

**4. Statistics Summary:**

- Total questions answered
- Total practice time
- Favorite topic
- Best achievement

**5. Parent Connection:**

- "Ask parent to review progress"
- Send message to parent

**6. Help & Support:**

- "How to use LearningHub" tutorial (replay)
- FAQ
- Contact support (parent)

**MDB 5 Components:**

- `<mdb-card>` for sections
- `<mdb-form>` for preferences
- `<mdb-range>` for sliders
- `<mdb-switch>` for toggles
- `<mdb-select>` for dropdowns

**Data Requirements:**

- Student profile data
- Preferences and settings
- Statistics summary

**API Integration:**

- GET `/api/students/{id}/profile`
- PUT `/api/students/{id}/profile`
- PUT `/api/students/{id}/preferences`

**Acceptance Criteria:**

- Changes save immediately
- Clear visual confirmation
- Accessible to all users
- Parent approval for sensitive changes

---

#### S1.5.2 Help & Tutorial Screen

**Route:** `/help`  
**Priority:** P2 (Medium - MVP Phase 3)  
**User Story Reference:** US-HELP-001

**Purpose:**  
Provide contextual help, tutorials, and support resources.

**Key Features:**

**1. Quick Help Topics:**

- "How to answer questions"
- "Understanding your progress"
- "Earning achievements"
- "Getting help with hard problems"

**2. Interactive Tutorials:**

- Step-by-step walkthroughs
- Practice examples
- Video demonstrations (future)

**3. FAQs:**

- Common questions with answers
- Search functionality
- Category filtering

**4. Contact Support:**

- Message parent
- Report a problem
- Suggest new features

**MDB 5 Components:**

- `<mdb-accordion>` for FAQs
- `<mdb-card>` for help topics
- `<mdb-form>` for contact form

---

## 2. Parent Application Screens

### 2.1 Authentication & Setup

#### P2.1.1 Parent Login Screen

**Route:** `/login`  
**Priority:** P0 (Critical - MVP Phase 1)  
**User Story Reference:** US-AUTH-002

**Purpose:**  
Secure parent authentication with professional interface.

**Key Features:**

- Email/username input
- Password input with show/hide
- "Remember me" checkbox
- "Forgot password" link
- Two-factor authentication (future)
- "Create Account" link

**MDB 5 Components:**

- `<mdb-card>` for login form
- `<mdb-form>` with validation
- `<mdb-btn>` for submit
- `<mdb-alert>` for error messages

**Data Requirements:**

- Parent credentials
- Session management
- Security tokens

**API Integration:**

- POST `/api/auth/parent/login`
- POST `/api/auth/parent/verify-2fa` (future)

**Acceptance Criteria:**

- Secure authentication
- Clear error messages
- Password strength indicator
- Accessibility compliant

---

#### P2.1.2 Parent Registration Screen

**Route:** `/register`  
**Priority:** P1 (High - MVP Phase 1)  
**User Story Reference:** US-AUTH-003

**Purpose:**  
New parent account creation with family setup.

**Key Features:**

**Step 1: Parent Information**

- Full name
- Email address
- Password (with strength meter)
- Confirm password

**Step 2: Family Setup**

- Number of students
- Student profiles (names, grades, avatars)

**Step 3: Preferences**

- Notification preferences
- Weekly report settings
- Privacy settings

**Step 4: Confirmation**

- Review information
- Terms acceptance
- Email verification

**MDB 5 Components:**

- `<mdb-stepper>` for multi-step form
- `<mdb-form>` with validation
- `<mdb-progress>` for password strength

**Data Requirements:**

- Parent account data
- Student profiles
- Preferences

**API Integration:**

- POST `/api/auth/parent/register`
- POST `/api/parents/{id}/students`

**Acceptance Criteria:**

- Validates all inputs
- Prevents duplicate emails
- Sends verification email
- Clear progress indication

---

### 2.2 Dashboard & Analytics

#### P2.2.1 Parent Dashboard (Main)

**Route:** `/dashboard`  
**Priority:** P0 (Critical - MVP Phase 1)  
**User Story Reference:** US-PD-001

**Purpose:**  
Comprehensive overview of all students' learning progress with actionable insights.

**Key Features:**

**1. Header Section:**

- "Learning Dashboard 📊"
- Student selector dropdown (if multiple children)
- Date range selector: "Last 7 days", "Last 30 days", "This month", "Custom"
- Quick action buttons: "Weekly Report", "Export Data"

**2. Key Metrics Row (3-4 Cards):**

**Card 1: Questions Answered**

- Large number: "156"
- Comparison: "↗️ +23 from last week"
- Weekly goal progress: "156/150 - Goal achieved! 🎉"
- Mini sparkline chart
- Color: Blue

**Card 2: Overall Accuracy**

- Percentage: "87%"
- Trend: "↗️ +5% improvement"
- Comparison to grade average: "Above grade average (78%)"
- Mini accuracy trend chart
- Color: Green/Yellow/Red based on performance

**Card 3: Learning Time**

- Total minutes: "245 minutes"
- Average per session: "18 minutes"
- Daily average: "35 min/day"
- Target progress: "87% of weekly goal"
- Color: Purple

**Card 4: Active Streak**

- Days: "🔥 5 consecutive days"
- Longest streak: "Best: 12 days"
- Encouragement: "Keep it going!"
- Color: Orange

**3. Performance Trends Chart:**

- **Title:** "📈 Progress Over Time"
- **Chart Type:** Line chart with multiple series
- **Data Series:**
  - Overall accuracy (blue line)
  - Questions per day (bar chart overlay)
  - Time spent (secondary axis)
- **Time Range:** Matches selected filter
- **Interactive:**
  - Hover tooltips with daily details
  - Click to drill into specific day
  - Legend toggle to show/hide series
- **Export:** Download as PNG/PDF

**4. Topic Performance Breakdown:**

- **Section Title:** "📚 Topic Performance"
- **Layout:** Table or card grid
- **Columns:**
  - Topic name with icon
  - Questions attempted
  - Accuracy percentage
  - Trend (↗️↘️→)
  - Last practiced
  - Action button
- **Data Rows:**

  ```
  Addition          43/50  86%  ↗️ +5%  2 days ago  [Practice]
  Subtraction       31/50  62%  ↘️ -3%  1 day ago   [Review]
  Multiplication    12/20  60%  → 0%   5 days ago  [Practice]
  ```

- **Color Coding:**
  - 85%+ : Green background
  - 70-84%: Yellow background
  - <70% : Orange background (needs attention)
- **Sorting:** Click column headers to sort
- **Filtering:** Show only "Needs Attention" topics

**5. Learning Focus Areas:**

**Left Column - "⚠️ Needs Practice":**

- Red/orange accent border
- List of topics <70% accuracy:
  - "Multi-digit Subtraction - 62%"
  - "Word Problems - 68%"
- Each item shows:
  - Mini progress bar
  - "Practice Now" button
  - AI suggestion for improvement

**Right Column - "⭐ Strengths":**

- Green accent border
- List of topics ≥85% accuracy:
  - "Single-digit Addition - 95%"
  - "Number Recognition - 100%"
- Celebration checkmarks
- "Build on this" suggestions

**6. AI-Powered Insights Card:**

- **Icon:** 🤖
- **Title:** "AI Insights & Recommendations"
- **Content Example:**

  ```
  Emma shows strong pattern recognition skills but tends to
  rush through word problems.

  💡 Suggestion: Encourage her to read the problem aloud
  before answering. This improves comprehension and reduces
  careless mistakes.

  Expected outcome: Word problem accuracy could improve from
  68% to 80%+ with this strategy.
  ```

- **Actions:**
  - "Learn More" (expands full analysis)
  - "Mark as Helpful" feedback
  - "Share with Emma" (sends tip to student app)
- **Background:** Soft blue (#E3F2FD)
- **Updates:** Refreshes weekly or after significant changes

**7. Recent Activity Section:**

**Recent Sessions Table:**

- Last 10 practice sessions
- Columns:
  - Date & Time
  - Topic
  - Questions answered
  - Accuracy
  - Duration
  - View details link
- **Interactive:**
  - Click row to see question-by-question breakdown
  - Filter by topic or date range

**Recent Achievements:**

- Carousel or grid of last 5 achievements
- Badge image
- Achievement name
- Date earned
- Description
- "View All" link to achievements page

**8. Bottom Action Bar:**

- **View Detailed Report** - Opens comprehensive analytics
- **Export Progress** (PDF) - Download formatted report
- **Schedule Practice** - Set reminders/goals
- **Compare Students** (if multiple) - Side-by-side view

**MDB 5 Components:**

- `<mdb-card>` for metric cards and sections
- `<mdb-chart>` for all data visualizations
- `<mdb-table>` for topic performance
- `<mdb-select>` for filters and date ranges
- `<mdb-badge>` for status indicators
- `<mdb-btn>` for all actions
- `<mdb-alert>` for insights card
- `<mdb-carousel>` for achievements

**Responsive Design:**

- Desktop (1200px+): Full layout with all sections
- Tablet (768px-1199px): Stacked cards, collapsed sidebar
- Mobile (< 768px): Single column, summary cards only

**State Management:**

- Selected student ID
- Selected date range
- Chart data
- Filter states
- Expanded/collapsed sections

**Data Requirements:**

- Student progress summary
- Session history
- Topic performance data
- Achievement data
- AI-generated insights

**API Integration:**

- GET `/api/parents/{id}/dashboard?studentId={studentId}&range={range}`
- GET `/api/students/{id}/progress/summary`
- GET `/api/students/{id}/insights`
- GET `/api/students/{id}/sessions/recent`
- GET `/api/students/{id}/achievements/recent`

**Loading States:**

- Skeleton loaders for all cards
- Progressive data loading (metrics first, then charts)
- Cached data for offline viewing

**Empty States:**

- "No practice sessions yet" with CTA to start learning
- "Not enough data for trends" (< 3 sessions)

**Accessibility:**

- All charts have text alternatives
- Color + icons (not color alone)
- Keyboard navigation
- Screen reader announcements for updates

**Performance:**

- Dashboard loads in <2 seconds
- Charts render in <1 second
- Real-time updates via WebSocket (future)

**Acceptance Criteria:**

- Shows accurate, up-to-date data
- Insights are actionable and helpful
- Visual hierarchy clear
- Responsive on all devices
- Can drill down into any metric
- Export functionality works
- AI insights update regularly

---

#### P2.2.2 Detailed Analytics Screen

**Route:** `/analytics`  
**Priority:** P1 (High - MVP Phase 2)  
**User Story Reference:** US-PD-003

**Purpose:**  
Deep-dive analytics for data-driven insights into learning patterns.

**Key Features:**

**1. Time Period Selector:**

- Preset ranges: "Last 7 days", "Last 30 days", "Last 3 months", "All time"
- Custom date range picker
- Compare periods: "vs. Previous period"

**2. Performance Analytics:**

**Accuracy Trends:**

- Line chart showing accuracy over time
- Breakdown by:
  - Overall
  - By topic
  - By difficulty level
  - By question type
- Moving average trend line
- Annotations for significant events

**Time Analysis:**

- **Time of Day Performance:**
  - Heatmap showing best/worst times
  - Recommendations for optimal practice times
- **Session Duration Impact:**
  - Scatter plot: Duration vs. Accuracy
  - Insights: "Sweet spot is 15-20 minute sessions"
- **Practice Frequency:**
  - Calendar heatmap
  - Streak visualization
  - Consistency score

**3. Topic Mastery Deep Dive:**

**Curriculum Alignment View:**

- Tree/hierarchy visualization
- New Zealand Math Curriculum Levels
- Completed vs. In Progress vs. Not Started
- Click topic for detailed breakdown

**Skill Gap Analysis:**

- Identifies missing prerequisite skills
- Suggests remediation path
- AI-recommended focus areas

**Question-Level Analytics:**

- Most missed questions
- Common wrong answers
- Time spent per question type
- Difficulty vs. accuracy correlation

**4. Learning Patterns:**

**Behavioral Insights:**

- Average questions per session
- Dropout rate (questions started but not finished)
- Help usage frequency
- Retry patterns
- Answer change rate (second-guessing)

**Progress Velocity:**

- Questions answered per week (trend)
- Accuracy improvement rate
- Time to mastery per topic
- Projected completion dates

**5. Comparative Analysis:**

**Grade-Level Benchmarking:**

- Student vs. Grade 3 average
- Percentile ranking (optional)
- Strength/weakness relative to peers

**Personal Best Tracking:**

- Highest accuracy achieved
- Longest streak
- Most productive week
- Fastest improvement

**6. Predictive Analytics (AI-Powered):**

- "At current pace, Emma will master Addition in 2 weeks"
- Risk indicators: "Subtraction accuracy declining - needs attention"
- Opportunity detection: "Ready to advance to Grade 4 Multiplication"

**7. Export & Reporting:**

- **Report Types:**
  - Comprehensive progress report (PDF)
  - Topic summary (CSV for spreadsheet)
  - Charts and graphs (PNG/SVG)
- **Scheduling:**
  - One-time download
  - Recurring email reports (weekly/monthly)

**8. Filters & Segments:**

- Filter by:
  - Topic/subject
  - Difficulty level
  - Question type
  - Time range
  - Session length
- Save custom views

**MDB 5 Components:**

- `<mdb-chart>` for all visualizations (Line, Bar, Scatter, Heatmap)
- `<mdb-datepicker>` for date selection
- `<mdb-table>` for data grids
- `<mdb-tabs>` for section switching
- `<mdb-select>` for filters
- `<mdb-btn>` for exports

**Data Visualization Best Practices:**

- Color-blind friendly palettes
- Interactive tooltips
- Zoom and pan on charts
- Legend controls
- Responsive sizing

**Data Requirements:**

- Granular session data
- Question-level results
- Time-series data
- Benchmark data (grade averages)
- AI analysis results

**API Integration:**

- GET `/api/analytics/student/{id}?range={range}&metrics={metrics}`
- GET `/api/analytics/benchmarks?grade={grade}`
- GET `/api/analytics/predictions/{studentId}`
- POST `/api/reports/generate`

**Acceptance Criteria:**

- Data accuracy verified
- Charts load quickly (<2s)
- Insights are actionable
- Can drill down to details
- Export works correctly
- Responsive design

---

#### P2.2.3 Weekly Progress Report

**Route:** `/reports/weekly`  
**Priority:** P1 (High - MVP Phase 2)  
**User Story Reference:** US-PD-002

**Purpose:**  
Automated weekly summary with highlights and recommendations.

**Key Features:**

**1. Report Header:**

- Week range: "January 15-21, 2026"
- Student name and avatar
- Overall grade: "Great Week! 🌟"
- Share/print/email buttons

**2. Executive Summary:**

- **Highlights:**
  - "Completed 47 questions"
  - "87% overall accuracy (+5% from last week)"
  - "Earned 3 new achievements"
  - "Practiced 5 consecutive days"
- **Notable Achievements:**
  - "Mastered single-digit addition!"
  - "Longest practice streak this month"

**3. This Week's Progress:**

**Activity Summary:**

- Total practice time: "3 hours 15 minutes"
- Sessions completed: "7 sessions"
- Average session length: "27 minutes"
- Best day: "Tuesday - 12 questions, 92% accuracy"

**Topic Breakdown:**

- Visual cards for each practiced topic:
  - Addition: 18 questions, 89% accuracy ↗️
  - Subtraction: 15 questions, 73% accuracy →
  - Multiplication: 14 questions, 93% accuracy ↗️

**4. Achievements Unlocked:**

- Badge gallery (this week's new badges)
- Progress toward next achievements

**5. Areas of Strength:**

- "Emma excels at:"
  - Pattern recognition
  - Mental math
  - Single-digit operations
- Celebrate strengths

**6. Focus Areas for Next Week:**

- "Areas to practice:"
  - Multi-digit subtraction (current: 62%)
  - Word problem comprehension
- Specific recommendations
- Suggested practice frequency

**7. AI Insights:**

- "This Week's Insight:"
  - Pattern discovered
  - Recommendation
  - Expected outcome

**8. Goal Progress:**

- Weekly goal achievement: "156/150 questions ✓"
- Accuracy target: "87/85% ✓"
- Streak goal: "5/5 days ✓"

**9. Next Week Preview:**

- Suggested topics
- Recommended practice schedule
- Goals for next week

**10. Parent Actions:**

- Acknowledge report (marks as read)
- Share with teacher (future)
- Set goals for next week
- Print/save PDF

**MDB 5 Components:**

- `<mdb-card>` for sections
- `<mdb-chart>` for visualizations
- `<mdb-badge>` for achievements
- `<mdb-btn>` for actions
- `<mdb-alert>` for highlights

**Distribution:**

- Automatically generated every Monday
- Email notification with summary
- Viewable in app
- Archived for history

**Data Requirements:**

- Week's session data
- Achievements earned
- Goals and targets
- AI-generated insights

**API Integration:**

- GET `/api/reports/weekly/{studentId}?week={weekStart}`
- POST `/api/reports/weekly/{id}/acknowledge`
- POST `/api/reports/weekly/{id}/export`

**Acceptance Criteria:**

- Accurate data
- Positive, encouraging tone
- Actionable recommendations
- Easy to read/understand
- Can be printed/shared

---

### 2.3 Student Management

#### P2.3.1 Student Profile Management

**Route:** `/students/:studentId`  
**Priority:** P1 (High - MVP Phase 2)  
**User Story Reference:** US-PARENT-002

**Purpose:**  
Manage student account, preferences, and settings.

**Key Features:**

**1. Profile Information:**

- Avatar (editable)
- Full name
- Grade level (editable)
- Date of birth
- Student ID (auto-generated)
- Account created date

**2. Learning Settings:**

**Goals & Targets:**

- Daily practice goal (minutes)
- Weekly question target
- Accuracy goal
- Custom goals

**Curriculum Settings:**

- Current grade level
- Curriculum: "New Zealand Mathematics"
- Difficulty preference: Auto, Easier, Standard, Challenging
- Topic unlocking: Sequential, Free choice

**3. Accessibility Settings:**

- Text size preferences
- Dyslexia-friendly font
- Text-to-speech enabled
- High contrast mode
- Reduced animations
- Color blind mode

**4. Notification Settings:**

- Daily practice reminders
- Achievement notifications
- Weekly report delivery
- Parent notifications
- In-app vs. email

**5. Privacy & Safety:**

- Data sharing preferences
- Display name (if using social features)
- Avatar approval required
- Content filters

**6. Learning History:**

- Account statistics
- Total questions answered
- Total time practiced
- First practice date
- Progress milestones

**7. Actions:**

- Reset progress (with confirmation)
- Pause account (temporary)
- Archive student (if no longer active)
- Delete account (with warning)
- Download all data (export)

**MDB 5 Components:**

- `<mdb-form>` for settings
- `<mdb-switch>` for toggles
- `<mdb-select>` for dropdowns
- `<mdb-range>` for goal sliders
- `<mdb-modal>` for confirmations

**Data Requirements:**

- Student profile data
- Preferences and settings
- Account statistics

**API Integration:**

- GET `/api/students/{id}`
- PUT `/api/students/{id}`
- PUT `/api/students/{id}/settings`
- DELETE `/api/students/{id}`
- POST `/api/students/{id}/export`

**Acceptance Criteria:**

- All changes save immediately
- Confirmation for destructive actions
- Validation prevents invalid settings
- Clear feedback on changes

---

#### P2.3.2 Multiple Students View

**Route:** `/students`  
**Priority:** P2 (Medium - MVP Phase 3)  
**User Story Reference:** US-PARENT-003

**Purpose:**  
Manage and compare multiple children (if applicable).

**Key Features:**

**1. Student List:**

- Card for each child:
  - Avatar and name
  - Grade level
  - Quick stats (questions, accuracy, streak)
  - Last active
  - "View Details" button

**2. Quick Compare:**

- Side-by-side metrics
- Individual progress bars
- Strength/weakness comparison

**3. Add Student:**

- Button to add new child
- Setup wizard

**4. Family Settings:**

- Shared notifications
- Combined reports
- Bulk actions

**MDB 5 Components:**

- `<mdb-card>` for student cards
- `<mdb-table>` for comparison
- `<mdb-btn>` for actions

---

### 2.4 Communication & Support

#### P2.4.1 Messages & Notifications

**Route:** `/messages`  
**Priority:** P2 (Medium - MVP Phase 3)  
**User Story Reference:** US-PARENT-004

**Purpose:**  
View system notifications and student messages.

**Key Features:**

**1. Notification Center:**

- Unread count badge
- Categories:
  - Achievement notifications
  - Weekly reports ready
  - Goal milestones reached
  - AI insights
  - System updates

**2. Student Messages:**

- "Help requests" from student
- Practice reminders sent
- Encouragement messages

**3. Settings:**

- Notification preferences
- Email vs. in-app
- Frequency controls
- Do not disturb schedule

**MDB 5 Components:**

- `<mdb-card>` for messages
- `<mdb-badge>` for unread counts
- `<mdb-list-group>` for messages

---

#### P2.4.2 Help & Support Center

**Route:** `/help`  
**Priority:** P2 (Medium - MVP Phase 3)  
**User Story Reference:** US-SUPPORT-001

**Purpose:**  
Parent resources, FAQs, and support access.

**Key Features:**

**1. Getting Started:**

- Platform overview
- How to guide
- Best practices for parents

**2. FAQs:**

- Common questions
- Search functionality
- Category browsing

**3. Contact Support:**

- Email support form
- Bug reporting
- Feature requests

**4. Resources:**

- Parent guide (PDF)
- Understanding AI in education
- Supporting your child's learning

**MDB 5 Components:**

- `<mdb-accordion>` for FAQs
- `<mdb-form>` for support tickets
- `<mdb-card>` for resources

---

### 2.5 Settings & Configuration

#### P2.5.1 Parent Account Settings

**Route:** `/settings`  
**Priority:** P1 (High - MVP Phase 2)  
**User Story Reference:** US-PARENT-005

**Purpose:**  
Manage parent account and preferences.

**Key Features:**

**1. Account Information:**

- Name, email
- Password change
- Two-factor authentication (future)

**2. Notification Preferences:**

- Email notifications
- Report frequency
- Achievement alerts
- System updates

**3. Privacy Settings:**

- Data retention
- Analytics opt-out
- Third-party sharing (none by default)

**4. Subscription & Billing (Future):**

- Current plan
- Payment methods
- Billing history
- Upgrade options

**5. Family Management:**

- Add/remove students
- Parent access controls
- Multi-parent accounts (future)

**MDB 5 Components:**

- `<mdb-form>` for settings
- `<mdb-switch>` for toggles
- `<mdb-table>` for billing

**Data Requirements:**

- Parent account data
- Notification preferences
- Privacy settings

**API Integration:**

- GET `/api/parents/{id}/settings`
- PUT `/api/parents/{id}/settings`
- PUT `/api/parents/{id}/password`

---

#### P2.5.2 AI Transparency & Control

**Route:** `/ai-settings`  
**Priority:** P2 (Medium - MVP Phase 2)  
**User Story Reference:** US-AI-TRANS-001

**Purpose:**  
Configure and understand AI features with full transparency.

**Key Features:**

**1. AI Features Overview:**

- What AI does in the platform
- How questions are generated
- How answers are evaluated
- How insights are created

**2. AI Model Information:**

- Current model: "Llama 3.1 70B"
- Model capabilities
- Limitations and disclaimers
- Update history

**3. AI Control Settings:**

**Question Generation:**

- Difficulty adaptation: Auto, Fixed
- Topic diversity: Balanced, Focus on weak areas
- Question variety: Standard, Maximum variety
- Visual aids: Always, When helpful, Minimal

**Feedback Settings:**

- Explanation depth: Detailed, Standard, Brief
- Hint availability: Always, After retry, Minimal
- Encouragement style: Enthusiastic, Moderate, Minimal

**Insights & Recommendations:**

- AI insights: Enabled, Limited, Disabled
- Recommendation frequency: Real-time, Weekly, Manual
- Insight types: All, Learning only, Technical only

**4. Data Usage:**

- What data is collected
- How it's used for AI improvement
- Opt-out options
- Data deletion requests

**5. Quality Assurance:**

- How AI quality is monitored
- Parent feedback mechanism
- Report AI issues
- Review flagged content

**6. Transparency Reports:**

- AI decision log (for this student)
- Example: "Question difficulty increased because accuracy >85% for 5 sessions"
- Insight generation history
- Model updates and changes

**7. Manual Overrides:**

- Disable AI for specific topics
- Force difficulty level
- Review/approve AI-generated content
- Blacklist specific question types

**MDB 5 Components:**

- `<mdb-switch>` for AI feature toggles
- `<mdb-select>` for preference levels
- `<mdb-accordion>` for detailed explanations
- `<mdb-table>` for decision logs
- `<mdb-modal>` for examples

**Educational Content:**

- "Understanding AI in Education" guide
- Video tutorials
- Case studies
- Research backing

**Data Requirements:**

- AI configuration settings
- Decision logs
- Model information
- Parent preferences

**API Integration:**

- GET `/api/ai/settings/{parentId}`
- PUT `/api/ai/settings/{parentId}`
- GET `/api/ai/decisions/{studentId}?range={range}`
- POST `/api/ai/feedback`

**Acceptance Criteria:**

- Clear explanations in non-technical language
- Full control over AI features
- Transparency in all decisions
- Easy to understand impact
- Opt-out always available

---

## 3. Shared/Common Screens

### 3.1 Error & System Screens

#### SH3.1.1 404 Not Found

**Route:** `/404` or wildcard
**Priority:** P1 (High - MVP Phase 1)

**Purpose:**  
Friendly error page for non-existent routes.

**Key Features:**

- **Student Version:**
  - Friendly illustration "Oops! Page not found"
  - Simple language
  - "Go Home" button
  - "Help" button
- **Parent Version:**
  - Professional error message
  - Suggested pages
  - Search functionality
  - Contact support

**MDB 5 Components:**

- `<mdb-card>` for error container
- `<mdb-btn>` for navigation

---

#### SH3.1.2 500 Server Error

**Route:** `/error`
**Priority:** P1 (High - MVP Phase 1)

**Purpose:**  
Graceful error handling for system failures.

**Key Features:**

- Error message
- "Try Again" button
- "Report Problem" link
- Error ID for support reference
- Automatic retry logic

**MDB 5 Components:**

- `<mdb-alert>` for error display
- `<mdb-btn>` for actions

---

#### SH3.1.3 Offline Mode Screen

**Route:** Shown when offline
**Priority:** P2 (Medium - MVP Phase 2)

**Purpose:**  
Inform users of offline status and available features.

**Key Features:**

- Offline indicator
- Available offline features
- Sync status
- "Retry Connection" button
- Queue of pending actions

**MDB 5 Components:**

- `<mdb-alert>` for offline notification
- `<mdb-progress>` for sync status

---

#### SH3.1.4 Maintenance Mode

**Route:** All routes during maintenance
**Priority:** P2 (Medium - MVP Phase 3)

**Purpose:**  
Inform users during scheduled maintenance.

**Key Features:**

- Maintenance message
- Estimated completion time
- Countdown timer
- Subscribe for notifications
- Emergency contact

---

### 3.2 Loading & Transition Screens

#### SH3.2.1 Loading Screen

**Component:** Global loader
**Priority:** P0 (Critical - MVP Phase 1)

**Purpose:**  
Consistent loading experience across the app.

**Key Features:**

- **Student Version:**
  - Animated mascot or spinner
  - Encouraging messages
  - Fun facts (optional)
- **Parent Version:**
  - Clean spinner
  - Progress indicator
  - Current action

**MDB 5 Components:**

- `<mdb-spinner>` for loading indicator
- Custom animations

---

#### SH3.2.2 Splash Screen

**Component:** App initialization
**Priority:** P1 (High - MVP Phase 1)

**Purpose:**  
Branded initial screen while app loads.

**Key Features:**

- LearningHub logo
- Animated introduction
- Version number
- Loading progress

---

## 4. Screen Flow Diagrams

### 4.1 Student User Journey

```
Student Login
    ↓
[First Time?] ─Yes→ Welcome & Onboarding
    ↓ No              ↓
Student Dashboard ←───┘
    ↓
Topic Selection
    ↓
Question Practice ←─┐
    ↓                │
Feedback Modal       │
    ↓                │
[More Questions?] ─Yes┘
    ↓ No
Practice Session Summary
    ↓
[Continue?] ─Yes→ Topic Selection
    ↓ No
Student Dashboard
```

### 4.2 Parent User Journey

```
Parent Login
    ↓
[First Time?] ─Yes→ Registration & Setup
    ↓ No              ↓
Parent Dashboard ←────┘
    ↓
[View More] ──→ Detailed Analytics
    ↓
[Weekly Report] ─→ Weekly Progress Report
    ↓
[Settings] ──→ Account Settings
    ↓
[Student Profile] ─→ Student Management
```

### 4.3 Question Practice Flow (Detailed)

```
Topic Selection
    ↓
Generate Questions (API call)
    ↓
[Loading] → Display Question
    ↓
Student Selects Answer
    ↓
Submit Answer (API call)
    ↓
Evaluate Answer (AI)
    ↓
[Correct?] ───Yes──→ Celebration Feedback
    ↓ No                   ↓
Supportive Feedback        Update Progress
    ↓                      ↓
[Try Again?] ─Yes→ Same Question
    ↓ No                   ↓
Update Progress ←──────────┘
    ↓
[More Questions?] ─Yes→ Next Question
    ↓ No
Session Summary
```

---

## 5. Implementation Priority Matrix

### Phase 1: MVP Core (Weeks 1-2) - P0 Priority

| Screen ID | Screen Name          | App     | Estimated Effort | Dependencies                      |
| --------- | -------------------- | ------- | ---------------- | --------------------------------- |
| S1.1.1    | Student Login        | Student | 3 days           | Backend auth API                  |
| S1.2.1    | Student Dashboard    | Student | 5 days           | Progress API, Recommendations API |
| S1.2.2    | Topic Selection      | Student | 4 days           | Topics API, Progress API          |
| S1.3.1    | Question Practice    | Student | 8 days           | Questions API, AI generation      |
| S1.3.2    | Feedback - Correct   | Student | 2 days           | Evaluation API                    |
| S1.3.3    | Feedback - Incorrect | Student | 3 days           | Evaluation API, Hints API         |
| S1.3.4    | Practice Summary     | Student | 3 days           | Session API                       |
| P2.1.1    | Parent Login         | Parent  | 2 days           | Backend auth API                  |
| P2.2.1    | Parent Dashboard     | Parent  | 7 days           | Analytics API, Charts library     |
| SH3.1.1   | 404 Error            | Shared  | 1 day            | -                                 |
| SH3.1.2   | 500 Error            | Shared  | 1 day            | -                                 |
| SH3.2.1   | Loading Screen       | Shared  | 1 day            | -                                 |

**Total Phase 1:** ~40 days (with parallelization: 2 weeks)

---

### Phase 2: Enhanced Features (Weeks 3-4) - P1 Priority

| Screen ID | Screen Name          | App     | Estimated Effort | Dependencies           |
| --------- | -------------------- | ------- | ---------------- | ---------------------- |
| S1.1.2    | Welcome & Onboarding | Student | 4 days           | Assessment API         |
| S1.4.1    | Progress Dashboard   | Student | 5 days           | Progress API, Charts   |
| S1.5.1    | Student Profile      | Student | 3 days           | Profile API            |
| P2.1.2    | Parent Registration  | Parent  | 4 days           | Registration API       |
| P2.2.2    | Detailed Analytics   | Parent  | 6 days           | Advanced analytics API |
| P2.2.3    | Weekly Report        | Parent  | 4 days           | Reports API            |
| P2.3.1    | Student Management   | Parent  | 3 days           | Student settings API   |
| P2.5.1    | Account Settings     | Parent  | 3 days           | Settings API           |
| P2.5.2    | AI Transparency      | Parent  | 4 days           | AI decision logs API   |

**Total Phase 2:** ~36 days (with parallelization: 2 weeks)

---

### Phase 3: Polish & Advanced (Weeks 5-6) - P2 Priority

| Screen ID | Screen Name       | App     | Estimated Effort | Dependencies      |
| --------- | ----------------- | ------- | ---------------- | ----------------- |
| S1.4.2    | Achievements      | Student | 4 days           | Achievements API  |
| S1.5.2    | Help & Tutorial   | Student | 3 days           | Content API       |
| P2.3.2    | Multiple Students | Parent  | 3 days           | Multi-student API |
| P2.4.1    | Messages          | Parent  | 4 days           | Messaging API     |
| P2.4.2    | Help Center       | Parent  | 3 days           | Support API       |
| SH3.1.3   | Offline Mode      | Shared  | 4 days           | Service worker    |
| SH3.1.4   | Maintenance       | Shared  | 2 days           | -                 |
| SH3.2.2   | Splash Screen     | Shared  | 1 day            | -                 |

**Total Phase 3:** ~24 days (with parallelization: 1.5 weeks)

---

## 6. Technical Components Mapping

### 6.1 Angular Component Structure

```
apps/
├── student-app/
│   └── src/
│       └── app/
│           ├── features/
│           │   ├── auth/
│           │   │   ├── login/
│           │   │   │   ├── student-login.component.ts
│           │   │   │   ├── student-login.component.html
│           │   │   │   ├── student-login.component.scss
│           │   │   │   └── student-login.component.spec.ts
│           │   │   └── onboarding/
│           │   │       └── welcome/
│           │   ├── dashboard/
│           │   │   ├── student-dashboard/
│           │   │   ├── topic-selection/
│           │   │   └── components/
│           │   │       ├── quick-actions-card/
│           │   │       ├── recommended-topics/
│           │   │       └── progress-summary/
│           │   ├── practice/
│           │   │   ├── question-practice/
│           │   │   ├── feedback-correct/
│           │   │   ├── feedback-incorrect/
│           │   │   ├── practice-summary/
│           │   │   └── components/
│           │   │       ├── question-card/
│           │   │       ├── answer-options/
│           │   │       ├── virtual-keypad/
│           │   │       ├── hint-modal/
│           │   │       └── progress-header/
│           │   ├── progress/
│           │   │   ├── progress-dashboard/
│           │   │   └── components/
│           │   │       ├── metrics-card/
│           │   │       ├── topic-progress-grid/
│           │   │       ├── activity-timeline/
│           │   │       └── learning-calendar/
│           │   ├── achievements/
│           │   │   ├── badge-gallery/
│           │   │   ├── achievement-details/
│           │   │   └── celebration-modal/
│           │   └── profile/
│           │       ├── student-profile/
│           │       └── settings/
│           ├── shared/
│           │   ├── components/
│           │   │   ├── navigation/
│           │   │   │   ├── bottom-nav/
│           │   │   │   └── header/
│           │   │   ├── loading-spinner/
│           │   │   └── error-message/
│           │   ├── services/
│           │   │   ├── auth.service.ts
│           │   │   ├── practice.service.ts
│           │   │   ├── progress.service.ts
│           │   │   └── achievements.service.ts
│           │   └── models/
│           │       ├── question.model.ts
│           │       ├── session.model.ts
│           │       └── student.model.ts
│           └── core/
│               ├── guards/
│               ├── interceptors/
│               └── state/
│
└── parent-app/
    └── src/
        └── app/
            ├── features/
            │   ├── auth/
            │   │   ├── login/
            │   │   └── registration/
            │   ├── dashboard/
            │   │   ├── parent-dashboard/
            │   │   └── components/
            │   │       ├── metrics-row/
            │   │       ├── performance-chart/
            │   │       ├── topic-breakdown/
            │   │       ├── focus-areas/
            │   │       ├── ai-insights-card/
            │   │       └── recent-activity/
            │   ├── analytics/
            │   │   ├── detailed-analytics/
            │   │   ├── weekly-report/
            │   │   └── components/
            │   │       ├── time-analysis/
            │   │       ├── topic-mastery/
            │   │       ├── learning-patterns/
            │   │       └── comparative-analysis/
            │   ├── students/
            │   │   ├── student-profile/
            │   │   ├── multiple-students/
            │   │   └── student-settings/
            │   ├── communication/
            │   │   ├── messages/
            │   │   └── notifications/
            │   └── settings/
            │       ├── account-settings/
            │       ├── ai-transparency/
            │       └── help-center/
            ├── shared/
            │   └── (similar to student-app)
            └── core/
                └── (similar to student-app)
```

### 6.2 MDB 5 Component Usage Matrix

| Screen            | MDB Components Used                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------ |
| Student Dashboard | `mdb-card`, `mdb-btn`, `mdb-progress`, `mdb-carousel`, `mdb-badge`, `mdb-chart`            |
| Topic Selection   | `mdb-card`, `mdb-btn`, `mdb-progress`, `mdb-tooltip`, `mdb-badge`, `mdb-tabs`              |
| Question Practice | `mdb-card`, `mdb-btn`, `mdb-progress`, `mdb-form-control`, `mdb-modal`, `mdb-tooltip`      |
| Feedback Modals   | `mdb-modal`, `mdb-card`, `mdb-btn`, `mdb-badge`, `mdb-alert`                               |
| Parent Dashboard  | `mdb-card`, `mdb-chart`, `mdb-table`, `mdb-select`, `mdb-badge`, `mdb-btn`, `mdb-carousel` |
| Analytics         | `mdb-chart`, `mdb-table`, `mdb-datepicker`, `mdb-tabs`, `mdb-select`                       |
| Settings          | `mdb-form`, `mdb-switch`, `mdb-select`, `mdb-range`, `mdb-btn`                             |

### 6.3 API Endpoints Required

```typescript
// Authentication
POST   /api/auth/student/login
POST   /api/auth/parent/login
POST   /api/auth/parent/register
POST   /api/auth/logout
POST   /api/auth/refresh

// Students
GET    /api/students/:id
GET    /api/students/:id/dashboard
GET    /api/students/:id/profile
PUT    /api/students/:id/profile
PUT    /api/students/:id/settings
GET    /api/students/:id/recommendations
GET    /api/students/:id/progress/summary
GET    /api/students/:id/progress/topics
GET    /api/students/:id/sessions/history
GET    /api/students/:id/achievements
GET    /api/students/:id/achievements/progress

// Topics
GET    /api/topics?subject={subject}&grade={grade}
GET    /api/topics/:id

// Practice
POST   /api/practice/sessions
GET    /api/practice/sessions/:sessionId
GET    /api/practice/sessions/:sessionId/questions/:index
POST   /api/practice/sessions/:sessionId/answers
GET    /api/practice/sessions/:sessionId/summary
GET    /api/practice/questions/:id/hints
GET    /api/practice/questions/:id/similar

// Progress & Analytics
GET    /api/progress/student/:id
GET    /api/analytics/student/:id
GET    /api/analytics/benchmarks?grade={grade}
GET    /api/analytics/predictions/:studentId

// Parents
GET    /api/parents/:id/dashboard
GET    /api/parents/:id/settings
PUT    /api/parents/:id/settings
GET    /api/parents/:id/students

// Reports
GET    /api/reports/weekly/:studentId
POST   /api/reports/generate
POST   /api/reports/export

// AI
GET    /api/ai/settings/:parentId
PUT    /api/ai/settings/:parentId
GET    /api/ai/decisions/:studentId
POST   /api/ai/feedback

// Achievements
GET    /api/achievements
GET    /api/achievements/:id

// Notifications
GET    /api/notifications/:userId
PUT    /api/notifications/:id/read
```

---

## 7. User Story Templates

### Student App User Stories

```gherkin
Feature: Student Dashboard
  As a Grade 3 student
  I want to see my learning progress and choose what to practice
  So that I can continue learning and stay motivated

Scenario: View daily dashboard
  Given I am logged in as a student
  When I navigate to the dashboard
  Then I should see my current streak
  And I should see recommended topics
  And I should see my progress toward daily goals
  And I should be able to continue my last session

Scenario: Start practice from dashboard
  Given I am on the student dashboard
  When I click on a recommended topic
  Then I should be taken to the question practice screen
  And practice session should begin

---

Feature: Question Practice
  As a student
  I want to answer questions and get immediate feedback
  So that I can learn and improve my math skills

Scenario: Answer question correctly
  Given I am in a practice session
  When I select the correct answer
  And I submit my answer
  Then I should see a celebration feedback modal
  And I should see an explanation of the solution
  And I should earn points
  And I can proceed to the next question

Scenario: Answer question incorrectly
  Given I am in a practice session
  When I select an incorrect answer
  And I submit my answer
  Then I should see supportive feedback
  And I should see the correct answer
  And I should see step-by-step explanation
  And I can choose to try again or continue
```

### Parent App User Stories

```gherkin
Feature: Parent Dashboard
  As a parent
  I want to see my child's learning progress
  So that I can support their education effectively

Scenario: View weekly progress
  Given I am logged in as a parent
  When I navigate to the dashboard
  Then I should see questions answered this week
  And I should see overall accuracy
  And I should see topic performance breakdown
  And I should see AI-generated insights

Scenario: Drill into topic performance
  Given I am viewing the parent dashboard
  When I click on a specific topic
  Then I should see detailed analytics for that topic
  And I should see questions answered
  And I should see common mistakes
  And I should see recommendations
```

---

## 8. Design System & Style Guide

### 8.1 Color Palette

```scss
// Primary Colors
$primary-blue: #2196f3;
$primary-blue-dark: #1976d2;

// Status Colors
$success-green: #4caf50;
$warning-orange: #ff9800;
$error-red: #f44336;
$info-cyan: #00bcd4;

// Neutral Colors
$gray-50: #fafafa;
$gray-100: #f5f5f5;
$gray-200: #eeeeee;
$gray-300: #e0e0e0;
$gray-400: #bdbdbd;
$gray-500: #9e9e9e;
$gray-600: #757575;
$gray-700: #616161;
$gray-800: #424242;
$gray-900: #212121;

// Achievement Colors
$gold: #ffc107;
$silver: #9e9e9e;
$bronze: #ff6f00;
```

### 8.2 Typography

```scss
// Font Families
$font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
$font-family-rounded: 'Comic Neue', 'Arial Rounded MT Bold', sans-serif; // Student app
$font-family-dyslexic: 'OpenDyslexic', sans-serif; // Accessibility

// Font Sizes
$font-size-xs: 12px;
$font-size-sm: 14px;
$font-size-base: 16px;
$font-size-lg: 20px;
$font-size-xl: 24px;
$font-size-2xl: 32px;
$font-size-3xl: 48px;

// Student app - larger for readability
$student-font-size-base: 18px;
$student-font-size-lg: 24px;
$student-font-size-xl: 32px;
```

### 8.3 Spacing

```scss
$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 16px;
$spacing-lg: 24px;
$spacing-xl: 32px;
$spacing-2xl: 48px;
$spacing-3xl: 64px;
```

### 8.4 Animations

```scss
// Durations
$duration-fast: 150ms;
$duration-base: 300ms;
$duration-slow: 500ms;

// Easings
$ease-out: cubic-bezier(0.4, 0, 0.2, 1);
$ease-in: cubic-bezier(0.4, 0, 1, 1);
$ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

---

## 9. Accessibility Requirements

### 9.1 WCAG 2.1 Compliance (AA Minimum)

- Color contrast: 4.5:1 for normal text, 3:1 for large text
- Keyboard navigation: All features accessible via keyboard
- Focus indicators: Visible 3px outlines
- Screen reader support: ARIA labels on all interactive elements
- Alt text: All images and icons
- Form labels: Explicit labels for all inputs
- Error messages: Clear, associated with fields

### 9.2 Student-Specific Accessibility

- Touch targets: Minimum 60px for children
- Simplified language: Grade 3 reading level
- Visual aids: Available for all concepts
- Text-to-speech: Optional on all text
- Dyslexia-friendly font: Available option
- Reduced animations: User toggle
- High contrast mode: Available

### 9.3 Parent Dashboard Accessibility

- Data tables: Proper headers and structure
- Charts: Text alternatives provided
- Complex interactions: Keyboard accessible
- Mobile responsive: Works on all devices

---

## 10. Performance Requirements

### 10.1 Load Times

- Initial page load: <2 seconds
- Route navigation: <500ms
- API responses: <1 second (p95)
- Chart rendering: <1 second

### 10.2 Optimization Strategies

- Lazy loading: Route-based code splitting
- Image optimization: WebP format, responsive images
- Caching: Service worker for offline support
- Bundle size: <500KB main bundle
- Tree shaking: Remove unused code
- Minification: Production builds

---

## 11. Testing Requirements

### 11.1 Unit Tests

- Component logic: 80% coverage minimum
- Services: 90% coverage
- State management: 100% coverage
- Utility functions: 100% coverage

### 11.2 Integration Tests

- User flows: Login → Practice → Summary
- API integration: Mock responses
- State transitions: Navigation flows

### 11.3 E2E Tests

- Critical paths: Student practice flow, Parent dashboard
- Cross-browser: Chrome, Safari, Firefox
- Mobile devices: iPad, Android tablets

### 11.4 Accessibility Tests

- Automated: Axe, pa11y
- Manual: Screen reader testing
- Keyboard navigation: Full flow testing

---

## 12. Implementation Checklist

### Phase 1 Deliverables

- [ ] Student login screen
- [ ] Student dashboard
- [ ] Topic selection screen
- [ ] Question practice screen
- [ ] Feedback modals (correct/incorrect)
- [ ] Practice summary screen
- [ ] Parent login screen
- [ ] Parent dashboard
- [ ] Error screens (404, 500)
- [ ] Loading states

### Phase 2 Deliverables

- [ ] Student onboarding
- [ ] Student progress dashboard
- [ ] Student profile settings
- [ ] Parent registration
- [ ] Detailed analytics screen
- [ ] Weekly progress report
- [ ] Student profile management
- [ ] Parent account settings
- [ ] AI transparency screen

### Phase 3 Deliverables

- [ ] Achievements screen
- [ ] Help & tutorial screens
- [ ] Multiple students view
- [ ] Messages & notifications
- [ ] Help center
- [ ] Offline mode support
- [ ] Maintenance mode
- [ ] Splash screen

---

## 13. Next Steps

### For User Story Creation:

1. Use templates in Section 7
2. Reference specific screen IDs
3. Include acceptance criteria
4. Map to API endpoints (Section 6.3)
5. Estimate story points based on effort matrix (Section 5)

### For Component Implementation:

1. Follow component structure (Section 6.1)
2. Use MDB 5 components (Section 6.2)
3. Apply design system (Section 8)
4. Implement accessibility (Section 9)
5. Add tests (Section 11)

### For API Development:

1. Reference required endpoints (Section 6.3)
2. Ensure data requirements met (per screen)
3. Implement authentication/authorization
4. Add validation and error handling
5. Document API responses

---

**Document Status:** Ready for User Story Creation  
**Last Updated:** January 24, 2026  
**Review Required:** Product Team, Development Team, UX Team

---

This comprehensive catalog provides everything needed to begin implementation. Each screen specification includes:

- Clear purpose and requirements
- Technical component details
- MDB 5 implementation guidance
- API integration points
- Acceptance criteria
- Accessibility requirements
- Design specifications

Use this document to create detailed user stories and begin Angular component development following the best practices outlined in the architecture and PRD documents.
