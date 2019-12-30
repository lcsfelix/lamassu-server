const fs = require('fs')
const Database = require('better-sqlite3')
const uuid = require('uuid/v1')
const yargs = require('yargs')
const { join, map, range } = require('lodash/fp')

const argv = yargs
  .options({
    'db': {
      describe: 'the path to the database file',
      default: './lamassu.db',
      type: 'string'
    },
    's': {
      describe: 'the path to the schema file',
      default: './create.sql',
      alias: 'schema',
      type: 'string'
    }
  })
  .help()
  .alias('help', 'h')
  .argv

const DB_PATH = argv.db
const SCHEMA_FILE = argv.schema
const cryptoCodes = ['BTC', 'LTC', 'ZEC', 'BCH', 'DASH']
const fiatCodes = ['EUR', 'USD', 'AUD', 'GBP', 'INR', 'CAD', 'SGD', 'CHF', 'MYR', 'JPY', 'CNY']
const requirementTypes = ['customer_phone', 'customer_data', 'customer_photo', 'customer_document', 'blocked', 'vetted']
const lookupKeys = ['customer_phone', 'customer_document_code', 'customer_name']

/* Configurable */
const nCashboxInEmpties = 10000
const nCashboxOutEmpties = 48000
const nComplianceTriggers = 50000
const nDispensers = 5
const nConfigs = 100
const nRoles = 50
const nTxIns = 1000000
const nTxInBills = 40000
const nTxOuts = 1000000
const nTxOutAddresses = 450000
const nTxOutConfirmations = 10000
const nTxOutDispenseAuthorizations = 14000
const nTxOutDispenseAuthorizationBills = 5000
const nTxOutDispenseBills = 5
const nTxOutDispenseErrors = 20000
const nTxComplianceTriggers = 10000
const nTxTradeErrors = 100000
const nTxTradeRequests = 5
const nUsers = 600000
const nOneTimeTokens = 40000
const nMachineCertificates = 5
const nMachineModels = 5
const nTermsConditions = 5
const nCustomers = 700000
const nCustomerLookups = 30000
const nBlacklistAddresses = 20000
const nMachineLogs = 100000
const nServerLogs = 100000
const nMigrations = 500
const nComplianceRequirements = 30000

/* Dependant */
const nTxInAddresses = nTxIns
const nTxInConfirmations = nTxIns
const nTxOutDispenses = nTxOutDispenseAuthorizations
const nTxOutSeens = nTxOutAddresses
const nTxOutSmss = nTxOuts
const nTxInSends = nTxIns
const nTxTrades = nTxIns
const nCashboxOutFills = nCashboxOutEmpties
const nOneTimeTokenActions = nOneTimeTokens
const nMachines = nMachineCertificates
const nCustomerRequirements = nCustomers

const dispenserCodes = map((i) => getRandomString(4))(range(0, nDispensers))

function getRandomString (len) {
  return join('')(map((i) => String.fromCharCode(Math.floor(Math.random() * (90 - 65)) + 65))(range(0, len)))
}

function getRandomInt (min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min)) + min
}

function getRandomNumeric (min, max) {
  return Math.random() * (max - min) + min
}

function getRandomBool () {
  return getRandomInt(0, 2)
}

function getRandomFiatCode () {
  return fiatCodes[getRandomInt(0, fiatCodes.length)]
}

function getRandomCryptoCode () {
  return cryptoCodes[getRandomInt(0, cryptoCodes.length)]
}

function run (sql, values, tableName) {
  return Promise.all(map((v) => new Promise((resolve, reject) => {
    const info = sql.run(v)
    console.log(`Made ${info.changes} change to table ${tableName} id = ${info.lastInsertRowid}`)

    resolve(info)
  }))(values))
}

function insert (db, sql, values) {
  const stmt = db.prepare(sql)
  const tableName = sql.match(/INSERT INTO ([a-z_]+) .+/)[1]
  return run(stmt, values, tableName).then((info) => {
    console.log(`Sucessfully inserted ${info.length} rows into table ${tableName}`)
    return db
  })
}

