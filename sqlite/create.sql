PRAGMA foreign_keys = ON;

CREATE TABLE fiat_codes (
  id INTEGER PRIMARY KEY NOT NULL,
  fiat_code TEXT NOT NULL
);

CREATE TABLE crypto_codes (
  id INTEGER PRIMARY KEY NOT NULL,
  crypto_code TEXT NOT NULL
);

CREATE TABLE tx_in_exchange_rates (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  crypto_code_id INTEGER REFERENCES crypto_codes ON DELETE RESTRICT NOT NULL,
  original_ticker_rate NUMERIC NOT NULL,
  original_ticker_rate_fiat_code TEXT NOT NULL,
  ticker_rate NUMERIC NOT NULL,
  offered_rate NUMERIC NOT NULL,
  commission_percent NUMERIC NOT NULL
);

CREATE TABLE tx_out_exchange_rates (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  crypto_code_id INTEGER REFERENCES crypto_codes ON DELETE RESTRICT NOT NULL,
  original_ticker_rate NUMERIC NOT NULL,
  original_ticker_rate_fiat_code TEXT NOT NULL,
  ticker_rate NUMERIC NOT NULL,
  offered_rate NUMERIC NOT NULL,
  commission_percent NUMERIC NOT NULL
);

CREATE TABLE tx_ins (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  uuid TEXT UNIQUE NOT NULL,
  tx_in_exchange_rate_id INTEGER UNIQUE REFERENCES tx_in_exchange_rate_id ON DELETE RESTRICT NOT NULL
);
CREATE INDEX tx_in_timestamp_idx ON tx_ins (timestamp DESC);

CREATE TABLE tx_in_addresses (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  crypto_address TEXT NOT NULL,
  tx_in_id INTEGER UNIQUE REFERENCES tx_ins ON DELETE RESTRICT NOT NULL
);
CREATE INDEX tx_in_addressess_address_idx ON tx_in_addresses (crypto_address);

CREATE TABLE tx_in_bills (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fiat_code_id INTEGER REFERENCES fiat_codes ON DELETE RESTRICT NOT NULL,
  denomination INTEGER NOT NULL,
  crypto_code_id INTEGER REFERENCES crypto_codes ON DELETE RESTRICT NOT NULL,
  crypto NUMERIC NOT NULL,
  uuid TEXT UNIQUE NOT NULL,
  tx_in_id INTEGER REFERENCES tx_ins ON DELETE RESTRICT NOT NULL
);
CREATE INDEX tx_in_bills_idx ON tx_in_bills (tx_in_id);

CREATE TABLE tx_in_sends (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fiat NUMERIC NOT NULL,
  fiat_code_id INTEGER REFERENCES fiat_codes ON DELETE RESTRICT NOT NULL,
  crypto_code_id INTEGER REFERENCES crypto_codes ON DELETE RESTRICT NOT NULL,
  crypto NUMERIC NOT NULL,
  miner_fee NUMERIC NOT NULL,
  base_fiat_code_id INTEGER REFERENCES fiat_codes ON DELETE RESTRICT NOT NULL,
  commission_fee NUMERIC NOT NULL,
  fixed_fee NUMERIC NOT NULL,
  tx_hash TEXT NOT NULL,
  tx_in_id INTEGER UNIQUE REFERENCES tx_ins ON DELETE RESTRICT NOT NULL
);

CREATE TABLE tx_in_confirmations (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  block_height INTEGER NOT NULL,
  block_hash TEXT NOT NULL,
  confirmations INTEGER NOT NULL,
  tx_in_id INTEGER REFERENCES tx_ins ON DELETE RESTRICT NOT NULL
);
CREATE INDEX tx_in_confirmations_idx ON tx_in_confirmations (tx_in_id);

