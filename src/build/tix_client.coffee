#!/usr/bin/env coffee
#
#  client.coffee
#


if not window?
  { DB_RMI_Client } = require('db_worm')
  { db_schema } = require('./db_schema')
  { remote_options } = require('./settings')

client = new DB_RMI_Client(remote_options)

if not window?

  if module.parent
    exports.client = client

  else
    # invoked from command line start REPL
    repl = require('repl')
    repl.start('client> ').context.client = client

else
  window.client = client
