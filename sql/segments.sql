-- This script collects segments of midi messages within a time window

WITH messagesInWindow AS ( SELECT *,
           ROW_NUMBER() OVER (ORDER BY timestamp) AS ascOrder,
           ROW_NUMBER() OVER (ORDER BY timestamp DESC) AS descOrder,
           LEAD(id, 1, 0) OVER (ORDER BY timestamp) AS nextId,
           LEAD(timestamp, 1, 0) OVER (ORDER BY timestamp) AS nextTimestamp,
           LEAD(timestamp, 1, 0) OVER (ORDER BY timestamp) - timestamp AS msTillNext

    FROM messages

--     WHERE datetime(timestamp/1000, 'unixepoch') >= '2024-01-07 00:00:00'
--       AND datetime(timestamp/1000, 'unixepoch') <  '2024-01-08 00:00:00'
    WHERE datetime(timestamp/1000, 'unixepoch') >= datetime(?/1000, 'unixepoch') -- binding #1 - start
      AND datetime(timestamp/1000, 'unixepoch') <  datetime(?/1000, 'unixepoch') -- binding #2 - end
),
firstLastAndGaps AS
(
    SELECT *
    FROM messagesInWindow
--     WHERE messagesInWindow.msTillNext > 10000 -- 10 second gaps
    WHERE messagesInWindow.msTillNext > ? -- binding #3 - gapSize
    OR messagesInWindow.ascOrder = 1
    OR messagesInWindow.descOrder = 1
    ORDER BY messagesInWindow.timestamp
),
segments AS (
    SELECT * FROM (
        SELECT
            CASE
                WHEN ascOrder = 1 THEN id
                ELSE nextId
                END AS segStartId,
            CASE
                WHEN ascOrder = 1 THEN timestamp
                ELSE nextTimestamp
                END AS segStartTimestamp,
            LEAD(id, 1, 0) OVER (ORDER BY timestamp) AS segEndId,
            LEAD(timestamp, 1, 0) OVER (ORDER BY timestamp) AS segEndTimestamp

        FROM firstLastAndGaps
    )
    WHERE segStartId <> 0 -- get rid of last row caused by LEADs
)

SELECT *,
        segEndTimestamp - segStartTimestamp AS segDuration,
        (
            SELECT COUNT(*)
            FROM messagesInWindow
            WHERE messagesInWindow.timestamp >= segments.segStartTimestamp
                AND messagesInWindow.timestamp <= segments.segEndTimestamp
                AND messagesInWindow.byte1 >= 144
                AND messagesInWindow.byte1 <= 159 -- "NOTE ON" messages
        ) AS keystrokes
FROM segments
