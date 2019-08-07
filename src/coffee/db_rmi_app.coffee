#!/usr/bin/env coffee
# -*- coding: utf-8 -*-

ws_rmi = require('ws_rmi')
{ App_Server, App_Client } = ws_rmi
{ App_Object, App_Stub } = ws_rmi
{ App_Admin_Object, App_Admin_Stub } = ws_rmi

#----------------------------------------------------------------------

class DB_App_Server extends App_Server

  constructor: (app_id, db, options) ->
    super(app_id, options)

    table_specs = {}
    for table in tickets_db.tables
      id = random_id("table")
      rmi_obj = new App_Table(id, table)
      table_specs[table.name] = id
      @add_controller(rmi_obj)
      @load(id)
      
    @admin = new App_Admin_Object('admin', this)
    @add_controller(@admin)
    @load('admin')

class DB_App_Client extends App_Client
  constructor: (app_id, options) ->
    super(app_id, db, options)

    @admin = new App_Admin_Stub('admin')
    @add_controller(@admin)
    @load('admin')

#----------------------------------------------------------------------

class DB_App_Table extends App_Object

  method_names = [
    'find_all',
    'find_by_id',
    'find_by_primary_key',
    'find_where'
    ]
  constructor: (id, table) ->
    super(id, table, method_names)
    
class DB_App_Table_Stub  extends App_Stub
  method_names = [
    'find_all',
    'find_by_id',
    'find_by_primary_key',
    'find_where'
    ]
  constructor: (id, table) ->
    super(id, method_names)


