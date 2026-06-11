/**
 * OpenAI Vision provider.
 *
 * 텍스트와 이미지를 같은 chat.completions API로 처리한다.
 * - 텍스트: user 메시지로 그대로 전달
 * - 이미지: data URL(`data:<mime>;base64,<data>`)로 조립해 image_url 타입으로 전달
 *
 * 응답은 JSON Object 모드로 강제(response_format)해 다른 텍스트가
 * 섞이지 않도록 한다. 그래도 zod 검증은 fallback의 validate 콜백에서
 * 별도 진행되어 invalid_output 폴백 트리거 역할을 한다.
 *
 * Refs: SPEC.md §6 AI 프롬프트 (Provider별 출력 강제), 사전 점검 #1·#2
 */

import OpenAI from 'openai';
import { type AIProvider, type AnalyzeInput } from './types';
import { ProviderError, normalizeError } from '../errors';
import { SYSTEM_PROMPT, buildTextUserMessage, buildImageUserMessage } from '../prompt';

const MODEL = 'gpt-4o';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type UserContent =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

const buildUserContent = (input: AnalyzeInput): UserContent[] => {
  if (input.kind === 'text') {
    return [{ type: 'text', text: buildTextUserMessage(input.ingredients) }];
  }
  // image: data URL로 변환
  const dataUrl = `data:${input.mimeType};base64,${input.base64}`;
  return [
    { type: 'text', text: buildImageUserMessage() },
    { type: 'image_url', image_url: { url: dataUrl } },
  ];
};

export const openaiProvider: AIProvider<AnalyzeInput, unknown> = {
  name: 'openai',
  analyze: async (input) => {
    if (!process.env.OPENAI_API_KEY) {
      throw new ProviderError('auth', 'OPENAI_API_KEY 미설정');
    }

    try {
      const completion = await client.chat.completions.create({
        model: MODEL,
        temperature: 0.2,
        max_tokens: 8000,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserContent(input) },
        ],
      });

      const raw = completion.choices[0]?.message.content;
      if (!raw) {
        throw new ProviderError('invalid_output', 'OpenAI 응답이 비어있음');
      }

      try {
        return JSON.parse(raw);
      } catch (parseErr) {
        throw new ProviderError('invalid_output', `JSON parse 실패: ${(parseErr as Error).message}`);
      }
    } catch (err) {
      throw normalizeError(err, 'openai');
    }
  },
};
