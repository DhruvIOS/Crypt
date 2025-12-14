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

    public async buryCode(editor: vscode.TextEditor): Promise<void>{
        const selection = editor.selection;
        const text = editor.document.getText(selection);

        if(!text.trim()){
            vscode.window.showWarningMessage("You can't bury empty");
            return;
        }

        const filePath = editor.document.uri.fsPath;
        const fileName = path.basename(filePath);

        const snippet: BuriedCode = {
            id: this.generateId(),
            code: text,
            filePath: filePath,
            fileName: fileName,
            line: selection.start.line,
            timestamp: Date.now()

        };

        //Get current list, add new one, save back
        const currentCrypt = this.getBuriedCode();
        currentCrypt.push(snippet);
        await this.storage.update(this.STORAGE_KEY, currentCrypt);

        //Delete from editor
        await editor.edit(editBuilder => {
            editBuilder.delete(selection);
        });

        vscode.window.showInformationMessage(`Buried code from ${fileName}.`)
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
}