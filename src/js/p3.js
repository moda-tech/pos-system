console.log("JSファイルが読み込まれました！");

const product_name = document.getElementById("product_name");
const category = document.getElementById("category");
const product_price = document.getElementById("product_price");
const doBtn = document.getElementById("doBtn");

// 登録ボタンを押したときの処理
doBtn.addEventListener("click", async (e) => {
    e.preventDefault(); // フォームの自動送信を止める
    console.log("登録ボタンが押されました！");

    const name = product_name.value;
    const price = product_price.value;
    const cate = category.value;

    // 入力チェック
    if (name === "" || price === "") {
        alert("商品名と価格を入力してください");
        return;
    }

    try {
        // 🟢 サーバーにデータを送信
        const res = await fetch("http://localhost:3000/add-product", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, category: cate, price })
        });

        // 🟢 サーバーからの返答を受け取る
        const data = await res.text();
        console.log("サーバーからの返答:", data);

        // 🟢 入力欄をクリア
        product_name.value = "";
        category.value = "";
        product_price.value = "";

        // メッセージ表示
        alert("送信完了！入力欄をリセットしました。");

    } catch (err) {
        console.error("通信エラー:", err);
        alert("サーバーへの送信に失敗しました。");
    }
});
