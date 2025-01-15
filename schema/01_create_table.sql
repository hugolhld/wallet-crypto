CREATE TABLE IF NOT EXISTS role (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS "user" (
    id SERIAL PRIMARY KEY,
    role_id INT REFERENCES role(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    confirmed_token TEXT,
    is_confirmed BOOLEAN DEFAULT FALSE,
    failed_attempts INT DEFAULT 0,
    locked_until TIMESTAMP DEFAULT NULL,
    favorite_currency VARCHAR(10) DEFAULT "USD"
);

CREATE TABLE IF NOT EXISTS pricing (
    id SERIAL PRIMARY KEY,
    address VARCHAR(42) NOT NULL,
    date DATE NOT NULL,
    transaction_hash TEXT NOT NULL,
    value_eth NUMERIC NOT NULL,
    price_in_currency NUMERIC,
    value_in_currency NUMERIC,
    currency VARCHAR(10) DEFAULT 'USD',
    cumulative_balance NUMERIC
);

CREATE TABLE IF NOT EXISTS wallets (
    id SERIAL PRIMARY KEY,
    wallet TEXT NOT NULL,
    user_id INT REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS refresh (
    id SERIAL PRIMARY KEY,
    expiredAt TIMESTAMP NOT NULL,
    token TEXT NOT NULL,
    user_id INT REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    token VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL
);
