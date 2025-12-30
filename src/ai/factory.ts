import { AIProvider } from './provider.interface';
import { OpenAIProvider } from './openai.provider';

export enum AIProviderType {
    OPENAI = 'openai',
}

export function createAIProvider(apiKey: string, provider: AIProviderType = AIProviderType.OPENAI): AIProvider {
    return new OpenAIProvider(apiKey);
}