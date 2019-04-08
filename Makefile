PATH  := node_modules/.bin:$(PATH)
SHELL := /bin/bash
PKG ?= pkg

.PHONY: all clean

all:
	$(PKG) --targets latest-linux-armv7 --no-bytecode --public-packages=exif-parser,omggif,trim,prettycron .

clean:
	rm -f valetudo
