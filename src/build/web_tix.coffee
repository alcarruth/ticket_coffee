#!/bin/env/ coffee
#
#  ws_rmi_connection
#

if not window?
  util = require('util')

inspect = (obj) ->
  options =
    showHidden: false
    depth: null
    colors: true
  util.inspect(obj, options)

log = (heading, args...) ->
  args = args.map(inspect).join('\n')
  console.log("\n\n#{heading}\n#{args}\n\n")

log = console.log

#----------------------------------------------------------------------

class WS_RMI_Connection

  # WS_RMI_Connection is basically just a wrapper around a websocket
  # and is intendend to be applied on both ends of the socket.  @owner
  # is the ws_rmi_client or the ws_rmi_server which established this
  # end of the websocket.
  #
  # The idea here is that the connection, once established, is
  # symmetrical with both ends having the ability to request a remote
  # method invocation and to respond to such requests.
  #
  # TODO: I have not settled the design as yet.  Previously the RMI's
  # were requested by a WS_RMI_Client and responded to by a
  # WS_RMI_Server.  My current thinking is that that functionality
  # might be better off here.
  #
  constructor: (@owner, @ws, log_level) ->
    @log_level = log_level || 0

    # TODO: Need a unique id here. Does this work ok?
    #@id = "#{ws._socket.server._connectionKey}"
    @id = "connection"

    # WS_RMI_Objects are registered here with their id as key.  The
    # registry is used by method recv_request() which receives just an
    # id in the message and must look up the object to invoke it's
    # method.
    #
    @registry = {}
    @exclude = []

    # Pseudo-object 'admin' with method 'init'
    #
    # TODO: Is it better to use this pseudo-object approach or just
    # instantiate WS_RMI_Object to the same effect?  The point is that
    # 'admin' is special in that it is present at Connection creation
    # time.  It should be excluded from init() responses since the
    # caller already has it.  Should it then be excluded from the
    # registry or just skipped over when responding to init?  The
    # benefit of including it in the registry is that it requires no
    # special treatment in method recv_request().  My current choice
    # is to include it in the registry here and skip over it in
    # init().
    #
    # In the future there may be other objects of this administrative
    # sort.  Maybe a more structured general solution should be
    # considered.
    #
    @admin =
      id: 'admin',
      name: 'admin',
      get_stub_specs: @get_stub_specs,
      method_names: ['get_stub_specs']
    @registry['admin'] = @admin
    @exclude.push('admin')

    @stubs = {}

    # RMI's are given a unique number and the Promise's resolve() and
    # reject() functions are kept as callbacks to be executed when an
    # RMI response is received. Properties @rmi_cnt and @rmi_hash are
    # each written and read by methods send_request() and
    # recv_response().
    #
    @rmi_cnt = 0
    @rmi_hash = {}

    # add remote objects
    for obj in @owner.objects
      @add_object(obj)

    # Events are mapped to handler methods defined below.
    @ws.onopen = @onOpen
    @ws.onmessage = @onMessage
    @ws.onclose = @onClose
    @ws.onerror = @onError
    true

  #--------------------------------------------------------------------
  # Event handlers
  #

  # TODO: is this event handled here or in client and server?  Seems
  # like by the time the connection object is constructed it's already
  # open.  Could it be closed and opened again?  I wouldn't think so
  # unless I implement that in the server and client code.  It'd have
  # to keep stale connection objects around and re-activate them when
  # connected again.
  #
  onOpen: (evt) =>
    if @log_level > 0
      log("connection opened: id:", @id)

  # This is the "main event".  It's what we've all been waiting for!
  onMessage: (evt) =>
    if @log_level > 2
      log("onMessage:", evt.data)
    @recv_message(evt.data)

  # TODO: perhaps somebody should be notified here ?-)
  # Who wanted this connection in the first place?  Do we
  # have their contact info?
  #
  onClose: (evt) =>
    if @log_level > 0
      log("peer disconnected: id:", @id)

  # TODO: think of something to do here.
  onError: (evt) =>

  disconnect: =>
    if @log_level > 0
      log("disconnecting: id: ", @id)
    @ws.close()


  #----------------------------------------------------------
  # Object registry methods

  # Register a WS_RMI_Object for RMI
  add_object: (obj) =>
    @registry[obj.id] = obj
    obj.register(this)

  register: (obj) =>
    @registry[obj.id] = obj

  # I refuse to comment on what this one does.
  del_object: (id) =>
    delete @registry[id]

  # Method init() is a built-in remote method.
  get_stub_specs: =>

    new Promise((resolve, reject) =>
      try
        specs = {}
        for id, obj of @registry
          if id not in @exclude
            specs[id] =
              name: obj.name
              method_names: obj.method_names
        if @log_level > 2
          log("init():", specs)
        resolve(specs)

      catch error
        log("Error: init():", specs, error)
        reject("Error: init():", specs))

  # Invoke remote init()
  init_stubs: =>

    cb = (result) =>
      if @log_level > 2
        log("init_stubs(): cb(): result:", result)
      for id, spec of result
        { name, method_names } = spec
        stub = new WS_RMI_Stub(id, name, method_names, this)
        @stubs[stub.name] = stub

    eh = (error) =>
      if @log_level > 2
        log("init_stub(): eh(): received error:", error)
      return new Error("init_stub(): eh(): received error:")

    @send_request('admin', 'get_stub_specs', []).then(cb).catch(eh)


  #--------------------------------------------------------------------
  # Generic messaging methods
  #

  # JSON.stringify and send.  Returns a promise.
  send_message: (data_obj) =>
    if @log_level > 2
      log("send_message(): data_obj:", data_obj)
    try
      @ws.send(JSON.stringify(data_obj))
    catch error
      log("Error: send_message(): data_obj:", data_obj)
      new Error("send_message(): Error sending:\n #{inspect data_obj}")

  # JSON.parse and handle as appropriate.
  recv_message: (data) =>
    data_obj = JSON.parse(data)
    if @log_level > 2
      log("recv_message(): data_obj:", data_obj)
    { type, msg } = data_obj
    if type == 'request'
      return @recv_request(msg)
    if type == 'response'
      return @recv_response(msg)
    else
      new Error("recv_message(): invalid type #{type}")

  #--------------------------------------------------------------------
  # Methods to Send and Receive RMI Requests
  #

  # Method send_request()
  send_request: (obj_id, method, args) =>

    msg = { obj_id: obj_id, method: method, args: args }
    if @log_level > 0
      log("send_request(): msg:", msg)

    new Promise (resolve, reject) =>
      try
        msg.rmi_id = @rmi_cnt++
        @rmi_hash[msg.rmi_id] =
          msg: msg
          resolve: resolve
          reject: reject
        @send_message(type: 'request', msg: msg)
      catch error
        reject("send_message(): Error: data_obj:", data_obj)


  # Method recv_request()
  recv_request: (msg) =>

    if @log_level > 0
      log("recv_request(): msg:", msg)
    { obj_id, method, args, rmi_id } = msg

    # callback used below
    cb = (res) => @send_response(rmi_id, res, null)

    # error handler used below
    eh = (err) => @send_response(rmi_id, null, err)

    # Look up the object and apply the method to the args.
    # Method is assumed to return a promise.
    #
    obj = @registry[obj_id]
    obj[method].apply(obj, args).then(cb).catch(eh)


  #--------------------------------------------------------------------
  #  Methods to Send and Receive RMI Responses
  #

  # Method send_response()
  send_response : (rmi_id, result, error) =>
    msg = { rmi_id: rmi_id, result: result, error: error }
    if @log_level > 0
      log("send_response(): msg:", msg)
    new Promise (resolve, reject) =>
      try
        @send_message(type: 'response', msg: msg)
      catch error
        log("Error in send_response():", msg)
        reject({rmi_id, result, error})


  # Method recv_resonse()
  recv_response : (response) =>
    if @log_level > 0
      log("recv_response(): response:", response)
    try
      { rmi_id, result, error } = response
      { request, resolve, reject } = @rmi_hash[rmi_id]
      if error
        reject({request, error})
      else
        resolve(result)
    catch error
      reject({request, error})


