/**
 * Anthropic Claude provider.
 *
 * Messages API + tool_use 강제로 구조화된 JSON 응답 보장.
 * - 텍스트: user 메시지로 그대로 전달
 * - 이미지: source 객체({ type: 'base64', media_type, data })로 전달
 *
 * tool_choice를 'analyze_ingredients' 도구로 강제하면 모델이
 * 반드시 그 도구 input 스키마에 맞춰 응답한다 → JSON drift 최소화.
 *
 * Refs: SPEC.md §6 AI 프롬프트 (Provider별 출력 강제), 사전 점검 #1·#2
 */

import Anthropic from '@anthropic-ai/sdk';
import { type AIProvider, type AnalyzeInput } from './types';
import { ProviderError, normalizeError } from '../errors';
import { SYSTEM_PROMPT, buildTextUserMessage, buildImageUserMessage } from '../prompt';

const MODEL = 'claude-3-5-haiku-latest';
const TOOL_NAME = 'analyze_ingredients';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type ContentBlock =
  | { type: 'text'; text: string }
  | {
      type: 'image';
      source: { type: 'base64'; media_type: 'image/jpeg' | 'image/png' | 'image/webp'; data: string };
    };

const buildUserContent = (input: AnalyzeInput): ContentBlock[] => {
  if (input.kind === 'text') {
    return [{ type: 'text', text: buildTextUserMessage(input.ingredients) }];
  }
  return [
    { type: 'text', text: buildImageUserMessage() },
    {
      type: 'image',
      source: {
        type: 'base64',
        media_type: input.mimeType,
        data: input.base64,
      },
    },
  ];
};

/**
 * tool input schema — AnalysisResult zod와 동등한 구조.
 * Claude가 이 스키마에 맞춰 응답하도록 강제한다.
 *
 * 주의: 여기서는 JSON Schema 형식(zod 아님). zod 변환 라이브러리
 * 의존성을 피하고자 직접 정의. 필드가 schema.ts와 분기될 위험을
 * Vitest 통합 테스트에서 검증.
 */
const TOOL_INPUT_SCHEMA = {
  type: 'object' as const,
  properties: {
    schemaVersion: { type: 'string', enum: ['1'] },
    ingredients: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          koreanName: { type: 'string' },
          purpose: { type: 'string' },
          cautions: { type: 'array', items: { type: 'string' } },
          allergens: { type: 'array', items: { type: 'string' } },
          regulations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                region: { type: 'string', enum: ['KR', 'US_MoCRA', 'EU_CPNP'] },
                status: { type: 'string', enum: ['allowed', 'restricted', 'banned', 'unknown'] },
                note: { type: 'string' },
              },
              required: ['region', 'status'],
            },
          },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
        },
        required: ['name', 'purpose', 'cautions', 'allergens', 'regulations', 'confidence'],
      },
    },
    warnings: { type: 'array', items: { type: 'string' } },
    disclaimer: { type: 'string' },
  },
  required: ['schemaVersion', 'ingredients', 'disclaimer'],
};

export const claudeProvider: AIProvider<AnalyzeInput, unknown> = {
  name: 'claude',
  analyze: async (input) => {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new ProviderError('auth', 'ANTHROPIC_API_KEY 미설정');
    }

    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 4000,
        temperature: 0.2,
        system: SYSTEM_PROMPT,
        tools: [
          {
            name: TOOL_NAME,
            description: '화장품 성분 분석 결과를 구조화된 형식으로 반환',
            input_schema: TOOL_INPUT_SCHEMA,
          },
        ],
        tool_choice: { type: 'tool', name: TOOL_NAME },
        messages: [{ role: 'user', content: buildUserContent(input) }],
      });

      const toolUseBlock = response.content.find((block) => block.type === 'tool_use');
      if (!toolUseBlock || toolUseBlock.type !== 'tool_use') {
        throw new ProviderError('invalid_output', 'Claude가 tool_use 블록을 반환하지 않음');
      }

      // ai에서 source 필드를 채우지 않을 수 있으므로 보정
      return toolUseBlock.input;
    } catch (err) {
      throw normalizeError(err, 'claude');
    }
  },
};
