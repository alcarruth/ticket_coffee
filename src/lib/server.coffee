#!/usr/bin/env coffee
#
#  web-tix/src/server.coffee
#

{ DB_RMI_Server } = require('web-worm/server')
{ db_schema } = require('./db_schema')
{ local_options, pg_options } = require('./settings')

options = local_options
server = new DB_RMI_Server(db_schema, pg_options, options)


if module.parent
  module.exports = server

else
  # invoked from command line start REPL
  repl = require('repl')
  repl.start('server> ').context.server = server