#----------------------------------------------------------------------
# WS_RMI_Object

# used in WS_RMI_Object constructor
random_id = (name) ->
  "#{name}_#{Math.random().toString()[2..]}"

# WS_RMI_Object wraps a regular coffeescript class instance object,
# exposing only those methods explicitly intended for RMI.
#
class WS_RMI_Object

  constructor: (@name, @obj, @method_names, log_level) ->
    @log_level = log_level || 0
    @id = random_id(@name)

    for name in @method_names
      this[name] = ((name) =>
        (args...) ->
          @invoke(name, args))(name)

  register: (connection) =>
    @connection = connection

  # Method invoke() is called by connection.recv_request()
  # it executes the appropriate method and returns a promise.
  #
  invoke: (method_name, args) ->

    # error handler used in .catch() just below.
    eh = (err) =>
      msg = "\nWS_RMI_Object:"
      msg += (id: @id, method: name, args: args).toString()
      return new Error(msg)

    if @log_level > 1
      log("invoke(): ", {method_name, args})
    # call the method of the underlying object
    @obj[method_name].apply(@obj, args) # .catch(eh)


#-----------------------------------------------------------------------
# WS_RMI_Stub

class WS_RMI_Stub

  constructor: (@id, @name, @method_names, @connection, log_level) ->
    @log_level = log_level || 0

    for name in @method_names
      this[name] = ((name) =>
        (args...) ->
          @invoke(name, args))(name)

  # Method invoke() implements local stub methods by calling
  # WS_RMI_Connection.send_request() which returns a Promise.
  #
  invoke: (name, args) ->
    if @log_level > 1
      log("invoke(): ", {name, args})
    eh = (err) =>
      msg = "\nWS_RMI_Stub:"
      msg += (id: @id, method: name, args: args).toString()
      return new Error(msg)

    @connection.send_request(@id, name, args).catch(eh)


