# Epic: Parent Dashboard

**Epic ID:** EP-PD-006  
**Priority:** P1 (High)  
**Sprint:** Sprint 3-4 (Days 9-14)  
**Status:** Ready for Development  
**Dependencies:** Progress Tracking (EP-PT-004), Evaluation System (EP-EV-002)

---

## Epic Overview

Create a comprehensive parent dashboard that provides transparent insights into their child's learning progress, achievements, and areas for improvement. This epic focuses on building trust through data transparency while providing actionable insights that support learning at home.

### Epic Goals

1. **Progress Transparency**: Provide clear, real-time visibility into child's learning progress
2. **Actionable Insights**: Deliver specific recommendations for supporting learning at home
3. **Engagement Tools**: Enable parents to motivate and celebrate their child's achievements
4. **Communication Bridge**: Facilitate productive conversations about mathematics learning
5. **Privacy Protection**: Ensure child data privacy while enabling parent oversight

---

## Business Value

**Current State (Pre-Epic):**

- ❌ No parent visibility into child's learning progress
- ❌ Limited engagement tools for family learning support
- ❌ No communication bridge between platform and home
- ❌ Missing opportunities for learning reinforcement

**Future State (Post-Epic):**

- ✅ Comprehensive parent dashboard with real-time progress insights
- ✅ Weekly automated progress reports via email/app
- ✅ Specific recommendations for home learning support
- ✅ Achievement celebrations shared between child and parent
- ✅ Privacy-compliant family learning ecosystem

### ROI Impact

- **Parent Satisfaction**: +65% through transparent progress reporting
- **Learning Reinforcement**: +40% improvement when parents are engaged
- **Platform Trust**: +50% through open communication and data transparency
- **Family Engagement**: +80% increase in mathematics conversations at home

---

## Technical Architecture

### Parent Dashboard Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Parent        │    │   Angular       │    │   Parent        │
│   Access        │───▶│   Parent App    │───▶│   Dashboard     │
│   (Web/Mobile)  │    │                 │    │   Service       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                         │
                              │                         ▼
                              │               ┌─────────────────┐
                              │               │   Progress      │
                              │               │   Analytics     │
                              │               │   Aggregator    │
                              │               └─────────────────┘
                              │                         │
                              │                         ▼
                              │               ┌─────────────────┐
                              │               │   Report        │
                              │               │   Generator     │
                              │               │  (Weekly        │
                              │               │   Summaries)    │
                              │               └─────────────────┘
                              │                         │
                              ▼                         │
                    ┌─────────────────┐                │
                    │    MongoDB      │◄───────────────┘
                    │  (Student       │
                    │   Progress +    │
                    │   Parent Data)  │
                    └─────────────────┘
```

### Core Components

- **Parent Authentication**: Secure access control and child linking
- **Progress Visualization**: Charts and insights for learning trends
- **Report Generator**: Automated weekly progress summaries
- **Recommendation Engine**: Personalized home learning suggestions

---

## Stories in Epic

### Story 01: Basic Parent Dashboard

**Story ID:** US-PD-001  
**Priority:** P1 (High)  
**Story Points:** 8  
**Status:** Ready for Development

Implement the core parent dashboard with real-time progress visualization, achievement displays, and overview of child's learning activity across mathematical topics.

**Key Deliverables:**

- Parent authentication and child account linking
- Real-time progress visualization dashboard
- Achievement and milestone display
- Learning activity timeline and insights

### Story 02: Weekly Progress Reports

**Story ID:** US-PD-002  
**Priority:** P2 (Medium)  
**Story Points:** 5  
**Status:** Ready for Development

Create automated weekly progress report generation with email delivery, highlighting key achievements, areas for improvement, and specific recommendations for home learning support.

**Key Deliverables:**

- Automated weekly report generation
- Email delivery system for progress reports
- Personalized learning recommendations
- Printable report format for offline review

---

## Success Criteria

### Technical Criteria

- [ ] Dashboard loads in <3 seconds with complete progress data
- [ ] Real-time updates within 5 minutes of student activity
- [ ] Weekly reports generated and delivered automatically
- [ ] Secure parent authentication with child account protection
- [ ] Mobile-responsive design for smartphone access

### Educational Criteria

- [ ] Progress insights align with NZ Mathematics curriculum standards
- [ ] Recommendations are specific and actionable for home support
- [ ] Achievement celebrations are meaningful and motivating
- [ ] Data presentations are accessible to parents with varying education levels

### User Experience Criteria

- [ ] 90% of parents can navigate dashboard without assistance
- [ ] Reports are clear and actionable within 2-minute reading time
- [ ] Mobile interface supports quick progress checks
- [ ] Privacy controls are clear and easily manageable

---

## Dependencies & Risks

### Critical Dependencies

- **EP-PT-004**: Progress Tracking (provides analytics data)
- **EP-EV-002**: Evaluation System (provides assessment insights)
- **Parent Authentication**: Secure access control system
- **Email Infrastructure**: Reliable delivery for progress reports

### Risk Mitigation

- **Privacy Risk**: Comprehensive data protection with parental controls
- **Engagement Risk**: User testing with diverse parent demographics
- **Technical Risk**: Robust backup systems for reliable report delivery
- **Educational Risk**: Expert review to ensure recommendations are pedagogically sound

---

## Technical Specifications

### Parent Dashboard Data Model

```typescript
interface ParentDashboard {
  parentId: string;
  childAccounts: StudentAccount[];
  currentView: DashboardView;
  preferences: ParentPreferences;
  lastAccess: Date;
}

