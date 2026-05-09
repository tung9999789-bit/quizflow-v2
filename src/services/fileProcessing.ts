/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import mammoth from "mammoth";
import * as XLSX from "xlsx";
import { Question } from "../types";

export async function extractTextFromWord(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

export function exportQuizToExcel(quizTitle: string, questions: Question[]) {
  const data = questions.map((q, index) => ({
    "STT": index + 1,
    "Câu hỏi": q.question,
    "Đáp án đúng": q.correctAnswer,
    "Đáp án sai 1": q.distractors[0] || "",
    "Đáp án sai 2": q.distractors[1] || "",
    "Đáp án sai 3": q.distractors[2] || "",
    "Giải thích": q.explanation
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Questions");
  
  XLSX.writeFile(workbook, `${quizTitle || 'Quiz'}_questions.xlsx`);
}

export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}
