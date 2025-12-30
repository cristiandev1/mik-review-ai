import { AIProvider } from './provider.interface';
import { OpenAIProvider } from './openai.provider';
import { GeminiProvider } from './gemini.provider';

export enum AIProviderType {
    OPENAI = 'openai',
    GEMINI = 'gemini',
}

export function createAIProvider(type: AIProviderType, apiKey: string): AIProvider {
    switch (type) {
        case AIProviderType.OPENAI:
            return new OpenAIProvider(apiKey);
        case AIProviderType.GEMINI:
            return new GeminiProvider(apiKey);
        default:
            throw new Error(`Unsupported AI provider: ${type}`);
    }
}
