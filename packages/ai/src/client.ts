import Anthropic from '@anthropic-ai/sdk';

const claude = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface AiCallOptions {
    model?: string;
    maxTokens?: number;
    module?: string;
    orgId?: string;
}

export interface AiCallResult {
    text: string;
    inputTokens: number;
    outputTokens: number;
    durationMs: number;
}

const DEFAULT_MODEL = 'claude-opus-4-5';

/**
 * Standard text call to Claude
 */
export async function callClaude(
    system: string,
    userMessage: string,
    options: AiCallOptions = {}
): Promise<AiCallResult> {
    const { model = DEFAULT_MODEL, maxTokens = 2048 } = options;
    const startTime = Date.now();

    try {
        const response = await claude.messages.create({
            model,
            max_tokens: maxTokens,
            system,
            messages: [{ role: 'user', content: userMessage }],
        });

        const text =
            response.content[0].type === 'text' ? response.content[0].text : '';

        return {
            text,
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
            durationMs: Date.now() - startTime,
        };
    } catch (error) {
        console.error('[AI] Claude call failed:', error);
        throw error;
    }
}

/**
 * Vision call to Claude (image + text)
 */
export async function callClaudeVision(
    imageBase64: string,
    prompt: string,
    options: AiCallOptions = {}
): Promise<AiCallResult> {
    const { model = DEFAULT_MODEL, maxTokens = 1024 } = options;
    const startTime = Date.now();

    try {
        const response = await claude.messages.create({
            model,
            max_tokens: maxTokens,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: 'image/jpeg',
                                data: imageBase64,
                            },
                        },
                        { type: 'text', text: prompt },
                    ],
                },
            ],
        });

        const text =
            response.content[0].type === 'text' ? response.content[0].text : '';

        return {
            text,
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
            durationMs: Date.now() - startTime,
        };
    } catch (error) {
        console.error('[AI] Claude Vision call failed:', error);
        throw error;
    }
}

/**
 * Streaming call to Claude (for chatbot)
 */
export async function* streamClaude(
    system: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    options: AiCallOptions = {}
) {
    const { model = DEFAULT_MODEL, maxTokens = 2048 } = options;

    const stream = claude.messages.stream({
        model,
        max_tokens: maxTokens,
        system,
        messages,
    });

    for await (const chunk of stream) {
        if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
        ) {
            yield chunk.delta.text;
        }
    }
}

/**
 * Parse JSON from Claude response safely
 */
export function parseClaudeJson<T>(text: string): T | null {
    try {
        // Strip markdown code blocks if present
        const cleaned = text
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();
        return JSON.parse(cleaned) as T;
    } catch {
        console.error('[AI] Failed to parse JSON from Claude response:', text);
        return null;
    }
}

export { claude };