function update (db, sql, values) {
  const stmt = db.prepare(sql)
  const tableName = sql.match(/UPDATE ([a-z_]+) .+/)[1]
  return run(stmt, values, tableName).then((info) => {
    console.log(`Sucessfully updated ${info.length} rows in table ${tableName}`)
    return db
  })
}

const create = new Promise((resolve, reject) => {
  const db = new Database(DB_PATH)

  db.exec(fs.readFileSync(SCHEMA_FILE, 'utf8'))

  resolve(db)
}).then((db) => {
  console.log('Connected to ' + DB_PATH + ' database.')
  console.log('Successfully created tables.')

  return db
}).catch((err) => {
  console.error(err.message)
  process.exit(1)
})

const pFiatCodes = create.then((db) => {
  return insert(db, 'INSERT INTO fiat_codes (fiat_code) VALUES (?)', fiatCodes)
}).catch((err) => {
  console.error('fiat_codes', err)
})

const pCryptoCodes = create.then((db) => {
  return insert(db, 'INSERT INTO crypto_codes (crypto_code) VALUES (?)', cryptoCodes)
}).catch((err) => {
  console.error('crypto_codes', err)
})

const pRoles = create.then((db) => {
  const values = map((i) => [
    i, // id
    getRandomString(5) // role_code
  ])(range(1, nRoles))
  return insert(db, 'INSERT INTO roles (id, role_code) VALUES (?, ?)', values)
}).catch((err) => {
  console.error('roles', err)
})

const pUsers = pRoles.then((db) => {
  const values = [
    1, // id
    getRandomString(6), // token
    getRandomInt(1, nRoles), // role_id
    getRandomString(10) // name
  ]
  return insert(db, 'INSERT INTO users (id, token, role_id, name) VALUES (?, ?, ?, ?)', [values])
}).then((db) => {
  const values = map((i) => [
    i, // id
    getRandomString(6), // token
    getRandomInt(1, nRoles), // role_id
    1, // grantor_user_id
    getRandomString(10) // name
  ])(range(2, nUsers))
  return insert(db, 'INSERT INTO users (id, token, role_id, grantor_user_id, name) VALUES (?, ?, ?, ?, ?)', values)
}).catch((err) => {
  console.error('users', err)
})

const pUpdateUsers = pUsers.then((db) => {
  return update(db, 'UPDATE users SET token = ? WHERE ID = ?', [[getRandomString(7), 1]])
}).catch((err) => {
  console.error('update_users', err)
})

const pConfigs = pUsers.then((db) => {
  const values = map((i) => [
    i, // id
    getRandomInt(1, nUsers), // user_id
    getRandomString(10), // config
    getRandomBool() // is_valid
  ])(range(1, nConfigs))
  return insert(db, 'INSERT INTO configs (id, user_id, config, is_valid) VALUES (?, ?, ?, ?)', values)
}).catch((err) => {
  console.error('configs', err)
})

const pTxOuts = Promise.all([pConfigs, pFiatCodes, pCryptoCodes])
  .then((resolved) => resolved[0])
  .then((db) => {
    const values = map((i) => [
      i, // id
      uuid(), // uuid,
      getRandomInt(1, nConfigs), // config_id
      getRandomFiatCode(), // fiat_code
      getRandomNumeric(0, 100), // fiat
      getRandomCryptoCode(), // crypto_code
      getRandomNumeric(0, 100), // crypto
      getRandomNumeric(0, 5), // original_ticker_rate
      getRandomFiatCode(), // original_ticker_rate_fiat_code
      getRandomNumeric(0, 5), // ticker_rate
      getRandomNumeric(0, 5), // offered_rate
      getRandomNumeric(0, 1), // commission_percent
      getRandomNumeric(0, 1), // fudge_amount
      getRandomBool() // is_suspicious
    ])(range(1, nTxOuts))
    return insert(db, 'INSERT INTO tx_outs (id, uuid, config_id, fiat_code, fiat, crypto_code, crypto, original_ticker_rate, original_ticker_rate_fiat_code, ticker_rate, offered_rate, commission_percent, fudge_amount, is_suspicious) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', values)
  }).catch((err) => {
    console.error('tx_outs', err)
  })

