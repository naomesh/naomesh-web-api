<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>


## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# docker
# docker
$ docker build -t naomesh-api .
$ docker run -d -p 3000:3000 naomesh-api
```

## Documentation

- `/api`: swagger document
- `/api-json`: open-api spec

## Push to docker hub

```bash
$ ./build_push_dockerio.sh
```

OU

```bash
$ docker build -t naomesh-api .

$ docker tag naomesh-api rouretl/naomesh-api

$ docker login -u "login" -p "mdp" docker.io

$ docker push rouretl/naomesh-api
```