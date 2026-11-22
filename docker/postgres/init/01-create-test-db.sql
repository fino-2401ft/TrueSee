-- Runs once, on first start of an empty data volume, as POSTGRES_USER.
-- Creates the database used by automated backend tests; the owner defaults to POSTGRES_USER.
CREATE DATABASE truesee_test;
