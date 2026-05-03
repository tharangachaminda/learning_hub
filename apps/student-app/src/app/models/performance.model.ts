export interface DailyProgressSummary {
  studentId: string;
  date: string;
  totalQuestionsAttempted: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracyPercentage: number;
  timeSpentMinutes: number;
  streakDays: number;
  encouragementMessage: string;
}

export interface WeeklyProgressSummary {
  studentId: string;
  weekStartDate: string;
  weekEndDate: string;
  totalQuestionsAttempted: number;
  totalCorrectAnswers: number;
  weeklyAccuracyPercentage: number;
  totalTimeSpentMinutes: number;
  improvementPercentage: number;
  dailyBreakdown: DailyProgressSummary[];
}
