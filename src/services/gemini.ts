/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { Question } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateEnhancedQuiz(rawText: string): Promise<Partial<Question>[]> {
  const prompt = `
    Dưới đây là nội dung thô từ một tài liệu Word chứa các câu hỏi và đáp án (có thể là câu hỏi trắc nghiệm hoặc tự luận ngắn). 
    Hãy trích xuất các câu hỏi và đáp án đúng. 
    Với mỗi câu hỏi, hãy tạo thêm 3 đáp án sai (distractors) hợp lý để tạo thành câu hỏi trắc nghiệm có 4 lựa chọn.
    Đồng thời đưa ra lời giải thích tại sao đáp án gốc là đúng.
    Trả về kết quả dưới dạng JSON.

    Nội dung:
    ${rawText}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING, description: "Nội dung câu hỏi" },
              correctAnswer: { type: Type.STRING, description: "Đáp án đúng duy nhất" },
              distractors: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "3 đáp án sai" 
              },
              explanation: { type: Type.STRING, description: "Giải thích ngắn gọn tại sao đáp án đó đúng" }
            },
            required: ["question", "correctAnswer", "distractors", "explanation"]
          }
        }
      }
    });

    const result = JSON.parse(response.text || "[]");
    return result;
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
}
