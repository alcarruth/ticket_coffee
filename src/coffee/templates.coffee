
fs = require('fs')
{ promisify } = require('util')
ms = require('mustache')
hb = require('handlebars')

readFile = promisify(fs.readFile)
writeFile = promisify(fs.writeFile)
readdir = promisify(fs.readdir)

load_templates = ->
  templates = {}
  for f in fs.readdirSync('./templates')
    templates[f] = fs.readFileSync("./templates/#{f}", 'utf-8')
  return templates

templates = load_templates()

exports.templates = templates

