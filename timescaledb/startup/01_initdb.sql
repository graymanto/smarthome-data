\set gf_user `echo "$SHDC_GFUSER"`
\set gf_pwd `echo "$SHDC_GFPASSWORD"`
\set md_user `echo "$SHDC_DBUSER"`
\set md_pwd `echo "$SHDC_DBPASSWORD"`
\set pg_pwd `echo "$SHDC_PGPASSWORD"`

ALTER USER postgres WITH PASSWORD :'pg_pwd';
CREATE USER :gf_user WITH PASSWORD :'gf_pwd';
CREATE USER :md_user WITH PASSWORD :'md_pwd';

CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
CREATE DATABASE grafana;

GRANT CONNECT ON DATABASE smarthome_data TO :gf_user;
GRANT CONNECT ON DATABASE smarthome_data TO :md_user;
GRANT CONNECT ON DATABASE grafana TO :gf_user;
GRANT USAGE ON SCHEMA PUBLIC TO :gf_user;
GRANT USAGE ON SCHEMA PUBLIC TO :md_user;
GRANT ALL PRIVILEGES ON DATABASE grafana TO :gf_user;

\c smarthome_data;

CREATE TABLE metric_table_indexed (
	  time    TIMESTAMPTZ       NOT NULL,
	  name    TEXT              NOT NULL,
	  index1  SMALLINT  NOT NULL,
	  index2  SMALLINT,
	  index3  SMALLINT,
	  value   DOUBLE PRECISION NOT NULL
);

CREATE TABLE metric_table_general (
	  time    TIMESTAMPTZ       NOT NULL,
	  name    TEXT              NOT NULL,
	  value   DOUBLE PRECISION  NULL
);

SELECT create_hypertable('metric_table_indexed', 'time');
SELECT create_hypertable('metric_table_general', 'time');

GRANT SELECT ON metric_table_indexed TO :gf_user;
GRANT INSERT ON metric_table_indexed TO :md_user;
GRANT SELECT ON metric_table_indexed TO :md_user;
GRANT SELECT ON metric_table_general TO :gf_user;
GRANT INSERT ON metric_table_general TO :md_user;
GRANT SELECT ON metric_table_general TO :md_user;
