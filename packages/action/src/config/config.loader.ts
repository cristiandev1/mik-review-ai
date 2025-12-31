import * as fs from 'fs';
import * as path from 'path';

export class ConfigLoader {
    static loadRules(filePath: string): string {
        const absolutePath = path.resolve(process.cwd(), filePath);
        
        if (!fs.existsSync(absolutePath)) {
            throw new Error(`Rules file not found at: ${absolutePath}`);
        }

        return fs.readFileSync(absolutePath, 'utf-8');
    }
}
