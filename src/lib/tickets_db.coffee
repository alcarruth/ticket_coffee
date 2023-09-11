#!/usr/bin/env coffee
# -*- coding: utf-8 -*-

{ DB_ORM, DB_Object } = require('web-worm')
{ db_schema } = require('./db_schema')
{ pg_options } = require('./settings')

try
  db_obj = new DB_Object(pg_options)
  db = new DB_ORM(db_obj, db_schema)
  db.init_tables()
  module.exports = db

  if module.parent
    module.exports = db

  else
    # invoked from command line start REPL
    repl = require('repl')
    repl.start('tickets_db> ').context.db = db
                  
catch error
  console.log("Failed to create db.")
  console.log error

  


