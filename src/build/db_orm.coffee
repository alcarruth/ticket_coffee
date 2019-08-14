#!/usr/bin/env coffee
# -*- coding: utf-8 -*-
#
#  db_orm.coffee
# 

if not window?
  { Client, Pool } = require('pg')

#-------------------------------------------------------------------------------
#
#  Column definitions
#
#  Each must have a '__method()' method (Yeah, I know. Sorry !-)
#  which returns a method to be added to the @__Row_Class()
#  definition in class Table, (q.v.)  It's convoluted but the
#  end result is that each Table has a corresponding Row_Class
#  method that is used to to create new Table_Rows from simple
#  Javascript object such as that returned by a db query.
# 

class Column

  constructor: (spec) ->
    { @table_name, @col_name, @options } = spec
  
  __method: =>
    try
      @__column_method()
    catch error
      console.log("Error in #{@constructor.name} method.")



class Local_Method extends Column
  
  constructor: (spec) ->
    super(spec)
    { @method } = @options
    @sql_column = false

  __column_method: =>
    return @method


  
class Reference extends Column

  constructor: (spec) ->
    super(spec)
    @sql_column = false

  __column_method: =>
    { table_name, col_name } = @options
    return  ->
      table = @__db.tables[table_name]
      key = @__obj[col_name]
      table.find_by_primary_key(key)



class Back_Reference extends Column

  constructor: (spec) ->
    super(spec)
    @sql_column = false
    
  __column_method: =>
    { table_name, col_name } = @options
    return ->
      table = @__db.tables[table_name]
      table.find_where(col_name, @__id)



class SQL_Column extends Column

  constructor: (options) ->
    super(options)
    @sql_column = true
        
  __column_method: =>
    name = @col_name
    return () ->
      @__obj[name]

class SQL_String extends SQL_Column
class SQL_Integer extends SQL_Column
class SQL_Date extends SQL_Column

  
#-------------------------------------------------------------------------------
# CLASS TABLE_ROW
# 
# Class Table_Row is the companion to class Table (below) A Table_Row
# corresponds to a row in the in the PostgreSQL table.  Note that the
# constructor requires a @__table argument.  Classes which extend
# Table Row must call super(table) in order to link the row type to
# the appropriate table instance.
# 
class Table_Row

  constructor: (@__table, @__obj) ->
    @__db = @__table.__db
    @__id = @__obj[@__table.__primary_key]
    @__unique_id = "#{@__table.__name}-#{@__id}"
      
  simple_obj: =>
    obj = {}
    for col, val of @__obj
      obj[col] = val
    return obj
    
  toJSON: =>
    JSON.stringify(@simple_obj())
      
  toString: =>
    return @toJSON()
    
  toHTML: =>
    # some suitable default



#-------------------------------------------------------------------------------
# CLASS TABLE
# 
# A Table corresponds to a table in the PostgreSQL DB.
#  
class Table

  constructor: (spec) ->
    @__db = spec.db
    @__name = spec.name
    @__method_names = [
      'find_by_id',
      'find_by_primary_key',
      'find_all',
      'find_where'
      ]
    @__primary_key = spec.primary_key || 'id'
    @__row_methods = {}
    for name, column of spec.columns
      @__row_methods[name] = column.__method(name)
    @__Row_Class = @__row_class(this)
    @__rows = {}
    @__unique_id = "table-#{@__name}"

  __row_class: (table) ->
    class __Row_Class extends Table_Row
      constructor: (obj) ->
        super(table, obj)
        for name, method of table.__row_methods
          this[name] = method #.bind(this)

  # TODO: insert into DB
  insert: (obj) =>
    cols = (k for k,v of @__sql_columns)
    text = "insert into #{@__name}(#{cols.join(',')})"
    values = (obj[col] for col in cols)
    console.log("Trying query:\n  text: \"#{text}\"\n  values: [ #{values} ]\n")
    try
     # db.query(text, values)
    catch error
      console.log(error.message)
    
  __add_row: (obj) => 
    row = new @__Row_Class(obj)
    @__rows[row.get_primary_key()] = row

  find_all: =>
    try
      text = "select * from #{@__name}"
      values = []
      rows = @__db.query(text, values)
      return (new @__Row_Class(row) for row in await rows)
    catch error
      console.log(error.message)

  find_by_id: (id) =>
    @find_one('id', id)

  find_by_primary_key: (val) =>
    @find_one(@__primary_key, val)

  find_one: (col, val) =>
    (await @find_where(col, val))[0]
  
  find_where: (col, val) =>
    try
      text = "select * from #{@__name} where #{col} = $1 "
      values = [val]
      rows = await @__db.query(text, values)
      return (new @__Row_Class(row) for row in await rows)
    catch error
      console.log(error.message)

      
  __remove_row: (id) =>
    delete @__rows[id]



#-------------------------------------------------------------------------------
# CLASS DB_Object
#

class DB_Object

  constructor: (@pg_options, @db_schema) ->
    @pool = new Pool(@pg_options)

  get_db_schema: =>
    return new Promise((resolve, reject) =>
      try
        resolve(@db_schema)
      catch
        reject("Could not get @db_schema."))
      
    
  query: (text, values) =>

    try
      client = await @pool.connect().catch ->
        throw new Error("Failed to connect.")
      result = await client.query(text, values).catch ->
        throw new Error("Failed to query.")
      client.release()
      return result.rows

    catch error
      msg = "Query failed.\n text: \"#{text}\"\n values: [#{values}]\n"
      throw new Error(msg)


#-------------------------------------------------------------------------------
# CLASS DB_ORM
# 
class DB_ORM

  # map DB_WORM column definition to class
  column_Class:
    string: SQL_String
    integer: SQL_Integer
    date: SQL_Date
    reference: Reference
    back_reference: Back_Reference
    local_method: Local_Method

  constructor: (@db_obj) ->
    @pool = new Pool(@pg_options)
  
  query: (text, values) =>
    @db_obj.query(text, values)

  init_tables: =>
    @db_schema = @db_obj.get_db_schema()
    @tables = {}
    @add_table(name, def) for name, def of await @db_schema

  add_table: (table_name, table_def) =>
    columns = {}
    
    for col_name, col_def of table_def
      # should be just one key and value
      [type, options] = ([k,v] for k,v of col_def)[0]
      primary_key = col_name if options.primary_key

      Column_Class = @column_Class[type]
      columns[col_name] = new Column_Class
        table_name: table_name
        col_name: col_name
        options: options        

    @tables[table_name] = new Table
      db: this
      name: table_name
      primary_key: primary_key || 'id'
      columns: columns


if not window?
  exports.DB_ORM = DB_ORM
  exports.DB_Object = DB_Object
