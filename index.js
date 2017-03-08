const Promise = require('bluebird')
const co = Promise.coroutine
const debug = require('debug')('tradle:bot-request-latest')
const STORAGE_KEY = require('./package').name
const {
  createVersionRequest,
  shallowExtend
} = require('./utils')

const TESTING = process.env.NODE_ENV === 'test'

exports = module.exports = function versionNag (bot, opts={}) {
  const {
    handler=defaultHandler
  } = opts

  const manager = manageMap(bot)
  const receive = co(function* ({ user, link, permalink }) {
    // TODO: optimize
    const map = yield manager.get()
    const userId = user.id
    const update = { userId, permalink }
    const upToDate = [link, permalink].every(link => {
      return !updateMap({ map, link, update })
    })

    if (!upToDate) yield manager.set(map)
  })

  const onread = co(function* ({ link, txId }) {
    const map = yield manager.get()
    const update = { txId }
    const upToDate = updateMap({ map, link, update })
    if (!upToDate) yield manager.set(map)
  })

  const onnewversion = co(function* (data) {
    const { prevLink, txId } = data
    const map = yield manager.get()
    const prev = map[prevLink]
    if (!prev) return

    const { userId } = prev
    const user = yield bot.users.get(userId)
    const current = user.history.find(wrapper => {
      return wrapper.objectinfo.link === prevLink
    })

    if (!current) {
      debug(`expected to find previous version: "${prevLink}" but did not`)
      return
    }

    data = shallowExtend({
      user,
      current
    }, data)

    return handler(data)
  })

  function defaultHandler ({ current, user }) {
    return bot.send({
      userId: user.id,
      object: createVersionRequest(current)
    })
  }

  const subs = [
    bot.addReceiveHandler(receive),
    bot.seals.addOnReadHandler(onread),
    bot.seals.addOnNewVersionHandler(onnewversion)
  ]

  if (TESTING) bot.nag = { map: manager }

  return function uninstall () {
    subs.forEach(unsub => unsub())
  }
}

function updateMap ({ map, link, update }) {
  if (!map[link]) map[link] = {}

  const val = map[link]
  let updated

  for (let p in update) {
    if (val[p] !== update[p]) {
      val[p] = update[p]
      updated = true
    }
  }

  return updated
}

function manageMap (bot) {
  let map
  const get = co(function* () {
    if (!map) {
      try {
        map = yield bot.shared.get(STORAGE_KEY)
      } catch (err) {
        map = {}
      }
    }

    return map
  })

  function set (val) {
    map = val
    return bot.shared.set(STORAGE_KEY, map)
  }

  return { get, set }
}
