# MenuManagerPlugin.cs

## 概要
NDMFのフックプロセスとして動作し、ビルド時にエディター上で設定したメニュー構成を適用するスクリプトです。元のソースデータやMAの設定を破壊しません。

---

## 処理のフェーズ指定
`BuildPhase.Transforming` フェーズ、Modular Avatar の後に実行されます。

```csharp
[assembly: ExportsPlugin(typeof(Lyra.MenuManagerPlugin))]
public class MenuManagerPlugin : Plugin<MenuManagerPlugin> {
    protected override void Configure() {
        InPhase(BuildPhase.Transforming)
            .AfterPlugin("nadena.dev.modular-avatar")  // MA がメニュー生成を終えた後に実行
            .Run("Reorder Menus", ctx => {
                var avatarRoot = ctx.AvatarRootObject;
                var layoutData = avatarRoot.GetComponent<MenuLayoutData>();
                if (layoutData == null || !layoutData.IsEnabled) return;

                var descriptor = avatarRoot.GetComponent<VRCAvatarDescriptor>();

                // ① ビルド後のメニューツリーを走査し各コントロールに識別キーを付与（マッチング前処理）
                AssignControlKeys(descriptor.expressionsMenu, layoutData);

                // ② レイアウトデータに従ってメニューを並び替え
                ReorderMenu(descriptor.expressionsMenu, layoutData, "", new HashSet<VRCExpressionsMenu>());

                // ③ ビルド成果物からこのコンポーネント自身を除去（IEditorOnly でも自動除去されるが明示的に実行）
                Object.DestroyImmediate(layoutData);
            });
    }
}
```

---

## 実装詳細

### AssignControlKeys（マッチング前処理）
並び替え処理の前に `AssignControlKeys` を実行し、ビルド後のメニューツリーを走査して各コントロールに識別キーを付与します。これにより、後続の `ReorderMenu` が各コントロールを `ItemLayout` と正確に照合できるようになります。

### IDマッチング
MA が生成した `VRCExpressionsMenu` の各コントロールに対し、`ItemLayout` を以下の優先順でマッチングします。

| 優先順 | キー | 説明 |
|---|---|---|
| 1 | `SourceObjId` | `GlobalObjectId` ベース。最も信頼性が高い |
| 2 | `Key` | GUID（`PersistentId`） |
| 3 | `Type` | `Type:Name:Param:Value` 合成キー（後方互換） |
| 4 | `DisplayName` | 最終フォールバック |

### 超過フォルダの自動解体
独自レイアウトを適用するため、MA が生成した `…(More)` / `Next` などの自動超過フォルダをまず解体し、1次配列のフラットなリストに戻してから再配置を行います。

```csharp
private static void FlattenMoreMenus(VRCExpressionsMenu menu, HashSet<VRCExpressionsMenu> visited) {
    for (int i = menu.controls.Count - 1; i >= 0; i--) {
        var ctrl = menu.controls[i];
        if (ctrl.type == ControlType.SubMenu && ctrl.subMenu != null) {
            FlattenMoreMenus(ctrl.subMenu, visited);
            string n = ctrl.name ?? "";
            if (n == "Next" || n == "More" || n.EndsWith("More)")) {
                menu.controls.RemoveAt(i);
                if (ctrl.subMenu.controls != null)
                    menu.controls.InsertRange(i, ctrl.subMenu.controls);
            }
        }
    }
}
```

### ツリーの再構築とインベントリ処理
マッチしたコントロールをプールからピックアップし、`ParentPath` ごとの `Order` 順に再配置します。レイアウト情報に存在せず、かつインベントリ指定もされていないコントロール（新規追加など）はルートに戻します。これにより、未登録の新規アイテムが意図せず消去される事態を防いでいます。

### MenuManagerItemProxy の処理
`MenuManagerItemProxy` コンポーネントを持つアイテムはビルド時に `ExtractDeepProxyControls` で抽出され、`NavigateToMenuPath` によって `parentFolderPath` で指定されたフォルダ階層へ挿入されます。

### LilyCalInventory の処理
`LilyCalInventory` 由来のアイテムも同一のIDマッチングパイプラインで処理されます。

---

## 実行順序の制御

プラグインの実行順序は以下の方法で制御できます。

| 方法 | 設定場所 |
|---|---|
| プロジェクト共通の `.after` 指定 | `Tools > Lyra Menu Manager > Settings` ウィンドウ |
| コンポーネント個別の `.after` 指定 | `MenuLayoutData` コンポーネントの `RunAfterPlugins` フィールド |

いずれも NDMF プラグインの `QualifiedName`（例: `nadena.dev.modular-avatar`）を指定します。
