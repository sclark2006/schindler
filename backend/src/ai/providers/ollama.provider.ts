
import { GenAIProvider } from './gen-ai.provider';
import axios from 'axios';

export class OllamaProvider implements GenAIProvider {
    constructor(
        private baseUrl: string = 'http://localhost:11434',
        private model: string = 'llama3',
    ) { }

    async generateResponse(prompt: string): Promise<string> {
        try {
            const response = await axios.post(`${this.baseUrl}/api/generate`, {
                model: this.model,
                prompt: prompt,
                stream: false,
            });
            return response.data.response || '';
        } catch (error) {
            console.error('Ollama API Error:', error);
            throw new Error('Failed to generate response from Ollama.');
        }
    }
}
