const { assign } = Object
const { cos, sin, atan2, sqrt, min, max, random } = Math

import Consts from './consts.mjs'
import { collide } from './utils.mjs'
import { EntityMap, EntityList } from './entity.mjs'
import { Player } from './player.mjs'
import { Scene } from './scene.mjs'


class Game {
    
    constructor(kwargs) {
        this.game = this
        Object.assign(this, kwargs)
        this.updateRate = this.isClient ? Consts.CLIENT_FRAME_RATE : Consts.SERVER_UPDATE_RATE
        this.players = new EntityList(this, Player, { initSprite: false })
        this.masterPlayerIds = []
        this.scenes = new EntityMap(this, {
            "scene0": Scene
        })
        if(this.isClient) this.initSprite()
        this.startScene("scene0")
    }

    toState() {
        return {
            players: this.players.toState(),
            masterPlayerIds: this.masterPlayerIds,
            scenes: this.scenes.toState(),
        }
    }
  
    syncState(state) {
        this.players.syncState(state.players)
        this.masterPlayerIds = state.masterPlayerIds
        this.scenes.syncState(state.scenes)
    }
  
    update(dt) {
        this.scenes.update(dt)
    }

    addPlayer(id, name) {
        const player = this.players.add(id, { name })
        this.getScene().onAddPlayer(player)
        this.syncMasterPlayerIds()
    }

    rmPlayer(id) {
        this.players.remove(id)
        this.getScene().onRmPlayer(id)
        this.syncMasterPlayerIds()
    }

    syncMasterPlayerIds() {
        const playerIds = Object.keys(this.players)
        if(playerIds.length === 0) this.masterPlayerIds = []
        else this.masterPlayerIds = [playerIds[0]]
    }

    isMasterPlayer(playerId) {
        if(playerId === undefined) playerId = this.playerId
        return this.masterPlayerIds.indexOf(playerId) >= 0
    }

    startScene(key) {
        for(const k in Object.keys(this.scenes))
            this.scenes.remove(k)
        return this.scenes.add(key, {
            players: this.players.toState()
        })
    }

    getScene() {
        return Object.values(this.scenes)[0]
    }

    initSprite() {
        this.iconSprites = this.game.two.makeGroup()
        this.sceneSprites = this.game.two.makeGroup()
        this.sceneSprites.add(this.scenes.getSprite())
    }

    syncSprite() {
        this.scenes.syncSprite()
    }

    addIcon(src, imgSize, nbCols, nbRows) {
        const icon = this.game.two.makeSprite(
          src,
          Consts.WIDTH - Consts.ICON_SIZE * (3/4 + this.iconSprites.length * 5/4),
          Consts.ICON_SIZE*3/4,
          nbCols, nbRows,
        )
        icon.scale = Consts.ICON_SIZE / imgSize
        this.iconSprites.add(icon)
        return icon
    }

    onInput(key, kwargs) {
        if(this.isClient && key==="click") {
            for(const icon of this.iconSprites.children) {
                const iconPos = {
                    x: icon.translation.x,
                    y: icon.translation.y,
                    width: icon.width,
                    height: icon.height,
                }
                if(collide(kwargs, iconPos)) {
                    icon.onClick()
                    return
                }
            }
        }
        return this.getScene().onInput(key, kwargs)
    }
}

export { Game }