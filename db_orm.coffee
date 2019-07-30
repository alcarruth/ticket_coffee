#!/usr/bin/env coffee
# -*- coding: utf-8 -*-


class Reference

  constructor: ( @table_name, @key_name) ->

  __method: =>
    table_name = @table_name
    key_name = @key_name
    return () ->
      try
        table = @__db.tables[table_name]
        key = @__local[key_name]
        table.__find_by_id(key)
      catch error
        console.log('Error in reference method.')


class Back_Reference

  constructor: (@table_name, @col) ->

  __method: =>
    table_name = @table_name
    col = @col
    return () ->
      try
        table = @__db.tables[table_name]
        id = @__id
        table.__find_all(col, id)
      catch error
        console.log('Error back_reference method.')


class String_Column

  constructor: ->

  __method: (name) =>
    return ->
      try
        @__local[name]
      catch error
        console.log('Error in string column method')
    

class Integer_Column

  constructor: ->

  __method: (name) =>
    return ->
      try
        @__local[name]
      catch error
        console.log('Error in integer column method')
    

class Date_Column

  constructor: ->

  __method: (name) =>
    return ->
      try
        @__local[name]
      catch error
        console.log('Error in date column method')



#------------------------------------------------------------------------------------
# meta classes extended by the definitions below
# 

# An instance of class Table corresponds to a table in the PostgreSQL
# DB.  Note that the constructor argument includes a reference to a
# Row_Class which must be an instance of class Table_Row (below).
 
class Table

  constructor: (spec) ->
    @__db = spec.db
    @__name = spec.tablename
    @__primary_key = spec.primary_key
    @__columns = spec.columns || []
    @__foreign_keys = spec.foreign_keys || {}
    @__back_references = spec.back_references || {}
    @__Row_Class = spec.row_class
    @__rows = {}
    @__db.tables[@__name] = this
    @__add_methods()

  __add_methods: =>
    for name, column of @__columns
      @__Row_Class::[name] = column.__method(name)

  __add_methods_old: =>
    for name in @__columns
      @__add_column_method(name)
    for name, spec of @__foreign_keys
      @__add_foreign_key_method(name, spec)
    for name, spec of @__back_references
      @__add_back_reference_method(name, spec)

  __add_column_method: (name) =>
    @__Row_Class::[name] = ->
      @__local[name]

  __add_foreign_key_method: (name, spec) =>
    { table_name, key_name } = spec
    @__Row_Class::[name] = ->
      table = @__db.tables[table_name]
      key = @__local[key_name]
      table.__find_by_id(key)

  __add_back_reference_method: (name, spec) =>
    { table_name, col } = spec
    @__Row_Class::[name] = ->
      table = @__db.tables[table_name]
      table.__find_all(col, @__id)


 # __handle_back_reference: (row, name, spec) =>
    
      
  # TODO: insert into DB
  __add_row: (obj) => 
    row = new @__Row_Class(obj)
    @__rows[row.get_primary_key()] = row

  __find_by_id: (id) =>
    qs = "select * from #{@__name} where #{@__primary_key} = '#{id}'"
    try
      rows = await @__db.query(qs)
      return new @__Row_Class(rows[0])
    catch error
      console.log("Query failed: \"#{qs}\"")

  __find_all: (col, val) =>
    qs = "select * from #{@__name} where #{col} = '#{val}'"
    try
      rows = await @__db.query(qs)
      return (new @__Row_Class(row) for row in rows)
    catch
      console.log("Query failed: \"#{qs}\"")
      
  __remove_row: (id) =>
    delete @__rows[id]


# Class Table_Row is the companion to class Table (above)
# Note that the constructor requires a @__table argument.
# Classes which extend Table Row must call super(table)
# in order to link the row type to the appropriate table
# instance.
# 
class Table_Row

  constructor: (@__table) ->
    @__db = @__table.__db
    @__local = {}
    for name, method of this.__proto__
      this[name] = method.bind(this)

  __init: (obj) =>
    for col,_ of @__table.__columns
      @__local[col] = obj[col] || null
    @__id = @__local[@__table.__primary_key]
      
  __simple_obj: =>
    obj = {}
    for col in @__table.__columns
      obj[col] = this[col]()
    return obj
    
  __toJSON: =>
    JSON.stringify(@__simple_obj())
      
  __toString: =>
    return @__toJSON()
    
  __toHTML: =>
    # some suitable default


exports.Table = Table
exports.Table_Row = Table_Row
exports.String_Column = String_Column
exports.Integer_Column = Integer_Column
exports.Date_Column = Date_Column
exports.Reference = Reference
exports.Back_Reference = Back_Reference