#----------------------------------------------------------------------

if not window?
  exports.WS_RMI_Connection = WS_RMI_Connection
  exports.WS_RMI_Object = WS_RMI_Object
  exports.WS_RMI_Stub = WS_RMI_Stub

else
  window.WS_RMI_Connection = WS_RMI_Connection
  window.WS_RMI_Object = WS_RMI_Object
  window.WS_RMI_Stub = WS_RMI_Stub
#!/bin/env/ coffee
#
# ws_rmi_client
#

# works both in browser and in node
WebSocket = window?.WebSocket || require('ws')

if not window?
  { WS_RMI_Connection } = require('./app')


class WS_RMI_Client

  # Connnection should be a sub-class of WS_RMI_Connection in order to
  # create and register desired WS_RMI_Objects at construction.
  #
  constructor: (options, @objects, Connection) ->
    @Connection = Connection || WS_RMI_Connection
    @id = "WS_RMI_Client-#{Math.random().toString()[2..]}"
    { @host, @port, @path, @protocol, @log_level } = options
    @url = "#{@protocol}://#{@host}:#{@port}/#{@path}"

  connect: (url) =>
    try
      @url = url if url
      ws = new WebSocket(@url)
      @connection = new @Connection(this, ws, @log_level)
      console.log("Connection added, id: #{@connection.id}")
      return

    catch error
      msg = "\nWS_RMI_Client: connect failed."
      msg += " url: #{@url}"
      new Error(msg)




if not window?
  exports.WS_RMI_Client = WS_RMI_Client

else
  window.WS_RMI_Client = WS_RMI_Client
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
#!/usr/bin/env coffee
# -*- coding: utf-8 -*-
#
#  db_rmi_client.coffee
# 

if not window?
  ws_rmi = require('ws_rmi')
  WS_RMI_Connection = ws_rmi.Connection
  WS_RMI_Client = ws_rmi.Client
  { DB_ORM, DB_Object } = require('./db_orm')


class DB_RMI_Connection extends WS_RMI_Connection
  init_stubs: =>
    super().then(@init_db)
  init_db: =>
    @db = new DB_ORM(@stubs.db_obj)

  