const pTxOutAddresses = pTxOuts.then((db) => {
  const values = map((i) => [
    i,
    getRandomString(32),
    getRandomInt(1, nTxOuts)
  ])(range(1, nTxOutAddresses))
  return insert(db, 'INSERT INTO tx_out_addresses (id, crypto_address, tx_out_id) VALUES (?, ?, ?)', values)
}).catch((err) => {
  console.error('tx_out_addresses', err)
})

const pTxOutConfirmations = Promise.all([pCryptoCodes, pTxOutAddresses])
  .then((resolved) => resolved[0])
  .then((db) => {
    const values = map((i) => [
      i, // id
      getRandomInt(0, 5), // block_height
      getRandomString(32), // block_hash
      getRandomCryptoCode(), // crypto_code
      getRandomNumeric(0, 100), // crypto
      getRandomNumeric(0, 10), // miner_fee
      getRandomString(32), // tx_hash
      getRandomInt(0, 5), // confirmations
      getRandomInt(1, nTxOutAddresses) // tx_out_address_id
    ])(range(1, nTxOutConfirmations))
    return insert(db, 'INSERT INTO tx_out_confirmations (id, block_height, block_hash, crypto_code, crypto, miner_fee, tx_hash, confirmations, tx_out_address_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', values)
  }).catch((err) => {
    console.error('tx_out_confirmations', err)
  })

const pTxOutSeens = Promise.all([pCryptoCodes, pTxOutAddresses])
  .then((resolved) => resolved[0])
  .then((db) => {
    const values = map((i) => [
      i, // id
      getRandomCryptoCode(), // crypto_code
      getRandomNumeric(0, 100), // crypto
      getRandomNumeric(0, 10), // miner_fee
      i // tx_out_address_id
    ])(range(1, nTxOutSeens))
    return insert(db, 'INSERT INTO tx_out_seens (id, crypto_code, crypto, miner_fee, tx_out_address_id) VALUES (?, ?, ?, ?, ?)', values)
  }).catch((err) => {
    console.error('tx_out_seens', err)
  })

const pTxOutSmss = pTxOuts.then((db) => {
  const values = map((i) => [
    i, // id
    getRandomString(), // phone_number
    i // tx_out_id
  ])(range(1, nTxOutSmss))
  return insert(db, 'INSERT INTO tx_out_smss (id, phone_number, tx_out_id) VALUES (?, ?, ?)', values)
}).catch((err) => {
  console.error('tx_out_smss', err)
})

const pTxOutDispenseAuthorizations = pFiatCodes.then((db) => {
  const values = map((i) => [
    i, // id
    getRandomFiatCode(), // fiat_code
    getRandomInt(0, 10), // fiat
    uuid() // dispense_uuid
  ])(range(1, nTxOutDispenseAuthorizations))
  return insert(db, 'INSERT INTO tx_out_dispense_authorizations (id, fiat_code, fiat, dispense_uuid) VALUES (?, ?, ?, ?)', values)
}).catch((err) => {
  console.error('tx_out_dispense_authorizations', err)
})

const pDispensers = create.then((db) => {
  const values = map((i) =>
    dispenserCodes[i - 1]
  )(range(1, nDispensers))
  return insert(db, 'INSERT INTO dispensers (dispenser_code) VALUES (?)', values)
}).catch((err) => {
  console.error('dispensers', err)
})

const pTxOutDispenses = Promise.all([pTxOutDispenseAuthorizations, pFiatCodes])
  .then((resolved) => resolved[0])
  .then((db) => {
    const values = map((i) => [
      i, // id
      i, // tx_out_dispense_authorization_id
      getRandomFiatCode(), // fiat_code
      getRandomNumeric(0, 100), // fiat
      getRandomInt(0, 100) // cashbox_count
    ])(range(1, nTxOutDispenses))
    return insert(db, 'INSERT INTO tx_out_dispenses (id, tx_out_dispense_authorization_id, fiat_code, fiat, cashbox_count) VALUES (?, ?, ?, ?, ?)', values)
  }).catch((err) => {
    console.error('tx_out_dispenses', err)
  })

