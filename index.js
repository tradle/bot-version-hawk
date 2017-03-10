const Promise = require('bluebird')
const co = Promise.coroutine
const debug = require('debug')('tradle:bot-request-latest')
const {
  createVersionRequest,
  shallowExtend
} = require('./utils')

const createMap = require('./map')
const TESTING = process.env.NODE_ENV === 'test'

exports = module.exports = function versionNag (bot, opts={}) {
  const {
    handler=defaultHandler
  } = opts

  const map = createMap(bot)
  const receive = co(function* ({ user, link, permalink, type }) {
    // TODO: optimize
    const userId = user.id
    const update = { userId, permalink, type }

    ;[link, permalink].forEach(link => {
      map.update({ link, update })
    })

    yield map.commit()
  })

  const onread = co(function* ({ link, txId }) {
    const update = { txId }
    log({ link, msg: 'read seal for {type}' })
    map.update({ link, update })
    yield map.commit()
  })

  const log = co(function* ({ link, msg }) {
    try {
      const { type } = yield map.get(link)
      debug(msg.replace(/\{type\}/g, type))
    } catch (err) {}
  })

  const onnewversion = co(function* (data) {
    const { prevLink, txId } = data
    const prev = yield map.get(prevLink)
    if (!prev) return

    log({ link: prevLink, msg: 'detected newversion for {type}' })

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

    yield handler(data)
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

  if (TESTING) bot.nag = { map }

  return function uninstall () {
    subs.forEach(unsub => unsub())
  }
}
