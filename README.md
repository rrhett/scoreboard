# Gameboard

Server that shows a gameboard (e.g. on a monitor) that can be controlled and
updated from another device (e.g. phone, while playing). Meant for casual usage.

## Games

Initial implementation will be for Five Crowns, a fun party game. Hopefully this
repository expands and can be templated for other games.

## Running

For development:

$ docker build -t scoreboard .
$ yarn run dev

First, this builds a local docker image out of the source directory.

Then this starts a docker container, installs all the dependencies within the
docker container, and runs the app in the docker container, but will bind mount
the current directory so changes are reflected live.

TODO: see if I can simplify the script to use node:lts-alpine or similar. Right
now scoreboard is required to install the latest yarn properly.

## Testing

To test locally, it can be run as above and accessed via http://127.0.0.1:5000
or you can also install and run nginx and point it to the local address with a
self-signed certificate to test the SSL-required functionality such as the
wakelock.

## Deploying

There are two options:

### Build and deploy a local image

Deploy via docker:

```
$ git pull ...
$ docker build -t rrhett/scoreboard .
$ docker compose up -d
```

### Build and deploy a public image

Build the full image:

```
$ docker build -t rrhett/scoreboard .
$ docker push rrhett/scoreboard
```

On the prod machine, update:

```
$ docker compose pull
$ docker compose up -d
```
