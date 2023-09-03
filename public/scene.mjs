import Consts from './consts.mjs'
import { collide } from './utils.mjs'
import { Entity, PosEntity, EntityMap, EntityList } from './entity.mjs'
import { Hero } from './hero.mjs'
import { Enemy } from './enemy.mjs'
const { random } = Math

class Scene extends Entity {

  constructor(parent, id, kwargs) {
    super(parent, id, kwargs)
    if(kwargs && kwargs.players) this.initHeros(kwargs.players)
  }

  init(kwargs) {
    super.init(kwargs)
    this.time = 0
    this.score = 0
    this.step = "START"
    this.entities = new EntityMap(this, {
      heros: () => new EntityList(this, Hero),
      enemies: () => new EntityList(this, Enemy),
      startTexts: (...args) => this.newStartTexts(...args),
      gameOverTexts: (...args) => this.newGameOverTexts(...args),
    })
    this.entities.add("heros")
    this.entities.add("enemies")
    this.entities.add("startTexts")
  }

  toState() {
    return {
      time: this.time,
      step: this.step,
      score: this.score,
      lastHeroId: this.lastHeroId,
      entities: this.entities.toState(),
    }
  }

  syncState(state) {
    this.time = state.time
    this.step = state.step
    this.score = state.score,
    this.lastHeroId = state.lastHeroId
    this.entities.syncState(state.entities)
  }

  onAddPlayer(player) {
    this.addHero(player.id)
  }

  onRmPlayer(playerId) {
    this.rmHero(playerId)
  }

  update(dt) {
    this.time += dt
    if(this.step === "GAME") {
      this.entities.remove("startTexts")
      this.nextEnemyTime ||= this.time
      this.checkHeroHeroCollisions()
      this.randomlyCreateEnemies()
      this.checkHeroEnemyCollisions()
    } else if(this.step === "GAMEOVER") {
      if(!this.entities.gameOverTexts) this.entities.add("gameOverTexts")
    }
    this.entities.update(dt)
  }

  // hero

  initHeros(players) {
    for(let playerId of Object.keys(players)) {
      this.addHero(playerId)
    }
  }

  addHero(id) {
    this.entities.heros.add(id, {
      x: Consts.WIDTH * Math.random(),
      y: Consts.HEIGHT * (1 + Math.random()) / 2,
    })
  }

  rmHero(id) {
    this.entities.heros.remove(id)
  }

  checkHeroHeroCollisions() {
    const heros = this.entities.heros, heroIds = Object.keys(heros)
    for(let i=0; i<heroIds.length; ++i) {
      const hero1 = heros[heroIds[i]]
      for(let j=i+1; j<heroIds.length; ++j) {
        const hero2 = heros[heroIds[j]]
        if(collide(hero1, hero2)) {
          hero1.applyCollisionWithAnotherHero(hero2)
          hero2.applyCollisionWithAnotherHero(hero1)
        }
      }
    }
  }

  // enemy

  randomlyCreateEnemies() {
    if(this.game.isClient) return
    if(this.nextEnemyTime > this.time) return
    this.enemyNum ||= 0
    const enemy = this.entities.enemies.add(this.enemyNum, {
      x: Consts.WIDTH * random(),
      y: -50,
      speedY: 200,
    })
    this.nextEnemyTime += 1 + random()
    this.enemyNum += 1
    this.score += 1
    return enemy
  }

  checkHeroEnemyCollisions() {
    const heros = this.entities.heros, heroIds = Object.keys(heros)
    const enemies = this.entities.enemies, enemyIds = Object.keys(enemies)
    for(let i=0; i<heroIds.length; ++i) {
      const hero = heros[heroIds[i]]
      for(let j=0; j<enemyIds.length; ++j) {
        const enemy = enemies[enemyIds[j]]
        if(collide(hero, enemy)) {
          this.lastHeroId = hero.id
          hero.applyCollisionWithEnemy()
          this.checkRemainingHero()
        }
      }
    }
  }

  checkRemainingHero() {
    const nbRemHeros = Object.values(this.entities.heros).filter(h => !h.removed).length
    if(nbRemHeros === 0) this.step = "GAMEOVER"
  }

  // sprite

  initSprite() {
    this.sprite = this.game.two.makeGroup()
    this.sprite.add(this.entities.getSprite())
  }

  syncSprite() {
    this.entities.syncSprite()
  }

  newStartTexts(...args) {
    const game = this.game
    const res = new PosEntity(...args)
    if(game.isClient) {
      res.sprite = game.two.makeGroup()
      const titleTxt = game.two.makeText("MULTI BASIC", Consts.WIDTH / 2, Consts.HEIGHT / 2, { size: 50 })
      res.sprite.add(titleTxt)
    }
    res.update = function() {
      if(!res.startText && game.isClient && game.isMasterPlayer()) {
        res.startText = game.two.makeText("Click to start", Consts.WIDTH / 2, Consts.HEIGHT / 2 + 100, { size: 30 })
        res.sprite.add(res.startText)
      }
    }
    return res
  }

  newGameOverTexts(...args) {
    const game = this.game, scene = this
    const res = new PosEntity(...args)
    if(game.isClient) {
      res.sprite = game.two.makeGroup()
      const gameOverTxt = game.two.makeText("GAME OVER", Consts.WIDTH / 2, Consts.HEIGHT / 2, { size: 50 })
      res.sprite.add(gameOverTxt)
      const lastPlayer = game.players[this.lastHeroId]
      const lastPlayerTxt = game.two.makeText(`Last player: ${lastPlayer.name}`, Consts.WIDTH / 2, Consts.HEIGHT / 2 + 50, { size: 30 })
      res.sprite.add(lastPlayerTxt)
      const scoreTxt = game.two.makeText(`Score: ${this.score}`, Consts.WIDTH / 2, Consts.HEIGHT / 2 + 90, { size: 30 })
      res.sprite.add(scoreTxt)
    }
    res.update = function() {
      if(game.isClient) {
        res.restartTextTime ||= scene.time + 2
        if(!res.restartText && game.isMasterPlayer() && scene.time >= res.restartTextTime) {
          res.restartText = game.two.makeText("Click to restart", Consts.WIDTH / 2, Consts.HEIGHT / 2 + 150, { size: 30 })
          res.sprite.add(res.restartText)
        }
      }
    }
    return res
  }

  // input

  onInput(key, kwargs) {
    if(this.game.isClient) {
      if(this.step === "START") {
        if(key === "click" && this.entities.startTexts.startText) {
          return {
            start: true
          }
        }
      } else if(this.step === "GAME") {
        if(key === "click") {
          return {
            target: kwargs
          }
        }
      } else if(this.step === "GAMEOVER") {
        if(key === "click" && this.entities.gameOverTexts.restartText) {
          return {
            restart: true
          }
        }
      }
    } else {
      if(this.step === "START") {
        if(kwargs.start && this.game.isMasterPlayer(key)) {
          this.step = "GAME"
        }
      } else if(this.step === "GAME") {
        if(kwargs.target) {
          const hero = this.entities.heros[key]
          if(hero) hero.setTarget(kwargs.target)
        }
      } else if(this.step === "GAMEOVER") {
        if(kwargs.restart && this.game.isMasterPlayer(key)) {
          this.restart()
        }
      }
    }
  }

  restart() {
    this.game.startScene("scene0")
  }
}

export { Scene }
