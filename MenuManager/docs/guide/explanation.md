# 詳細

## アイテム名先頭アスタリスクについて

取得したアイテムの中には、名前の先頭にアスタリスクが着いている場合があります。<br>
`(例：*VirtualLens2, *LightLimitChangerなど)`<br>
これはそのアセットがスクリプトから自動的に生成されることを表します。

## フォルダ名下線のフォルダ名について

フォルダ名に下線がついている場合は自身が作成したフォルダであることを示します。
この場合、右クリックコンテキストやインベントリコンテキストから削除可能です。

## テキストカラーについて

名前の色は白・黄色・赤の三種類で表示されます

| 色 | 説明 |
|------|------|
| 白 | 通常のアイテム |
| <span style="color: green; ">緑</span>  | [`MenuManagerItemProxy`](/guide/components/MenuManagerItemProxy)によって追加されたプロキシメニュー |
| <span style="color: aqua; ">青</span> | 既にメニューデータがある状態で新規追加されたアイテム |
| <span style="color: orange; ">黄</span> | 中身が空のサブフォルダー |
| <span style="color: red; ">赤</span> | EditorOnlyになっているオブジェクトにアタッチされた`MA Menu Installer`または親のいずれかがEditorOnlyである。<br>この場合メニューに登録してもビルドされません。|

## MA / LI ラベルについて

`MA`または`LI`ラベルは、ソース元を示しています。
ModularAvatarによるものであれば青い`MA`ラベルが、<br>
lilycalInventoryによるものであれば紫の`LI`ラベルが付与されます。
なお、MAやLCIによって追加されるメニューでも、内部のメニューアイテムがVRC Expressions Menuで管理されている場合ラベルは付きません。

インベントリ内では簡略化されており、タイプラベル左側の縦棒の色で識別できます。