'use strict'

const speaker = require('./index')

speaker.init({ language: 'fr-FR' })
  .then(() => {
    return speaker.speak('Bonjour, je m\'appel lisa, je suis nouvelle par ici, pourrais tu m\'aider ? ')
  })
