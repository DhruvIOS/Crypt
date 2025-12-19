# Change Log

All notable changes to the "Crypt" extension will be documented in this file.

## [1.0.3] - 2025-12-19
### Added
- **Spirit Hover (Ghost Text):** Buried code now leaves a faint "Ghost Trace" (`👻 ...`) in the editor so you can easily see where code used to be.
- **Interactive Resurrect:** Hovering over the Ghost Text reveals the full code snippet and a clickable **"⚡ Resurrect"** button directly in the popup.
- **Smart Preview:** The Ghost Text shows the first few words of the buried code for quick identification without hovering.

## [1.0.2] - 2025-12-16
### Fixed
- Fixed README badge URLs to correctly display the version and install count from the Visual Studio Marketplace.
- Improved error handling when burying code in unsaved files.

## [1.0.1] - 2025-12-15
### Fixed
- Corrected the extension description in `package.json`.
- Added the missing `engines` field to ensure compatibility with VS Code 1.90.0+.
- Fixed repository links to point to the correct GitHub page.

## [1.0.0] - 2025-12-14
### Initial Release
- Released Crypt to the world!
- **Features:**
    - **Bury Code:** Highlight code and "Bury" it to hide it from view without deleting it.
    - **Graveyard Sidebar:** View all your buried snippets in a dedicated sidebar.
    - **Tombstones:** Visual gutter icons (🪦) indicate where code is buried.
    - **Resurrection:** Restore code instantly to its original location.