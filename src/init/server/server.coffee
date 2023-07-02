#!/usr/bin/env coffee
# -*- coding: utf-8 -*-

WS_RMI_Server = require('ws_rmi').WS_RMI_Server

{ app_id, options } = require('./settings').local
{ Tickets_DB, Tickets_DB_Stub } = require('./tickets_db_rmi')

class App

  constructor: (@app_id, @options) ->
    @tickets_db = new Tickets_DB(@app_id)
    @server = new WS_RMI_Server(@options)
    @server.register(@tickets_db)

app = new App(app_id, options)

if module?.parent
  # imported into parent module
  exports.server = server

else
  # invoked from command line start REPL
  app.server.start()
  # repl = require('repl')
  # repl.start('stack> ').context.app = app



