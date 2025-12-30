import { AIProvider } from './provider.interface';
import { OpenAIProvider } from './openai.provider';

export enum AIProviderType {
    OPENAI = 'openai',
}

export function createAIProvider(type: AIProviderType, apiKey: string): AIProvider {
    switch (type) {
        case AIProviderType.OPENAI:
            return new OpenAIProvider(apiKey);
        default:
            throw new Error(`Unsupported AI provider: ${type}`);
    }
}
