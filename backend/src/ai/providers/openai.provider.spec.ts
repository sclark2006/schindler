
import { OpenAIProvider } from './openai.provider';
import OpenAI from 'openai';

jest.mock('openai');

describe('OpenAIProvider', () => {
    let provider: OpenAIProvider;
    let mockOpenAIInstance: any;

    beforeEach(() => {
        // Clear mocks
        (OpenAI as unknown as jest.Mock).mockClear();

        // Setup mock instance
        mockOpenAIInstance = {
            chat: {
                completions: {
                    create: jest.fn(),
                },
            },
        };
        (OpenAI as unknown as jest.Mock).mockImplementation(() => mockOpenAIInstance);

        provider = new OpenAIProvider('test-key', 'gpt-4');
    });

    it('should be defined', () => {
        expect(provider).toBeDefined();
    });

    it('should call openai.chat.completions.create with correct params', async () => {
        const prompt = 'Test prompt';
        const expectedResponse = 'Generated Code';

        mockOpenAIInstance.chat.completions.create.mockResolvedValue({
            choices: [{ message: { content: expectedResponse } }],
        });

        const result = await provider.generateResponse(prompt);

        expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalledWith({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
        });
        expect(result).toBe(expectedResponse);
    });

    it('should return empty string if no content', async () => {
        mockOpenAIInstance.chat.completions.create.mockResolvedValue({
            choices: [{ message: { content: null } }],
        });
        const result = await provider.generateResponse('test');
        expect(result).toBe('');
    });
});