const pTxOutDispenseErrors = pTxOutDispenses.then((db) => {
  const values = map((i) => [
    i, // id
    getRandomString(6), // error_code
    getRandomString(0, 20), // description
    getRandomInt(1, nTxOutDispenseAuthorizations) // tx_out_dispense_id
  ])(range(1, nTxOutDispenseErrors))
  return insert(db, 'INSERT INTO tx_out_dispense_errors (id, error_code, description, tx_out_dispense_id) VALUES (?, ?, ?, ?)', values)
}).catch((err) => {
  console.error('tx_out_dispense_errors', err)
})

const pTxOutDispenseAuthorizationBills = Promise.all([pTxOutDispenses, pFiatCodes])
  .then((resolved) => resolved[0])
  .then((db) => {
    const values = map((i) => [
      i, // id
      getRandomInt(1, nTxOutDispenseAuthorizations), // tx_out_dispense_authorization_id
      getRandomFiatCode(), // fiat_code
      getRandomInt(0, 10), // denomination
      getRandomInt(0, 10), // requested_count
      i // cashbox_position
    ])(range(1, nTxOutDispenseAuthorizationBills))
    return insert(db, 'INSERT INTO tx_out_dispense_authorization_bills (id, tx_out_dispense_authorization_id, fiat_code, denomination, requested_count, cashbox_position) VALUES (?, ?, ?, ?, ?, ?)', values)
  }).catch((err) => {
    console.error('tx_out_dispense_authorization_bills', err)
  })

const pTxOutDispenseBills = Promise.all([pTxOutDispenseAuthorizationBills, pTxOutDispenses])
  .then((resolved) => resolved[0])
  .then((db) => {
    const values = map((i) => [
      i, // id
      i, // tx_out_dispense_authorization_bill_id
      getRandomInt(1, nTxOutDispenseAuthorizations), // tx_out_dispense_id
      getRandomInt(0, 10), // dispensed_count
      getRandomInt(0, 10), // rejected_count
      i // cashbox_position
    ])(range(1, nTxOutDispenseBills))
    return insert(db, 'INSERT INTO tx_out_dispense_bills (id, tx_out_dispense_authorization_bill_id, tx_out_dispense_id, dispensed_count, rejected_count, cashbox_position) VALUES (?, ?, ?, ?, ?, ?)', values)
  }).catch((err) => {
    console.error('tx_out_dispense_bills', err)
  })

const pTxIns = Promise.all([pConfigs, pCryptoCodes])
  .then((resolved) => resolved[0])
  .then((db) => {
    const values = map((i) => [
      i, // id
      uuid(), // uuid
      getRandomInt(1, nConfigs), // config_id
      getRandomCryptoCode(), // crypto_code
      getRandomNumeric(0, 10), // original_ticker_rate
      getRandomFiatCode(), // original_ticker_rate_fiat_code
      getRandomNumeric(0, 5), // ticker_rate
      getRandomNumeric(0, 5), // offered_rate
      getRandomNumeric(0, 5), // commission_percent
      getRandomBool() // is_suspicious
    ])(range(1, nTxIns))
    return insert(db, 'INSERT INTO tx_ins (id, uuid, config_id, crypto_code, original_ticker_rate, original_ticker_rate_fiat_code, ticker_rate, offered_rate, commission_percent, is_suspicious) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', values)
  }).catch((err) => {
    console.error('tx_ins', err)
  })

const pTxInAddresses = pTxIns.then((db) => {
  const values = map((i) => [
    i, // id
    getRandomString(0, 32), // crypto_address
    i // tx_in_id
  ])(range(1, nTxInAddresses))
  return insert(db, 'INSERT INTO tx_in_addresses (id, crypto_address, tx_in_id) VALUES (?, ?, ?)', values)
}).catch((err) => {
  console.error('tx_in_addresses', err)
})

