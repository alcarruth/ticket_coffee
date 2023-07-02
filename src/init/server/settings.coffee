
settings =

  app_id: 'br549'

  local:
    host: "localhost"
    port: 8085
    path: ""
    protocol: 'ws'

  external:
    host: "alcarruth.net"
    port: 443
    path: "/wss/rmi_example"
    protocol: 'wss'

if window?
  window.settings = settings

else
  
  exports.local =
    app_id: settings.app_id
    options: settings.local

  exports.external =
    app_id: settings.app_id
    options: settings.external

