TAG=one-test:latest
NAME=one-test

docker build -f docker/test.Dockerfile -t $TAG .

docker run --name "$NAME" $TAG

docker rm $NAME
