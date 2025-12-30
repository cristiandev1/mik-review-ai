import { AIProvider } from './provider.interface';
import { GeminiProvider } from './gemini.provider';
import { OpenAIProvider } from './openai.provider';

export enum AIProviderType {
    GEMINI = 'gemini',
    OPENAI = 'openai',
}

export function createAIProvider(apiKey: string, provider: AIProviderType = AIProviderType.OPENAI): AIProvider {
    switch (provider) {
        case AIProviderType.GEMINI:
            return new GeminiProvider(apiKey);
        case AIProviderType.OPENAI:
            return new OpenAIProvider(apiKey);
        default:
            return new OpenAIProvider(apiKey);
    }
}