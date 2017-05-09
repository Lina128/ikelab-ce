import Phaser from 'phaser'
import * as myStates from './'

export default class extends Phaser.State {
  constructor () {
    super()
    this.myModules = new Set()
  }

  init () {
    this.game.input.keyboard.addKeyCapture(Phaser.Keyboard.SPACEBAR)
    this.stage.backgroundColor = '#FFFFFF'
    this.text = this.add.text(this.world.centerX, this.world.centerY, 'Loading ...', { fill: '#3a3a08' })
    this.text.anchor.setTo(0.5, 0.5)
    this.text.font = 'Helvetica'
    this.text.fontSize = '12pt'
    this.text.fontWeight = 'normal'
    this.text.fill = '#5b4bca'
  }

  preload () {
    this.load.image('loaderBar', '/loader-bar.png')
    this.buildExperiment(this.game.experiment)
  }

  create () {
    this.state.start('PRELOAD')
  }

  checkMediaType (url) {
    if (typeof url === 'string' && url.substring(0, 4) === 'http') {
      return true
    }
    return false
  }

  buildTrial (trial) {
    for (let s in trial.setting) {
      if (typeof trial.setting[s] === 'string') {
        if (this.checkMediaType(trial.setting[s])) {
          this.game.assets.push(trial.setting[s])
        }
      } else if (Array.isArray(trial.setting[s])) {
        for (let i = 0; i < trial.setting[s].length; i++) {
          if (this.checkMediaType(trial.setting[s][i])) {
            this.game.assets.push(trial.setting[s])
          }
        }
      }
    }
    this.myModules.add(trial.type)
    return trial
  }

  buildBlock (blockStructure, experimentEntity) {
    let toProcess = [...blockStructure.children]
    if (experimentEntity[blockStructure.id].setting.lockFirst === true) {
      toProcess = toProcess.slice(1)
    }
    if (experimentEntity[blockStructure.id].setting.lockLast === true) {
      toProcess = toProcess.slice(0, toProcess.length - 1)
    }

    toProcess = this.concatArr(toProcess, parseInt(experimentEntity[blockStructure.id].setting.display))

    if (experimentEntity[blockStructure.id].setting.randomize === true) {
      this.shuffle(toProcess)
    }

    let trials = []
    for (let i = 0; i < toProcess.length; i++) {
      trials.push(this.buildTrial(experimentEntity[toProcess[i].id]))
    }

    return trials
  }

  buildRun (runStructure, experimentEntity) {
    let toProcess = [...runStructure.children]

    if (experimentEntity[runStructure.id].setting.randomize === true) {
      this.shuffle(toProcess)
    }

    if (experimentEntity[runStructure.id].setting.abtesting === true) {
      toProcess = [toProcess[Math.floor(Math.random() * toProcess.length)]]
    }

    let trials = []
    for (let i = 0; i < toProcess.length; i++) {
      trials.push(...this.buildBlock(toProcess[i], experimentEntity))
    }

    return trials
  }

  buildExperiment (experiment) {
    if (!experiment) {
      return
    } else {
      const trials = []

      for (let i = 0; i < experiment.structure.length; i++) {
        if (experiment.structure[i].level === 'trial') {
          trials.push(this.buildTrial(experiment.entity[experiment.structure[i].id]))
        } else if (experiment.structure[i].level === 'block') {
          trials.push(...this.buildBlock(experiment.structure[i], experiment.entity))
        } else if (experiment.structure[i].level === 'run') {
          trials.push(...this.buildRun(experiment.structure[i], experiment.entity))
        }
      }
      this.game.trials = trials

      for (let m of this.myModules) {
        this.state.add(m, myStates[m])
      }
    }
  }

  shuffle (arr) {
    let curr = arr.length
    let rand
    while (curr > 0) {
      rand = Math.floor(curr * Math.random())
      curr--
      this.swap(arr, rand, curr)
    }
  }

  swap (arr, i, j) {
    let tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }

  concatArr (arr, n) {
    if (n === 0) {
      return []
    }

    if (n === 1) {
      return arr
    }

    let tmp = this.concatArr(arr, Math.floor(n / 2))

    return (n % 2 === 0) ? tmp.concat(tmp) : arr.concat(tmp.concat(tmp))
  }
}