CREATE TABLE tx_outs (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_timestamp TEXT,
  uuid TEXT UNIQUE NOT NULL,
  fiat_code_id INTEGER REFERENCES fiat_codes ON DELETE RESTRICT NOT NULL,
  fiat NUMERIC NOT NULL,
  crypto_code_id INTEGER REFERENCES crypto_codes ON DELETE RESTRICT NOT NULL,
  crypto NUMERIC NOT NULL,
  fudge_amount NUMERIC NOT NULL,
  tx_out_exchange_rate_id INTEGER UNIQUE REFERENCES tx_out_exchange_rates ON DELETE RESTRICT NOT NULL,
  tx_out_confirmation_id INTEGER UNIQUE REFERENCES tx_outs_confirmations ON DELETE RESTRICT,
  action TEXT CHECK (action IN ('accept', 'reject', 'normal')),
  action_user_id INTEGER REFERENCES users ON DELETE RESTRICT,
  tx_out_dispense_authorization_id INTEGER UNIQUE REFERENCES tx_out_dispense_authorizations ON DELETE RESTRICT,
  CHECK (NOT (action IS NOT NULL AND action_user_id IS NULL))
);
CREATE INDEX tx_out_timestamp_idx ON tx_outs (timestamp DESC);
CREATE TRIGGER tx_out_dispense_authorization_changes_trg
  UPDATE OF tx_out_confirmation_id, action, action_user_id, tx_out_dispense_authorization_id
  ON tx_outs
  BEGIN
    INSERT INTO tx_out_dispense_authorization_changes (tx_out_confirmation_id, action, action_user_id, tx_out_dispense_authorization_id)
    VALUES (OLD.tx_out_confirmation_id, OLD.action, OLD.action_user_id, OLD.tx_out_dispense_authorization_id);
    UPDATE tx_outs SET update_timestamp=CURRENT_TIMESTAMP where id=NEW.id;
  END;

CREATE TABLE tx_out_addresses (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  crypto_address TEXT NOT NULL,
  tx_out_id INTEGER REFERENCES tx_outs ON DELETE RESTRICT NOT NULL
);
CREATE INDEX tx_out_addresses_idx ON tx_out_addresses (tx_out_id);
CREATE INDEX tx_out_addressess_address_idx ON tx_out_addresses (crypto_address);

CREATE TABLE tx_out_dispense_authorization_changes (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tx_out_confirmation_id INTEGER UNIQUE REFERENCES tx_outs_confirmations ON DELETE RESTRICT,
  action TEXT CHECK (action IN ('accept', 'reject', 'normal')) NOT NULL,
  action_user_id INTEGER REFERENCES users ON DELETE RESTRICT,
  tx_out_dispense_authorization_id INTEGER UNIQUE REFERENCES tx_out_dispense_authorizations ON DELETE RESTRICT,
  tx_out_id INTEGER REFERENCES tx_outs ON DELETE RESTRICT NOT NULL,
  CHECK (NOT (action IS NOT NULL AND action_user_id IS NULL))
);
CREATE INDEX tx_out_dispense_authorization_changes_idx ON tx_out_addresses (tx_out_id);

CREATE TABLE tx_out_confirmations (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  block_height INTEGER NOT NULL,
  block_hash TEXT NOT NULL,
  crypto_code_id INTEGER REFERENCES crypto_codes ON DELETE RESTRICT NOT NULL,
  crypto NUMERIC NOT NULL,
  miner_fee NUMERIC NOT NULL,
  tx_hash TEXT NOT NULL,
  confirmations INTEGER NOT NULL,
  tx_out_address_id INTEGER REFERENCES tx_out_addresses ON DELETE RESTRICT NOT NULL
);
CREATE INDEX tx_out_confirmations_idx ON tx_out_confirmations (tx_out_address_id);

CREATE TABLE tx_out_seens (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  crypto_code_id INTEGER REFERENCES crypto_codes ON DELETE RESTRICT NOT NULL,
  crypto NUMERIC NOT NULL,
  miner_fee NUMERIC NOT NULL,
  tx_out_address_id INTEGER UNIQUE REFERENCES tx_out_addresses ON DELETE RESTRICT NOT NULL
);

CREATE TABLE tx_out_smss (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  phone_number TEXT NOT NULL,
  tx_out_id INTEGER UNIQUE REFERENCES tx_outs ON DELETE RESTRICT NOT NULL
);
CREATE INDEX tx_out_smss_phone_number_idx ON tx_out_smss (phone_number);

CREATE TABLE tx_out_dispense_authorizations (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fiat_code_id INTEGER REFERENCES fiat_codes ON DELETE RESTRICT NOT NULL,
  fiat NUMERIC NOT NULL,
  dispense_uuid TEXT UNIQUE NOT NULL
);

CREATE TABLE dispensers (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  model TEXT UNIQUE NOT NULL
);

