#!/usr/bin/env coffee
#
#  web-tix/src/client.coffee
#

{ DB_RMI_Client } = require('web-worm/client')
{ db_schema } = require('./db_schema')
{ remote_options } = require('./settings')


client = new DB_RMI_Client(db_schema, remote_options)


if module.parent
  module.exports = client

else
  # invoked from command line start REPL
  repl = require('repl')
  repl.start('client> ').context.client = client

