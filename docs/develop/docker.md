# Docker Developer Environment

An easy way to run push-notifications with a few commands and keep the development environment consistent across different OSes. The containers use the "host" network mode and therefore it can have network conflicts with local installations.

## Requirements

You'll need a locally running Docker and Docker Compose:

  - [Docker installation instructions][docker-install]
  - [Docker Compose installation instructions][docker-compose]

[docker-install]: https://docs.docker.com/install/
[docker-compose]: https://docs.docker.com/compose/install/

---

**Linux users**

We recommend installing `docker-compose` by [downloading the binary release](https://docs.docker.com/compose/install/#install-compose-on-linux-systems).
You can also use `pip`, your OS package manager, or even run it in a container, but downloading the binary release is the easiest method.

---

## Quickstart

### MacOS & Windows prerequisites

Hopefully, this should Just Work™.

### Linux prerequisites

If you are developing on a Linux system, copy the override settings to the default override file:

```
cp docker-compose.linux.yml docker-compose.override.yml
```

Next, ensure that `$MW_DOCKER_UID` and `$MW_DOCKER_GID` are set in your environment:

```
export MW_DOCKER_UID=$(id -u)
export MW_DOCKER_GID=$(id -g)
```

The above lines may be added to your `.bashrc` or other shell configuration.

If you are using fish shell, make sure to set the environment variables like this:

```
set -gx MW_DOCKER_UID (id -u)
set -gx MW_DOCKER_GID (id -g)
```

### Start environment

Start the environment:

```sh
docker-compose up
```

## Usage

### make task runner commands

Execute `npm install` inside the push-notifications container:
```sh
make npm_install
```

Execute `npm test` inside the push-notifications container:
```sh
make npm_test
```
