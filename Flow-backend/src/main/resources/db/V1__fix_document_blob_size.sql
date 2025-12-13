-- Fix for "Data too long for column 'data'" error
-- Run this SQL command against your projectflow database to increase the BLOB size

ALTER TABLE project_documents MODIFY COLUMN data LONGBLOB;
