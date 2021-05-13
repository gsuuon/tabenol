# tabenol
A simple way to view all your chrome tabs, manage windows and stop / resume a browsing session.

- No external packages
- No build step
- Uses the blazingly fast vanillajs framework
- Really really small, especially compared with other tab organizer extensions (~16kb currently)

## Install
Find it on the chrome web store by searching for `tabenol`, or this link may work: https://chrome.google.com/webstore/detail/tabenol-manage-tabs/biekcldpobfgaccickimibgjgfegnlpn

## Usage
Close a window:  
Click the 'x' at the top and centor of the window section, then 'close tabs' to confirm.

Save and close all windows:  
Click the top left 'x', it will turn red - click again to confirm.

Reload previous windows:  
Click the top left green 'l' when you start Chrome again. Once you open more windows, the load option will go away.

Open tabenol menu: `<Ctrl + ,>`  
Navigate tab selection: `Left`, `Down`, `Up`, `Right` or `h`, `j`, `k`, `l`  
Move to selected tab: `<Enter>`  
Toggle menu view column/row: `m`

## Notes
I made this a while ago but since it was so small I never thought to make it into a git project. I'm not sure where the original files are, I might need to re-write the manifest (would need to anyways for V3) and create the icon again. I just pulled these files out of the extension itself.

I'd like to expand this into making reading lists / jotting down notes associated with pages / general browsing organizer.

Specifically, I want to:
* Add notes to tabs / urls / domains
    * If I browse to a site I had notes on, I'd like to see those
* Add notes to specific windows / group of tabs
    * This can capture any context I had for wanting to read this group of tabs
* Close and save particular windows
* Name windows
* Search all saved notes / tabs
* Some sort of story or epic feature that allows me to group sets of tabs together in a sequenced way