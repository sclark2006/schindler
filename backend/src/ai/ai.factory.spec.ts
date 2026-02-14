
import { Test, TestingModule } from '@nestjs/testing';
import { AiProviderFactory } from './ai.factory';
import { GeminiProvider } from './providers/gemini.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { OllamaProvider } from './providers/ollama.provider';

describe('AiProviderFactory', () => {
    let factory: AiProviderFactory;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [AiProviderFactory],
        }).compile();

        factory = module.get<AiProviderFactory>(AiProviderFactory);
    });

    it('should be defined', () => {
        expect(factory).toBeDefined();
    });

    it('should create OpenAIProvider', () => {
        const config = { provider: 'openai' as const, apiKey: 'test-key', model: 'gpt-4' };
        const provider = factory.createProvider(config);
        expect(provider).toBeInstanceOf(OpenAIProvider);
    });

    it('should create GeminiProvider', () => {
        const config = { provider: 'gemini' as const, apiKey: 'test-key', model: 'gemini-pro' };
        const provider = factory.createProvider(config);
        expect(provider).toBeInstanceOf(GeminiProvider);
    });

    it('should create OllamaProvider', () => {
        const config = { provider: 'ollama' as const, baseUrl: 'http://localhost:11434', model: 'llama3' };
        const provider = factory.createProvider(config);
        expect(provider).toBeInstanceOf(OllamaProvider);
    });

    it('should throw error for unsupported provider', () => {
        const config = { provider: 'invalid' as any };
        expect(() => factory.createProvider(config)).toThrow('Unsupported AI Provider');
    });

    it('should throw error if apiKey missing for OpenAI', () => {
        const config = { provider: 'openai' as const };
        expect(() => factory.createProvider(config)).toThrow('API Key required');
    });

    it('should throw error if apiKey missing for Gemini', () => {
        const config = { provider: 'gemini' as const };
        expect(() => factory.createProvider(config)).toThrow('API Key required');
    });
});
