#!/usr/bin/env coffee
#
#  web-tix/src/settings.coffee
#

{ log } = require('./logger')

# TODO: Can I get a better way to handle permissions?  We run as user
# carruth because carruth has access to the postgresql database.
# The ipc socket is chown'd to carruth:www-data so both the app and
# nginx have r/w access to it.


# The pg_options are used by server to access the
# postgresql database.
# 
pg_options =
  # user: 'webtix'
  # password: 'fijilinc'
  host: '/var/run/postgresql'
  database: 'tickets'


# The ipc_options are by the server when serving over ipc socket.
# The socket path must match that provided to nginx by
# /etc/nginx/apps-enabled/web-tix.conf
# 
ipc_options =
  port: null
  host: null
  path: '/tmp/web-tix'
  uid: 1000 # carruth
  gid: 33 # www-data
  log_level: 0
  log: log


# The local_options are used by the server when running as an http
# server behind nginx.  The port must match that provided to nginx by
# /etc/nginx/apps-enabled/web-tix.conf
# 
local_options =
  host: 'localhost'
  port: 8086
  path: ''
  protocol: 'ws'
  log_level: 2
  log: log


# The remote_options are used by an external client to access app thru
# the nginx server.  The path must match that provided to nginx by
# /etc/nginx/apps-enabled/web-tix.conf
# 
remote_options =
  host: 'alcarruth.net'
  port: 443
  path: '/apps/web-tix'
  protocol: 'wss'
  log_level: 2
  log: console.log



exports.pg_options = pg_options
exports.ipc_options = ipc_options
exports.local_options = local_options
exports.remote_options = remote_options
