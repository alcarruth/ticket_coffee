#!/usr/bin/env coffee
#

{ DB_RMI_Server } = require('db_worm')
{ db_schema } = require('./db_schema')
{ local_options, pg_options } = require('./settings')

server = new DB_RMI_Server(local_options, pg_options, db_schema)

if module.parent
  exports.server = server

else
  # invoked from command line start REPL
  repl = require('repl')
  repl.start('server> ').context.server = server
