document.addEventListener("DOMContentLoaded", () => {

    const list = document.getElementById("list");

    // ---------------------------
    // 売上リストを読み込む
    // ---------------------------
    async function loadCheckList() {
        try {
            const res = await fetch("http://localhost:3000/CheckList");
            const data = await res.json();

            // 取得したデータを画面に追加
            data.forEach(p => {
                // ---------------------------
                // 商品名まとめ（3つ以上は「など」）
                // ---------------------------
                let names = p.items.map(i => i.product_name);

                if (names.length > 3) {
                    names = names.slice(0, 3).join("、") + " など";
                } else {
                    names = names.join("、");
                }

                // ---------------------------
                // 売上1件分の<tr>を作成
                // ---------------------------
                const row = document.createElement("tr");

                // 記録カラム
                const recordTd = document.createElement("td");
                recordTd.innerHTML = `
                    会計ID: ${p.sales_id}<br>
                    日時: ${p.date}<br>
                    合計: ${p.total}円<br>
                    商品: ${names}
                `;

                // 削除ボタンカラム
                const deleteTd = document.createElement("td");
                const delBtn = document.createElement("button");
                delBtn.textContent = "削除";
                delBtn.dataset.id = p.sales_id;
                delBtn.classList.add("deleteBtn"); //CSS用のクラス追加
                deleteTd.appendChild(delBtn);

                // rowに追加
                row.appendChild(recordTd);
                row.appendChild(deleteTd);

                // tableに追加
                list.appendChild(row);

                // ---------------------------
                // 削除ボタンのイベント
                // ---------------------------
                delBtn.addEventListener("click", async () => {
                    if (!confirm(`sales_id: ${p.sales_id} を削除しますか？`)) return;

                    try {
                        const res = await fetch("http://localhost:3000/delete-sale", {
                            method: "POST", // DELETEでもOK
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ sales_id: p.sales_id })
                        });

                        const result = await res.json();

                        if (res.ok) {
                            alert(`削除しました: sales_id = ${result.sales_id}`);
                            row.remove(); // 表示からも削除
                        } else {
                            alert("削除エラー：" + result.message);
                        }
                    } catch (err) {
                        console.error("削除エラー:", err);
                        alert("削除処理に失敗しました");
                    }
                });
            });

        } catch (err) {
            console.error("売上一覧の取得エラー:", err);
            alert("売上の取得に失敗しました");
        }
    }

    // ---------------------------
    // ページ読み込み時に実行
    // ---------------------------
    loadCheckList();

});
