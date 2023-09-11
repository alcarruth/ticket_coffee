#!/usr/bin/env coffee
#
#  web-tix/src/client.coffee
#

{ DB_RMI_Client } = require('web-worm/src/client')
{ db_schema } = require('./db_schema')
{ ipc_options } = require('./settings')

ipc_client = new DB_RMI_Client(db_schema, ipc_options)

try
  if module.parent
    module.exports = ipc_client
  else
    # invoked from command line start REPL
    repl = require('repl')
    repl.start('ipc_client> ').context.client = ipc_client

catch error
  console.log("Failed to create ipc_client.")
  console.log error
