import { DynEntity } from './entity.mjs'
import Consts from './consts.mjs'

class Enemy extends DynEntity {

  init(kwargs) {
    super.init({
      width: 50,
      height: 50,
      color: "red",
      ...kwargs
    })
  }

  update(dt) {
    if(this.parent.step !== "GAME") return
    super.update(dt)
    this.checkExists()
  }

  checkExists() {
    if(this.game.isClient) return
    if(this.speedX > 0 && this.x < Consts.WIDTH + this.width) return
    if(this.speedX < 0 && this.x > -this.width) return
    if(this.speedY > 0 && this.y < Consts.HEIGHT + this.height) return
    if(this.speedY < 0 && this.y > -this.height) return
    this.remove()
  }
}

export { Enemy }
