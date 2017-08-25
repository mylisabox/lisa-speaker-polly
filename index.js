'use strict'

const AWS = require('aws-sdk')
const Stream = require('stream')
const crypto = require('crypto')
const path = require('path')
const fs = require('fs')
const Speaker = require('speaker')

module.exports = {
  init: (config = {}) => {
    if (!config.region) {
      config.region = 'eu-west-1'
    }
    if (!config.voiceId) {
      config.voiceId = config.language === 'fr-FR' ? 'Celine' : 'Kimberly'
    }
    this.config = config
    this.polly = new AWS.Polly({
      signatureVersion: 'v4',
      region: config.region
    })
    this.player = new Speaker({
      channels: 1,
      bitDepth: 16,
      sampleRate: 16000
    })
    this.cacheDisabled = config.cacheDisabled

    return Promise.resolve()
  },

  repeat: () => {
    return this.speak(this.lastText)
  },

  speak: (text, cacheDisabled = false) => {
    const hash = path.join(__dirname, 'cache', crypto.createHash('md5').update(text).digest('hex') + '.pcm')
    this.lastText = text
    return new Promise((resolve, reject) => {
      fs.exists(hash, exist => {
        if (exist) {
          const audioFile = fs.createReadStream(hash)
          audioFile.pipe(this.player)
        }
        else {
          const audioFile = fs.createWriteStream(hash)
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
                // Pipe into Player
                bufferStream.pipe(this.player)
                resolve()
              }
              else {
                reject()
              }
            }
          })

        }
      })
    })
  },

  shutUp: () => {
    return Promise.reject()
  }
}
