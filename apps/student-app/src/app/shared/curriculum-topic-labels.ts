import { QUESTION_TYPE_DISPLAY_NAMES } from '../features/practice/question-generator/models/curriculum.data';

export function formatCurriculumTopicLabel(topicValue: string): string {
  const trimmedTopic = topicValue.trim();

  if (!trimmedTopic) {
    return '';
  }

  return (
    QUESTION_TYPE_DISPLAY_NAMES[trimmedTopic] ??
    trimmedTopic
      .split('_')
      .join(' ')
      .toLowerCase()
      .replace(/\b\w/g, (letter: string) => letter.toUpperCase())
  );
}

export function formatCurriculumSubjectLabel(subjectValue: string): string {
  const normalizedSubject = subjectValue.trim().toLowerCase();

  if (!normalizedSubject) {
    return '';
  }

  if (normalizedSubject === 'mathematics') {
    return 'Mathematics';
  }

  return normalizedSubject.replace(/\b\w/g, (letter: string) =>
    letter.toUpperCase()
  );
}
