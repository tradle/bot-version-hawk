const TYPE = '_t'

const {
  shallowExtend,
  shallowClone
} = require('@tradle/bots').utils

module.exports = {
  createVersionRequest,
  buildId,
  shallowExtend,
  shallowClone
}

function createVersionRequest (wrapper) {
  const { objectinfo } = wrapper
  const { object } = wrapper.object
  return {
    [TYPE]: 'tradle.LatestVersionRequest',
    message: 'Hey, would you mind sharing the latest version of one of your documents with me?',
    item: {
      id: buildId({
        type: object[TYPE],
        link: objectinfo.link,
        permalink: objectinfo.permalink
      })
    }
  }
}

function buildId ({ type, link, permalink }) {
  return `${type}_${link}_${permalink}`
}
