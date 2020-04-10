# Golden Sun - HTML5
A Golden Sun Engine built in HTML5 with Phaser.

[DEMO](https://tashiro-gyori.github.io/goldensun_html5/)

Feel free to help :)

## Tech stack
- [PhaserJS CE 2.15.0](http://phaser.io/)
- [TexturePacker 4.6.1](https://www.codeandweb.com/texturepacker)
- [PhysicsEditor 1.6.3](https://www.codeandweb.com/physicseditor)
- [Tiledmap Editor 1.1](https://www.mapeditor.org/) ([Tiledmap version problem fix](https://github.com/bjorn/tiled/issues/2058#issuecomment-458975579))

## Texture Packer configs
- Use *Phaser (JSONHash)* as *Data Format*.
- Check *Trim sprite names*.
- Check *Prepend folder names*.
- Folder organization to generate the sheet: `[sprite name (ex.: felix)]` -> `[action type (ex.: idle)]` -> `[direction (ex.: down)]` -> `[files: frame_index.ext (ex.: 03.png)]`.
- Move the action folder into the Texture Packer.
- The sheets are per action.
