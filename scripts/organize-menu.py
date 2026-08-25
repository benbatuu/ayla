#!/usr/bin/env python3
"""Organize Ayla menu data: featured dishes, RU categories/items, descriptions."""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path

DB = Path(__file__).resolve().parents[1] / "prisma" / "dev.db"

# Local cutouts for homepage signature dishes (order matters)
SIGNATURE = [
    {
        "tr_name": "Acılı Ezme",
        "en_name": "Spicy Ezme",
        "ru_name": "Острая эзме",
        "image": "/acili-ezme-ayla.png",
        "tr_desc": "Domates, biber ve baharatlarla taze hazırlanan klasik acılı ezme; çıtır lavaş ve nane ile.",
        "en_desc": "Freshly chopped tomatoes, peppers and spices; served with crisp lavash and mint.",
        "ru_desc": "Свежие помидоры, перец и специи; подаётся с хрустящим лавашем и мятой.",
        "sort": 1,
    },
    {
        "tr_name": "Kalem Kuzu Pirzola",
        "en_name": "Lamb Cutlets",
        "ru_name": "Каре ягнёнка",
        "image": "/kalem-kuzu-pirzola-ayla.png",
        "tr_desc": "Izgara kalem kuzu pirzola; köz sebze, soğan salatası ve özel sos ile servis edilir.",
        "en_desc": "Grilled lamb cutlets with roasted vegetables, onion salad and house sauce.",
        "ru_desc": "Ягнёнок на гриле с овощами, салатом из лука и фирменным соусом.",
        "sort": 2,
    },
    {
        "tr_name": "Mantar Soslu Steak",
        "en_name": "Steak with Mushroom Sauce",
        "ru_name": "Стейк с грибным соусом",
        "image": "/mantar-soslu-steak-ayla.png",
        "tr_desc": "Kremalı mantar sosu, köz domates ve dill ile tamamlanan steak; Ay'la imzası.",
        "en_desc": "Steak finished with creamy mushroom sauce, roasted cherry tomatoes and dill.",
        "ru_desc": "Стейк с кремовым грибным соусом, томатами черри и укропом.",
        "sort": 3,
    },
    {
        "tr_name": "Kuzu Lokum",
        "en_name": "Lamb Lokum",
        "ru_name": "Ягнёнок локум",
        "image": "/kuzu-lokum-ayla.png",
        "tr_desc": "Yumuşak kuzu lokum; lavash üzerinde, köz sebze ve sos ile sunulur.",
        "en_desc": "Tender lamb lokum on lavash, with roasted vegetables and dipping sauce.",
        "ru_desc": "Нежный ягнёнок локум на лаваше с овощами и соусом.",
        "sort": 4,
    },
]

CATEGORY_RU = {
    "KAHVALTILAR": "Завтраки",
    "KAHVALTI": "Завтрак",
    "APARATİF": "Закуски",
    "BOWL": "Боулы",
    "OMLET": "Омлет",
    "SALATA": "Салат",
    "KRUVASAN": "Круассан",
    "SANDVİÇ": "Сэндвич",
    "BURGER": "Бургеры",
    "MEZELER": "Мезе",
    "SALATALAR": "Салаты",
    "ARA SICAK": "Горячие закуски",
    "ANA YEMEK": "Основные блюда",
    "MEYVELER": "Фрукты",
    "TATLI": "Десерты",
    "SICAK İÇECEKLER": "Горячие напитки",
    "SOFT İÇECEKLER": "Безалкогольные напитки",
    "SOĞUK İÇECEKLER": "Холодные напитки",
    "KOKTEYL": "Коктейли",
    "BİRALAR": "Пиво",
    "VODKALAR": "Водка",
    "RAKILAR": "Раки",
    "CİN": "Джин",
    "VİSKİLER": "Виски",
}

CATEGORY_EN_FIX = {
    "BURGER": "Burgers",
}


def cuid() -> str:
    import secrets
    import time

    return "c" + format(int(time.time() * 1000), "x") + secrets.token_hex(6)


