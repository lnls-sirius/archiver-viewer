#!/bin/sh
set -e
set -x
set -u

branch=$(git branch --no-color --show-current)
build_date=$(date -I)
commit=$(git rev-parse --short HEAD)
repository=$(git remote show origin |grep Fetch|awk '{ print $3 }')

docker_registry=docker.io
docker_user_group=lnlscon
docker_image_prefix=${docker_registry}/${docker_user_group}
docker_image_name=${docker_image_prefix}/archiver-viewer
docker_image_tag=${build_date}-${commit}

docker build \
    --label br.com.lnls-sirius.commit=${commit}\
    --label br.com.lnls-sirius.date=${build_date}\
    --label br.com.lnls-sirius.branch=${branch}\
    --label br.com.lnls-sirius.repository=${repository}\
    --label maintainer="Claudio Carneiro <claudio.carneiro@lnls.br>"\
    --tag ${docker_image_name}:${docker_image_tag}\
    --file ./Dockerfile\
    ../

