import * as vscode from 'vscode';
import { CryptManager, BuriedCode } from './crypt/CryptManager'
import { CryptProvider } from './crypt/CryptProvider';
import { endianness } from 'os';

//Global decoration type
let decorationType: vscode.TextEditorDecorationType;

export function activate(context: vscode.ExtensionContext){
    const cryptManager = new CryptManager(context.globalState);

        // --- NEW: VERISON UPDATE NOTIFICATION ---

        const extensionId = 'Dhruvs.crypt'; // Extension ID
        const extension = vscode.extensions.getExtension(extensionId);
        const currentVersion = extension?.packageJSON.version;
        const previousVersion = context.globalState.get<string>('cryptVersion');

        if(currentVersion && currentVersion !== previousVersion){
            vscode.window.showInformationMessage(
                `Crypt updated to v${currentVersion}! 👻 New Feature: "The Eulogy" - Add notes to your buried code`,
                "See changelogs"
            ).then(selection =>{
                if(selection === "See changelogs"){
                    vscode.env.openExternal(vscode.Uri.parse('https://marketplace.visualstudio.com/items?itemName=DhruvS.crypt'))
                }
            });
            //Update the stored version
            context.globalState.update('cryptVersion', currentVersion);
        }
        // ----------------------------------------
    const cryptProvider = new CryptProvider(cryptManager);

    //Register the sidebar Data provider
    vscode.window.registerTreeDataProvider('cryptSidebar', cryptProvider);

    //Initialize the decoration style (Tombstone Icon)
    decorationType = vscode.window.createTextEditorDecorationType({
        gutterIconPath: context.asAbsolutePath('respices/dark/tombstone.svg'),
        gutterIconSize: 'contain',
        isWholeLine: true
    });

    // -- COMMAND 1: BURY CODE --
    let buryCommand = vscode.commands.registerCommand('crypt.bury', async() =>{
        const editor = vscode.window.activeTextEditor;

        if(!editor){
            vscode.window.showErrorMessage('No active editor found');
            return;
        }
        const selection = editor.selection;
        const text = editor.document.getText(selection);

        if(!text){
            vscode.window.showErrorMessage('Highlight some code to bury it.');
            return;
        }

        //1. Ask the user for a "Eulogy" (Reason)
        const reason = await vscode.window.showInputBox({
            placeHolder: "E.g., 'Broken logic' or 'Refactoring (Press Enter to skip)",

            prompt: "Why are you burying this code (Optional)"
        })

        //2. Pass the reason to the manager)
        await cryptManager.buryCode(editor.document.uri.fsPath, selection.start.line, text, reason);

        //Remove the code from the editor
        editor.edit(editBuilder => {
            editBuilder.delete(selection);
        });

        cryptProvider.refresh();
        updateDecorations(editor, cryptManager);
    });

    // -- COMMANF 2: RESURRECT (FROM SIDEBAR) --
    let resurrectCommand = vscode.commands.registerCommand('crypt.resurrect', async(item: BuriedCode) =>{
        await cryptManager.resurrectCode(item.id);
        cryptProvider.refresh();
        if (vscode.window.activeTextEditor) {
            updateDecorations(vscode.window.activeTextEditor, cryptManager);
        }
    });

    // --- COMMAND 3: DELETE 
    let deleteCommand = vscode.commands.registerCommand('crypt.delete', async(item: BuriedCode ) =>{
        await cryptManager.deleteSnippet(item.id);
        cryptProvider.refresh();

        if(vscode.window.activeTextEditor){
            updateDecorations(vscode.window.activeTextEditor, cryptManager);
        }
    });

    // --- COMMAND 4: RESURRECT CURRENT ---
    let resurrectCurrentCommand = vscode.commands.registerCommand('crypt.resurrectCurrent', async() =>{
        const editor = vscode.window.activeTextEditor;
        if(!editor) return;

        //Get the line where the user clicked/triggered the command
        const currentLine = editor.selection.active.line;
        const currentFilePath = editor.document.uri.fsPath;

        //Find the buried code specifically at this line
        const allBuried = cryptManager.getBuriedCode();

        //We look for a snippet that was buried on this line
        const item = allBuried.find(i => i.filePath === currentFilePath && i.line === currentLine);

        if(item){
            await cryptManager.resurrectCode(item.id);
            cryptProvider.refresh();
            updateDecorations(editor, cryptManager);
        }else{
            //Fallback: If logic misses, try to find the closest one or just prompt
            vscode.window.showInformationMessage("Could not find buried code at this exact cursor position.");
        }
    });

    //Register all commands
    context.subscriptions.push(buryCommand);
    context.subscriptions.push(resurrectCommand);
    context.subscriptions.push(deleteCommand);
    context.subscriptions.push(resurrectCurrentCommand);

    //Event Listeners to keep decorations updated
    vscode.window.onDidChangeActiveTextEditor(editor =>{
        if(editor){
            updateDecorations(editor, cryptManager);
        }
    }, null, context.subscriptions);

    vscode.workspace.onDidChangeTextDocument(event => {
        if(vscode.window.activeTextEditor && event.document === vscode.window.activeTextEditor.document){
            updateDecorations(vscode.window.activeTextEditor, cryptManager);
        }
    }, null, context.subscriptions);

    //Initial load
    if(vscode.window.activeTextEditor){
        updateDecorations(vscode.window.activeTextEditor, cryptManager);

    }

}

export function deactivate(){}

// --- HELPER: UPDATE DECORATIONS (ICONS + GHOST TECT + HOVER) ---
function updateDecorations(editor: vscode.TextEditor, cryptManager: CryptManager){

    if(!editor){
        return;
    }

    const currentFilePath = editor.document.uri.fsPath;
    const allBuried = cryptManager.getBuriedCode();

    //Filter only snippets for the file we are looking at
    const snippets = allBuried.filter(item => item.filePath === currentFilePath);
    const decorationOptions: vscode.DecorationOptions[] = snippets.map(item => {

        //1. Create the Hover Content (Popup)
        const hoverContent = new vscode.MarkdownString();
        hoverContent.appendCodeblock(item.code, editor.document.languageId);

        //Add the CLICKABLE COMMAND LINK
        hoverContent.appendMarkdown('\n\n---\n\n[⚡ **Click here to Resurrect**](command:crypt.resurrectCurrent)');
        hoverContent.isTrusted = true;

        //2. Create the Ghost Text Preview
        const lines = item.code.split('\n');

        //Get first 30 chars, tirm whitespace
        let previewText = lines[0].trim().substring(0, 30);
        if(lines.length > 1 || lines[0].length > 30){
            previewText += "...";
        }

        let finalLabel = previewText;
        if(item.reason){
            finalLabel = `[${item.reason} ${previewText}]`
        }

        //2. Construct the Decoration

        return{
            //Use the whole line range to ensure alignment
            range: editor.document.lineAt(item.line).range,
            hoverMessage: hoverContent,
            renderOptions: {
                after: {
                    contentText: `  👻 ${finalLabel} (Buried)`, // The visible Ghost Text
                    color: new vscode.ThemeColor('editorCodeLens.foreground'), // Faint grey
                    fontStyle: 'italic',
                    fontWeight: 'bold',
                    margin: '0 0 0 20px' // Space between gutter and text
                }
            }
        }
    });
    editor.setDecorations(decorationType, decorationOptions);
}