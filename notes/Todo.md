# TODO

## Next up
- [ ] Simple implementation
    - key value store for notes
        - key is url hostname, value is note
    - tabenol view
        - [ ] gets all data on open
        - [ ] for entries with hostnames matching key, show badge
            - [ ] memo emoji over favicon
        - [ ] mouse over entry shows edit window to left
            - [ ] same height as tabenol
            - [ ] fixed width
            - [ ] word wrap
            - [ ] edit window saves as user types debounced, on close
            - [ ] fixed size notepad
            - [ ] transparent bg if no note

## Roadmap
1. Subdomain notes only, chrome sync
1. Search (lookup based on string contains applied to keys and values)
1. Page specific notes
1. IndexedDB, structured schema
    - export data file
    - import file
1. Advanced search / querying
1. Sync service worker for external sync extension

## Open
- [ ] simple storage implementaton
    - no querying
    - 8kb per item limit (key + value) ~ 2000 chars, 400 words
    - 100kb limit total (all keys + values) ~ 25000 chars, 6000 words
- [ ] IndexedDB
    - [ ] IndexedDB query
        - [ ] command
        - [ ] executable query
            - [ ] decide implementation approach
                - queries are keyrange + key list filtering
                    - keyrange, continue(nextKeylist)
                    - successive queries filter list of keys
                    - makes use of indices, but iterates over index for every query
                - queries are conditions
                    - apply to every entry in sequence
                    - basically ignores indices, but iterates only once
                    - can report matches immediately
                        - stream results via callback
        - [ ] composable queries
            - [ ] any
            - [ ] all
    - [ ] IndexedDB schema
        - [ ] notes db
        - [ ] meta notes db
        - [ ] export all data
    - can I offload the entire backend to sync extension?
        - hasNotes : string list -> bool list
            - query for known notes
        - getNotes : string -> Note list
            - get notes for page
        - updateNote : string * string -> unit
            - update note for page / domain
        - queryNotesContains : string -> Note list
            - notes which contain string
        - .. etc
- [ ] service worker
    - [ ] connections
        - [ ] checks against allowed
        - [ ] sends messages on events based on allow list
    - [ ] requests to query
        - [ ] responds to allowed requests
    - [ ] import/export
        - [ ] as file
    - [ ] sync
        - [ ] to/from external extension
            - [ ] manual / on close / on start / on update
            - [ ] better protocol, handles multiple sessions
    - [ ] sync to chrome extension storage
        - max 100kb synced
            - as few as 25k characters
            - about 6k words
            - worth implementing or leave cloud persistence to externals?
- [ ] notes view
    - [ ] default placeholders
        - [ ] domain and page note
    - [ ] request notes in current domain
    - [ ] sort / display by how matching url is
    - [ ] notes entry view
    - [ ] notes edit view
        - same as hover notes window in tabenol view
- [ ] tabenol view
    - [ ] request notes existence for open tabs
        - [ ] show badge over entries with notes
    - [ ] hover notes window
        - [ ] resizable width
            - height fixed to tabenol height
        - [ ] edit sends updates
- [ ] options view
    - [ ] specify allowed extensions
        - can't eval, so need to parse string
        - newline separated text field
            - "id asefsef: onUpdate, onClose, .."
            - "id <extensionId>: [<permission>,...]"
    - [ ] toggle automatic check for existing notes / badge update
