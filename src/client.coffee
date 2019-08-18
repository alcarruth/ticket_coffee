#!/usr/bin/env coffee
#
#  client.coffee
#

{ DB_RMI_Client } = require('web-worm-client')
{ db_schema } = require('./db_schema')
{ local_options } = require('./settings')

client = new DB_RMI_Client(local_options)

exports.client = client

###
  # invoked from command line start REPL
  repl = require('repl')
  repl.start('client> ').context.client = client
###
