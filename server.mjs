import crypto from "crypto"

import express from "express"
import { WebSocketServer } from 'ws'

import Consts from './public/consts.mjs'
import { Game } from './public/game.mjs'

class GameServer {

  constructor() {
    this.app = express()
    this.app.use(express.static('public'))

    this.port = process.env.PORT || 3000

    this.games = {}
  }

  listen() {
    this.server = this.app.listen(this.port)
    console.log(`Server listening on port ${this.port}`)

    this.startWebocketServer()
  }

  startWebocketServer() {

    this.websocketServer = new WebSocketServer({ server: this.server })
    this.websockets = {}

    this.websocketServer.on('connection', ws => {

      ws.id = crypto.randomBytes(8).toString("hex")
      console.log(`Player '${ws.id}' connected`)
      // this.websockets[ws.id] = ws
    
      ws.on('message', (data, isBinary) => {
        const msg = isBinary ? data : data.toString()
        const key = msg.substring(0, Consts.MSG_KEY_LENGTH)
        const body = msg.substring(Consts.MSG_KEY_LENGTH)
        if(key === Consts.MSG_KEYS.JOIN_GAME) this.addPlayerToGame(ws, JSON.parse(body))
        else if(key === Consts.MSG_KEYS.INPUT) this.handlePlayerInput(ws, JSON.parse(body))
        else console.warn("Unknown websocket key", key)
      })
    
      ws.on('error', console.error)
    
      ws.on('close', () => {
        console.log(`Player '${ws.id}' disconnected`)
        this.rmPlayerFromGame(ws)
      })
    })
  }

  startGame(name) {
    const game = new Game({
      name,
      isClient: false
    })
    game.websockets = {}

    game.loopId = setInterval(() => {
      game.update(1 / Consts.SERVER_UPDATE_RATE)
      this.sendGameUpdates(game)
    }, 1000 / Consts.SERVER_UPDATE_RATE)

    return game
  }

  addPlayerToGame(ws, kwargs) {
    const { playerName, gameName } = kwargs
    let game = this.games[gameName]
    if(!game) {
      console.log(`Create game '${gameName}'`)
      game = this.games[gameName] = this.startGame(gameName)
    }
    console.log(`Add player '${ws.id}' with name '${playerName}' to game '${gameName}'`)
    ws.game = game
    game.websockets[ws.id] = ws
    game.addPlayer(ws.id, playerName)
    ws.send(Consts.MSG_KEYS.ASSIGN_PLAYER + ws.id)
  }

  rmPlayerFromGame(ws) {
    console.log(`Remove player '${ws.id}' from game '${ws.game.name}'`)
    ws.game.rmPlayer(ws.id)
    delete ws.game.websockets[ws.id]
    if(Object.keys(ws.game.websockets).length === 0) {
      console.log(`Delete game '${ws.game.name}'`)
      this.stopGame(ws.game)
    }
  }

  stopGame(game) {
    delete this.games[game.name]
    clearInterval(game.loopId)
  }

  handlePlayerInput(ws, data) {
    ws.game.onInput(ws.id, data)
  }

  sendGameUpdates(game) {
    const state = game.toState()
    Object.keys(game.websockets).forEach(id => {
      const socket = game.websockets[id]
      socket.send(Consts.MSG_KEYS.GAME_UPDATE + JSON.stringify(state))
    })
  }
}

const gameServer = new GameServer()
gameServer.listen()

// const app = express()
// app.use(express.static('public'))

// const port = process.env.PORT || 3000
// const server = app.listen(port)
// console.log(`Server listening on port ${port}`)

// const wss = new WebSocketServer({ server })
// const Sockets = {}

// wss.on('connection', ws => {
//   onConnect(ws)

//   ws.on('message', (data, isBinary) => {
//     const msg = isBinary ? data : data.toString()
//     const key = msg.substring(0, Consts.MSG_KEY_LENGTH)
//     const body = msg.substring(Consts.MSG_KEY_LENGTH)
//     if(key === Consts.MSG_KEYS.JOIN_GAME) joinGame(ws, body)
//     else if(key === Consts.MSG_KEYS.INPUT) handleInput(ws, body)
//     else console.warn("Unknown websocket key", key)
//   })

//   ws.on('error', console.error)

//   ws.on('close', () => onDisconnect(ws))
// })

// const game = new Game({
//   isClient: false
// })

// function joinGame(ws, username) {
//   game.addPlayer(ws.id, username)
// }

// function handleInput(ws, data) {
//   game.onInput(ws.id, JSON.parse(data))
// }

// function onConnect(ws) {
//   ws.id = crypto.randomBytes(16).toString("hex")
//   console.log('Player connected!', ws.id)
//   Sockets[ws.id] = ws
// }

// function onDisconnect(ws) {
//   console.log('Player disconnected!', ws.id)
//   delete Sockets[ws.id]
//   game.rmPlayer(ws.id)
// }

// function sendUpdates() {
//   const state = game.toState()
//   Object.keys(Sockets).forEach(id => {
//     const socket = Sockets[id]
//     const player = game.players.items[id]
//     socket.send(Consts.MSG_KEYS.GAME_UPDATE + JSON.stringify(state))
//   })
// }

// setInterval(() => {
//   game.update(1 / Consts.SERVER_UPDATE_RATE)
//   sendUpdates()
// }, 1000 / Consts.SERVER_UPDATE_RATE)
