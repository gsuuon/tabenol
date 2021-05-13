/* global chrome */
const promisifyCallbackFn = fn => (...args) => new Promise(resolve => fn(...args, resolve))
const queryForTabs = promisifyCallbackFn(chrome.tabs.query)
const getAllWindows = promisifyCallbackFn(chrome.windows.getAll)
const flat = arrs => [].concat(...arrs)

const log = (...args) => console.info('tbnl', ...args)

const forEachObj = (obj, fn) => Object.keys(obj).forEach(key => fn(key, obj[key]))

const el = tag => {
    const attributes = {}
    const props = {}
    const events = {}

    return {
        build() {
            const { style={}, ...restProps } = props

            const e = document.createElement(tag)

            forEachObj(attributes, (attrKey, attr) => {
                e.setAttribute(attrKey, attr)
            })

            forEachObj(style, (styleKey, _style) => {
                e.style[styleKey] = _style
            })

            forEachObj(restProps, (restKey, restProp) => {
                e[restKey] = restProp
            })

            forEachObj(events, (eventName, handler) => {
                e.addEventListener(eventName, handler)
            })

            return e
        },
        attributes(attr) { Object.assign(attributes, attr); return this },
        props(ps) { Object.assign(props, ps); return this },
        events(ev) { Object.assign(events, ev); return this }
    }
}

const o = (parent, children) => {
    if (Array.isArray(children)) {
        children.forEach(child => {
            parent.appendChild(child)
        })
    } else {
        parent.appendChild(children)
    }

    return parent
}

const hslaFromId = wid => `hsla(${wid % 18 * 20}, 60%, 80%, 0.8)`

const focusTab = (wid, tid) => {
    wid = parseInt(wid)
    tid = parseInt(tid)

    chrome.windows.update(wid, {focused: true})
    chrome.tabs.update(tid, {active: true})

    window.close()
}


const createTabContainerElement = tab => {
    const stripHttp = url => url.split('://')[1]

    const container = el('tab-container')
        .attributes({
            tabId: tab.id,
            winId: tab.windowId,
        })
        .props({
            style: {
                padding: '0.15rem',
                paddingTop: '0.45rem'
            }
        })
        .events({
            click: () => focusTab(tab.windowId, tab.id)
        })
        .build()

    const description = el('tab-description').build()
    const title = el('tab-title').props({innerText: tab.title}).build()
    const favicon = el('tab-favicon').props({style: {backgroundImage: 'url(' + tab.favIconUrl + ')'}}).build()
    const url = el('tab-url').props({innerText: stripHttp(tab.url)}).build()

    return (
        o(container, [
            o(description, [
                title,
                url
            ]),
            favicon
        ])
    )

}

const createWindowContainerElement = w => {
    const wid = w.id

    const container = el('window-container')
        .attributes({wid})
        .props({
            style: {
                backgroundColor: hslaFromId(wid)
            }
        }).build()
    const title = el('window-title').build()
    const close_container = el('close-container').build()
    const close_x = el('close-x')
        .props({innerHTML: 'x'})
        .events({click: () => close_container.classList.add('confirm')})
        .build()
    const close_confirm = el('close-confirm')
        .props({innerHTML: 'close tabs'})
        .events({click: () => {
            chrome.windows.remove(wid)
            container.parentNode.removeChild(container)
        }})
        .build()
    const close_cancel = el('close-cancel')
        .props({innerHTML: 'nevermind'})
        .events({click: () => close_container.classList.remove('confirm') })
        .build()
    const windows = document.getElementById('windows')

    return (
        o(container,
            o(title,
                o(close_container, [
                    close_x,
                    close_confirm,
                    close_cancel
                ])
            )
        )
    )
}

const traverseSibling = (node, next) => {
    const dirSib = next ? 'nextSibling' : 'previousSibling' 
    const nodeName = node.nodeName
    let currentNode = node

    while (currentNode[dirSib]) {
        if (currentNode[dirSib].nodeName === nodeName) {
            return currentNode[dirSib]
        } else {
            currentNode = currentNode[dirSib]
        }
    } 
}

