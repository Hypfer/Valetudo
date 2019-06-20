FROM ubuntu:14.04

# Build:
# docker build -t valetudo-compiler .

# Copy binary to current directory:
# docker run --rm -it -v $(pwd):/host valetudo-compiler bash -c "cp /Valetudo/valetudo /host && chown $(id -u):$(id -g) /host/valetudo"

RUN apt-get update \
; apt-get -y --force-yes install wget git nodejs npm nodejs-legacy \
; npm config set strict-ssl false \
; npm install -g n \
; n latest \
; git clone http://github.com/hypfer/Valetudo \
; cd Valetudo \
; /usr/local/bin/npm install \
; /usr/local/bin/npm run build \
