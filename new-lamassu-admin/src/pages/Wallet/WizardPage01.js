import React from 'react'
import { makeStyles } from '@material-ui/core'

import { H1, P } from 'src/components/typography'
import { Button } from 'src/components/buttons'

const styles = {
  modalContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: [[0, 66]],
    '& > h1': {
      margin: [[32, 0]]
    },
    '& > p': {
      margin: 0
    },
    '& > button': {
      margin: [['auto', 0, 56]],
      '&:active': {
        margin: [['auto', 0, 56]]
      }
    }
  }
}

const useStyles = makeStyles(styles)

const WizardPage01 = ({
  crypto,
  logo,
  coinName,
  handleModalNavigation,
  ...props
}) => {
  const classes = useStyles()

  return (
    <div className={classes.modalContent}>
      <H1>Enable {coinName}</H1>
      <P>
        You are about to enable {coinName} on your system. This will allow you
        to use this cryptocurrency on your machines. To able to do that, you’ll
        have to setup all the necessary 3rd party services.
      </P>
      <Button onClick={() => handleModalNavigation(1)}>
        Start configuration
      </Button>
    </div>
  )
}

export default WizardPage01
