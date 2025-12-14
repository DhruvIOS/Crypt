# Crypt

<p align="center">
  <img src="./src/resources/dark/crypt.svg" alt="Crypt Logo" width="200"/>
</p>

<p align="center">
  <strong>Stop hoarding commented-out code. Bury it. Resurrect it later.</strong>
</p>

<p align="center">
    <a href="https://marketplace.visualstudio.com/items?itemName=yourname.crypt">
        <img src="https://img.shields.io/visual-studio-marketplace/v/yourname.crypt?color=333333&label=VS%20Code%20Marketplace" alt="Version">
    </a>
    <a href="https://marketplace.visualstudio.com/items?itemName=yourname.crypt">
        <img src="https://img.shields.io/visual-studio-marketplace/i/yourname.crypt?color=333333&label=Installs" alt="Installs">
    </a>
</p>

---

**Crypt** is a developer productivity tool designed to keep your codebase clean. We all do it: we comment out blocks of code "just in case" we need them later. This clutters files and makes code reviews painful.

Crypt gives you a **Sophisticated Storage** solution right in your sidebar. Select your code, "Bury" it to remove it from the editor, and "Resurrect" it instantly when the time is right.

## Features

### ⚰️ Bury Code
Instantly move selected code from your active editor into the Crypt.
* **Command:** `Crypt: Bury`
* Removes the code from your file to keep it clean.
* Saves the snippet with a timestamp and file reference.

### ⚡ Resurrect
Need that old function back? Restore buried code to your current cursor position.
* **Command:** `Crypt: Resurrect`
* Browse your graveyard in the custom Sidebar.
* Click the "Resurrect" icon (arrow up) to insert the code.

### 🗄️ Sophisticated Storage (Sidebar)
Manage your snippets in a dedicated view container.
* **Rename** snippets for better organization.
* **Preview** code before restoring it.
* **Delete** snippets you truly no longer need.

## Usage

1.  **Highlight** the code you want to save.
2.  Right-click and select **"Bury Code"** (or use the command palette).
3.  The code disappears from your file and appears in the **Crypt Sidebar**.
4.  To restore, open the Crypt Sidebar, find your snippet, and click the **Resurrect** button.

## Extension Settings

This extension contributes the following settings:

* `crypt.confirmDelete`: Enable/disable confirmation prompts when permanently deleting snippets from the Crypt.
* `crypt.showGraveStones`: Toggle generic placeholders in the code where snippets were buried (Default: `false`).

## Known Issues

* Currently supports local workspace storage only.

## Release Notes

### 1.0.0
Initial release of Crypt.
* Added Bury and Resurrect functionality.
* Added Sidebar view.
* Implemented Dark/Light theme icons.

---

**Enjoying Crypt?** [Rate it on the Marketplace](https://marketplace.visualstudio.com/) or submit a PR on GitHub.