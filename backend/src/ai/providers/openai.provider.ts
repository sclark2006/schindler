
import { GenAIProvider } from './gen-ai.provider';
import OpenAI from 'openai';

export class OpenAIProvider implements GenAIProvider {
    private openai: OpenAI;

    constructor(apiKey: string, private model: string = 'gpt-4o') {
        this.openai = new OpenAI({ apiKey });
    }

    async generateResponse(prompt: string): Promise<string> {
        try {
            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: [{ role: 'user', content: prompt }],
            });
            return response.choices[0]?.message?.content || '';
        } catch (error) {
            console.error('OpenAI API Error:', error);
            throw new Error('Failed to generate response from OpenAI.');
        }
    }
}