CREATE TABLE tx_out_dispenses (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tx_out_dispense_authorization_id INTEGER UNIQUE REFERENCES fiat_codes ON DELETE RESTRICT NOT NULL,
  fiat_code_id INTEGER REFERENCES fiat_codes ON DELETE RESTRICT NOT NULL,
  fiat NUMERIC NOT NULL,
  dispenser_id INTEGER REFERENCES dispensers ON DELETE RESTRICT NOT NULL,
  cashbox_count INTEGER NOT NULL
);

CREATE TABLE tx_out_dispense_errors (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  error_code TEXT NOT NULL,
  description TEXT NOT NULL,
  tx_out_dispense_id INTEGER REFERENCES tx_out_dispenses ON DELETE RESTRICT NOT NULL
);
CREATE INDEX tx_out_dispense_errors_idx ON tx_out_dispense_errors (tx_out_dispense_id);

CREATE TABLE tx_out_dispense_authorization_bills (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tx_out_dispense_authorization_id INTEGER REFERENCES tx_out_dispenses ON DELETE RESTRICT NOT NULL,
  fiat_code_id INTEGER REFERENCES fiat_codes ON DELETE RESTRICT NOT NULL,
  denomination INTEGER NOT NULL,
  requested_count INTEGER NOT NULL,
  cashbox_position INTEGER NOT NULL
);
CREATE UNIQUE INDEX tx_out_dispense_authorization_bills_idx ON tx_out_dispense_authorization_bills (tx_out_dispense_authorization_id, cashbox_position);

CREATE TABLE tx_out_dispense_bills (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tx_out_dispense_authorization_bill_id INTEGER UNIQUE REFERENCES tx_out_dispenses_authorization_bills ON DELETE RESTRICT NOT NULL,
  tx_out_dispense_id INTEGER REFERENCES tx_out_dispenses ON DELETE RESTRICT NOT NULL,
  dispensed_count INTEGER NOT NULL,
  rejected_count INTEGER NOT NULL,
  cashbox_position INTEGER NOT NULL
);
CREATE UNIQUE INDEX tx_out_dispense_bills_idx ON tx_out_dispense_bills (tx_out_dispense_id, cashbox_position);

CREATE TABLE txs (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL,
  tx_in_id INTEGER UNIQUE REFERENCES tx_ins ON DELETE RESTRICT,
  tx_out_id INTEGER UNIQUE REFERENCES tx_outs ON DELETE RESTRICT,
  CHECK (
    (tx_in_id IS NULL AND tx_out_id IS NOT NULL) OR
    (tx_in_id IS NOT NULL AND tx_out_id NOT NULL)
  )
);
CREATE INDEX tx_timestamp_idx ON txs (timestamp DESC);
CREATE TRIGGER tx_ins_trg
  INSERT ON tx_ins
  BEGIN
    INSERT INTO txs (timestamp, tx_in_id) VALUES (NEW.timestamp, NEW.id);
  END;
CREATE TRIGGER tx_outs_trg
  INSERT ON tx_outs
  BEGIN
    INSERT INTO txs (timestamp, tx_out_id) VALUES (NEW.timestamp, NEW.id);
  END;

CREATE TABLE tx_trade_requests (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tx_id INTEGER REFERENCES txs ON DELETE RESTRICT NOT NULL
);

CREATE TABLE tx_trades (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tx_trade_request_id INTEGER UNIQUE REFERENCES tx_ins ON DELETE RESTRICT NOT NULL,
  crypto_code_id INTEGER REFERENCES crypto_codes ON DELETE RESTRICT NOT NULL,
  crypto NUMERIC NOT NULL,
  crypto_fee NUMERIC NOT NULL,
  fiat_code_id INTEGER REFERENCES fiat_codes ON DELETE RESTRICT NOT NULL,
  fiat NUMERIC NOT NULL,
  fiat_fee NUMERIC NOT NULL
);

CREATE TABLE tx_trade_errors (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tx_trade_request_id INTEGER REFERENCES tx_ins ON DELETE RESTRICT NOT NULL,
  error_code TEXT NOT NULL,
  error TEXT NOT NULL
);
CREATE INDEX tx_trade_errors_idx ON tx_trade_errors (tx_trade_request_id);