const pTxInBills = Promise.all([pFiatCodes, pCryptoCodes, pTxIns])
  .then((resolved) => resolved[0])
  .then((db) => {
    const values = map((i) => [
      i, // id
      getRandomFiatCode(), // fiat_code
      getRandomInt(0, 10), // denomination
      getRandomCryptoCode(), // crypto_code
      getRandomNumeric(0, 100), // crypto
      uuid(), // uuid
      getRandomInt(1, nTxIns) // tx_in_id
    ])(range(1, nTxInBills))
    return insert(db, 'INSERT INTO tx_in_bills (id, fiat_code, denomination, crypto_code, crypto, uuid, tx_in_id) VALUES (?, ?, ?, ?, ?, ?, ?)', values)
  }).catch((err) => {
    console.error('tx_in_bills', err)
  })

const pTxInSends = Promise.all([pFiatCodes, pCryptoCodes, pTxIns])
  .then((resolved) => resolved[0])
  .then((db) => {
    const values = map((i) => [
      i, // id
      getRandomNumeric(0, 100), // fiat
      getRandomFiatCode(), // fiat_code
      getRandomCryptoCode(), // crypto_code
      getRandomNumeric(0, 100), // crypto
      getRandomNumeric(0, 10), // miner_fee
      getRandomFiatCode(), // base_fiat_code
      getRandomNumeric(0, 5), // commission_fee
      getRandomNumeric(0, 10), // fixed_fee
      getRandomString(32), // tx_hash
      i // tx_in_id
    ])(range(1, nTxInSends))
    return insert(db, 'INSERT INTO tx_in_sends (id, fiat, fiat_code, crypto_code, crypto, miner_fee, base_fiat_code, commission_fee, fixed_fee, tx_hash, tx_in_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', values)
  }).catch((err) => {
    console.error('tx_in_sends', err)
  })

const pTxInConfirmations = pTxIns.then((db) => {
  const values = map((i) => [
    i, // id
    getRandomInt(0, 4), // block_height
    getRandomString(32), // block_hash
    getRandomInt(0, 4), // confirmations
    getRandomInt(1, nTxIns) // tx_in_id
  ])(range(1, nTxInConfirmations))
  return insert(db, 'INSERT INTO tx_in_confirmations (id, block_height, block_hash, confirmations, tx_in_id) VALUES (?, ?, ?, ?, ?)', values)
}).catch((err) => {
  console.error('tx_in_confirmations', err)
})

const pComplianceTriggers = Promise.all([pFiatCodes, pUsers])
  .then((resolved) => resolved[0])
  .then((db) => {
    const values = map((i) => [
      i, // id
      getRandomString(6), // trigger_type
      requirementTypes[getRandomInt(0, requirementTypes.length)], // requirement_type
      getRandomFiatCode(), // fiat_code
      getRandomNumeric(0, 10), // fiat_threshold
      getRandomInt(0, 4), // day_threshold
      getRandomString(10), // direction
      getRandomBool(), // is_active
      getRandomInt(1, nUsers) // user_id
    ])(range(1, nComplianceTriggers))
    return insert(db, 'INSERT INTO compliance_triggers (id, trigger_type, requirement_type, fiat_code, fiat_threshold, day_threshold, direction, is_active, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', values)
  }).catch((err) => {
    console.error('compliance_triggers', err)
  })

const pTxComplianceTriggers = Promise.all([pTxOuts, pTxIns, pComplianceTriggers])
  .then((resolved) => resolved[0])
  .then((db) => {
    const values = map((i) => [
      i, // id
      getRandomInt(1, nTxIns + nTxOuts - 1), // tx_id
      getRandomInt(1, nComplianceTriggers) // compliance_trigger_id
    ])(range(1, nTxComplianceTriggers))
    return insert(db, 'INSERT INTO tx_compliance_triggers (id, tx_id, compliance_trigger_id) VALUES (?, ?, ?)', values)
  }).catch((err) => {
    console.error('tx_compliance_triggers', err)
  })

const pTxTradeRequests = Promise.all([pTxOuts, pTxIns])
  .then((resolved) => resolved[0])
  .then((db) => {
    const values = map((i) => [
      i, // id
      getRandomInt(1, nTxIns + nTxOuts - 1) // tx_id
    ])(range(1, nTxTradeRequests))
    return insert(db, 'INSERT INTO tx_trade_requests (id, tx_id) VALUES (?, ?)', values)
  }).catch((err) => {
    console.error('tx_trade_requests', err)
  })

