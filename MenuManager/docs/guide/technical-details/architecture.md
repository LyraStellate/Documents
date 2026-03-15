# Architecture Overview

## 非破壊型ワークフロー
本ツールは非破壊アプローチを採用しています。設定ファイルはプレイモード開始時やVRChatへのビルド時に自動適用されるため、ユーザーがMAの設定を書き換えたり、手動でプレハブを解体・破壊して中身を手作業で並び替えるリスクや手間は一切ありません。

---

## 処理フロー

### データのパースと結合ツリーの生成フェーズ
ユーザーが `MenuManager` のウィンドウ（`MenuManager.cs`）を開いたとき、以下のステップでアバターの内部からメニュー構造を抽出します。

1. **VRCExpressionsMenu の展開**

`VRCAvatarDescriptor` にセットされている公式のルートメニューを起点に、再帰的に全てのサブメニューノードを展開します。

2. **Modular Avatar の仮想統合**

`GetComponentsInChildren<ModularAvatarMenuInstaller>(true)` によってアバター内に配置されているMAコンポーネントをすべて拾い上げます。

3. **パスの合成**

各インストーラーが持つ `installPath` プロパティ（例: `Props/Weapon/Sword`）を仮想のフォルダとしてメモリ上に合成し、元のメニューツリーにぶら下げます。

4. **追加コンポーネントの統合**

- `MenuManagerItemProxy` — ビルド時に外部スクリプトが動的生成する `MAMenuItem` をエディター上に仮エントリとして表示します。ビルド時はプロキシの `parentFolderPath` / `controlType` を元に対象フォルダへ挿入されます。
- `LilyCalInventory` — 対応コンポーネントを自動検出し、同様の仮想エントリとして統合します。

### レイアウトのシリアライズと保存
エディターでメニューの編集を行い、保存ボタンを押すと、画面上のMenuNodeツリー構造がフラットな `ItemLayout` リストへと変換されます。

- **保存先** — アバタールートの `MenuLayoutData` コンポーネントが参照する `MenuLayoutDataAsset`（ScriptableObject）に保存されます。`BaseLayout`（全レイアウト）と `ExtendedLayout`（Baseとの差分、Pro版）の2アセット構成です。
- **保存方式** — デリートインサート方式。対象アセットの `Items` を全削除後に最新データを再挿入することで、古い無効データの蓄積を防ぎます。
- **階層パス** — 各要素の所属を、`Key`（GUID）を `/` で連結したパス文字列で表現します（`ParentPath`）。ルート直下なら空文字列、1階層目のサブメニュー内なら `<親Key>` のみになります。
- **配置順序** — `Order` によってフォルダ内でのインデックスが振られます。
- **インベントリ** — インベントリに退避したアイテムは `ParentPath` が `__INVENTORY__` で始まる特殊領域に保存されます。
- **IDキー** — 各アイテムには以下の4段階のキーが付与され、マッチング時に優先順に参照されます。

| 優先順 | フィールド | 内容 |
|---|---|---|
| 1 | `SourceObjId` | 元オブジェクトの `GlobalObjectId`。リネーム・移動後も不変 |
| 2 | `Key` | アイテムごとの GUID（`PersistentId`） |
| 3 | `Type` | `Type:Name:Param:Value` 形式の合成キー（後方互換フォールバック） |
| 4 | `DisplayName` | 最終フォールバック |

### NDMFプラグインによるビルド時再構成
`MenuManagerPlugin.cs` は NDMFの `BuildPhase.Transforming` フェーズ、Modular Avatar の後に実行されます。

```csharp
InPhase(BuildPhase.Transforming)
    .AfterPlugin("nadena.dev.modular-avatar")
    .Run("Reorder Menus", ctx => { ... });
```

MAが生成した `VRCExpressionsMenu` から全コントロールをプールとして抽出し、上記IDキー優先順でマッチングを行い `Order` / `ParentPath` の定義通りに再配置します。`MenuManagerItemProxy` および `LilyCalInventory` 由来のアイテムも同一パイプラインで処理されます。

実行順序はSettingsウィンドウ（プロジェクト共通）または `MenuLayoutData.RunAfterPlugins`（コンポーネント個別）で追加制御できます。

### 超過メニューの自処理
VRChatの仕様上、1つの階層に定義できるアイテムの最大数は8つまでに制限されています。
本ツールのエディターではこれを自由に超えてアイテムを放り込むことができますが、保存した際やビルド時において、8つを超過したアイテムは自動的に `…(More)` 子フォルダへと押し出されます。保存時は More フォルダをフラットに解体した状態で保存し、ビルド時に再生成します。

---

## アーキテクチャ図解

```text
[ エディター (編集時) ]
1. VRC Avatar Descriptor
   ├── VRCExpressionsMenu
   ├── ModularAvatarMenuInstaller
   ├── MenuManagerItemProxy        ← プロキシ（ビルド時動的生成アイテム用）
   └── MenuLayoutData
           ├── BaseLayout  ──→ MenuLayoutDataAsset (ScriptableObject)
           └── ExtendedLayout ─→ MenuLayoutDataAsset (ScriptableObject) [Pro]
                                       └── ItemLayout [ SourceObjId, Key, Type, ParentPath, Order ... ]

       ↓ ↓ ↓ (ビルド実行 / プレイモード開始) ↓ ↓ ↓

[ NDMFビルドプロセス ]
2. Transforming Phase (Modular Avatar)
   MA がすべての MenuInstaller をマージし、1つの VRCExpressionsMenu を生成する。

3. Transforming Phase (MenuManagerPlugin, AfterMA)
   MenuManagerPlugin.cs が起動。
   MenuLayoutData を読み取り、VRCExpressionsMenu の Control を IDマッチングで特定。
   Order と ParentPath の定義通りに上限を維持してフォルダを再構築する。
   MenuManagerItemProxy / LilyCalInventory 由来アイテムも同パイプラインで処理。
```
