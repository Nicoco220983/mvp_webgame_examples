import { Entity } from './entity.mjs'
// const Bullet = require('./bullet');
import Consts from './consts.mjs'

class Player extends Entity {

  init(kwargs) {
    const randomColor = Math.floor(Math.random()*16777215).toString(16)
    super.init({
      score: 0,
      color: '#' + randomColor,
      ...kwargs
    })
  }

  toState() {
    return {
      ...super.toState(),
      name: this.name,
      score: this.score,
      color: this.color,
    }
  }

  syncState(state) {
    super.syncState(state)
    this.name = state.name
    this.score = state.score
    this.color = state.color
  }

  update(dt) {
    super.update(dt)

    this.score += dt * Consts.SCORE_PER_SECOND

    // Fire a bullet, if needed
    // this.fireCooldown -= dt;
    // if (this.fireCooldown <= 0) {
    //   this.fireCooldown += Constants.PLAYER_FIRE_COOLDOWN;
    //   return new Bullet(this.id, this.x, this.y, this.direction);
    // }
  }

//   takeBulletDamage() {
//     this.hp -= Constants.BULLET_DAMAGE;
//   }

//   onDealtDamage() {
//     this.score += Constants.SCORE_BULLET_HIT;
//   }
}

export { Player }
