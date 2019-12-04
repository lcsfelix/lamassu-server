PRAGMA foreign_keys = ON;

CREATE TABLE fiat_codes (
  fiat_code TEXT PRIMARY KEY NOT NULL
);

CREATE TABLE crypto_codes (
  crypto_code TEXT PRIMARY KEY NOT NULL
);

CREATE TABLE tx_ins (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  uuid TEXT UNIQUE NOT NULL,
  config_id INTEGER REFERENCES configs ON DELETE RESTRICT NOT NULL,
  crypto_code TEXT REFERENCES crypto_codes ON DELETE RESTRICT NOT NULL,
  original_ticker_rate NUMERIC NOT NULL,
  original_ticker_rate_fiat_code TEXT NOT NULL,
  ticker_rate NUMERIC NOT NULL,
  offered_rate NUMERIC NOT NULL,
  commission_percent NUMERIC NOT NULL
);
CREATE INDEX tx_in_timestamp_idx ON tx_ins (timestamp DESC);

CREATE TABLE tx_in_addresses (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  crypto_address TEXT NOT NULL,
  tx_in_id INTEGER UNIQUE REFERENCES tx_ins ON DELETE RESTRICT NOT NULL
);
CREATE INDEX tx_in_address_address_idx ON tx_in_addresses (crypto_address);

CREATE TABLE tx_in_bills (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fiat_code TEXT REFERENCES fiat_codes ON DELETE RESTRICT NOT NULL,
  denomination INTEGER NOT NULL,
  crypto_code TEXT REFERENCES crypto_codes ON DELETE RESTRICT NOT NULL,
  crypto NUMERIC NOT NULL,
  uuid TEXT UNIQUE NOT NULL,
  tx_in_id INTEGER REFERENCES tx_ins ON DELETE RESTRICT NOT NULL
);
CREATE INDEX tx_in_bill_idx ON tx_in_bills (tx_in_id);

