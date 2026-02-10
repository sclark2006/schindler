export interface IAnalysisAdapter {
    /**
     * Validates if the content format is supported by this adapter
     * @param content Raw content (string or buffer)
     */
    validate(content: string): boolean;

    /**
     * Parses the content and returns structured analysis data
     * @param content Raw content
     */
    parse(content: string): Promise<any>;
}
