# Gameboard

Server that shows a gameboard (e.g. on a monitor) that can be controlled and
updated from another device (e.g. phone, while playing). Meant for casual usage.

## Games

Initial implementation will be for Five Crowns, a fun party game. Hopefully this
repository expands and can be templated for other games.

## Running

This is appropriate for development.

$ screen -DR gameboard
$ node app.js

## Testing

To test locally, it can be run as above and accessed via http://127.0.0.1:5000
or you can also install and run nginx and point it to the local address with a
self-signed certificate to test the SSL-required functionality such as the
wakelock.

## Deploying

To deploy on a server, it should be configured via systemd so that it starts
automatically.

First, update gameboard.service with the proper username, if applicable, then:

```
sudo cp gameboard.service /etc/systemd/system/gameboard.service
sudo systemctl daemon-reload
sudo systemctl enable gameboard.service
sudo systemctl start gameboard.service
```

TODO: document a strategy for rolling out an update via staging repo directory.
