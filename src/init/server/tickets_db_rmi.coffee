#
# tickets_db_rmi.coffee
#

db = require('../coffee/tickets_db')

WS_RMI_Stub = WS_RMI_Stub || require('ws_rmi').WS_RMI_Stub


make_remote = (obj, method_names) ->
  res = {}
  for name in method_names
    res[name] = obj.name
  return res




class Remote_Obj

  constructor: (@obj) ->
    #@id = @obj.__unique_id
    for name, val of @obj.__proto__
      console.log("name: #{name}, val #{val}")
      if typeof(val) == 'function'
        this.__proto__[name] = @new_method(name, val)
        this.__proto__[name].bind(this)

  new_method: (name, method) =>
    (args, cb) ->
      if @obj.__local[name]
        cb(method(args))
        return true
      else
        res = method(args)
        if ((await res).__proto__ == [].__proto__)
          cb(Promise.all(x.simple_obj() for x in await res))
          return true
        else
          cb((await res).simple_obj())
          return true

class Remote_Obj_Stub extends WS_RMI_Stub
  constructor: (remote_obj) ->
    super()
    for name,_  of remote_obj.__proto__
      WS_RMI_Stub.add_stub(name)


remotify = (obj) ->
  remote_obj = new Remote_Obj(obj)
  remote_obj_stub = new Remote_Obj_Stub(remote_obj)
  return
    remote_obj: remote_obj
    remote_obj_stub: remote_obj_stub

#exports.texas = remotify(db.texas)
#exports.big_12 = remotify(db.big_12)

exports.db = db
exports.remotify = remotify
exports.Remote_Obj = Remote_Obj
exports.Remote_Obj_Stub = Remote_Obj_Stub




