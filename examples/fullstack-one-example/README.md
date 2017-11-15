# fullstack.one-example
Example project using fullstack.one Framework

## Docker

- *Build docker container*

`docker build -t fullstack.one/example .`

- *start docker container mounting local folder*

`docker run -v $(pwd):/usr/src/app fullstack.one/example`
