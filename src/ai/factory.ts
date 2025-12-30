import { AIProvider } from './provider.interface';
import { GeminiProvider } from './gemini.provider';

export enum AIProviderType {
    GEMINI = 'gemini',
}

export function createAIProvider(apiKey: string): AIProvider {
    return new GeminiProvider(apiKey);
}