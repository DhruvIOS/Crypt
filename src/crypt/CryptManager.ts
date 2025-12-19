import * as vscode from 'vscode';
import * as path from 'path';

//1. Define the shape of a buried code snippet

export interface BuriedCode{
    id: string;  //unique ID
    code: string;   //The actual code content
    filePath: string;  //Where it came from
    fileName: string;  //Readability for the UI
    line: number;  //Original line number
    timestamp: number;  //When it was buried
}

export class CryptManager{
    private storage: vscode.Memento;
    private readonly STORAGE_KEY = 'crypt.buriedCode';

    constructor(storage: vscode.Memento){
        this.storage = storage;
    }


    //2. Save a ne snippet

// Update buryCode to accept 3 specific arguments
async buryCode(filePath: string, line: number, code: string) {
        //1. Extract just the file name
        const fileName = filePath.split(/[/\\]/).pop() || 'Unknown File';

        //2. Create the full object
        const newSnippet: BuriedCode = {
            id: Date.now().toString(),
            filePath: filePath,
            fileName: fileName,
            line: line,
            code: code,
            timestamp: Date.now()
        };
        
        //3. save it
        const snippets = this.getBuriedCode();
        snippets.push(newSnippet);

        // FIX: Use 'this.context' (or 'this.storage') instead of 'this.globalState'
        // If your constructor uses 'Memento', this usually works directly:
        await this.storage.update(this.STORAGE_KEY, snippets);

    
    
}


    public getBuriedCode(): BuriedCode[]{
        return this.storage.get<BuriedCode[]>(this.STORAGE_KEY) || [];
    }

    public async saveBuriedCode(list: BuriedCode[]): Promise<void> {
        await this.storage.update(this.STORAGE_KEY, list);
    }

    public async deleteSnippet(id: string): Promise<void>{
        let list = this.getBuriedCode();
        list = list.filter(item => item.id !== id);
        await this.storage.update(this.STORAGE_KEY, list);
    }

    //Helper to generate a unique ID
    private generateId(): string{
        return Math.random().toString(36).substring(2,15) + Math.random().toString(36).substring(2,15);
    }

    // Add this missing function to fix the first error
    public async resurrectCode(id: string): Promise<void> {
        const snippets = this.getBuriedCode();
        const snippetToRestore = snippets.find(s => s.id === id);

        if (!snippetToRestore) {
            return;
        }

        const editor = vscode.window.activeTextEditor;
        if (editor) {
            // Restore code at the original line
            await editor.edit(editBuilder => {
                const position = new vscode.Position(snippetToRestore.line, 0);
                editBuilder.insert(position, snippetToRestore.code + '\n');
            });

            // Remove it from the graveyard after restoring
            await this.deleteSnippet(id);
        }
    }
}
