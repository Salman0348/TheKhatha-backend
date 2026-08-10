const { dbQuery } = require("../utils/db");

/**
 * Get all features required for individual
 * current-month expense forecasting.
 *
 * One logged-in user + one selected group.
 *
 * User expense responsibility for each entry:
 *
 *     entry.amount / number_of_participants
 *
 * @param {number} userId
 * @param {number} groupId
 * @returns {Promise<object|null>}
 */
const getForecastFeatures = async (userId, groupId) => {
  const sql = `
    WITH

    /* =====================================================
      0. USER BUDGET

      Budget is stored per user per group
   ===================================================== */

    user_budget AS (

    SELECT
      budget

    FROM member

    WHERE user_id = ?
      AND group_id = ?

    ),

    /* =====================================================
       1. USER ENTRIES

       Get all entries in the selected group where the
       selected user is a participant.

       user_share =
       entry amount / total number of participants
       ===================================================== */

    user_entries AS (
      SELECT
        e.id AS entry_id,
        e.amount,
        e.category,
        e.created_at,

        e.amount / participant_counts.participant_count
          AS user_share

      FROM entry e

      INNER JOIN entry_participant ep
        ON ep.entry_id = e.id

      INNER JOIN member m
        ON m.id = ep.member_id

      INNER JOIN (
        SELECT
          entry_id,
          COUNT(*) AS participant_count
        FROM entry_participant
        GROUP BY entry_id
      ) participant_counts
        ON participant_counts.entry_id = e.id

      WHERE m.user_id = ?
        AND m.group_id = ?
    ),


    /* =====================================================
       2. CURRENT MONTH FEATURES
       ===================================================== */

    current_month_features AS (
      SELECT

        /* Current month total spending */

        COALESCE(
          SUM(
            CASE
              WHEN created_at >= DATE_FORMAT(
                UTC_TIMESTAMP(),
                '%Y-%m-01'
              )
              THEN user_share
              ELSE 0
            END
          ),
          0
        ) AS current_month_spending,


        /* Current month entry count */

        COALESCE(
          SUM(
            CASE
              WHEN created_at >= DATE_FORMAT(
                UTC_TIMESTAMP(),
                '%Y-%m-01'
              )
              THEN 1
              ELSE 0
            END
          ),
          0
        ) AS current_month_entry_count,


        /* Previous month entry count */

        COALESCE(
          SUM(
            CASE
              WHEN created_at >= DATE_FORMAT(
                DATE_SUB(
                  UTC_TIMESTAMP(),
                  INTERVAL 1 MONTH
                ),
                '%Y-%m-01'
              )
              AND created_at < DATE_FORMAT(
                UTC_TIMESTAMP(),
                '%Y-%m-01'
              )
              THEN 1
              ELSE 0
            END
          ),
          0
        ) AS previous_month_entry_count,


        /* Current month spending velocity */

        COALESCE(
          SUM(
            CASE
              WHEN created_at >= DATE_FORMAT(
                UTC_TIMESTAMP(),
                '%Y-%m-01'
              )
              THEN user_share
              ELSE 0
            END
          )
          / NULLIF(
              DAY(UTC_TIMESTAMP()),
              0
            ),
          0
        ) AS spending_velocity,


        /* =================================================
           CURRENT MONTH CATEGORY SPENDING
           ================================================= */

        COALESCE(
          SUM(
            CASE
              WHEN category = 'Food & Dining'
              AND created_at >= DATE_FORMAT(
                UTC_TIMESTAMP(),
                '%Y-%m-01'
              )
              THEN user_share
              ELSE 0
            END
          ),
          0
        ) AS current_food_dining,


        COALESCE(
          SUM(
            CASE
              WHEN category = 'Transportation'
              AND created_at >= DATE_FORMAT(
                UTC_TIMESTAMP(),
                '%Y-%m-01'
              )
              THEN user_share
              ELSE 0
            END
          ),
          0
        ) AS current_transportation,


        COALESCE(
          SUM(
            CASE
              WHEN category = 'Shopping'
              AND created_at >= DATE_FORMAT(
                UTC_TIMESTAMP(),
                '%Y-%m-01'
              )
              THEN user_share
              ELSE 0
            END
          ),
          0
        ) AS current_shopping,


        COALESCE(
          SUM(
            CASE
              WHEN category = 'Groceries'
              AND created_at >= DATE_FORMAT(
                UTC_TIMESTAMP(),
                '%Y-%m-01'
              )
              THEN user_share
              ELSE 0
            END
          ),
          0
        ) AS current_groceries,


        COALESCE(
          SUM(
            CASE
              WHEN category = 'Bills & Utilities'
              AND created_at >= DATE_FORMAT(
                UTC_TIMESTAMP(),
                '%Y-%m-01'
              )
              THEN user_share
              ELSE 0
            END
          ),
          0
        ) AS current_bills_utilities,


        COALESCE(
          SUM(
            CASE
              WHEN category = 'Healthcare'
              AND created_at >= DATE_FORMAT(
                UTC_TIMESTAMP(),
                '%Y-%m-01'
              )
              THEN user_share
              ELSE 0
            END
          ),
          0
        ) AS current_healthcare,


        COALESCE(
          SUM(
            CASE
              WHEN category = 'Entertainment'
              AND created_at >= DATE_FORMAT(
                UTC_TIMESTAMP(),
                '%Y-%m-01'
              )
              THEN user_share
              ELSE 0
            END
          ),
          0
        ) AS current_entertainment,


        COALESCE(
          SUM(
            CASE
              WHEN category = 'Education'
              AND created_at >= DATE_FORMAT(
                UTC_TIMESTAMP(),
                '%Y-%m-01'
              )
              THEN user_share
              ELSE 0
            END
          ),
          0
        ) AS current_education,


        COALESCE(
          SUM(
            CASE
              WHEN category = 'Travel'
              AND created_at >= DATE_FORMAT(
                UTC_TIMESTAMP(),
                '%Y-%m-01'
              )
              THEN user_share
              ELSE 0
            END
          ),
          0
        ) AS current_travel,


        COALESCE(
          SUM(
            CASE
              WHEN category = 'Miscellaneous'
              AND created_at >= DATE_FORMAT(
                UTC_TIMESTAMP(),
                '%Y-%m-01'
              )
              THEN user_share
              ELSE 0
            END
          ),
          0
        ) AS current_miscellaneous

      FROM user_entries
    ),


    /* =====================================================
       3. MONTHLY HISTORY

       Calculate the total for each of the previous
       three COMPLETE months.

       month_offset:

       0 = previous month
       1 = second-last month
       2 = third-last month
       ===================================================== */

    monthly_history AS (

      SELECT
        0 AS month_offset,

        COALESCE(
          SUM(user_share),
          0
        ) AS monthly_spending

      FROM user_entries

      WHERE created_at >= DATE_FORMAT(
        DATE_SUB(
          UTC_TIMESTAMP(),
          INTERVAL 1 MONTH
        ),
        '%Y-%m-01'
      )

      AND created_at < DATE_FORMAT(
        UTC_TIMESTAMP(),
        '%Y-%m-01'
      )


      UNION ALL


      SELECT
        1 AS month_offset,

        COALESCE(
          SUM(user_share),
          0
        ) AS monthly_spending

      FROM user_entries

      WHERE created_at >= DATE_FORMAT(
        DATE_SUB(
          UTC_TIMESTAMP(),
          INTERVAL 2 MONTH
        ),
        '%Y-%m-01'
      )

      AND created_at < DATE_FORMAT(
        DATE_SUB(
          UTC_TIMESTAMP(),
          INTERVAL 1 MONTH
        ),
        '%Y-%m-01'
      )


      UNION ALL


      SELECT
        2 AS month_offset,

        COALESCE(
          SUM(user_share),
          0
        ) AS monthly_spending

      FROM user_entries

      WHERE created_at >= DATE_FORMAT(
        DATE_SUB(
          UTC_TIMESTAMP(),
          INTERVAL 3 MONTH
        ),
        '%Y-%m-01'
      )

      AND created_at < DATE_FORMAT(
        DATE_SUB(
          UTC_TIMESTAMP(),
          INTERVAL 2 MONTH
        ),
        '%Y-%m-01'
      )
    ),


    /* =====================================================
       4. HISTORICAL FEATURES

       Calculate the average of the THREE MONTHLY TOTALS.

       This correctly includes months with zero spending.
       ===================================================== */

    historical_features AS (
      SELECT

        MAX(
          CASE
            WHEN month_offset = 0
            THEN monthly_spending
          END
        ) AS previous_month_spending,


        MAX(
          CASE
            WHEN month_offset = 1
            THEN monthly_spending
          END
        ) AS second_last_month_spending,


        MAX(
          CASE
            WHEN month_offset = 2
            THEN monthly_spending
          END
        ) AS third_last_month_spending,


        AVG(monthly_spending)
          AS average_last_3_months

      FROM monthly_history
    )


    ,

/* =====================================================
   5. PREVIOUS MONTH VELOCITY

   Spending rate of last complete month

   Formula:
   previous month spending / days in previous month

   Used for Behavioral Advisor:
   "Your spending rate increased"
   ===================================================== */

previous_month_velocity AS (

  SELECT

    monthly_spending /

    DAY(
      LAST_DAY(
        DATE_SUB(
          UTC_TIMESTAMP(),
          INTERVAL 1 MONTH
        )
      )
    )

    AS previous_month_velocity


  FROM monthly_history

  WHERE month_offset = 0

)

    /* =====================================================
       6. FINAL RESULT

       Both CTEs contain exactly ONE ROW.

       Therefore there is no GROUP BY issue.
       ===================================================== */

    SELECT

      /* Current month */

      cm.current_month_spending,

      cm.current_month_entry_count,

      /* Historical */

      hf.previous_month_spending,

      cm.previous_month_entry_count,

      hf.second_last_month_spending,

      hf.third_last_month_spending,

      hf.average_last_3_months,

      /* Time */

      DAY(UTC_TIMESTAMP())
        AS days_elapsed,

      DAY(
        LAST_DAY(UTC_TIMESTAMP())
      )
        AS days_in_month,

      DAY(
        LAST_DAY(UTC_TIMESTAMP())
      )
      -
      DAY(UTC_TIMESTAMP())
        AS days_remaining,

      /* Velocity */

      cm.spending_velocity,

      pmv.previous_month_velocity,

      /* Budget */

      ub.budget,

      /* Categories */

      cm.current_food_dining,

      cm.current_transportation,

      cm.current_shopping,

      cm.current_groceries,

      cm.current_bills_utilities,

      cm.current_healthcare,

      cm.current_entertainment,

      cm.current_education,

      cm.current_travel,

      cm.current_miscellaneous

    FROM current_month_features cm

    CROSS JOIN historical_features hf

    CROSS JOIN previous_month_velocity pmv

    CROSS JOIN user_budget ub;
  `;

  const result = await dbQuery(sql, [userId, groupId, userId, groupId]);

  const features = result[0];

  //   converting all values to numbers to ensure consistent data types in the response
  return {
    current_month_spending: Number(features.current_month_spending),

    current_month_entry_count: Number(features.current_month_entry_count),

    previous_month_spending: Number(features.previous_month_spending),

    previous_month_entry_count: Number(features.previous_month_entry_count),

    second_last_month_spending: Number(features.second_last_month_spending),

    third_last_month_spending: Number(features.third_last_month_spending),

    average_last_3_months: Number(features.average_last_3_months),

    days_elapsed: Number(features.days_elapsed),

    days_in_month: Number(features.days_in_month),

    days_remaining: Number(features.days_remaining),

    spending_velocity: Number(features.spending_velocity),

    current_food_dining: Number(features.current_food_dining),

    current_transportation: Number(features.current_transportation),

    current_shopping: Number(features.current_shopping),

    current_groceries: Number(features.current_groceries),

    current_bills_utilities: Number(features.current_bills_utilities),

    current_healthcare: Number(features.current_healthcare),

    current_entertainment: Number(features.current_entertainment),

    current_education: Number(features.current_education),

    current_travel: Number(features.current_travel),

    current_miscellaneous: Number(features.current_miscellaneous),
    budget: features.budget !== null ? Number(features.budget) : null,

    previous_month_velocity: Number(features.previous_month_velocity),
  };
};

module.exports = {
  getForecastFeatures,
};
