#!/usr/bin/env coffee
#
#  settings.coffee
#

{ log } = require('./logger')

pg_options = 
  host: '/var/run/postgresql'
  database: 'tickets'

ipc_options =
  port: null
  host: null
  path: '/tmp/stack-rmi'
  log_level: 2
  log: log

local_options =
  host: 'localhost'
  port: 8086
  path: ''
  protocol: 'ws'
  log_level: 2
  log: log

remote_options =
  host: 'alcarruth.net'
  port: 443
  path: '/wss/tickets_coffee'
  protocol: 'wss'
  log_level: 2
  log: console.log

exports.pg_options = pg_options
exports.local_options = local_options
exports.remote_options = remote_options

