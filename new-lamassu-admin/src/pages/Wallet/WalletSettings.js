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
import Modal from 'src/components/Modal'

import WizardPage01 from './WizardPage01'
import WizardPage02 from './WizardPage02'
import {
  CRYPTOCURRENCY_KEY,
  TICKER_KEY,
  WALLET_KEY,
  EXCHANGE_KEY,
  ZERO_CONF_KEY,
  EDIT_KEY,
  ENABLE_KEY,
  SIZE_KEY,
  TEXT_ALIGN_KEY
} from './aux.js'

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
  },
  modal: {
    width: 544
  }
}

const styles = R.merge(commonStyles, localStyles)

const useStyles = makeStyles(styles)

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
    accounts {
      code
      display
      class
      cryptos
    }
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
  const [tickers, setTickers] = useState(null)
  // const [wallets, setWallets] = useState(null)
  // const [exchanges, setExchanges] = useState(null)
  // const [zeroConfs, setZeroConfs] = useState(null)
  const [state, setState] = useState(null)
  const [modalContent, setModalContent] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  useQuery(GET_INFO, {
    onCompleted: data => {
      const { cryptoCurrencies, config, accounts } = data
      console.log(accounts)

      const wallet = config?.wallet ?? []

      const newState = R.map(crypto => {
        const el = R.find(R.propEq(CRYPTOCURRENCY_KEY, crypto.code))(wallet)
        if (!el) return R.assoc(CRYPTOCURRENCY_KEY, crypto.code)(schema)
        return el
      })(cryptoCurrencies)

      setState(newState)
      setCryptoCurrencies(cryptoCurrencies)
      setTickers(R.filter(R.propEq('class', 'ticker'), accounts))
      // setWallets(R.filter(R.propEq('class', 'wallet'), accounts))
      // setExchanges(R.filter(R.propEq('class', 'exchange'), accounts))
      // setZeroConfs(R.filter(R.propEq('class', 'zeroConf'), accounts))
    },
    onError: error => console.error(error)
  })

  const classes = useStyles()

  const getSize = key => columns[key][SIZE_KEY]
  const getTextAlign = key => columns[key][TEXT_ALIGN_KEY]
  const getDisplayName = row =>
    R.path(['display'])(
      R.find(R.propEq('code', row[CRYPTOCURRENCY_KEY]))(cryptoCurrencies)
    )

  const isSet = crypto =>
    crypto[TICKER_KEY] &&
    crypto[WALLET_KEY] &&
    crypto[EXCHANGE_KEY] &&
    crypto[ZERO_CONF_KEY]
  const handleEnable = row => event => {
    if (!isSet(row)) {
      setModalContent(
        <WizardPage01
          crypto={row}
          coinName={getDisplayName(row)}
          handleModalNavigation={handleModalNavigation(row)}
        />
      )
      setModalOpen(true)
    }
  }
  const handleModalClose = () => {
    setModalOpen(false)
    setModalContent(null)
  }
  const handleModalNavigation = row => currentPage => {
    switch (currentPage) {
      case 1:
        // Start
        setModalContent(
          <WizardPage02
            crypto={row}
            coinName={getDisplayName(row)}
            handleModalNavigation={handleModalNavigation(row)}
            pageName="ticker"
            elements={R.filter(
              ticker => R.includes(row[CRYPTOCURRENCY_KEY], ticker.cryptos),
              tickers
            )}
          />
        )
        break
      case 2:
        // Ticker
        break
      case 3:
        // Wallet
        break
      case 4:
        // Exchange
        break
      case 5:
        // Zero Conf
        break
      default:
        break
    }
  }

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
                  {getDisplayName(row)}
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
                    onChange={handleEnable(row)}
                    value={row[CRYPTOCURRENCY_KEY]}
                  />
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </div>
      <Modal
        aria-labelledby="simple-modal-title"
        aria-describedby="simple-modal-description"
        open={modalOpen}
        handleClose={handleModalClose}
        className={classes.modal}>
        {modalContent}
      </Modal>
    </>
  )
}

export default WalletSettings
