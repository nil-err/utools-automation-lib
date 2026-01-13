const chrome = require('./chrome')
const validators = require('./validators')
const aicolate = require('./aicolate')
const utils = require('./utils')
const pkg = require('./package.json')

module.exports = {
  ...chrome,
  ...validators,
  ...aicolate,
  ...utils,
  version: pkg.version,
}