const pTxTrades = Promise.all([pTxIns, pCryptoCodes, pFiatCodes])
  .then((resolved) => resolved[0])
  .then((db) => {
    const values = map((i) => [
      i, // id
      i, // tx_trade_request_id
      getRandomCryptoCode(), // crypto_code
      getRandomNumeric(0, 100), // crypto
      getRandomNumeric(0, 10), // crypto_fee
      getRandomFiatCode(), // fiat_code
      getRandomNumeric(0, 100), // fiat
      getRandomNumeric(0, 10) // fiat_fee
    ])(range(1, nTxTrades))
    return insert(db, 'INSERT INTO tx_trades (id, tx_trade_request_id, crypto_code, crypto, crypto_fee, fiat_code, fiat, fiat_fee) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', values)
  }).catch((err) => {
    console.error('tx_trades', err)
  })

const txTradeErrors = pTxIns.then((db) => {
  const values = map((i) => [
    i, // id
    getRandomInt(1, nTxIns), // tx_trade_request_id
    getRandomString(5), // error_code
    getRandomString(20) // error
  ])(range(1, nTxTradeErrors))
  return insert(db, 'INSERT INTO tx_trade_errors (id, tx_trade_request_id, error_code, error) VALUES (?, ?, ?, ?)', values)
}).catch((err) => {
  console.error('tx_trade_errors', err)
})

const pCashboxInEmpties = Promise.all([pUsers, pTxInBills])
  .then((resolved) => resolved[0])
  .then((db) => {
    const values = map((i) => [
      i, // id
      getRandomInt(1, nUsers), // user_id
      getRandomInt(0, 10), // cashbox_position
      getRandomInt(1, nTxInBills) // tx_in_bill_id
    ])(range(1, nCashboxInEmpties))
    return insert(db, 'INSERT INTO cashbox_in_empties (id, user_id, cashbox_position, tx_in_bill_id) VALUES (?, ?, ?, ?)', values)
  }).catch((err) => {
    console.error('cashbox_in_empties', err)
  })

const pCashboxOutEmpties = Promise.all([pUsers, pFiatCodes, pTxOutDispenseBills])
  .then((resolved) => resolved[0])
  .then((db) => {
    const values = map((i) => [
      i, // id
      getRandomInt(1, nUsers), // user_id
      getRandomInt(0, 10), // cashbox_position,
      getRandomFiatCode(), // fiat_code
      getRandomInt(0, 20), // removed_bill_count
      getRandomInt(0, 20), // expected_removed_bills_count
      getRandomInt(0, 20), // reject_tray_bills_count
      getRandomInt(0, 20), // expected_reject_tray_bills_count
      getRandomInt(0, 500), // denomination
      getRandomInt(1, nTxOutDispenseBills) // tx_out_dispense_bill
    ])(range(1, nCashboxOutEmpties))
    return insert(db, 'INSERT INTO cashbox_out_empties (id, user_id, cashbox_position, fiat_code, removed_bills_count, expected_removed_bills_count, reject_tray_bills_count, expected_reject_tray_bills_count, denomination, tx_out_dispense_bill_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', values)
  }).catch((err) => {
    console.error('cashbox_out_empties', err)
  })

const pCashboxOutFills = Promise.all([pUsers, pFiatCodes, pCashboxOutEmpties])
  .then((resolved) => resolved[0])
  .then((db) => {
    const values = map((i) => [
      i, // id
      getRandomInt(1, nUsers), // user_id
      getRandomInt(0, 10), // cashbox_position
      getRandomFiatCode(), // fiat_code
      getRandomInt(0, 50), // fiat_count
      getRandomInt(0, 500), // denomination
      i // cashbox_out_empty_id
    ])(range(1, nCashboxOutFills))
    return insert(db, 'INSERT INTO cashbox_out_fills (id, user_id, cashbox_position, fiat_code, fill_count, denomination, cashbox_out_empty_id) VALUES (?, ?, ?, ?, ?, ?, ?)', values)
  }).catch((err) => {
    console.error('cashbox_out_fills', err)
  })

