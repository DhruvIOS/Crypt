import * as vscode from 'vscode';
import { CryptManager, BuriedCode} from './crypt/CryptManager';
import {CryptProvider } from './crypt/CryptProvider';
import * as fs from 'fs';
import * as path from 'path'

export function activate(context: vscode.ExtensionContext){
	console.log('Crypt is rising...');

	// inside activate()

	const tombstoneDecorationType = vscode.window.createTextEditorDecorationType({
		gutterIconPath: context.asAbsolutePath('resources/dark/tombstone.svg'),
		gutterIconSize: 'contain',
		overviewRulerColor: 'blue', // Shows a blip in the right scrollbar
		overviewRulerLane: vscode.OverviewRulerLane.Right
	});

	function updateDecorations(activeEditor: vscode.TextEditor | undefined){
		if(!activeEditor){
			return;
		}

		const currentFilePath = activeEditor.document.uri.fsPath;
		const buriedItems = cryptManager.getBuriedCode();  //Get all items

		//Filter items that belong to THIS file
		const itemsForFile = buriedItems.filter(items => items.filePath === currentFilePath);


		//Create a list of ranges(lines to mark
		const tombstones: vscode.DecorationOptions[] = [];

		itemsForFile.forEach(item => {
			// We mark the specific line where the code used to be

			const range = new vscode.Range(item.line, 0, item.line, 0);

			const decoration: vscode.DecorationOptions = {
				range: range,
				hoverMessage: 'Here lies code: '+ item.code.substring(0,50) + '...'
			};
			tombstones.push(decoration)
		});
		activeEditor.setDecorations(tombstoneDecorationType, tombstones)
	}

	if(vscode.window.activeTextEditor){
		updateDecorations(vscode.window.activeTextEditor);
	}






vscode.workspace.onDidRenameFiles(async (e) => {
    // 1. Get current buried code
    let buriedCode = cryptManager.getBuriedCode();
    let changed = false;

    // 2. Iterate through the files that were renamed
    for (const file of e.files) {
        const oldPath = file.oldUri.fsPath;
        const newPath = file.newUri.fsPath;
        const newFilename = path.basename(newPath);

        // 3. Find any snippets associated with the OLD path
        buriedCode.forEach(snippet => {
            if (snippet.filePath === oldPath) {
                // Update the path and the filename in the snippet
                snippet.filePath = newPath;
                snippet.fileName = newFilename;
                changed = true;
            }
        });
    }

    // 4. If we updated anything, save it back to storage and refresh UI
    if (changed) {
        await cryptManager.saveBuriedCode(buriedCode); // You'll need to expose a public save method in Manager
        cryptProvider.refresh();
    }
});

	//1. Initialize out classes
	//We use workspaceState so snippets are specific to this project, not global across all VS Code windows.

	const cryptManager = new CryptManager(context.workspaceState);
	const cryptProvider = new CryptProvider(cryptManager);

	//2. Reigster the Sidebar view
	vscode.window.registerTreeDataProvider('cryptSidebar', cryptProvider);

		//A. When active editor changes (user switches tabs)

		vscode.window.onDidChangeActiveTextEditor(editor =>{
			if(editor){
				updateDecorations(editor);
			}
		}, null, context.subscriptions)
	

	//3. Command: Burry Code

	let buryCommand = vscode.commands.registerCommand('crypt.burry', async () => {
		const editor = vscode.window.activeTextEditor;

		if(editor){
			await cryptManager.buryCode(editor);
			cryptProvider.refresh();  //Update the UI
			updateDecorations(editor)
		}
	});

	//4. Command: Ressurrect Code
	let resurrectCommand = vscode.commands.registerCommand('crypt.resurrect', async (item: BuriedCode) => {
		try {
			// A. Try to find the original file
			let doc: vscode.TextDocument;
			try {
				doc = await vscode.workspace.openTextDocument(item.filePath);
			} catch (e) {
				// File not found! Ask the user what to do.
				const choice = await vscode.window.showWarningMessage(
					`The original file '${item.fileName}' no longer exists.`,
					'Open in New File',
					'Cancel'
				);
	
				if (choice === 'Open in New File') {
					// Open an untitled document with the code content
					const newDoc = await vscode.workspace.openTextDocument({ content: item.code });
					await vscode.window.showTextDocument(newDoc);
					return; // Exit, we are done
				}
				return; // User cancelled
			}
	
			// B. If file exists, show it
			const editor = await vscode.window.showTextDocument(doc);
	
			// C. Calculate Insertion Point (Safety Check)
			// If the file shrank and line 100 no longer exists, append to bottom.
			let targetLine = item.line;
			if (doc.lineCount <= targetLine) {
				targetLine = doc.lineCount; // Append to very end
			}
	
			// D. Insert the code
			await editor.edit(editBuilder => {
				const position = new vscode.Position(targetLine, 0);
				editBuilder.insert(position, item.code + '\n'); // Add newline for cleanliness
			});
	
			vscode.window.showInformationMessage('Code resurrected.');
	
		} catch (error) {
			console.error(error);
			vscode.window.showErrorMessage(`Resurrection failed: ${error}`);
		}
	});

	//5. Command: Delete Permanently (from sidebar)
	let deletCommand = vscode.commands.registerCommand('crypt.delete', async(item: BuriedCode) =>{
		await cryptManager.deleteSnippet(item.id);
		cryptProvider.refresh();
	});
	context.subscriptions.push(buryCommand, resurrectCommand, deletCommand)
}

export function deactivate() {}