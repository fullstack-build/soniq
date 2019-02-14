TAG=one-test:latest
NAME=one-test

docker build -f docker/test.Dockerfile -t $TAG .

docker run --rm -i -t --name "$NAME" $TAG
