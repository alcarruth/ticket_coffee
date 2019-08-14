#!/usr/bin/env coffee
#
#  settings.coffee
#

pg_options = 
  host: '/var/run/postgresql'
  database: 'tickets'

local_options =
  host: 'localhost'
  port: 8086
  path: ''
  protocol: 'ws'
  log_level: 2

remote_options =
  host: 'alcarruth.net'
  port: 443
  path: '/wss/tickets_coffee'
  protocol: 'wss'
  log_level: 2


if not window?
  exports.pg_options = pg_options
  exports.local_options = local_options
  exports.remote_options = remote_options

