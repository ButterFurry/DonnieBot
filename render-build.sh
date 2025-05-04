#!/bin/bash

# Download static FFmpeg build
curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz | tar xJ

# Move into a known directory
mv ffmpeg-*-static ffmpeg
export PATH="$PWD/ffmpeg:$PATH"
pip install -r requirements.txt
