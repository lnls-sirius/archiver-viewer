#!/bin/sh
set -e
set -x
set -u
. ./config.sh

docker docker push ${docker_image_name}:${docker_image_tag}

