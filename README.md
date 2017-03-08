
# @tradle/bot-version-hawk

request next version of an object when a seal for it is detected on blockchain

## Usage 

```js
const versionHawk = require('@tradle/bot-version-hawk')

// request new versions as they are detected
bot.use(versionHawk)

// or handle things yourself
bot.use(versionHawk, {
  handler: function onNewVersion ({ current /*, seal props */ }) {
    // a new version of the object `current` exists
  }
})
```
