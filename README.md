<p align="center">
  <br/>
  <a href="https://opensource.org/license/agpl-v3"><img src="https://img.shields.io/badge/License-AGPL_v3-blue.svg?color=3F51B5&style=for-the-badge&label=License&logoColor=000000&labelColor=ececec" alt="License: AGPLv3"></a>
  <br/>
  <br/>
</p>

# Scoreboard

Server that shows a scoreboard (e.g. on a monitor) that can be controlled and
updated from another device (e.g. phone, while playing). Meant for casual usage.

## Games

Initial implementation will be for Five Crowns, a fun party game. Hopefully this
repository expands and can be templated for other games.

# Install

## Requirements

* OS: Recommended Linux (running inside a full virtual machine works wel)

* Software: Docker with docker compose.

Install docker https://docs.docker.com/get-started/get-docker/

## Docker Compose

Docker Compoose is the recommended method to run Scoreboard.

**Step 1**

Create a directory to hold the `compose.yaml` and `.env` files:

```
mkdir scoreboard
cd scoreboard
```

Download
[compose.yaml](https://github.com/rrhett/scoreboard/releases/latest/download/compose.yaml).

```
wget -O compose.yaml https://github.com/rrhett/scoreboard/releases/latest/download/compose.yaml
```

**Step 2 - Setup .env**

* Populate **SCOREBOARD_VERSION** with the desired version.

Example:

```
SCOREBOARD_VERSION=v1.0.1
```

If you wish to always run the latest released image, use the `latest` label.
Otherwise, browse the [releases](https://github.com/rrhett/scoreboard/releases)
page to find the version you'd like.

**Step 3 - Start the containers*

From the directory you created in Step 1, run the following command:

```
docker compose up -d
```

**Step 4 - Upgrade**

When you'd like to upgrade, edit the `.env` file to reference a newer version
(or if you are using `latest` it will automatically pick the latest version).

Then pull the image and restart the containers:

```
docker compose pull && docker compose up -d
```

# Develop

## Running

For development:

$ yarn run dev

This starts a docker node container with yarn modern, installs all the
dependencies within the docker container, and runs the app in the docker
container, but will bind mount the current directory so changes are reflected
live.

## Testing

To test locally, it can be run as above and accessed via http://127.0.0.1:5000
or you can also install and run nginx and point it to the local address with a
self-signed certificate to test the SSL-required functionality such as the
wakelock.
