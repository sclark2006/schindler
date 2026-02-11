
export interface GenAIProvider {
    /**
     * Generates a text response based on the prompt.
     * @param prompt The input text for the LLM.
     * @returns The generated text response.
     */
    generateResponse(prompt: string): Promise<string>;
}
