"""SQLite 初期化スクリプト。`python scripts/init_db.py` でテーブル作成。"""

from app.db.session import init_db


def main() -> None:
    init_db()
    print("Database initialized.")


if __name__ == "__main__":
    main()
