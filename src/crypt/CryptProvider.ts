import * as vscode from 'vscode';
import { CryptManager, BuriedCode } from './CryptManager';
import * as path from 'path';

// This class tells VS Code what to show in the sidebar
export class CryptProvider implements vscode.TreeDataProvider<BuriedCode> {

    // Event Emitter: This lets us tell VS Code "Hey, the data changed! Refresh the view."
    private _onDidChangeTreeData: vscode.EventEmitter<BuriedCode | undefined | null | void> = new vscode.EventEmitter<BuriedCode | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<BuriedCode | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private cryptManager: CryptManager) { }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: BuriedCode): vscode.TreeItem {
        // Create the UI element for a specific snippet
        const treeItem = new vscode.TreeItem(element.fileName, vscode.TreeItemCollapsibleState.None);

        // Tooltip shows when hovering
        treeItem.tooltip = `${element.code.substring(0, 100)}...`;

        // Description adds lighter text next to the title
        treeItem.description = `Line ${element.line + 1} • ${new Date(element.timestamp).toLocaleTimeString()}`;

        // Pass the ID to the context so we know what to resurrect
        treeItem.contextValue = 'buriedItem';

        // We attach the data to the command directly here
        treeItem.command = {
            command: 'crypt.resurrect',
            title: 'Resurrect Code',
            arguments: [element] // Pass the specific object to the command
        };

        // Setup Icons (Assuming you put them in resources)
        // Setup Icons
        treeItem.iconPath = {
            light: vscode.Uri.file(path.join(__filename, '..', '..', '..', 'resources', 'light', 'tombstone.svg')),
            dark: vscode.Uri.file(path.join(__filename, '..', '..', '..', 'resources', 'dark', 'tombstone.svg'))
        };

        return treeItem;
    }

    getChildren(element?: BuriedCode): Thenable<BuriedCode[]> {
        // If element is undefined, it means we are at the root. Return all items.
        // If we had groups (folders), we would handle the hierarchy here.
        if (!element) {
            return Promise.resolve(this.cryptManager.getBuriedCode().reverse()); // Show newest first
        }
        return Promise.resolve([]);
    }
}