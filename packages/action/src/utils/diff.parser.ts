export interface DiffFile {
    path: string;
    hunks: DiffHunk[];
}

export interface DiffHunk {
    header: string;
    lines: DiffLine[];
}

export interface DiffLine {
    type: 'ADD' | 'DEL' | 'CONTEXT';
    content: string;
    newLineNumber?: number; // The line number in the new file (for ADD/CONTEXT)
    oldLineNumber?: number; // The line number in the old file (for DEL/CONTEXT)
}

export class DiffParser {
    static parse(diff: string): DiffFile[] {
        const files: DiffFile[] = [];
        let currentFile: DiffFile | null = null;
        let currentHunk: DiffHunk | null = null;
        
        // Regex to match file headers
        // diff --git a/path/to/file b/path/to/file
        // +++ b/path/to/file
        const fileHeaderRegex = /^diff --git a\/(.*) b\/(.*)$/; // Escaped backslash for regex
        const newFileHeaderRegex = /^\+\+\+ b\/(.*)$/; // Escaped backslash for regex
        const hunkHeaderRegex = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/; // Escaped backslash for regex

        const lines = diff.split('\n');
        
        let oldLineCounter = 0;
        let newLineCounter = 0;

        for (const line of lines) {
            // Check for new file
            if (line.startsWith('diff --git')) {
                if (currentFile && currentHunk) {
                    currentFile.hunks.push(currentHunk);
                    currentHunk = null;
                }
                if (currentFile) {
                    files.push(currentFile);
                }

                const match = line.match(fileHeaderRegex);
                const filePath = match ? match[2] : 'unknown';
                currentFile = { path: filePath, hunks: [] };
                continue;
            }

            // Fallback file detection
            if (line.startsWith('+++ b/')) {
                const match = line.match(newFileHeaderRegex);
                if (match && currentFile && currentFile.path === 'unknown') {
                    currentFile.path = match[1];
                }
                continue;
            }

            // Hunk Header
            if (line.startsWith('@@')) {
                if (currentFile && currentHunk) {
                    currentFile.hunks.push(currentHunk);
                }

                const match = line.match(hunkHeaderRegex);
                if (match) {
                    // Group 3 is the start line of the new file
                    newLineCounter = parseInt(match[3], 10);
                    // Group 1 is the start line of the old file
                    oldLineCounter = parseInt(match[1], 10);
                    
                    currentHunk = {
                        header: line,
                        lines: []
                    };
                }
                continue;
            }

            // Content Lines
            if (currentHunk) {
                if (line.startsWith('+') && !line.startsWith('+++')) {
                    currentHunk.lines.push({
                        type: 'ADD',
                        content: line.substring(1),
                        newLineNumber: newLineCounter++
                    });
                } else if (line.startsWith('-') && !line.startsWith('---')) {
                    currentHunk.lines.push({
                        type: 'DEL',
                        content: line.substring(1),
                        oldLineNumber: oldLineCounter++
                    });
                } else if (line.charCodeAt(0) === 92) { // Corrected: Use charCodeAt for backslash check
                     // "No newline at end of file" - ignore
                     continue;
                } else {
                    // Context
                    if (!line.startsWith('diff') && !line.startsWith('index')) {
                         currentHunk.lines.push({
                            type: 'CONTEXT',
                            content: line.startsWith(' ') ? line.substring(1) : line,
                            newLineNumber: newLineCounter++,
                            oldLineNumber: oldLineCounter++
                        });
                    }
                }
            }
        }

        if (currentFile && currentHunk) {
            currentFile.hunks.push(currentHunk);
        }
        if (currentFile) {
            files.push(currentFile);
        }

        return files;
    }

    static formatForAI(files: DiffFile[]): string {
        let output = '';

        for (const file of files) {
            output += `File: ${file.path}\n`;
            for (const hunk of file.hunks) {
                output += `... (hunk header: ${hunk.header})\n`;
                for (const line of hunk.lines) {
                    if (line.type === 'ADD') {
                        output += `${line.newLineNumber} | + ${line.content}\n`;
                    } else if (line.type === 'DEL') {
                        output += `   | - ${line.content}\n`;
                    } else {
                        output += `${line.newLineNumber} |   ${line.content}\n`;
                    }
                }
            }
            output += '\n';
        }

        return output;
    }

    static getModifiedFilePaths(files: DiffFile[]): string[] {
        return files.map(file => file.path);
    }
}
