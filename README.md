# Qiita Fake Badge

Qiitaのいいね通知の数字を増やすChrome拡張（Manifest V3）。

## 使い方

1. `chrome://extensions` を開き、右上の「デベロッパーモード」をオンにする
2. 「パッケージ化されていない拡張機能を読み込む」でこのフォルダを選ぶ
3. ツールバーの拡張機能アイコンを押し、件数を入れて「赤丸を出す」
4. Qiitaのページを再読み込みする → ベルに赤丸が出る

## 仕組み

Qiitaが読む前のデータを書き換えているだけ。

- ページに埋め込まれた `#js-react-on-rails-context` の `currentUser.unreadNotificationsCount` に、偽の数を足す
- HTMLの解析が終わって `readyState` が `interactive` になった時点で書き換える。`defer` 付きのQiitaのバンドルは、その後に動くので間に合う
