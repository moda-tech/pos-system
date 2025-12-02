document.addEventListener("DOMContentLoaded", () => {
    const data = localStorage.getItem("checkoutData");
    if(!data){
        alert(`ローカルストレージに情報がありません`);
        return;} 
    const checkout = JSON.parse(data);
    const lines = [];

    // 会計ID
    lines.push(`会計ID: ${checkout.sales_id}`);

    // 商品名一覧
    checkout.items.forEach(item => {
        lines.push(`商品名: ${item.product_name}`);
    });

    // 合計金額
    lines.push(`合計金額: ${checkout.total}円`);

    // テキストボックスに表示
    document.getElementById("lastCheck").innerHTML= lines.join("<br>");
});

document.getElementById("submitBtn").addEventListener("click",() => {
    localStorage.removeItem("checkoutData");
});

document.getElementById("deleteBtn").addEventListener("click", async () => {
    try {
        const res = await fetch("http://localhost:3000/delete-last-sale", {
            method: "POST" // DELETEでも良い
        });

        const result = await res.json();

        if (res.ok) {
            alert(`直近の会計を削除しました: sales_id = ${result.sales_id}`);
            // ローカルストレージも消す
            localStorage.removeItem("checkoutData");
        } else {
            alert("削除エラー：" + result.message);
        }
    } catch (err) {
        console.error("削除エラー:", err);
        alert("削除処理に失敗しました");
    }

    localStorage.removeItem("checkoutData");
});
