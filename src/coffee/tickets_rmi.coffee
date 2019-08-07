#!/usr/bin/env coffee
# -*- coding: utf-8 -*-

{ DB_RMI_Server, DB_RMI_Client } = require('db_worm')
tickets_db = require('./tickets_db').db

name = 'tickets_db'
app_id = 'tickets_db'
local_options =
  host: 'localhost'
  port: 8086
  path: ''
  protocol: 'ws'
remote_options =
  host: "alcarruth.net"
  port: 443
  path: "/wss/rmi_example"
  protocol: 'wss'

# TODO:
# where does this belong?
# 
id = "#{name}-#{Math.random().toString()[2..]}"

local_server = ->
  new DB_RMI_Server(app_id, tickets_db, local_options)

remote_server = ->
  new DB_RMI_Server(app_id, tickets_db, local_options)

local_client = ->
  new DB_RMI_Client(app_id, tickets_db, local_options)

remote_client = ->
  new DB_RMI_Client(app_id, tickets_db, remote_options)


exports.local_server = local_server
exports.remote_server = remote_server

exports.local_client = local_client
exports.remote_client = remote_client
