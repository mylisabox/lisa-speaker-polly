'use strict'

const speaker = require('./index')

speaker.init({ language: 'fr-FR', voiceId: 'Celine' })

speaker.speak('Bonjour, je m\'appel lisa, je suis nouvelle par ici ').then(data => {
}).catch(err => {
})
setInterval(() => {
  speaker.speak('Bonjour, je m\'appel lisa, je suis nouvelle par ici, pourrais tu m\'aider ? ').then(data => {
  }).catch(err => {
  })
}, 30000)
