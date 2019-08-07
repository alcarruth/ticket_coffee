#!/usr/bin/env coffee
# -*- coding: utf-8 -*-
#
#  tickets_rmi_server.coffee
# 

{ remote_server } = require('./tickets_rmi')

app = remote_server()

if module?.parent
  # imported into parent module
  exports.app = app

else
  # invoked from command line start REPL
  app.start()
  repl = require('repl')
  repl.start('tickets> ').context.app = app

