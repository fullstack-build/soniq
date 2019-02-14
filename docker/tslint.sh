TAG=one-tslint:latest
NAME=one-tslint

docker build -f docker/tslint.Dockerfile -t $TAG .

docker run --rm -i -t --name "$NAME" $TAG
