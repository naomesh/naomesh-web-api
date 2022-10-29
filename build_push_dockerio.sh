#!/bin/bash

echo "Building the docker image"
docker build -t naomesh-api . > /dev/null 2>&1
echo "Tagging image"
docker tag naomesh-api rouretl/naomesh-api > /dev/null 2>&1
echo "Pushing image"

echo "Enter ur login to docker.io"
read login
echo "Enter ur password to docker.io"
read password


docker login -u "${login}" -p "${password}" docker.io > /dev/null 2>&1
docker push rouretl/naomesh-api > /dev/null 2>&1

echo "Done"