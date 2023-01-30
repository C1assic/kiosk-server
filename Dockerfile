FROM node:18

WORKDIR /src

COPY . /src
COPY package*.json ./

RUN cd /src; npm install
# RUN apt update -y
# RUN apt install -y ffmpeg libmp3lame-dev

CMD ["npm", "start"]
EXPOSE ${PORT}