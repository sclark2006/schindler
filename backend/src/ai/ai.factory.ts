
import { Injectable } from '@nestjs/common';
import { GenAIProvider } from './providers/gen-ai.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { OllamaProvider } from './providers/ollama.provider';

export interface AiConfig {
    provider: 'openai' | 'gemini' | 'ollama';
    model?: string;
    apiKey?: string;
    baseUrl?: string;
}

@Injectable()
export class AiProviderFactory {
    createProvider(config: AiConfig): GenAIProvider {
        switch (config.provider) {
            case 'openai':
                if (!config.apiKey) throw new Error('API Key required for OpenAI');
                return new OpenAIProvider(config.apiKey, config.model);
            case 'gemini':
                if (!config.apiKey) throw new Error('API Key required for Gemini');
                return new GeminiProvider(config.apiKey, config.model);
            case 'ollama':
                return new OllamaProvider(config.baseUrl, config.model);
            default:
                throw new Error(`Unsupported AI Provider: ${config.provider}`);
        }
    }
}
