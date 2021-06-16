# Privacy

This is a just for fun project -- no data is collected, processed, transferred, etc. outside of the save and close feature, which uses Google's chrome.storage sync api. No external scripts or packages are used. This extension only uses browser and Chrome extension api's.

After you confirm the save and close operation, the extension will attempt to send all your (non-incognito) Chrome window data to your Google account's Chrome extension storage. The only other network communication is requesting the favicon icons for the tabs.

Note that the saved Chrome windows and tabs means there may be some additional browsing information leftover after you clear history in the browser. Since only one version of this data is stored, simply doing another save and close will overwrite whatever was saved previously.