CREATE TABLE tx_in_sends (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fiat NUMERIC NOT NULL,
  fiat_code TEXT REFERENCES fiat_codes ON DELETE RESTRICT NOT NULL,
  crypto_code TEXT REFERENCES crypto_codes ON DELETE RESTRICT NOT NULL,
  crypto NUMERIC NOT NULL,
  miner_fee NUMERIC NOT NULL,
  base_fiat_code TEXT REFERENCES fiat_codes ON DELETE RESTRICT NOT NULL,
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
CREATE INDEX tx_in_confirmation_idx ON tx_in_confirmations (tx_in_id);

CREATE TABLE tx_outs (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_timestamp TEXT,
  uuid TEXT UNIQUE NOT NULL,
  config_id INTEGER REFERENCES configs ON DELETE RESTRICT NOT NULL,
  fiat_code TEXT REFERENCES fiat_codes ON DELETE RESTRICT NOT NULL,
  fiat NUMERIC NOT NULL,
  crypto_code TEXT REFERENCES crypto_codes ON DELETE RESTRICT NOT NULL,
  crypto NUMERIC NOT NULL,
  original_ticker_rate NUMERIC NOT NULL,
  original_ticker_rate_fiat_code TEXT NOT NULL,
  ticker_rate NUMERIC NOT NULL,
  offered_rate NUMERIC NOT NULL,
  commission_percent NUMERIC NOT NULL,
  fudge_amount NUMERIC NOT NULL,
  tx_out_confirmation_id INTEGER UNIQUE REFERENCES tx_out_confirmations ON DELETE RESTRICT,
  action TEXT CHECK (action IN ('accept', 'reject', 'normal')),
  action_user_id INTEGER REFERENCES users ON DELETE RESTRICT,
  tx_out_dispense_authorization_id INTEGER UNIQUE REFERENCES tx_out_dispense_authorizations ON DELETE RESTRICT,
  CHECK (NOT (action IS NOT NULL AND action_user_id IS NULL))
);
CREATE INDEX tx_out_timestamp_idx ON tx_outs (timestamp DESC);
CREATE TRIGGER tx_out_dispense_authorization_change_trg
  UPDATE OF tx_out_confirmation_id, action, action_user_id, tx_out_dispense_authorization_id
  ON tx_outs
  BEGIN
    INSERT INTO tx_out_dispense_authorization_changes (tx_out_confirmation_id, action, action_user_id, tx_out_dispense_authorization_id, tx_out_id)
    VALUES (OLD.tx_out_confirmation_id, OLD.action, OLD.action_user_id, OLD.tx_out_dispense_authorization_id, OLD.id);
    UPDATE tx_outs SET update_timestamp=CURRENT_TIMESTAMP where id=NEW.id;
  END;

CREATE TABLE tx_out_addresses (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  crypto_address TEXT NOT NULL,
  tx_out_id INTEGER REFERENCES tx_outs ON DELETE RESTRICT NOT NULL
);
CREATE INDEX tx_out_address_idx ON tx_out_addresses (tx_out_id);
CREATE INDEX tx_out_address_address_idx ON tx_out_addresses (crypto_address);

CREATE TABLE tx_out_dispense_authorization_changes (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tx_out_confirmation_id INTEGER UNIQUE REFERENCES tx_out_confirmations ON DELETE RESTRICT,
  action TEXT CHECK (action IN ('accept', 'reject', 'normal')) NOT NULL,
  action_user_id INTEGER REFERENCES users ON DELETE RESTRICT,
  tx_out_dispense_authorization_id INTEGER UNIQUE REFERENCES tx_out_dispense_authorizations ON DELETE RESTRICT,
  tx_out_id INTEGER REFERENCES tx_outs ON DELETE RESTRICT NOT NULL,
  CHECK (NOT (action IS NOT NULL AND action_user_id IS NULL))
);
CREATE INDEX tx_out_dispense_authorization_changes_idx ON tx_out_dispense_authorization_changes (tx_out_id);

CREATE TABLE tx_out_confirmations (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  block_height INTEGER NOT NULL,
  block_hash TEXT NOT NULL,
  crypto_code TEXT REFERENCES crypto_codes ON DELETE RESTRICT NOT NULL,
  crypto NUMERIC NOT NULL,
  miner_fee NUMERIC NOT NULL,
  tx_hash TEXT NOT NULL,
  confirmations INTEGER NOT NULL,
  tx_out_address_id INTEGER REFERENCES tx_out_addresses ON DELETE RESTRICT NOT NULL
);
CREATE INDEX tx_out_confirmation_idx ON tx_out_confirmations (tx_out_address_id);

CREATE TABLE tx_out_seens (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  crypto_code TEXT REFERENCES crypto_codes ON DELETE RESTRICT NOT NULL,
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
CREATE INDEX tx_out_sms_phone_number_idx ON tx_out_smss (phone_number);

CREATE TABLE tx_out_dispense_authorizations (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fiat_code TEXT REFERENCES fiat_codes ON DELETE RESTRICT NOT NULL,
  fiat NUMERIC NOT NULL,
  dispense_uuid TEXT UNIQUE NOT NULL
);

CREATE TABLE dispensers (
  dispenser_code TEXT PRIMARY KEY NOT NULL
);

CREATE TABLE tx_out_dispenses (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tx_out_dispense_authorization_id INTEGER UNIQUE REFERENCES fiat_codes ON DELETE RESTRICT NOT NULL,
  fiat_code TEXT REFERENCES fiat_codes ON DELETE RESTRICT NOT NULL,
  fiat NUMERIC NOT NULL,
  cashbox_count INTEGER NOT NULL
);

CREATE TABLE tx_out_dispense_errors (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  error_code TEXT NOT NULL,
  description TEXT NOT NULL,
  tx_out_dispense_id INTEGER REFERENCES tx_out_dispenses ON DELETE RESTRICT NOT NULL
);
CREATE INDEX tx_out_dispense_error_idx ON tx_out_dispense_errors (tx_out_dispense_id);

CREATE TABLE tx_out_dispense_authorization_bills (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tx_out_dispense_authorization_id INTEGER REFERENCES tx_out_dispenses ON DELETE RESTRICT NOT NULL,
  fiat_code TEXT REFERENCES fiat_codes ON DELETE RESTRICT NOT NULL,
  denomination INTEGER NOT NULL,
  requested_count INTEGER NOT NULL,
  cashbox_position INTEGER NOT NULL
);
CREATE UNIQUE INDEX tx_out_dispense_authorization_bill_idx ON tx_out_dispense_authorization_bills (tx_out_dispense_authorization_id, cashbox_position);

CREATE TABLE tx_out_dispense_bills (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tx_out_dispense_authorization_bill_id INTEGER UNIQUE REFERENCES tx_out_dispense_authorization_bills ON DELETE RESTRICT NOT NULL,
  tx_out_dispense_id INTEGER REFERENCES tx_out_dispenses ON DELETE RESTRICT NOT NULL,
  dispensed_count INTEGER NOT NULL,
  rejected_count INTEGER NOT NULL,
  cashbox_position INTEGER NOT NULL
);
CREATE UNIQUE INDEX tx_out_dispense_bill_idx ON tx_out_dispense_bills (tx_out_dispense_id, cashbox_position);

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
CREATE TRIGGER tx_in_trg
  INSERT ON tx_ins
  BEGIN
    INSERT INTO txs (timestamp, tx_in_id) VALUES (NEW.timestamp, NEW.id);
  END;
CREATE TRIGGER tx_out_trg
  INSERT ON tx_outs
  BEGIN
    INSERT INTO txs (timestamp, tx_out_id) VALUES (NEW.timestamp, NEW.id);
  END;

CREATE TABLE tx_compliance_triggers (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tx_id INTEGER REFERENCES txs ON DELETE RESTRICT NOT NULL,
  compliance_trigger_id INTEGER REFERENCES compliance_triggers ON DELETE RESTRICT
);
CREATE INDEX tx_compliance_trigger_idx ON tx_compliance_triggers (tx_id);

CREATE TABLE tx_trade_requests (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tx_id INTEGER REFERENCES txs ON DELETE RESTRICT NOT NULL
);
CREATE INDEX tx_trade_request_idx ON tx_trade_requests (tx_id);

CREATE TABLE tx_trades (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tx_trade_request_id INTEGER UNIQUE REFERENCES tx_ins ON DELETE RESTRICT NOT NULL,
  crypto_code TEXT REFERENCES crypto_codes ON DELETE RESTRICT NOT NULL,
  crypto NUMERIC NOT NULL,
  crypto_fee NUMERIC NOT NULL,
  fiat_code TEXT REFERENCES fiat_codes ON DELETE RESTRICT NOT NULL,
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
CREATE INDEX cashbox_in_empty_idx ON cashbox_in_empties (tx_in_bill_id);

CREATE TABLE cashbox_out_empties (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id INTEGER REFERENCES users ON DELETE RESTRICT NOT NULL,
  cashbox_position INTEGER NOT NULL,
  fiat_code TEXT REFERENCES fiat_codes ON DELETE RESTRICT NOT NULL,
  removed_bills_count INTEGER NOT NULL,
  expected_removed_bills_count INTEGER NOT NULL,
  reject_tray_bills_count INTEGER NOT NULL,
  expected_reject_tray_bills_count INTEGER NOT NULL,
  denomination INTEGER NOT NULL,
  tx_out_dispense_bill_id INTEGER REFERENCES tx_out_dispense_bills ON DELETE RESTRICT NOT NULL
);
CREATE INDEX cashbox_out_empty_idx ON cashbox_out_empties (tx_out_dispense_bill_id);

CREATE TABLE cashbox_out_fills (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id INTEGER REFERENCES users ON DELETE RESTRICT NOT NULL,
  cashbox_position INTEGER NOT NULL,
  fiat_code TEXT REFERENCES fiat_codes ON DELETE RESTRICT NOT NULL,
  fill_count INTEGER NOT NULL,
  denomination INTEGER NOT NULL,
  cashbox_out_empty_id INTEGER UNIQUE REFERENCES cashbox_out_empties ON DELETE RESTRICT NOT NULL
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

CREATE TABLE machine_certificates (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  certificate TEXT NOT NULL
);

CREATE TABLE machine_models (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  has_printer INTEGER NOT NULL,
  has_dispenser INTEGER NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE machines (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_timestamp TEXT,
  model_id INTEGER REFERENCES machine_models ON DELETE RESTRICT NOT NULL,
  certificate_id INTEGER UNIQUE REFERENCES machine_certificates ON DELETE RESTRICT,
  is_online INTEGER NOT NULL DEFAULT 1,
  dispenser_code TEXT REFERENCES dispensers ON DELETE RESTRICT NOT NULL,
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
CREATE TRIGGER machine_change_trg
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

CREATE TABLE term_conditions (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_timestamp TEXT NOT NULL,
  terms TEXT NOT NULL,
  language_code TEXT NOT NULL,
  user_id REFERENCES users ON DELETE RESTRICT NOT NULL
);

CREATE TABLE term_condition_changes (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL,
  terms TEXT NOT NULL,
  language_code TEXT NOT NULL,
  user_id REFERENCES users ON DELETE RESTRICT NOT NULL,
  term_condition_id REFERENCES term_conditions ON DELETE RESTRICT NOT NULL
);
CREATE TRIGGER term_condition_changes_trg
  UPDATE OF terms, language_code
  ON term_conditions
  BEGIN
    INSERT INTO term_condition_changes (timestamp, terms, language_code, user_id, term_condition_id)
    VALUES (OLD.timestamp, OLD.terms, OLD.language_code, OLD.user_id, OLD.id);
    UPDATE term_conditions SET update_timestamp=CURRENT_TIMESTAMP where id=NEW.id;
  END;

CREATE TABLE customers (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  customer_name TEXT,
  customer_phone TEXT,
  customer_document_code TEXT
);

CREATE TABLE customer_lookups (
  customer_id INTEGER REFERENCES customers ON DELETE RESTRICT NOT NULL,
  lookup_key TEXT NOT NULL,
  value TEXT NOT NULL,
  CHECK (lookup_key in ('customer_phone', 'customer_document_code', 'customer_name'))
);
CREATE INDEX customer_lookup_idx ON customer_lookups (value);

CREATE TABLE requirement_types (
  requirement_type TEXT PRIMARY KEY NOT NULL
);
INSERT INTO requirement_types VALUES
  ('customer_phone'), ('customer_data'), ('customer_photo'), ('customer_document'), ('blocked'), ('vetted');

CREATE TABLE customer_requirements (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_timestamp TEXT,
  requirement_type TEXT REFERENCES requirement_types ON DELETE RESTRICT NOT NULL,
  is_accepted INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  expires TEXT,
  user_id INTEGER REFERENCES users ON DELETE RESTRICT,
  customer_id INTEGER REFERENCES customers ON DELETE RESTRICT NOT NULL,
  customer_value TEXT,
  tx_id INTEGER REFERENCES txs ON DELETE RESTRICT NOT NULL
);
CREATE UNIQUE INDEX customer_requirement_idx
  ON customer_requirements (customer_id, requirement_type)
  WHERE is_active;
CREATE INDEX customer_requirement_timestamp_idx ON customer_requirements (customer_id, timestamp);

CREATE TABLE customer_requirement_changes (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL,
  requirement_type TEXT REFERENCES requirement_types ON DELETE RESTRICT NOT NULL,
  is_accepted INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  expires TEXT,
  user_id INTEGER REFERENCES users ON DELETE RESTRICT,
  customer_id INTEGER REFERENCES customers ON DELETE RESTRICT NOT NULL,
  customer_value TEXT,
  tx_id INTEGER REFERENCES txs ON DELETE RESTRICT NOT NULL,
  customer_requirement_id INTEGER REFERENCES customer_requirements ON DELETE RESTRICT NOT NULL
);
CREATE TRIGGER customer_requirement_changes_trg
  UPDATE OF is_accepted, is_active, expires, customer_value
  ON customer_requirements
  BEGIN
    INSERT INTO customer_requirement_changes
    (timestamp, requirement_type, is_accepted, is_active, expires, user_id,
      customer_value, customer_id, tx_id, customer_requirement_id)
    VALUES
    (OLD.timestamp, OLD.requirement_type, OLD.is_accepted, OLD.is_active, OLD.expires, OLD.user_id,
      OLD.customer_value, OLD.customer_id, OLD.tx_id, OLD.id);
    UPDATE customer_requirements SET update_timestamp=CURRENT_TIMESTAMP where id=NEW.id;
  END;

CREATE TABLE blacklist_addresses (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL,
  crypto_code TEXT REFERENCES crypto_codes ON DELETE RESTRICT NOT NULL,
  crypto_address TEXT NOT NULL,
  user_id INTEGER REFERENCES users ON DELETE RESTRICT
);
CREATE UNIQUE INDEX blacklist_address_idx ON blacklist_addresses (crypto_address, crypto_code);

CREATE TABLE configs (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL,
  user_id INTEGER REFERENCES users ON DELETE RESTRICT,
  config TEXT NOT NULL,
  is_valid INTEGER NOT NULL
);

CREATE TABLE machine_logs (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL,
  machine_timestamp TEXT,
  machine_id INTEGER REFERENCES machines ON DELETE RESTRICT NOT NULL,
  log_entry TEXT NOT NULL
);
CREATE INDEX machine_log_machine_timestamp_idx ON machine_logs (machine_timestamp DESC);

CREATE TABLE server_logs (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL,
  log_entry TEXT NOT NULL
);
CREATE INDEX server_log_timestamp_idx ON server_logs (timestamp DESC);

CREATE TABLE migrations (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL,
  last_migration_applied INTEGER NOT NULL
);

CREATE TABLE compliance_requirements (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL,
  requirement_type TEXT REFERENCES requirement_types ON DELETE RESTRICT NOT NULL,
  expiration_days INTEGER,
  tier_escalation_days INTEGER NOT NULL DEFAULT 0,
  is_manual INTEGER NOT NULL,
  user_id INTEGER REFERENCES users ON DELETE RESTRICT
);

CREATE TABLE compliance_triggers (
  id INTEGER PRIMARY KEY NOT NULL,
  timestamp TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  requirement_type TEXT REFERENCES requirement_types ON DELETE RESTRICT NOT NULL,
  fiat_code TEXT REFERENCES fiat_codes ON DELETE RESTRICT NOT NULL,
  fiat_threshold NUMERIC,
  day_threshold INTEGER,
  direction TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  user_id INTEGER REFERENCES users ON DELETE RESTRICT
);
CREATE INDEX compliance_triggers_idx ON compliance_triggers (is_active) WHERE is_active;
