CREATE TABLE `registros_sensores` (
  `mediciones` json NOT NULL,
  CONSTRAINT `chk_json_validado` CHECK (
    json_type(json_extract(`mediciones`, '$.fecha')) = 'STRING' AND
    json_type(json_extract(`mediciones`, '$.gases')) IN ('INTEGER', 'DOUBLE') AND
    json_type(json_extract(`mediciones`, '$.temperatura')) IN ('INTEGER', 'DOUBLE') AND
    json_type(json_extract(`mediciones`, '$.humedad')) IN ('INTEGER', 'DOUBLE') AND
    json_type(json_extract(`mediciones`, '$.presion')) IN ('INTEGER', 'DOUBLE') AND
    json_type(json_extract(`mediciones`, '$.polvoPorMetroCubico')) IN ('INTEGER', 'DOUBLE') AND
    (json_extract(`mediciones`, '$.gases')) >= 0 AND
    (json_extract(`mediciones`, '$.humedad')) BETWEEN 0 AND 100 AND
    (json_extract(`mediciones`, '$.presion')) BETWEEN 0 AND 4095 AND
    (json_extract(`mediciones`, '$.polvoPorMetroCubico')) BETWEEN 0 AND 10000
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;