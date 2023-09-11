#!/usr/bin/env coffee
#
#  web-tix/src/ipc_server.coffee
#

{ DB_RMI_Server } = require('web-worm/src/server')
{ db_schema } = require('./db_schema')
{ ipc_options, pg_options } = require('./settings')

ipc_server = new DB_RMI_Server(db_schema, pg_options, ipc_options)

try
  if module.parent
    module.exports = ipc_server
  else
    # invoked from command line start REPL
    repl = require('repl')
    repl.start('ipc_server> ').context.server = ipc_server

catch error
  console.log("Failed to create ipc_server.")
  console.log error
