#!/usr/bin/env coffee
# -*- coding: utf-8 -*-

{ DB_ORM, DB_Object } = require('web-worm')
{ db_schema } = require('./db_schema')
[ pg_options } = require('./settings')

try
  db_obj = new DB_Object(pg_options, db_schema)
  db = new DB_ORM(db_obj)
  db.init_tables()
  for k,v of db
    exports[k] = v
                  
catch error
  console.log("Failed to create db.")
  console.log error

  


