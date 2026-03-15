# MenuLayoutDataEditor.cs

## 概要
`MenuLayoutData` コンポーネントの Unity インスペクター画面をカスタマイズするエディタスクリプトです。設定や統計情報をわかりやすく表示する役割を持ちます。

---

## インスペクターのセクション構成

インスペクターは以下のセクションで構成されています。

### Header
コンポーネント上部に常時表示されるセクションです。
- **Open Menu Manager** ボタン — クリックするとこのコンポーネントが属するアバターを対象に Menu Manager ウィンドウを開きます。
- **オンラインマニュアル / GitHub** リンクボタン — ブラウザでドキュメントサイトまたは GitHub を開きます。

### Settings（フォールドアウト）
- `BaseLayout` / `ExtendedLayout` アセットの参照フィールドと、新規作成ボタン。
- **Enable** トグル — メニュー並び替え処理の有効/無効。
- **Remove Empty Folders** トグル — ビルド時に空のサブメニューフォルダを自動削除するか。

### Advanced（フォールドアウト）
- `RunAfterPlugins` リスト — このアバター個別の NDMF 実行順序制御。

### Debug（フォールドアウト）
- **Enable Debug Log** / **Enable Detailed Debug Log** トグル。
- 有効化するとビルド時に大量のログが出力されます。通常は無効のままにしてください。
- `LastSavedAt`（最終保存日時）の表示。
