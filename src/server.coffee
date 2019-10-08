#!/usr/bin/env coffee
#
#  server.coffee
#

{ DB_RMI_Server } = require('web-worm-server')
{ db_schema } = require('./db_schema')
{ local_options, pg_options } = require('./settings')

server = new DB_RMI_Server(local_options, pg_options, db_schema)
server.start()

if module.parent
  exports.server = server

else
  # invoked from command line start REPL
  repl = require('repl')
  repl.start('server> ').context.server = server