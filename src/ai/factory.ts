import { AIProvider } from './provider.interface';
import { DeepSeekProvider } from './deepseek.provider';

export enum AIProviderType {
    DEEPSEEK = 'deepseek',
}

export function createAIProvider(apiKey: string, provider: AIProviderType = AIProviderType.DEEPSEEK): AIProvider {
    return new DeepSeekProvider(apiKey);
}