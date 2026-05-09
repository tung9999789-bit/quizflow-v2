/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Question {
  id: string;
  question: string;
  correctAnswer: string;
  distractors: string[]; // 3 other choices
  options: string[]; // All 4 choices shuffled
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  questions: Question[];
  createdAt: number;
}

export interface QuizAttempt {
  userName: string;
  quizId: string;
  score: number;
  total: number;
  answers: { [questionId: string]: string };
  timestamp: number;
}
