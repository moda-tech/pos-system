document.addEventListener("DOMContentLoaded", () => {
    const tables = {
        "cate1": document.getElementById("cate1"),
        "cate2": document.getElementById("cate2"),
        "cate3": document.getElementById("cate3"),
        "cate4": document.getElementById("cate4"),
    };

    const selectedTable = document.getElementById("selected");
    const checkoutBtn = document.getElementById("checkoutBtn");
    const totalAmountSpan = document.getElementById("total-amount");

    let selectedItems = [];
    let totalAmount = 0;

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
                `;

                row.addEventListener("click", () => addItem(p));
                table.appendChild(row);
            });

            // 商品追加後にカスタムカテゴリ行の色分け
            colorCustomRows();

        } catch (err) {
            console.error("商品取得エラー:", err);
        }
    }

    // ------------------------------
    // カスタムカテゴリ行の色分け
    // ------------------------------
    function colorCustomRows() {
        const table = tables["cate1"];
        const rows = table.querySelectorAll("tr");
        // ヘッダー行を除く
        for (let i = 1; i < rows.length; i++) {
            if (i >= 1 && i <= 5) {
                rows[i].classList.add("group1");
            } else if (i >= 6 && i <= 13) {
                rows[i].classList.add("group2");
            } else {
                rows[i].classList.add("group3");
            }
        }
    }

    // ------------------------------
    // 選択商品追加
    // ------------------------------
    function addItem(product) {
        selectedItems.push(product);
        totalAmount += Number(product.price);
        renderSelected();
    }

    // ------------------------------
    // 選択商品描画
    // ------------------------------
    function renderSelected() {
        selectedTable.innerHTML = `<tr><th>商品名</th><th>削除</th></tr>`;
        selectedItems.forEach((item, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${item.product_name}(${item.price}円)</td>
                <td><button data-index="${index}">削除</button></td>
            `;
            row.querySelector("button").addEventListener("click", e => removeItem(e.target.dataset.index));
            selectedTable.appendChild(row);
        });
        totalAmountSpan.textContent = totalAmount;
    }

    // ------------------------------
    // 削除
    // ------------------------------
    function removeItem(index) {
        const item = selectedItems[index];
        totalAmount -= Number(item.price);
        selectedItems.splice(index, 1);
        renderSelected();
    }

    // ------------------------------
    // MySQL用日付フォーマット
    // ------------------------------
    function formatMySQLDate(date) {
        const d = new Date(date);
        return d.getFullYear() + "-" +
               String(d.getMonth() + 1).padStart(2, "0") + "-" +
               String(d.getDate()).padStart(2, "0") + " " +
               String(d.getHours()).padStart(2, "0") + ":" +
               String(d.getMinutes()).padStart(2, "0") + ":" +
               String(d.getSeconds()).padStart(2, "0");
    }

    // ------------------------------
    // 会計処理
    // ------------------------------
    checkoutBtn.addEventListener("click", async () => {
        if (selectedItems.length === 0) {
            alert("商品が選択されていません");
            return;
        }

        const payload = {
            date: formatMySQLDate(new Date()),
            total: totalAmount,
            items: selectedItems.map(i => ({ product_id: i.product_id, quantity: 1 }))
        };

        try {
            const res = await fetch("http://localhost:3000/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const result = await res.json();

            if (res.ok) {
                alert(`会計完了！ sales_id: ${result.sales_id}`);

                const checkoutData = {
                    sales_id: result.sales_id,
                    total: totalAmount,
                    items: selectedItems,
                    date: payload.date
                };
                localStorage.setItem("checkoutData", JSON.stringify(checkoutData));

                selectedItems = [];
                totalAmount = 0;
                renderSelected();

                window.location.href = "p2.html";

            } else {
                alert("会計エラー：" + result.message);
            }
        } catch (err) {
            console.error("会計エラー:", err);
            alert("会計エラーが発生しました");
        }
    });

    // 初期ロード
    loadProducts();
});