const pOneTimeTokens = pUsers.then((db) => {
  const values = map((i) => [
    i, // id
    getRandomString(0, 32), // token
    getRandomInt(1, nUsers) // user_id
  ])(range(1, nOneTimeTokens))
  return insert(db, 'INSERT INTO one_time_tokens (id, token, user_id) VALUES (?, ?, ?)', values)
}).catch((err) => {
  console.error('one_time_tokens', err)
})

const pOneTimeTokenActions = pOneTimeTokens.then((db) => {
  const values = map((i) => [
    i, // id
    i, // one_time_token_id
    getRandomString(15) // ip_address
  ])(range(1, nOneTimeTokenActions))
  return insert(db, 'INSERT INTO one_time_token_actions (id, one_time_token_id, ip_address) VALUES (?, ?, ?)', values)
}).catch((err) => {
  console.error('one_time_token_actions', err)
})

const pMachineCertificates = create.then((db) => {
  const values = map((i) => [
    i, // id
    getRandomString(0, 20) // certificate
  ])(range(1, nMachineCertificates))
  return insert(db, 'INSERT INTO machine_certificates (id, certificate) VALUES (?, ?)', values)
}).catch((err) => {
  console.error('machine_certificates', err)
})

const pMachineModels = create.then((db) => {
  const values = map((i) => [
    i, // id
    getRandomBool(), // has_printer
    getRandomBool(), // has_dispenser
    getRandomString(0, 20) // description
  ])(range(1, nMachineModels))
  return insert(db, 'INSERT INTO machine_models (id, has_printer, has_dispenser, description) VALUES (?, ?, ?, ?)', values)
}).catch((err) => {
  console.error('machine_models', err)
})

const pMachines = Promise.all([pMachineModels, pMachineCertificates, pDispensers, pUsers])
  .then((resolved) => resolved[0])
  .then((db) => {
    const values = map((i) => [
      i, // id
      getRandomInt(1, nMachineModels), // model_id
      i, // certificate_id
      getRandomBool(), // is_online
      dispenserCodes[i - 1], // dispenser_code
      getRandomInt(1, nUsers) // user_id
    ])(range(1, nMachines))
    return insert(db, 'INSERT INTO machines (id, model_id, certificate_id, is_online, dispenser_code, user_id) VALUES (?, ?, ?, ?, ?, ?)', values)
  }).catch((err) => {
    console.error('machines', err)
  })

const pUpdateMachines = pMachines.then((db) => {
  return update(db, 'UPDATE machines SET is_online = ? WHERE id = ?', [[0, 1]])
}).catch((err) => {
  console.error('machine_changes', err)
})

const pTermsConditions = pUsers.then((db) => {
  const values = map((i) => [
    i, // id
    getRandomString(20), // terms
    getRandomString(2), // language_code
    getRandomInt(1, nUsers) // user_id
  ])(range(1, nTermsConditions))
  return insert(db, 'INSERT INTO terms_conditions (id, terms, language_code, user_id) VALUES (?, ?, ?, ?)', values)
}).catch((err) => {
  console.error('terms_conditions', err)
})

const pUpdateTermsConditions = pTermsConditions.then((db) => {
  return update(db, 'UPDATE terms_conditions SET terms = ?, language_code = ? WHERE id = ?', [[getRandomString(20), getRandomString(2), 1]])
}).catch((err) => {
  console.error('update_terms_conditions', err)
})

const pCustomers = create.then((db) => {
  const values = map((i) => [
    i, // id
    getRandomString(20), // customer_name
    getRandomString(12), // customer_phone
    getRandomString(10) // customer_document_code
  ])(range(1, nCustomers))
  return insert(db, 'INSERT INTO customers (id, customer_name, customer_phone, customer_document_code) VALUES (?, ?, ?, ?)', values)
}).catch((err) => {
  console.error('customers', err)
})

