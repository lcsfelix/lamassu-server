import React from 'react'
import * as R from 'ramda'
import { makeStyles } from '@material-ui/core'

import Title from 'src/components/Title'
import { Table, THead, Th } from 'src/components/fake-table/Table'

import logsStyles from '../Logs.styles'

const localStyles = {}

const styles = R.merge(logsStyles, localStyles)

const useStyles = makeStyles(styles)

const CRYPTOCURRENCY_KEY = 'cryptocurrency'
const TICKER_KEY = 'ticker'
const WALLET_KEY = 'wallet'
const EXCHANGE_KEY = 'exchange'
const ZERO_CONF_KEY = 'zeroConf'
const EDIT_KEY = 'edit'
const ENABLE_KEY = 'enable'
const SIZE_KEY = 'size'
const TEXT_ALIGN_KEY = 'textAlign'

const columns = {
  [CRYPTOCURRENCY_KEY]: {
    [SIZE_KEY]: 182,
    [TEXT_ALIGN_KEY]: 'left'
  },
  [TICKER_KEY]: {
    [SIZE_KEY]: 182,
    [TEXT_ALIGN_KEY]: 'left'
  },
  [WALLET_KEY]: {
    [SIZE_KEY]: 182,
    [TEXT_ALIGN_KEY]: 'left'
  },
  [EXCHANGE_KEY]: {
    [SIZE_KEY]: 182,
    [TEXT_ALIGN_KEY]: 'left'
  },
  [ZERO_CONF_KEY]: {
    [SIZE_KEY]: 229,
    [TEXT_ALIGN_KEY]: 'left'
  },
  [EDIT_KEY]: {
    [SIZE_KEY]: 134,
    [TEXT_ALIGN_KEY]: 'center'
  },
  [ENABLE_KEY]: {
    [SIZE_KEY]: 109,
    [TEXT_ALIGN_KEY]: 'center'
  }
}

const OperatorInfo = () => {
  const classes = useStyles()

  const getSize = key => columns[key][SIZE_KEY]
  const getTextAlign = key => columns[key][TEXT_ALIGN_KEY]

  return (
    <>
      <div className={classes.titleWrapper}>
        <div className={classes.titleAndButtonsContainer}>
          <Title>Wallet Settings</Title>
        </div>
      </div>
      <div className={classes.wrapper}>
        <Table>
          <THead>
            <Th
              size={getSize(CRYPTOCURRENCY_KEY)}
              textAlign={getTextAlign(CRYPTOCURRENCY_KEY)}>
              Cryptocurrency
            </Th>
            <Th size={getSize(TICKER_KEY)} textAlign={getTextAlign(TICKER_KEY)}>
              Ticker
            </Th>
            <Th size={getSize(WALLET_KEY)} textAlign={getTextAlign(WALLET_KEY)}>
              Wallet
            </Th>
            <Th
              size={getSize(EXCHANGE_KEY)}
              textAlign={getTextAlign(EXCHANGE_KEY)}>
              Exchange
            </Th>
            <Th
              size={getSize(ZERO_CONF_KEY)}
              textAlign={getTextAlign(ZERO_CONF_KEY)}>
              Zero Conf
            </Th>
            <Th size={getSize(EDIT_KEY)} textAlign={getTextAlign(EDIT_KEY)}>
              Edit
            </Th>
            <Th size={getSize(ENABLE_KEY)} textAlign={getTextAlign(ENABLE_KEY)}>
              Enable
            </Th>
          </THead>
        </Table>
      </div>
    </>
  )
}

export default OperatorInfo