CREATE TABLE cashbox_in_empties (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id INTEGER REFERENCES users ON DELETE RESTRICT NOT NULL,
  cashbox_position INTEGER NOT NULL,
  tx_in_bill_id INTEGER REFERENCES fiat_codes ON DELETE RESTRICT NOT NULL
);
-- Not UNIQUE because cashbox could be serviced multiple times with no transaction activity.
CREATE INDEX cashbox_in_empties_idx ON cashbox_in_empties (tx_in_bill_id);

CREATE TABLE cashbox_out_empties (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id INTEGER REFERENCES users ON DELETE RESTRICT NOT NULL,
  cashbox_position INTEGER NOT NULL,
  fiat_code_id INTEGER REFERENCES fiat_codes ON DELETE RESTRICT NOT NULL,
  empty_count INTEGER NOT NULL,
  expected_count INTEGER NOT NULL,
  denomination INTEGER NOT NULL,
  tx_out_dispense_bill_id INTEGER REFERENCES tx_out_dispense_bills ON DELETE RESTRICT NOT NULL
);
CREATE INDEX cashbox_out_empties_idx ON cashbox_out_empties (tx_out_dispense_bill_id);

CREATE TABLE cashbox_out_fills (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id INTEGER REFERENCES users ON DELETE RESTRICT NOT NULL,
  cashbox_position INTEGER NOT NULL,
  fiat_code_id INTEGER REFERENCES fiat_codes ON DELETE RESTRICT NOT NULL,
  fill_count INTEGER NOT NULL,
  denomination INTEGER NOT NULL,
  cash_out_empty_id INTEGER UNIQUE REFERENCES cash_out_empties ON DELETE RESTRICT NOT NULL
);

CREATE TABLE one_time_tokens (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  token TEXT NOT NULL,
  user_id INTEGER REFERENCES users ON DELETE RESTRICT NOT NULL
);

CREATE TABLE one_time_token_actions (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  one_time_token_id INTEGER UNIQUE REFERENCES fiat_codes ON DELETE RESTRICT NOT NULL,
  ip_address TEXT NOT NULL
);

CREATE TABLE machines_certificates (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  certificate TEXT NOT NULL
);

CREATE TABLE machines (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_timestamp TEXT,
  model_id INTEGER REFERENCES machine_models ON DELETE RESTRICT NOT NULL,
  certificate_id INTEGER UNIQUE REFERENCES machine_certificates ON DELETE RESTRICT,
  is_online INTEGER NOT NULL DEFAULT 1,
  user_id INTEGER REFERENCES users ON DELETE RESTRICT NOT NULL
);

CREATE TABLE machine_changes (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL,
  certificate_id INTEGER UNIQUE REFERENCES machine_certificates ON DELETE RESTRICT,
  is_online INTEGER NOT NULL,
  user_id INTEGER REFERENCES users ON DELETE RESTRICT NOT NULL,
  machine_id INTEGER REFERENCES machines ON DELETE RESTRICT NOT NULL
);
CREATE TRIGGER machine_changes_trg
  UPDATE OF certificate_id, is_online, user_id
  ON machines
  BEGIN
    INSERT INTO machine_changes (timestamp, certificate_id, is_online, user_id, machine_id)
    VALUES (OLD.timestamp, OLD.certificate_id, OLD.is_online, OLD.user_id, OLD.id);
    UPDATE machines SET update_timestamp=CURRENT_TIMESTAMP where id=NEW.id;
  END;

CREATE TABLE roles (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  role_code TEXT UNIQUE NOT NULL
);

