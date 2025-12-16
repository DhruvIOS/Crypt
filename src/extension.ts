import * as vscode from 'vscode';
import { CryptManager, BuriedCode } from './crypt/CryptManager';
import { CryptProvider } from './crypt/CryptProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Crypt is rising...');

    try {
        // 1. Initialize Managers (Must happen first!)
        const cryptManager = new CryptManager(context.workspaceState);
        const cryptProvider = new CryptProvider(cryptManager);

        // 2. Register the Sidebar
        vscode.window.registerTreeDataProvider('cryptSidebar', cryptProvider);

        // 3. Setup Decorations (The Tombstone)
        // We use context.asAbsolutePath so it works regardless of where the file is
        const tombstoneDecorationType = vscode.window.createTextEditorDecorationType({
            gutterIconPath: context.asAbsolutePath('resources/dark/tombstone.svg'),
            gutterIconSize: 'contain',
            overviewRulerColor: 'blue',
            overviewRulerLane: vscode.OverviewRulerLane.Right
        });

        // --- Helper Function: Defined INSIDE activate so it can see 'cryptManager' ---
        const updateDecorations = (editor: vscode.TextEditor | undefined) => {
            if (!editor) { return; }

            const currentFilePath = editor.document.uri.fsPath;
            const buriedItems = cryptManager.getBuriedCode(); 

            // Filter items for this specific file
            const itemsForFile = buriedItems.filter(item => item.filePath === currentFilePath);

            const tombstones: vscode.DecorationOptions[] = [];
            itemsForFile.forEach(item => {
                const range = new vscode.Range(item.line, 0, item.line, 0);
                const decoration: vscode.DecorationOptions = {
                    range: range,
                    hoverMessage: 'Here lies code: ' + item.code.substring(0, 50) + '...'
                };
                tombstones.push(decoration);
            });

        editor.setDecorations(tombstoneDecorationType, tombstones);
           
        };

        // 4. Register Commands
        
        // Command: Bury
        let buryCommand = vscode.commands.registerCommand('crypt.bury', async () => {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                await cryptManager.buryCode(editor);
                cryptProvider.refresh();
                updateDecorations(editor); 
            }
        });

        // Command: Resurrect
        let resurrectCommand = vscode.commands.registerCommand('crypt.resurrect', async (item: BuriedCode) => {
            try {
                // Try to find the file
                const doc = await vscode.workspace.openTextDocument(item.filePath);
                const editor = await vscode.window.showTextDocument(doc);

                // Calculate position
                let targetLine = item.line;
                if (doc.lineCount <= targetLine) {
                    targetLine = doc.lineCount;
                }

                // Insert
                await editor.edit(editBuilder => {
                    const position = new vscode.Position(targetLine, 0);
                    editBuilder.insert(position, item.code + '\n');
                });
                
                // Optional: Delete from crypt after resurrecting
                await cryptManager.deleteSnippet(item.id);
                cryptProvider.refresh();
                updateDecorations(editor);

                vscode.window.showInformationMessage('Code resurrected.');
            } catch (error) {
                vscode.window.showErrorMessage(`Could not resurrect: ${error}`);
            }
        });

        // Command: Delete
        let deleteCommand = vscode.commands.registerCommand('crypt.delete', async (item: BuriedCode) => {
            await cryptManager.deleteSnippet(item.id);
            cryptProvider.refresh();
            // Refresh decorations if the active file is the one we deleted from
            updateDecorations(vscode.window.activeTextEditor);
        });

        context.subscriptions.push(buryCommand, resurrectCommand, deleteCommand);

        // 5. Events: Update decorations when switching tabs
        if (vscode.window.activeTextEditor) {
            updateDecorations(vscode.window.activeTextEditor);
        }
        
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) {
                updateDecorations(editor);
            }
        }, null, context.subscriptions);

    } catch (e) {
        console.error('Crypt failed to initialize:', e);
    }
}

export function deactivate() {}