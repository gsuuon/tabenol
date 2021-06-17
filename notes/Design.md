# Notes feature design

Users can:  
- Store notes
- Query notes
- Badge icon changes if notes exist for current page or domain
- Create meta notes (notes on groups of notes)

Architecture:
- Set up for modular extensions, that is, separate extensions that are optionally installed by users which intercommunicate with notes service, e.g:
    - Users can create an extension which listens for notes changes and backs it up to Dropbox or Drive
    - Users can create an extension which shows notes with markdown parsing
---
## Modes
Users can switch between tabs and notes modes by clicking on the header
`tabenol | notes`

**tabs** mode is the current tabenol screen, with new features:
- Icon over entries which have attached notes (url specific)
- Hover over any entry shows the notes window
    - notes window is fixed size to the left of the tabs menu
    - notes window has bg opacity < 1 if mouse isn't over it
    - clicking on the window focuses it
        - opacity = 1
        - user input
        - basic text (i.e. no markdown parsing)

- Notes window can be resized by dragging bottom left corner
    - word-wrap by default (toggleable)


**notes** mode:
- Notes database (IndexedDB)
    - service worker executes queries and updates
    - contains
        - url
            - protocol is stripped (agnostic between http and https)
            - Not user editable in UI
        - domain (hostname)
            - derived from url
                - hostname from [URL](https://developer.mozilla.org/en-US/docs/Web/API/URL)
                    - contains subdomain (`developer.mozilla.org`)
            - Not user editable in UI
        - timestamps
            - created
            - edited
            - Not user editable in UI
        - body
            - plaintext
            - resizable text box in ui
        - tags
            - list of strings
    - url and domain can be the same (when user wants to attach a note to the domain)
    - meta notes objectstore
        - contains
            - name (optional)
            - timestamps
            - body
            - tags
            - child note keys
                - points to notes in url notes, or
                - points to other meta notes

- Main view
    - all notes with domain = current domain
    - notes sorted by how closely they match current url
        - current url should be top
        - split url into sections (e.g. after each "/"), more matching sections higher
            - sections either match or not
    - always contains at least 2 notes
        - current url note
        - current domain note
        - either can be empty
            - if user selects and adds content, creates/saves a new note
            - placeholder "add new note" body
    - can delete note with confirmation
        - same ui as tabenol when closing a window

- Meta view
    - `tabenol | notes | meta` meta option appears in notes mode
    - entries are all meta notes which reference any of the notes matching current page
    - if empty
        - placeholder entry which points to top matching url note of current page

- Query notes
    - backed by IndexedDB
        - query commands
            - search in body
                - by iterating over all documents
                - could search for complete words by indexing all unique words + multi entry index, reference
                    [article](https://hacks.mozilla.org/2014/06/breaking-the-borders-of-indexeddb/)
            - filter by timerange
            - filter by url startswith
            - filter by tag
        
        - query commands composable by all or any
            - more in query format below
    
    - IndexedDB
        - generates indices so some searches can be accelerated
            - e.g. get all entries with url starting with x
            - get all entries with timestamp from x
        - no text search or partial string search
            - implement by searching through entire body text manually

- Allows connections from other extensions in service worker
    - sends messages on certain actions:
        - update note (debounced, on input in field)
        - close extension
    - responds to certain requests
        - process a query
        - get all notes
        - get note for url

**options** view allows configuring:
- Toggle automatic check if current domain has notes
- User specified allowlist of extensions
    - allowlist is object of
        - extension id
        - allowed actions or events
            - onUpdateNote
            - onClose
            - getAllNotes
            - getNoteForUrl
            - doQuery (implicitly means can getAllNotes or getNoteForUrl)
            - doUpdateNote

### Notes
- Syncs to chrome extensions storage by default, but that is limited to 100kb
- Uses IndexedDB for local storage
- Allows other extensions to connect and listen for events (on note update, on close)
    - User specifies which extension ids are allowed
    - Extension ID's found in Manage Extensions (enable developer mode toggle)


### Query Format
Built on IndexedDB

A query is a list of queries which filter sequentially. An (any) query is a list of queries where any match will continue. Expensive queries should come later (`any`, bodyContains)

Keys should be generated incrementing ints, index on Url.

```
let myQuery =
    query
        [ urlStarts("somesite.co")
        , any([withTag("greeting")
            , withTag("test")
            ])
        , bodyContains("hello") 
        ]
```

As text (query from external extensions via message)
```
urlStarts "google.com"
any [
withTag "greeting"
withTag "greeting"
]
bodyContains "hello"
```

Possible implementation sketch in pseudo code, filtering key sets sequentially:  
```
type QueryDefinition =
    command
    argument

module QueryCommands =
    let urlStarts name =
        { command = "urlStarts", argument = name }

    let query queries =
        { command = "querySequence", argument = queries }
    
    .. etc ..

let produceExecutable queryDefinition =
    // processes a query definition into something ready to execute given an objectstore
    // returns a list of keys (may need a wrapper / helper to this)

    switch queryDefinition.command
        urlStarts
            (objStore) => objStore.index('url').keyrange(query.argument)
        withTag
            (objStore) => objStore.index('tag').keyrange.only(q.arg)

        .. etc ..

let execOnKeys objStore keys query =
    // runs a query on an ordered list of keys
    // returns a list of keys which matched
    
    let curIdx = 0
    let resultKeys = []

    loop
        ...
        if condition
            resultKeys.push keys[curIdx]
        ...
        curIdx++
        query.continue(keys[curIdx])

let execQuery objStore query =
    // runs a query on all keys
    // entry point

    let matchedKeys = 
        .. do stuff with executable query ..

    return getValues matchedKeys

let applyQueriesFilter objStore keys queries =
    // sequentially filters keys list which match successive queries

    let query :: restQueries = queries

    let curResultKeys = execQuery query
    
    for q in restQueries do
        let results = execOnKeys curResultKeys q
        curResultsKeys = results

    return curResultsKeys

let applyQueriesJoin objStore keys queries =
    // Collects any key which matches
    // Run in parallel

    let cumulatedKeys = []

    let queryJobs =
        queries.map
            wrapQueryAsAsync (execOnKeys keys q)

    queryJobs.WaitAll()
    let results =
        queryJobs.reduce(
            new Set(),
            (allResults, results) => allResults.addAll(results)
        )

    return sortedList results
```
If I use this, it might be better for perf if key is an int not a string (url), since I'll be operating on lists of keys.

Alternatively I could attempt to apply all filters immediately on every entry. This lets me return results asynchronously as I go. Possibly less performant since I'm not sure how to do this while actually taking advantage of the indices, but we'd only ever iterate over the entries once instead of once for every query (but indexed).
