-- Diseño base para jornadas, actas y trazabilidad de premios.
-- Se ejecutará cuando se implemente el módulo Reportes y Actas.

CREATE TABLE IF NOT EXISTS bingo_sessions (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  local_id uuid NOT NULL REFERENCES locals(id) ON DELETE RESTRICT,
  business_date date NOT NULL,
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz NULL,
  status text NOT NULL DEFAULT 'ABIERTA',
  opened_by uuid NULL REFERENCES users(id) ON DELETE SET NULL,
  closed_by uuid NULL REFERENCES users(id) ON DELETE SET NULL,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (closed_at IS NULL OR closed_at >= opened_at),
  CHECK (status IN ('ABIERTA', 'CERRADA', 'ANULADA'))
);

ALTER TABLE bingo_games ADD COLUMN IF NOT EXISTS session_id uuid NULL REFERENCES bingo_sessions(id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS bingo_sessions_local_date_idx ON bingo_sessions(local_id, business_date);
CREATE INDEX IF NOT EXISTS bingo_games_session_idx ON bingo_games(session_id);

-- Una venta representa una operación; sus cartones concretos quedan trazables.
CREATE TABLE IF NOT EXISTS bingo_sale_cards (
  sale_id uuid NOT NULL REFERENCES bingo_sales(id) ON DELETE CASCADE,
  game_id uuid NOT NULL REFERENCES bingo_games(id) ON DELETE RESTRICT,
  card_number integer NOT NULL,
  customer_id uuid NULL REFERENCES customers(id) ON DELETE SET NULL,
  customer_document text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (sale_id, card_number),
  UNIQUE (game_id, card_number)
);

CREATE INDEX IF NOT EXISTS bingo_sale_cards_customer_idx ON bingo_sale_cards(customer_id, created_at);
CREATE INDEX IF NOT EXISTS bingo_sale_cards_document_idx ON bingo_sale_cards(customer_document, created_at);

-- Cada extracción conserva orden y hora, no solamente el arreglo JSON actual.
CREATE TABLE IF NOT EXISTS bingo_draw_events (
  id uuid PRIMARY KEY,
  game_id uuid NOT NULL REFERENCES bingo_games(id) ON DELETE CASCADE,
  sequence_number integer NOT NULL,
  ball_number integer NOT NULL,
  extracted_at timestamptz NOT NULL DEFAULT now(),
  extracted_by uuid NULL REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE (game_id, sequence_number),
  UNIQUE (game_id, ball_number),
  CHECK (ball_number BETWEEN 1 AND 90)
);

CREATE TABLE IF NOT EXISTS bingo_prizes (
  id uuid PRIMARY KEY,
  game_id uuid NOT NULL REFERENCES bingo_games(id) ON DELETE CASCADE,
  prize_type text NOT NULL,
  amount numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'DETECTADO',
  winning_ball_sequence integer NULL,
  detected_at timestamptz NULL,
  confirmed_at timestamptz NULL,
  paid_at timestamptz NULL,
  notes text NULL,
  UNIQUE (game_id, prize_type),
  CHECK (prize_type IN ('LINEA', 'BINGO')),
  CHECK (status IN ('DETECTADO', 'CONFIRMADO', 'PAGADO', 'ANULADO'))
);

CREATE TABLE IF NOT EXISTS bingo_prize_winners (
  prize_id uuid NOT NULL REFERENCES bingo_prizes(id) ON DELETE CASCADE,
  winner_order integer NOT NULL,
  card_number integer NOT NULL,
  customer_id uuid NULL REFERENCES customers(id) ON DELETE SET NULL,
  customer_document text NULL,
  winning_numbers jsonb NOT NULL DEFAULT '[]'::jsonb,
  winning_row integer NULL,
  PRIMARY KEY (prize_id, card_number),
  UNIQUE (prize_id, winner_order)
);

CREATE INDEX IF NOT EXISTS bingo_prize_winners_customer_idx ON bingo_prize_winners(customer_id);

CREATE TABLE IF NOT EXISTS bingo_session_reports (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL UNIQUE REFERENCES bingo_sessions(id) ON DELETE RESTRICT,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  local_id uuid NOT NULL REFERENCES locals(id) ON DELETE RESTRICT,
  generated_at timestamptz NOT NULL DEFAULT now(),
  generated_by uuid NULL REFERENCES users(id) ON DELETE SET NULL,
  closed_at timestamptz NOT NULL,
  games_count integer NOT NULL DEFAULT 0,
  cards_sold integer NOT NULL DEFAULT 0,
  sales_total numeric(14,2) NOT NULL DEFAULT 0,
  prizes_total numeric(14,2) NOT NULL DEFAULT 0,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS bingo_session_reports_org_local_idx ON bingo_session_reports(organization_id, local_id, closed_at);
