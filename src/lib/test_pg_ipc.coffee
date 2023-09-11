#!/usr/bin/env coffee 
#

# Unix Domain Sockets
# 
# Connections to unix sockets can also be made. This can be useful on
# distros like Ubuntu, where authentication is managed via the socket
# connection instead of a password.

{ Client } = require('pg')

ipc_options = {
  host: '/var/run/postgresql'
  user: 'tickets_user'
  password: 'fijilinc'
  database: 'tickets'
}

module.exports = new Client(ipc_options)
