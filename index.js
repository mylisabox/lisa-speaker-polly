import AWS from 'aws-sdk';
import crypto from 'crypto';
import fs from 'fs/promises';
import {createReadStream, createWriteStream } from 'fs';
import path from 'path';
import Speaker from 'speaker';
import Stream from 'stream';

const getPlayer = () => {
  return new Speaker({
    channels: 1,
    bitDepth: 16,
    sampleRate: 16000
  })
}

// Add method exists to fs promises
fs.exists = function (file) {
  return fs.access(file, fs.F_OK)
    .then(() => true)
    .catch(() => false)
}

class PollySpeaker {
  init(config = {}) {
    if (!config.region) {
      config.region = 'eu-west-1'
    }
    if (!config.voiceId) {
      throw new Error('VoiceId is required, please provide one')
    }
    this.config = config
    this.polly = new AWS.Polly({
      signatureVersion: 'v4',
      region: config.region
    })
    this.cacheDisabled = config.cacheDisabled
  }

  repeat() {
    return this.speak(this.lastText)
  }

  speak(text, cacheDisabled = false) {
    const hash = path.join(path.resolve(), 'cache', crypto.createHash('md5').update(text).digest('hex') + '.pcm')
    this.lastText = text
    return new Promise(async (resolve, reject) => {
      const exist = await fs.exists(hash);
      if (exist) {
        const speaker = getPlayer();
        const audioFile = createReadStream(hash)
        audioFile.on('close', () => {
          resolve();
        });
        audioFile.pipe(speaker);
      }
      else {
        const audioFile = createWriteStream(hash)

        const params = {
          'Text': text,
          'OutputFormat': 'pcm',
          'VoiceId': this.config.voiceId
        }
        this.polly.synthesizeSpeech(params, (err, data) => {
          if (err) {
            reject(err)
          }
          else if (data) {
            if (data.AudioStream instanceof Buffer) {
              // Initiate the source
              const bufferStream = new Stream.PassThrough()
              // convert AudioStream into a readable stream
              bufferStream.end(data.AudioStream)
              // save to file
              if (!cacheDisabled && !this.cacheDisabled) {
                bufferStream.pipe(audioFile)
              }
              const speaker = getPlayer();
              // Pipe into Player
              bufferStream.pipe(speaker)

              bufferStream.on('close', () => {
                resolve()
              });
            }
            else {
              reject()
            }
          }
        })
      }
    });
  }

  dispose() {

  }

  shutUp() {
    return Promise.reject()
  }
}

export default new PollySpeaker();
