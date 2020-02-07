import React, { useState } from 'react'
import * as R from 'ramda'
import { gql } from 'apollo-boost'
import { makeStyles } from '@material-ui/core'
import { useQuery } from '@apollo/react-hooks'

import Title from 'src/components/Title'
import {
  Table,
  THead,
  Th,
  TBody,
  Tr,
  Td
} from 'src/components/fake-table/Table'
import { Switch } from 'src/components/inputs'
import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/enabled.svg'
import { ReactComponent as DisabledEditIcon } from 'src/styling/icons/action/edit/disabled.svg'
import commonStyles from 'src/pages/common.styles'
import { zircon } from 'src/styling/variables'

const localStyles = {
  disabledDrawing: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    '& > div': {
      position: 'absolute',
      backgroundColor: zircon,
      height: 36,
      width: 678
    }
  }
}

const styles = R.merge(commonStyles, localStyles)

const useStyles = makeStyles(styles)

const CRYPTOCURRENCY_KEY = 'cryptocurrency'
const TICKER_KEY = 'ticker'
const WALLET_KEY = 'wallet'
const EXCHANGE_KEY = 'exchange'
const ZERO_CONF_KEY = 'zeroConf'
const EDIT_KEY = 'edit'
const ENABLE_KEY = 'enabled'
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

const GET_INFO = gql`
  {
    config
    cryptoCurrencies {
      code
      display
    }
  }
`

const schema = {
  [TICKER_KEY]: '',
  [WALLET_KEY]: '',
  [EXCHANGE_KEY]: '',
  [ZERO_CONF_KEY]: '',
  [ENABLE_KEY]: false
}

const WalletSettings = () => {
  const [cryptoCurrencies, setCryptoCurrencies] = useState(null)
  const [state, setState] = useState(null)

  useQuery(GET_INFO, {
    onCompleted: data => {
      const { cryptoCurrencies, config } = data
      const wallet = config?.wallet ?? []

      const newState = R.map(crypto => {
        const el = R.find(R.propEq(CRYPTOCURRENCY_KEY, crypto.code))(wallet)
        if (!el) return R.assoc(CRYPTOCURRENCY_KEY, crypto.code)(schema)
        return el
      })(cryptoCurrencies)

      setState(newState)
      setCryptoCurrencies(cryptoCurrencies)
    },
    onError: error => console.error(error)
  })

  const classes = useStyles()

  const getSize = key => columns[key][SIZE_KEY]
  const getTextAlign = key => columns[key][TEXT_ALIGN_KEY]
  const isSet = crypto =>
    crypto[TICKER_KEY] &&
    crypto[WALLET_KEY] &&
    crypto[EXCHANGE_KEY] &&
    crypto[ZERO_CONF_KEY]
  const handleEnable = name => event => console.log(name, event.target.checked)

  if (!state) return null

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
          <TBody>
            {state.map((row, idx) => (
              <Tr key={idx}>
                <Td
                  size={getSize(CRYPTOCURRENCY_KEY)}
                  textAlign={getTextAlign(CRYPTOCURRENCY_KEY)}>
                  {R.path(['display'])(
                    R.find(R.propEq('code', row[CRYPTOCURRENCY_KEY]))(
                      cryptoCurrencies
                    )
                  )}
                </Td>
                {!isSet(row) && (
                  <Td
                    size={
                      getSize(TICKER_KEY) +
                      getSize(WALLET_KEY) +
                      getSize(EXCHANGE_KEY) +
                      getSize(ZERO_CONF_KEY)
                    }
                    textAlign="center"
                    className={classes.disabledDrawing}>
                    <div />
                  </Td>
                )}
                {isSet(row) && (
                  <>
                    <Td
                      size={getSize(TICKER_KEY)}
                      textAlign={getTextAlign(TICKER_KEY)}>
                      Ticker
                    </Td>
                    <Td
                      size={getSize(WALLET_KEY)}
                      textAlign={getTextAlign(WALLET_KEY)}>
                      Wallet
                    </Td>
                    <Td
                      size={getSize(EXCHANGE_KEY)}
                      textAlign={getTextAlign(EXCHANGE_KEY)}>
                      Exchange
                    </Td>
                    <Td
                      size={getSize(ZERO_CONF_KEY)}
                      textAlign={getTextAlign(ZERO_CONF_KEY)}>
                      Zero Conf
                    </Td>
                  </>
                )}
                <Td size={getSize(EDIT_KEY)} textAlign={getTextAlign(EDIT_KEY)}>
                  {!isSet(row) && <DisabledEditIcon />}
                  {isSet(row) && (
                    <button className={classes.iconButton}>
                      <EditIcon />
                    </button>
                  )}
                </Td>
                <Td
                  size={getSize(ENABLE_KEY)}
                  textAlign={getTextAlign(ENABLE_KEY)}>
                  <Switch
                    checked={row[ENABLE_KEY]}
                    onChange={handleEnable(row[CRYPTOCURRENCY_KEY])}
                    value={row[CRYPTOCURRENCY_KEY]}
                  />
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </div>
    </>
  )
}

export default WalletSettings
