#!/usr/bin/env coffee
# -*- coding: utf-8 -*-




class Foreign_Key

  constructor: ( @table_name, @key_name) ->

  add_method: (Class, name) =>
    Class::[name] = ->
      table = @__db.tables[@table_name]
      key = @__local[@key_name]
      table.__find_by_id(key)

class Back_Reference

  constructor: (@table_name, @col) ->

  add_method: (Class, name) =>
    Class::[name] = ->
      table = @__db.tables[@table_name]
      table.__find_all(@col, @__id)


class Local_String

  constructor: (@name) ->

  add_method: (Class, name) =>
    Class::[name] = ->
      @__local[@name]
    
    #     : new(Foreign_Key( 'team', 'team_id')
    # teams: new Back_Reference('team', 'conference_name')
     # = new Local_String()

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
    @__db.query(qs).then((rows) =>
      return new @__Row_Class(rows[0]))

  __find_all: (col, val) =>
    qs = "select * from #{@__name} where #{col} = '#{val}'"
    @__db.query(qs).then((rows) =>
      return (new @__Row_Class(row) for row in rows))
    
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
    for col in @__table.__columns
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
