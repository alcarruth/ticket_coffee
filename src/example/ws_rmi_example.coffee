#!/usr/bin/env coffee
# -*- coding: utf-8 -*-
#
# ws_rmi_example.coffee
#

{ Stack } = require('./stack')
{ App_Server, App_Client, App_Object, App_Stub } = require('ws_rmi')

stack = new Stack()

name = 'stack'
app_id = 'example_app'
options =
  host: 'localhost'
  port: 8086
  path: ''
  protocol: 'ws'

id = "#{name}-#{Math.random().toString()[2..]}"

server = new App_Server(app_id, options)
stack_obj = new App_Object(id, stack, ['pop', 'push'])
server.add_controller(stack_obj)
server.load(id)

client = new App_Client(app_id, options)
stack_stub = new App_Stub(id, ['pop', 'push'])
client.add_controller(stack_stub)
client.load(id)

app =
  app_id: app_id
  id: id
  server: server
  client: client
  stack_stub: stack_stub
  stack_obj: stack_obj
  cb: console.log

if module?.parent
  # imported into parent module
  for k,v of app
    exports[k] = v

else
  # invoked from command line start REPL
  repl = require('repl')
  repl.start('stack> ').context.app = app
