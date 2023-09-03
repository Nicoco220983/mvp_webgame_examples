import { DynEntity } from './entity.mjs'
import Consts from './consts.mjs'
const { min, max, cos, sin, atan2 } = Math

class Hero extends DynEntity {

  init(kwargs) {
    super.init({
      width: 50,
      height: 50,
      ...kwargs
    })
    this.target = {
      x: this.x,
      y: this.y,
    }
  }
  
  initSprite() {
    const player = this.game.players[this.id]
    this.sprite = this.game.two.makeGroup()
    const heroSprite = this.game.two.makeRectangle(0, 0, this.width, this.height)
    heroSprite.fill = player.color
    heroSprite.noStroke()
    this.sprite.add(heroSprite)
    const nameSprite = this.game.two.makeText(player.name, 0, 40, { size: 20 })
    this.sprite.add(nameSprite)
  }

  toState() {
    return {
      ...super.toState(),
      target: this.target,
    }
  }

  syncState(state) {
    super.syncState(state)
    this.target = state.target
  }

  update(dt) {
    if(this.parent.step !== "GAME") return
    super.update(dt)

    this.moveTo(this.target, 1000, .2)

    this.x = min(Consts.WIDTH-this.width/2, max(this.width/2, this.x))
    this.y = min(Consts.HEIGHT-this.height/2, max(this.height/2, this.y))
  }

  setTarget(target) {
    this.target.x = min(Consts.WIDTH-this.width/2, max(this.width/2, target.x))
    this.target.y = min(Consts.HEIGHT-this.height/2, max(this.height/2, target.y))
  }

  applyCollisionWithAnotherHero(hero2) {
    const angle = atan2(hero2.y - this.y, hero2.x - this.x)
    this.setTarget({
      x: this.x - cos(angle) * 100,
      y: this.y - sin(angle) * 100,
    })
  }

  applyCollisionWithEnemy() {
    this.remove()
  }
}

export { Hero }