const pCustomerLookups = pCustomers.then((db) => {
  const values = map((i) => [
    getRandomInt(1, nCustomers), // customer_id
    lookupKeys[getRandomInt(0, lookupKeys.length)], // lookup_key
    getRandomString(0, 5) // value
  ])(range(1, nCustomerLookups))
  return insert(db, 'INSERT INTO customer_lookups (customer_id, lookup_key, value) VALUES (?, ?, ?)', values)
}).catch((err) => {
  console.error('customer_lookups', err)
})

const pCustomerRequirements = Promise.all([pUsers, pCustomers, pTxIns, pTxOuts])
  .then((resolved) => resolved[0])
  .then((db) => {
    const values = map((i) => [
      i, // id
      requirementTypes[getRandomInt(0, requirementTypes.length)], // requirement_type
      getRandomBool(), // is_accepted
      getRandomBool(), // is_active
      getRandomString(10), // expires
      getRandomInt(1, nUsers), // user_id
      i, // customer_id
      getRandomString(20), // customer_value
      getRandomInt(1, nTxIns + nTxOuts - 1) // tx_id
    ])(range(1, nCustomerRequirements))
    return insert(db, 'INSERT INTO customer_requirements (id, requirement_type, is_accepted, is_active, expires, user_id, customer_id, customer_value, tx_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', values)
  }).catch((err) => {
    console.error('customer_requirements', err)
  })

const pUpdateCustomerRequirements = pCustomerRequirements.then((db) => {
  return update(db, 'UPDATE customer_requirements SET is_active = ? WHERE id = ?', [[0, 1]])
}).catch((err) => {
  console.error('customer_requirement_changes', err)
})

const pBlacklistAddresses = Promise.all([pCryptoCodes, pUsers])
  .then((resolved) => resolved[0])
  .then((db) => {
    const values = map((i) => [
      i, // id
      getRandomCryptoCode(), // crypto_code
      getRandomString(32), // crypto_address
      getRandomInt(1, nUsers) // user_id
    ])(range(1, nBlacklistAddresses))
    return insert(db, 'INSERT INTO blacklist_addresses (id, crypto_code, crypto_address, user_id) VALUES (?, ?, ?, ?)', values)
  }).catch((err) => {
    console.error('blacklist_addresses', err)
  })

const pMachineLogs = pMachines.then((db) => {
  const values = map((i) => [
    i, // id
    getRandomString(16), // machine_timestamp
    getRandomInt(1, nMachines), // machine_id
    getRandomString(20) // log_entry
  ])(range(1, nMachineLogs))
  return insert(db, 'INSERT INTO machine_logs (id, machine_timestamp, machine_id, log_entry) VALUES (?, ?, ?, ?)', values)
}).catch((err) => {
  console.error('machine_logs', err)
})

const pServerLogs = create.then((db) => {
  const values = map((i) => [
    i, // id
    getRandomString(20) // log_entry
  ])(range(1, nServerLogs))
  return insert(db, 'INSERT INTO server_logs (id, log_entry) VALUES (?, ?)', values)
}).catch((err) => {
  console.error('server_logs', err)
})

const pMigrations = create.then((db) => {
  const values = map((i) => [
    i, // id
    getRandomInt(0, 100) // last_migration_applied
  ])(range(1, nMigrations))
  return insert(db, 'INSERT INTO migrations (id, last_migration_applied) VALUES (?, ?)', values)
}).catch((err) => {
  console.error('migrations', err)
})

const pComplianceRequirements = pUsers.then((db) => {
  const values = map((i) => [
    i, // id
    requirementTypes[getRandomInt(1, requirementTypes.length)], // requirement_type
    getRandomInt(0, 365), // expiration_days
    getRandomInt(0, 10), // tier_escalation_days
    getRandomBool(), // is_manual
    getRandomInt(1, nUsers) // user_id
  ])(range(1, nComplianceRequirements))
  return insert(db, 'INSERT INTO compliance_requirements (id, requirement_type, expiration_days, tier_escalation_days, is_manual, user_id) VALUES (?, ?, ?, ?, ?, ?)', values)
}).catch((err) => {
  console.error('compliance_reqiurements', err)
})