interface StudentAccount {
  studentId: string;
  name: string;
  grade: GradeLevel;
  currentProgress: ProgressSummary;
  recentAchievements: Achievement[];
  learningStreak: number;
  nextMilestone: Milestone;
}

interface ProgressSummary {
  totalQuestionsAttempted: number;
  accuracyRate: number;
  topicsCompleted: TopicProgress[];
  timeSpentThisWeek: number;
  improvementTrend: TrendDirection;
  strongAreas: string[];
  growthAreas: string[];
}

interface WeeklyReport {
  weekEnding: Date;
  studentName: string;
  progressHighlights: ProgressHighlight[];
  achievementsEarned: Achievement[];
  homeRecommendations: LearningRecommendation[];
  nextWeekGoals: LearningGoal[];
  parentMessage: string;
}
```

### Visualization Requirements

- **Progress Charts**: Weekly progress trends with clear visual indicators
- **Achievement Display**: Visual badge system with unlock dates
- **Topic Mastery**: Color-coded topic completion status
- **Time Analysis**: Learning session duration and frequency patterns

---

## Privacy & Security Framework

### Data Protection

1. **Parent Authentication**

   - Multi-factor authentication options
   - Secure password requirements
   - Session management with automatic logout

2. **Child Data Access**

   - Parents can only access their own child's data
   - Clear audit trail of parent dashboard access
   - Option to export child's learning data

3. **Privacy Controls**
   - Parents can control data sharing preferences
   - Clear explanation of what data is collected and why
   - Easy process for data deletion or account closure

### COPPA Compliance

- **Parental Consent**: Clear consent process for data collection
- **Data Minimization**: Collect only educationally necessary information
- **Transparent Practices**: Plain language privacy policy
- **Access Rights**: Parents can review and delete child's data

---

## Report Content Design

### Weekly Progress Report Structure

1. **Learning Summary**

   - Questions attempted and accuracy rate
   - Time spent learning this week
   - Learning streak status
   - Comparison to previous week

2. **Achievement Highlights**

   - New badges earned
   - Milestones reached
   - Areas of improvement
   - Celebration of effort and growth

3. **Learning Insights**

   - Topics where child excels
   - Areas needing additional support
   - Learning pattern observations
   - Curriculum alignment notes

4. **Home Learning Recommendations**
   - Specific activities to reinforce learning
   - Real-world math applications
   - Questions parents can ask to support understanding
   - Resources for additional practice

### Communication Tone

- **Positive and Supportive**: Focus on growth and effort
- **Specific and Actionable**: Concrete suggestions for support
- **Educational**: Help parents understand their child's learning journey
- **Encouraging**: Celebrate progress while identifying growth opportunities

---

## Integration Points

### With Progress Tracking (Epic 04)

- Receives real-time student progress data
- Displays achievement and milestone information
- Provides analytics for report generation

### With Student Interface (Epic 05)

- Shows what activities child has completed
- Provides context for learning experiences
- Supports parent-child conversations about platform usage

### With AI Enhancement (Epic 03)

- Leverages AI insights for personalized recommendations
- Uses learning analytics for improved reporting
- Supports adaptive learning through parent feedback

---

## Parent Engagement Strategy

### Onboarding Experience

1. **Account Setup**: Simple parent account creation and child linking
2. **Dashboard Tour**: Guided introduction to key features
3. **First Report**: Immediate access to current progress snapshot
4. **Support Resources**: Links to help documentation and support

### Ongoing Engagement

- **Weekly Reports**: Consistent communication rhythm
- **Achievement Notifications**: Real-time celebration of milestones
- **Learning Tips**: Regular suggestions for home math activities
- **Progress Celebrations**: Monthly summaries of growth and success

---

**Epic Owner**: Parent Experience Designer  
**Collaborators**: Educational Consultant, Privacy Officer, Child Development Specialist  
**Estimated Completion**: Day 14 (Sprint 4)  
**Review Gate**: Parent user testing and privacy compliance review
