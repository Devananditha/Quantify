import json
import random
from datetime import datetime, timezone
from dateutil import parser
import psycopg2
from psycopg2.extras import execute_values

# Database connection parameters
DB_CONFIG = {
    "dbname": "postgres",
    "user": "postgres",
    "password": "postgres",
    "host": "localhost",
    "port": "5432"
}

def clean_timestamp(ts):
    """
    Cleans dirty, inconsistent timestamps and converts them into uniform UTC TIMESTAMPTZ values.
    """
    if ts is None:
        return None
        
    # Handle numeric timestamps (likely milliseconds or seconds)
    if isinstance(ts, (int, float)):
        # If the number is large, it's likely milliseconds (e.g., 1768265109000 -> Jan 2026)
        if ts > 1e11:
            dt = datetime.fromtimestamp(ts / 1000.0, tz=timezone.utc)
        else:
            dt = datetime.fromtimestamp(ts, tz=timezone.utc)
        return dt

    # Handle string timestamps
    if isinstance(ts, str):
        try:
            # Let dateutil handle various formats like ISO, "YYYY-MM-DD", "MM/DD/YYYY HH:MM:SS"
            dt = parser.parse(ts)
            
            # If the timestamp is naive (no timezone info), assume UTC
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            else:
                # Convert to UTC if it has a different timezone (e.g., +05:30)
                dt = dt.astimezone(timezone.utc)
            return dt
        except Exception as e:
            print(f"Error parsing timestamp {ts}: {e}")
            return None
            
    return None

def setup_schema(conn):
    """
    Creates the normalized schema (Users, Transactions, Rewards, Redemptions).
    """
    with conn.cursor() as cur:
        # Drop existing tables if they exist for clean seeding
        cur.execute("DROP TABLE IF EXISTS redemptions, rewards, transactions, users CASCADE;")
        
        # 1. Users Table
        cur.execute("""
            CREATE TABLE users (
                user_id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # 2. Transactions Table
        cur.execute("""
            CREATE TABLE transactions (
                txn_id VARCHAR(50) PRIMARY KEY,
                user_id INTEGER REFERENCES users(user_id),
                merchant VARCHAR(255),
                category VARCHAR(255),
                amount DECIMAL(15, 2),
                currency VARCHAR(10),
                status VARCHAR(50),
                payment_method VARCHAR(50),
                transaction_date TIMESTAMPTZ NOT NULL
            );
        """)
        
        # 3. Rewards Table
        cur.execute("""
            CREATE TABLE rewards (
                reward_id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(user_id),
                txn_id VARCHAR(50) REFERENCES transactions(txn_id),
                points_earned INTEGER NOT NULL,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # 4. Redemptions Table
        cur.execute("""
            CREATE TABLE redemptions (
                redemption_id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(user_id),
                reward_id INTEGER,
                points_redeemed INTEGER NOT NULL,
                redemption_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );
        """)
        conn.commit()

def seed_database(json_filepath):
    """
    Parses the JSON dataset, cleans data, generates mock linked data, and bulk inserts into PostgreSQL.
    """
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        print("Connected to PostgreSQL successfully.")
        
        setup_schema(conn)
        print("Schema created.")
        
        # 1. Generate & Insert Dummy Users
        num_users = 100
        users_data = [(f"User {i}", f"user{i}@example.com") for i in range(1, num_users + 1)]
        
        with conn.cursor() as cur:
            execute_values(
                cur,
                "INSERT INTO users (name, email) VALUES %s",
                users_data
            )
            conn.commit()
            print(f"Inserted {num_users} mock users.")
            
        # 2. Parse & Insert Transactions
        print(f"Reading {json_filepath}...")
        with open(json_filepath, 'r') as f:
            raw_transactions = json.load(f)
            
        txns_to_insert = []
        rewards_to_insert = []
        
        for txn in raw_transactions:
            # Clean timestamp
            clean_ts = clean_timestamp(txn.get('timestamp'))
            
            # Assign to a random user since original dataset lacks user_id
            assigned_user_id = random.randint(1, num_users)
            
            amount = float(txn.get('amount', 0))
            txn_id = txn.get('id')
            
            txns_to_insert.append((
                txn_id,
                assigned_user_id,
                txn.get('merchant'),
                txn.get('category'),
                amount,
                txn.get('currency'),
                txn.get('status'),
                txn.get('payment_method'),
                clean_ts
            ))
            
            # 3. Generate Mock Rewards based on successful transactions
            if txn.get('status') == 'SUCCESS' and amount > 100:
                points = int(amount // 100) # 1 point per 100 spent
                rewards_to_insert.append((
                    assigned_user_id,
                    txn_id,
                    points,
                    clean_ts # reward earned at the same time as txn
                ))

        with conn.cursor() as cur:
            # Bulk Insert Transactions
            execute_values(
                cur,
                """
                INSERT INTO transactions (
                    txn_id, user_id, merchant, category, amount, currency, status, payment_method, transaction_date
                ) VALUES %s
                ON CONFLICT (txn_id) DO NOTHING
                """,
                txns_to_insert
            )
            print(f"Inserted {len(txns_to_insert)} transactions.")
            
            # Bulk Insert Rewards
            execute_values(
                cur,
                """
                INSERT INTO rewards (
                    user_id, txn_id, points_earned, created_at
                ) VALUES %s
                """,
                rewards_to_insert
            )
            print(f"Inserted {len(rewards_to_insert)} rewards.")
            
            # 4. Generate & Insert Mock Redemptions
            # (Removed: The user wants a clean slate to test claiming vouchers manually)
            print("Skipped inserting mock redemptions for a clean slate.")
            
            conn.commit()
            print("Database seeded successfully!")
            
    except Exception as e:
        print(f"Database error: {e}")
    finally:
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == "__main__":
    import sys
    # Path to the JSON dataset
    filepath = "transactions.json"
    if len(sys.argv) > 1:
        filepath = sys.argv[1]
    
    seed_database(filepath)
