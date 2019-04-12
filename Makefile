PATH  := node_modules/.bin:$(PATH)
SHELL := /bin/bash
PKG ?= pkg

.PHONY: all clean

all:
	npm run build

clean:
	rm -f valetudo
