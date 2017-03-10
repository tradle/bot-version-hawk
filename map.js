const Promise = require('bluebird')
const co = Promise.coroutine
const createQueue = require('ya-promise-queue')
const STORAGE_KEY = require('./package').name

module.exports = function persistedMap (bot) {
  let map
  let dirty

  const queue = createQueue()
  const get = co(function* (key) {
    if (!map) {
      try {
        map = yield bot.shared.get(STORAGE_KEY)
      } catch (err) {
        map = {}
      }
    }

    return key ? map[key] : map
  })

  function set (val) {
    if (!val) throw new Error('expected value')
    map = val
    return bot.shared.set(STORAGE_KEY, map)
  }

  const updateMap = co(function* ({ link, update }) {
    if (!map) map = yield init
    if (!map[link]) map[link] = {}

    const val = map[link]
    for (let p in update) {
      if (val[p] !== update[p]) {
        val[p] = update[p]
        dirty = true
      }
    }
  })

  const commit = co(function* () {
    if (dirty) yield set(map)
    dirty = false
  })

  const init = get()
  return {
    get: key => queue.push(() => get(key)),
    set: val => queue.push(() => set(val)),
    update: data => queue.push(() => updateMap(data)),
    commit
  }
}
