
import { GenAIProvider } from './gen-ai.provider';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiProvider implements GenAIProvider {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor(apiKey: string, modelName: string = 'gemini-1.5-pro') {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: modelName });
    }

    async generateResponse(prompt: string): Promise<string> {
        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Gemini API Error:', error);
            throw new Error('Failed to generate response from Gemini.');
        }
    }
}
