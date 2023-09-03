const { assign } = Object

import Consts from './consts.mjs'

const WIDTH = Consts.WIDTH
const HEIGHT = Consts.HEIGHT


const connectionFormHtml = `
    <div style="height:100%; aspectRatio:${WIDTH}/${HEIGHT}; padding:1em; display:flex; flex-direction:column; align-items:center;">
        <h1>Multiplayer demo game:</h1>
        <div style="display:flex; flex-direction:row; gap:.5em">
            <input class="username" placeholder="Enter your name">
            <button class="ok">OK</button>
        </div>
    </div>
`

export function newConnectionForm(parentEl) {
    return new Promise((ok, ko) => {
        parentEl.innerHTML = connectionFormHtml

        const usernameEl = parentEl.querySelector(".username")
        const onValidate = () => {
            if (usernameEl.value) ok(usernameEl.value)
        }
        usernameEl.addEventListener("keypress", evt => {
            if (evt.key === "Enter") onValidate()
        })

        const okEl = parentEl.querySelector(".ok")
        okEl.addEventListener("click", onValidate)
    })
}


const disconnectedFormHtml = `
    <div style="height:100%; aspectRatio:${WIDTH}/${HEIGHT}; padding:1em; display:flex; flex-direction:column; align-items:center;">
        <p>You have been disconnected :(</p>
        <button class="reconnect">Reconnect</button>
    </div>
`

export function newDisconnectedForm(parentEl) {
    parentEl.innerHTML = disconnectedFormHtml

    const reconnectEl = parentEl.querySelector(".reconnect")
    reconnectEl.addEventListener("click", () => {
        window.location.reload()
    })
}