const chrome = require('./src/chrome')
const validators = require('./src/validators')
const aicolate = require('./src/aicolate')
const utoolsUtils = require('./src/utools')
const pkg = require('./package.json')

module.exports = {
  ...chrome,
  ...validators,
  ...aicolate,
  ...utoolsUtils,
  version: pkg.version,
}
