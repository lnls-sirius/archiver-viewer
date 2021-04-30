#!/bin/sh
set -e
set -x
set -u
. ./config.sh

docker build \
    --label br.com.lnls-sirius.commit=${commit}\
    --label br.com.lnls-sirius.date=${build_date}\
    --label br.com.lnls-sirius.branch=${branch}\
    --label br.com.lnls-sirius.repository=${repository}\
    --label maintainer.name="Claudio F. Carneiro"\
    --label maintainer.email="claudio.carneiro@cnpem.br"\
    --tag ${docker_image_name}:${docker_image_tag}\
    --file ./Dockerfile\
    --progress plain\
    ../