const KEY = {
    h: 72,
    j: 74,
    k: 75,
    l: 76,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    CR: 13,
    '/': 191,
    m: 77,
    o: 79,
}

class TabenolController {
    constructor({activeTabNode, allTabs}) {
        this._selectedTabNode = activeTabNode
        this.orientationRow = false
        this.allTabs = allTabs

        const rotatorButton = document.querySelector('rotate-row')
        const rotatorSymbol = document.querySelector('rotate-symbol')
        const windows = document.getElementById('windows')

        this.rotate = () => {
            const row = rotatorSymbol.classList.toggle('row')

            windows.classList.toggle('row')

            this.orientationRow = row
        }

        rotatorButton.addEventListener('click', this.rotate)

        const selectedTabRemovalObserver = new MutationObserver(() => {
            if(this.selectedTabNode.isConnected === false) {
                this.selectedTabNode = activeTabNode
            }
        })

        selectedTabRemovalObserver.observe(document.querySelector('#windows'), {childList: true})
    }

    moveFocusWindow({next, focusFirstTab}) {
        const parentSibling = traverseSibling(this.selectedTabNode.parentNode, next)

        if (parentSibling) {
            if (focusFirstTab || next) {
                this.selectedTabNode = parentSibling.childNodes[1]
            } else {
                this.selectedTabNode = parentSibling.lastChild
            }

            this.selectedTabNode.scrollIntoViewIfNeeded()
        }
    }

    get selectedTabNode() { return this._selectedTabNode }

    set selectedTabNode(tabNode) {
        this._selectedTabNode.classList.remove('active')
        this._selectedTabNode = tabNode
        this._selectedTabNode.classList.add('active')
    }

    moveSelectedTab(next) {
        const sibling = traverseSibling(this.selectedTabNode, next)

        if (sibling) {
            this.selectedTabNode = sibling
            this.selectedTabNode.scrollIntoViewIfNeeded()
        } else {
            this.moveFocusWindow({next})
            return false
        }
    }

    keydownHandler = event => {
        /*
        * key shortcuts todo
        *
        * [ ] - / search
        * [ ] - l sort by latest opened
        * [ ] - o sort by opened first
        * [x] - m toggle row view
        */
        if (this.searchMode) {
            // TODO search mode
        } else {
            switch (event.keyCode) {
                case KEY.m:
                    this.rotate()
                    break
                case KEY.CR:
                    focusTab(this.selectedTabNode.getAttribute('winId'),
                            this.selectedTabNode.getAttribute('tabId'))
                    break
                case KEY.h:
                case KEY.LEFT:
                    if (!this.orientationRow) {
                        return
                    }

                    this.moveFocusWindow({next: false, focusFirstTab: true})
                    break
                case KEY.k:
                case KEY.UP:
                    if (event.shiftKey) {
                        this.moveFocusWindow({next: false})
                    } else {
                        this.moveSelectedTab(false)
                    }
                    break
                case KEY.l:
                case KEY.RIGHT:
                    if (!this.orientationRow) {
                        return
                    }

                    this.moveFocusWindow({next: true})
                    break
                case KEY.j:
                case KEY.DOWN:
                    if (event.shiftKey) {
                        this.moveFocusWindow({next: true})
                    } else {
                        this.moveSelectedTab(true)
                    }
                    break
            }
        }
    }
}

