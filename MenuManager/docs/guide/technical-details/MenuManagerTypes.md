# MenuManagerTypes.cs

## 概要
エディター内部で使用するデータ構造を定義するファイルです。ビルド成果物には含まれず、`MenuManager.cs` とその partial class 群が全面的にこれらの型を使用します。

---

## MenuNode

メニューの1階層を表すノードクラスです。

```csharp
[Serializable]
public class MenuNode {
    public string Name;
    public List<MenuEntry> Entries = new List<MenuEntry>();
}
```

`MenuManager.TreeBuilder.cs` が `VRCExpressionsMenu` および MA コンポーネントからツリーを構築する際に生成します。ルートノードを起点に `Entries` 内の `SubMenu` フィールドで子ノードへ再帰的につながります。

---

## MenuEntry

1つのメニュースロットが持つ全データを格納するクラスです。

```csharp
[Serializable]
public class MenuEntry {
    // ── 表示データ ──
    public string Name;
    public Texture2D Icon;
    public VRCExpressionsMenu.Control.ControlType Type;
    public string Parameter;
    public float Value;
    public VRCExpressionsMenu.Control.Label[] Labels;  // ラジアルのサブラベル
    [SerializeReference] public MenuNode SubMenu;      // サブメニューノード（SubMenu タイプ時）

    // ── ソース追跡 ──
    public VRCExpressionsMenu SourceAsset;             // 元の VRCExpressionsMenu アセット
    public int SourceIndex;                            // SourceAsset 内でのインデックス
    public ModularAvatarMenuInstaller SourceInstaller; // 由来の MA Menu Installer
    public ModularAvatarMenuItem SourceMenuItem;       // 由来の MA Menu Item
    public MenuManagerItemProxy SourceProxy;           // 由来の MenuManagerItemProxy
    public MenuBaseComponent SourceLilyCalItem;        // 由来の LilyCalInventory コンポーネント

    // ── 識別キー ──
    public string UniqueId;      // 現セッション内の一時 ID（フレーム間追跡用）
    public string PersistentId;  // 保存される GUID（ItemLayout.Key に対応）

    // ── 状態フラグ ──
    public bool IsDynamic;           // MAなどで動的に生成されるフォルダか
    public bool IsCustomFolder;      // ユーザーが手動で作成したフォルダか
    public bool IsEditorOnly;        // EditorOnly オブジェクト由来か（ビルド対象外）
    public bool IsBuildTime;         // ビルド時にのみ生成されるアイテムか（プロキシ由来など）
    public bool IsAutoOverflow;      // 自動生成された超過フォルダ（…More）か
    public bool IsNewEntry;          // 既存レイアウトに存在しない新規追加アイテムか
    public bool IsProxyPathSegment;  // MenuManagerItemProxy の parentFolderPath 用仮想フォルダか
}
```

### ソース追跡フィールドについて
各エントリがどのアセットやコンポーネントから生成されたかを保持します。これによりビルド時の `MenuManagerPlugin` がコントロールのマッチングを行う際の補助情報として機能します。

| フィールド | セットされるケース |
|---|---|
| `SourceAsset` / `SourceIndex` | `VRCExpressionsMenu` から直接読み込んだアイテム |
| `SourceInstaller` | `ModularAvatarMenuInstaller` 由来のアイテム |
| `SourceMenuItem` | `ModularAvatarMenuItem` 由来のアイテム |
| `SourceProxy` | `MenuManagerItemProxy` コンポーネント由来のアイテム |
| `SourceLilyCalItem` | `LilyCalInventory`（ItemToggler 等）由来のアイテム |

### 識別キーについて
`UniqueId` はセッション内でのみ有効な一時 ID です。`PersistentId` は保存時に生成される GUID で、`ItemLayout.Key` として永続化されます。

---

## BreadcrumbEntry

パンくずナビゲーション用のエントリです。

```csharp
[Serializable]
public class BreadcrumbEntry {
    [SerializeReference] public MenuNode Node;
    public string Name;
}
```

`MenuManager.cs` が現在の階層位置をスタックとして保持するために使用します。ユーザーがサブフォルダに潜ると `BreadcrumbEntry` がスタックにプッシュされ、戻る操作でポップされます。
