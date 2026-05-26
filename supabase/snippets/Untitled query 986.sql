INSERT INTO platform_config (key, value)
VALUES ('coin_earn_text_submission', '10')
ON CONFLICT (key) DO UPDATE SET value = '10';