const initializeRestoreSessionHandler = () => {
    const STATE = {
        CAN_LOAD: 'CAN_LOAD',
        SAVE_AND_EXIT: 'SAVE_AND_EXIT',
        CONFIRMING_SAVE_AND_EXIT: 'CONFIRMING_SAVE_AND_EXIT'
    }

    const sessionButton = document.querySelector('session-save')
    sessionButton.innerHTML = 'x'

    let currentState = STATE.SAVE_AND_EXIT

    const getSyncStorage = promisifyCallbackFn(chrome.storage.sync.get.bind(chrome.storage.sync))
    const setSyncStorage = promisifyCallbackFn(chrome.storage.sync.set.bind(chrome.storage.sync))

    getAllWindows().then(windows => {
        if (windows.length === 1) {
            return getSyncStorage(['savedSessionWindows']).then(({savedSessionWindows}) => {
                if (savedSessionWindows && savedSessionWindows.length) {
                    currentState = STATE.CAN_LOAD

                    sessionButton.innerHTML = 'l'
                    sessionButton.style.backgroundColor = 'green'

                    return savedSessionWindows
                }
            })
        }
    }).then( (previousSessionWindows=[]) => {
        const loadWindowsAndTabs = () => {
            if (previousSessionWindows.length < 1) {
                return
            }

            // update focused window's tabs to first saved window's tabs
            chrome.windows.getCurrent({}, currentWindow => {
                const firstWindow = previousSessionWindows[0]
                const firstWindowTabs = firstWindow.tabs

                const { left, top, width, height, state } = firstWindow

                const firstTab = firstWindowTabs[0]
                const restTabs = firstWindowTabs.slice(1)

                chrome.windows.update(currentWindow.id, { left, top, width, height, state })
                chrome.tabs.update({url: firstWindowTabs[0].url})

                firstWindowTabs.slice(1).forEach(tab => {
                    chrome.tabs.create({windowId: currentWindow.id, url: tab.url})
                })
            })

            // create the rest of the windows + tabs
            previousSessionWindows.slice(1).forEach(previousSessionWindow => {
                //log('previousSessionWindow tabs', previousSessionWindow.tabs)
                const { left, top, width, height, state } = previousSessionWindow

                chrome.windows.create({
                    url: previousSessionWindow.tabs[0].url,
                    left, top, width, height, //state,
                    focused: false
                }, createdWindow => {
                    log('createdWindow', createdWindow.id)
                    previousSessionWindow.tabs.slice(1).forEach(tab => {
                        chrome.tabs.create({windowId: createdWindow.id, url: tab.url})
                    })
                })
            })
        }

        const saveWindowsAndCloseAll = () =>
            getAllWindows({populate: true})
                .then(windows =>
                    setSyncStorage({ savedSessionWindows: windows })
                        .then(() => {
                            if (chrome.runtime.lastError) {
                                console.error(chrome.runtime.lastError.message)

                                const confirmClose = confirm('There was a problem saving your tabs, do you still want to close all windows?')

                                if (!confirmClose) {
                                    return
                                }
                            } 

                            windows.forEach(win => chrome.windows.remove(win.id))
                        })
                )

        const handleLoadOrExit = () => {
            switch (currentState) {
                case STATE.CAN_LOAD:
                    loadWindowsAndTabs()
                    break
                case STATE.SAVE_AND_EXIT:
                    currentState = STATE.CONFIRMING_SAVE_AND_EXIT
                    sessionButton.style.backgroundColor = 'red'
                    break
                case STATE.CONFIRMING_SAVE_AND_EXIT:
                    saveWindowsAndCloseAll()
                    break
            }
        }

        sessionButton.addEventListener('click', handleLoadOrExit)
    })
}

document.addEventListener('DOMContentLoaded', () => {
    initializeRestoreSessionHandler()

    const queryForAllTabs = () => queryForTabs({})
    const queryForFocusedTab = () => queryForTabs({active: true, currentWindow: true})

    getAllWindows({populate: true})
        .then(windows => {
            o(document.querySelector('#windows'), windows.map(w =>
                o(createWindowContainerElement(w), w.tabs.map(createTabContainerElement))
            ))

            queryForFocusedTab()
                .then(focusedTabs => {
                    const activeTabNode = document.querySelector(`tab-container[tabId='${focusedTabs[0].id}']`)

                    activeTabNode.classList.add('active')
                    activeTabNode.parentNode.classList.add('active')
                    activeTabNode.scrollIntoViewIfNeeded()

                    const allTabs = flat(windows.map(w => w.tabs))
                    const controller = new TabenolController({
                        activeTabNode,
                        allTabs
                    })

                    document.addEventListener('keydown', controller.keydownHandler)
                })
        })
})
