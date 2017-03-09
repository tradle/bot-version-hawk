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
  const req = {
    [TYPE]: 'tradle.FormRequest',
    // message: 'Hey, would you mind sharing the latest version of one of your documents with me?',
    message: `Hi there. You previously shared this with us. Both of our banks are using Tradle's privacy conscious network to inform both banks that changes of shared data were made without us knowing what was changed. Thus we must ask you if you could share the latest version.`,
    form: object[TYPE]
    // item: {
    //   id: buildId({
    //     type: object[TYPE],
    //     link: objectinfo.link,
    //     permalink: objectinfo.permalink
    //   })
    // }
  }

  if (object.product) {
    req.product = object.product
  }

  return req
}

function buildId ({ type, link, permalink }) {
  return `${type}_${link}_${permalink}`
}
