import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());


require("dotenv").config();

const db = await mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});


// -------------------------------
// 商品一覧取得（表示フラグ付き）
// -------------------------------
app.get("/products", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT product_id, product_name, category, price 
            FROM data_products
            WHERE is_active = 1
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "商品一覧取得エラー" });
    }
});

// -------------------------------
// 会計登録
// -------------------------------
app.post("/checkout", async (req, res) => {
    const { date, total, items } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ message: "商品がありません" });
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction(); // トランザクション開始

        // sales 登録
        const [saleResult] = await conn.query(
            `INSERT INTO sales (date, total) VALUES (?, ?)`,
            [date, total]
        );
        const sales_id = saleResult.insertId;

        // sales_items 登録
        for (const item of items) {
            await conn.query(
                `INSERT INTO sales_items (sales_id, product_id, quantity)
                 VALUES (?, ?, ?)`,
                [sales_id, item.product_id, item.quantity]
            );
        }

        await conn.commit(); // トランザクション終了
        res.json({ sales_id });
    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).json({ message: "会計登録エラー" });
    } finally {
        conn.release(); // データベース接続解除
    }
});

// -------------------------------
// 会計削除
// -------------------------------
app.post("/delete-last-sale", async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 直近の sales_id を取得
        const [[lastSale]] = await conn.query(
            `SELECT sales_id FROM sales ORDER BY sales_id DESC LIMIT 1`
        );
        if (!lastSale) {
            return res.status(400).json({ message: "削除する会計がありません" });
        }

        const sales_id = lastSale.sales_id;

        // sales_items 削除
        await conn.query(
            `DELETE FROM sales_items WHERE sales_id = ?`,
            [sales_id]
        );

        // sales 削除
        await conn.query(
            `DELETE FROM sales WHERE sales_id = ?`,
            [sales_id]
        );

        await conn.commit();
        res.json({ sales_id });
    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).json({ message: "削除処理エラー" });
    } finally {
        conn.release();
    }
});

// -------------------------------
// 商品登録
// -------------------------------
app.post("/add-product", async (req, res) => {
    try {
        const { name, category, price } = req.body;

        if (!name || !category || !price) {
            res.status(400).send("入力が不十分です");
            return;
        }

        if (isNaN(price)) {
            res.status(400).send("価格は数字で入力してください");
            return;
        }

        const sql = "INSERT INTO data_products (product_name, category, price) VALUES (?, ?, ?)";

        // プールをそのまま使う
        await db.execute(sql, [name, category, price]);

        res.send("登録完了");
    } catch (err) {
        console.error("サーバーエラー:", err);
        res.status(500).send("サーバーエラーです");
    }
});

// -------------------------------
// 売上リスト取得（直近10件）
// -------------------------------
app.get("/CheckList", async (req, res) => {
    try {
        // salesテーブルから直近10件を取得
        const [sales] = await db.query(`
            SELECT * FROM sales
            ORDER BY date DESC
            LIMIT 10
        `);

        // 各salesに紐づくitemsを取得
        const result = [];
        for (const s of sales) {
          const [items] = await db.query(
            `SELECT product_name
            FROM sales_items
            JOIN data_products USING (product_id)
            WHERE sales_id = ?`,
            [s.sales_id]
            );

            result.push({
                sales_id: s.sales_id,
                date: s.date,
                total: s.total,
                items: items
            });
        }

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "売上リスト取得エラー" });
    }
});

// -------------------------------
// 売上削除
// -------------------------------
app.post("/delete-sale", async (req, res) => {
    const { sales_id } = req.body;

    if (!sales_id) {
        return res.status(400).json({ message: "sales_id が必要です" });
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // sales_items削除
        await conn.query(`DELETE FROM sales_items WHERE sales_id = ?`, [sales_id]);

        // sales削除
        await conn.query(`DELETE FROM sales WHERE sales_id = ?`, [sales_id]);

        await conn.commit();
        res.json({ sales_id });
        
    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).json({ message: "売上削除エラー" });
    } finally {
        conn.release();
    }
});

// -------------------------------
// 商品のソフト削除（非表示化）
// -------------------------------
app.delete("/products/:id", async (req, res) => {
    try {
        const id = req.params.id;

        const [result] = await db.query(`
            UPDATE data_products 
            SET is_active = 0 
            WHERE product_id = ?
        `, [id]);

        res.json({ message: "商品を非表示にしました" });
    } catch (err) {
        console.error("DB削除エラー:", err);
        res.status(500).json({ message: "商品削除エラー" });
    }
});



// -------------------------------
// サーバー起動
// -------------------------------
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
