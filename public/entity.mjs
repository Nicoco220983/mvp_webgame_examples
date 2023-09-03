const { min, max, sqrt, cos, sin, atan2 } = Math


class Entity {

  constructor(parent, id, kwargs) {
    this.game = parent.game
    this.parent = parent
    this.id = id
    this.init(kwargs)
    if(this.game.isClient) this.initSprite()
  }

  init(kwargs) {
    Object.assign(this, kwargs)
  }

  toState() {
    return {}
  }

  syncState(state) {}

  remove() {
    this.removed = true
    if(this.game.isClient) this.rmSprite()
  }

  update(dt) {}

  initSprite() {}

  getSprite() {
    return this.sprite
  }

  syncSprite() {}

  rmSprite() {
    if(this.sprite) {
      this.sprite.remove()
      delete this.sprite
    }
  }
}

class PosEntity extends Entity {

  init(kwargs) {
    super.init({
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      ...kwargs
    })
  }

  toState() {
    return {
      ...super.toState(),
      x: this.x,
      y: this.y,
    }
  }

  syncState(state) {
    super.syncState(state)
    this.x = state.x
    this.y = state.y
  }
  
  initSprite() {
    if(this.color) {
      this.sprite = this.game.two.makeRectangle(this.x, this.y, this.width, this.height)
      this.sprite.fill = this.color
      this.sprite.noStroke()
    }
  }

  syncSprite() {
    this.sprite.translation.x = this.x
    this.sprite.translation.y = this.y
  }
}

class DynEntity extends PosEntity {

  init(kwargs) {
    super.init({
      speedX: 0,
      speedY: 0,
      ...kwargs,
    })
  }

  toState() {
    return {
      ...super.toState(),
      speedX: this.speedX,
      speedY: this.speedY,
    }
  }

  syncState(state) {
    super.syncState(state)
    this.speedX = state.speedX
    this.speedY = state.speedY
  }

  update(dt) {
    super.update(dt)
    this.x += this.speedX * dt
    this.y += this.speedY * dt
  }

  moveTo(target, speed, easing = 0) {
    const updRate = this.game.updateRate
    const dx = target.x - this.x, dy = target.y - this.y
    const dxy = sqrt(dx*dx  + dy*dy)
    if(dxy < speed / updRate) {
      this.x = target.x
      this.y = target.y
      return true
    }
    if(easing) {
      const de = speed * easing
      speed = max(speed / 3, min(speed, speed * dxy / de))
    }
    const angle = atan2(dy, dx)
    this.x += cos(angle) * speed / updRate
    this.y += sin(angle) * speed / updRate
    return false
  }
}

class EntityMap {

  #parent
  #game
  #defs
  #sprite

  constructor(parent, defs, kwargs) {
    this.#parent = parent
    this.#game = parent.game
    this.#defs = defs
    const initSprite = (kwargs && kwargs.initprite) !== false
    if(this.#game.isClient && initSprite) this.#sprite = this.#game.two.makeGroup()
  }

  getParent() {
    return this.#parent
  }

  getGame() {
    return this.#game
  }

  getSprite() {
    return this.#sprite
  }

  update(dt) {
    for (const [id, entity] of Object.entries(this)) {
      if(entity.removed) this.remove(id)
      else entity.update(dt)
    }
  }

  syncState(state) {
    for (const id of Object.keys(this)) {
      if(!state[id]) this.remove(id)
    }
    for (const [entId, entState] of Object.entries(state)) {
      const entity = this[entId]
      if(entity) { if(entState) entity.syncState(entState) }
      else this.add(entId, entState)
    }
  }

  toState() {
    const res = {}
    for (const [id, ent] of Object.entries(this)) {
      if(ent) res[id] = ent.toState()
    }
    return res
  }

  syncSprite() {
    for (const [id, entity] of Object.entries(this)) {
      if(!entity.removed) entity.syncSprite()
    }
  }

  add(key, kwargs) {
    this.remove(key)
    const res = this[key] = _new(this.#defs[key], this.#parent, key, kwargs)
    
    if(this.#sprite) {
      const resSprite = res.getSprite()
      if(resSprite) this.#sprite.add(resSprite)
    }
    return res
  }

  remove(id) {
    const entity = this[id]
    if(entity) {
      entity.remove()
      delete this[id]
    }
  }
}

class EntityList extends EntityMap {

  #EntityClass
  #lastAutoId

  constructor(parent, EntityClass, kwargs) {
    super(parent, null, kwargs)
    this.#EntityClass = EntityClass
    this.#lastAutoId = -1
  }

  add(arg1, arg2) {
    const id = arg2 === undefined ? this.newAutoId() : arg1
    const kwargs = arg2 === undefined ? arg1 : arg2
    this.remove(id)
    const res = this[id] = _new(this.#EntityClass, this.getParent(), id, kwargs)
    
    if(this.getSprite()) {
      const resSprite = res.getSprite()
      if(resSprite) this.getSprite().add(resSprite)
    }
    return res
  }

  newAutoId() {
    this.#lastAutoId += 1
    return this.#lastAutoId.toString()
  }
}

function _new(fun, ...args) {
  if(fun.toString().startsWith("class")) {
    return new fun(...args)
  } else {
    return fun(...args)
  }
}

export { Entity, PosEntity, DynEntity, EntityList, EntityMap }