CREATE TABLE users (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_timestamp TEXT,
  token TEXT NOT NULL,
  role_id INTEGER REFERENCES roles ON DELETE RESTRICT NOT NULL,
  grantor_user_id REFERENCES users ON DELETE RESTRICT,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE user_changes (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL,
  token TEXT NOT NULL,
  role_id INTEGER REFERENCES roles ON DELETE RESTRICT NOT NULL,
  grantor_user_id REFERENCES users ON DELETE RESTRICT,
  user_id REFERENCES users ON DELETE RESTRICT NOT NULL
);
CREATE TRIGGER user_changes_trg
  UPDATE OF token, role_id, grantor_user_id
  ON users
  BEGIN
    INSERT INTO user_changes (timestamp, token, role_id, grantor_user_id, user_id)
    VALUES (OLD.timestamp, OLD.token, OLD.role_id, OLD.grantor_user_id, OLD.id);
    UPDATE users SET update_timestamp=CURRENT_TIMESTAMP where id=NEW.id;
  END;

CREATE TABLE terms_conditions (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_timestamp TEXT NOT NULL,
  terms TEXT NOT NULL,
  language_code TEXT NOT NULL,
  user_id REFERENCES users ON DELETE RESTRICT NOT NULL
);

CREATE TABLE term_conditions_changes (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL,
  terms TEXT NOT NULL,
  language_code TEXT NOT NULL,
  user_id REFERENCES users ON DELETE RESTRICT NOT NULL,
  term_condition_id REFERENCES terms_conditions ON DELETE RESTRICT NOT NULL
);
CREATE TRIGGER terms_conditions_changes_trg
  UPDATE OF terms, language_code
  ON terms_conditions
  BEGIN
    INSERT INTO terms_conditions_changes (timestamp, terms, language_code, user_id, term_condition_id)
    VALUES (OLD.timestamp, OLD.terms, OLD.language_code, OLD.user_id, OLD.term_condition_id);
    UPDATE terms_conditions SET update_timestamp=CURRENT_TIMESTAMP where id=NEW.id;
  END;

CREATE TABLE customers (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customer_requirements (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_timestamp TEXT,
  requirement_type TEXT NOT NULL,
  is_accepted INTEGER NOT NULL,
  user_id INTEGER REFERENCES users ON DELETE RESTRICT,
  customer_id INTEGER REFERENCES customers ON DELETE RESTRICT NOT NULL,
  customer_phone TEXT,
  customer_photo_hash TEXT,
  customer_data TEXT,
  CHECK (
    (
      requirement_type IN ('blocked', 'phone', 'photo', 'data')
    ) AND (
      requirement_type == 'blocked'
      AND COALESCE(customer_phone, customer_photo_hash, customer_data) IS NULL
    ) AND (
      requirement_type == 'phone'
      AND customer_phone IS NOT NULL
      AND COALESCE(customer_photo_hash, customer_data) IS NULL
    ) AND (
      requirement_type == 'photo'
      AND customer_photo_hash IS NOT NULL
      AND COALESCE(customer_phone, customer_data) IS NULL
    ) AND (
      requirement_type == 'data'
      AND customer_data IS NOT NULL
      AND COALESCE(customer_phone, customer_photo_hash) IS NULL
    )
  )
);
CREATE UNIQUE INDEX customer_requirements_idx ON customer_requirements (customer_id, requirement_type);
CREATE INDEX customer_requirements_phone ON customer_requirements (customer_phone);
-- Note: Add ways to search for data like name, document ID

CREATE TABLE customer_requirement_changes (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL,
  requirement_type TEXT NOT NULL,
  is_accept INTEGER NOT NULL,
  user_id INTEGER REFERENCES users ON DELETE RESTRICT,
  customer_id INTEGER REFERENCES customers ON DELETE RESTRICT NOT NULL,
  customer_phone TEXT,
  customer_photo_hash TEXT,
  customer_data TEXT,
  CHECK (
    (
      requirement_type IN ('blocked', 'phone', 'photo', 'data')
    ) AND (
      requirement_type == 'blocked'
      AND COALESCE(customer_phone, customer_photo_hash, customer_data) IS NULL
    ) AND (
      requirement_type == 'phone'
      AND customer_phone IS NOT NULL
      AND COALESCE(customer_photo_hash, customer_data) IS NULL
    ) AND (
      requirement_type == 'photo'
      AND customer_photo_hash IS NOT NULL
      AND COALESCE(customer_phone, customer_data) IS NULL
    ) AND (
      requirement_type == 'data'
      AND customer_data IS NOT NULL
      AND COALESCE(customer_phone, customer_photo_hash) IS NULL
    )
  )
);
CREATE TRIGGER customer_requirement_changes_trg
  UPDATE OF is_accept, user_id, customer_phone, customer_photo_hash, customer_data
  ON customer_requirements
  BEGIN
    INSERT INTO customer_requirement_changes (timestamp, is_accept, user_id, customer_phone, customer_photo_hash, customer_data, customer_id)
    VALUES (OLD.timestamp, OLD.is_accept, OLD.user_id, OLD.customer_phone, OLD.customer_photo_hash, OLD.customer_data, OLD.customer_id);
    UPDATE customer_requirements SET update_timestamp=CURRENT_TIMESTAMP where id=NEW.id;
  END;
