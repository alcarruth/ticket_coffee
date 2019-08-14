#!/usr/bin/env coffee
#

fs = require('fs')

class Templates

  constructor: ->
    @templates = {}

  load_html_files: =>
    pat = /.html$/
    files = fs.readdirSync('./')
    keys = files.filter((s)->pat.test(s)).map((s)->s.replace(pat,''))
    @templates = {}
    for key in keys
      @templates[key] = fs.readFileSync("./#{key}.html", 'utf-8')
    return @templates

  to_JSON: =>
    JSON.stringify(@templates)
  
  from_JSON: (str) =>
    @templates = JSON.parse(str)

if module.parent
  exports.Templates = Templates
  
