# MenuLayoutData.cs

## 概要
アバタールートにアタッチされる `MonoBehaviour` クラスです。`IEditorOnly` を実装しているためビルド後は NDMF によって自動除去されます。`MenuLayoutDataAsset`（ScriptableObject）への参照を持ち、`MenuManagerPlugin` がビルド時にこのコンポーネントを参照してメニューを並び替えます。

---

## ItemLayout クラス
メニュー内の各アイテムの配置情報を表現します。

```csharp
[Serializable]
public class ItemLayout {
    // マッチング優先順: SourceObjId → Key(GUID) → Type(合成キー) → DisplayName
    public string SourceObjId;       // GlobalObjectId（第1キー）。リネーム・移動後も不変
    public string Key;               // アイテムごとの GUID (PersistentId)（第2キー）
    public string Type;              // "Type:Name:Param:Value" 形式の合成キー（後方互換フォールバック）

    public string ParentPath = "";   // 所属する階層パス（"/" 区切り）
    public int Order;                // 同一階層内の並び順（0起点）
    public bool IsSubMenu;
    public string DisplayName;       // 表示名（最終フォールバック照合用）
    public Texture2D CustomIcon;     // カスタムアイコン

    // 特殊フラグ
    public bool IsAutoOverflow;      // 自動生成された超過フォルダ（More）か
    public bool IsDynamic;           // MAなどで動的に生成されるフォルダか
    public bool IsProxyPathSegment;  // MenuManagerItemProxy の親フォルダパス用仮想フォルダか
}
```

### IDキーとマッチング優先順
同一名・同一タイプのアイテムが複数存在する場合でも正しく追跡できるよう、4段階のキーを優先順に参照します。

| 優先順 | フィールド | 内容 |
|---|---|---|
| 1 | `SourceObjId` | `GlobalObjectId` ベース。アセットのリネームや移動後も変化しない最も信頼性の高いキー |
| 2 | `Key` | 各アイテムに発行される GUID（`PersistentId`）。保存時に自動生成 |
| 3 | `Type` | `Type:Name:Param:Value` 形式の合成キー。旧レイアウトデータとの後方互換用 |
| 4 | `DisplayName` | 上記すべてでマッチしない場合の最終フォールバック |

### 階層表現 (ParentPath)
各アイテムの `Key`（GUID）を `/` で連結したパス文字列で階層を表現します。例えば「ルート直下のサブメニューA（Key: `abc123`）の中にあるアイテム」の `ParentPath` は `abc123` になり、さらにその中のアイテムは `abc123/<子メニューのKey>` になります。ルート直下のアイテムは `ParentPath` が空文字列です。インベントリに退避したアイテムは `__INVENTORY__` で始まる特殊パスに保存されます。

---

## フィールド変数

```csharp
// レイアウトアセット参照
public MenuLayoutDataAsset BaseLayout;      // 全レイアウトを保持する基本アセット
public MenuLayoutDataAsset ExtendedLayout;  // BaseLayout との差分のみを保持（Pro版）

// Items プロパティ（読み取り専用）
// BaseLayout と ExtendedLayout を Key でマージした結果を返す
public List<ItemLayout> Items { get; }

// 最終保存日時（ExtendedLayout があればその日時を優先）
public string LastSavedAt { get; }

// 設定
public bool IsEnabled = true;               // メニュー並び替えの有効/無効
public bool RemoveEmptyFolders = false;     // 空フォルダを削除するか

// デバッグログ（有効化すると Console が非常に多くなる）
public bool EnableDebugLog = false;
public bool EnableDetailedDebugLog = false;

// 実行順序制御
public List<string> RunAfterPlugins;        // MenuManagerPlugin をここに列挙したプラグインの後に実行させるリスト（NDMF QualifiedName 形式）
```

`Items` は `BaseLayout` と `ExtendedLayout` の両 `MenuLayoutDataAsset` を `Key` フィールドで上書きマージして返す算出プロパティです。`ExtendedLayout` が null の場合は `BaseLayout` の内容をそのまま返します。
