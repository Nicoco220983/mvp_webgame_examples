function distTo(pos1, pos2) {
    const dx = pos1.x - pos2.x
    const dy = pos1.y - pos2.y
    return Math.sqrt(dx * dx + dy * dy)
}

function collide(box1, box2) {
    const w1 = (box1.width || 0) / 2, h1 = (box1.height || 0) / 2
    const w2 = (box2.width || 0) / 2, h2 = (box2.height || 0) / 2
    const x11 = box1.x - w1, x12 = box1.x + w1, y11 = box1.y - h1, y12 = box1.y + h1
    const x21 = box2.x - w2, x22 = box2.x + w2, y21 = box2.y - h2, y22 = box2.y + h2
    if(x11 > x22 || x12 < x21 || y11 > y22 || y12 < y21) return false
    return true
}

export {
    distTo,
    collide
}