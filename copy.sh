#!/bin/sh

cd /usr/src/app
mv ./tmp/libp2p.bootstrap .
rm -rf ./tmp/*
cp -rf ./out/. ./tmp
mv libp2p.bootstrap ./tmp/libp2p.bootstrap
sleep infinity