def main() -> None:
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    cur = con.cursor()

    # Reset featured flags
    cur.execute("UPDATE MenuItem SET isFeatured = 0")

    for dish in SIGNATURE:
        row = cur.execute(
            """
            SELECT mi.id FROM MenuItem mi
            JOIN MenuItemTranslation mit ON mit.menuItemId = mi.id AND mit.locale = 'tr'
            WHERE mit.name = ?
            LIMIT 1
            """,
            (dish["tr_name"],),
        ).fetchone()
        if not row:
            print("MISSING", dish["tr_name"])
            continue

        item_id = row["id"]
        cur.execute(
            """
            UPDATE MenuItem
            SET isFeatured = 1, imageUrl = ?, sortOrder = ?, published = 1
            WHERE id = ?
            """,
            (dish["image"], dish["sort"], item_id),
        )

        # TR / EN descriptions + EN name polish
        for locale, name, desc in (
            ("tr", dish["tr_name"], dish["tr_desc"]),
            ("en", dish["en_name"], dish["en_desc"]),
            ("ru", dish["ru_name"], dish["ru_desc"]),
        ):
            existing = cur.execute(
                "SELECT id FROM MenuItemTranslation WHERE menuItemId=? AND locale=?",
                (item_id, locale),
            ).fetchone()
            cat = cur.execute(
                """
                SELECT COALESCE(
                  (SELECT name FROM MenuCategoryTranslation WHERE categoryId = mi.categoryId AND locale = ?),
                  (SELECT name FROM MenuCategoryTranslation WHERE categoryId = mi.categoryId AND locale = 'tr')
                ) AS cat
                FROM MenuItem mi WHERE mi.id = ?
                """,
                (locale if locale != "ru" else "en", item_id),
            ).fetchone()
            category_label = cat["cat"] if cat else ""
            if locale == "ru":
                # Prefer RU category name if present
                ru_cat = cur.execute(
                    """
                    SELECT mct.name FROM MenuItem mi
                    JOIN MenuCategoryTranslation mct ON mct.categoryId = mi.categoryId AND mct.locale = 'ru'
                    WHERE mi.id = ?
                    """,
                    (item_id,),
                ).fetchone()
                if ru_cat:
                    category_label = ru_cat["name"]

            if existing:
                cur.execute(
                    """
                    UPDATE MenuItemTranslation
                    SET name = ?, description = ?, category = ?
                    WHERE menuItemId = ? AND locale = ?
                    """,
                    (name, desc, category_label, item_id, locale),
                )
            else:
                cur.execute(
                    """
                    INSERT INTO MenuItemTranslation (id, menuItemId, locale, category, name, description, ingredients)
                    VALUES (?, ?, ?, ?, ?, ?, '')
                    """,
                    (cuid(), item_id, locale, category_label, name, desc),
                )
        print("featured", dish["tr_name"])

    # Category RU + EN fixes
    cats = cur.execute(
        """
        SELECT c.id, ct.name AS tr_name
        FROM MenuCategory c
        JOIN MenuCategoryTranslation ct ON ct.categoryId = c.id AND ct.locale = 'tr'
        """
    ).fetchall()

    for cat in cats:
        tr_name = cat["tr_name"]
        en_fix = CATEGORY_EN_FIX.get(tr_name)
        if en_fix:
            cur.execute(
                """
                UPDATE MenuCategoryTranslation SET name = ?
                WHERE categoryId = ? AND locale = 'en'
                """,
                (en_fix, cat["id"]),
            )

        ru_name = CATEGORY_RU.get(tr_name)
        if not ru_name:
            print("no RU map for category", tr_name)
            continue
        existing = cur.execute(
            "SELECT id FROM MenuCategoryTranslation WHERE categoryId=? AND locale='ru'",
            (cat["id"],),
        ).fetchone()
        if existing:
            cur.execute(
                "UPDATE MenuCategoryTranslation SET name=? WHERE categoryId=? AND locale='ru'",
                (ru_name, cat["id"]),
            )
        else:
            cur.execute(
                """
                INSERT INTO MenuCategoryTranslation (id, categoryId, locale, name)
                VALUES (?, ?, 'ru', ?)
                """,
                (cuid(), cat["id"], ru_name),
            )

    # Ensure every item has a RU translation (fallback to EN/TR name for catalog completeness)
    items = cur.execute(
        """
        SELECT mi.id,
          (SELECT name FROM MenuItemTranslation WHERE menuItemId=mi.id AND locale='tr') AS tr_name,
          (SELECT name FROM MenuItemTranslation WHERE menuItemId=mi.id AND locale='en') AS en_name,
          (SELECT description FROM MenuItemTranslation WHERE menuItemId=mi.id AND locale='en') AS en_desc,
          (SELECT category FROM MenuItemTranslation WHERE menuItemId=mi.id AND locale='en') AS en_cat,
          (SELECT name FROM MenuCategoryTranslation WHERE categoryId=mi.categoryId AND locale='ru') AS ru_cat
        FROM MenuItem mi
        """
    ).fetchall()

    added_ru = 0
    for item in items:
        has_ru = cur.execute(
            "SELECT 1 FROM MenuItemTranslation WHERE menuItemId=? AND locale='ru'",
            (item["id"],),
        ).fetchone()
        if has_ru:
            continue
        name = item["en_name"] or item["tr_name"] or "Item"
        cur.execute(
            """
            INSERT INTO MenuItemTranslation (id, menuItemId, locale, category, name, description, ingredients)
            VALUES (?, ?, 'ru', ?, ?, ?, '')
            """,
            (
                cuid(),
                item["id"],
                item["ru_cat"] or item["en_cat"] or "",
                name,
                item["en_desc"] or "",
            ),
        )
        added_ru += 1

    # Sync MessageBundle menu.dishes with signature copy
    dishes_by_locale = {
        "tr": [
            {
                "category": "Başlangıç",
                "name": d["tr_name"],
                "description": d["tr_desc"],
            }
            for d in SIGNATURE
        ],
        "en": [
            {
                "category": "Starter" if i == 0 else "Main Course",
                "name": d["en_name"],
                "description": d["en_desc"],
            }
            for i, d in enumerate(SIGNATURE)
        ],
        "ru": [
            {
                "category": "Закуска" if i == 0 else "Основное блюдо",
                "name": d["ru_name"],
                "description": d["ru_desc"],
            }
            for i, d in enumerate(SIGNATURE)
        ],
    }

    for locale, dishes in dishes_by_locale.items():
        row = cur.execute(
            "SELECT data FROM MessageBundle WHERE locale=?", (locale,)
        ).fetchone()
        if not row:
            continue
        data = json.loads(row["data"])
        data.setdefault("menu", {})["dishes"] = dishes
        cur.execute(
            "UPDATE MessageBundle SET data=? WHERE locale=?",
            (json.dumps(data, ensure_ascii=False), locale),
        )

    con.commit()
    featured = cur.execute(
        "SELECT COUNT(*) FROM MenuItem WHERE isFeatured=1"
    ).fetchone()[0]
    ru_cats = cur.execute(
        "SELECT COUNT(*) FROM MenuCategoryTranslation WHERE locale='ru'"
    ).fetchone()[0]
    ru_items = cur.execute(
        "SELECT COUNT(*) FROM MenuItemTranslation WHERE locale='ru'"
    ).fetchone()[0]
    con.close()
    print(f"done featured={featured} ru_cats={ru_cats} ru_items={ru_items} added_ru={added_ru}")


if __name__ == "__main__":
    main()
