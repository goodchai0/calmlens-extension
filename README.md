# CalmLens: Reading Comfort & Focus

A free browser extension that makes web pages easier on the eyes and keeps YouTube free of distractions.

<!-- Add a screenshot or GIF here:
![CalmLens demo](docs/demo.gif)
-->

## Reading comfort (any website)

- **Font:** switch to an easy sans-serif, a friendly Comic-style font, or a serif.
- **Text spacing:** three levels of line height, letter spacing and word spacing.
- **Color tint:** cream, soft blue, mint, rose, or a warm night tint, laid over the page.
- **Dim screen:** cut glare by darkening the page up to 50%.
- **Reading ruler:** highlights a band that follows your mouse and dims the rest.
- **Pause per site:** turn CalmLens off for any site that looks wrong.

## YouTube focus

- Hide **Shorts** (shelves, search results, sidebar entry). Shorts links open as normal videos.
- Hide **home recommendations** (you get a calm "use the search bar" message).
- Hide **recommended videos** beside a video.
- Hide **comments**.
- Hide **end-of-video suggestions**.

## Install (Chrome, Edge, Brave)

1. Click **Code**, then **Download ZIP**, and unzip it.
2. Open `chrome://extensions` (Edge: `edge://extensions`).
3. Turn on **Developer mode**.
4. Click **Load unpacked** and choose the **`extension`** folder.
5. Click the CalmLens icon to set things up.

## Honest notes

- This is a comfort tool, not a medical one. Research on "dyslexia fonts" is mixed. Spacing, size, contrast and tints help many people more than a special typeface, which is why those controls are here. Try combinations and keep what feels better to you.
- Text styling is not applied on YouTube, so the player and menus keep their layout. Tint, dim and the ruler still work there.
- YouTube changes its page structure often, so a hide rule may stop working after an update. Please open an issue if one breaks.
- Sidebar Shorts hiding relies on English labels in part. Shelves and video items are hidden by link, which works in any language.

## Permissions

| Permission | Why |
|---|---|
| `storage` | Saves your settings |
| `activeTab` | Lets the popup read the current site's name for the "Pause on this site" switch |
| All sites (content script) | Applies your reading settings on whichever page you open |

Nothing leaves your device. See [PRIVACY.md](PRIVACY.md).

## Development

No build step. Edit `extension/`, press the reload icon on `chrome://extensions`, and refresh the page.

## License

MIT. See [LICENSE](LICENSE).

## Troubleshooting

- **Nothing changes:** CalmLens starts with all reading options off. Open the popup and press **Comfort** under Quick start to see an immediate change.
- **Popup says "Not running here yet":** the tab was open before you installed the extension. Press **Refresh this page**.
- **"Manifest file is missing" when loading:** choose the `extension` folder (the one containing `manifest.json`), not the folder above it.
- **A site looks wrong:** switch on **Pause on this site** in the popup.
- **Still stuck:** open `chrome://extensions`, find CalmLens, click **Errors** if it appears, and share what it says in an issue.
