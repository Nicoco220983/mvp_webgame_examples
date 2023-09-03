const { assign } = Object
const { cos, sin, atan2, sqrt, min, max, random } = Math

import Consts from './consts.mjs'
import { newConnectionForm, newDisconnectedForm } from './forms.mjs'
import { Game } from './game.mjs'

const { WIDTH, HEIGHT } = Consts

let gameEl = null
let game = null
let socket = null


export async function newGame(parentEl) {
  const urlParams = new URLSearchParams(window.location.search)
  let playerName = urlParams.get('player')
  if(!playerName) playerName = await newConnectionForm(parentEl)
  connectPlayer(parentEl, playerName)
}


function connectPlayer(parentEl, playerName) {
    return new Promise((ok, ko) => {
        const socketProtocol = (window.location.protocol.includes('https')) ? 'wss' : 'ws'
        socket = new WebSocket(`${socketProtocol}://${window.location.host}`)
        socket.addEventListener('open', () => {
            console.log('Connected to server!')
            socket.send(Consts.MSG_KEYS.JOIN_GAME + JSON.stringify({
              gameName: "default",
              playerName,
            }))
            ok()
        })
        socket.addEventListener('message', evt => {
            const key = evt.data.substring(0, Consts.MSG_KEY_LENGTH)
            const data = evt.data.substring(Consts.MSG_KEY_LENGTH)
            if(key === Consts.MSG_KEYS.ASSIGN_PLAYER) assignPlayer(parentEl, data)
            else if(key === Consts.MSG_KEYS.GAME_UPDATE) processGameUpdate(data)
            else if(key === Consts.MSG_KEYS.GAME_OVER) onGameOver()
        })
        socket.addEventListener('close', () => {
            console.log('Disconnected from server.')
            newDisconnectedForm(parentEl)
        })
        socket.addEventListener('error', console.error)
    })
}


function assignPlayer(parentEl, playerId) {
  _newGame(parentEl, playerId)
}


function processGameUpdate(data) {
  if(game) game.syncState(JSON.parse(data))
}


export function _newGame(parentEl, playerId) {
  parentEl.innerHTML = ""

  const two = newTwo(parentEl)
  game = new Game({
    isClient: true,
    playerId,
    two,
  })

  initListeners()

  // pauseGame(true)

  // const pointer = newPointer()

  // Game.gameScns = Game.makeGroup()
  // newGameScene()

  // const icons = Game.makeGroup()
  // const fullscreenIcon = addTo(icons, newFullscreenIcon())

  // pointer.prevIsDown = false
  two.bind("update", (frameCount, timeDelta) => {
    game.update(timeDelta/1000)
    game.syncSprite()
    // const time = frameCount / FPS
    // const gameScn = Game.gameScns.children[0]
    // if(pointer.isDown) {
    //   pauseGame(false)
    //   if(collide(fullscreenIcon, pointer)) {
    //     if(!pointer.prevIsDown) fullscreenIcon.click()
    //   } else {
    //     gameScn.click(pointer)
    //   }
    // }
    // if(!Game.paused) gameScn.update(time)
    // pointer.prevIsDown = pointer.isDown
  })
  
  two.play()
}


function newTwo(parentEl) {

  gameEl = document.createElement("div")
  assign(gameEl.style, {
    height: "100%",
    aspectRatio: `${WIDTH}/${HEIGHT}`,
    outline: "1px solid grey",
  })
  parentEl.appendChild(gameEl)

  const two = new Two({
    type: Two.Types.webgl,
    width: WIDTH,
    height: HEIGHT,
  }).appendTo(gameEl)
  assign(two.renderer.domElement.style, {
    width: "100%",
    height: "100%",
    backgroundColor: Consts.BACKGROUND_COLOR,
  })

  return two
}

// inputs

function initListeners() {

  //click
  let onClick = evt => processInput("click", getEvtPos(evt))
  gameEl.addEventListener("mousedown", onClick)
  gameEl.addEventListener("touchstart", onClick)

  // fullscreen icon
  const fsIcon = game.addIcon('assets/fullscreen-icon.png', 50, 2, 1)
  fsIcon.onClick = () => {
    if(!document.fullscreenElement) gameEl.parentElement.requestFullscreen()
    else document.exitFullscreen()
  }
  document.addEventListener("fullscreenchange", () => {
    fsIcon.index = document.fullscreenElement ? 1 : 0
  })
}

function processInput(key, kwargs) {
  const res = game.onInput(key, kwargs)
  if(res) socket.send(Consts.MSG_KEYS.INPUT + JSON.stringify(res))
}

function getEvtPos(evt) {
  const rect = gameEl.getBoundingClientRect()
  const strech = WIDTH / rect.width
  return {
      x: (evt.clientX - rect.left) * strech,
      y: (evt.clientY - rect.top) * strech
  }
}