class DB_RMI_Client extends WS_RMI_Client
  constructor: (options) ->
    super(options, [], DB_RMI_Connection)


if not window?
  exports.DB_RMI_Client = DB_RMI_Client
  
#!/usr/bin/env coffee
# -*- coding: utf-8 -*-
#
#  db_schema.coffee
# 

# comparison function suitable for sorting by column
# 
_by_= (col) -> (a,b) ->
  a_val = a[col]().valueOf()
  b_val = b[col]().valueOf()
  return (if (a_val < b_val) then -1 else 1)

db_schema  =
  
  conference:
    abbrev_name: string: { primary_key: true }
    name: string: {}
    logo: string: {}
    teams: back_reference: { table_name: 'team', col_name: 'conference_name' }

  team:
    id: integer: { primary_key: true }
    name: string: {} 
    nickname: string: {}
    logo: string: {}
    espn_id: integer: {}
    city: string: {}
    state: string: {}
    conference_name: string: {}
    conference: reference: { table_name: 'conference', col_name: 'conference_name' }
    home_games: back_reference: { table_name: 'game', col_name: 'home_team_id' }
    away_games: back_reference: { table_name: 'game', col_name: 'visiting_team_id' }
    full_name: local_method: { method: -> "#{@name()} #{@nickname()}" }
    games: local_method:
      method: ->
        away_games = (await @away_games())
        home_games = (await @home_games())
        games = away_games.concat(home_games)
        return games.sort(_by_('date'))

  game:
    id: integer: { primary_key: true }
    home_team_id: integer: {}
    visiting_team_id: integer: {}
    date: date: {}
    home_team: reference: {table_name: 'team', col_name: 'home_team_id'}
    visiting_team: reference: {table_name: 'team', col_name: 'visiting_team_id'}
    tickets: back_reference: {table_name: 'ticket_lot', col_name: 'game_id'}

  ticket_user:
    id: integer: { primary_key: true }
    name: string: {}
    email: string: {}
    picture: string: {}
    ticket_lots: back_reference: {table_name: 'ticket_lot', col_name: 'user_id'}
    
  ticket_lot:
    id: integer: { primary_key: true }
    user_id: integer: {}
    game_id: integer: {}
    section: string: {}
    row: string: {}
    price: string: {}
    img_path: string: {}
    seller: reference: {table_name: 'ticket_user', col_name: 'seller_id'}
    buyer: reference: {table_name: 'ticket_user', col_name: 'buyer_id'}
    game: reference: {table_name: 'game', col_name: 'game_id'}
    tickets: back_reference: {table_name: 'ticket', col_name: 'lot_id'}
    num_seats: local_method:
      method: ->
        (await @tickets()).length
    seats: local_method:
      method: ->
        ticket.seat() for ticket in (await tickets()).sort()

  ticket:
    id: string: { primary_key: true }
    lot_id: string: {}
    seat: string: {}
    lot: reference: { name_name: 'ticket_lot', col_name: 'lot_id' }


if not window?
  exports.db_schema = db_schema
#!/usr/bin/env coffee
#
#  settings.coffee
#

pg_options = 
  host: '/var/run/postgresql'
  database: 'tickets'

local_options =
  host: 'localhost'
  port: 8086
  path: ''
  protocol: 'ws'
  log_level: 2

remote_options =
  host: 'alcarruth.net'
  port: 443
  path: '/wss/tickets_coffee'
  protocol: 'wss'
  log_level: 2


if not window?
  exports.pg_options = pg_options
  exports.local_options = local_options
  exports.remote_options = remote_options

#!/usr/bin/env coffee
#
#  client.coffee
#


if not window?
  { DB_RMI_Client } = require('db_worm')
  { db_schema } = require('./db_schema')
  { remote_options } = require('./settings')

client = new DB_RMI_Client(remote_options)

if not window?

  if module.parent
    exports.client = client

  else
    # invoked from command line start REPL
    repl = require('repl')
    repl.start('client> ').context.client = client

else
  window.client = client
