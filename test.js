process.env.NODE_ENV = 'test'

const Promise = require('bluebird')
const co = Promise.coroutine
const test = require('tape')
const rawCreateBot = require('@tradle/bots').bot
const createNag = require('./')
const BANKRUPTCY_STATUS = 'tradle.BankruptcyStatus'
const TYPE = '_t'
const {
  buildId
} = require('./utils')

function createBot (opts) {
  opts.inMemory = true
  return rawCreateBot(opts)
}

test('basic', co(function* (t) {
  const bot = createBot({
    send: co(function* () {})
  })

  bot.use(createNag)

  const { map } = bot.nag
  const permalink = '1'
  const link1 = '2'
  const txId1 = 'abc'
  const userId = 'ted'

  bot.receive({
    author: userId,
    // message
    object: {
      // payload
      object: {
        [TYPE]: BANKRUPTCY_STATUS
      }
    },
    objectinfo: { link: link1, permalink }
  })

  yield waitToReceive()

  const expectedState = {
    [link1]: {
      permalink,
      userId
    }
  }

  let state = yield map.get()
  t.same(state, expectedState)

  bot.seals.onread({
    link: link1,
    txId: txId1
  })

  yield awaitSealEvent('read')
  expectedState[link1].txId = txId1
  state = yield map.get()
  t.same(state, expectedState)

  bot.seals.onnewversion({
    prevLink: link1,
    txId: txId1
  })

  const sent = yield new Promise(resolve => {
    bot.send = resolve
  })

  yield awaitSealEvent('newversion')
  t.equal(sent.object[TYPE], 'tradle.LatestVersionRequest')
  t.same(sent.object.item, {
    id: buildId({
      type: BANKRUPTCY_STATUS,
      link: link1,
      permalink
    })
  })

  t.end()

  function waitToReceive () {
    return new Promise(resolve => bot.once('message', resolve))
  }

  function awaitSealEvent (event) {
    return new Promise(resolve => bot.seals.once(event, resolve))
  }
}))
