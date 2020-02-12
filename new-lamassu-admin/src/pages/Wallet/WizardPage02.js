import React from 'react'
import { makeStyles } from '@material-ui/core'

import { H1, Info2, H4 } from 'src/components/typography'
import { Button } from 'src/components/buttons'
import Stage from 'src/components/Stage'
import { startCase } from 'src/utils/string'

const styles = {
  modalContent: {
    display: 'flex',
    flexDirection: 'column',
    padding: [[24, 32]],
    '& > h1': {
      margin: [[0, 0, 12]]
    },
    '& > h4': {
      margin: [[32, 0]]
    },
    '& > p': {
      margin: 0
    },
    '& > button': {
      alignSelf: 'flex-end',
      width: 67,
      padding: [[0, 0]],
      margin: [['auto', 0, 0]],
      '&:active': {
        margin: [['auto', 0, 0]]
      }
    }
  },
  stages: {
    marginBottom: 0
  }
}

const useStyles = makeStyles(styles)

const WizardPage02 = ({ crypto, coinName, tickers, pageName }) => {
  const classes = useStyles()
  console.log(tickers)

  return (
    <div className={classes.modalContent}>
      <H1>Enable {coinName}</H1>
      <Info2>{startCase(pageName)}</Info2>
      <Stage
        stages={4}
        currentStage={1}
        color="spring"
        className={classes.stages}
      />
      <H4>{`Select a ${pageName} or set up a new one`}</H4>
      <Button>Next</Button>
    </div>
  )
}

export default WizardPage02
