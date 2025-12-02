document.addEventListener("DOMContentLoaded", () => {
    const tables = {
        "cate1": document.getElementById("cate1"),
        "cate2": document.getElementById("cate2"),
        "cate3": document.getElementById("cate3"),
        "cate4": document.getElementById("cate4"),
    };

    // ------------------------------
    // カテゴリ切替
    // ------------------------------
    document.querySelectorAll("[data-target]").forEach(btn => {
        btn.addEventListener("click", () => {
            const target = btn.dataset.target;
            Object.values(tables).forEach(t => (t.style.display = "none"));
            if (tables[target]) tables[target].style.display = "table";
        });
    });

    // 初期状態：テーブル1表示
    Object.values(tables).forEach(t => (t.style.display = "none"));
    tables["cate1"].style.display = "table";

    // ------------------------------
    // 商品一覧取得
    // ------------------------------
    async function loadProducts() {
        try {
            const res = await fetch("http://localhost:3000/products");
            const data = await res.json();

            data.forEach(p => {
                const table = tables[p.category];
                if (!table) return;

                const row = document.createElement("tr");
                row.dataset.id = p.product_id;
                row.dataset.name = p.product_name;
                row.dataset.price = p.price;

                row.innerHTML = `
                    <td>${p.product_id}</td>
                    <td>${p.product_name}</td>
                    <td>${p.price}</td>
                    <td><button class="delete-btn">削除</button></td>
                `;

                // 削除ボタンイベント（DBも更新・確認ダイアログ付き）
                const deleteBtn = row.querySelector(".delete-btn");
                deleteBtn.addEventListener("click", async (e) => {
                e.stopPropagation();

                // 確認ダイアログ
                const ok = confirm(`${p.product_name} を削除しますか？`);
                if (!ok) return; // キャンセルなら何もしない

                const id = p.product_id;

                try {
                    const res = await fetch(`http://localhost:3000/products/${id}`, {
                        method: "DELETE",
                    });

                    if (res.ok) {
                        row.remove(); // DB削除成功したら行を消す
                    } else {
                        console.error("削除失敗:", await res.text());
                    }
                } catch (err) {
                    console.error("削除エラー:", err);
                }
            });


                table.appendChild(row);
            });
        } catch (err) {
            console.error("商品取得エラー:", err);
        }
    }

    // 初期ロード
    loadProducts();
});
