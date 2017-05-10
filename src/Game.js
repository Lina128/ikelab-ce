import 'pixi'
import 'p2'
import Phaser from 'phaser'
import BOOT from './states/Boot'
import PRELOAD from './states/Preload'
import END from './states/End'
import config from './config'

export default class Game extends Phaser.Game {
  constructor (experiment) {
    const docElement = document.documentElement
    const width = docElement.clientWidth > config.gameWidth ? config.gameWidth : docElement.clientWidth
    const height = docElement.clientHeight > config.gameHeight ? config.gameHeight : docElement.clientHeight

    super(width, height, Phaser.CANVAS, 'content', null)

    this.experiment = experiment
    this.trials = null
    this.currentTrial = null
    this.assets = []
    this.timeout = null
    this.nextBtn = document.getElementById('next-btn')
    this.responseArea = document.getElementById('response-area')
    this.surveyArea = document.getElementById('survey-area')
    this.waitResponse = this.waitResponse.bind(this)
    this.recordResponse = this.recordResponse.bind(this)
    this.processInputAutoTimedAdvance = this.processInputAutoTimedAdvance.bind(this)
    this.processInputKeyAdvance = this.processInputKeyAdvance.bind(this)
    this.processInputErrorFeedback = this.processInputErrorFeedback.bind(this)
    this.processInputNextButton = this.processInputNextButton.bind(this)
    this.processInputTextResponse = this.processInputTextResponse.bind(this)
    this.processInputSurveyResponse = this.processInputSurveyResponse.bind(this)
    this.next = this.next.bind(this)

    this.state.add('BOOT', BOOT)
    this.state.add('PRELOAD', PRELOAD)
    this.state.add('END', END)
    this.state.start('BOOT')
  }

  next () {
    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = null
    }
    this.input.keyboard.onDownCallback = null
    this.nextBtn.style.display = 'none'
    this.responseArea.style.display = 'none'
    this.surveyArea.style.display = 'none'
    if (this.trials.length > 0) {
      this.currentTrial = this.trials.shift()
      this.state.start(this.currentTrial.type)
    } else {
      this.state.start('END', END)
    }
  }

  waitResponse () {
    if (this.currentTrial.setting.inputAutoTimedAdvance && this.currentTrial.setting.inputAutoTimedAdvance !== '0') {
      this.processInputAutoTimedAdvance()
    }
    if (this.currentTrial.setting.inputKeyAdvance && this.currentTrial.setting.inputKeyAdvance.length > 0) {
      this.processInputKeyAdvance()
    } else if (this.currentTrial.setting.inputErrorFeedbackKeyAdvance &&
              this.currentTrial.setting.inputErrorFeedbackKeyAdvance.length > 0 &&
              this.currentTrial.setting.inputErrorFeedbackErrorKey &&
              this.currentTrial.setting.inputErrorFeedbackErrorKey.length > 0) {
      this.processInputErrorFeedback()
    } else if (this.currentTrial.setting.inputNextButton) {
      this.processInputNextButton()
    } else if (this.currentTrial.setting.inputTextResponse) {
      this.processInputTextResponse()
    } else if (this.currentTrial.setting.inputSurveyResponse) {
      this.processInputSurveyResponse()
    }
  }

  recordResponse () {

  }

  processInputAutoTimedAdvance () {
    let time = parseInt(this.currentTrial.setting.inputAutoTimedAdvance)
    this.timeout = setTimeout(() => {
      this.recordResponse()
      this.next()
    }, time)
  }

  processInputKeyAdvance () {
    this.input.keyboard.onDownCallback = (e) => {
      let keyCode = e.which || e.keyCode
      let pos = this.currentTrial.setting.inputKeyAdvance.indexOf(keyCode)
      if (pos > -1) {
        this.recordResponse()
        this.next()
      }
    }
  }

  processInputErrorFeedback () {
    this.input.keyboard.onDownCallback = (e) => {
      let keyCode = e.which || e.keyCode
      let correct = this.currentTrial.setting.inputErrorFeedbackKeyAdvance.indexOf(keyCode)
      let wrong = this.currentTrial.setting.inputErrorFeedbackErrorKey.indexOf(keyCode)

      if (wrong > -1) {
        this.input.keyboard.onDownCallback = null
        let wrongMessage = this.add.text(this.world.centerX, this.world.centerY,
                                  this.currentTrial.setting.inputErrorFeedbackMessage)
        wrongMessage.anchor.setTo(0.5, 0.5)
        wrongMessage.font = 'Helvetica'
        wrongMessage.fontSize = '16pt'
        wrongMessage.fill = '#5b4bca'

        let tween = this.add.tween(wrongMessage).to({ alpha:1 }, 400, Phaser.Easing.Linear.None, true, 0, 0, true)
        let myGame = this
        tween.onComplete.add(function () {
          wrongMessage.destroy()
          if (myGame.currentTrial.setting.inputErrorFeedbackAllowCorrection) {
            myGame.processInputErrorFeedback()
          } else {
            myGame.recordResponse()
            myGame.next()
          }
        })
      } else if (correct > -1) {
        this.recordResponse()
        this.next()
      }
    }
  }

  processInputNextButton () {
    this.nextBtn.style.display = 'block'
    let myGame = this
    this.nextBtn.addEventListener('click', (e) => {
      myGame.recordResponse()
      myGame.next()
    }, { once: true })
  }

  processInputTextResponse () {
    this.responseArea.style.display = 'block'
    this.processInputNextButton()
  }

  processInputSurveyResponse () {
    this.surveyArea.src = 'https://harvard.az1.qualtrics.com/jfe/form/SV_6M8XbiLtp6lX1Ah'
    this.surveyArea.style.display = 'block'
    this.processInputNextButton()
  }
}
