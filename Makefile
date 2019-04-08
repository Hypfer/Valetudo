PATH  := node_modules/.bin:$(PATH)
SHELL := /bin/bash
PKG ?= pkg

.PHONY: all clean

all:
	$(PKG) --targets node8-linux-armv7 --no-bytecode --options max-old-space-size=72 --public-packages=exif-parser,omggif,trim,prettycron .

clean:
	rm -f valetudo
