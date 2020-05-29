#!/usr/bin/env coffee
#
#  logger.coffee
#

util = require('util')

# The code below works great in nodejs in which console.log has a
# shallow depth by default.  The conditional inclusion (not window?)
# also worked well before I started using browserify to bundle the js,
# but browserify ignores the condition and chokes on the
# require('util').  It's ok that it is not included in the browser but
# I'd like it for CLI clients and servers.

inspect = require('util').inspect

inspect = (obj) ->
  options =
    showHidden: false
    depth: null
    colors: true
  util.inspect(obj, options)

log = (heading, args...) ->
  args = args.map(inspect).join('\n')
  console.log("\n\n#{heading}\n#{args}\n\n")


exports.log = log
